import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, BriefcaseBusiness, UserRound } from "lucide-react";

import { createApplication } from "../services/applicationApi";
import { getCandidates } from "../services/candidateApi";
import { getJobs } from "../services/jobApi";

import type { Job } from "../types/job";

import "./ApplicationCreatePage.css";

interface CandidateOption {
  id: string;
  full_name: string;
  email: string;
}

interface ApplicationCreatePageProps {
  onBack: () => void;
  onCreated: () => void;
}

export default function ApplicationCreatePage({
  onBack,
  onCreated,
}: ApplicationCreatePageProps) {
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  const [candidateId, setCandidateId] = useState("");
  const [jobId, setJobId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        setLoading(true);
        setError("");

        const [candidateResults, jobResults] = await Promise.all([
          getCandidates("", 1, false),
          getJobs(0, 100, "Open"),
        ]);

        if (cancelled) return;

        setCandidates(
          candidateResults.map((candidate) => ({
            id: candidate.id,
            full_name: candidate.full_name,
            email: candidate.email,
          }))
        );

        setJobs(jobResults);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load candidates and jobs."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!candidateId || !jobId) {
      setError("Please select both a candidate and a job.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createApplication({
        candidate_id: candidateId,
        job_id: jobId,
      });

      onCreated();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create the application."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="application-create-page">
      <button
        type="button"
        className="application-create-back"
        onClick={onBack}
      >
        <ArrowLeft size={17} />
        Back to applications
      </button>

      <header className="application-create-header">
        <h1>New application</h1>
        <p>
          Connect an existing candidate to an open position and start
          tracking their hiring progress.
        </p>
      </header>

      <form
        className="application-create-card"
        onSubmit={handleSubmit}
      >
        <div className="application-create-card-heading">
          <h2>Application details</h2>
          <p>Choose the candidate and position for this application.</p>
        </div>

        {error && (
          <div className="application-create-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <p className="application-create-loading">
            Loading candidates and open jobs...
          </p>
        ) : (
          <>
            <div className="application-create-field">
              <label htmlFor="application-candidate">
                <UserRound size={16} />
                Candidate <span>*</span>
              </label>

              <select
                id="application-candidate"
                value={candidateId}
                onChange={(event) =>
                  setCandidateId(event.target.value)
                }
                required
                disabled={saving || candidates.length === 0}
              >
                <option value="">Select a candidate</option>

                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.full_name} — {candidate.email}
                  </option>
                ))}
              </select>

              {candidates.length === 0 && (
                <p className="application-create-help">
                  No active candidates found. Add a candidate first.
                </p>
              )}
            </div>

            <div className="application-create-field">
              <label htmlFor="application-job">
                <BriefcaseBusiness size={16} />
                Open position <span>*</span>
              </label>

              <select
                id="application-job"
                value={jobId}
                onChange={(event) => setJobId(event.target.value)}
                required
                disabled={saving || jobs.length === 0}
              >
                <option value="">Select an open job</option>

                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} — {job.department}
                  </option>
                ))}
              </select>

              {jobs.length === 0 && (
                <p className="application-create-help">
                  No open jobs found. Create or reopen a job first.
                </p>
              )}
            </div>

            <div className="application-create-info">
              The application will start at the <strong>Applied</strong>{" "}
              stage. You can update its progress later.
            </div>

            <div className="application-create-actions">
              <button
                type="button"
                className="application-create-cancel"
                onClick={onBack}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="application-create-submit"
                disabled={
                  saving ||
                  candidates.length === 0 ||
                  jobs.length === 0
                }
              >
                {saving ? "Creating..." : "Create application"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

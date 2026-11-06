import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Plus,
  RefreshCw,
} from "lucide-react";

import { getApplications } from "../services/applicationApi";
import { getCandidateById } from "../services/candidateApi";
import { getJobById } from "../services/jobApi";

import type {
  Application,
  ApplicationStatus,
} from "../types/application";

import "./ApplicationPage.css";

const PAGE_SIZE = 10;

type StageFilter = ApplicationStatus | "All";

interface ApplicationRow extends Application {
  candidateName: string;
  jobTitle: string;
}

interface ApplicationsPageProps {
  onCreateApplication: () => void;
  onViewApplication: (applicationId: string) => void;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ApplicationsPage({
  onCreateApplication,
  onViewApplication,
}: ApplicationsPageProps) {
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [stageFilter, setStageFilter] = useState<StageFilter>("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadApplications() {
      setLoading(true);
      setError("");

      try {
        const results = await getApplications(
          (page - 1) * PAGE_SIZE,
          PAGE_SIZE + 1,
          undefined,
          stageFilter === "All" ? undefined : stageFilter
        );

        const currentPage = results.slice(0, PAGE_SIZE);

        const candidateIds = [
          ...new Set(currentPage.map((item) => item.candidate_id)),
        ];

        const jobIds = [
          ...new Set(currentPage.map((item) => item.job_id)),
        ];

        const [candidateResults, jobResults] = await Promise.all([
          Promise.all(
            candidateIds.map(async (id) => {
              try {
                const candidate = await getCandidateById(id);
                return [id, candidate.full_name] as const;
              } catch {
                return [id, "Unknown candidate"] as const;
              }
            })
          ),
          Promise.all(
            jobIds.map(async (id) => {
              try {
                const job = await getJobById(id);
                return [id, job.title] as const;
              } catch {
                return [id, "Unknown job"] as const;
              }
            })
          ),
        ]);

        const candidateNames = new Map(candidateResults);
        const jobTitles = new Map(jobResults);

        const rows: ApplicationRow[] = currentPage.map((item) => ({
          ...item,
          candidateName:
            candidateNames.get(item.candidate_id) ?? "Unknown candidate",
          jobTitle: jobTitles.get(item.job_id) ?? "Unknown job",
        }));

        if (!cancelled) {
          setApplications(rows);
          setHasNextPage(results.length > PAGE_SIZE);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load applications."
          );
          setApplications([]);
          setHasNextPage(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadApplications();

    return () => {
      cancelled = true;
    };
  }, [page, stageFilter]);

  function changeStage(value: string) {
    setStageFilter(value as StageFilter);
    setPage(1);
  }

  return (
    <div className="applications-page">
      <header className="applications-header">
        <div>
          <h1>Applications</h1>
          <p>
            Keep track of candidates as they move through your hiring
            process.
          </p>
        </div>

        <button
          type="button"
          className="applications-primary-button"
          onClick={onCreateApplication}
        >
          <Plus size={18} />
          New application
        </button>
      </header>

      <section className="applications-panel">
        <div className="applications-toolbar">
          <div>
            <h2>Candidate pipeline</h2>
            <p>Review applications and their current hiring stages.</p>
          </div>

          <label className="applications-filter">
            <span>Hiring stage</span>
            <select
              value={stageFilter}
              onChange={(event) => changeStage(event.target.value)}
            >
              <option value="All">All stages</option>
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Hired">Hired</option>
              <option value="Rejected">Rejected</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="applications-state">
            <RefreshCw className="applications-spinner" size={22} />
            <p>Loading applications...</p>
          </div>
        ) : error ? (
          <div className="applications-state">
            <h3>Unable to load applications</h3>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setPage((value) => value)}
              disabled
            >
              Check your backend connection
            </button>
          </div>
        ) : applications.length === 0 ? (
          <div className="applications-state">
            <BriefcaseBusiness size={34} strokeWidth={1.5} />
            <h3>
              {stageFilter === "All"
                ? "No applications yet"
                : `No ${stageFilter.toLowerCase()} applications`}
            </h3>
            <p>
              {stageFilter === "All"
                ? "Start by assigning a candidate to an open job."
                : "Try selecting another hiring stage."}
            </p>

            {stageFilter === "All" && (
              <button
                type="button"
                className="applications-primary-button"
                onClick={onCreateApplication}
              >
                <Plus size={17} />
                New application
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="applications-table-wrapper">
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Job</th>
                    <th>Stage</th>
                    <th>Applied on</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id}>
                      <td className="applications-name">
                        {application.candidateName}
                      </td>

                      <td>{application.jobTitle}</td>

                      <td>
                        <span
                          className={`applications-stage applications-stage-${application.status.toLowerCase()}`}
                        >
                          {application.status}
                        </span>
                      </td>

                      <td>{formatDate(application.applied_at)}</td>

                      <td>
                        <button
                          type="button"
                          className="applications-view-button"
                          onClick={() =>
                            onViewApplication(application.id)
                          }
                        >
                          View details
                          <ArrowRight size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="applications-pagination">
              <span>Page {page}</span>

              <div>
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  <ArrowLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={!hasNextPage}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                  <ArrowRight size={16} />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}

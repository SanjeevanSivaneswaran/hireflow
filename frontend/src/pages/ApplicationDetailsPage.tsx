
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  UserRound,
} from "lucide-react";

import {
  getApplicationById,
  updateApplicationStatus,
} from "../services/applicationApi";
import { getCandidateById } from "../services/candidateApi";
import { getJobById } from "../services/jobApi";

import type {
  Application,
  ApplicationStatus,
} from "../types/application";
import { APPLICATION_STATUSES } from "../types/application";
import type { Job } from "../types/job";

import ApplicationNotes from "../components/ApplicationNotes";
import ApplicationActivityHistory from "../components/ApplicationActivityHistory";

import "./ApplicationDetailsPage.css";

interface CandidateInfo {
  full_name: string;
  email: string;
}

interface ApplicationDetailsPageProps {
  applicationId: string;
  onBack: () => void;
}

const PIPELINE_STAGES: ApplicationStatus[] = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Hired",
];

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ApplicationDetailsPage({
  applicationId,
  onBack,
}: ApplicationDetailsPageProps) {
  const [application, setApplication] = useState<Application | null>(null);
  const [candidate, setCandidate] = useState<CandidateInfo | null>(null);
  const [job, setJob] = useState<Job | null>(null);

  const [selectedStatus, setSelectedStatus] =
    useState<ApplicationStatus>("Applied");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadApplication() {
      setLoading(true);
      setError("");

      try {
        const applicationData = await getApplicationById(applicationId);

        const [candidateResult, jobResult] = await Promise.all([
          getCandidateById(applicationData.candidate_id),
          getJobById(applicationData.job_id),
        ]);

        if (cancelled) return;

        setApplication(applicationData);
        setCandidate({
          full_name: candidateResult.full_name,
          email: candidateResult.email,
        });
        setJob(jobResult);
        setSelectedStatus(applicationData.status);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load application details."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadApplication();

    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  async function handleStatusUpdate() {
    if (!application || selectedStatus === application.status) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const updatedApplication = await updateApplicationStatus(
        application.id,
        selectedStatus
      );

      setApplication(updatedApplication);
      setSelectedStatus(updatedApplication.status);
      setSuccessMessage("Hiring stage updated successfully.");
      setActivityRefreshKey((previous) => previous + 1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update the hiring stage."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="application-details-page">
        <p className="application-details-loading">
          Loading application details...
        </p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="application-details-page">
        <button
          type="button"
          className="application-details-back"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          Back to applications
        </button>

        <div className="application-details-card">
          <h2>Application unavailable</h2>
          <p>{error || "This application could not be found."}</p>
        </div>
      </div>
    );
  }

  const currentStageIndex = PIPELINE_STAGES.indexOf(application.status);

  return (
    <div className="application-details-page">
      <button
        type="button"
        className="application-details-back"
        onClick={onBack}
      >
        <ArrowLeft size={17} />
        Back to applications
      </button>

      <header className="application-details-header">
        <div>
          <h1>Application details</h1>
          <p>Review the application and manage hiring progress.</p>
        </div>

        <span
          className={`application-details-status application-details-status-${application.status.toLowerCase()}`}
        >
          {application.status}
        </span>
      </header>

      {error && (
        <div className="application-details-error" role="alert">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="application-details-success" role="status">
          <CheckCircle2 size={17} />
          {successMessage}
        </div>
      )}

      <section className="application-details-card">
        <div className="application-details-card-heading">
          <UserRound size={19} />
          <h2>Candidate information</h2>
        </div>

        <div className="application-details-info-grid">
          <div>
            <span>Full name</span>
            <strong>{candidate?.full_name ?? "Unavailable"}</strong>
          </div>

          <div>
            <span>Email address</span>
            <p>
              <Mail size={15} />
              {candidate?.email ?? "Unavailable"}
            </p>
          </div>
        </div>
      </section>

      <section className="application-details-card">
        <div className="application-details-card-heading">
          <BriefcaseBusiness size={19} />
          <h2>Job information</h2>
        </div>

        <div className="application-details-info-grid">
          <div>
            <span>Position</span>
            <strong>{job?.title ?? "Unavailable"}</strong>
          </div>

          <div>
            <span>Department</span>
            <strong>{job?.department ?? "Unavailable"}</strong>
          </div>

          <div>
            <span>Location</span>
            <p>
              <MapPin size={15} />
              {job?.location ?? "Unavailable"}
            </p>
          </div>

          <div>
            <span>Applied on</span>
            <p>
              <CalendarDays size={15} />
              {formatDate(application.applied_at)}
            </p>
          </div>
        </div>
      </section>

      <section className="application-details-card">
        <div className="application-details-card-heading">
          <Clock3 size={19} />
          <h2>Hiring pipeline</h2>
        </div>

        <p className="application-details-description">
          Track this candidate's progress through the recruitment
          process.
        </p>

        <div className="application-details-pipeline">
          {PIPELINE_STAGES.map((stage, index) => (
            <div
              key={stage}
              className={`application-details-pipeline-step ${
                application.status !== "Rejected" &&
                index <= currentStageIndex
                  ? "is-complete"
                  : ""
              }`}
            >
              <div className="application-details-pipeline-bar" />
              <span>{stage}</span>
            </div>
          ))}
        </div>

        {application.status === "Rejected" && (
          <p className="application-details-rejected">
            This application is currently marked as rejected.
          </p>
        )}

        <div className="application-details-update">
          <label htmlFor="application-status">
            Update hiring stage
          </label>

          <div className="application-details-update-row">
            <select
              id="application-status"
              value={selectedStatus}
              onChange={(event) => {
                setSelectedStatus(
                  event.target.value as ApplicationStatus
                );
                setSuccessMessage("");
              }}
              disabled={saving}
            >
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="application-details-save"
              onClick={handleStatusUpdate}
              disabled={
                saving || selectedStatus === application.status
              }
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>

          <p>
            Changes are saved to the application record immediately
            after confirmation.
          </p>
        </div>
      </section>

      {/* Recruiter Notes */}
      <ApplicationNotes applicationId={application.id} />

      {/* Application Activity History */}
      <ApplicationActivityHistory
        applicationId={application.id}
        refreshKey={activityRefreshKey}
      />
      
    </div>
  );
}

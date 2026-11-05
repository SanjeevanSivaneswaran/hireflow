
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  LockKeyhole,
  MapPin,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import {
  closeJob,
  deleteJob,
  getJobById,
  updateJob,
} from "../services/jobApi";

import type { Job, JobUpdate } from "../types/job";
import "./JobDetailsPage.css";

interface Props {
  jobId: string;
  onBack: () => void;
  onDeleted: () => void;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function JobDetailsPage({
  jobId,
  onBack,
  onDeleted,
}: Props) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<JobUpdate>({});

  useEffect(() => {
    let active = true;

    async function loadJob() {
      setLoading(true);
      setError("");

      try {
        const result = await getJobById(jobId);

        if (active) {
          setJob(result);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load job details."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadJob();

    return () => {
      active = false;
    };
  }, [jobId]);

  function startEditing() {
    if (!job) return;

    setForm({
      title: job.title,
      department: job.department,
      location: job.location,
      employment_type: job.employment_type,
      description: job.description ?? "",
    });

    setError("");
    setIsEditing(true);
  }

  function updateField<K extends keyof JobUpdate>(
    field: K,
    value: JobUpdate[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!job || saving) return;

    const payload: JobUpdate = {
      title: form.title?.trim(),
      department: form.department?.trim(),
      location: form.location?.trim(),
      employment_type: form.employment_type?.trim(),
      description: form.description?.trim() || null,
    };

    if (
      !payload.title ||
      payload.title.length < 2 ||
      !payload.department ||
      payload.department.length < 2 ||
      !payload.location ||
      payload.location.length < 2 ||
      !payload.employment_type ||
      payload.employment_type.length < 2
    ) {
      setError("Please complete all required fields.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updatedJob = await updateJob(job.id, payload);
      setJob(updatedJob);
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save job changes."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleClose() {
    if (!job || saving) return;

    const confirmed = window.confirm(
      `Close "${job.title}"? This position will no longer be marked as open.`
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      const updatedJob = await closeJob(job.id);
      setJob(updatedJob);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to close this job."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!job || saving) return;

    const confirmed = window.confirm(
      `Permanently delete "${job.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");

    try {
      await deleteJob(job.id);
      onDeleted();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete this job."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="job-details-page">
        <p className="job-details-muted">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="job-details-page">
        <button className="job-details-back" onClick={onBack}>
          <ArrowLeft size={17} />
          Back to jobs
        </button>
        <p role="alert">{error || "Job not found."}</p>
      </div>
    );
  }

  return (
    <div className="job-details-page">
      <button className="job-details-back" onClick={onBack}>
        <ArrowLeft size={17} />
        Back to jobs
      </button>

      <div className="job-details-header">
        <div>
          <p className="eyebrow">JOB MANAGEMENT</p>
          <h1>{job.title}</h1>
          <span
            className={
              job.status === "Open"
                ? "job-details-status open"
                : "job-details-status closed"
            }
          >
            {job.status}
          </span>
        </div>

        <div className="job-details-actions">
          {!isEditing && (
            <button
              className="job-details-edit"
              onClick={startEditing}
              disabled={saving}
            >
              <Pencil size={16} />
              Edit job
            </button>
          )}

          {job.status === "Open" && !isEditing && (
            <button
              className="job-details-secondary"
              onClick={handleClose}
              disabled={saving}
            >
              <LockKeyhole size={16} />
              Close job
            </button>
          )}

          {!isEditing && (
            <button
              className="job-details-danger"
              onClick={handleDelete}
              disabled={saving}
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="job-details-error" role="alert">
          {error}
        </div>
      )}

      {isEditing ? (
        <form className="job-details-card" onSubmit={handleSave}>
          <div className="job-details-edit-heading">
            <h2>Edit job details</h2>
            <button
              type="button"
              className="job-details-icon-button"
              onClick={() => {
                setIsEditing(false);
                setError("");
              }}
              disabled={saving}
              aria-label="Cancel editing"
            >
              <X size={18} />
            </button>
          </div>

          <div className="job-details-form-grid">
            <label>
              Job title
              <input
                value={form.title ?? ""}
                onChange={(event) =>
                  updateField("title", event.target.value)
                }
                minLength={2}
                maxLength={150}
                required
                disabled={saving}
              />
            </label>

            <label>
              Department
              <input
                value={form.department ?? ""}
                onChange={(event) =>
                  updateField("department", event.target.value)
                }
                minLength={2}
                maxLength={100}
                required
                disabled={saving}
              />
            </label>

            <label>
              Location
              <input
                value={form.location ?? ""}
                onChange={(event) =>
                  updateField("location", event.target.value)
                }
                minLength={2}
                maxLength={150}
                required
                disabled={saving}
              />
            </label>

            <label>
              Employment type
              <select
                value={form.employment_type ?? ""}
                onChange={(event) =>
                  updateField("employment_type", event.target.value)
                }
                required
                disabled={saving}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Temporary">Temporary</option>
              </select>
            </label>
          </div>

          <label className="job-details-description-label">
            Job description
            <textarea
              rows={8}
              value={form.description ?? ""}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              disabled={saving}
            />
          </label>

          <div className="job-details-form-actions">
            <button
              type="button"
              className="job-details-secondary"
              onClick={() => {
                setIsEditing(false);
                setError("");
              }}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="job-details-edit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <section className="job-details-card">
            <h2>Position information</h2>

            <div className="job-details-info-grid">
              <div>
                <span>Department</span>
                <p>
                  <BriefcaseBusiness size={17} />
                  {job.department}
                </p>
              </div>

              <div>
                <span>Location</span>
                <p>
                  <MapPin size={17} />
                  {job.location}
                </p>
              </div>

              <div>
                <span>Employment type</span>
                <p>{job.employment_type}</p>
              </div>

              <div>
                <span>Created on</span>
                <p>
                  <CalendarDays size={17} />
                  {formatDate(job.created_at)}
                </p>
              </div>
            </div>
          </section>

          <section className="job-details-card">
            <h2>Job description</h2>
            <p className="job-details-description">
              {job.description?.trim() ||
                "No job description has been added yet."}
            </p>
          </section>
        </>
      )}
    </div>
  );
}

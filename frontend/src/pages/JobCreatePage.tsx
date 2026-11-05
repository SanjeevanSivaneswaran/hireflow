
import { useState, type FormEvent } from "react";
import { ArrowLeft, BriefcaseBusiness, Save } from "lucide-react";
import { createJob } from "../services/jobApi";
import type { JobCreate } from "../types/job";
import "./JobCreatePage.css";

interface Props {
  onBack: () => void;
  onCreated: () => void;
}

const initialForm: JobCreate = {
  title: "",
  department: "",
  location: "",
  employment_type: "",
  description: "",
};

export default function JobCreatePage({ onBack, onCreated }: Props) {
  const [form, setForm] = useState<JobCreate>({ ...initialForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField<K extends keyof JobCreate>(
    field: K,
    value: JobCreate[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: JobCreate = {
      title: form.title.trim(),
      department: form.department.trim(),
      location: form.location.trim(),
      employment_type: form.employment_type.trim(),
      description: form.description?.trim() || null,
    };

    if (
      payload.title.length < 2 ||
      payload.department.length < 2 ||
      payload.location.length < 2 ||
      payload.employment_type.length < 2
    ) {
      setError("Please complete all required fields.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await createJob(payload);
      onCreated();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create job. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="job-create-page">
      <button className="job-create-back" onClick={onBack}>
        <ArrowLeft size={17} />
        Back to jobs
      </button>

      <div className="job-create-heading">
        <div className="job-create-heading-icon">
          <BriefcaseBusiness size={22} />
        </div>

        <div>
          <p className="eyebrow">JOB MANAGEMENT</p>
          <h1>Create a job opening</h1>
          <p>Add the details for the position you're hiring for.</p>
        </div>
      </div>

      <form className="job-create-form" onSubmit={handleSubmit}>
        <div className="job-create-section">
          <h2>Position details</h2>
          <p>Provide the basic information about this role.</p>

          <div className="job-create-grid">
            <label>
              Job title <span>*</span>
              <input
                type="text"
                placeholder="e.g. Software Engineer"
                value={form.title}
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
              Department <span>*</span>
              <input
                type="text"
                placeholder="e.g. Engineering"
                value={form.department}
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
              Location <span>*</span>
              <input
                type="text"
                placeholder="e.g. Colombo, Sri Lanka"
                value={form.location}
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
              Employment type <span>*</span>
              <select
                value={form.employment_type}
                onChange={(event) =>
                  updateField("employment_type", event.target.value)
                }
                required
                disabled={saving}
              >
                <option value="">Select employment type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Temporary">Temporary</option>
              </select>
            </label>
          </div>
        </div>

        <div className="job-create-section">
          <h2>Job description</h2>
          <p>Describe the responsibilities and requirements of this role.</p>

          <label>
            Description <span className="job-create-optional">(Optional)</span>
            <textarea
              rows={8}
              placeholder="Describe the role, responsibilities, required skills and qualifications..."
              value={form.description ?? ""}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              disabled={saving}
            />
          </label>
        </div>

        {error && (
          <div className="job-create-error" role="alert">
            {error}
          </div>
        )}

        <div className="job-create-actions">
          <button
            type="button"
            className="job-create-cancel"
            onClick={onBack}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="job-create-submit"
            disabled={saving}
          >
            <Save size={16} />
            {saving ? "Creating job..." : "Create job"}
          </button>
        </div>
      </form>
    </div>
  );
}

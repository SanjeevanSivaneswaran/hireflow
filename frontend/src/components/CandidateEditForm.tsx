import { useState } from "react";
import { Save, X } from "lucide-react";

import {
  updateCandidate,
  type CandidateProfile,
  type UpdateCandidatePayload,
} from "../services/candidateApi";

import "./CandidateEditForm.css";

interface Props {
  candidate: CandidateProfile;
  onSaved: (candidate: CandidateProfile) => void;
  onCancel: () => void;
}

export default function CandidateEditForm({
  candidate,
  onSaved,
  onCancel,
}: Props) {
  const [form, setForm] = useState({
    full_name: candidate.full_name,
    email: candidate.email ?? "",
    phone: candidate.phone ?? "",
    location: candidate.location ?? "",
    professional_summary: candidate.professional_summary ?? "",
    experience_years: String(candidate.experience_years),
    skills: candidate.skills.join(", "),
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: keyof typeof form, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.full_name.trim();
    const years = Number(form.experience_years);

    if (name.length < 2) {
      setError("Please enter a name with at least 2 characters.");
      return;
    }

    if (
      form.experience_years.trim() === "" ||
      !Number.isFinite(years) ||
      years < 0 ||
      years > 999.9
    ) {
      setError("Enter valid experience between 0 and 999.9 years.");
      return;
    }

    const payload: UpdateCandidatePayload = {
      full_name: name,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      location: form.location.trim() || null,
      professional_summary: form.professional_summary.trim() || null,
      experience_years: years,
      skills: [
        ...new Set(
          form.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean)
        ),
      ],
    };

    setSaving(true);
    setError("");

    try {
      const updatedCandidate = await updateCandidate(candidate.id, payload);
      onSaved(updatedCandidate);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save candidate details."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="candidate-edit-form" onSubmit={handleSubmit}>
      <div className="candidate-edit-heading">
        <div>
          <h2>Edit candidate details</h2>
          <p>Update the information below and save your changes.</p>
        </div>

        <button
          type="button"
          className="candidate-edit-cancel"
          onClick={onCancel}
          disabled={saving}
        >
          <X size={16} />
          Cancel
        </button>
      </div>

      {error && (
        <p className="candidate-edit-error" role="alert">
          {error}
        </p>
      )}

      <div className="candidate-edit-grid">
        <label>
          Full name *
          <input
            required
            minLength={2}
            maxLength={150}
            value={form.full_name}
            onChange={(event) =>
              updateField("full_name", event.target.value)
            }
          />
        </label>

        <label>
          Email address
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              updateField("email", event.target.value)
            }
          />
        </label>

        <label>
          Phone number
          <input
            maxLength={30}
            value={form.phone}
            onChange={(event) =>
              updateField("phone", event.target.value)
            }
          />
        </label>

        <label>
          Location
          <input
            value={form.location}
            onChange={(event) =>
              updateField("location", event.target.value)
            }
          />
        </label>

        <label>
          Years of experience
          <input
            type="number"
            min="0"
            max="999.9"
            step="0.1"
            required
            value={form.experience_years}
            onChange={(event) =>
              updateField("experience_years", event.target.value)
            }
          />
        </label>

        <label className="candidate-edit-wide">
          Skills
          <input
            value={form.skills}
            placeholder="Python, React, SQL"
            onChange={(event) =>
              updateField("skills", event.target.value)
            }
          />
          <small>Separate skills with commas.</small>
        </label>

        <label className="candidate-edit-wide">
          Professional summary
          <textarea
            rows={5}
            value={form.professional_summary}
            onChange={(event) =>
              updateField("professional_summary", event.target.value)
            }
            placeholder="Write a short professional summary..."
          />
        </label>
      </div>

      <div className="candidate-edit-footer">
        <button
          type="button"
          className="candidate-edit-cancel"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="candidate-edit-save"
          disabled={saving}
        >
          <Save size={16} />
          {saving ? "Saving changes..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
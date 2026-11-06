import { useEffect, useState, type FormEvent } from "react";
import { CalendarDays, NotebookPen } from "lucide-react";

import {
  createApplicationNote,
  getApplicationNotes,
} from "../services/noteApi";

import type { Note } from "../types/note";

import "./ApplicationNotes.css";

interface ApplicationNotesProps {
  applicationId: string;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ApplicationNotes({
  applicationId,
}: ApplicationNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadNotes() {
      setLoading(true);
      setError("");

      try {
        const data = await getApplicationNotes(applicationId);

        if (!cancelled) {
          setNotes(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load notes."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadNotes();

    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  async function handleAddNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent || saving) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const newNote = await createApplicationNote(applicationId, {
        content: trimmedContent,
      });

      setNotes((previous) => [newNote, ...previous]);
      setContent("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save note."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="application-notes-card">
      <div className="application-notes-heading">
        <NotebookPen size={19} />
        <h2>Recruiter notes</h2>
      </div>

      <p className="application-notes-description">
        Keep feedback, observations, and interview preparation
        notes together.
      </p>

      <form
        className="application-notes-form"
        onSubmit={handleAddNote}
      >
        <label htmlFor="recruiter-note">
          Add a note
        </label>

        <textarea
          id="recruiter-note"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write your feedback about this candidate..."
          rows={4}
          maxLength={5000}
          disabled={saving}
        />

        <div className="application-notes-form-footer">
          <span>{content.length}/5000 characters</span>

          <button
            type="submit"
            disabled={!content.trim() || saving}
          >
            {saving ? "Saving..." : "Add note"}
          </button>
        </div>
      </form>

      {error && (
        <div className="application-notes-error" role="alert">
          {error}
        </div>
      )}

      <div className="application-notes-list">
        <h3>Previous notes ({notes.length})</h3>

        {loading ? (
          <p className="application-notes-empty">
            Loading notes...
          </p>
        ) : notes.length === 0 ? (
          <p className="application-notes-empty">
            No notes yet. Add the first note to keep track of
            recruiter feedback.
          </p>
        ) : (
          notes.map((note) => (
            <article
              key={note.id}
              className="application-notes-item"
            >
              <p>{note.content}</p>

              <div className="application-notes-date">
                <CalendarDays size={14} />
                {formatDate(note.created_at)}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

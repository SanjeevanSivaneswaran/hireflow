import { useEffect, useState } from "react";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Plus,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";

import {
  archiveCandidate,
  getCandidates,
  restoreCandidate,
  type CandidateSummary,
} from "../services/candidateApi";

import "./CandidatesPage.css";

interface Props {
  onAddCandidate: () => void;
  onViewCandidate: (candidateId: string) => void;
}

const PAGE_SIZE = 10;

export default function CandidatesPage({
  onAddCandidate,
  onViewCandidate,
}: Props) {
  const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;

    async function loadCandidates() {
      setLoading(true);
      setError("");

      try {
        const result = await getCandidates(
          search,
          page,
          includeArchived
        );

        if (active) {
          setCandidates(result);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load candidates."
          );
          setCandidates([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadCandidates();

    return () => {
      active = false;
    };
  }, [search, page, includeArchived, refreshKey]);

  async function handleArchive(candidate: CandidateSummary) {
    const confirmed = window.confirm(
      `Archive ${candidate.full_name}? You can restore this candidate later.`
    );

    if (!confirmed) return;

    setUpdatingId(candidate.id);
    setError("");

    try {
      await archiveCandidate(candidate.id);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not archive candidate."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRestore(candidate: CandidateSummary) {
    setUpdatingId(candidate.id);
    setError("");

    try {
      await restoreCandidate(candidate.id);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not restore candidate."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const canGoNext = candidates.length === PAGE_SIZE;

  return (
    <div className="directory-page">
      <div className="directory-header">
        <div>
          <p className="eyebrow">YOUR TALENT POOL</p>
          <h1>Candidates</h1>
          <p>Find, review, and manage people in your recruitment workspace.</p>
        </div>

        <button className="directory-primary" onClick={onAddCandidate}>
          <Plus size={17} />
          Add candidate
        </button>
      </div>

      <div className="directory-panel">
        <div className="directory-toolbar">
          <label className="directory-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search by name, email, or skill"
              aria-label="Search candidates"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>

          <label className="directory-filter">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(event) => {
                setIncludeArchived(event.target.checked);
                setPage(1);
              }}
            />
            Include archived
          </label>
        </div>

        {error && (
          <div className="directory-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="directory-state">
            <p>Loading candidates...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="directory-state">
            <Users size={36} strokeWidth={1.5} />
            <h2>
              {search
                ? "No matching candidates"
                : "No candidates to show"}
            </h2>
            <p>
              {search
                ? "Try searching with a different name, email, or skill."
                : "Upload a resume to add your first candidate."}
            </p>
            {!search && (
              <button
                className="directory-primary"
                onClick={onAddCandidate}
              >
                <Plus size={16} />
                Add candidate
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="directory-table-wrap">
              <table className="directory-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Skills</th>
                    <th>Experience</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr key={candidate.id}>
                      <td>
                        <button
                          className="directory-name"
                          onClick={() => onViewCandidate(candidate.id)}
                        >
                          {candidate.full_name}
                        </button>
                        <span className="directory-email">
                          {candidate.email || "No email provided"}
                        </span>
                      </td>
                      <td>
                        <div className="directory-skills">
                          {candidate.skills.slice(0, 2).map((skill) => (
                            <span key={skill}>{skill}</span>
                          ))}
                          {candidate.skills.length > 2 && (
                            <span>+{candidate.skills.length - 2}</span>
                          )}
                          {candidate.skills.length === 0 && (
                            <span className="directory-muted">Not added</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {Number(candidate.experience_years).toFixed(1)} years
                      </td>
                      <td>
                        <span
                          className={
                            candidate.is_archived
                              ? "directory-status archived"
                              : "directory-status active"
                          }
                        >
                          {candidate.is_archived ? "Archived" : "Active"}
                        </span>
                      </td>
                      <td>
                        <div className="directory-actions">
                          <button
                            onClick={() => onViewCandidate(candidate.id)}
                          >
                            View
                          </button>
                          {candidate.is_archived ? (
                            <button
                              disabled={updatingId === candidate.id}
                              onClick={() => handleRestore(candidate)}
                              title="Restore candidate"
                            >
                              <RotateCcw size={15} />
                              Restore
                            </button>
                          ) : (
                            <button
                              disabled={updatingId === candidate.id}
                              onClick={() => handleArchive(candidate)}
                              title="Archive candidate"
                            >
                              <Archive size={15} />
                              Archive
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="directory-pagination">
              <span>Page {page}</span>
              <div>
                <button
                  disabled={page === 1 || loading}
                  onClick={() => setPage((value) => value - 1)}
                >
                  <ArrowLeft size={16} />
                  Previous
                </button>
                <button
                  disabled={!canGoNext || loading}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
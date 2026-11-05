import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Plus,
  Search,
} from "lucide-react";

import { getJobs } from "../services/jobApi";
import type { Job } from "../types/job";
import "./JobsPage.css";

interface Props {
  onCreateJob: () => void;
  onViewJob: (jobId: string) => void;
}

type JobStatusFilter = "All" | "Open" | "Closed";

const PAGE_SIZE = 10;

export default function JobsPage({
  onCreateJob,
  onViewJob,
}: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<JobStatusFilter>("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadJobs() {
      setLoading(true);
      setError("");

      try {
        const result = await getJobs(
          (page - 1) * PAGE_SIZE,
          PAGE_SIZE,
          statusFilter === "All" ? undefined : statusFilter
        );

        if (active) {
          setJobs(result);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load job openings."
          );
          setJobs([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadJobs();

    return () => {
      active = false;
    };
  }, [page, statusFilter]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return jobs;

    return jobs.filter((job) =>
      [job.title, job.department, job.location].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [jobs, search]);

  function handleStatusChange(value: JobStatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  return (
    <div className="jobs-page">
      <div className="jobs-header">
        <div>
          <p className="eyebrow">RECRUITMENT POSITIONS</p>
          <h1>Job openings</h1>
          <p>
            Create, view and manage the positions your team is
            hiring for.
          </p>
        </div>

        <button
          className="jobs-primary"
          onClick={onCreateJob}
        >
          <Plus size={17} />
          Create job
        </button>
      </div>

      <div className="jobs-panel">
        <div className="jobs-toolbar">
          <label className="jobs-search">
            <Search size={18} />

            <input
              type="search"
              aria-label="Search job openings"
              placeholder="Search title, department or location"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <select
            aria-label="Filter jobs by status"
            value={statusFilter}
            onChange={(event) =>
              handleStatusChange(
                event.target.value as JobStatusFilter
              )
            }
          >
            <option value="All">All statuses</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {error && (
          <div className="jobs-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="jobs-empty">
            <p>Loading job openings...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="jobs-empty">
            <BriefcaseBusiness
              size={38}
              strokeWidth={1.5}
            />

            <h2>
              {search.trim()
                ? "No matching jobs"
                : page > 1
                  ? "No more jobs"
                  : "No job openings found"}
            </h2>

            <p>
              {search.trim()
                ? "Try another title, department or location."
                : page > 1
                  ? "Go back to the previous page."
                  : statusFilter !== "All"
                    ? "Try selecting a different status."
                    : "Create your first job opening to get started."}
            </p>

            {!search.trim() &&
              statusFilter === "All" &&
              page === 1 && (
                <button
                  className="jobs-primary"
                  onClick={onCreateJob}
                >
                  <Plus size={16} />
                  Create job
                </button>
              )}

            {page > 1 && (
              <button
                className="jobs-view"
                onClick={() => setPage((value) => value - 1)}
              >
                Previous page
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="jobs-table-wrap">
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>Job title</th>
                    <th>Department</th>
                    <th>Location</th>
                    <th>Employment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <button
                          className="jobs-name"
                          onClick={() => onViewJob(job.id)}
                        >
                          {job.title}
                        </button>
                      </td>

                      <td>{job.department}</td>
                      <td>{job.location}</td>
                      <td>{job.employment_type}</td>

                      <td>
                        <span
                          className={
                            job.status === "Open"
                              ? "jobs-status open"
                              : "jobs-status closed"
                          }
                        >
                          {job.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="jobs-view"
                          onClick={() => onViewJob(job.id)}
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="jobs-pagination">
              <span>Page {page}</span>

              <div>
                <button
                  disabled={page === 1 || loading}
                  onClick={() =>
                    setPage((value) => value - 1)
                  }
                >
                  <ArrowLeft size={15} />
                  Previous
                </button>

                <button
                  disabled={
                    jobs.length < PAGE_SIZE || loading
                  }
                  onClick={() =>
                    setPage((value) => value + 1)
                  }
                >
                  Next
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
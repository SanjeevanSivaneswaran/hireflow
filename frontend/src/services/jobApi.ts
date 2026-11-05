import type { Job, JobCreate, JobUpdate } from "../types/job";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function readResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data?.detail;

    if (typeof detail === "string") {
      throw new Error(detail);
    }

    if (response.status === 422) {
      throw new Error("Please check the job details and try again.");
    }

    throw new Error("Something went wrong. Please try again.");
  }

  return data as T;
}

// Get jobs
export async function getJobs(
  skip = 0,
  limit = 10,
  jobStatus?: "Open" | "Closed"
): Promise<Job[]> {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });

  if (jobStatus) {
    params.set("job_status", jobStatus);
  }

  const response = await fetch(
    `${API_URL}/api/jobs?${params.toString()}`
  );

  return readResponse<Job[]>(response);
}

// Get one job
export async function getJobById(jobId: string): Promise<Job> {
  const response = await fetch(`${API_URL}/api/jobs/${jobId}`);

  return readResponse<Job>(response);
}

// Create a job
export async function createJob(jobData: JobCreate): Promise<Job> {
  const response = await fetch(`${API_URL}/api/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jobData),
  });

  return readResponse<Job>(response);
}

// Update a job
export async function updateJob(
  jobId: string,
  jobData: JobUpdate
): Promise<Job> {
  const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jobData),
  });

  return readResponse<Job>(response);
}

// Close a job
export async function closeJob(jobId: string): Promise<Job> {
  const response = await fetch(`${API_URL}/api/jobs/${jobId}/close`, {
    method: "PATCH",
  });

  return readResponse<Job>(response);
}

// Delete a job
export async function deleteJob(jobId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    await readResponse<unknown>(response);
  }
}
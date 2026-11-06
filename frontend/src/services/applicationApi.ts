import type {
  Application,
  ApplicationActivity,
  ApplicationCreate,
  ApplicationStatus,
  ApplicationStatusUpdate,
} from "../types/application";

const API_URL =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function readResponse<T>(response: Response): Promise<T> {
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (
      data &&
      typeof data === "object" &&
      "detail" in data &&
      typeof data.detail === "string"
    ) {
      throw new Error(data.detail);
    }

    if (response.status === 422) {
      throw new Error(
        "Please check the application details and try again."
      );
    }

    throw new Error(
      `Request failed (${response.status}). Please try again.`
    );
  }

  return data as T;
}

// Get applications with optional filters
export async function getApplications(
  skip = 0,
  limit = 10,
  jobId?: string,
  applicationStatus?: ApplicationStatus
): Promise<Application[]> {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });

  if (jobId) {
    params.set("job_id", jobId);
  }

  if (applicationStatus) {
    params.set("application_status", applicationStatus);
  }

  const response = await fetch(
    `${API_URL}/api/applications?${params.toString()}`
  );

  return readResponse<Application[]>(response);
}

// Get a single application
export async function getApplicationById(
  applicationId: string
): Promise<Application> {
  const response = await fetch(
    `${API_URL}/api/applications/${applicationId}`
  );

  return readResponse<Application>(response);
}

// Create a new application
export async function createApplication(
  applicationData: ApplicationCreate
): Promise<Application> {
  const response = await fetch(`${API_URL}/api/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(applicationData),
  });

  return readResponse<Application>(response);
}

// Update an application's hiring stage
export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus
): Promise<Application> {
  const payload: ApplicationStatusUpdate = {
    status: newStatus,
  };

  const response = await fetch(
    `${API_URL}/api/applications/${applicationId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  return readResponse<Application>(response);
}


export async function getApplicationActivities(
  applicationId: string
): Promise<ApplicationActivity[]> {
  const response = await fetch(
    `${API_URL}/api/applications/${applicationId}/activities`
  );

  return readResponse<ApplicationActivity[]>(response);
}


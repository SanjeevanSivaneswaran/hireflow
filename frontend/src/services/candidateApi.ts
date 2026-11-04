import type {
  CandidateDraft,
  CandidateProject,
  Education,
  WorkExperience, 
  ParsedResume,
  SaveCandidatePayload,
} from "../types/candidate";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

async function readResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data?.detail;

    if (typeof detail === "string") {
      throw new Error(detail);
    }

    if (response.status === 409) {
      throw new Error("A candidate with this email already exists.");
    }

    if (response.status === 422) {
      throw new Error("Some details are invalid. Please review the form.");
    }

    throw new Error("Something went wrong. Please try again.");
  }

  return data as T;
}

export async function parseResume(file: File): Promise<ParsedResume> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/resumes/parse`, {
    method: "POST",
    body: formData,
  });

  return readResponse<ParsedResume>(response);
}

export async function saveCandidate(
  candidate: SaveCandidatePayload
): Promise<{ id: string; full_name: string }> {
  const response = await fetch(`${API_URL}/api/candidates/from-resume`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(candidate),
  });

  return readResponse(response);
}

export interface CandidateSummary {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  professional_summary: string | null;
  experience_years: number;
  skills: string[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CandidateProfile extends CandidateSummary {
  education: Education[];
  work_experience: WorkExperience[];
  projects: (CandidateProject & {
    id: string;
  })[];
  resume_filename: string | null;
}

export async function getCandidates(
  search = "",
  page = 1,
  includeArchived = false
): Promise<CandidateSummary[]> {
  const pageSize = 10;

  const params = new URLSearchParams({
    skip: String((page - 1) * pageSize),
    limit: String(pageSize),
    include_archived: String(includeArchived),
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  const response = await fetch(
    `${API_URL}/api/candidates?${params.toString()}`
  );

  return readResponse<CandidateSummary[]>(response);
}

export async function getCandidateById(
  candidateId: string
): Promise<CandidateProfile> {
  const response = await fetch(
    `${API_URL}/api/candidates/${candidateId}`
  );

  return readResponse<CandidateProfile>(response);
}

export async function archiveCandidate(
  candidateId: string
): Promise<{ message: string; candidate_id: string }> {
  const response = await fetch(
    `${API_URL}/api/candidates/${candidateId}/archive`,
    {
      method: "PATCH",
    }
  );

  return readResponse(response);
}

export async function restoreCandidate(
  candidateId: string
): Promise<{ message: string; candidate_id: string }> {
  const response = await fetch(
    `${API_URL}/api/candidates/${candidateId}/restore`,
    {
      method: "PATCH",
    }
  );

  return readResponse(response);
}

export interface UpdateCandidatePayload {
  full_name?: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  professional_summary?: string | null;
  experience_years?: number;
  skills?: string[];
}

export async function updateCandidate(
  candidateId: string,
  candidateData: UpdateCandidatePayload
): Promise<CandidateProfile> {
  const response = await fetch(
    `${API_URL}/api/candidates/${candidateId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(candidateData),
    }
  );

  return readResponse<CandidateProfile>(response);
}
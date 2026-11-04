import type {
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
import type { Note, NoteCreate } from "../types/note";

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

    throw new Error(
      `Request failed (${response.status}). Please try again.`
    );
  }

  return data as T;
}

export async function getApplicationNotes(
  applicationId: string
): Promise<Note[]> {
  const response = await fetch(
    `${API_URL}/api/applications/${applicationId}/notes`
  );

  return readResponse<Note[]>(response);
}

export async function createApplicationNote(
  applicationId: string,
  noteData: NoteCreate
): Promise<Note> {
  const response = await fetch(
    `${API_URL}/api/applications/${applicationId}/notes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(noteData),
    }
  );

  return readResponse<Note>(response);
}

export interface Note {
  id: string;
  application_id: string;
  content: string;
  created_at: string;
}

export interface NoteCreate {
  content: string;
}

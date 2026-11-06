export type ApplicationStatus =
  | "Applied"
  | "Screening"
  | "Interview"
  | "Offer"
  | "Hired"
  | "Rejected";

export interface Application {
  id: string;
  candidate_id: string;
  job_id: string;
  status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
}

export interface ApplicationCreate {
  candidate_id: string;
  job_id: string;
}

export interface ApplicationStatusUpdate {
  status: ApplicationStatus;
}

export interface ApplicationActivity {
  id: string;
  application_id: string;
  activity_type: string;
  old_status: string | null;
  new_status: string | null;
  description: string | null;
  created_at: string;
}

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
];

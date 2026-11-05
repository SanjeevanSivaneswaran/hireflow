export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string | null;
  status: "Open" | "Closed";
  created_at: string;
  updated_at: string;
}

export interface JobCreate {
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description?: string | null;
}

export interface JobUpdate {
  title?: string;
  department?: string;
  location?: string;
  employment_type?: string;
  description?: string | null;
  status?: "Open" | "Closed";
}
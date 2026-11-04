export interface Education {
  institution: string | null;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface WorkExperience {
  company: string | null;
  position: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
}

export interface CandidateProject {
  project_title: string;
  description: string | null;
  role: string | null;
  technologies: string[];
  start_date: string | null;
  end_date: string | null;
}

export interface CandidateDraft {
  full_name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  professional_summary: string | null;
  experience_years: number;
  skills: string[];
  education: Education[];
  work_experience: WorkExperience[];
  projects: CandidateProject[];
}

export interface ParsedResume {
  filename: string;
  storage_path: string;
  extracted_data: CandidateDraft;
}

export interface SaveCandidatePayload extends CandidateDraft {
  resume_filename: string;
  resume_storage_path: string;
}
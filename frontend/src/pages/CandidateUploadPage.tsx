import { useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  FileText,
  LoaderCircle,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { parseResume, saveCandidate } from "../services/candidateApi";
import type {
  CandidateDraft,
  CandidateProject,
  Education,
  ParsedResume,
  WorkExperience,
} from "../types/candidate";

import "./CandidateUploadPage.css";

type Step = "upload" | "review" | "saved";

const emptyEducation = (): Education => ({
  institution: "",
  degree: "",
  field_of_study: "",
  start_date: "",
  end_date: "",
});

const emptyWork = (): WorkExperience => ({
  company: "",
  position: "",
  start_date: "",
  end_date: "",
  description: "",
});

const emptyProject = (): CandidateProject => ({
  project_title: "",
  description: "",
  role: "",
  technologies: [],
  start_date: null,
  end_date: null,
});

const optional = (value: string | null | undefined) =>
  value?.trim() || null;

const validDate = (value: string | null | undefined) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;

const listFrom = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

function normalizeCandidate(data: CandidateDraft): CandidateDraft {
  return {
    full_name: data.full_name ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    location: data.location ?? "",
    professional_summary: data.professional_summary ?? "",
    experience_years: Number(data.experience_years) || 0,
    skills: listFrom(data.skills),
    education: Array.isArray(data.education) ? data.education : [],
    work_experience: Array.isArray(data.work_experience)
      ? data.work_experience
      : [],
    projects: Array.isArray(data.projects)
      ? data.projects.map((project) => ({
          ...project,
          technologies: listFrom(project.technologies),
          start_date: validDate(project.start_date),
          end_date: validDate(project.end_date),
        }))
      : [],
  };
}

interface Props {
  onBack: () => void;
}

export default function CandidateUploadPage({ onBack }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [draft, setDraft] = useState<CandidateDraft | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [projectTechInputs, setProjectTechInputs] = useState<
    Record<number, string>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedName, setSavedName] = useState("");

  function chooseFile(file?: File) {
    setError("");

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF resume.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("The resume must be smaller than 5 MB.");
      return;
    }

    setSelectedFile(file);
  }

  async function handleParse() {
    if (!selectedFile) return;

    setLoading(true);
    setError("");

    try {
      const result = await parseResume(selectedFile);
      setParsed(result);
      setDraft(normalizeCandidate(result.extracted_data));
      setStep("review");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not read the resume."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateDraft<K extends keyof CandidateDraft>(
    key: K,
    value: CandidateDraft[K]
  ) {
    setDraft((current) =>
      current ? { ...current, [key]: value } : current
    );
  }

  function updateArrayItem<
    K extends "education" | "work_experience" | "projects"
  >(
    key: K,
    index: number,
    changes: Partial<CandidateDraft[K][number]>
  ) {
    setDraft((current) => {
      if (!current) return current;

      const items = [...current[key]];
      items[index] = { ...items[index], ...changes };

      return { ...current, [key]: items };
    });
  }

  function removeArrayItem(
    key: "education" | "work_experience" | "projects",
    index: number
  ) {
    setDraft((current) =>
      current
        ? {
            ...current,
            [key]: current[key].filter((_, i) => i !== index),
          }
        : current
    );
  }

  function addSkill() {
    const value = skillInput.trim();
    if (!draft || !value) return;

    if (!draft.skills.some((skill) => skill.toLowerCase() === value.toLowerCase())) {
      updateDraft("skills", [...draft.skills, value]);
    }

    setSkillInput("");
  }

  function addTechnology(index: number) {
    if (!draft) return;

    const value = (projectTechInputs[index] ?? "").trim();
    if (!value) return;

    const project = draft.projects[index];

    if (!project.technologies.some(
      (tech) => tech.toLowerCase() === value.toLowerCase()
    )) {
      updateArrayItem("projects", index, {
        technologies: [...project.technologies, value],
      });
    }

    setProjectTechInputs((current) => ({ ...current, [index]: "" }));
  }

  async function handleSave() {
    if (!draft || !parsed) return;

    if (!draft.full_name.trim()) {
      setError("Please enter the candidate's full name.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (draft.projects.some((project) => !project.project_title.trim())) {
      setError("Please give every project a title, or remove empty projects.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    setError("");

    try {
      await saveCandidate({
        ...draft,
        full_name: draft.full_name.trim(),
        email: optional(draft.email),
        phone: optional(draft.phone),
        location: optional(draft.location),
        professional_summary: optional(draft.professional_summary),
        education: draft.education.map((item) => ({
          ...item,
          institution: optional(item.institution),
          degree: optional(item.degree),
          field_of_study: optional(item.field_of_study),
          start_date: optional(item.start_date),
          end_date: optional(item.end_date),
        })),
       work_experience: draft.work_experience.map((item) => ({
          ...item,
          company: optional(item.company),
          position: optional(item.position),
          description: optional(item.description),
          start_date: optional(item.start_date),
          end_date: optional(item.end_date),
        })),
        projects: draft.projects.map((project) => ({
          ...project,
          project_title: project.project_title.trim(),
          description: optional(project.description),
          role: optional(project.role),
          start_date: validDate(project.start_date),
          end_date: validDate(project.end_date),
        })),
        resume_filename: parsed.filename,
        resume_storage_path: parsed.storage_path,
      });

      setSavedName(draft.full_name);
      setStep("saved");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save candidate."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  }

  function startAgain() {
    setStep("upload");
    setSelectedFile(null);
    setParsed(null);
    setDraft(null);
    setError("");
    setSkillInput("");
    setProjectTechInputs({});
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <div className="candidate-workspace">
      <button className="text-back" onClick={onBack}>
        <ArrowLeft size={17} />
        Back to overview
      </button>

      <div className="candidate-page-heading">
        <p className="eyebrow">CANDIDATES</p>
        <h1>
          {step === "upload"
            ? "Add a candidate"
            : step === "review"
              ? "Review candidate details"
              : "Candidate saved"}
        </h1>
        <p>
          {step === "upload"
            ? "Start with a resume. We'll organize the details for you."
            : step === "review"
              ? "Check the information below and make any changes before saving."
              : "The candidate is now part of your recruitment workspace."}
        </p>
      </div>

      <div className="step-indicator" aria-label="Candidate creation progress">
        <span className={step === "upload" ? "current" : "completed"}>
          1. Upload
        </span>
        <span className={step === "review" ? "current" : step === "saved" ? "completed" : ""}>
          2. Review
        </span>
        <span className={step === "saved" ? "current" : ""}>
          3. Saved
        </span>
      </div>

      {error && (
        <div className="candidate-error" role="alert">
          {error}
        </div>
      )}

      {step === "upload" && (
        <section className="candidate-section upload-section">
          <div className="upload-illustration">
            <UploadCloud size={32} strokeWidth={1.6} />
          </div>

          <h2>Upload a resume</h2>
          <p>Choose a PDF file to fill in the candidate details.</p>

          <input
            ref={fileInput}
            type="file"
            accept=".pdf,application/pdf"
            className="visually-hidden"
            id="resume-file"
            onChange={(event) => chooseFile(event.target.files?.[0])}
          />

          <button
            className="secondary-action"
            onClick={() => fileInput.current?.click()}
          >
            Choose PDF file
          </button>

          <p className="field-hint">PDF only · Maximum file size 5 MB</p>

          {selectedFile && (
            <div className="selected-file">
              <FileText size={20} />
              <span>{selectedFile.name}</span>
              <button
                aria-label="Remove selected file"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInput.current) fileInput.current.value = "";
                }}
              >
                <X size={17} />
              </button>
            </div>
          )}

          <button
            className="primary-button upload-submit"
            disabled={!selectedFile || loading}
            onClick={handleParse}
          >
            {loading ? (
              <>
                <LoaderCircle className="spin" size={17} />
                Reading resume...
              </>
            ) : (
              "Continue to review"
            )}
          </button>
        </section>
      )}

      {step === "review" && draft && (
        <>
          <div className="review-file-banner">
            <FileText size={20} />
            <div>
              <strong>{parsed?.filename}</strong>
              <span>Information extracted from this resume</span>
            </div>
            <button onClick={startAgain}>Change file</button>
          </div>

          <section className="candidate-section">
            <SectionHeading
              number="01"
              title="Personal information"
              description="How can your team identify and contact this candidate?"
            />

            <div className="candidate-form-grid">
              <Field
                label="Full name"
                required
                value={draft.full_name}
                onChange={(value) => updateDraft("full_name", value)}
              />
              <Field
                label="Email address"
                type="email"
                value={draft.email ?? ""}
                onChange={(value) => updateDraft("email", value)}
              />
              <Field
                label="Phone number"
                value={draft.phone ?? ""}
                onChange={(value) => updateDraft("phone", value)}
              />
              <Field
                label="Location"
                value={draft.location ?? ""}
                onChange={(value) => updateDraft("location", value)}
              />
              <Field
                label="Years of experience"
                type="number"
                value={String(draft.experience_years)}
                onChange={(value) =>
                  updateDraft("experience_years", Number(value) || 0)
                }
              />
            </div>

            <div className="form-field field-spaced">
              <label htmlFor="candidate-summary">Professional summary</label>
              <textarea
                id="candidate-summary"
                rows={4}
                value={draft.professional_summary ?? ""}
                onChange={(event) =>
                  updateDraft("professional_summary", event.target.value)
                }
                placeholder="A short overview of the candidate's background"
              />
            </div>
          </section>

          <section className="candidate-section">
            <SectionHeading
              number="02"
              title="Skills"
              description="Add or remove skills to match the resume."
            />

            <div className="tag-list">
              {draft.skills.map((skill, index) => (
                <span className="skill-tag" key={`${skill}-${index}`}>
                  {skill}
                  <button
                    aria-label={`Remove ${skill}`}
                    onClick={() =>
                      updateDraft(
                        "skills",
                        draft.skills.filter((_, i) => i !== index)
                      )
                    }
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>

            <div className="inline-add">
              <input
                aria-label="New skill"
                placeholder="e.g. Python"
                value={skillInput}
                onChange={(event) => setSkillInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSkill();
                  }
                }}
              />
              <button onClick={addSkill}>
                <Plus size={17} /> Add skill
              </button>
            </div>
          </section>

          <section className="candidate-section">
            <SectionHeading
              number="03"
              title="Education"
              description="Check qualifications and educational institutions."
            />

            {draft.education.map((item, index) => (
              <div className="repeat-card" key={index}>
                <RepeatHeader
                  title={`Education ${index + 1}`}
                  onRemove={() => removeArrayItem("education", index)}
                />
                <div className="candidate-form-grid">
                  <Field
                    label="Institution"
                    value={item.institution ?? ""}
                    onChange={(value) =>
                      updateArrayItem("education", index, { institution: value })
                    }
                  />
                  <Field
                    label="Degree or qualification"
                    value={item.degree ?? ""}
                    onChange={(value) =>
                      updateArrayItem("education", index, { degree: value })
                    }
                  />
                  <Field
                    label="Field of study"
                    value={item.field_of_study ?? ""}
                    onChange={(value) =>
                      updateArrayItem("education", index, {
                        field_of_study: value,
                      })
                    }
                  />
                  <Field
                    label="Start date"
                    placeholder="e.g. 2020"
                    value={item.start_date ?? ""}
                    onChange={(value) =>
                      updateArrayItem("education", index, { start_date: value })
                    }
                  />
                  <Field
                    label="End date"
                    placeholder="e.g. 2024"
                    value={item.end_date ?? ""}
                    onChange={(value) =>
                      updateArrayItem("education", index, { end_date: value })
                    }
                  />
                </div>
              </div>
            ))}

            <button
              className="add-row-button"
              onClick={() =>
                updateDraft("education", [...draft.education, emptyEducation()])
              }
            >
              <Plus size={17} /> Add education
            </button>
          </section>

          <section className="candidate-section">
            <SectionHeading
              number="04"
              title="Work experience"
              description="Review previous roles and employment history."
            />

            {draft.work_experience.map((item, index) => (
              <div className="repeat-card" key={index}>
                <RepeatHeader
                  title={`Experience ${index + 1}`}
                  onRemove={() => removeArrayItem("work_experience", index)}
                />

                <div className="candidate-form-grid">
                  <Field
                    label="Company"
                    value={item.company ?? ""}
                    onChange={(value) =>
                      updateArrayItem("work_experience", index, {
                        company: value,
                      })
                    }
                  />
                  <Field
                    label="Job title"
                    value={item.position ?? ""}
                    onChange={(value) =>
                      updateArrayItem("work_experience", index, {
                        position: value,
                      })
                    }
                  />
                  <Field
                    label="Start date"
                    placeholder="e.g. Jan 2023"
                    value={item.start_date ?? ""}
                    onChange={(value) =>
                      updateArrayItem("work_experience", index, {
                        start_date: value,
                      })
                    }
                  />
                  <Field
                    label="End date"
                    placeholder="e.g. Present"
                    value={item.end_date ?? ""}
                    onChange={(value) =>
                      updateArrayItem("work_experience", index, {
                        end_date: value,
                      })
                    }
                  />
                </div>

                <div className="form-field field-spaced">
                  <label htmlFor={`work-description-${index}`}>
                    Responsibilities and achievements
                  </label>
                  <textarea
                    id={`work-description-${index}`}
                    rows={3}
                    value={item.description ?? ""}
                    onChange={(event) =>
                      updateArrayItem("work_experience", index, {
                        description: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
            ))}

            <button
              className="add-row-button"
              onClick={() =>
                updateDraft("work_experience", [
                  ...draft.work_experience,
                  emptyWork(),
                ])
              }
            >
              <Plus size={17} /> Add work experience
            </button>
          </section>

          <section className="candidate-section">
            <SectionHeading
              number="05"
              title="Projects"
              description="Include relevant academic, personal, or professional projects."
            />

            {draft.projects.map((project, index) => (
              <div className="repeat-card" key={index}>
                <RepeatHeader
                  title={`Project ${index + 1}`}
                  onRemove={() => removeArrayItem("projects", index)}
                />

                <div className="candidate-form-grid">
                  <Field
                    label="Project title"
                    required
                    value={project.project_title ?? ""}
                    onChange={(value) =>
                      updateArrayItem("projects", index, {
                        project_title: value,
                      })
                    }
                  />
                  <Field
                    label="Your role"
                    value={project.role ?? ""}
                    onChange={(value) =>
                      updateArrayItem("projects", index, { role: value })
                    }
                  />
                  <Field
                    label="Start date"
                    type="date"
                    value={project.start_date ?? ""}
                    onChange={(value) =>
                      updateArrayItem("projects", index, {
                        start_date: value || null,
                      })
                    }
                  />
                  <Field
                    label="End date"
                    type="date"
                    value={project.end_date ?? ""}
                    onChange={(value) =>
                      updateArrayItem("projects", index, {
                        end_date: value || null,
                      })
                    }
                  />
                </div>

                <div className="form-field field-spaced">
                  <label htmlFor={`project-description-${index}`}>
                    Project description
                  </label>
                  <textarea
                    id={`project-description-${index}`}
                    rows={3}
                    value={project.description ?? ""}
                    onChange={(event) =>
                      updateArrayItem("projects", index, {
                        description: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-field field-spaced">
                  <label>Technologies used</label>
                  <div className="tag-list">
                    {project.technologies.map((tech, techIndex) => (
                      <span className="skill-tag" key={`${tech}-${techIndex}`}>
                        {tech}
                        <button
                          aria-label={`Remove ${tech}`}
                          onClick={() =>
                            updateArrayItem("projects", index, {
                              technologies: project.technologies.filter(
                                (_, i) => i !== techIndex
                              ),
                            })
                          }
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="inline-add">
                    <input
                      aria-label={`Technology for project ${index + 1}`}
                      placeholder="e.g. React"
                      value={projectTechInputs[index] ?? ""}
                      onChange={(event) =>
                        setProjectTechInputs((current) => ({
                          ...current,
                          [index]: event.target.value,
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addTechnology(index);
                        }
                      }}
                    />
                    <button onClick={() => addTechnology(index)}>
                      <Plus size={17} /> Add
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              className="add-row-button"
              onClick={() =>
                updateDraft("projects", [...draft.projects, emptyProject()])
              }
            >
              <Plus size={17} /> Add project
            </button>
          </section>

          <div className="review-actions">
            <p>Please confirm the information is correct before saving.</p>
            <div>
              <button className="secondary-action" onClick={startAgain}>
                Cancel
              </button>
              <button
                className="primary-button"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoaderCircle size={17} className="spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={17} />
                    Save candidate
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {step === "saved" && (
        <section className="candidate-section saved-panel">
          <div className="saved-icon">
            <Check size={30} />
          </div>
          <h2>{savedName} has been added</h2>
          <p>The candidate's information and projects have been saved.</p>
          <button className="primary-button" onClick={startAgain}>
            Add another candidate
          </button>
          <button className="secondary-action" onClick={onBack}>
            Back to overview
          </button>
        </section>
      )}
    </div>
  );
}

function SectionHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="section-heading">
      <span className="section-number">{number}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function RepeatHeader({
  title,
  onRemove,
}: {
  title: string;
  onRemove: () => void;
}) {
  return (
    <div className="repeat-header">
      <h3>{title}</h3>
      <button onClick={onRemove} aria-label={`Remove ${title}`}>
        <Trash2 size={16} />
        Remove
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="form-field">
      <span>
        {label} {required && <em>*</em>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? 0.1 : undefined}
      />
    </label>
  );
}
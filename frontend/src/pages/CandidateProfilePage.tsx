import { useEffect, useState } from "react";
import {
    ArrowLeft,
    Archive,
    BriefcaseBusiness,
    CalendarDays,
    FileText,
    GraduationCap,
    Mail,
    MapPin,
    Phone,
    RotateCcw,
    Pencil
} from "lucide-react";

import {
    archiveCandidate,
    getCandidateById,
    restoreCandidate,
    type CandidateProfile,
} from "../services/candidateApi";

import "./CandidateProfilePage.css";

import CandidateEditForm from "../components/CandidateEditForm";

interface Props {
    candidateId: string;
    onBack: () => void;
}

export default function CandidateProfilePage({
    candidateId,
    onBack,
}: Props) {
    const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadCandidate() {
            setLoading(true);
            setError("");

            try {
                const result = await getCandidateById(candidateId);

                if (active) setCandidate(result);
            } catch (err) {
                if (active) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Could not load candidate."
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadCandidate();

        return () => {
            active = false;
        };
    }, [candidateId]);

    function handleCandidateSaved(updatedCandidate: CandidateProfile) {
        setCandidate(updatedCandidate);
        setIsEditing(false);
    }

    async function toggleArchive() {
        if (!candidate) return;

        if (
            !candidate.is_archived &&
            !window.confirm(
                `Archive ${candidate.full_name}? You can restore this candidate later.`
            )
        ) {
            return;
        }

        setUpdating(true);
        setError("");

        try {
            if (candidate.is_archived) {
                await restoreCandidate(candidate.id);
            } else {
                await archiveCandidate(candidate.id);
            }

            setCandidate({
                ...candidate,
                is_archived: !candidate.is_archived,
            });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not update candidate."
            );
        } finally {
            setUpdating(false);
        }
    }

    if (loading) {
        return (
            <div className="profile-page">
                <p className="profile-muted">Loading candidate details...</p>
            </div>
        );
    }

    if (!candidate) {
        return (
            <div className="profile-page">
                <button className="profile-back" onClick={onBack}>
                    <ArrowLeft size={17} /> Back to candidates
                </button>
                <p role="alert">{error || "Candidate not found."}</p>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <button className="profile-back" onClick={onBack}>
                <ArrowLeft size={17} />
                Back to candidates
            </button>

            <div className="profile-header">
                <div>
                    <p className="eyebrow">CANDIDATE PROFILE</p>
                    <h1>{candidate.full_name}</h1>

                    <span
                        className={
                            candidate.is_archived
                                ? "profile-status archived"
                                : "profile-status active"
                        }
                    >
                        {candidate.is_archived ? "Archived" : "Active"}
                    </span>
                </div>

                <div className="profile-header-actions">
                    {!candidate.is_archived && !isEditing && (
                        <button
                            className="profile-edit-button"
                            onClick={() => setIsEditing(true)}
                        >
                            <Pencil size={16} />
                            Edit details
                        </button>
                    )}

                    <button
                        className="profile-action"
                        disabled={updating || isEditing}
                        onClick={toggleArchive}
                    >
                        {candidate.is_archived ? (
                            <>
                                <RotateCcw size={16} />
                                Restore candidate
                            </>
                        ) : (
                            <>
                                <Archive size={16} />
                                Archive candidate
                            </>
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="profile-error" role="alert">
                    {error}
                </div>
            )}

            {isEditing && (
                <CandidateEditForm
                    candidate={candidate}
                    onSaved={handleCandidateSaved}
                    onCancel={() => setIsEditing(false)}
                />
            )}

            <section className="profile-card">
                <h2>Contact information</h2>

                <div className="profile-details">
                    <Detail
                        icon={<Mail size={17} />}
                        label="Email"
                        value={candidate.email}
                    />
                    <Detail
                        icon={<Phone size={17} />}
                        label="Phone"
                        value={candidate.phone}
                    />
                    <Detail
                        icon={<MapPin size={17} />}
                        label="Location"
                        value={candidate.location}
                    />
                    <Detail
                        icon={<BriefcaseBusiness size={17} />}
                        label="Experience"
                        value={`${candidate.experience_years} years`}
                    />
                </div>
            </section>

            <section className="profile-card">
                <h2>Professional summary</h2>
                <p className="profile-description">
                    {candidate.professional_summary || "No summary provided."}
                </p>
            </section>

            <section className="profile-card">
                <h2>Skills</h2>

                {candidate.skills.length > 0 ? (
                    <div className="profile-skills">
                        {candidate.skills.map((skill, index) => (
                            <span key={`${skill}-${index}`}>{skill}</span>
                        ))}
                    </div>
                ) : (
                    <p className="profile-muted">No skills added.</p>
                )}
            </section>

            <section className="profile-card">
                <h2>
                    <GraduationCap size={19} />
                    Education
                </h2>

                {candidate.education.length > 0 ? (
                    candidate.education.map((item, index) => (
                        <div className="profile-entry" key={index}>
                            <h3>{item.degree || "Qualification"}</h3>
                            <p>{item.institution || "Institution not provided"}</p>
                            {item.field_of_study && (
                                <p>{item.field_of_study}</p>
                            )}
                            <small>
                                {[item.start_date, item.end_date]
                                    .filter(Boolean)
                                    .join(" – ")}
                            </small>
                        </div>
                    ))
                ) : (
                    <p className="profile-muted">No education details added.</p>
                )}
            </section>

            <section className="profile-card">
                <h2>
                    <BriefcaseBusiness size={19} />
                    Work experience
                </h2>

                {candidate.work_experience.length > 0 ? (
                    candidate.work_experience.map((item, index) => (
                        <div className="profile-entry" key={index}>
                            <h3>{item.position || "Position not provided"}</h3>
                            <p>{item.company || "Company not provided"}</p>
                            <small>
                                {[item.start_date, item.end_date]
                                    .filter(Boolean)
                                    .join(" – ")}
                            </small>
                            {item.description && (
                                <p className="profile-description">
                                    {item.description}
                                </p>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="profile-muted">No work experience added.</p>
                )}
            </section>

            <section className="profile-card">
                <h2>
                    <BriefcaseBusiness size={19} />
                    Projects
                </h2>

                {candidate.projects.length > 0 ? (
                    candidate.projects.map((project) => (
                        <div className="profile-entry" key={project.id}>
                            <h3>{project.project_title}</h3>

                            {project.role && <p>Role: {project.role}</p>}

                            {project.description && (
                                <p className="profile-description">
                                    {project.description}
                                </p>
                            )}

                            {project.technologies.length > 0 && (
                                <div className="profile-skills">
                                    {project.technologies.map((tech, index) => (
                                        <span key={`${tech}-${index}`}>{tech}</span>
                                    ))}
                                </div>
                            )}

                            {(project.start_date || project.end_date) && (
                                <small>
                                    <CalendarDays size={13} />
                                    {[project.start_date, project.end_date]
                                        .filter(Boolean)
                                        .join(" – ")}
                                </small>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="profile-muted">No projects added.</p>
                )}
            </section>

            <section className="profile-card">
                <h2>
                    <FileText size={19} />
                    Resume
                </h2>

                <p className="profile-description">
                    {candidate.resume_filename || "No resume attached."}
                </p>
            </section>
        </div>
    );
}

function Detail({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | null;
}) {
    return (
        <div className="profile-detail">
            <span className="profile-detail-icon">{icon}</span>
            <div>
                <span className="profile-detail-label">{label}</span>
                <strong>{value || "Not provided"}</strong>
            </div>
        </div>
    );
}
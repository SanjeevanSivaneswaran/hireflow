import { ArrowRight, FileUp, Users, BriefcaseBusiness } from "lucide-react";

interface OverviewPageProps {
  onAddCandidate: () => void;
}

export default function OverviewPage({
  onAddCandidate,
}: OverviewPageProps) {
  return (
    <div className="overview-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>Welcome to HireFlow</h1>
          <p className="page-subtitle">
            A simpler way to organize candidates and keep hiring moving.
          </p>
        </div>
      </div>

      <section className="welcome-panel">
        <div className="welcome-icon">
          <FileUp size={26} strokeWidth={1.7} />
        </div>

        <div className="welcome-copy">
          <h2>Start by adding a candidate</h2>
          <p>
            Upload a resume and we'll help organize the details.
            You can review everything before saving.
          </p>

          <button className="primary-button" onClick={onAddCandidate}>
            Upload a resume
            <ArrowRight size={17} />
          </button>
        </div>
      </section>

      <div className="overview-section-heading">
        <h2>Your hiring workspace</h2>
        <p>Everything you need to manage recruitment, in one place.</p>
      </div>

      <div className="feature-grid">
        <article className="feature-card">
          <div className="feature-icon">
            <Users size={21} />
          </div>
          <h3>Candidates</h3>
          <p>
            Keep candidate details, experience, and resumes organized.
          </p>
        </article>

        <article className="feature-card">
          <div className="feature-icon">
            <BriefcaseBusiness size={21} />
          </div>
          <h3>Job openings</h3>
          <p>
            Manage open positions and the people applying for them.
          </p>
        </article>
      </div>
    </div>
  );
}
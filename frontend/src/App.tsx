import { useState } from "react";
import AppLayout from "./components/AppLayout";
import OverviewPage from "./pages/OverviewPage";
import CandidatesPage from "./pages/CandidatesPage";
import CandidateUploadPage from "./pages/CandidateUploadPage";
import CandidateProfilePage from "./pages/CandidateProfilePage";
import JobsPage from "./pages/JobsPage";
import JobCreatePage from "./pages/JobCreatePage";
import JobDetailsPage from "./pages/JobDetailsPage";
import "./App.css";

type Page =
  | "Overview"
  | "Candidates"
  | "Jobs"
  | "Applications"
  | "Interviews"
  | "Reports";

function App() {
  const [activePage, setActivePage] = useState<Page>("Overview");

  const [candidateView, setCandidateView] = useState<
    "directory" | "upload" | "profile"
  >("directory");

  const [selectedCandidateId, setSelectedCandidateId] = useState<
    string | null
  >(null);

  const [jobView, setJobView] = useState<"directory" | "create" | "details">("directory");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobsRefreshKey, setJobsRefreshKey] = useState(0);

  function navigate(page: Page) {
    setActivePage(page);

    if (page === "Candidates") {
      setCandidateView("directory");
    }

    if (page === "Jobs") {
      setJobView("directory");
    }
  }

  function openUpload() {
    setActivePage("Candidates");
    setCandidateView("upload");
  }

  return (
    <AppLayout activePage={activePage} onNavigate={navigate}>
      {activePage === "Overview" ? (
        <OverviewPage onAddCandidate={openUpload} />
      ) : activePage === "Candidates" ? (
        candidateView === "upload" ? (
          <CandidateUploadPage
            onBack={() => setCandidateView("directory")}
          />
        ) : candidateView === "profile" && selectedCandidateId ? (
          <CandidateProfilePage
            candidateId={selectedCandidateId}
            onBack={() => setCandidateView("directory")}
          />
        ) : (
          <CandidatesPage
            onAddCandidate={openUpload}
            onViewCandidate={(candidateId) => {
              setSelectedCandidateId(candidateId);
              setCandidateView("profile");
            }}
          />
        )
      ) : activePage === "Jobs" ? (
        jobView === "create" ? (
          <JobCreatePage
            onBack={() => setJobView("directory")}
            onCreated={() => {
              setJobsRefreshKey((value) => value + 1);
              setJobView("directory");
            }}
          />
        ) : jobView === "details" && selectedJobId ? (
          <JobDetailsPage
            jobId={selectedJobId}
            onBack={() => {
              setJobsRefreshKey((value) => value + 1);
              setJobView("directory");
            }}
            onDeleted={() => {
              setSelectedJobId(null);
              setJobsRefreshKey((value) => value + 1);
              setJobView("directory");
            }}
          />
        ) : (
          <JobsPage
            key={jobsRefreshKey}
            onCreateJob={() => setJobView("create")}
            onViewJob={(jobId) => {
              setSelectedJobId(jobId);
              setJobView("details");
            }}
          />
        )
      ) : (
        <section className="placeholder-page">
          <h1>{activePage}</h1>
          <p>This section will be available soon.</p>
        </section>
      )}
    </AppLayout>
  );
}

export default App;
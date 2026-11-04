import { useState } from "react";
import AppLayout from "./components/AppLayout";
import OverviewPage from "./pages/OverviewPage";
import CandidatesPage from "./pages/CandidatesPage";
import CandidateUploadPage from "./pages/CandidateUploadPage";
import CandidateProfilePage from "./pages/CandidateProfilePage";
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

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null
  );
  

  function navigate(page: Page) {
    setActivePage(page);

    if (page === "Candidates") {
      setCandidateView("directory");
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
        ) :  (
          <CandidatesPage
            onAddCandidate={openUpload}
            onViewCandidate={(candidateId) => {
              setSelectedCandidateId(candidateId);
              setCandidateView("profile");
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
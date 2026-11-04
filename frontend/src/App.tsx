import { useState } from "react";
import AppLayout from "./components/AppLayout";
import OverviewPage from "./pages/OverviewPage";
import CandidateUploadPage from "./pages/CandidateUploadPage";
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

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage}>
      {activePage === "Overview" ? (
        <OverviewPage
          onAddCandidate={() => setActivePage("Candidates")}
        />
      ) : activePage === "Candidates" ? (
        <CandidateUploadPage
          onBack={() => setActivePage("Overview")}
        />
      ) : (
        <section className="placeholder-page">
          <h1>{activePage}</h1>
          <p>
            This section will be available as we build the next
            HireFlow features.
          </p>
        </section>
      )}
    </AppLayout>
  );
}

export default App;
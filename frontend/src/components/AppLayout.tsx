import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  Columns3,
  CalendarDays,
  ChartNoAxesColumn,
  Menu,
  X,
} from "lucide-react";

import "./AppLayout.css";

type NavigationItem =
  | "Overview"
  | "Candidates"
  | "Jobs"
  | "Applications"
  | "Interviews"
  | "Reports";

interface AppLayoutProps {
  children: ReactNode;
  activePage: NavigationItem;
  onNavigate: (page: NavigationItem) => void;
}

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Candidates", icon: Users },
  { label: "Jobs", icon: BriefcaseBusiness },
  { label: "Applications", icon: Columns3 },
  { label: "Interviews", icon: CalendarDays },
  { label: "Reports", icon: ChartNoAxesColumn },
] as const;

export default function AppLayout({
  children,
  activePage,
  onNavigate,
}: AppLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleNavigation(page: NavigationItem) {
    onNavigate(page);
    setMenuOpen(false);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-symbol">H</div>
          <div>
            <div className="brand-name">HireFlow</div>
            <div className="brand-description">
              Recruitment workspace
            </div>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="sidebar-navigation" aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${
                activePage === label ? "nav-item-active" : ""
              }`}
              onClick={() => handleNavigation(label)}
              aria-current={activePage === label ? "page" : undefined}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="workspace-avatar">R</div>
          <div>
            <div className="workspace-user">Recruitment team</div>
            <div className="workspace-role">HireFlow workspace</div>
          </div>
        </div>
      </aside>

      {menuOpen && (
        <button
          className="sidebar-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <div className="main-area">
        <header className="topbar">
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>

          <span className="topbar-title">{activePage}</span>
          <span className="topbar-workspace">HireFlow</span>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
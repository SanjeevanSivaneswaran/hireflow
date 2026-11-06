import { useEffect, useState } from "react";
import {
  ArrowRight,
  Clock3,
  History,
  PlusCircle,
} from "lucide-react";

import { getApplicationActivities } from "../services/applicationApi";
import type { ApplicationActivity } from "../types/application";

import "./ApplicationActivityHistory.css";

interface ApplicationActivityHistoryProps {
  applicationId: string;
  refreshKey: number;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ApplicationActivityHistory({
  applicationId,
  refreshKey,
}: ApplicationActivityHistoryProps) {
  const [activities, setActivities] =
    useState<ApplicationActivity[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadActivities() {
      setLoading(true);
      setError("");

      try {
        const data = await getApplicationActivities(applicationId);

        if (!cancelled) {
          setActivities(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load activity history."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadActivities();

    return () => {
      cancelled = true;
    };
  }, [applicationId, refreshKey]);

  return (
    <section className="application-history-card">
      <div className="application-history-heading">
        <History size={19} />
        <h2>Activity history</h2>
      </div>

      <p className="application-history-description">
        A record of application creation and hiring-stage changes.
      </p>

      {error && (
        <div className="application-history-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="application-history-empty">
          Loading activity history...
        </p>
      ) : activities.length === 0 ? (
        <p className="application-history-empty">
          No activity recorded yet.
        </p>
      ) : (
        <div className="application-history-timeline">
          {activities.map((activity) => (
            <article
              key={activity.id}
              className="application-history-item"
            >
              <div className="application-history-icon">
                {activity.activity_type === "application_created" ? (
                  <PlusCircle size={16} />
                ) : (
                  <ArrowRight size={16} />
                )}
              </div>

              <div className="application-history-content">
                <h3>
                  {activity.activity_type === "application_created"
                    ? "Application created"
                    : activity.activity_type === "status_changed"
                    ? "Hiring stage updated"
                    : activity.activity_type.replaceAll("_", " ")}
                </h3>

                {activity.old_status && activity.new_status ? (
                  <div className="application-history-transition">
                    <span>{activity.old_status}</span>
                    <ArrowRight size={14} />
                    <span className="application-history-new-status">
                      {activity.new_status}
                    </span>
                  </div>
                ) : activity.description ? (
                  <p>{activity.description}</p>
                ) : null}

                <div className="application-history-date">
                  <Clock3 size={13} />
                  {formatDate(activity.created_at)}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

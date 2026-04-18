import { Suspense } from "react";
import { Dashboard } from "../../views/Dashboard/Dashboard";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="dashboard-loading" role="status" aria-live="polite" aria-label="Loading dashboard">
          <div className="dashboard-loading-inner">
            <div className="dashboard-loading-spinner" aria-hidden />
            <p className="dashboard-loading-text">Loading your workspace…</p>
          </div>
        </div>
      }
    >
      <Dashboard />
    </Suspense>
  );
}

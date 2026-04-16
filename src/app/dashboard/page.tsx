import { Suspense } from "react";
import { Dashboard } from "../../views/Dashboard/Dashboard";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="dashboard-loading">
          <div>Loading...</div>
        </div>
      }
    >
      <Dashboard />
    </Suspense>
  );
}

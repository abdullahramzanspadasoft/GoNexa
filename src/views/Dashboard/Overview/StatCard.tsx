"use client";

import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  chart?: ReactNode;
}

export function StatCard({ title, value, subtitle = "Last 30 days", chart }: StatCardProps) {
  return (
    <div className="overview-card">
      <div className="overview-card-top">
        <div className="overview-card-title-row">
          <div className="overview-card-title">{title}</div>
          <span className="overview-card-info" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9" cy="9" r="7" stroke="#9CA3AF" strokeWidth="1.5" />
              <path
                d="M8.55 12.35H9.55V11.35H8.55V12.35ZM9.05 5.4C7.85 5.4 6.95 6.1 6.95 7.15H8.05C8.05 6.7 8.45 6.3 9.05 6.3C9.6 6.3 10.05 6.6 10.05 7.05C10.05 7.55 9.75 7.8 9.3 8.1C8.75 8.45 8.55 8.75 8.55 9.5V10H9.55V9.6C9.55 9.05 9.7 8.9 10.2 8.6C10.75 8.25 11.15 7.85 11.15 7.05C11.15 6.1 10.2 5.4 9.05 5.4Z"
                fill="#9CA3AF"
              />
            </svg>
          </span>
        </div>

        <div className="overview-card-value">{value}</div>
        <div className="overview-card-subtitle">{subtitle}</div>
      </div>

      <div className="overview-card-chart">{chart}</div>
    </div>
  );
}


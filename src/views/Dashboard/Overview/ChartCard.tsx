"use client";

import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  rightIcon?: ReactNode;
  children: ReactNode;
}

export function ChartCard({ title, subtitle = "Last 30 days", rightIcon, children }: ChartCardProps) {
  return (
    <div className="overview-chart-card">
      <div className="overview-chart-head">
        <div>
          <div className="overview-chart-title">{title}</div>
          <div className="overview-chart-subtitle">{subtitle}</div>
        </div>
        {rightIcon ? <div className="overview-chart-right">{rightIcon}</div> : null}
      </div>
      <div className="overview-chart-body">{children}</div>
    </div>
  );
}


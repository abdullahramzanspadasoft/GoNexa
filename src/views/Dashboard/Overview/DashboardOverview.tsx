"use client";

import { useState, useEffect } from "react";
import { ChartCard } from "./ChartCard";
import { ExploreCard } from "./ExploreCard";
import { StatCard } from "./StatCard";
import { BIG_SERIES_A, BIG_SERIES_B, MINI_CHART_POINTS_A, MINI_CHART_POINTS_B, MINI_CHART_POINTS_C } from "./miniCharts";

function MiniLine({ points }: { points: string }) {
  return (
    <svg className="overview-mini-chart" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <span className="overview-card-info" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="9" r="7" stroke="#9CA3AF" strokeWidth="1.5" />
        <path
          d="M8.55 12.35H9.55V11.35H8.55V12.35ZM9.05 5.4C7.85 5.4 6.95 6.1 6.95 7.15H8.05C8.05 6.7 8.45 6.3 9.05 6.3C9.6 6.3 10.05 6.6 10.05 7.05C10.05 7.55 9.75 7.8 9.3 8.1C8.75 8.45 8.55 8.75 8.55 9.5V10H9.55V9.6C9.55 9.05 9.7 8.9 10.2 8.6C10.75 8.25 11.15 7.85 11.15 7.05C11.15 6.1 10.2 5.4 9.05 5.4Z"
          fill="#9CA3AF"
        />
      </svg>
    </span>
  );
}

function BigChart({ series, yMax = 7 }: { series: number[]; yMax?: number }) {
  const W = 820;
  const H = 260;
  const padL = 56;
  const padR = 18;
  const padT = 18;
  const padB = 34;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const xStep = innerW / Math.max(1, series.length - 1);
  const toY = (v: number) => innerH - (Math.max(0, Math.min(yMax, v)) / yMax) * innerH;

  const linePoints = series
    .map((v, i) => `${(i * xStep).toFixed(2)},${toY(v).toFixed(2)}`)
    .join(" ");

  const areaPoints = `0,${innerH} ${linePoints} ${innerW},${innerH} 0,${innerH}`;

  const yTicks = [0, 2, 4, 6];
  const xLabels = [
    { label: "Jan 8", x: innerW * 0.22 },
    { label: "Jan 13", x: innerW * 0.36 },
    { label: "Jan 18", x: innerW * 0.5 },
    { label: "Jan 23", x: innerW * 0.64 },
    { label: "Jan 28", x: innerW * 0.78 },
    { label: "Feb 2", x: innerW * 0.94 },
  ];

  return (
    <svg className="overview-big-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <g transform={`translate(${padL},${padT})`}>
        {/* horizontal grid */}
        <g stroke="#E5E7EB" strokeWidth="1">
          {yTicks.map((t) => {
            const y = toY(t);
            return (
              <line
                key={t}
                x1="0"
                y1={y}
                x2={innerW}
                y2={y}
                strokeDasharray={t === 0 ? "0" : "4 6"}
              />
            );
          })}
        </g>

        {/* axis lines */}
        <g stroke="#D1D5DB" strokeWidth="1.5">
          <line x1="0" y1="0" x2="0" y2={innerH} />
          <line x1="0" y1={innerH} x2={innerW} y2={innerH} />
        </g>

        {/* y-axis labels */}
        <g fontFamily="Montserrat, sans-serif" fontSize="12" fill="#6B7280">
          {yTicks.map((t) => (
            <text key={t} x={-10} y={toY(t) + 4} textAnchor="end">
              {t}
            </text>
          ))}
        </g>

        {/* series */}
        <polyline points={areaPoints} fill="currentColor" opacity="0.12" stroke="none" />
        <polyline points={linePoints} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />

        {/* x-axis labels */}
        <g fontFamily="Montserrat, sans-serif" fontSize="12" fill="#6B7280">
          {xLabels.map((d) => (
            <text key={d.label} x={d.x} y={innerH + 22} textAnchor="middle">
              {d.label}
            </text>
          ))}
        </g>
      </g>
    </svg>
  );
}

export function DashboardOverview() {
  const [stats, setStats] = useState({
    impressions: 0,
    reactions: 0,
    postCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/posts/stats");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats({
              impressions: data.data.impressions || 0,
              reactions: data.data.reactions || 0,
              postCount: data.data.postCount || 0,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="overview">
      <div className="overview-header">
        <div className="overview-title">Dashboard</div>
        <div className="overview-subtitle">Overview</div>
      </div>

      <div className="overview-top-grid">
        <StatCard 
          title="Impressions" 
          value={loading ? "..." : stats.impressions.toString()} 
          chart={<MiniLine points={MINI_CHART_POINTS_A} />} 
        />
        <StatCard 
          title="Reactions" 
          value={loading ? "..." : stats.reactions.toString()} 
          chart={<MiniLine points={MINI_CHART_POINTS_B} />} 
        />
        <StatCard 
          title="Post count" 
          value={loading ? "..." : stats.postCount.toString()} 
          chart={<MiniLine points={MINI_CHART_POINTS_C} />} 
        />
        <ExploreCard />
      </div>

      <div className="overview-charts-grid">
        <ChartCard title="Impressions per content" rightIcon={<InfoIcon />}>
          <BigChart series={BIG_SERIES_A} />
        </ChartCard>
        <ChartCard title="Impressions per network" rightIcon={<InfoIcon />}>
          <BigChart series={BIG_SERIES_B} />
        </ChartCard>
      </div>

      <div className="overview-recent">
        <div className="overview-recent-title">Recent posts</div>
      </div>
    </section>
  );
}


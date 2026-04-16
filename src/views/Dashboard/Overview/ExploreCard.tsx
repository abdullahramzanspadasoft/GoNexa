"use client";

export function ExploreCard() {
  return (
    <div className="overview-card overview-card-explore">
      <div className="overview-explore-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4.2 14.6L8.2 10.6L11 13.4L16.9 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M16.9 12.2V7.5H12.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="overview-explore-title">Explore your data</div>
      <div className="overview-explore-desc">Track how your posts perform with in-depth analytics.</div>

      <button type="button" className="overview-explore-button">
        Get insights
        <span className="overview-explore-arrow" aria-hidden="true">
          →
        </span>
      </button>
    </div>
  );
}


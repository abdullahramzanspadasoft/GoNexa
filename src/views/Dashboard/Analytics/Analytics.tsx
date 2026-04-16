"use client";

import { useState } from "react";

export function Analytics() {
  const [period, setPeriod] = useState("Last 7 Days");
  const [rowsPerPage, setRowsPerPage] = useState(100);

  const sampleData = [
    {
      id: "1",
      post: "For millions living abroad, sending money home...",
      date: "5 Jan 2026 5:34 PM",
      impressions: "7",
      reach: "4",
      reactions: "1",
      comments: "0",
      shares: "0",
    },
  ];

  const totalRows = 1;

  return (
    <div className="analytics-page-new">
      {/* Header */}
      <h1 className="analytics-title-new">Analytics</h1>

      {/* Filter Bar */}
      <div className="analytics-filter-bar">
        <div className="analytics-filter-left">
          <select
            className="analytics-period-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
          </select>

          <button className="analytics-filter-btn">
            Platforms
            <span className="analytics-filter-badge">3</span>
          </button>

          <button className="analytics-filter-btn">
            Accounts
            <span className="analytics-filter-badge">5</span>
          </button>
        </div>

        <div className="analytics-filter-right">
          <button className="analytics-icon-btn" aria-label="Refresh">
            <svg
              width="17"
              height="17"
              viewBox="0 0 17 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.6356 0.611298C15.9224 0.325035 16.172 1.9285e-07 16.4641 1.96333e-07C16.7562 1.99816e-07 16.9952 0.237402 16.9952 0.531101L16.9952 5.84211C16.9952 5.90637 16.9952 6.37321 16.4641 6.37321L11.1531 6.37321C10.861 6.37321 10.622 6.13527 10.622 5.84211C10.622 5.54841 10.9035 5.34394 11.1265 5.11769L12.603 3.64176C11.493 2.70171 10.0644 2.12918 8.49761 2.12918C4.97641 2.12918 2.1244 4.98279 2.1244 8.50239C2.1244 12.022 4.97641 14.8756 8.49761 14.8756C11.6523 14.8756 14.2706 12.5775 14.7752 9.56459L16.9209 9.56459C16.4004 13.7555 12.8314 17 8.49761 17C3.80268 17 4.53718e-08 13.1952 1.01333e-07 8.50239C1.57294e-07 3.80959 3.80268 0.00478177 8.49761 0.00478182C10.6539 0.00478185 12.6136 0.809933 14.1113 2.1329L15.6356 0.611298Z"
                fill="#263238"
              />
            </svg>
          </button>

          <button className="analytics-icon-btn" aria-label="Download">
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.2319 5.88365C10.2319 5.45981 10.5755 5.11621 10.9993 5.11621C11.4232 5.11621 11.7668 5.45981 11.7668 5.88365V11.1937L13.5264 9.434C13.8261 9.1343 14.312 9.1343 14.6117 9.434C14.9115 9.7337 14.9114 10.2196 14.6117 10.5193L11.542 13.5891C11.2423 13.8888 10.7564 13.8888 10.4567 13.5891L7.38689 10.5193C7.08719 10.2196 7.08718 9.7337 7.38689 9.434C7.68659 9.1343 8.17251 9.1343 8.47222 9.434L10.2319 11.1937V5.88365Z"
                fill="#263238"
              />
              <path
                d="M15.0931 15.3486C15.517 15.3486 15.8606 15.6922 15.8606 16.1161C15.8606 16.5399 15.517 16.8835 15.0931 16.8835H6.90709C6.48324 16.8835 6.13965 16.5399 6.13965 16.1161C6.13965 15.6922 6.48324 15.3486 6.90709 15.3486H15.0931Z"
                fill="#263238"
              />
              <path
                d="M4.29674e-07 11C4.25308e-07 8.60985 -0.00161977 6.74003 0.194169 5.28378C0.392927 3.80545 0.807678 2.63891 1.7233 1.7233C2.63891 0.807678 3.80545 0.392927 5.28378 0.194169C6.74003 -0.00161977 8.60985 4.25309e-07 11 4.29674e-07C13.3901 4.29674e-07 15.2599 -0.00161995 16.7162 0.194169C18.1945 0.392924 19.3611 0.807678 20.2766 1.7233L20.305 1.75187C21.4973 2.96469 21.8306 4.62033 21.9427 6.86878C21.9637 7.2921 21.6377 7.65236 21.2144 7.67346C20.791 7.69455 20.4308 7.36849 20.4097 6.94517C20.2989 4.72242 19.9688 3.58607 19.1913 2.80866L19.1913 2.80863C18.6085 2.22574 17.8198 1.89123 16.5117 1.71535C15.1815 1.53651 13.4335 1.53488 11 1.53488C8.56646 1.53488 6.81852 1.53651 5.48832 1.71535C4.18018 1.89123 3.39153 2.22572 2.80863 2.80863C2.22572 3.39153 1.89123 4.18018 1.71535 5.48832C1.53651 6.81852 1.53488 8.56646 1.53488 11C1.53488 13.4335 1.53651 15.1815 1.71535 16.5117C1.88848 17.7994 2.2153 18.5837 2.78147 19.1639L2.80863 19.1913V19.1913C3.39153 19.7743 4.18019 20.1087 5.48832 20.2846C6.81852 20.4635 8.56646 20.4651 11 20.4651C13.4335 20.4651 15.1815 20.4635 16.5117 20.2846C17.8198 20.1087 18.6085 19.7742 19.1913 19.1913L19.1913 19.1913C19.7742 18.6085 20.1087 17.8198 20.2846 16.5117C20.4635 15.1815 20.4651 13.4335 20.4651 11C20.4651 10.5761 20.8087 10.2325 21.2326 10.2325C21.6564 10.2325 22 10.5761 22 11C22 13.3901 22.0016 15.2599 21.8058 16.7162C21.6071 18.1945 21.1923 19.361 20.2766 20.2766C19.3611 21.1923 18.1945 21.6071 16.7162 21.8058C15.2599 22.0016 13.3901 22 11 22C8.60985 22 6.74003 22.0016 5.28378 21.8058C3.80544 21.6071 2.63891 21.1923 1.7233 20.2766V20.2766C0.807688 19.361 0.392923 18.1945 0.194169 16.7162C-0.00161995 15.2599 4.29674e-07 13.3901 4.29674e-07 11Z"
                fill="#263238"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="analytics-table-wrapper">
        <table className="analytics-table-new">
          <thead>
            <tr>
              <th>Post</th>
              <th>Date</th>
              <th>Impressions</th>
              <th>Reach</th>
              <th>Reactions</th>
              <th>Comments</th>
              <th>Shares</th>
            </tr>
          </thead>
          <tbody>
            {sampleData.map((row) => (
              <tr key={row.id}>
                <td className="analytics-table-post">{row.post}</td>
                <td>{row.date}</td>
                <td>{row.impressions}</td>
                <td>{row.reach}</td>
                <td>{row.reactions}</td>
                <td>{row.comments}</td>
                <td>{row.shares}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="analytics-pagination">
        <div className="analytics-pagination-left"></div>
        <div className="analytics-pagination-right">
          <span className="analytics-pagination-label">Rows per page:</span>
          <select
            className="analytics-pagination-select"
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="analytics-pagination-info">
            {1}-{totalRows} of {totalRows}
          </span>
          <div className="analytics-pagination-arrows">
            <button className="analytics-pagination-arrow" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button className="analytics-pagination-arrow" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

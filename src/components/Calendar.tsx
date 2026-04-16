"use client";

import { useState } from "react";

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 16)); // Jan 16, 2026
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const getWeekDates = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day; // Get Sunday of the week
    const sunday = new Date(date);
    sunday.setDate(diff);
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const weekDates = getWeekDates(new Date(currentDate));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelectedDay = (date: Date) => {
    return (
      date.getDate() === currentDate.getDate() &&
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-header-top">
          <h2 className="calendar-title">Calendar</h2>
          <button
            type="button"
            className="calendar-menu-button"
            aria-label="Calendar menu"
          >
            <svg
              className="calendar-menu-icon"
              width="30"
              height="30"
              viewBox="0 0 30 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.94141 8.82349H21.3238"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.94141 14.5586H21.3238"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.94141 20.2939H21.3238"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="0.5"
                y="0.5"
                width="29"
                height="29"
                rx="4.5"
                stroke="white"
              />
            </svg>
          </button>
        </div>
        <div className="calendar-header-row">
          <div className="calendar-controls">
            <button className="calendar-button calendar-today-button" onClick={goToToday}>
              Today
            </button>
            <div className="calendar-navigation">
              <button
                className="calendar-nav-button calendar-nav-button-prev"
                onClick={() => navigateWeek("prev")}
                aria-label="Previous week"
              >
                <svg width="11" height="17" viewBox="0 0 11 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M10.5398 7.49826C11.1534 8.05147 11.1534 8.9485 10.5398 9.50171L2.68261 16.5851C2.06892 17.1383 1.07395 17.1383 0.460257 16.5851C-0.153419 16.0318 -0.153419 15.1348 0.460257 14.5816L7.20628 8.49998L0.460257 2.41836C-0.153419 1.86515 -0.153419 0.968117 0.460257 0.414907C1.07395 -0.138302 2.06892 -0.138302 2.68261 0.414908L10.5398 7.49826Z" fill="#263238"/>
                </svg>
              </button>
              <button
                className="calendar-nav-button calendar-nav-button-next"
                onClick={() => navigateWeek("next")}
                aria-label="Next week"
              >
                <svg width="11" height="17" viewBox="0 0 11 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M10.5398 7.49826C11.1534 8.05147 11.1534 8.9485 10.5398 9.50171L2.68261 16.5851C2.06892 17.1383 1.07395 17.1383 0.460257 16.5851C-0.153419 16.0318 -0.153419 15.1348 0.460257 14.5816L7.20628 8.49998L0.460257 2.41836C-0.153419 1.86515 -0.153419 0.968117 0.460257 0.414907C1.07395 -0.138302 2.06892 -0.138302 2.68261 0.414908L10.5398 7.49826Z" fill="#263238"/>
                </svg>
              </button>
            </div>
            <div className="calendar-date-picker">
              <input
                type="text"
                value={formatDate(currentDate)}
                readOnly
                className="calendar-date-input"
              />
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="calendar-date-icon">
                <rect x="2" y="3" width="12" height="11" rx="1" stroke="#263238" strokeWidth="1.5" fill="none"/>
                <line x1="2" y1="6" x2="14" y2="6" stroke="#263238" strokeWidth="1.5"/>
                <line x1="6" y1="3" x2="6" y2="6" stroke="#263238" strokeWidth="1.5"/>
                <line x1="10" y1="3" x2="10" y2="6" stroke="#263238" strokeWidth="1.5"/>
                <rect x="4" y="8" width="2" height="2" fill="#263238"/>
                <rect x="7" y="8" width="2" height="2" fill="#263238"/>
                <rect x="10" y="8" width="2" height="2" fill="#263238"/>
                <rect x="4" y="11" width="2" height="2" fill="#263238"/>
                <rect x="7" y="11" width="2" height="2" fill="#263238"/>
                <rect x="10" y="11" width="2" height="2" fill="#263238"/>
              </svg>
            </div>
            <div className="calendar-status-filter">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="calendar-status-select"
              >
                <option value="">Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="calendar-status-arrow">
                <path d="M14 0H0L7.41176 10L14 0Z" fill="#263238"/>
              </svg>
            </div>
          </div>
          <div className="calendar-view-toggles">
            <button
              className={`calendar-view-button ${viewMode === "week" ? "active" : ""}`}
              onClick={() => setViewMode("week")}
            >
              Week
            </button>
            <button
              className={`calendar-view-button ${viewMode === "month" ? "active" : ""}`}
              onClick={() => setViewMode("month")}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {viewMode === "week" && (
        <div className="calendar-week-view">
          <div className="calendar-week-header">
            <div className="calendar-time-column"></div>
            {weekDates.map((date, index) => (
              <div
                key={index}
                className={`calendar-day-header ${isToday(date) ? "today" : ""} ${isSelectedDay(date) ? "selected" : ""}`}
              >
                <div className="calendar-day-label">
                  {date.toLocaleDateString("en-US", { weekday: "short" })}, {date.getDate()} {date.toLocaleDateString("en-US", { month: "short" })}
                </div>
              </div>
            ))}
          </div>
          <div className="calendar-week-grid">
            <div className="calendar-time-column">
              {hours.map((hour) => (
                <div key={hour} className="calendar-time-slot">
                  {hour === 0
                    ? "12 AM"
                    : hour < 12
                    ? `${hour} AM`
                    : hour === 12
                    ? "12 PM"
                    : `${hour - 12} PM`}
                </div>
              ))}
            </div>
            {weekDates.map((date, dayIndex) => (
              <div key={dayIndex} className="calendar-day-column">
                {hours.map((hour) => (
                  <div key={hour} className="calendar-hour-cell"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === "month" && (
        <div className="calendar-month-view">
          <p>Month view coming soon...</p>
        </div>
      )}
    </div>
  );
}

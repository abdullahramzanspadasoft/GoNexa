"use client";

import { useMemo, useState } from "react";
import { FileLibraryCard } from "./FileLibraryCard";
import { FILE_LIBRARY_ITEMS, type FileLibraryMediaType } from "./mockData";

type Filter = "all" | FileLibraryMediaType;

export function FileLibrary() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FILE_LIBRARY_ITEMS.filter((item) => {
      const matchesType = filter === "all" ? true : item.type === filter;
      const matchesQuery = q.length === 0 ? true : item.title.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [query, filter]);

  return (
    <section className="file-library">
      <div className="file-library-header">
        <h1 className="file-library-title">File Library</h1>
      </div>

      <div className="file-library-toolbar">
        <div className="file-library-search">
          <span className="file-library-search-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8.25 14.25C11.5637 14.25 14.25 11.5637 14.25 8.25C14.25 4.93629 11.5637 2.25 8.25 2.25C4.93629 2.25 2.25 4.93629 2.25 8.25C2.25 11.5637 4.93629 14.25 8.25 14.25Z"
                stroke="#9CA3AF"
                strokeWidth="2"
              />
              <path d="M12.7 12.7L15.75 15.75" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="file-library-search-input"
          />
        </div>

        <div className="file-library-actions">
          <div className="file-library-tabs" role="tablist" aria-label="File filter">
            <button
              type="button"
              className={`file-library-tab ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
              role="tab"
              aria-selected={filter === "all"}
            >
              All
            </button>
            <button
              type="button"
              className={`file-library-tab ${filter === "image" ? "active" : ""}`}
              onClick={() => setFilter("image")}
              role="tab"
              aria-selected={filter === "image"}
            >
              Images
            </button>
            <button
              type="button"
              className={`file-library-tab ${filter === "video" ? "active" : ""}`}
              onClick={() => setFilter("video")}
              role="tab"
              aria-selected={filter === "video"}
            >
              Videos
            </button>
          </div>

          <div className="file-library-browse-group">
            <button type="button" className="file-library-browse-button">
              Browse +
            </button>
            <button type="button" className="file-library-browse-caret" aria-label="Browse options">
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 0H0L7.41176 10L14 0Z" fill="white" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="file-library-grid">
        {filtered.map((item) => (
          <FileLibraryCard key={item.id} item={item} />
        ))}
      </div>

      <button type="button" className="file-library-create-post">
        <span className="file-library-create-post-plus" aria-hidden="true">
          +
        </span>
        Create Post
      </button>
    </section>
  );
}


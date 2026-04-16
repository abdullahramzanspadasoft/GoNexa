"use client";

import type { FileLibraryItem } from "./mockData";

interface FileLibraryCardProps {
  item: FileLibraryItem;
}

export function FileLibraryCard({ item }: FileLibraryCardProps) {
  const src = encodeURI(item.src);

  return (
    <div className="file-library-card">
      <div className="file-library-card-top">
        <span className="file-library-card-check" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9" cy="9" r="8" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.35)" />
            <path d="M5.3 9.4L7.6 11.6L12.6 6.7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>

        <span className="file-library-card-action" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="5" width="9" height="9" rx="2" stroke="white" strokeWidth="2" />
            <path d="M7 4.8C7 3.8 7.8 3 8.8 3H12.8C13.8 3 14.6 3.8 14.6 4.8V8.8" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </div>

      <div className="file-library-card-media">
        <img className="file-library-card-img" src={src} alt={item.title} loading="lazy" />

        {item.type === "video" && (
          <span className="file-library-card-video" aria-label="Video">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="14" fill="rgba(0,0,0,0.45)" />
              <path d="M12 9.8V18.2L19 14L12 9.8Z" fill="white" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}


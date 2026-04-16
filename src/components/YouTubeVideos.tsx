"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Video {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  duration: string;
  channelTitle: string;
}

interface YouTubeVideosProps {
  channelId: string | null;
  channelName: string | null;
}

export function YouTubeVideos({ channelId, channelName }: YouTubeVideosProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(new Set());
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (channelId) {
      fetchVideos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]); // Only fetch when channelId changes, not on every render

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/youtube/videos");
      const data = await response.json();

      if (data.success && data.data.videos) {
        setVideos(data.data.videos);
      } else {
        setError(data.message || "Failed to fetch videos");
      }
    } catch (err) {
      setError("Failed to fetch YouTube videos");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (duration: string) => {
    if (!duration) return "";
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return duration;
    
    const hours = (match[1] || "").replace("H", "");
    const minutes = (match[2] || "").replace("M", "");
    const seconds = (match[3] || "").replace("S", "");
    
    if (hours) {
      return `${hours}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirmDeleteId) {
      setConfirmDeleteId(videoId);
      return;
    }

    if (confirmDeleteId !== videoId) {
      setConfirmDeleteId(videoId);
      return;
    }

    setDeletingVideoId(videoId);
    setError(null);

    try {
      const response = await fetch(`/api/youtube/videos/${videoId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        // Remove video from local state
        setVideos((prev) => prev.filter((v) => v.videoId !== videoId));
        setConfirmDeleteId(null);
      } else {
        setError(data.message || "Failed to delete video");
        setConfirmDeleteId(null);
      }
    } catch (err) {
      setError("Failed to delete video. Please try again.");
      setConfirmDeleteId(null);
    } finally {
      setDeletingVideoId(null);
    }
  };

  if (loading) {
    return (
      <div className="youtube-videos-loading">
        <p>Loading videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="youtube-videos-error">
        <p>{error}</p>
        <button onClick={fetchVideos} className="youtube-retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="youtube-videos-empty">
        <p>No videos found in your YouTube channel.</p>
      </div>
    );
  }

  return (
    <div className="youtube-videos-section">
      <div className="youtube-videos-header">
        <h2 className="youtube-videos-title">
          Your YouTube Videos ({videos.length})
        </h2>
        <button onClick={fetchVideos} className="youtube-refresh-button">
          Refresh
        </button>
      </div>
      {error && (
        <div className="youtube-videos-error" style={{ marginBottom: "16px" }}>
          <p>{error}</p>
        </div>
      )}
      <div className="youtube-videos-grid">
        {videos.map((video) => (
          <div key={video.videoId} className="youtube-video-card">
            <a
              href={`https://www.youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="youtube-video-link"
            >
              <div className="youtube-video-thumbnail-wrapper">
                {video.thumbnail && !failedThumbnails.has(video.videoId) ? (
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    width={320}
                    height={180}
                    className="youtube-video-thumbnail"
                    unoptimized={video.thumbnail.includes("i.ytimg.com")}
                    onError={() => {
                      // Mark this thumbnail as failed
                      setFailedThumbnails((prev) => new Set(prev).add(video.videoId));
                    }}
                  />
                ) : (
                  <div className="youtube-video-thumbnail-placeholder">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                    </svg>
                    <p>Processing...</p>
                  </div>
                )}
                {video.duration && (
                  <span className="youtube-video-duration">{formatDuration(video.duration)}</span>
                )}
              </div>
              <div className="youtube-video-info">
                <h3 className="youtube-video-title">{video.title}</h3>
                <div className="youtube-video-stats">
                  <span>{video.viewCount.toLocaleString()} views</span>
                  <span>•</span>
                  <span>{video.likeCount.toLocaleString()} likes</span>
                  <span>•</span>
                  <span>{formatDate(video.publishedAt)}</span>
                </div>
              </div>
            </a>
            <div className="youtube-video-actions">
              {confirmDeleteId === video.videoId ? (
                <div className="youtube-delete-confirm">
                  <span>Delete?</span>
                  <button
                    className="youtube-delete-confirm-yes"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVideo(video.videoId);
                    }}
                    disabled={deletingVideoId === video.videoId}
                  >
                    Yes
                  </button>
                  <button
                    className="youtube-delete-confirm-no"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(null);
                    }}
                    disabled={deletingVideoId === video.videoId}
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  className="youtube-delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleDeleteVideo(video.videoId);
                  }}
                  disabled={deletingVideoId === video.videoId}
                  title="Delete video"
                >
                  {deletingVideoId === video.videoId ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.416" strokeDashoffset="31.416">
                        <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416;0 31.416" repeatCount="indefinite"/>
                        <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416;-31.416" repeatCount="indefinite"/>
                      </circle>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 11V17M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

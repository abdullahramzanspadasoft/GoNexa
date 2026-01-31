"use client";

import { useEffect, useState } from "react";

interface VideoUploadProps {
  youtubeChannel: {
    channelId: string;
    channelName: string;
    channelLogo: string | null;
    subscribers: number;
  } | null;
}

interface VideoItem {
  _id: string;
  youtubeVideoId: string;
  title: string;
  status: string;
  privacyStatus: string;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  publishAt: string | null;
  createdAt: string;
}

export function VideoUpload({ youtubeChannel }: VideoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacyStatus, setPrivacyStatus] = useState<"private" | "unlisted" | "public">("private");
  const [publishAt, setPublishAt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  useEffect(() => {
    if (youtubeChannel) {
      fetchVideos();
    }
  }, [youtubeChannel]);

  const fetchVideos = async () => {
    try {
      setLoadingVideos(true);
      const response = await fetch("/api/youtube/videos");
      const data = await response.json();
      if (data.success) {
        setVideos(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch videos:", err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 2 * 1024 * 1024 * 1024) {
        setError("File size must be less than 2GB");
        return;
      }
      setFile(selectedFile);
      setError("");
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      setError("Please select a video file and enter a title");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("privacyStatus", privacyStatus);
      if (publishAt) {
        formData.append("publishAt", publishAt);
      }

      const response = await fetch("/api/youtube/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setSuccess(
        `Video uploaded successfully!${
          data.data.publishAt
            ? ` Scheduled for ${new Date(data.data.publishAt).toLocaleString()}`
            : ""
        }`
      );
      setFile(null);
      setTitle("");
      setDescription("");
      setPublishAt("");

      fetchVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!youtubeChannel) {
    return (
      <div
        style={{
          background: "rgba(255, 0, 0, 0.1)",
          border: "1px solid rgba(255, 0, 0, 0.3)",
          borderRadius: "12px",
          padding: "20px",
          marginTop: "20px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#ff6b6b", margin: 0 }}>
          No YouTube channel connected. Please connect your Google account with YouTube access.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "12px",
        padding: "30px",
        marginTop: "30px",
        border: "1px solid rgba(99, 102, 241, 0.3)",
      }}
    >
      <h2
        style={{
          fontSize: "24px",
          fontWeight: 600,
          marginBottom: "20px",
          color: "#fff",
        }}
      >
        Upload Video to YouTube
      </h2>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
          padding: "12px",
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: "8px",
        }}
      >
        {youtubeChannel.channelLogo && (
          <img
            src={youtubeChannel.channelLogo}
            alt={youtubeChannel.channelName}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
            }}
          />
        )}
        <div>
          <p style={{ margin: 0, fontWeight: 600, color: "#fff" }}>
            {youtubeChannel.channelName}
          </p>
          <p style={{ margin: 0, fontSize: "14px", color: "rgba(255, 255, 255, 0.6)" }}>
            {youtubeChannel.subscribers.toLocaleString()} subscribers
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Video File *
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            disabled={uploading}
            required
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#fff",
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          />
          {file && (
            <p style={{ marginTop: "8px", fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
              Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter video title"
            disabled={uploading}
            required
            maxLength={100}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#fff",
              fontSize: "14px",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter video description"
            disabled={uploading}
            rows={4}
            maxLength={5000}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#fff",
              fontSize: "14px",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Privacy Status
          </label>
          <select
            value={privacyStatus}
            onChange={(e) => setPrivacyStatus(e.target.value as "private" | "unlisted" | "public")}
            disabled={uploading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#fff",
              fontSize: "14px",
            }}
          >
            <option value="private">Private</option>
            <option value="unlisted">Unlisted</option>
            <option value="public">Public</option>
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Schedule Publish (Optional)
          </label>
          <input
            type="datetime-local"
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
            disabled={uploading}
            min={new Date().toISOString().slice(0, 16)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#fff",
              fontSize: "14px",
            }}
          />
        </div>

        {error && (
          <div
            style={{
              background: "rgba(255, 0, 0, 0.1)",
              border: "1px solid rgba(255, 0, 0, 0.3)",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "20px",
              color: "#ff6b6b",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "rgba(0, 255, 0, 0.1)",
              border: "1px solid rgba(0, 255, 0, 0.3)",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "20px",
              color: "#4ade80",
              fontSize: "14px",
            }}
          >
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !file || !title}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "8px",
            border: "none",
            background:
              uploading || !file || !title
                ? "rgba(99, 102, 241, 0.5)"
                : "linear-gradient(90deg, #5865f2 0%, #a855f7 100%)",
            color: "white",
            fontSize: "16px",
            fontWeight: 600,
            cursor: uploading || !file || !title ? "not-allowed" : "pointer",
          }}
        >
          {uploading ? "Uploading..." : "Upload Video"}
        </button>
      </form>

      {videos.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: 600,
              marginBottom: "16px",
              color: "#fff",
            }}
          >
            Your Videos ({videos.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {videos.map((video) => (
              <div
                key={video._id}
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                {video.thumbnailUrl && (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    style={{
                      width: "120px",
                      height: "68px",
                      borderRadius: "4px",
                      objectFit: "cover",
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#fff",
                    }}
                  >
                    {video.title}
                  </h4>
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "12px",
                      color: "rgba(255, 255, 255, 0.6)",
                    }}
                  >
                    Status: <span style={{ textTransform: "capitalize" }}>{video.status}</span> •{" "}
                    Privacy: <span style={{ textTransform: "capitalize" }}>{video.privacyStatus}</span>
                  </p>
                  {video.videoUrl && (
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#5865f2",
                        fontSize: "12px",
                        textDecoration: "none",
                      }}
                    >
                      View on YouTube →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loadingVideos && videos.length === 0 && (
        <div style={{ textAlign: "center", marginTop: "20px", color: "rgba(255, 255, 255, 0.6)" }}>
          Loading videos...
        </div>
      )}
    </div>
  );
}

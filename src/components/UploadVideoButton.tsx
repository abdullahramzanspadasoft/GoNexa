"use client";

import { useState } from "react";

interface UploadVideoButtonProps {
  channelId: string | null;
}

export function UploadVideoButton({ channelId }: UploadVideoButtonProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    privacyStatus: "private",
    scheduleDate: "",
    scheduleTime: "",
    scheduleEnabled: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError("Please select a video file");
      return;
    }

    if (!formData.title.trim()) {
      setError("Please enter a video title");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("video", selectedFile);
      uploadFormData.append("title", formData.title);
      uploadFormData.append("description", formData.description);
      uploadFormData.append("privacyStatus", formData.privacyStatus);
      
      if (formData.scheduleEnabled && formData.scheduleDate && formData.scheduleTime) {
        uploadFormData.append("scheduleDate", formData.scheduleDate);
        uploadFormData.append("scheduleTime", formData.scheduleTime);
      }

      const response = await fetch("/api/youtube/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setFormData({ 
          title: "", 
          description: "", 
          privacyStatus: "private",
          scheduleDate: "",
          scheduleTime: "",
          scheduleEnabled: false,
        });
        setSelectedFile(null);
        setTimeout(() => {
          setShowUploadModal(false);
          setSuccess(false);
          // Refresh videos list
          window.location.reload();
        }, 2000);
      } else {
        setError(data.message || "Failed to upload video");
      }
    } catch (err) {
      setError("Failed to upload video. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!channelId) {
    return null;
  }

  return (
    <>
      <button
        className="youtube-upload-button"
        onClick={() => setShowUploadModal(true)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Upload Video
      </button>

      {showUploadModal && (
        <div className="upload-modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="upload-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="upload-modal-header">
              <h2>Upload Video to YouTube</h2>
              <button
                className="upload-modal-close"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="upload-form">
              {error && (
                <div className="upload-error-message">{error}</div>
              )}
              {success && (
                <div className="upload-success-message">
                  Video uploaded successfully!
                </div>
              )}

              <div className="upload-form-group">
                <label htmlFor="video-file">Video File *</label>
                <input
                  type="file"
                  id="video-file"
                  accept="video/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  required
                />
                {selectedFile && (
                  <p className="upload-file-name">{selectedFile.name}</p>
                )}
              </div>

              <div className="upload-form-group">
                <label htmlFor="video-title">Title *</label>
                <input
                  type="text"
                  id="video-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter video title"
                  disabled={uploading}
                  required
                />
              </div>

              <div className="upload-form-group">
                <label htmlFor="video-description">Description</label>
                <textarea
                  id="video-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter video description"
                  rows={4}
                  disabled={uploading}
                />
              </div>

              <div className="upload-form-group">
                <label htmlFor="privacy-status">Privacy Status</label>
                <select
                  id="privacy-status"
                  value={formData.privacyStatus}
                  onChange={(e) => setFormData({ ...formData, privacyStatus: e.target.value })}
                  disabled={uploading || formData.scheduleEnabled}
                >
                  <option value="private">Private</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="public">Public</option>
                </select>
                {formData.scheduleEnabled && (
                  <p className="upload-form-hint">
                    Privacy will be set to Private for scheduled videos
                  </p>
                )}
              </div>

              <div className="upload-form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.scheduleEnabled}
                    onChange={(e) => setFormData({ ...formData, scheduleEnabled: e.target.checked })}
                    disabled={uploading}
                  />
                  <span>Schedule video for later</span>
                </label>
              </div>

              {formData.scheduleEnabled && (
                <>
                  <div className="upload-form-group">
                    <label htmlFor="schedule-date">Schedule Date *</label>
                    <input
                      type="date"
                      id="schedule-date"
                      value={formData.scheduleDate}
                      onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                      disabled={uploading}
                      required={formData.scheduleEnabled}
                    />
                  </div>

                  <div className="upload-form-group">
                    <label htmlFor="schedule-time">Schedule Time *</label>
                    <input
                      type="time"
                      id="schedule-time"
                      value={formData.scheduleTime}
                      onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                      disabled={uploading}
                      required={formData.scheduleEnabled}
                    />
                  </div>
                </>
              )}

              <div className="upload-form-actions">
                <button
                  type="button"
                  className="upload-cancel-button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="upload-submit-button"
                  disabled={
                    uploading || 
                    !selectedFile || 
                    !formData.title.trim() ||
                    (formData.scheduleEnabled && (!formData.scheduleDate || !formData.scheduleTime))
                  }
                >
                  {uploading ? "Uploading..." : formData.scheduleEnabled ? "Schedule Video" : "Upload Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

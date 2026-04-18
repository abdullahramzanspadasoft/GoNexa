"use client";

import { useState, useEffect } from "react";

const TABS = ["Draft", "Scheduled", "Published", "Processing"] as const;

export function Posts() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Draft");
  const [showComposer, setShowComposer] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showAccountSelect, setShowAccountSelect] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<"youtube" | "linkedin" | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "video" | null>(null);
  const [captionText, setCaptionText] = useState("");
  const [linkText, setLinkText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [postStatus, setPostStatus] = useState<"draft" | "published" | "scheduled" | "private">("draft");
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user data to check connected accounts
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await fetch("/api/user/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data.data);
          }
        } else {
          const res = await fetch("/api/user/me");
          if (res.ok) {
            const data = await res.json();
            setUser(data.data);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    // Fetch posts based on active tab
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/posts?status=${activeTab.toLowerCase()}`);
        if (response.ok) {
          const data = await response.json();
          setPosts(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
    
    // Close status dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById("status-dropdown");
      const button = event.target as HTMLElement;
      if (dropdown && !dropdown.contains(button) && !button.closest('.npc-badge')) {
        dropdown.style.display = "none";
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeTab]);
  
  // Close delete menu when clicking outside
  useEffect(() => {
    if (!showDeleteMenu) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const menuContainer = target.closest('.delete-menu-container');
      const menuDropdown = target.closest('.delete-menu-dropdown');
      
      if (!menuContainer && !menuDropdown) {
        setShowDeleteMenu(null);
      }
    };
    
    // Use setTimeout to avoid immediate closure
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDeleteMenu]);

  const handleNetworkClick = () => {
    setShowNetworkModal(true);
  };

  const handleAllAccountsClick = () => {
    setShowAccountSelect(true);
  };

  const handleGroupClick = () => {
    // Handle group functionality
    console.log("Group clicked");
  };

  const handleConnectChannel = async (platform: "youtube" | "linkedin") => {
    if (platform === "youtube") {
      window.location.href = "/api/youtube/connect";
    } else if (platform === "linkedin") {
      window.location.href = "/api/linkedin/connect";
    }
  };

  const handleFileUpload = (files: File[]) => {
    const newFiles = [...uploadedFiles, ...files];
    setUploadedFiles(newFiles);
    
    // Create preview for first file (image or video)
    if (files.length > 0) {
      const firstFile = files[0];
      
      if (firstFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setPreviewImage(e.target.result as string);
            setPreviewVideo(null);
            setPreviewType("image");
          }
        };
        reader.readAsDataURL(firstFile);
      } else if (firstFile.type.startsWith("video/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setPreviewVideo(e.target.result as string);
            setPreviewImage(null);
            setPreviewType("video");
          }
        };
        reader.readAsDataURL(firstFile);
      }
    }
  };

  return (
    <div className="posts-page">
      <h1 className="posts-title">Posts</h1>

      <div className="posts-toolbar">
        <div className="posts-tabs-row">
          <div className="posts-tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`posts-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button 
            type="button" 
            className="posts-refresh-btn" 
            aria-label="Refresh"
            onClick={async () => {
              setLoading(true);
              try {
                const response = await fetch(`/api/posts?status=${activeTab.toLowerCase()}`);
                if (response.ok) {
                  const data = await response.json();
                  setPosts(data.data || []);
                }
              } catch (error) {
                console.error("Error refreshing posts:", error);
              } finally {
                setLoading(false);
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 12a9 9 0 11-2.64-6.36"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M21 3v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* New button with dropdown */}
        <div className="posts-new-btn-group">
          <button type="button" className="posts-new-btn-main" onClick={() => setShowComposer(true)}>
            New
          </button>
          <button
            type="button"
            className="posts-new-btn-dropdown"
            aria-label="More options"
            onClick={() => setShowNewMenu((prev) => !prev)}
          >
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {showNewMenu && (
            <div className="posts-new-menu">
              <button type="button" onClick={() => {
                setShowComposer(true);
                setShowNewMenu(false);
              }}>
                <span>New</span>
                <svg width="8" height="12" viewBox="0 0 8 12" fill="none" style={{ marginLeft: "auto" }}>
                  <path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button type="button" onClick={() => {
                setShowNewMenu(false);
                // Handle Network click - show connect channel modal
                handleNetworkClick();
              }}>
                <span>Network</span>
                <svg width="8" height="12" viewBox="0 0 8 12" fill="none" style={{ marginLeft: "auto" }}>
                  <path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button type="button" onClick={() => {
                setShowNewMenu(false);
                handleAllAccountsClick();
              }}>
                <span>All accounts</span>
                <svg width="8" height="12" viewBox="0 0 8 12" fill="none" style={{ marginLeft: "auto" }}>
                  <path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button type="button" onClick={() => {
                setShowNewMenu(false);
                handleGroupClick();
              }}>
                <span>Group</span>
                <svg width="8" height="12" viewBox="0 0 8 12" fill="none" style={{ marginLeft: "auto" }}>
                  <path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Posts list */}
      <div className="posts-content">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Loading posts...</div>
        ) : posts.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
            No {activeTab.toLowerCase()} posts found.
          </div>
        ) : (
          <div className="posts-list">
            {posts.map((post, index) => {
              const platformIcon = post.platform === "youtube" ? "/Youtube-Icon.svg" :
                                  post.platform === "linkedin" ? "/Linkedin-Icon.svg" :
                                  post.platform === "tiktok" ? "/TikTok-Icon.svg" :
                                  post.platform === "pinterest" ? "/Pinterest-Icon.svg" :
                                  "/Social-Media-Management-Icon.svg";
              
              return (
                <div key={post._id || index} className="posts-item" style={{
                  background: "#ffffff",
                  border: "1px solid #e0e0e0",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.3s",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                    <span style={{ 
                      color: "#000", 
                      fontWeight: 700, 
                      fontSize: "14px"
                    }}>
                      {index === 0 ? "1st" : index === 1 ? "2nd" : index === 2 ? "3rd" : `${index + 1}th`} Post
                    </span>
                    {post.content && (
                      <span style={{ 
                        color: "#333", 
                        fontSize: "14px", 
                        maxWidth: "400px", 
                        overflow: "hidden", 
                        textOverflow: "ellipsis", 
                        whiteSpace: "nowrap" 
                      }}>
                        {post.content}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {post.platform && (
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: "#f5f5f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <img 
                          src={platformIcon} 
                          alt={post.platform} 
                          width="20" 
                          height="20"
                        />
                      </div>
                    )}
                    <button 
                      type="button"
                      onClick={async () => {
                        // Load post data for editing
                        try {
                          const response = await fetch(`/api/posts/${post._id}`);
                          if (response.ok) {
                            const data = await response.json();
                            const postData = data.data;
                            setEditingPost(postData);
                            setCurrentPostId(postData._id);
                            setSelectedPlatform(postData.platform as "youtube" | "linkedin");
                            setCaptionText(postData.content || "");
                            setLinkText(postData.link || "");
                            setCommentText(postData.comment || "");
                            setPostStatus(postData.status || "draft");
                            setShowComposer(true);
                            // Note: mediaUrls would need to be loaded if you want to show existing media
                          }
                        } catch (error) {
                          console.error("Error loading post for edit:", error);
                          alert("Failed to load post for editing");
                        }
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#000",
                        cursor: "pointer",
                        padding: "6px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f5f5f5";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                      title="Edit"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.9888 4.28491L19.6405 2.93089C18.4045 1.6897 16.4944 1.6897 15.2584 2.93089L13.0112 5.30042L18.7416 11.055L21.1011 8.68547C21.6629 8.1213 22 7.33145 22 6.54161C22 5.75176 21.5506 4.84908 20.9888 4.28491Z" fill="currentColor"/>
                        <path d="M16.2697 10.9422L11.7753 6.42877L2.89888 15.3427C2.33708 15.9069 2 16.6968 2 17.5994V21.0973C2 21.5487 2.33708 22 2.89888 22H6.49438C7.2809 22 8.06742 21.6615 8.74157 21.0973L17.618 12.1834L16.2697 10.9422Z" fill="currentColor"/>
                      </svg>
                    </button>
                    <div style={{ position: "relative", zIndex: showDeleteMenu === post._id ? 10001 : "auto" }} className="delete-menu-container">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteMenu(showDeleteMenu === post._id ? null : post._id);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#000",
                          cursor: "pointer",
                          padding: "6px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#f5f5f5";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                        title="More options"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="4" r="1.5" fill="currentColor"/>
                          <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                          <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
                        </svg>
                      </button>
                      {showDeleteMenu === post._id && (
                        <div 
                          className="delete-menu-dropdown"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            marginTop: "8px",
                            background: "#ffffff",
                            border: "1px solid #e0e0e0",
                            borderRadius: "8px",
                            padding: "4px",
                            minWidth: "140px",
                            zIndex: 10000,
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
                            overflow: "hidden"
                          }}
                        >
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm("Are you sure you want to delete this post?")) {
                                try {
                                  const response = await fetch(`/api/posts/${post._id}`, {
                                    method: "DELETE",
                                  });
                                  
                                  if (response.ok) {
                                    // Refresh posts list
                                    const refreshResponse = await fetch(`/api/posts?status=${activeTab.toLowerCase()}`);
                                    if (refreshResponse.ok) {
                                      const refreshData = await refreshResponse.json();
                                      setPosts(refreshData.data || []);
                                    }
                                    setShowDeleteMenu(null);
                                    alert("Post deleted successfully");
                                  } else {
                                    alert("Failed to delete post");
                                  }
                                } catch (error) {
                                  console.error("Error deleting post:", error);
                                  alert("Error deleting post");
                                }
                              } else {
                                setShowDeleteMenu(null);
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "10px 14px",
                              background: "transparent",
                              border: "none",
                              borderRadius: "6px",
                              color: "#ff4444",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: "14px",
                              fontWeight: 500,
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#fff5f5";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                              <path d="M12 4V13.3333C12 14.2538 11.2538 15 10.3333 15H5.66667C4.74619 15 4 14.2538 4 13.3333V4M6 4V2.66667C6 1.74619 6.74619 1 7.66667 1H8.33333C9.25381 1 10 1.74619 10 2.66667V4M2 4H14M10 7.33333V11.6667M6 7.33333V11.6667" stroke="#ff4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Delete Post
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Network Connect Modal */}
      {showNetworkModal && (
        <div className="npc-overlay" onClick={() => setShowNetworkModal(false)}>
          <div className="npc-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div style={{ padding: "24px" }}>
              <h2 style={{ marginBottom: "20px", fontSize: "20px", fontWeight: 600 }}>Connect Channel</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => handleConnectChannel("youtube")}
                  style={{
                    padding: "20px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "12px",
                    background: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    transition: "all 0.2s",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f5f5f5";
                    e.currentTarget.style.borderColor = "#d0d0d0";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.borderColor = "#e0e0e0";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                  }}
                >
                  <img 
                    src="/Youtube-Icon.svg" 
                    alt="YouTube" 
                    width="40" 
                    height="40" 
                    style={{ objectFit: "contain" }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                  <span style={{ flex: 1, textAlign: "left", fontWeight: 600, fontSize: "16px" }}>YouTube</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleConnectChannel("linkedin")}
                  style={{
                    padding: "20px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "12px",
                    background: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    transition: "all 0.2s",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f5f5f5";
                    e.currentTarget.style.borderColor = "#d0d0d0";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.borderColor = "#e0e0e0";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                  }}
                >
                  <img 
                    src="/Linkedin-Icon.svg" 
                    alt="LinkedIn" 
                    width="40" 
                    height="40" 
                    style={{ objectFit: "contain" }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                  <span style={{ flex: 1, textAlign: "left", fontWeight: 600, fontSize: "16px" }}>LinkedIn</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div style={{ 
                  padding: "20px", 
                  border: "2px solid #e0e0e0", 
                  borderRadius: "12px", 
                  background: "#f9f9f9", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "16px", 
                  opacity: 0.7,
                  cursor: "not-allowed"
                }}>
                  <img 
                    src="/Tiktok-Icon.svg" 
                    alt="TikTok" 
                    width="40" 
                    height="40" 
                    style={{ objectFit: "contain", opacity: 0.6 }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                  <span style={{ flex: 1, textAlign: "left", fontWeight: 600, fontSize: "16px", color: "#666" }}>TikTok</span>
                  <span style={{ fontSize: "12px", color: "#999", padding: "4px 8px", background: "#e0e0e0", borderRadius: "4px" }}>Coming soon</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNetworkModal(false)}
                style={{
                  marginTop: "20px",
                  padding: "12px 24px",
                  background: "#f0f0f0",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  width: "100%",
                  fontWeight: 500,
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e0e0e0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f0f0f0";
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Select Modal */}
      {showAccountSelect && (
        <div className="npc-overlay" onClick={() => setShowAccountSelect(false)}>
          <div className="npc-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <div style={{ padding: "24px" }}>
              <h2 style={{ marginBottom: "20px", fontSize: "20px", fontWeight: 600 }}>Select Account</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {user?.youtubeChannelName && (
                  <button
                    type="button"
                    style={{
                      padding: "16px",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      background: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px"
                    }}
                  >
                    <img src="/Youtube-Icon.svg" alt="YouTube" width="24" height="24" />
                    <span style={{ flex: 1, textAlign: "left", fontWeight: 500 }}>{user.youtubeChannelName}</span>
                  </button>
                )}
                {user?.linkedinName && (
                  <button
                    type="button"
                    style={{
                      padding: "16px",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      background: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px"
                    }}
                  >
                    <img src="/Linkedin-Icon.svg" alt="LinkedIn" width="24" height="24" />
                    <span style={{ flex: 1, textAlign: "left", fontWeight: 500 }}>{user.linkedinName}</span>
                  </button>
                )}
                {(!user?.youtubeChannelName && !user?.linkedinName) && (
                  <div style={{ padding: "16px", textAlign: "center", color: "#666" }}>
                    No accounts connected. Please connect YouTube or LinkedIn first.
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowAccountSelect(false)}
                style={{
                  marginTop: "20px",
                  padding: "12px 24px",
                  background: "#f0f0f0",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  width: "100%",
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Post Composer */}
      {showComposer && (
        <div className="npc-overlay" onClick={() => setShowComposer(false)}>
          <div className="npc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="npc-left">
              <div className="npc-header">
                <span className="npc-post-label">Post: 1</span>
              </div>

              <div className="npc-badges-row">
                <div style={{ position: "relative" }}>
                  <button 
                    className="npc-badge npc-badge-outline" 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const dropdown = document.getElementById("status-dropdown");
                      if (dropdown) {
                        const isVisible = dropdown.style.display === "block";
                        dropdown.style.display = isVisible ? "none" : "block";
                      }
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <span>
                      Status: {postStatus === "draft" ? "Draft" : postStatus === "published" ? "Published" : postStatus === "scheduled" ? "Scheduled" : postStatus === "private" ? "Private" : "Draft"}
                      {savingStatus && <span style={{ marginLeft: "8px", fontSize: "12px", opacity: 0.7 }}>Saving...</span>}
                    </span>
                    <svg width="12" height="8" viewBox="0 0 10 6" fill="none">
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div 
                    id="status-dropdown"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: "none",
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      marginTop: "4px",
                      background: "#1a1a1a",
                      border: "1px solid rgba(88, 101, 242, 0.3)",
                      borderRadius: "8px",
                      padding: "8px",
                      minWidth: "150px",
                      zIndex: 1000,
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
                    }}
                  >
                    {["draft", "published", "scheduled", "private"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={async () => {
                          const newStatus = status as "draft" | "published" | "scheduled" | "private";
                          setPostStatus(newStatus);
                          const dropdown = document.getElementById("status-dropdown");
                          if (dropdown) dropdown.style.display = "none";
                          
                          // If there's a current post ID (editing existing post), save status immediately
                          if (currentPostId) {
                            setSavingStatus(true);
                            try {
                              const response = await fetch(`/api/posts/${currentPostId}/status`, {
                                method: "PATCH",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ status: newStatus }),
                              });
                              
                              if (response.ok) {
                                const data = await response.json();
                                // Refresh posts list
                                const refreshResponse = await fetch(`/api/posts?status=${activeTab.toLowerCase()}`);
                                if (refreshResponse.ok) {
                                  const refreshData = await refreshResponse.json();
                                  setPosts(refreshData.data || []);
                                }
                              } else {
                                console.error("Failed to update post status");
                                alert("Failed to update status. Please try again.");
                              }
                            } catch (error) {
                              console.error("Error updating post status:", error);
                              alert("Error updating status. Please try again.");
                            } finally {
                              setSavingStatus(false);
                            }
                          }
                          // For new posts, status will be saved when post is created
                        }}
                        disabled={savingStatus}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background: postStatus === status ? "rgba(88, 101, 242, 0.2)" : "transparent",
                          border: "none",
                          borderRadius: "6px",
                          color: "#fff",
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: "14px",
                          textTransform: "capitalize",
                          marginBottom: "4px"
                        }}
                        onMouseEnter={(e) => {
                          if (postStatus !== status) {
                            e.currentTarget.style.background = "rgba(88, 101, 242, 0.1)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (postStatus !== status) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="npc-badge npc-badge-outline" type="button">
                  Publish at
                  <span className="npc-badge-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
                      <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
                <button className="npc-badge npc-badge-outline" type="button">
                  <span className="npc-badge-num">{selectedPlatform ? 1 : 0}</span> Platform{selectedPlatform ? "" : "s"}
                </button>
                <button className="npc-badge npc-badge-outline" type="button">
                  <span className="npc-badge-num">
                    {selectedPlatform === "youtube" && user?.youtubeChannelName ? 1 : 
                     selectedPlatform === "linkedin" && user?.linkedinName ? 1 : 0}
                  </span> Account{selectedPlatform ? "" : "s"}
                </button>
              </div>


              <div className="npc-field-group">
                <label className="npc-field-label">Caption</label>
                <textarea 
                  className="npc-textarea" 
                  placeholder="Write a caption..." 
                  value={captionText}
                  onChange={(e) => setCaptionText(e.target.value)}
                />
                <div className="npc-field-icons">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*,video/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFileUpload(Array.from(e.target.files));
                      }
                    }}
                  />
                  <button 
                    className="npc-icon-btn" 
                    title="Upload file" 
                    type="button"
                    onClick={() => {
                      document.getElementById("file-upload")?.click();
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.5 0L10.5 5H9L7.5 2L6 5H4.5L7.5 0Z" fill="currentColor"/>
                      <path d="M2 6V13H13V6H11V12H4V6H2Z" fill="currentColor"/>
                    </svg>
                  </button>
                  {uploadedFiles.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "8px" }}>
                      <span style={{ fontSize: "12px", color: "#666" }}>
                        {uploadedFiles.length} file(s)
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFiles([]);
                          setPreviewImage(null);
                          setPreviewVideo(null);
                          setPreviewType(null);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#ff4444",
                          cursor: "pointer",
                          fontSize: "12px",
                          padding: "2px 4px"
                        }}
                        title="Remove files"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <button className="npc-icon-btn" title="Emoji" type="button">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4.65566 6.20683C5.16987 6.20683 5.58672 5.78997 5.58672 5.27578C5.58672 4.76157 5.16987 4.34473 4.65566 4.34473C4.14145 4.34473 3.72461 4.76157 3.72461 5.27578C3.72461 5.78997 4.14145 6.20683 4.65566 6.20683Z"
                        fill="#0F0F0F"
                      />
                      <path
                        d="M10.5516 5.27578C10.5516 5.78997 10.1347 6.20683 9.62051 6.20683C9.10632 6.20683 8.68945 5.78997 8.68945 5.27578C8.68945 4.76157 9.10632 4.34473 9.62051 4.34473C10.1347 4.34473 10.5516 4.76157 10.5516 5.27578Z"
                        fill="#0F0F0F"
                      />
                      <path
                        d="M5.01447 8.40489C4.84338 8.10355 4.43696 7.9824 4.10227 8.13453C3.76492 8.28783 3.62818 8.66067 3.79686 8.96721C3.85317 9.06925 3.92488 9.1649 4.00006 9.25601C4.1249 9.40733 4.31336 9.60216 4.57861 9.795C5.1178 10.187 5.94908 10.5517 7.13935 10.5517C8.32961 10.5517 9.16092 10.187 9.70009 9.795C9.96534 9.60216 10.1538 9.40733 10.2787 9.25601C10.3541 9.16459 10.4228 9.06894 10.4815 8.9679C10.6485 8.66532 10.5096 8.28591 10.1764 8.13453C9.84173 7.9824 9.43532 8.10355 9.26425 8.40489C9.25483 8.42034 9.1263 8.6225 8.84685 8.8257C8.53243 9.05429 7.99784 9.31032 7.13935 9.31032C6.28085 9.31032 5.74631 9.05429 5.43185 8.8257C5.1524 8.6225 5.0239 8.42034 5.01447 8.40489Z"
                        fill="#0F0F0F"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M7.13808 14.2762C11.0803 14.2762 14.2762 11.0803 14.2762 7.13808C14.2762 3.19583 11.0803 0 7.13808 0C3.19583 0 0 3.19583 0 7.13808C0 11.0803 3.19583 14.2762 7.13808 14.2762ZM7.13808 12.9739C3.91505 12.9739 1.30226 10.3611 1.30226 7.13808C1.30226 3.91505 3.91505 1.30226 7.13808 1.30226C10.3611 1.30226 12.9739 3.91505 12.9739 7.13808C12.9739 10.3611 10.3611 12.9739 7.13808 12.9739Z"
                        fill="#0F0F0F"
                      />
                    </svg>
                  </button>
                  <button className="npc-icon-btn" title="AI" type="button">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.077 5.7298C13.2361 5.25853 13.2913 4.75918 13.2389 4.26516C13.1866 3.77115 13.0278 3.29387 12.7734 2.86528C12.3961 2.217 11.8199 1.70374 11.1278 1.39957C10.4357 1.0954 9.6636 1.01605 8.92285 1.17296C8.58878 0.801432 8.17813 0.504595 7.7184 0.302318C7.25867 0.100042 6.76045 -0.00300755 6.25709 6.68185e-05C5.4998 -0.00172828 4.76149 0.233792 4.14858 0.672678C3.53568 1.11156 3.07984 1.73115 2.84677 2.44212C2.35334 2.54173 1.88719 2.74422 1.47951 3.03602C1.07183 3.32782 0.732034 3.7022 0.48288 4.13408C0.102724 4.78059 -0.0595255 5.52952 0.0195283 6.27289C0.0985822 7.01625 0.414854 7.71564 0.922739 8.2702C0.76367 8.74152 0.708471 9.24093 0.760838 9.73501C0.813204 10.2291 0.971928 10.7064 1.22638 11.1351C1.6037 11.7833 2.17995 12.2965 2.87201 12.6007C3.56408 12.9049 4.33617 12.9842 5.07692 12.8274C5.41108 13.1989 5.8218 13.4957 6.28159 13.6979C6.74138 13.9001 7.23965 14.0031 7.74303 13.9999C8.5007 14.0019 9.2394 13.7663 9.85256 13.3271C10.4657 12.888 10.9216 12.2679 11.1544 11.5565C11.6478 11.4568 12.1139 11.2543 12.5215 10.9625C12.9291 10.6707 13.2688 10.2964 13.518 9.86451C13.8977 9.21807 14.0596 8.46934 13.9804 7.72626C13.9011 6.98317 13.5848 6.2841 13.077 5.7298ZM7.7441 13.0857C7.12202 13.0866 6.51944 12.8716 6.04177 12.4784C6.06341 12.4669 6.10137 12.4466 6.12584 12.4315L8.95087 10.8215C9.02188 10.7817 9.08084 10.7239 9.12169 10.6541C9.16253 10.5844 9.18377 10.5051 9.18322 10.4245V6.49423L10.3772 7.17465C10.3835 7.17771 10.3889 7.18224 10.393 7.18786C10.3971 7.19348 10.3997 7.2 10.4006 7.20686V10.4616C10.3998 11.1569 10.1197 11.8234 9.62164 12.3152C9.12362 12.807 8.44833 13.084 7.74374 13.0853L7.7441 13.0857ZM2.0309 10.6776C1.71939 10.1464 1.60713 9.52408 1.71378 8.91948C1.73506 8.93208 1.77124 8.95413 1.79785 8.96883L4.62287 10.5789C4.69328 10.6195 4.77334 10.6408 4.85486 10.6408C4.93639 10.6408 5.01645 10.6195 5.08685 10.5789L8.5362 8.61391V9.97477C8.5366 9.9817 8.53525 9.98862 8.53228 9.99491C8.52931 10.0012 8.52481 10.0067 8.51917 10.0108L5.66328 11.638C5.05235 11.9852 4.32678 12.0791 3.64579 11.899C2.96481 11.719 2.38403 11.2797 2.0309 10.6776ZM1.28775 4.59225C1.59806 4.06027 2.08817 3.65299 2.67224 3.44176C2.67224 3.46556 2.67082 3.50826 2.67082 3.53766V6.75814C2.67036 6.83856 2.69161 6.91765 2.73238 6.98728C2.77315 7.05691 2.83198 7.11458 2.90281 7.15436L6.3518 9.11933L5.1578 9.79976C5.15189 9.80362 5.14509 9.80596 5.13803 9.80657C5.13097 9.80719 5.12386 9.80605 5.11736 9.80326L2.26076 8.175C1.65091 7.8265 1.206 7.2536 1.0236 6.58192C0.8412 5.91023 0.936194 5.19493 1.28775 4.59225ZM11.0987 6.84529L7.64939 4.87996L8.84374 4.19989C8.84963 4.19611 8.85636 4.19382 8.86334 4.19321C8.87033 4.1926 8.87737 4.19369 8.88383 4.19639L11.7401 5.82325C12.1776 6.07267 12.5341 6.43993 12.7678 6.88202C13.0015 7.32411 13.1028 7.82275 13.0597 8.31955C13.0166 8.81635 12.8309 9.29076 12.5245 9.68723C12.218 10.0837 11.8035 10.3858 11.3293 10.5582V7.24151C11.3299 7.16122 11.3089 7.08221 11.2684 7.01258C11.2279 6.94296 11.1693 6.88522 11.0987 6.84529ZM12.2871 5.08017C12.2595 5.06321 12.2316 5.04676 12.2033 5.03082L9.37796 3.42075C9.30754 3.38023 9.22749 3.35887 9.14597 3.35887C9.06445 3.35887 8.98439 3.38023 8.91398 3.42075L5.46499 5.38573V4.02488C5.46459 4.01795 5.46593 4.01103 5.4689 4.00474C5.47188 3.99845 5.47638 3.99298 5.48202 3.98883L8.33755 2.36301C8.77511 2.11395 9.2755 1.993 9.78018 2.01432C10.2849 2.03564 10.7729 2.19835 11.1873 2.48341C11.6017 2.76847 11.9252 3.16408 12.1201 3.62395C12.3149 4.08382 12.3726 4.58893 12.2871 5.08017ZM4.81549 7.50542L3.62113 6.82499C3.61491 6.8219 3.60955 6.81734 3.60553 6.81173C3.60151 6.80611 3.59895 6.79961 3.59807 6.79279V3.53801C3.59849 3.03958 3.74277 2.55159 4.01402 2.13112C4.28527 1.71065 4.67227 1.3751 5.12974 1.16375C5.5872 0.952389 6.09622 0.873961 6.59721 0.937641C7.09821 1.00132 7.57046 1.20447 7.95871 1.52333C7.93049 1.53842 7.90258 1.55406 7.87499 1.57023L5.04961 3.18029C4.97877 3.22007 4.91994 3.27773 4.87917 3.34737C4.8384 3.417 4.81715 3.49609 4.81762 3.57651L4.81549 7.50542ZM5.46428 6.12531L7.00024 5.24993L8.53691 6.12496V7.87503L7.00059 8.75007L5.46428 7.87503V6.12531Z"
                        fill="black"
                      />
                    </svg>
                  </button>
                  <button className="npc-icon-btn" title="Template" type="button">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.3481 2.14978C13.3481 1.98925 13.3165 1.8303 13.2551 1.68199C13.1936 1.53368 13.1036 1.39892 12.9901 1.28541C12.8766 1.1719 12.7418 1.08184 12.5935 1.02041C12.4452 0.958977 12.2862 0.927357 12.1257 0.927357H4.2572C4.09668 0.927357 3.93772 0.958979 3.78941 1.02041C3.6411 1.08184 3.50634 1.17189 3.39283 1.28541C3.27932 1.39892 3.18926 1.53368 3.12783 1.68199C3.0664 1.8303 3.03478 1.98925 3.03478 2.14978V10.0183C3.03478 10.3425 3.16358 10.6534 3.39283 10.8827C3.50634 10.9962 3.6411 11.0862 3.78941 11.1476C3.93772 11.2091 4.09668 11.2407 4.2572 11.2407H12.1257C12.4499 11.2407 12.7608 11.1119 12.9901 10.8827C13.2193 10.6534 13.3481 10.3425 13.3481 10.0183V2.14978ZM14.2755 10.0183C14.2755 10.5884 14.049 11.1352 13.6458 11.5384C13.2426 11.9416 12.6958 12.168 12.1257 12.168H4.2572C3.97489 12.168 3.69533 12.1125 3.43451 12.0044C3.17369 11.8964 2.9367 11.738 2.73708 11.5384C2.33392 11.1352 2.10742 10.5884 2.10742 10.0183V2.14978C2.10742 1.86747 2.16304 1.58791 2.27107 1.32709C2.37911 1.06627 2.53745 0.829277 2.73708 0.629654C2.9367 0.430032 3.17369 0.271687 3.43451 0.16365C3.69533 0.0556134 3.97489 0 4.2572 0H12.1257C12.408 0 12.6876 0.0556134 12.9484 0.16365C13.2092 0.271686 13.4462 0.430032 13.6458 0.629654C13.8454 0.829279 14.0038 1.06627 14.1118 1.32709C14.2199 1.58791 14.2755 1.86747 14.2755 2.14978V10.0183Z"
                        fill="black"
                      />
                      <path
                        d="M0 10.0194V1.86993C0 1.61385 0.207596 1.40625 0.463679 1.40625C0.719761 1.40625 0.927357 1.61385 0.927357 1.86993V10.0194C0.927361 11.8569 2.41992 13.3495 4.25741 13.3495H12.4069C12.663 13.3495 12.8706 13.5571 12.8706 13.8132C12.8706 14.0692 12.663 14.2768 12.4069 14.2769H4.25741C1.90775 14.2769 3.73689e-06 12.3691 0 10.0194ZM8.19166 7.72914C8.44774 7.72914 8.65534 7.93674 8.65534 8.19282C8.65534 8.4489 8.44774 8.65649 8.19166 8.6565H5.38147C5.1254 8.65649 4.9178 8.4489 4.9178 8.19282C4.9178 7.93674 5.1254 7.72914 5.38147 7.72914H8.19166ZM11.0018 5.62151C11.2579 5.62151 11.4655 5.82911 11.4655 6.08519C11.4655 6.34127 11.2579 6.54887 11.0018 6.54887H5.38147C5.1254 6.54886 4.9178 6.34127 4.9178 6.08519C4.9178 5.82911 5.1254 5.62151 5.38147 5.62151H11.0018ZM11.0018 3.51388C11.2579 3.51388 11.4655 3.72148 11.4655 3.97756C11.4655 4.23364 11.2579 4.44124 11.0018 4.44124H5.38147C5.1254 4.44123 4.9178 4.23364 4.9178 3.97756C4.9178 3.72148 5.1254 3.51388 5.38147 3.51388H11.0018Z"
                        fill="black"
                      />
                    </svg>
                  </button>
                  <button className="npc-icon-btn" title="Music" type="button">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4.65114 12.9264C4.65114 12.7276 4.53028 12.4836 4.20299 12.2654C3.87936 12.0497 3.40212 11.8992 2.84883 11.8992C2.29553 11.8992 1.81829 12.0497 1.49466 12.2654C1.16737 12.4836 1.04651 12.7276 1.04651 12.9264C1.04651 13.1251 1.16736 13.3691 1.49466 13.5873C1.81829 13.803 2.29553 13.9535 2.84883 13.9535C3.40212 13.9535 3.87936 13.803 4.20299 13.5873C4.53029 13.3691 4.65114 13.1251 4.65114 12.9264ZM13.9534 11.376C13.9534 11.1772 13.8326 10.9332 13.5053 10.7151C13.1817 10.4993 12.7044 10.3488 12.1511 10.3488C11.5978 10.3488 11.1206 10.4993 10.7969 10.7151C10.4696 10.9332 10.3488 11.1772 10.3488 11.376C10.3488 11.5747 10.4696 11.8187 10.7969 12.0369C11.1206 12.2526 11.5978 12.4031 12.1511 12.4031C12.7044 12.4031 13.1817 12.2526 13.5053 12.0369C13.8326 11.8187 13.9534 11.5747 13.9534 11.376ZM5.69765 2.51691V4.55672L13.9534 3.18077V1.14096L5.69765 2.51691ZM14.9996 11.4067C14.9874 12.05 14.5922 12.5701 14.0858 12.9076C13.5678 13.253 12.8822 13.4496 12.1511 13.4496C11.42 13.4496 10.7345 13.253 10.2164 12.9076C9.70202 12.5647 9.30229 12.0335 9.30229 11.376C9.30229 10.7185 9.70202 10.1872 10.2164 9.8443C10.7345 9.49893 11.42 9.30233 12.1511 9.30233C12.8215 9.30233 13.4536 9.46768 13.9534 9.76145V4.24172L5.69765 5.6177V12.9264L5.69736 12.9571C5.68513 13.6004 5.28986 14.1205 4.7835 14.458C4.26545 14.8034 3.5799 15 2.84883 15C2.11775 15 1.4322 14.8034 0.91415 14.458C0.399751 14.1151 0 13.5839 0 12.9264C2.87691e-06 12.2688 0.399755 11.7376 0.91415 11.3947C1.4322 11.0493 2.11775 10.8527 2.84883 10.8527C3.51924 10.8527 4.15136 11.0181 4.65114 11.3118V5.18249C4.65105 5.17693 4.65106 5.17139 4.65114 5.16586V2.07366C4.65114 1.81788 4.83607 1.59957 5.08837 1.55752L14.3907 0.00712194C14.5424 -0.0181642 14.6975 0.0245975 14.8149 0.124014C14.9323 0.223434 14.9999 0.369457 14.9999 0.523269V3.61672C15 3.62203 15 3.62732 14.9999 3.6326V11.376L14.9996 11.4067Z"
                        fill="black"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="npc-field-group">
                <label className="npc-field-label">Link</label>
                <input 
                  className="npc-input" 
                  placeholder="https://..." 
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                />
              </div>

              <div className="npc-field-group">
                <label className="npc-field-label">Comment</label>
                <textarea 
                  className="npc-textarea" 
                  placeholder="Write a first comment..." 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div className="npc-field-icons">
                  <button className="npc-icon-btn" title="Emoji" type="button">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4.65566 6.20683C5.16987 6.20683 5.58672 5.78997 5.58672 5.27578C5.58672 4.76157 5.16987 4.34473 4.65566 4.34473C4.14145 4.34473 3.72461 4.76157 3.72461 5.27578C3.72461 5.78997 4.14145 6.20683 4.65566 6.20683Z"
                        fill="#0F0F0F"
                      />
                      <path
                        d="M10.5516 5.27578C10.5516 5.78997 10.1347 6.20683 9.62051 6.20683C9.10632 6.20683 8.68945 5.78997 8.68945 5.27578C8.68945 4.76157 9.10632 4.34473 9.62051 4.34473C10.1347 4.34473 10.5516 4.76157 10.5516 5.27578Z"
                        fill="#0F0F0F"
                      />
                      <path
                        d="M5.01447 8.40489C4.84338 8.10355 4.43696 7.9824 4.10227 8.13453C3.76492 8.28783 3.62818 8.66067 3.79686 8.96721C3.85317 9.06925 3.92488 9.1649 4.00006 9.25601C4.1249 9.40733 4.31336 9.60216 4.57861 9.795C5.1178 10.187 5.94908 10.5517 7.13935 10.5517C8.32961 10.5517 9.16092 10.187 9.70009 9.795C9.96534 9.60216 10.1538 9.40733 10.2787 9.25601C10.3541 9.16459 10.4228 9.06894 10.4815 8.9679C10.6485 8.66532 10.5096 8.28591 10.1764 8.13453C9.84173 7.9824 9.43532 8.10355 9.26425 8.40489C9.25483 8.42034 9.1263 8.6225 8.84685 8.8257C8.53243 9.05429 7.99784 9.31032 7.13935 9.31032C6.28085 9.31032 5.74631 9.05429 5.43185 8.8257C5.1524 8.6225 5.0239 8.42034 5.01447 8.40489Z"
                        fill="#0F0F0F"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M7.13808 14.2762C11.0803 14.2762 14.2762 11.0803 14.2762 7.13808C14.2762 3.19583 11.0803 0 7.13808 0C3.19583 0 0 3.19583 0 7.13808C0 11.0803 3.19583 14.2762 7.13808 14.2762ZM7.13808 12.9739C3.91505 12.9739 1.30226 10.3611 1.30226 7.13808C1.30226 3.91505 3.91505 1.30226 7.13808 1.30226C10.3611 1.30226 12.9739 3.91505 12.9739 7.13808C12.9739 10.3611 10.3611 12.9739 7.13808 12.9739Z"
                        fill="#0F0F0F"
                      />
                    </svg>
                  </button>
                  <button className="npc-icon-btn" title="AI" type="button">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.077 5.7298C13.2361 5.25853 13.2913 4.75918 13.2389 4.26516C13.1866 3.77115 13.0278 3.29387 12.7734 2.86528C12.3961 2.217 11.8199 1.70374 11.1278 1.39957C10.4357 1.0954 9.6636 1.01605 8.92285 1.17296C8.58878 0.801432 8.17813 0.504595 7.7184 0.302318C7.25867 0.100042 6.76045 -0.00300755 6.25709 6.68185e-05C5.4998 -0.00172828 4.76149 0.233792 4.14858 0.672678C3.53568 1.11156 3.07984 1.73115 2.84677 2.44212C2.35334 2.54173 1.88719 2.74422 1.47951 3.03602C1.07183 3.32782 0.732034 3.7022 0.48288 4.13408C0.102724 4.78059 -0.0595255 5.52952 0.0195283 6.27289C0.0985822 7.01625 0.414854 7.71564 0.922739 8.2702C0.76367 8.74152 0.708471 9.24093 0.760838 9.73501C0.813204 10.2291 0.971928 10.7064 1.22638 11.1351C1.6037 11.7833 2.17995 12.2965 2.87201 12.6007C3.56408 12.9049 4.33617 12.9842 5.07692 12.8274C5.41108 13.1989 5.8218 13.4957 6.28159 13.6979C6.74138 13.9001 7.23965 14.0031 7.74303 13.9999C8.5007 14.0019 9.2394 13.7663 9.85256 13.3271C10.4657 12.888 10.9216 12.2679 11.1544 11.5565C11.6478 11.4568 12.1139 11.2543 12.5215 10.9625C12.9291 10.6707 13.2688 10.2964 13.518 9.86451C13.8977 9.21807 14.0596 8.46934 13.9804 7.72626C13.9011 6.98317 13.5848 6.2841 13.077 5.7298ZM7.7441 13.0857C7.12202 13.0866 6.51944 12.8716 6.04177 12.4784C6.06341 12.4669 6.10137 12.4466 6.12584 12.4315L8.95087 10.8215C9.02188 10.7817 9.08084 10.7239 9.12169 10.6541C9.16253 10.5844 9.18377 10.5051 9.18322 10.4245V6.49423L10.3772 7.17465C10.3835 7.17771 10.3889 7.18224 10.393 7.18786C10.3971 7.19348 10.3997 7.2 10.4006 7.20686V10.4616C10.3998 11.1569 10.1197 11.8234 9.62164 12.3152C9.12362 12.807 8.44833 13.084 7.74374 13.0853L7.7441 13.0857ZM2.0309 10.6776C1.71939 10.1464 1.60713 9.52408 1.71378 8.91948C1.73506 8.93208 1.77124 8.95413 1.79785 8.96883L4.62287 10.5789C4.69328 10.6195 4.77334 10.6408 4.85486 10.6408C4.93639 10.6408 5.01645 10.6195 5.08685 10.5789L8.5362 8.61391V9.97477C8.5366 9.9817 8.53525 9.98862 8.53228 9.99491C8.52931 10.0012 8.52481 10.0067 8.51917 10.0108L5.66328 11.638C5.05235 11.9852 4.32678 12.0791 3.64579 11.899C2.96481 11.719 2.38403 11.2797 2.0309 10.6776ZM1.28775 4.59225C1.59806 4.06027 2.08817 3.65299 2.67224 3.44176C2.67224 3.46556 2.67082 3.50826 2.67082 3.53766V6.75814C2.67036 6.83856 2.69161 6.91765 2.73238 6.98728C2.77315 7.05691 2.83198 7.11458 2.90281 7.15436L6.3518 9.11933L5.1578 9.79976C5.15189 9.80362 5.14509 9.80596 5.13803 9.80657C5.13097 9.80719 5.12386 9.80605 5.11736 9.80326L2.26076 8.175C1.65091 7.8265 1.206 7.2536 1.0236 6.58192C0.8412 5.91023 0.936194 5.19493 1.28775 4.59225ZM11.0987 6.84529L7.64939 4.87996L8.84374 4.19989C8.84963 4.19611 8.85636 4.19382 8.86334 4.19321C8.87033 4.1926 8.87737 4.19369 8.88383 4.19639L11.7401 5.82325C12.1776 6.07267 12.5341 6.43993 12.7678 6.88202C13.0015 7.32411 13.1028 7.82275 13.0597 8.31955C13.0166 8.81635 12.8309 9.29076 12.5245 9.68723C12.218 10.0837 11.8035 10.3858 11.3293 10.5582V7.24151C11.3299 7.16122 11.3089 7.08221 11.2684 7.01258C11.2279 6.94296 11.1693 6.88522 11.0987 6.84529ZM12.2871 5.08017C12.2595 5.06321 12.2316 5.04676 12.2033 5.03082L9.37796 3.42075C9.30754 3.38023 9.22749 3.35887 9.14597 3.35887C9.06445 3.35887 8.98439 3.38023 8.91398 3.42075L5.46499 5.38573V4.02488C5.46459 4.01795 5.46593 4.01103 5.4689 4.00474C5.47188 3.99845 5.47638 3.99298 5.48202 3.98883L8.33755 2.36301C8.77511 2.11395 9.2755 1.993 9.78018 2.01432C10.2849 2.03564 10.7729 2.19835 11.1873 2.48341C11.6017 2.76847 11.9252 3.16408 12.1201 3.62395C12.3149 4.08382 12.3726 4.58893 12.2871 5.08017ZM4.81549 7.50542L3.62113 6.82499C3.61491 6.8219 3.60955 6.81734 3.60553 6.81173C3.60151 6.80611 3.59895 6.79961 3.59807 6.79279V3.53801C3.59849 3.03958 3.74277 2.55159 4.01402 2.13112C4.28527 1.71065 4.67227 1.3751 5.12974 1.16375C5.5872 0.952389 6.09622 0.873961 6.59721 0.937641C7.09821 1.00132 7.57046 1.20447 7.95871 1.52333C7.93049 1.53842 7.90258 1.55406 7.87499 1.57023L5.04961 3.18029C4.97877 3.22007 4.91994 3.27773 4.87917 3.34737C4.8384 3.417 4.81715 3.49609 4.81762 3.57651L4.81549 7.50542ZM5.46428 6.12531L7.00024 5.24993L8.53691 6.12496V7.87503L7.00059 8.75007L5.46428 7.87503V6.12531Z"
                        fill="black"
                      />
                    </svg>
                  </button>
                  <button className="npc-icon-btn" title="Template" type="button">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.3481 2.14978C13.3481 1.98925 13.3165 1.8303 13.2551 1.68199C13.1936 1.53368 13.1036 1.39892 12.9901 1.28541C12.8766 1.1719 12.7418 1.08184 12.5935 1.02041C12.4452 0.958977 12.2862 0.927357 12.1257 0.927357H4.2572C4.09668 0.927357 3.93772 0.958979 3.78941 1.02041C3.6411 1.08184 3.50634 1.17189 3.39283 1.28541C3.27932 1.39892 3.18926 1.53368 3.12783 1.68199C3.0664 1.8303 3.03478 1.98925 3.03478 2.14978V10.0183C3.03478 10.3425 3.16358 10.6534 3.39283 10.8827C3.50634 10.9962 3.6411 11.0862 3.78941 11.1476C3.93772 11.2091 4.09668 11.2407 4.2572 11.2407H12.1257C12.4499 11.2407 12.7608 11.1119 12.9901 10.8827C13.2193 10.6534 13.3481 10.3425 13.3481 10.0183V2.14978ZM14.2755 10.0183C14.2755 10.5884 14.049 11.1352 13.6458 11.5384C13.2426 11.9416 12.6958 12.168 12.1257 12.168H4.2572C3.97489 12.168 3.69533 12.1125 3.43451 12.0044C3.17369 11.8964 2.9367 11.738 2.73708 11.5384C2.33392 11.1352 2.10742 10.5884 2.10742 10.0183V2.14978C2.10742 1.86747 2.16304 1.58791 2.27107 1.32709C2.37911 1.06627 2.53745 0.829277 2.73708 0.629654C2.9367 0.430032 3.17369 0.271687 3.43451 0.16365C3.69533 0.0556134 3.97489 0 4.2572 0H12.1257C12.408 0 12.6876 0.0556134 12.9484 0.16365C13.2092 0.271686 13.4462 0.430032 13.6458 0.629654C13.8454 0.829279 14.0038 1.06627 14.1118 1.32709C14.2199 1.58791 14.2755 1.86747 14.2755 2.14978V10.0183Z"
                        fill="black"
                      />
                      <path
                        d="M0 10.0194V1.86993C0 1.61385 0.207596 1.40625 0.463679 1.40625C0.719761 1.40625 0.927357 1.61385 0.927357 1.86993V10.0194C0.927361 11.8569 2.41992 13.3495 4.25741 13.3495H12.4069C12.663 13.3495 12.8706 13.5571 12.8706 13.8132C12.8706 14.0692 12.663 14.2768 12.4069 14.2769H4.25741C1.90775 14.2769 3.73689e-06 12.3691 0 10.0194ZM8.19166 7.72914C8.44774 7.72914 8.65534 7.93674 8.65534 8.19282C8.65534 8.4489 8.44774 8.65649 8.19166 8.6565H5.38147C5.1254 8.65649 4.9178 8.4489 4.9178 8.19282C4.9178 7.93674 5.1254 7.72914 5.38147 7.72914H8.19166ZM11.0018 5.62151C11.2579 5.62151 11.4655 5.82911 11.4655 6.08519C11.4655 6.34127 11.2579 6.54887 11.0018 6.54887H5.38147C5.1254 6.54886 4.9178 6.34127 4.9178 6.08519C4.9178 5.82911 5.1254 5.62151 5.38147 5.62151H11.0018ZM11.0018 3.51388C11.2579 3.51388 11.4655 3.72148 11.4655 3.97756C11.4655 4.23364 11.2579 4.44124 11.0018 4.44124H5.38147C5.1254 4.44123 4.9178 4.23364 4.9178 3.97756C4.9178 3.72148 5.1254 3.51388 5.38147 3.51388H11.0018Z"
                        fill="black"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="npc-platforms-row">
                {user?.youtubeChannelName && (
                  <button 
                    className={`npc-platform-btn ${selectedPlatform === "youtube" ? "active" : ""}`}
                    type="button" 
                    title="YouTube"
                    onClick={() => {
                      setSelectedPlatform(selectedPlatform === "youtube" ? null : "youtube");
                    }}
                  >
                  <img src="/Youtube-Icon.svg" alt="YouTube" />
                </button>
                )}
                {user?.linkedinName && (
                  <button 
                    className={`npc-platform-btn ${selectedPlatform === "linkedin" ? "active" : ""}`}
                    type="button" 
                    title="LinkedIn"
                    onClick={() => {
                      setSelectedPlatform(selectedPlatform === "linkedin" ? null : "linkedin");
                    }}
                  >
                  <img src="/Linkedin-Icon.svg" alt="LinkedIn" />
                </button>
                )}
                {(!user?.youtubeChannelName && !user?.linkedinName) && (
                  <div style={{ padding: "16px", textAlign: "center", color: "#666", width: "100%" }}>
                    Please connect YouTube or LinkedIn account first to create posts.
                  </div>
                )}
              </div>

              <div className="npc-custom-section">
                <span className="npc-custom-label">Custom</span>
                <div className="npc-radio-row">
                  {["Post", "Reel", "Story", "Link"].map((label) => (
                    <label key={label} className="npc-radio-label">
                      <input type="radio" name="contentType" className="npc-radio" defaultChecked={label === "Post"} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="npc-content-section">
                <span className="npc-content-label">Content</span>
                <div className="npc-toggle-row">
                  <span className="npc-toggle-text">Files</span>
                  <button type="button" className="npc-toggle on">
                    <span className="npc-toggle-knob" />
                  </button>
                  <span className="npc-toggle-text">Caption</span>
                  <button type="button" className="npc-toggle">
                    <span className="npc-toggle-knob" />
                  </button>
                  <span className="npc-toggle-text">Comment</span>
                  <button type="button" className="npc-toggle">
                    <span className="npc-toggle-knob" />
                  </button>
                </div>
              </div>
            </div>

            <div className="npc-right">
              {selectedPlatform === "youtube" && (
              <div className="npc-preview-card">
                  <h3 className="npc-preview-title">YouTube Preview</h3>
                  <div className="npc-preview-post" style={{ background: "#000", color: "#fff", padding: "16px", borderRadius: "8px" }}>
                    <div className="npc-preview-post-header" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                      <div className="npc-preview-avatar" style={{ width: "40px", height: "40px", borderRadius: "50%", overflow: "hidden" }}>
                        <img
                          src={
                            user?.youtubeChannelLogo && user.youtubeChannelLogo.trim()
                              ? (user.youtubeChannelLogo.startsWith("http")
                                  ? user.youtubeChannelLogo
                                  : user.youtubeChannelLogo.startsWith("//")
                                    ? `https:${user.youtubeChannelLogo}`
                                    : `https://${user.youtubeChannelLogo.replace(/^https?:\/\//, "")}`)
                              : "/Youtube-Icon.svg"
                          }
                          alt={user?.youtubeChannelName || "YouTube Channel"}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            // Fallback to local icon if remote logo fails (e.g. yt3.ggpht.com blocked)
                            if (target.src !== window.location.origin + "/Youtube-Icon.svg") {
                              // eslint-disable-next-line no-console
                              console.error("Failed to load YouTube channel logo, falling back to default icon:", user?.youtubeChannelLogo);
                              target.src = "/Youtube-Icon.svg";
                            }
                          }}
                        />
                    </div>
                      <div className="npc-preview-name" style={{ fontWeight: 600, fontSize: "14px", color: "#fff" }}>
                        {user?.youtubeChannelName || "YouTube Channel"}
                  </div>
                  </div>
                    {(previewImage || previewVideo) ? (
                      <div 
                        className="npc-preview-image-area" 
                        style={{ 
                          marginBottom: "12px", 
                          borderRadius: "8px", 
                          overflow: "hidden",
                          position: "relative"
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.opacity = "0.7";
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.style.opacity = "1";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.opacity = "1";
                          const files = Array.from(e.dataTransfer.files);
                          handleFileUpload(files);
                        }}
                      >
                        {previewVideo ? (
                          <video 
                            src={previewVideo} 
                            controls 
                            style={{ width: "100%", display: "block", maxHeight: "400px" }}
                          />
                        ) : (
                          <img src={previewImage || ""} alt="preview" style={{ width: "100%", display: "block" }} />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedFiles([]);
                            setPreviewImage(null);
                            setPreviewVideo(null);
                            setPreviewType(null);
                          }}
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            background: "rgba(0,0,0,0.7)",
                            color: "white",
                            border: "none",
                            borderRadius: "50%",
                            width: "28px",
                            height: "28px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px"
                          }}
                        >
                          ×
                        </button>
                    </div>
                    ) : (
                      <div 
                        className="npc-preview-image-area" 
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.background = "#2a2a2a";
                          e.currentTarget.style.border = "2px dashed #fff";
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.style.background = "#1a1a1a";
                          e.currentTarget.style.border = "2px dashed transparent";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.background = "#1a1a1a";
                          e.currentTarget.style.border = "2px dashed transparent";
                          const files = Array.from(e.dataTransfer.files);
                          handleFileUpload(files);
                        }}
                        onClick={() => {
                          document.getElementById("file-upload")?.click();
                        }}
                        style={{ 
                          marginBottom: "12px", 
                          borderRadius: "8px", 
                          background: "#1a1a1a", 
                          aspectRatio: "16/9",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#666",
                          cursor: "pointer",
                          border: "2px dashed transparent",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{ textAlign: "center", padding: "20px" }}>
                          <div style={{ fontSize: "14px", marginBottom: "8px", color: "#fff" }}>Drag & Drop files here</div>
                          <div style={{ fontSize: "12px", color: "#888" }}>or click to browse</div>
                  </div>
                  </div>
                    )}
                    <div className="npc-preview-caption" style={{ fontSize: "14px", lineHeight: "1.5", color: "#fff" }}>
                      {captionText || <span style={{ color: "#666" }}>Write a caption...</span>}
                </div>
              </div>
                </div>
              )}
              
              {selectedPlatform === "linkedin" && (
                <div className="npc-preview-card">
                  <h3 className="npc-preview-title">LinkedIn Preview</h3>
                  <div className="npc-preview-post" style={{ background: "#fff", border: "1px solid #e0e0e0", padding: "16px", borderRadius: "8px" }}>
                    <div className="npc-preview-post-header" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                      <div className="npc-preview-avatar" style={{ width: "40px", height: "40px", borderRadius: "50%", overflow: "hidden" }}>
                        <img 
                          src={user?.linkedinLogo || "/Linkedin-Icon.svg"} 
                          alt="avatar" 
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      <div>
                        <div className="npc-preview-name" style={{ fontWeight: 600, fontSize: "14px", color: "#000" }}>
                          {user?.linkedinName || "LinkedIn Account"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666" }}>Professional</div>
                      </div>
                    </div>
                    {(previewImage || previewVideo) ? (
                      <div 
                        className="npc-preview-image-area" 
                        style={{ 
                          marginBottom: "12px", 
                          borderRadius: "8px", 
                          overflow: "hidden",
                          position: "relative"
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.opacity = "0.7";
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.style.opacity = "1";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.opacity = "1";
                          const files = Array.from(e.dataTransfer.files);
                          handleFileUpload(files);
                        }}
                      >
                        {previewVideo ? (
                          <video 
                            src={previewVideo} 
                            controls 
                            style={{ width: "100%", display: "block", maxHeight: "400px" }}
                          />
                        ) : (
                          <img src={previewImage || ""} alt="preview" style={{ width: "100%", display: "block" }} />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedFiles([]);
                            setPreviewImage(null);
                            setPreviewVideo(null);
                            setPreviewType(null);
                          }}
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            background: "rgba(0,0,0,0.7)",
                            color: "white",
                            border: "none",
                            borderRadius: "50%",
                            width: "28px",
                            height: "28px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px"
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="npc-preview-image-area"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.background = "#f5f5f5";
                          e.currentTarget.style.border = "2px dashed #0077b5";
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.style.background = "#fafafa";
                          e.currentTarget.style.border = "2px dashed transparent";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.background = "#fafafa";
                          e.currentTarget.style.border = "2px dashed transparent";
                          const files = Array.from(e.dataTransfer.files);
                          handleFileUpload(files);
                        }}
                        onClick={() => {
                          document.getElementById("file-upload")?.click();
                        }}
                        style={{ 
                          marginBottom: "12px", 
                          borderRadius: "8px", 
                          background: "#fafafa", 
                          aspectRatio: "16/9",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#999",
                          cursor: "pointer",
                          border: "2px dashed transparent",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{ textAlign: "center", padding: "20px" }}>
                          <div style={{ fontSize: "14px", marginBottom: "8px", color: "#666" }}>Drag & Drop files here</div>
                          <div style={{ fontSize: "12px", color: "#999" }}>or click to browse</div>
                        </div>
                      </div>
                    )}
                    <div className="npc-preview-caption" style={{ fontSize: "14px", lineHeight: "1.5", color: "#000" }}>
                      {captionText || <span style={{ color: "#999" }}>What do you want to talk about?</span>}
                    </div>
                    <div style={{ display: "flex", gap: "16px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e0e0e0", color: "#666", fontSize: "14px" }}>
                      <span>👍 Like</span>
                      <span>💬 Comment</span>
                      <span>↗ Share</span>
                    </div>
                  </div>
                </div>
              )}
              
              {!selectedPlatform && (
                <div className="npc-preview-card">
                  <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                    <p>Select a platform (YouTube or LinkedIn) to see preview</p>
                  </div>
                </div>
              )}

              <div className="npc-bottom-actions">
                <button className="npc-draft-btn" type="button" onClick={() => {
                  setShowComposer(false);
                  setCurrentPostId(null);
                  setPostStatus("draft");
                  setCaptionText("");
                  setLinkText("");
                  setCommentText("");
                  setUploadedFiles([]);
                  setPreviewImage(null);
                  setPreviewVideo(null);
                  setPreviewType(null);
                  setSelectedPlatform(null);
                }}>
                  Close &amp; keep as draft
                </button>
                <button 
                  className="npc-post-btn" 
                  type="button"
                  onClick={async () => {
                    // Check if platform is selected
                    if (!selectedPlatform) {
                      alert('Please select a platform (YouTube or LinkedIn)');
                      return;
                    }
                    
                    try {
                      // Create FormData for file upload
                      const formData = new FormData();
                      formData.append('platform', selectedPlatform);
                      formData.append('content', captionText);
                      formData.append('link', linkText);
                      formData.append('comment', commentText);
                      formData.append('status', postStatus === 'published' ? 'processing' : postStatus); // Start as processing if published, otherwise use selected status
                      formData.append('postStatus', postStatus);
                      
                      // Append files if any
                      uploadedFiles.forEach((file) => {
                        formData.append('files', file);
                      });
                      
                      // Check if editing existing post or creating new one
                      const isEdit = currentPostId !== null;
                      
                      let response;
                      if (isEdit) {
                        // Update existing post
                        response = await fetch(`/api/posts/${currentPostId}`, {
                          method: 'PATCH',
                          body: formData,
                        });
                      } else {
                        // Create new post
                        response = await fetch('/api/posts/create', {
                          method: 'POST',
                          body: formData,
                        });
                      }
                      
                      if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || errorData.error || `Failed to ${isEdit ? 'update' : 'create'} post for ${selectedPlatform}`);
                      }
                      
                      const postData = await response.json();
                      const createdPost = postData.data;
                      
                      if (isEdit) {
                        alert('Post updated successfully!');
                        // Refresh posts list
                        const refreshResponse = await fetch(`/api/posts?status=${activeTab.toLowerCase()}`);
                        if (refreshResponse.ok) {
                          const refreshData = await refreshResponse.json();
                          setPosts(refreshData.data || []);
                        }
                        setShowComposer(false);
                        setEditingPost(null);
                        setCurrentPostId(null);
                        setCaptionText("");
                        setLinkText("");
                        setCommentText("");
                        setUploadedFiles([]);
                        setPreviewImage(null);
                        setPreviewVideo(null);
                        setPreviewType(null);
                        setSelectedPlatform(null);
                        setPostStatus("draft");
                        return;
                      }
                      
                      // Set current post ID for status updates (only for new posts)
                      if (createdPost?._id) {
                        setCurrentPostId(createdPost._id);
                      }
                      
                      // Show success message
                      alert('Post created successfully! Uploading to social media...');
                      
                      // Start polling to check upload status
                      const pollPostStatus = async (postId: string) => {
                        const maxAttempts = 60; // 5 minutes (5 seconds * 60)
                        let attempts = 0;
                        
                        const checkStatus = async () => {
                          try {
                            const statusResponse = await fetch(`/api/posts/${postId}`);
                            if (statusResponse.ok) {
                              const statusData = await statusResponse.json();
                              const post = statusData.data;
                              
                              // If post is published or failed, stop polling
                              if (post.status === 'published' || post.status === 'failed') {
                                if (post.status === 'published') {
                                  alert('Post uploaded to social media successfully!');
                                } else {
                                  alert('Post upload failed. Please try again.');
                                }
                                
                                // Refresh posts list
                                const refreshResponse = await fetch(`/api/posts?status=${activeTab.toLowerCase()}`);
                                if (refreshResponse.ok) {
                                  const refreshData = await refreshResponse.json();
                                  setPosts(refreshData.data || []);
                                }
                                return;
                              }
                              
                              // If still processing, continue polling
                              if (post.status === 'processing' && attempts < maxAttempts) {
                                attempts++;
                                setTimeout(checkStatus, 5000); // Check every 5 seconds
                              } else if (attempts >= maxAttempts) {
                                alert('Upload is taking longer than expected. Please check manually.');
                                
                                // Refresh posts list
                                const refreshResponse = await fetch(`/api/posts?status=${activeTab.toLowerCase()}`);
                                if (refreshResponse.ok) {
                                  const refreshData = await refreshResponse.json();
                                  setPosts(refreshData.data || []);
                                }
                              }
                            }
                          } catch (error) {
                            console.error('Error checking post status:', error);
                            // Continue polling even on error
                            if (attempts < maxAttempts) {
                              attempts++;
                              setTimeout(checkStatus, 5000);
                            }
                          }
                        };
                        
                        // Start polling immediately, then continue every 5 seconds
                        checkStatus();
                      };
                      
                      // Start polling if post was created (not edited) and has video file
                      if (!isEdit && createdPost?._id && uploadedFiles.some(f => f.type?.startsWith("video/"))) {
                        // Only set to processing if not already set by the API
                        // The API already sets status to processing for video uploads
                        if (postStatus === "published") {
                          // Start polling immediately to check upload status
                          pollPostStatus(createdPost._id);
                        } else {
                          // For other statuses, also poll to track any status changes
                          pollPostStatus(createdPost._id);
                        }
                      } else if (!isEdit && createdPost?._id && postStatus === "published" && selectedPlatform === "youtube") {
                        // Even if no video file, poll for YouTube posts to check status
                        pollPostStatus(createdPost._id);
                      }
                      
                      setShowComposer(false);
                      setSelectedPlatform(null);
                      setEditingPost(null);
                      setCurrentPostId(null);
                      setCaptionText("");
                      setLinkText("");
                      setCommentText("");
                      setUploadedFiles([]);
                      setPreviewImage(null);
                      setPreviewVideo(null);
                      setPreviewType(null);
                      setPostStatus("draft");
                      setUploadedFiles([]);
                      setPreviewImage(null);
                      setPreviewVideo(null);
                      setPreviewType(null);
                      setCaptionText("");
                      setLinkText("");
                      setCommentText("");
                      
                      // Refresh posts list immediately
                      const refreshResponse = await fetch(`/api/posts?status=${activeTab.toLowerCase()}`);
                      if (refreshResponse.ok) {
                        const refreshData = await refreshResponse.json();
                        setPosts(refreshData.data || []);
                      }
                    } catch (error) {
                      console.error('Error creating post:', error);
                      alert(error instanceof Error ? error.message : 'Failed to create post. Please try again.');
                    }
                  }}
                >
                  Post Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

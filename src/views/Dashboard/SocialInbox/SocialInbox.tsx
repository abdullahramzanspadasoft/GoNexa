"use client";

import { useMemo, useState, useEffect } from "react";

type SocialConversation = {
  id: string;
  conversationId?: string;
  name: string;
  handle: string;
  avatarGradient: string;
  lastMessage: string;
  time: string;
  unread?: boolean;
};

type ConnectedAccount = {
  platform: "linkedin" | "youtube";
  name: string;
  id: string;
  logo?: string;
};

export function SocialInbox() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<ConnectedAccount | null>(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [conversations, setConversations] = useState<SocialConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [inboxError, setInboxError] = useState<string | null>(null);

  // Fetch connected accounts on mount
  useEffect(() => {
    const fetchConnectedAccounts = async () => {
      try {
        const response = await fetch("/api/user/me");
        if (response.ok) {
          const data = await response.json();
          const accounts: ConnectedAccount[] = [];
          
          if (data.data?.linkedinId && data.data?.linkedinName) {
            accounts.push({
              platform: "linkedin",
              name: data.data.linkedinName,
              id: data.data.linkedinId,
              logo: data.data.linkedinLogo,
            });
          }
          
          if (data.data?.youtubeChannelId && data.data?.youtubeChannelName) {
            accounts.push({
              platform: "youtube",
              name: data.data.youtubeChannelName,
              id: data.data.youtubeChannelId,
              logo: data.data.youtubeChannelLogo,
            });
          }
          
          setConnectedAccounts(accounts);
          if (accounts.length > 0 && !selectedAccount) {
            setSelectedAccount(accounts[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching connected accounts:", error);
      }
    };
    
    fetchConnectedAccounts();
  }, []);

  // Fetch messages when account is selected
  useEffect(() => {
    if (selectedAccount) {
      fetchMessages(selectedAccount);
    }
  }, [selectedAccount]);

  // Fetch conversation messages when conversation is selected
  useEffect(() => {
    if (selectedId && selectedAccount) {
      fetchConversationMessages(selectedId, selectedAccount.platform);
    } else {
      setMessages([]);
    }
  }, [selectedId, selectedAccount]);

  const fetchMessages = async (account: ConnectedAccount) => {
    setLoading(true);
    setInboxError(null);
    try {
      const response = await fetch(`/api/inbox/messages?platform=${account.platform}&accountId=${account.id}`);
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const conversationsData = Array.isArray(data.data) ? data.data : [];
        setConversations(conversationsData);
        if (conversationsData.length > 0) {
          setSelectedId(conversationsData[0].id);
        } else {
          setSelectedId(null);
        }

        if (data?.message && conversationsData.length === 0) {
          setInboxError(String(data.message));
        } else {
          setInboxError(null);
        }
      } else {
        const fallbackMessage =
          typeof data?.message === "string"
            ? data.message
            : "Failed to load inbox messages for this account.";
        setInboxError(fallbackMessage);
        setConversations([]);
        setSelectedId(null);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setInboxError("Unable to load inbox messages right now. Please try again.");
      setConversations([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationMessages = async (conversationId: string, platform: string) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/inbox/conversation?conversationId=${encodeURIComponent(conversationId)}&platform=${platform}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedId || !selectedAccount || sendingMessage) {
      return;
    }

    setSendingMessage(true);
    try {
      const selectedConv = conversations.find(c => c.id === selectedId);
      const response = await fetch("/api/inbox/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: selectedAccount.platform,
          conversationId: selectedConv?.conversationId || selectedId,
          message: message.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh messages after sending
        if (selectedId && selectedAccount) {
          await fetchConversationMessages(selectedId, selectedAccount.platform);
        }
        setMessage("");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
      );
    });
  }, [query, conversations]);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? conversations[0],
    [selectedId, conversations]
  );

  return (
    <div className="social-inbox-page">
      <div className="social-inbox-topbar">
        <div className="social-inbox-breadcrumb">
          <span className="social-inbox-breadcrumb-title">Social Inbox</span>
          <span className="social-inbox-breadcrumb-sep">›</span>
        </div>

        <div style={{ position: "relative" }}>
          <button 
            type="button" 
            className="social-inbox-account"
            onClick={(e) => {
              e.stopPropagation();
              setShowAccountDropdown(!showAccountDropdown);
            }}
          >
          <span className="social-inbox-account-avatar" aria-hidden="true" />
            <span className="social-inbox-account-name">
              {selectedAccount ? selectedAccount.name : "Select Account"}
            </span>
          <svg
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="social-inbox-account-caret"
          >
            <path
              d="M1 1L5 5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
          {showAccountDropdown && connectedAccounts.length > 0 && (
            <div 
              className="account-dropdown"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "8px",
                background: "#ffffff",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "8px",
                minWidth: "200px",
                zIndex: 10000,
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
                maxHeight: "300px",
                overflowY: "auto"
              }}
            >
              {connectedAccounts.map((account) => (
                <button
                  key={`${account.platform}-${account.id}`}
                  type="button"
                  onClick={() => {
                    setSelectedAccount(account);
                    setShowAccountDropdown(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: selectedAccount?.platform === account.platform && selectedAccount?.id === account.id ? "#f5f5f5" : "transparent",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    textAlign: "left",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    if (selectedAccount?.platform !== account.platform || selectedAccount?.id !== account.id) {
                      e.currentTarget.style.background = "#f9f9f9";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedAccount?.platform !== account.platform || selectedAccount?.id !== account.id) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: account.platform === "linkedin" ? "#0077b5" : "#FF0000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    {account.platform === "linkedin" ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#000", marginBottom: "2px" }}>
                      {account.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", textTransform: "capitalize" }}>
                      {account.platform}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="social-inbox-layout">
        <section className="social-inbox-list">
          <div className="social-inbox-list-header">
            <button type="button" className="social-inbox-pill">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M4 4h16v10H4V4z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 14l4 6h8l4-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 11h6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>Inbox</span>
            </button>
            <button type="button" className="social-inbox-sort">
              <svg
                width="5"
                height="10"
                viewBox="0 0 5 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M2.20489 9.86065C2.36757 10.0465 2.63136 10.0465 2.79404 9.86065L4.87701 7.48058C5.0397 7.29468 5.0397 6.99329 4.87701 6.80739C4.71432 6.6215 4.45055 6.6215 4.28785 6.80739L2.49947 8.85088L0.711074 6.80739C0.548395 6.6215 0.284608 6.6215 0.121929 6.80739C-0.040751 6.99329 -0.040751 7.29468 0.121929 7.48058L2.20489 9.86065Z"
                  fill="#263238"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M2.20489 0.139348C2.36757 -0.0465357 2.63136 -0.0465357 2.79404 0.139348L4.87701 2.51942C5.0397 2.70532 5.0397 3.00671 4.87701 3.19261C4.71432 3.3785 4.45055 3.3785 4.28785 3.19261L2.49947 1.14912L0.711074 3.19261C0.548395 3.3785 0.284608 3.3785 0.121929 3.19261C-0.040751 3.00671 -0.040751 2.70532 0.121929 2.51942L2.20489 0.139348Z"
                  fill="#263238"
                />
              </svg>
              <span>Newest</span>
            </button>
          </div>

          <div className="social-inbox-search">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="social-inbox-search-input"
              placeholder="Search for a conversation"
            />
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="social-inbox-search-icon"
              aria-hidden="true"
            >
              <path
                d="M21 21l-4.35-4.35m1.35-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="social-inbox-items">
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                Loading messages...
              </div>
            ) : inboxError ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#a94442" }}>
                {inboxError}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                {selectedAccount ? "No messages found" : "Select an account to view messages"}
              </div>
            ) : (
              filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`social-inbox-item ${c.id === selectedId ? "active" : ""}`}
                onClick={() => setSelectedId(c.id)}
              >
                <div
                  className="social-inbox-avatar"
                  style={{ background: c.avatarGradient }}
                  aria-hidden="true"
                />
                <div className="social-inbox-item-body">
                  <div className="social-inbox-item-top">
                    <span className="social-inbox-item-handle">{c.handle}</span>
                    <span className="social-inbox-item-time">{c.time}</span>
                  </div>
                  <div className="social-inbox-item-preview">{c.lastMessage}</div>
                </div>
                {c.unread && <span className="social-inbox-unread" aria-hidden="true" />}
              </button>
            ))
            )}
          </div>
        </section>

        <section className="social-inbox-thread">
          <div className="social-inbox-thread-header">
            <div
              className="social-inbox-thread-avatar"
              style={{ background: selected?.avatarGradient }}
              aria-hidden="true"
            />
            <div className="social-inbox-thread-title">
              <div className="social-inbox-thread-name">{selected?.handle}</div>
            </div>
          </div>

          <div className="social-inbox-thread-body">
            {!selectedAccount ? (
              <div className="social-inbox-thread-empty">
                <div className="social-inbox-thread-empty-card">
                  <div className="social-inbox-thread-empty-title">Select an account</div>
                  <div className="social-inbox-thread-empty-sub">
                    Please select a connected social media account to view messages.
                  </div>
                </div>
              </div>
            ) : !selected ? (
            <div className="social-inbox-thread-empty">
              <div className="social-inbox-thread-empty-card">
                <div className="social-inbox-thread-empty-title">Select a conversation</div>
                <div className="social-inbox-thread-empty-sub">
                    Your messages will appear here.
                  </div>
                </div>
              </div>
            ) : (
              <div className="social-inbox-thread-messages" style={{ 
                padding: "20px", 
                overflowY: "auto", 
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                {loadingMessages ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: msg.isFromMe ? "flex-end" : "flex-start",
                        maxWidth: "70%",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        background: msg.isFromMe ? "#8b5cf6" : "#f0f0f0",
                        color: msg.isFromMe ? "#fff" : "#000",
                        wordWrap: "break-word",
                      }}
                    >
                      <div style={{ marginBottom: "4px" }}>{msg.text}</div>
                      <div style={{ 
                        fontSize: "11px", 
                        opacity: 0.7,
                        textAlign: msg.isFromMe ? "right" : "left"
                      }}>
                        {msg.time}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="social-inbox-composer">
            <div className="social-inbox-composer-inner">
              <span className="social-inbox-composer-left-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M8.5 10.5h.01M15.5 10.5h.01"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8.5 15c1.2 1 2.4 1.5 3.5 1.5s2.3-.5 3.5-1.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="social-inbox-composer-input"
                placeholder="Message"
                disabled={sendingMessage || !selectedId}
              />
              <div className="social-inbox-composer-actions">
                <button type="button" className="social-inbox-icon-btn" aria-label="Add image">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 11a2 2 0 100-4 2 2 0 000 4z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M21 16l-5-5-6 6-2-2-4 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button type="button" className="social-inbox-icon-btn" aria-label="Emoji">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M8.5 10.5h.01M15.5 10.5h.01"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M8.5 15c1.2 1 2.4 1.5 3.5 1.5s2.3-.5 3.5-1.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button 
                  type="button" 
                  className="social-inbox-icon-btn" 
                  aria-label="Send"
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !message.trim() || !selectedId}
                  style={{ 
                    opacity: (sendingMessage || !message.trim() || !selectedId) ? 0.5 : 1,
                    cursor: (sendingMessage || !message.trim() || !selectedId) ? "not-allowed" : "pointer"
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
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
        </section>
      </div>
    </div>
  );
}


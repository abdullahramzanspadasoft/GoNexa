"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar } from "../../components/Calendar";
import { FileLibrary } from "./FileLibrary/FileLibrary";
import { DashboardOverview } from "./Overview/DashboardOverview";
import { SocialInbox } from "./SocialInbox/SocialInbox";
import { Posts } from "./Posts/Posts";
import { TextLibrary } from "./TextLibrary/TextLibrary";
import { Analytics } from "./Analytics/Analytics";

interface DashboardContentProps {
  user: {
    youtubeChannelId?: string | null;
    youtubeChannelName?: string | null;
    youtubeChannelLogo?: string | null;
    youtubeChannelSubscribers?: number | null;
    linkedinId?: string | null;
    linkedinName?: string | null;
    linkedinLogo?: string | null;
    linkedinConnected?: boolean;
    instagramId?: string | null;
    instagramName?: string | null;
    instagramLogo?: string | null;
    instagramConnected?: boolean;
    facebookId?: string | null;
    facebookName?: string | null;
    facebookLogo?: string | null;
    facebookConnected?: boolean;
    tiktokId?: string | null;
    tiktokName?: string | null;
    tiktokLogo?: string | null;
    tiktokConnected?: boolean;
  } | null;
  activeItem: string;
  onUserUpdate?: () => Promise<void>;
}

export function DashboardContent({ user, activeItem, onUserUpdate }: DashboardContentProps) {
  const searchParams = useSearchParams();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [showDisconnectMenu, setShowDisconnectMenu] = useState<string | null>(null);
  const [refreshingLinkedIn, setRefreshingLinkedIn] = useState(false);
  const isFetchingProfile = useRef(false); // Prevent concurrent fetches

  const verifyLinkedInProfile = async (showAlert = false) => {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch("/api/linkedin/profile");
        if (response.ok) {
          const data = await response.json();
          const hasProfile =
            Boolean(data?.data?.linkedinName) || Boolean(data?.data?.linkedinLogo);

          if (hasProfile) {
            setSuccess(true);
            setSuccessMessage("LinkedIn connected successfully!");
            setError(null);
            if (showAlert) {
              window.alert("LinkedIn connected successfully. Profile synced from API.");
            }
            setTimeout(() => {
              window.location.reload();
            }, 900);
            return true;
          }
        }
      } catch (apiError) {
        console.error("LinkedIn profile verification error:", apiError);
      }

      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
    return false;
  };

  // Close disconnect menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".channel-disconnect-menu") && !target.closest(".channel-icon-wrapper")) {
        setShowDisconnectMenu(null);
      }
    };

    if (showDisconnectMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showDisconnectMenu]);

  // Handle YouTube connection success/error from URL params
  useEffect(() => {
    const youtubeError = searchParams?.get("youtube_error");
    const youtubeConnected = searchParams?.get("youtube_connected");

    if (youtubeError) {
      let errorMessage = "Failed to connect YouTube channel. Please try again.";
      
      // More specific error messages
      if (youtubeError === "no_code") {
        errorMessage = "Authorization code not received. Please try again.";
      } else if (youtubeError === "token_exchange_failed") {
        errorMessage = "Failed to exchange authorization code. Please try again.";
      } else if (youtubeError === "no_access_token") {
        errorMessage = "Failed to get access token. Please try again.";
      } else if (youtubeError === "channel_fetch_failed") {
        errorMessage = "Failed to fetch YouTube channel. Please check your API key and try again.";
      } else if (youtubeError === "no_channel_found") {
        errorMessage = "No YouTube channel found for this account.";
      } else if (youtubeError === "api_key_missing") {
        errorMessage = "YouTube API key not configured. Please contact support.";
      } else if (youtubeError.includes("access_denied")) {
        errorMessage = "Access denied. Please make sure you're added as a test user.";
      } else if (youtubeError.includes("redirect_uri_mismatch")) {
        errorMessage = "Redirect URI mismatch. Please add 'http://localhost:3000/api/youtube/callback' to Google Cloud Console redirect URIs.";
      } else if (youtubeError.includes("Invalid access token")) {
        errorMessage = "Invalid access token. Please try connecting again.";
      } else if (youtubeError.includes("Access forbidden")) {
        errorMessage = "Access forbidden. Please check YouTube API permissions in Google Cloud Console.";
      } else if (youtubeError.includes("quota") || youtubeError.includes("Quota")) {
        errorMessage = "YouTube API quota exceeded. Please try again later.";
      } else if (youtubeError.includes("Authorization code expired")) {
        errorMessage = "Authorization code expired. Please try connecting again.";
      }
      
      setError(errorMessage);
      
      // Remove error param after showing message
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("youtube_error");
      window.history.replaceState({}, "", newUrl.toString());
    }
    
    if (youtubeConnected === "true") {
      setSuccess(true);
      setSuccessMessage("YouTube channel connected successfully!");
      setError(null);
      
      // Remove success param to prevent re-triggering
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("youtube_connected");
      window.history.replaceState({}, "", newUrl.toString());
      
      // Refresh page to get updated user data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.get("youtube_error"), searchParams?.get("youtube_connected")]);

  // Handle LinkedIn connection success/error from URL params
  useEffect(() => {
    const linkedinError = searchParams?.get("linkedin_error");
    const linkedinConnected = searchParams?.get("linkedin_connected");

    if (linkedinError) {
      let errorMessage = "Failed to connect LinkedIn account. Please try again.";
      
      // More specific error messages
      if (linkedinError === "no_code") {
        errorMessage = "Authorization code not received. Please try again.";
      } else if (linkedinError === "token_exchange_failed") {
        errorMessage = "Failed to exchange authorization code. Please check your LinkedIn OAuth configuration and try again.";
      } else if (linkedinError === "redirect_uri_mismatch") {
        errorMessage = "Redirect URI mismatch. Please ensure the redirect URI in your .env file matches exactly with LinkedIn Developer Portal.";
      } else if (linkedinError === "invalid_credentials") {
        errorMessage = "Invalid LinkedIn client ID or secret. Please check your LinkedIn OAuth credentials in .env file.";
      } else if (linkedinError === "no_access_token") {
        errorMessage = "Failed to get access token. Please try again.";
      } else if (linkedinError === "not_configured") {
        errorMessage = "LinkedIn OAuth is not configured. Please contact support.";
      } else if (linkedinError === "state_mismatch") {
        errorMessage = "Security validation failed. Please try again.";
      } else if (linkedinError.includes("access_denied")) {
        errorMessage = "Access denied. Please try again.";
      }
      
      setError(errorMessage);
      
      // Remove error param after showing message
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("linkedin_error");
      window.history.replaceState({}, "", newUrl.toString());
    }
    
    if (linkedinConnected === "true") {
      setSuccess(true);
      setSuccessMessage("LinkedIn connected. Checking profile from API...");
      setError(null);
      
      // Remove success param to prevent re-triggering
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("linkedin_connected");
      window.history.replaceState({}, "", newUrl.toString());
      
      // Verify profile from API and keep user on same Accounts page.
      void verifyLinkedInProfile(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.get("linkedin_error"), searchParams?.get("linkedin_connected")]);

  // Handle Instagram connection success/error from URL params
  useEffect(() => {
    const instagramError = searchParams?.get("instagram_error");
    const instagramConnected = searchParams?.get("instagram_connected");

    if (instagramError) {
      let errorMessage = "Failed to connect Instagram account. Please try again.";

      if (instagramError === "no_code") {
        errorMessage = "Authorization code not received from Instagram. Please try again.";
      } else if (instagramError === "token_exchange_failed") {
        errorMessage = "Failed to exchange Instagram authorization code. Please try again.";
      } else if (instagramError === "no_access_token") {
        errorMessage = "Failed to get Instagram access token. Please try again.";
      } else if (instagramError === "not_configured") {
        errorMessage = "Instagram OAuth is not configured. Please contact support.";
      } else if (instagramError === "unauthorized") {
        errorMessage = "You must be logged in to connect Instagram.";
      } else if (instagramError === "callback_failed") {
        errorMessage = "Instagram callback failed. Please try again.";
      } else if (instagramError.includes("access_denied")) {
        errorMessage = "Instagram access denied. Please try again.";
      }

      setError(errorMessage);

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("instagram_error");
      window.history.replaceState({}, "", newUrl.toString());
    }

    if (instagramConnected === "true") {
      setSuccess(true);
      setSuccessMessage("Instagram account connected successfully!");
      setError(null);

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("instagram_connected");
      window.history.replaceState({}, "", newUrl.toString());

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.get("instagram_error"), searchParams?.get("instagram_connected")]);

  // Handle Facebook connection success/error from URL params
  useEffect(() => {
    const facebookError = searchParams?.get("facebook_error");
    const facebookConnected = searchParams?.get("facebook_connected");

    if (facebookError) {
      let errorMessage = "Failed to connect Facebook account. Please try again.";

      if (facebookError === "no_code") {
        errorMessage = "Authorization code not received from Facebook. Please try again.";
      } else if (facebookError === "token_exchange_failed") {
        errorMessage = "Failed to exchange Facebook authorization code. Please try again.";
      } else if (facebookError === "no_access_token") {
        errorMessage = "Failed to get Facebook access token. Please try again.";
      } else if (facebookError === "not_configured") {
        errorMessage = "Facebook OAuth is not configured. Please contact support.";
      } else if (facebookError === "unauthorized") {
        errorMessage = "You must be logged in to connect Facebook.";
      } else if (facebookError === "callback_failed") {
        errorMessage = "Facebook callback failed. Please try again.";
      } else if (facebookError.includes("access_denied")) {
        errorMessage = "Facebook access denied. Please try again.";
      }

      setError(errorMessage);

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("facebook_error");
      window.history.replaceState({}, "", newUrl.toString());
    }

    if (facebookConnected === "true") {
      setSuccess(true);
      setSuccessMessage("Facebook account connected successfully!");
      setError(null);

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("facebook_connected");
      window.history.replaceState({}, "", newUrl.toString());

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.get("facebook_error"), searchParams?.get("facebook_connected")]);

  // Handle TikTok connection success/error from URL params
  useEffect(() => {
    const tiktokError = searchParams?.get("tiktok_error");
    const tiktokConnected = searchParams?.get("tiktok_connected");

    if (tiktokError) {
      let errorMessage = "Failed to connect TikTok account. Please try again.";
      if (tiktokError === "no_code") {
        errorMessage = "Authorization code not received from TikTok. Please try again.";
      } else if (tiktokError === "token_exchange_failed") {
        errorMessage = "Failed to exchange TikTok authorization code. This may be due to an invalid client_key or client_secret. Please check your TikTok OAuth configuration. See TIKTOK_OAUTH_SETUP.md for instructions.";
      } else if (tiktokError === "no_access_token") {
        errorMessage = "Failed to get TikTok access token. Please try again.";
      } else if (tiktokError === "not_configured" || tiktokError === "client_key_missing") {
        errorMessage = "TikTok OAuth client_key is not configured. Please set TIKTOK_CLIENT_KEY in your environment variables. See TIKTOK_OAUTH_SETUP.md for instructions.";
      } else if (tiktokError === "client_secret_missing") {
        errorMessage = "TikTok OAuth client_secret is not configured. Please set TIKTOK_CLIENT_SECRET in your environment variables. See TIKTOK_OAUTH_SETUP.md for instructions.";
      } else if (tiktokError === "redirect_uri_missing") {
        errorMessage = "TikTok OAuth redirect URI is not configured. Please set TIKTOK_REDIRECT_URI or NEXTAUTH_URL in your environment variables.";
      } else if (tiktokError === "state_mismatch") {
        errorMessage = "Security validation failed. Please try again.";
      } else if (tiktokError === "redirect_uri_mismatch") {
        errorMessage = "TikTok redirect URI mismatch. The redirect URI in TikTok Developer Portal must match your TIKTOK_REDIRECT_URI. Please check your configuration. See TIKTOK_OAUTH_SETUP.md for instructions.";
      } else if (tiktokError === "invalid_client_key") {
        errorMessage = "Invalid TikTok client_key. Please verify your TIKTOK_CLIENT_KEY matches the one in TikTok Developer Portal. See TIKTOK_OAUTH_SETUP.md for instructions.";
      } else if (tiktokError.includes("client_key") || tiktokError.includes("invalid_client")) {
        errorMessage = "Invalid TikTok client_key. Please verify your TIKTOK_CLIENT_KEY in your environment variables matches the one in TikTok Developer Portal. See TIKTOK_OAUTH_SETUP.md for instructions.";
      }
      setError(errorMessage);

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("tiktok_error");
      window.history.replaceState({}, "", newUrl.toString());
    }

    if (tiktokConnected === "true") {
      setSuccess(true);
      setSuccessMessage("TikTok account connected successfully!");
      setError(null);

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("tiktok_connected");
      window.history.replaceState({}, "", newUrl.toString());

      setTimeout(() => {
        window.location.reload();
      }, 1200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.get("tiktok_error"), searchParams?.get("tiktok_connected")]);

  const startYouTubeConnect = async () => {
    setConnecting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/youtube/connect");
      const data = await response.json();

      if (data.success && data.authUrl) {
        // Redirect to Google OAuth for YouTube
        window.location.href = data.authUrl;
      } else {
        setError(data.message || "Failed to initiate YouTube connection");
        setConnecting(false);
      }
    } catch (err) {
      console.error("YouTube connect error:", err);
      setError("Failed to connect YouTube channel. Please try again.");
      setConnecting(false);
    }
  };

  const startLinkedInConnect = async () => {
    setConnecting(true);
    setError(null);
    setSuccess(false);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/linkedin/connect");
      const data = await response.json();

      if (data.success && data.authUrl) {
        // Redirect to LinkedIn OAuth
        window.location.href = data.authUrl;
      } else if (data.success && !data.authUrl) {
        // Already connected path from API: sync profile data and show success.
        setSuccess(true);
        setSuccessMessage("LinkedIn account already connected. Syncing profile...");
        const synced = await verifyLinkedInProfile(true);
        if (!synced) {
          setError("LinkedIn connected but profile data not found yet. Please click Refresh Profile.");
        }
        setConnecting(false);
      } else {
        setError(data.message || "Failed to initiate LinkedIn connection");
        setConnecting(false);
      }
    } catch (err) {
      console.error("LinkedIn connect error:", err);
      setError("Failed to connect LinkedIn account. Please try again.");
      setConnecting(false);
    }
  };

  const startInstagramConnect = async () => {
    setConnecting(true);
    setError(null);
    setSuccess(false);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/instagram/connect");
      const data = await response.json();

      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError(data.message || "Failed to initiate Instagram connection");
        setConnecting(false);
      }
    } catch (err) {
      console.error("Instagram connect error:", err);
      setError("Failed to connect Instagram account. Please try again.");
      setConnecting(false);
    }
  };

  const startFacebookConnect = async () => {
    setConnecting(true);
    setError(null);
    setSuccess(false);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/facebook/connect");
      const data = await response.json();

      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError(data.message || "Failed to initiate Facebook connection");
        setConnecting(false);
      }
    } catch (err) {
      console.error("Facebook connect error:", err);
      setError("Failed to connect Facebook account. Please try again.");
      setConnecting(false);
    }
  };

  const startTiktokConnect = async () => {
    setConnecting(true);
    setError(null);
    setSuccess(false);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/tiktok/connect");
      const data = await response.json();

      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError(data.message || "Failed to initiate TikTok connection");
        setConnecting(false);
      }
    } catch (err) {
      console.error("TikTok connect error:", err);
      setError("Failed to connect TikTok account. Please try again.");
      setConnecting(false);
    }
  };

  const refreshLinkedInProfile = async () => {
    if (isFetchingProfile.current) {
      console.log("Profile fetch already in progress, skipping...");
    return;
    }
    
    setRefreshingLinkedIn(true);
    setError(null);
    setSuccess(false);
    setSuccessMessage(null);
    isFetchingProfile.current = true;
    
    try {
      console.log("Refreshing LinkedIn profile...");
      const response = await fetch("/api/linkedin/profile");
      
      if (response.ok) {
        const data = await response.json();
        console.log("LinkedIn profile refreshed successfully:", data);
        
        if (data.success && data.data) {
          setSuccess(true);
          const nameMsg = data.data.linkedinName ? `Name: ${data.data.linkedinName}` : '';
          const logoMsg = data.data.linkedinLogo ? 'Logo updated' : '';
          setSuccessMessage(`LinkedIn profile synced! ${nameMsg} ${logoMsg}`.trim());
          
          isFetchingProfile.current = false;
          
          // Wait a moment for database to save, then update user state WITHOUT page reload
          setTimeout(async () => {
            if (onUserUpdate) {
              await onUserUpdate();
              console.log("User data refreshed after LinkedIn profile update");
            }
            setRefreshingLinkedIn(false);
          }, 1000);
        } else {
          setError("Profile data not returned. Please try again.");
          setRefreshingLinkedIn(false);
          isFetchingProfile.current = false;
        }
      } else if (response.status === 202) {
        // Token not ready yet
        setError("LinkedIn token not ready yet. Please wait a moment and try again.");
        setRefreshingLinkedIn(false);
        isFetchingProfile.current = false;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("LinkedIn profile refresh error:", response.status, errorData);
        setError(errorData.message || `Failed to refresh LinkedIn profile (${response.status}). Please try again.`);
        setRefreshingLinkedIn(false);
        isFetchingProfile.current = false;
      }
    } catch (err) {
      console.error("LinkedIn profile refresh exception:", err);
      setError("Failed to refresh LinkedIn profile. Please try again.");
      setRefreshingLinkedIn(false);
      isFetchingProfile.current = false;
    }
  };

  const handleDisconnect = async (channelType: "youtube" | "linkedin" | "instagram" | "facebook" | "tiktok") => {
    setDisconnecting(channelType);
    setError(null);
    setShowDisconnectMenu(null);

    try {
      const endpoint =
        channelType === "youtube"
          ? "/api/youtube/disconnect"
          : channelType === "linkedin"
          ? "/api/linkedin/disconnect"
          : channelType === "instagram"
          ? "/api/instagram/disconnect"
          : channelType === "facebook"
          ? "/api/facebook/disconnect"
          : "/api/tiktok/disconnect";
      const response = await fetch(endpoint, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setSuccessMessage(
          channelType === "youtube"
            ? "YouTube channel disconnected successfully!"
            : channelType === "linkedin"
            ? "LinkedIn account disconnected successfully!"
            : channelType === "instagram"
            ? "Instagram account disconnected successfully!"
            : channelType === "facebook"
            ? "Facebook account disconnected successfully!"
            : "TikTok account disconnected successfully!"
        );
        // Refresh page to get updated user data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setError(
          data.message ||
            `Failed to disconnect ${
              channelType === "youtube"
                ? "YouTube"
                : channelType === "linkedin"
                ? "LinkedIn"
                : channelType === "instagram"
                ? "Instagram"
                : channelType === "facebook"
                ? "Facebook"
                : "TikTok"
            } account`
        );
        setDisconnecting(null);
      }
    } catch (err) {
      console.error("Disconnect social account error:", err);
      setError(
        `Failed to disconnect ${
          channelType === "youtube"
            ? "YouTube"
            : channelType === "linkedin"
            ? "LinkedIn"
            : channelType === "instagram"
            ? "Instagram"
            : channelType === "facebook"
            ? "Facebook"
            : "TikTok"
        } account. Please try again.`
      );
      setDisconnecting(null);
    }
  };

  const socialChannels = [
    { name: "X", iconPath: "/X-Icon.svg" },
    { name: "Tiktok", iconPath: "/Tiktok-Icon.svg" },
    { name: "Facebook", iconPath: "/Facebook-Icon.svg" },
    { name: "Instagram", iconPath: "/Instagram-Icon.svg" },
    { name: "Threads", iconPath: "/Threads-Icon.svg" },
    { name: "Youtube", iconPath: "/Youtube-Icon.svg" },
    { name: "Pinterest", iconPath: "/Pinterest-Icon.svg" },
    { name: "Linkedin", iconPath: "/Linkedin-Icon.svg" },
  ];

  const hasYouTubeChannel = user?.youtubeChannelId && user?.youtubeChannelName;
  const hasLinkedInAccount = user?.linkedinId && user?.linkedinName;
  const hasLinkedInToken = Boolean(user?.linkedinConnected || user?.linkedinId);
  const hasInstagramAccount = Boolean(
    user?.instagramConnected || user?.instagramId || user?.instagramName
  );
  const hasFacebookAccount = Boolean(
    user?.facebookConnected || user?.facebookId || user?.facebookName
  );
  const hasTiktokAccount = Boolean(user?.tiktokConnected || user?.tiktokId || user?.tiktokName);

  // Auto-fetch LinkedIn profile data if connected but missing name or logo
  useEffect(() => {
    // Only fetch if:
    // 1. LinkedIn is connected (has token)
    // 2. Missing name or logo
    // 3. Not currently fetching
    // 4. User data is loaded (user object exists)
    if (
      user && // User data must be loaded
      hasLinkedInToken && 
      (!user?.linkedinName || !user?.linkedinLogo) && 
      !isFetchingProfile.current
    ) {
      // Check if we've already attempted for this user session
      const userSessionKey = user?.linkedinId || user?.linkedinName || "unknown";
      const fetchKey = `linkedin_auto_fetch_${userSessionKey}`;
      const lastAttempt = sessionStorage.getItem(fetchKey);
      const now = Date.now();
      
      // Only attempt if we haven't tried in the last 30 seconds (to prevent loops but allow retries)
      if (!lastAttempt || (now - parseInt(lastAttempt)) > 30000) {
      isFetchingProfile.current = true;
        sessionStorage.setItem(fetchKey, now.toString());
      
        console.log("LinkedIn connected but missing profile data. Auto-fetching...", {
        hasToken: hasLinkedInToken,
        hasName: !!user?.linkedinName,
          hasLogo: !!user?.linkedinLogo,
          userSessionKey
      });
      
        // Wait a bit to ensure user data is fully loaded
      const timer = setTimeout(async () => {
          const fetchLinkedInProfile = async (retries = 3, delay = 2000) => {
          for (let i = 0; i < retries; i++) {
            try {
              console.log(`Auto-fetching LinkedIn profile data (attempt ${i + 1}/${retries})...`);
              const response = await fetch("/api/linkedin/profile");
              
              if (response.ok) {
                const data = await response.json();
                console.log("LinkedIn profile data auto-fetched successfully:", data);
                
                if (data.success && data.data) {
                    // Wait for database to save
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // Refresh user data
                    if (onUserUpdate) {
                      await onUserUpdate();
                      console.log("User data refreshed after auto LinkedIn profile fetch");
                    }
                    
                    isFetchingProfile.current = false;
                  return true;
                }
              } else if (response.status === 202) {
                // Token not ready yet, wait and retry
                console.log(`LinkedIn token not ready yet (attempt ${i + 1}), retrying...`);
                if (i < retries - 1) {
                  await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                  isFetchingProfile.current = false;
                }
              } else {
                const errorData = await response.json().catch(() => ({}));
                console.log(`LinkedIn profile fetch attempt ${i + 1} failed:`, response.status, errorData);
                if (i < retries - 1) {
                  await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                  isFetchingProfile.current = false;
                }
              }
            } catch (error) {
              console.error(`Error auto-fetching LinkedIn profile (attempt ${i + 1}):`, error);
              if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
              } else {
                isFetchingProfile.current = false;
              }
            }
          }
          return false;
        };
        
        await fetchLinkedInProfile();
        }, 2000); // Wait 2 seconds before trying
      
      return () => {
        clearTimeout(timer);
      };
    }
    }
    // Depend on user object and hasLinkedInToken to trigger when user data loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hasLinkedInToken]);

  // Render different content based on active item
  if (activeItem === "Dashboard") {
    return (
      <main className="dashboard-main">
        <div className="dashboard-content dashboard-content-overview">
          <DashboardOverview />
        </div>
      </main>
    );
  }

  if (activeItem === "File Library") {
    return (
      <main className="dashboard-main file-library-main">
        <div className="dashboard-content file-library-content">
          <FileLibrary />
        </div>
      </main>
    );
  }

  if (activeItem === "Calendar") {
    return (
      <main className="dashboard-main">
        <div className="dashboard-content dashboard-content-calendar">
          <Calendar />
        </div>
      </main>
    );
  }

  if (activeItem === "Social Inbox") {
    return (
      <main className="dashboard-main social-inbox-main">
        <div className="dashboard-content social-inbox-content">
          <SocialInbox />
        </div>
      </main>
    );
  }

  if (activeItem === "Posts") {
    return (
      <main className="dashboard-main posts-main">
        <div className="dashboard-content posts-content">
          <Posts />
        </div>
      </main>
    );
  }

  if (activeItem === "Text Library") {
    return (
      <main className="dashboard-main text-library-main">
        <div className="dashboard-content text-library-content">
          <TextLibrary />
        </div>
      </main>
    );
  }

  if (activeItem === "Analytics") {
    return (
      <main className="dashboard-main analytics-main-new">
        <div className="dashboard-content analytics-content-new">
          <Analytics />
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-main">
      <div className="dashboard-content">
        <h1 className="dashboard-title">
          Welcome to <span className="dashboard-title-gradient">GoNexa</span>
        </h1>
        <p className="dashboard-description">
          Connect a channels to start posting and scheduling posts, and manage all your social media inboxes in one place.
        </p>

        {/* Success Message */}
        {success && (
          <div className="dashboard-message dashboard-message-success">
            {successMessage || (hasYouTubeChannel && !hasLinkedInAccount 
              ? "YouTube channel connected successfully!" 
              : hasLinkedInAccount && !hasYouTubeChannel
              ? "LinkedIn account connected successfully!"
              : "Account connected successfully!")}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="dashboard-message dashboard-message-error">
            {error}
          </div>
        )}

        {/* LinkedIn Refresh Button - Show if connected but missing name/logo */}
        {hasLinkedInToken && (!user?.linkedinName || !user?.linkedinLogo) && (
          <div style={{ 
            marginBottom: "16px", 
            padding: "12px", 
            backgroundColor: "#fff3cd", 
            border: "1px solid #ffc107", 
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span style={{ color: "#856404", fontSize: "14px" }}>
              LinkedIn connected but profile data is missing. Click to refresh.
            </span>
            <button
              onClick={() => void refreshLinkedInProfile()}
              disabled={refreshingLinkedIn}
              style={{
                padding: "8px 16px",
                backgroundColor: "#ffc107",
                color: "#856404",
                border: "none",
                borderRadius: "6px",
                cursor: refreshingLinkedIn ? "not-allowed" : "pointer",
                fontWeight: 500,
                fontSize: "14px",
              }}
            >
              {refreshingLinkedIn ? "Refreshing..." : "Refresh Profile"}
            </button>
                </div>
        )}

        <button 
          className="dashboard-connect-button"
          onClick={() => {
            // Default to YouTube if neither is connected, or connect the one that's not connected
            if (!hasYouTubeChannel && !hasLinkedInToken) {
              void startYouTubeConnect();
            } else if (!hasYouTubeChannel) {
              void startYouTubeConnect();
            } else if (!hasLinkedInToken) {
              void startLinkedInConnect();
            }
          }}
          disabled={connecting}
        >
          {connecting ? "Connecting..." : "Connect a Channels"}
        </button>
        <div className="dashboard-channels-grid">
          {socialChannels.map((channel) => {
            const isYouTube = channel.name === "Youtube";
            const isLinkedIn = channel.name === "Linkedin";
            const isInstagram = channel.name === "Instagram";
            const isFacebook = channel.name === "Facebook";
            const isTiktok = channel.name === "Tiktok";
            const isConnected =
              (isYouTube && Boolean(hasYouTubeChannel)) ||
              (isLinkedIn && Boolean(hasLinkedInToken)) ||
              (isInstagram && Boolean(hasInstagramAccount)) ||
              (isFacebook && Boolean(hasFacebookAccount)) ||
              (isTiktok && Boolean(hasTiktokAccount));
            const displayName =
              isYouTube && user?.youtubeChannelName
                ? user.youtubeChannelName
                : isLinkedIn && (user?.linkedinName || user?.linkedinId)
                ? user.linkedinName || "LinkedIn Account"
                : isInstagram && (user?.instagramName || user?.instagramId)
                ? user.instagramName || "Instagram Account"
                : isFacebook && (user?.facebookName || user?.facebookId)
                ? user.facebookName || "Facebook Account"
                : isTiktok && (user?.tiktokName || user?.tiktokId)
                ? user.tiktokName || "TikTok Account"
                : channel.name;

            return (
              <div key={channel.name} className="dashboard-channel-item" style={{ position: "relative" }}>
                <div
                  className={`channel-icon-wrapper${
                    (isYouTube && isConnected) ||
                    (isLinkedIn && isConnected) ||
                    (isInstagram && isConnected) ||
                    (isFacebook && isConnected) ||
                    (isTiktok && isConnected)
                      ? " channel-youtube-connected" 
                      : ""
                  }`}
                  onClick={
                    isConnected && !connecting && !disconnecting
                      ? () => {
                          setShowDisconnectMenu(showDisconnectMenu === channel.name ? null : channel.name);
                        }
                      : ((isYouTube && !isConnected) ||
                          (isLinkedIn && !isConnected) ||
                          (isInstagram && !isConnected) ||
                          (isFacebook && !isConnected) ||
                          (isTiktok && !isConnected)) &&
                        !connecting
                      ? () => {
                          if (isYouTube) {
                            void startYouTubeConnect();
                          } else if (isLinkedIn) {
                            void startLinkedInConnect();
                          } else if (isInstagram) {
                            void startInstagramConnect();
                          } else if (isFacebook) {
                            void startFacebookConnect();
                          } else if (isTiktok) {
                            void startTiktokConnect();
                          }
                        }
                      : undefined
                  }
                  style={{
                    cursor:
                      isConnected ||
                      ((isYouTube && !isConnected) ||
                        (isLinkedIn && !isConnected) ||
                        (isInstagram && !isConnected) ||
                        (isFacebook && !isConnected) ||
                        (isTiktok && !isConnected))
                      ? "pointer" 
                      : "default"
                  }}
                >
                  {isYouTube && isConnected ? (
                    <>
                      <div className="channel-avatar-ring">
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
                          alt={displayName || "YouTube Channel"}
                          className="channel-avatar-img"
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            // Fallback if image fails to load
                            const target = e.target as HTMLImageElement;
                            console.error("Failed to load channel logo:", user?.youtubeChannelLogo, "Error:", e);
                            if (target.src !== window.location.origin + "/Youtube-Icon.svg") {
                              target.src = "/Youtube-Icon.svg";
                            }
                          }}
                          onLoad={() => {
                            console.log("Channel logo loaded successfully:", user?.youtubeChannelLogo);
                          }}
                        />
                      </div>
                      <div className="channel-check-badge">✓</div>
                      <div className="channel-youtube-badge">
                        <img
                          src="/Youtube-Icon.svg"
                          alt="YouTube"
                          className="channel-youtube-badge-img"
                        />
                      </div>
                    </>
                  ) : isLinkedIn && isConnected ? (
                    <>
                      <div className="channel-avatar-ring">
                        <img
                          src={
                            user?.linkedinLogo && user.linkedinLogo.trim()
                              ? (user.linkedinLogo.startsWith("http") 
                                  ? user.linkedinLogo 
                                  : user.linkedinLogo.startsWith("//")
                                    ? `https:${user.linkedinLogo}`
                                    : `https://${user.linkedinLogo.replace(/^https?:\/\//, "")}`)
                              : "/Linkedin-Icon.svg"
                          }
                          alt={displayName || "LinkedIn Account"}
                          className="channel-avatar-img"
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                          loading="eager"
                          onError={(e) => {
                            // Fallback if image fails to load
                            const target = e.target as HTMLImageElement;
                            console.error("Failed to load LinkedIn logo:", {
                              originalUrl: user?.linkedinLogo,
                              currentSrc: target.src,
                              error: e
                            });
                            if (target.src !== window.location.origin + "/Linkedin-Icon.svg") {
                              target.src = "/Linkedin-Icon.svg";
                            }
                          }}
                          onLoad={() => {
                            console.log("LinkedIn logo loaded successfully:", {
                              url: user?.linkedinLogo,
                              displayName: displayName
                            });
                          }}
                        />
                      </div>
                      <div className="channel-check-badge">✓</div>
                      <div className="channel-youtube-badge">
                        <img
                          src="/Linkedin-Icon.svg"
                          alt="LinkedIn"
                          className="channel-youtube-badge-img"
                        />
                      </div>
                    </>
                  ) : isInstagram && isConnected ? (
                    <>
                      <div className="channel-avatar-ring">
                        <img
                          src={
                            user?.instagramLogo && user.instagramLogo.trim()
                              ? user.instagramLogo
                              : "/Instagram-Icon.svg"
                          }
                          alt={displayName || "Instagram Account"}
                          className="channel-avatar-img"
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                          loading="eager"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            console.error("Failed to load Instagram logo:", {
                              originalUrl: user?.instagramLogo,
                              currentSrc: target.src,
                              error: e,
                            });
                            if (target.src !== window.location.origin + "/Instagram-Icon.svg") {
                              target.src = "/Instagram-Icon.svg";
                            }
                          }}
                          onLoad={() => {
                            console.log("Instagram logo loaded successfully:", {
                              url: user?.instagramLogo,
                              displayName,
                            });
                          }}
                        />
                      </div>
                      <div className="channel-check-badge">✓</div>
                      <div className="channel-youtube-badge">
                        <img
                          src="/Instagram-Icon.svg"
                          alt="Instagram"
                          className="channel-youtube-badge-img"
                        />
                      </div>
                    </>
                  ) : isFacebook && isConnected ? (
                    <>
                      <div className="channel-avatar-ring">
                        <img
                          src={
                            user?.facebookLogo && user.facebookLogo.trim()
                              ? user.facebookLogo
                              : "/Facebook-Icon.svg"
                          }
                          alt={displayName || "Facebook Account"}
                          className="channel-avatar-img"
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                          loading="eager"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            console.error("Failed to load Facebook logo:", {
                              originalUrl: user?.facebookLogo,
                              currentSrc: target.src,
                              error: e,
                            });
                            if (target.src !== window.location.origin + "/Facebook-Icon.svg") {
                              target.src = "/Facebook-Icon.svg";
                            }
                          }}
                          onLoad={() => {
                            console.log("Facebook logo loaded successfully:", {
                              url: user?.facebookLogo,
                              displayName,
                            });
                          }}
                        />
                      </div>
                      <div className="channel-check-badge">✓</div>
                      <div className="channel-youtube-badge">
                        <img
                          src="/Facebook-Icon.svg"
                          alt="Facebook"
                          className="channel-youtube-badge-img"
                        />
                      </div>
                    </>
                  ) : isTiktok && isConnected ? (
                    <>
                      <div className="channel-avatar-ring">
                        <img
                          src={
                            user?.tiktokLogo && user.tiktokLogo.trim()
                              ? user.tiktokLogo
                              : "/Tiktok-Icon.svg"
                          }
                          alt={displayName || "TikTok Account"}
                          className="channel-avatar-img"
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                          loading="eager"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== window.location.origin + "/Tiktok-Icon.svg") {
                              target.src = "/Tiktok-Icon.svg";
                            }
                          }}
                        />
                      </div>
                      <div className="channel-check-badge">✓</div>
                      <div className="channel-youtube-badge">
                        <img
                          src="/Tiktok-Icon.svg"
                          alt="TikTok"
                          className="channel-youtube-badge-img"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                <div className="channel-icon-placeholder">
                  <img 
                    src={channel.iconPath} 
                    alt={channel.name}
                    className="channel-icon-img"
                  />
                </div>
                <div className="channel-add-badge">
                  <img src="/Plus-Icon.svg" alt="" className="channel-add-icon" />
                </div>
                    </>
                  )}
                </div>
                <span
                  className={`channel-name${
                    (isYouTube && isConnected) ||
                    (isLinkedIn && isConnected) ||
                    (isInstagram && isConnected) ||
                    (isFacebook && isConnected) ||
                    (isTiktok && isConnected)
                      ? " channel-name-connected"
                      : ""
                  }`}
                >
                  {displayName}
                </span>
                {isConnected && showDisconnectMenu === channel.name && (
                  <div 
                    className="channel-disconnect-menu"
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      marginTop: "8px",
                      backgroundColor: "white",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      padding: "8px 0",
                      zIndex: 1000,
                      minWidth: "150px",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        if (isYouTube) {
                          void handleDisconnect("youtube");
                        } else if (isLinkedIn) {
                          void handleDisconnect("linkedin");
                        } else if (isInstagram) {
                          void handleDisconnect("instagram");
                        } else if (isFacebook) {
                          void handleDisconnect("facebook");
                        } else if (isTiktok) {
                          void handleDisconnect("tiktok");
                        }
                      }}
                      disabled={
                        disconnecting ===
                        (isYouTube
                          ? "youtube"
                          : isLinkedIn
                          ? "linkedin"
                          : isInstagram
                          ? "instagram"
                          : isFacebook
                          ? "facebook"
                          : "tiktok")
                      }
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        border: "none",
                        background: "none",
                        textAlign: "left",
                        cursor:
                          disconnecting ===
                          (isYouTube
                            ? "youtube"
                            : isLinkedIn
                            ? "linkedin"
                            : isInstagram
                            ? "instagram"
                            : isFacebook
                            ? "facebook"
                            : "tiktok")
                            ? "not-allowed"
                            : "pointer",
                        color:
                          disconnecting ===
                          (isYouTube
                            ? "youtube"
                            : isLinkedIn
                            ? "linkedin"
                            : isInstagram
                            ? "instagram"
                            : isFacebook
                            ? "facebook"
                            : "tiktok")
                            ? "#999"
                            : "#e74c3c",
                        fontSize: "14px",
                        fontWeight: 500,
                      }}
                    >
                      {disconnecting ===
                      (isYouTube
                        ? "youtube"
                        : isLinkedIn
                        ? "linkedin"
                        : isInstagram
                        ? "instagram"
                        : isFacebook
                        ? "facebook"
                        : "tiktok")
                        ? "Disconnecting..."
                        : "Disconnect Channel"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

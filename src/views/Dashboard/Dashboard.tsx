"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authAPI, getToken, removeToken, type User } from "../../utils/api";
import { signOut, useSession } from "next-auth/react";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardContent } from "./DashboardContent";

export function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { status } = useSession();

  // Sync activeItem with URL tab parameter
  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam) {
      // Map common tab names
      const tabMap: Record<string, string> = {
        Accounts: "Accounts",
        Dashboard: "Dashboard",
        Calendar: "Calendar",
        Posts: "Posts",
        Analytics: "Analytics",
      };
      const mappedTab = tabMap[tabParam] || tabParam;
      if (mappedTab !== activeItem) {
        setActiveItem(mappedTab);
        // Save to localStorage
        localStorage.setItem("activeDashboardTab", mappedTab);
      }
    } else {
      // Load from localStorage if no tab param
      const savedTab = localStorage.getItem("activeDashboardTab");
      if (savedTab && savedTab !== activeItem) {
        setActiveItem(savedTab);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.get("tab")]);

  // Save activeItem to localStorage when it changes
  useEffect(() => {
    if (activeItem) {
      localStorage.setItem("activeDashboardTab", activeItem);
    }
  }, [activeItem]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeItem]);

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchUser = async () => {
      const token = getToken();
      
      try {
        if (token) {
          const response = await authAPI.getCurrentUser(token);
          if (isMounted) {
            setUser(response.data);
            setLoading(false);
          }
          return;
        }

        // NextAuth (Google) login path: fetch user from DB using session cookie
        const res = await fetch("/api/user/me");
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        if (isMounted) {
          setUser(data.data);
        }
      } catch {
        if (isMounted) {
          removeToken();
          router.push("/login");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Wait for NextAuth session resolution when no token
    if (getToken() || status !== "loading") {
      fetchUser();
    }

    return () => {
      isMounted = false;
    };
  }, [router, status, searchParams]);

  // Separate effect for YouTube connection refresh (only runs once when param changes)
  useEffect(() => {
    const youtubeConnected = searchParams?.get("youtube_connected");
    if (youtubeConnected === "true") {
      // Remove the query param to prevent re-triggering
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("youtube_connected");
      window.history.replaceState({}, "", newUrl.toString());
      
      // Refetch user data once
      const fetchUser = async () => {
        const token = getToken();
        try {
          if (token) {
            const response = await authAPI.getCurrentUser(token);
            setUser(response.data);
          } else {
            const res = await fetch("/api/user/me");
            if (res.ok) {
              const data = await res.json();
              setUser(data.data);
            }
          }
        } catch (error) {
          console.error("Error refreshing user:", error);
        }
      };
      
      setTimeout(() => {
        fetchUser();
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.get("youtube_connected")]); // Only trigger when this specific param changes

  // Separate effect for LinkedIn connection refresh (only runs once when param changes)
  useEffect(() => {
    const linkedinConnected = searchParams?.get("linkedin_connected");
    if (linkedinConnected === "true") {
      // Remove the query param to prevent re-triggering
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("linkedin_connected");
      window.history.replaceState({}, "", newUrl.toString());
      
      // Refetch user data - profile data should already be saved by callback
      const fetchUser = async () => {
        const token = getToken();
        try {
          // Wait longer for database write to complete (token needs to be saved first)
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // First, try to fetch LinkedIn profile if needed (with retry logic) - only once
          const fetchProfileWithRetry = async (retries = 2) => {
            for (let i = 0; i < retries; i++) {
              try {
                const profileRes = await fetch("/api/linkedin/profile");
                if (profileRes.ok) {
                  const profileData = await profileRes.json();
                  console.log("LinkedIn profile fetched successfully:", profileData);
                  // Wait a bit for profile to be saved
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  return true;
                } else if (profileRes.status === 202) {
                  // Token not ready yet, wait and retry
                  if (i < retries - 1) {
                    console.log(`LinkedIn profile API not ready yet, retrying in 2 seconds... (attempt ${i + 1}/${retries})`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                  } else {
                    console.log("LinkedIn profile API still not ready after retries");
                  }
                } else {
                  console.error("LinkedIn profile API error:", profileRes.status);
                  break;
                }
              } catch (profileError) {
                console.error(`Error fetching LinkedIn profile (attempt ${i + 1}):`, profileError);
                if (i < retries - 1) {
                  await new Promise(resolve => setTimeout(resolve, 2000));
                }
              }
            }
            return false;
          };
          
          await fetchProfileWithRetry();
          
          // Fetch updated user data after profile is fetched
          const fetchUserData = async () => {
            if (token) {
              const response = await authAPI.getCurrentUser(token);
              setUser(response.data);
              console.log("User data updated (with token):", {
                linkedinId: response.data?.linkedinId,
                linkedinName: response.data?.linkedinName,
                linkedinLogo: response.data?.linkedinLogo,
                linkedinConnected: response.data?.linkedinConnected,
                hasLogo: !!response.data?.linkedinLogo,
                hasName: !!response.data?.linkedinName
              });
            } else {
              const res = await fetch("/api/user/me");
              if (res.ok) {
                const data = await res.json();
                setUser(data.data);
                console.log("User data updated (no token):", {
                  linkedinId: data.data?.linkedinId,
                  linkedinName: data.data?.linkedinName,
                  linkedinLogo: data.data?.linkedinLogo,
                  linkedinConnected: data.data?.linkedinConnected,
                  hasLogo: !!data.data?.linkedinLogo,
                  hasName: !!data.data?.linkedinName
                });
              }
            }
          };
          
          // Fetch user data after profile is fetched
          await fetchUserData();
        } catch (error) {
          console.error("Error refreshing user:", error);
        }
      };
      
      setTimeout(() => {
        fetchUser();
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.get("linkedin_connected")]); // Only trigger when this specific param changes

  const handleSignOut = () => {
    removeToken();
    // Also sign out from NextAuth (Google)
    signOut({ callbackUrl: "/login" });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <DashboardHeader user={user} onSignOut={handleSignOut} />
      <div className="dashboard-body">
        <div className="dashboard-mobile-nav">
          <button
            type="button"
            className="dashboard-sidebar-toggle"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <span className="dashboard-mobile-nav-title">{activeItem}</span>
        </div>
        {isSidebarOpen ? (
          <button
            type="button"
            className="dashboard-sidebar-overlay"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation menu"
          />
        ) : null}
        <DashboardSidebar
          activeItem={activeItem}
          isMobileOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onItemClick={(item) => {
            setActiveItem(item);
            setIsSidebarOpen(false);
          }}
        />
        <DashboardContent 
          user={user} 
          activeItem={activeItem} 
          onUserUpdate={async () => {
            // Refresh user data
            const token = getToken();
            try {
              if (token) {
                const response = await authAPI.getCurrentUser(token);
                setUser(response.data);
              } else {
                const res = await fetch("/api/user/me");
                if (res.ok) {
                  const data = await res.json();
                  setUser(data.data);
                }
              }
            } catch (error) {
              console.error("Error refreshing user data:", error);
            }
          }}
        />
      </div>
    </div>
  );
}

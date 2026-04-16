import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  console.log("LinkedIn profile API called at:", new Date().toISOString());
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log("LinkedIn profile API: No session or email found");
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    console.log("LinkedIn profile API: Session found for user:", session.user.email);

    await connectDB();
    const user = await User.findOne({ email: session.user.email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (!user.linkedinAccessToken) {
      console.log("LinkedIn access token not found for user:", session.user.email, "- User has linkedinId:", !!user.linkedinId);
      // If user has linkedinId but no token, they might be connected but token not saved yet
      // Return 202 (Accepted) instead of 400 to indicate it's processing
      return NextResponse.json({ 
        success: false, 
        message: "LinkedIn token not available yet. Please wait a moment and try again.",
        retry: true
      }, { status: 202 });
    }

    let accessToken = user.linkedinAccessToken;
    
    // Validate token format
    if (!accessToken || typeof accessToken !== 'string' || accessToken.length < 10) {
      console.error("Invalid LinkedIn access token format:", accessToken ? `${accessToken.substring(0, 20)}...` : "null/undefined");
      return NextResponse.json({
        success: false,
        message: "Invalid LinkedIn access token. Please reconnect your LinkedIn account.",
        requiresReconnect: true
      }, { status: 401 });
    }
    
    let linkedinId: string | null = user.linkedinId || null;
    let linkedinName: string | null = user.linkedinName || null;
    let linkedinLogo: string | null = user.linkedinLogo || null;

    console.log("Starting LinkedIn profile fetch - Current data:", {
      linkedinId,
      linkedinName,
      linkedinLogo,
      hasExistingName: !!linkedinName,
      hasExistingLogo: !!linkedinLogo,
      tokenExpiry: user.linkedinTokenExpiry,
      hasRefreshToken: !!user.linkedinRefreshToken,
      needsRefresh: !linkedinName || !linkedinLogo || !linkedinId
    });

    // Always try to fetch fresh data if any profile field is missing
    const needsProfileData = !linkedinName || !linkedinLogo || !linkedinId;

    // Check if token is expired and refresh if needed
    const now = new Date();
    const tokenExpiry = user.linkedinTokenExpiry ? new Date(user.linkedinTokenExpiry) : null;
    const isTokenExpired = tokenExpiry && tokenExpiry <= now;

    if (isTokenExpired && user.linkedinRefreshToken) {
      console.log("LinkedIn token expired, refreshing...");
      try {
        const clientId = process.env.LINKEDIN_CLIENT_ID;
        const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
        
        if (!clientId || !clientSecret) {
          console.error("LinkedIn client credentials not configured");
        } else {
          const refreshResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: user.linkedinRefreshToken,
              client_id: clientId,
              client_secret: clientSecret,
            }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            accessToken = refreshData.access_token;
            const newRefreshToken = refreshData.refresh_token || user.linkedinRefreshToken;
            const expiresIn = refreshData.expires_in || 5184000; // Default 60 days
            const newTokenExpiry = new Date(now.getTime() + expiresIn * 1000);

            // Update tokens in database and ensure connected flag is true
            await User.findOneAndUpdate(
              { email: session.user.email.toLowerCase() },
              {
                $set: {
                  linkedinAccessToken: accessToken,
                  linkedinRefreshToken: newRefreshToken,
                  linkedinTokenExpiry: newTokenExpiry,
                  linkedinConnected: true, // Ensure connection status remains true after refresh
                },
              }
            );

            console.log("LinkedIn token refreshed successfully");
          } else {
            const errorText = await refreshResponse.text();
            console.error("LinkedIn token refresh failed:", refreshResponse.status, errorText);
            return NextResponse.json(
              { 
                success: false, 
                message: "LinkedIn token expired and refresh failed. Please reconnect your LinkedIn account.",
                requiresReconnect: true
              },
              { status: 401 }
            );
          }
        }
      } catch (refreshError) {
        console.error("LinkedIn token refresh error:", refreshError);
        return NextResponse.json(
          { 
            success: false, 
            message: "Failed to refresh LinkedIn token. Please reconnect your LinkedIn account.",
            requiresReconnect: true
          },
          { status: 401 }
        );
      }
    }

    // Always try to fetch fresh data from LinkedIn People API first (more reliable for profile picture)
    // Even if we have some data, fetch fresh to ensure it's up to date
    try {
      console.log("Fetching LinkedIn People API with token:", accessToken ? `${accessToken.substring(0, 20)}...` : "NO TOKEN");
      
      const peopleResponse = await fetch(
        "https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0", // LinkedIn API version header
          },
          // Add timeout
          signal: AbortSignal.timeout(30000), // 30 second timeout
        }
      );
      
      console.log("LinkedIn People API response status:", peopleResponse.status, peopleResponse.statusText);

      if (peopleResponse.ok) {
        const peopleData = await peopleResponse.json();
        console.log("LinkedIn People API response:", JSON.stringify(peopleData, null, 2));
        console.log("LinkedIn People API response keys:", Object.keys(peopleData || {}));
        
        // Always update ID if available
        if (peopleData?.id) {
          linkedinId = String(peopleData.id);
          console.log("LinkedIn ID extracted:", linkedinId);
        } else {
          console.warn("LinkedIn ID not found in People API response");
        }
        
        // Always try to get name - try multiple localization options
        const firstName = peopleData?.firstName?.localized?.en_US || 
                         peopleData?.firstName?.localized?.en || 
                         peopleData?.firstName?.preferredLocale?.language ||
                         (peopleData?.firstName?.localized ? Object.values(peopleData.firstName.localized)[0] : "") ||
                         "";
        const lastName = peopleData?.lastName?.localized?.en_US || 
                       peopleData?.lastName?.localized?.en || 
                       peopleData?.lastName?.preferredLocale?.language ||
                       (peopleData?.lastName?.localized ? Object.values(peopleData.lastName.localized)[0] : "") ||
                       "";
        
        console.log("LinkedIn name extraction:", {
          firstNameRaw: peopleData?.firstName,
          lastNameRaw: peopleData?.lastName,
          firstNameExtracted: firstName,
          lastNameExtracted: lastName
        });
        
        if (firstName || lastName) {
          linkedinName = `${firstName} ${lastName}`.trim();
          console.log("LinkedIn name extracted:", linkedinName);
        } else {
          console.warn("LinkedIn name not found in People API response");
        }
        
        // Always try to get profile picture - try to get the highest quality
        if (peopleData?.profilePicture) {
          console.log("LinkedIn profilePicture structure:", JSON.stringify(peopleData.profilePicture, null, 2));
          const displayImageData = peopleData.profilePicture["displayImage~"];
          if (displayImageData?.elements) {
            console.log("LinkedIn profilePicture elements:", displayImageData.elements.length);
            // Try to get the largest image (usually the last one)
            const images = displayImageData.elements
              .map((el: any) => el?.identifiers?.[0]?.identifier)
              .filter(Boolean);
            console.log("LinkedIn profilePicture images found:", images.length);
            if (images.length > 0) {
              linkedinLogo = images[images.length - 1]; // Usually the last one is the largest
              console.log("LinkedIn profile picture extracted from People API:", linkedinLogo);
            } else {
              console.warn("LinkedIn profile picture images array is empty");
            }
          } else {
            console.warn("LinkedIn profilePicture displayImage~ elements not found");
          }
        } else {
          console.warn("LinkedIn profilePicture not found in People API response");
        }
      } else {
        const errorText = await peopleResponse.text();
        console.error("LinkedIn People API error:", {
          status: peopleResponse.status,
          statusText: peopleResponse.statusText,
          errorText: errorText,
          headers: Object.fromEntries(peopleResponse.headers.entries())
        });
        
        // If token is invalid (401), try to refresh if we haven't already
        if (peopleResponse.status === 401 && user.linkedinRefreshToken && !isTokenExpired) {
          console.log("LinkedIn API returned 401, attempting token refresh...");
          try {
            const clientId = process.env.LINKEDIN_CLIENT_ID;
            const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
            
            if (clientId && clientSecret) {
              const refreshResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  grant_type: "refresh_token",
                  refresh_token: user.linkedinRefreshToken,
                  client_id: clientId,
                  client_secret: clientSecret,
                }),
              });

              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                accessToken = refreshData.access_token;
                const newRefreshToken = refreshData.refresh_token || user.linkedinRefreshToken;
                const expiresIn = refreshData.expires_in || 5184000;
                const newTokenExpiry = new Date(now.getTime() + expiresIn * 1000);

                await User.findOneAndUpdate(
                  { email: session.user.email.toLowerCase() },
                  {
                    $set: {
                      linkedinAccessToken: accessToken,
                      linkedinRefreshToken: newRefreshToken,
                      linkedinTokenExpiry: newTokenExpiry,
                      linkedinConnected: true, // Ensure connection status remains true after refresh
                    },
                  }
                );

                console.log("LinkedIn token refreshed after 401, retrying API call...");
                // Retry the API call with new token
                const retryResponse = await fetch(
                  "https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))",
                  {
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                    },
                  }
                );

                if (retryResponse.ok) {
                  const retryData = await retryResponse.json();
                  if (retryData?.id) linkedinId = String(retryData.id);
                  const firstName = retryData?.firstName?.localized?.en_US || 
                                   retryData?.firstName?.localized?.en ||
                                   (retryData?.firstName?.localized ? Object.values(retryData.firstName.localized)[0] : "") ||
                                   "";
                  const lastName = retryData?.lastName?.localized?.en_US || 
                                 retryData?.lastName?.localized?.en ||
                                 (retryData?.lastName?.localized ? Object.values(retryData.lastName.localized)[0] : "") ||
                                 "";
                  if (firstName || lastName) {
                    linkedinName = `${firstName} ${lastName}`.trim();
                  }
                  if (retryData?.profilePicture) {
                    const displayImageData = retryData.profilePicture["displayImage~"];
                    if (displayImageData?.elements) {
                      const images = displayImageData.elements
                        .map((el: any) => el?.identifiers?.[0]?.identifier)
                        .filter(Boolean);
                      if (images.length > 0) {
                        linkedinLogo = images[images.length - 1];
                      }
                    }
                  }
                }
              }
            }
          } catch (retryError) {
            console.error("LinkedIn token refresh retry error:", retryError);
          }
        }
      }
    } catch (error) {
      console.error("LinkedIn People API fetch error:", error);
    }

        // If we still don't have name or logo or ID, try OpenID Connect userinfo endpoint as fallback
    // Use the potentially refreshed accessToken
    // Always try userinfo endpoint if we're missing any profile data
    if (!linkedinName || !linkedinLogo || !linkedinId) {
      try {
        console.log("Trying LinkedIn userinfo endpoint as fallback...");
        const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });
        
        console.log("LinkedIn userinfo response status:", profileResponse.status, profileResponse.statusText);

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log("LinkedIn userinfo response:", JSON.stringify(profileData, null, 2));
          console.log("LinkedIn userinfo response keys:", Object.keys(profileData || {}));
          
          if (!linkedinId && profileData?.sub) {
            linkedinId = String(profileData.sub);
            console.log("LinkedIn ID extracted from userinfo:", linkedinId);
          } else if (!linkedinId) {
            console.warn("LinkedIn ID (sub) not found in userinfo response");
          }
          
          // Get name - try multiple fields
          if (!linkedinName) {
            if (profileData?.name) {
              linkedinName = profileData.name;
              console.log("LinkedIn name extracted from userinfo (name field):", linkedinName);
            } else if (profileData?.given_name || profileData?.family_name) {
              linkedinName = `${profileData?.given_name || ""} ${profileData?.family_name || ""}`.trim();
              console.log("LinkedIn name extracted from userinfo (given_name/family_name):", linkedinName);
            } else if (profileData?.preferred_username) {
              linkedinName = profileData.preferred_username;
              console.log("LinkedIn name extracted from userinfo (preferred_username):", linkedinName);
            } else {
              console.warn("LinkedIn name not found in userinfo response");
            }
          }
          
          // Get profile picture - try multiple formats
          if (!linkedinLogo) {
            if (profileData?.picture) {
              if (typeof profileData.picture === "string") {
                linkedinLogo = profileData.picture;
                console.log("LinkedIn logo extracted from userinfo (picture string):", linkedinLogo);
              } else if (profileData.picture?.url) {
                linkedinLogo = profileData.picture.url;
                console.log("LinkedIn logo extracted from userinfo (picture.url):", linkedinLogo);
              } else if (profileData.picture?.data?.url) {
                linkedinLogo = profileData.picture.data.url;
                console.log("LinkedIn logo extracted from userinfo (picture.data.url):", linkedinLogo);
              }
            } else if (profileData?.picture_url) {
              linkedinLogo = profileData.picture_url;
              console.log("LinkedIn logo extracted from userinfo (picture_url):", linkedinLogo);
            } else if (profileData?.profile_picture) {
              linkedinLogo = typeof profileData.profile_picture === "string" 
                ? profileData.profile_picture 
                : profileData.profile_picture?.url;
              console.log("LinkedIn logo extracted from userinfo (profile_picture):", linkedinLogo);
            } else {
              console.warn("LinkedIn logo not found in userinfo response");
            }
          }
        } else {
          const errorText = await profileResponse.text();
          console.error("LinkedIn userinfo error:", {
            status: profileResponse.status,
            statusText: profileResponse.statusText,
            errorText: errorText,
            headers: Object.fromEntries(profileResponse.headers.entries())
          });
        }
      } catch (error) {
        console.error("LinkedIn userinfo fetch error:", error);
      }
    }

    // Ensure URL is properly formatted
    if (linkedinLogo && typeof linkedinLogo === "string") {
      if (!linkedinLogo.startsWith("http")) {
        linkedinLogo = linkedinLogo.startsWith("//") 
          ? `https:${linkedinLogo}` 
          : `https://${linkedinLogo}`;
      }
      if (!linkedinLogo.startsWith("https:")) {
        linkedinLogo = linkedinLogo.replace(/^http:/, "https:");
      }
    } else {
      linkedinLogo = null;
    }

    // Update user with fetched data - always update ALL fields if we have them
    const updateData: any = {};
    if (linkedinId) {
      updateData.linkedinId = linkedinId;
    }
    // Always update name and logo if we have them (even if they exist, might be updated)
    if (linkedinName) {
      updateData.linkedinName = linkedinName;
    } else {
      // If name is null/empty, still update to ensure it's cleared if needed
      updateData.linkedinName = null;
    }
    if (linkedinLogo) {
      updateData.linkedinLogo = linkedinLogo;
    } else {
      // If logo is null/empty, still update to ensure it's cleared if needed
      updateData.linkedinLogo = null;
    }
    
    // Always ensure linkedinConnected flag is set to true if we have token
    if (accessToken) {
      updateData.linkedinConnected = true;
    }

    console.log("Preparing to update LinkedIn profile data:", {
      linkedinId,
      linkedinName,
      linkedinLogo,
      hasLogo: !!linkedinLogo,
      hasName: !!linkedinName,
      updateDataKeys: Object.keys(updateData)
    });

    if (Object.keys(updateData).length > 0) {
      const updatedUser = await User.findOneAndUpdate(
        { email: session.user.email.toLowerCase() },
        { $set: updateData },
        { new: true }
      );
      
      // Verify the update
      const verifyUser = await User.findOne({ email: session.user.email.toLowerCase() });
      
      console.log("LinkedIn profile data updated in database:", {
        linkedinId: verifyUser?.linkedinId || updatedUser?.linkedinId,
        linkedinName: verifyUser?.linkedinName || updatedUser?.linkedinName,
        linkedinLogo: verifyUser?.linkedinLogo || updatedUser?.linkedinLogo,
        logoSaved: !!(verifyUser?.linkedinLogo || updatedUser?.linkedinLogo),
        nameSaved: !!(verifyUser?.linkedinName || updatedUser?.linkedinName),
        logoUrl: verifyUser?.linkedinLogo || updatedUser?.linkedinLogo,
        nameValue: verifyUser?.linkedinName || updatedUser?.linkedinName
      });
    } else {
      console.log("No LinkedIn profile data to update - all fields are null/empty");
    }

    console.log("LinkedIn profile API completed successfully:", {
      linkedinId,
      linkedinName: linkedinName || "not found",
      linkedinLogo: linkedinLogo ? "found" : "not found",
    });

    return NextResponse.json({
      success: true,
      data: {
        linkedinId,
        linkedinName,
        linkedinLogo,
      },
    });
  } catch (error: any) {
    console.error("LinkedIn profile fetch error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch LinkedIn profile" },
      { status: 500 }
    );
  }
}

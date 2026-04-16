import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    const baseUrl = process.env.NEXTAUTH_URL || "";

    if (error) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&linkedin_error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&linkedin_error=no_code`);
    }

    const cookieStore = await cookies();
    const stateCookie = cookieStore.get("linkedin_oauth_state")?.value;
    if (!state || !stateCookie || state !== stateCookie) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&linkedin_error=state_mismatch`);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts`);
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri =
      process.env.LINKEDIN_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/auth/callback/auths`;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&linkedin_error=not_configured`);
    }

    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error("LinkedIn token exchange error:", errorData);
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&linkedin_error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;

    if (!accessToken) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&linkedin_error=no_access_token`);
    }

    const tokenExpiry = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

    // Fetch LinkedIn profile data using OpenID Connect userinfo endpoint
    let linkedinId: string | null = null;
    let linkedinName: string | null = null;
    let linkedinLogo: string | null = null;

    try {
      // Try OpenID Connect userinfo endpoint first
      const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        linkedinId = profileData?.sub ? String(profileData.sub) : null;
        linkedinName = profileData?.name || profileData?.given_name || profileData?.family_name 
          ? `${profileData?.given_name || ""} ${profileData?.family_name || ""}`.trim() || profileData?.name
          : null;
        
        // Get profile picture - LinkedIn OpenID Connect returns picture in different formats
        if (profileData?.picture) {
          linkedinLogo = typeof profileData.picture === "string" 
            ? profileData.picture 
            : profileData.picture?.url || profileData.picture?.data?.url;
        } else if (profileData?.picture_url) {
          linkedinLogo = profileData.picture_url;
        } else if (profileData?.profilePicture) {
          linkedinLogo = typeof profileData.profilePicture === "string"
            ? profileData.profilePicture
            : profileData.profilePicture?.displayImage || profileData.profilePicture?.url;
        }
        
        // If no picture from userinfo, try LinkedIn People API
        if (!linkedinLogo) {
          try {
            const peopleResponse = await fetch(
              "https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))",
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            
            if (peopleResponse.ok) {
              const peopleData = await peopleResponse.json();
              console.log("LinkedIn People API fallback response:", JSON.stringify(peopleData, null, 2));
              
              if (!linkedinId && peopleData?.id) {
                linkedinId = String(peopleData.id);
              }
              
              if (!linkedinName) {
                const firstName = peopleData?.firstName?.localized?.en_US || peopleData?.firstName?.localized?.en || "";
                const lastName = peopleData?.lastName?.localized?.en_US || peopleData?.lastName?.localized?.en || "";
                if (firstName || lastName) {
                  linkedinName = `${firstName} ${lastName}`.trim();
                }
              }
              
              if (!linkedinLogo && peopleData?.profilePicture) {
                const displayImageData = peopleData.profilePicture["displayImage~"];
                if (displayImageData?.elements?.[0]?.identifiers?.[0]?.identifier) {
                  linkedinLogo = displayImageData.elements[0].identifiers[0].identifier;
                }
              }
            } else {
              const errorText2 = await peopleResponse.text();
              console.error("LinkedIn People API fallback error:", peopleResponse.status, errorText2);
            }
          } catch (peopleError) {
            console.error("LinkedIn People API fallback error:", peopleError);
          }
        }
        
        console.log("Continuing with connection - profile data will be fetched later via /api/linkedin/profile");
      } else {
        const profileError = await profileResponse.json().catch(() => ({}));
        console.error("LinkedIn userinfo fetch error:", profileError);
      }
    } catch (error) {
      console.error("LinkedIn profile fetch error:", error);
      // Continue with connection even if profile fetch fails
    }

    await connectDB();
    
    // First, save the access token immediately so it's available
    const initialUpdateData: any = {
      linkedinAccessToken: accessToken,
      linkedinRefreshToken: refreshToken || null,
      linkedinTokenExpiry: tokenExpiry,
    };
    
    if (linkedinId) {
      initialUpdateData.linkedinId = linkedinId;
    }
    
    // Save token first
    await User.findOneAndUpdate(
      { email: session.user.email.toLowerCase() },
      { $set: initialUpdateData }
    );
    
    console.log("LinkedIn token saved, now fetching profile data...");
    
    // Now try to fetch profile data with the saved token
    // Try multiple endpoints to get profile data
    if (!linkedinName || !linkedinLogo) {
      // Try LinkedIn People API first (more reliable for profile picture)
      try {
        const peopleResponse = await fetch(
          "https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        
        if (peopleResponse.ok) {
          const peopleData = await peopleResponse.json();
          console.log("LinkedIn People API response (after token save):", JSON.stringify(peopleData, null, 2));
          
          if (!linkedinId && peopleData?.id) {
            linkedinId = String(peopleData.id);
          }
          
          // Get name
          if (!linkedinName) {
            const firstName = peopleData?.firstName?.localized?.en_US || 
                             peopleData?.firstName?.localized?.en || 
                             peopleData?.firstName?.preferredLocale?.language || 
                             "";
            const lastName = peopleData?.lastName?.localized?.en_US || 
                           peopleData?.lastName?.localized?.en || 
                           peopleData?.lastName?.preferredLocale?.language || 
                           "";
            if (firstName || lastName) {
              linkedinName = `${firstName} ${lastName}`.trim();
            }
          }
          
          // Get profile picture - try to get the highest quality
          if (!linkedinLogo && peopleData?.profilePicture) {
            const displayImageData = peopleData.profilePicture["displayImage~"];
            if (displayImageData?.elements) {
              // Try to get the largest image
              const images = displayImageData.elements
                .map((el: any) => el?.identifiers?.[0]?.identifier)
                .filter(Boolean);
              if (images.length > 0) {
                linkedinLogo = images[images.length - 1]; // Usually the last one is the largest
                console.log("LinkedIn profile picture extracted:", linkedinLogo);
              }
            }
          }
          
          // Log extracted data
          console.log("LinkedIn profile data from People API:", {
            linkedinId,
            linkedinName,
            hasLogo: !!linkedinLogo,
            logoUrl: linkedinLogo
          });
        } else {
          const errorText = await peopleResponse.text();
          console.error("LinkedIn People API error (after token save):", peopleResponse.status, errorText);
        }
      } catch (error) {
        console.error("Error fetching from People API after token save:", error);
      }
      
      // If still no data, try userinfo endpoint
      if (!linkedinName || !linkedinLogo) {
        try {
          const profileResponse2 = await fetch("https://api.linkedin.com/v2/userinfo", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          });

          if (profileResponse2.ok) {
            const profileData2 = await profileResponse2.json();
            console.log("LinkedIn userinfo response (after token save):", JSON.stringify(profileData2, null, 2));
            
            if (!linkedinId && profileData2?.sub) {
              linkedinId = String(profileData2.sub);
            }
            
            // Get name
            if (!linkedinName) {
              if (profileData2?.name) {
                linkedinName = profileData2.name;
              } else if (profileData2?.given_name || profileData2?.family_name) {
                linkedinName = `${profileData2?.given_name || ""} ${profileData2?.family_name || ""}`.trim();
              }
            }
            
            // Get profile picture
            if (!linkedinLogo) {
              if (profileData2?.picture) {
                if (typeof profileData2.picture === "string") {
                  linkedinLogo = profileData2.picture;
                } else if (profileData2.picture?.url) {
                  linkedinLogo = profileData2.picture.url;
                } else if (profileData2.picture?.data?.url) {
                  linkedinLogo = profileData2.picture.data.url;
                }
              } else if (profileData2?.picture_url) {
                linkedinLogo = profileData2.picture_url;
              }
            }
          }
        } catch (error) {
          console.error("Error fetching profile data after token save:", error);
        }
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
    }
    
    // Now save all data including profile info
    const finalUpdateData: any = {
      linkedinAccessToken: accessToken,
      linkedinRefreshToken: refreshToken || null,
      linkedinTokenExpiry: tokenExpiry,
    };
    
    if (linkedinId) {
      finalUpdateData.linkedinId = linkedinId;
    }
    if (linkedinName) {
      finalUpdateData.linkedinName = linkedinName;
    }
    if (linkedinLogo) {
      finalUpdateData.linkedinLogo = linkedinLogo;
    }
    
    // Set linkedinConnected flag based on whether we have an ID or token
    finalUpdateData.linkedinConnected = !!(linkedinId || accessToken);
    
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email.toLowerCase() },
      { $set: finalUpdateData },
      { new: true }
    );
    
    // Verify final saved data by reading from DB again
    const finalUser = await User.findOne({ email: session.user.email.toLowerCase() });
    const savedLogo = finalUser?.linkedinLogo || updatedUser?.linkedinLogo;
    const savedName = finalUser?.linkedinName || updatedUser?.linkedinName;
    
    console.log("LinkedIn connection complete - Final saved data:", {
      email: session.user.email,
      linkedinId: finalUser?.linkedinId || updatedUser?.linkedinId,
      linkedinName: savedName,
      linkedinLogo: savedLogo,
      hasAccessToken: !!(finalUser?.linkedinAccessToken || updatedUser?.linkedinAccessToken),
      tokenSaved: !!(finalUser?.linkedinAccessToken || updatedUser?.linkedinAccessToken),
      logoSaved: !!savedLogo,
      nameSaved: !!savedName,
      logoUrl: savedLogo,
      nameValue: savedName,
      logoUrlLength: savedLogo?.length || 0,
      logoUrlStartsWith: savedLogo?.substring(0, 20) || "N/A"
    });
    
    // If logo was saved, verify it's a valid URL
    if (savedLogo) {
      try {
        const logoUrl = new URL(savedLogo);
        console.log("LinkedIn logo URL is valid:", logoUrl.href);
      } catch (urlError) {
        console.error("LinkedIn logo URL is invalid:", savedLogo, urlError);
      }
    } else {
      console.warn("LinkedIn logo was NOT saved - profile picture not found in API response");
    }

    const response = NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&linkedin_connected=true`);
    response.cookies.set("linkedin_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    console.error("LinkedIn callback error:", error);
    const baseUrl = process.env.NEXTAUTH_URL || "";
    return NextResponse.redirect(
      `${baseUrl}/dashboard?tab=Accounts&linkedin_error=${encodeURIComponent(error?.message || "unknown_error")}`
    );
  }
}

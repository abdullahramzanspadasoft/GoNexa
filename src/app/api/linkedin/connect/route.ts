import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Check if LinkedIn is already connected (by ID, token, or connected flag)
    if (user.linkedinId || user.linkedinAccessToken || user.linkedinConnected) {
      return NextResponse.json({
        success: true,
        message: "LinkedIn already connected",
        data: { 
          linkedinId: user.linkedinId,
          linkedinConnected: user.linkedinConnected || !!(user.linkedinId || user.linkedinAccessToken),
        },
      });
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    
    // Use the main callback route: /auth/callback
    // This must match EXACTLY what's in LinkedIn Developer Portal
    let redirectUri = process.env.LINKEDIN_REDIRECT_URI;
    
    // If not set, use default
    if (!redirectUri) {
      redirectUri = `${baseUrl}/auth/callback`;
    } else {
      // If set but doesn't have /auth/callback, add it
      // This handles cases where user might have set just the base URL
      if (!redirectUri.includes('/auth/callback')) {
        // Remove trailing slash from base if present
        const cleanBase = redirectUri.replace(/\/$/, "");
        redirectUri = `${cleanBase}/auth/callback`;
      }
    }
    
    // Remove trailing slash if present (must match exactly)
    redirectUri = redirectUri.replace(/\/$/, "");
    
    // Ensure it's a valid URL
    try {
      const url = new URL(redirectUri);
      // Double check it has the correct path
      if (!url.pathname.includes('/auth/callback')) {
        redirectUri = `${url.protocol}//${url.host}/auth/callback`;
      }
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid redirect URI format" },
        { status: 500 }
      );
    }

    if (!clientId) {
      return NextResponse.json(
        { success: false, message: "LinkedIn OAuth is not configured. Please set LINKEDIN_CLIENT_ID" },
        { status: 500 }
      );
    }
    
    // Log the exact redirect URI being used
    console.log("LinkedIn OAuth Configuration:", {
      clientId: clientId.substring(0, 10) + "...",
      redirectUri,
      baseUrl,
      note: "This redirectUri MUST match EXACTLY in LinkedIn Developer Portal"
    });

    const state = crypto.randomUUID();
    // LinkedIn OpenID Connect scopes - profile and email are required for userinfo endpoint
    // w_member_social is required for posting content (including videos) to LinkedIn
    // Note: For People API (/v2/me), we need r_liteprofile or r_basicprofile, but OpenID Connect works with userinfo
    const scope = "openid profile email w_member_social";

    // Build authorization URL with exact redirect URI
    const authParams = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri, // Must match exactly what's in LinkedIn Developer Portal
      scope,
      state,
    });

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${authParams.toString()}`;
    
    console.log("LinkedIn Authorization URL generated:", {
      redirectUri,
      authUrl: authUrl.substring(0, 100) + "...",
      note: "Make sure this redirect_uri matches EXACTLY in LinkedIn Developer Portal"
    });

    // Create response and set both cookies
    const response = NextResponse.json({ success: true, authUrl });
    
    // Store redirect URI in cookie so callback can use the exact same one
    response.cookies.set("linkedin_redirect_uri", redirectUri, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10, // 10 minutes
    });
    
    // Store OAuth state for security validation
    response.cookies.set("linkedin_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10, // 10 minutes
    });

    return response;
  } catch (error: any) {
    console.error("LinkedIn connect error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to initiate LinkedIn connection" },
      { status: 500 }
    );
  }
}

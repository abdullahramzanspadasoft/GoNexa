import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import crypto from "crypto";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { normalizeOAuthRedirectUri, trimOAuthEnv } from "@/lib/oauthEnv";

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

    if (user.tiktokId) {
      return NextResponse.json({
        success: true,
        message: "TikTok already connected",
        data: {
          tiktokId: user.tiktokId,
          tiktokName: user.tiktokName,
          tiktokLogo: user.tiktokLogo,
        },
      });
    }

    const clientKey = trimOAuthEnv(process.env.TIKTOK_CLIENT_KEY || process.env.TIKTOK_CLIENT_ID);
    const clientSecret = trimOAuthEnv(process.env.TIKTOK_CLIENT_SECRET);
    const redirectUri = normalizeOAuthRedirectUri(
      trimOAuthEnv(process.env.TIKTOK_REDIRECT_URI) ||
        `${trimOAuthEnv(process.env.NEXTAUTH_URL) || "http://localhost:3000"}/auth/tiktok/callback`
    );

    if (!clientKey) {
      console.error("TikTok OAuth Error: TIKTOK_CLIENT_KEY is not set or empty");
      return NextResponse.json(
        { success: false, message: "TikTok OAuth client_key is not configured. Please set TIKTOK_CLIENT_KEY in your environment variables." },
        { status: 500 }
      );
    }

    if (!clientSecret) {
      console.error("TikTok OAuth Error: TIKTOK_CLIENT_SECRET is not set or empty");
      return NextResponse.json(
        { success: false, message: "TikTok OAuth client_secret is not configured. Please set TIKTOK_CLIENT_SECRET in your environment variables." },
        { status: 500 }
      );
    }

    if (!redirectUri) {
      console.error("TikTok OAuth Error: Redirect URI is not configured");
      return NextResponse.json(
        { success: false, message: "TikTok OAuth redirect URI is not configured. Please set TIKTOK_REDIRECT_URI or NEXTAUTH_URL in your environment variables." },
        { status: 500 }
      );
    }

    // Validate client_key format (TikTok client keys are typically alphanumeric)
    if (!/^[a-zA-Z0-9]+$/.test(clientKey)) {
      console.error("TikTok OAuth Error: Invalid client_key format");
      return NextResponse.json(
        { success: false, message: "Invalid TikTok client_key format. Please check your TIKTOK_CLIENT_KEY value." },
        { status: 500 }
      );
    }

    const state = crypto.randomUUID();
    const scope = "user.info.basic";

    // Generate PKCE parameters (required by TikTok)
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${new URLSearchParams({
      client_key: clientKey,
      scope,
      response_type: "code",
      redirect_uri: redirectUri,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    }).toString()}`;

    const response = NextResponse.json({ success: true, authUrl });
    response.cookies.set("tiktok_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });
    response.cookies.set("tiktok_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch (error: any) {
    console.error("TikTok connect error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to initiate TikTok connection" },
      { status: 500 }
    );
  }
}

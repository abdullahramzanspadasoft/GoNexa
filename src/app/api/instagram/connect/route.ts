import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";

import { authOptions } from "../../auth/[...nextauth]/route";
import { normalizeOAuthRedirectUri, trimOAuthEnv } from "@/lib/oauthEnv";
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

    if (user.instagramAccessToken || user.instagramId) {
      return NextResponse.json({
        success: true,
        message: "Instagram already connected",
        data: { instagramId: user.instagramId, instagramConnected: true },
      });
    }

    const appId = trimOAuthEnv(process.env.INSTAGRAM_APP_ID);
    const clientSecret = trimOAuthEnv(process.env.INSTAGRAM_CLIENT_SECRET);
    const baseUrl = trimOAuthEnv(process.env.NEXTAUTH_URL) || "http://localhost:3000";
    const redirectUri = normalizeOAuthRedirectUri(
      trimOAuthEnv(process.env.INSTAGRAM_REDIRECT_URI) || `${baseUrl}/api/instagram/callback`
    );

    if (!appId || !clientSecret) {
      return NextResponse.json(
        { success: false, message: "Instagram OAuth is not configured (INSTAGRAM_APP_ID / INSTAGRAM_CLIENT_SECRET)." },
        { status: 500 }
      );
    }

    const state = crypto.randomUUID();
    const scope = "user_profile,user_media";
    const authUrl = `https://api.instagram.com/oauth/authorize?${new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope,
      response_type: "code",
      state,
    }).toString()}`;

    const response = NextResponse.json({ success: true, authUrl });
    response.cookies.set("instagram_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });
    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to initiate Instagram connection";
    console.error("Instagram connect error:", error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

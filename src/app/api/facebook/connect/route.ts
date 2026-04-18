import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";

import { authOptions } from "../../auth/[...nextauth]/route";
import { normalizeOAuthRedirectUri, trimOAuthEnv } from "@/lib/oauthEnv";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const FB_GRAPH_VERSION = "v21.0";

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

    if (user.facebookAccessToken || user.facebookId) {
      return NextResponse.json({
        success: true,
        message: "Facebook already connected",
        data: { facebookId: user.facebookId, facebookConnected: true },
      });
    }

    const appId = trimOAuthEnv(process.env.FACEBOOK_APP_ID);
    const baseUrl = trimOAuthEnv(process.env.NEXTAUTH_URL) || "http://localhost:3000";
    const redirectUri = normalizeOAuthRedirectUri(
      trimOAuthEnv(process.env.FACEBOOK_REDIRECT_URI) || `${baseUrl}/auth/facebook/callback`
    );

    if (!appId) {
      return NextResponse.json(
        { success: false, message: "Facebook OAuth is not configured (FACEBOOK_APP_ID)." },
        { status: 500 }
      );
    }

    const state = crypto.randomUUID();
    const scope = "public_profile,email";
    const authUrl = `https://www.facebook.com/${FB_GRAPH_VERSION}/dialog/oauth?${new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      state,
      scope,
      response_type: "code",
    }).toString()}`;

    const response = NextResponse.json({ success: true, authUrl });
    response.cookies.set("facebook_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });
    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to initiate Facebook connection";
    console.error("Facebook connect error:", error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

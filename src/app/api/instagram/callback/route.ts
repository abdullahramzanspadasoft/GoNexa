import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";

import { authOptions } from "../../auth/[...nextauth]/route";
import { normalizeOAuthRedirectUri, trimOAuthEnv } from "@/lib/oauthEnv";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: Request) {
  const baseUrl = trimOAuthEnv(process.env.NEXTAUTH_URL) || "";
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorReason = searchParams.get("error_reason");

    if (error) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard?tab=Accounts&instagram_error=${encodeURIComponent(errorReason || error)}`
      );
    }
    if (!code) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&instagram_error=no_code`);
    }

    const cookieStore = await cookies();
    const stateCookie = cookieStore.get("instagram_oauth_state")?.value;
    if (!state || !stateCookie || state !== stateCookie) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&instagram_error=state_mismatch`);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&instagram_error=unauthorized`);
    }

    const appId = trimOAuthEnv(process.env.INSTAGRAM_APP_ID);
    const clientSecret = trimOAuthEnv(process.env.INSTAGRAM_CLIENT_SECRET);
    const redirectUri = normalizeOAuthRedirectUri(
      trimOAuthEnv(process.env.INSTAGRAM_REDIRECT_URI) ||
        `${trimOAuthEnv(process.env.NEXTAUTH_URL) || "http://localhost:3000"}/api/instagram/callback`
    );

    if (!appId || !clientSecret) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&instagram_error=not_configured`);
    }

    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });

    const tokenText = await tokenRes.text();
    let tokenJson: { access_token?: string; user_id?: number | string } = {};
    try {
      tokenJson = JSON.parse(tokenText) as typeof tokenJson;
    } catch {
      console.error("Instagram token parse error:", tokenText);
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&instagram_error=token_exchange_failed`);
    }

    if (!tokenRes.ok || !tokenJson.access_token) {
      console.error("Instagram token exchange failed:", tokenText);
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&instagram_error=token_exchange_failed`);
    }

    const accessToken = tokenJson.access_token;
    let instagramId: string | null = tokenJson.user_id != null ? String(tokenJson.user_id) : null;
    let instagramName: string | null = null;
    let instagramLogo: string | null = null;

    try {
      const meUrl = new URL("https://graph.instagram.com/me");
      meUrl.searchParams.set("fields", "id,username,account_type");
      meUrl.searchParams.set("access_token", accessToken);
      const meRes = await fetch(meUrl.toString());
      if (meRes.ok) {
        const me = (await meRes.json()) as { id?: string; username?: string };
        if (me.id) instagramId = String(me.id);
        instagramName = me.username ? String(me.username) : instagramName;
      }
    } catch (e) {
      console.error("Instagram profile fetch:", e);
    }

    await connectDB();
    await User.findOneAndUpdate(
      { email: session.user.email.toLowerCase() },
      {
        $set: {
          instagramId,
          instagramName,
          instagramLogo,
          instagramAccessToken: accessToken,
          instagramRefreshToken: null,
          instagramTokenExpiry: null,
        },
      }
    );

    const res = NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&instagram_connected=true`);
    res.cookies.set("instagram_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (error: unknown) {
    console.error("Instagram callback error:", error);
    return NextResponse.redirect(
      `${baseUrl}/dashboard?tab=Accounts&instagram_error=${encodeURIComponent(error instanceof Error ? error.message : "callback_failed")}`
    );
  }
}

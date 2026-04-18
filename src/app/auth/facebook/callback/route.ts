import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { normalizeOAuthRedirectUri, trimOAuthEnv } from "@/lib/oauthEnv";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const FB_GRAPH_VERSION = "v21.0";

export async function GET(request: Request) {
  const baseUrl = trimOAuthEnv(process.env.NEXTAUTH_URL) || "";
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard?tab=Accounts&facebook_error=${encodeURIComponent(errorDescription || error)}`
      );
    }
    if (!code) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&facebook_error=no_code`);
    }

    const cookieStore = await cookies();
    const stateCookie = cookieStore.get("facebook_oauth_state")?.value;
    if (!state || !stateCookie || state !== stateCookie) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&facebook_error=state_mismatch`);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&facebook_error=unauthorized`);
    }

    const appId = trimOAuthEnv(process.env.FACEBOOK_APP_ID);
    const appSecret = trimOAuthEnv(process.env.FACEBOOK_CLIENT_SECRET);
    const redirectUri = normalizeOAuthRedirectUri(
      trimOAuthEnv(process.env.FACEBOOK_REDIRECT_URI) ||
        `${trimOAuthEnv(process.env.NEXTAUTH_URL) || "http://localhost:3000"}/auth/facebook/callback`
    );

    if (!appId || !appSecret) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&facebook_error=not_configured`);
    }

    const tokenUrl = new URL(`https://graph.facebook.com/${FB_GRAPH_VERSION}/oauth/access_token`);
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenText = await tokenRes.text();
    let tokenJson: { access_token?: string } = {};
    try {
      tokenJson = JSON.parse(tokenText) as typeof tokenJson;
    } catch {
      console.error("Facebook token JSON parse error:", tokenText);
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&facebook_error=token_exchange_failed`);
    }

    if (!tokenRes.ok || !tokenJson.access_token) {
      console.error("Facebook token exchange failed:", tokenText);
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&facebook_error=token_exchange_failed`);
    }

    const accessToken = tokenJson.access_token;

    const meUrl = new URL(`https://graph.facebook.com/${FB_GRAPH_VERSION}/me`);
    meUrl.searchParams.set("fields", "id,name,picture.width(200).height(200)");
    meUrl.searchParams.set("access_token", accessToken);
    const meRes = await fetch(meUrl.toString());
    let facebookId: string | null = null;
    let facebookName: string | null = null;
    let facebookLogo: string | null = null;

    if (meRes.ok) {
      const me = (await meRes.json()) as {
        id?: string;
        name?: string;
        picture?: { data?: { url?: string } };
      };
      if (me.id) facebookId = String(me.id);
      facebookName = me.name ? String(me.name) : null;
      facebookLogo = me.picture?.data?.url ? String(me.picture.data.url) : null;
    }

    await connectDB();
    await User.findOneAndUpdate(
      { email: session.user.email.toLowerCase() },
      {
        $set: {
          facebookId,
          facebookName,
          facebookLogo,
          facebookAccessToken: accessToken,
          facebookRefreshToken: null,
          facebookTokenExpiry: null,
        },
      }
    );

    const res = NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&facebook_connected=true`);
    res.cookies.set("facebook_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (error: unknown) {
    console.error("Facebook callback error:", error);
    return NextResponse.redirect(
      `${baseUrl}/dashboard?tab=Accounts&facebook_error=${encodeURIComponent(error instanceof Error ? error.message : "callback_failed")}`
    );
  }
}

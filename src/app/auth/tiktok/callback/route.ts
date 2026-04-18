import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { normalizeOAuthRedirectUri, trimOAuthEnv } from "@/lib/oauthEnv";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const baseUrl = process.env.NEXTAUTH_URL || "";

    if (error) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&tiktok_error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&tiktok_error=no_code`);
    }

    const cookieStore = await cookies();
    const stateCookie = cookieStore.get("tiktok_oauth_state")?.value;
    const codeVerifier = cookieStore.get("tiktok_code_verifier")?.value;
    
    if (!state || !stateCookie || state !== stateCookie) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&tiktok_error=state_mismatch`);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts`);
    }

    const clientKey = trimOAuthEnv(process.env.TIKTOK_CLIENT_KEY || process.env.TIKTOK_CLIENT_ID);
    const clientSecret = trimOAuthEnv(process.env.TIKTOK_CLIENT_SECRET);
    const redirectUri = normalizeOAuthRedirectUri(
      trimOAuthEnv(process.env.TIKTOK_REDIRECT_URI) ||
        `${trimOAuthEnv(process.env.NEXTAUTH_URL) || "http://localhost:3000"}/auth/tiktok/callback`
    );

    if (!clientKey) {
      console.error("TikTok OAuth Error: TIKTOK_CLIENT_KEY is not set or empty");
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&tiktok_error=client_key_missing`);
    }

    if (!clientSecret) {
      console.error("TikTok OAuth Error: TIKTOK_CLIENT_SECRET is not set or empty");
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&tiktok_error=client_secret_missing`);
    }

    if (!redirectUri) {
      console.error("TikTok OAuth Error: Redirect URI is not configured");
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&tiktok_error=redirect_uri_missing`);
    }

    const tokenBody: Record<string, string> = {
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    };

    // Add code_verifier if PKCE was used
    if (codeVerifier) {
      tokenBody.code_verifier = codeVerifier;
    }

    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(tokenBody),
    });

    if (!tokenResponse.ok) {
      const tokenErr = await tokenResponse.text().catch(() => "");
      let tokenErrJson: { error?: string; error_description?: string } | null = null;
      try {
        tokenErrJson = JSON.parse(tokenErr) as typeof tokenErrJson;
      } catch {
        tokenErrJson = null;
      }
      console.error("TikTok token exchange error:", tokenErr);
      console.error("TikTok token exchange error details:", tokenErrJson);

      let errorType = "token_exchange_failed";
      if (
        tokenErr.includes("client_key") ||
        tokenErr.includes("invalid_client") ||
        (tokenErrJson &&
          (String(tokenErrJson.error || "").includes("client_key") ||
            String(tokenErrJson.error_description || "").includes("client_key")))
      ) {
        errorType = "invalid_client_key";
      } else if (
        tokenErr.includes("redirect_uri") ||
        tokenErr.includes("redirect_uri_mismatch") ||
        (tokenErrJson && String(tokenErrJson.error || "").includes("redirect_uri"))
      ) {
        errorType = "redirect_uri_mismatch";
      }
      
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&tiktok_error=${errorType}`);
    }

    const tokenData = await tokenResponse.json();
    const tokenPayload = tokenData?.data || tokenData;
    const accessToken = tokenPayload?.access_token;
    const refreshToken = tokenPayload?.refresh_token ?? null;
    const expiresIn = tokenPayload?.expires_in;

    if (!accessToken) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&tiktok_error=no_access_token`);
    }

    let tiktokId: string | null = tokenPayload?.open_id ? String(tokenPayload.open_id) : null;
    let tiktokName: string | null = null;
    let tiktokLogo: string | null = null;

    try {
      const profileResponse = await fetch(
        "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const userInfo = profileData?.data?.user || profileData?.user || profileData?.data;

        if (!tiktokId && userInfo?.open_id) {
          tiktokId = String(userInfo.open_id);
        }
        tiktokName = userInfo?.display_name || null;
        tiktokLogo = userInfo?.avatar_url || null;
      } else {
        const profileErr = await profileResponse.text().catch(() => "");
        console.error("TikTok profile fetch error:", profileErr);
      }
    } catch (profileError) {
      console.error("TikTok profile fetch exception:", profileError);
    }

    const tokenExpiry =
      typeof expiresIn === "number" ? new Date(Date.now() + expiresIn * 1000) : null;

    await connectDB();
    await User.findOneAndUpdate(
      { email: session.user.email.toLowerCase() },
      {
        $set: {
          tiktokId,
          tiktokName,
          tiktokLogo,
          tiktokAccessToken: accessToken,
          tiktokRefreshToken: refreshToken,
          tiktokTokenExpiry: tokenExpiry,
          tiktokConnected: true,
        },
      }
    );

    const response = NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts&tiktok_connected=true`);
    response.cookies.set("tiktok_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set("tiktok_code_verifier", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error: any) {
    console.error("TikTok callback error:", error);
    const baseUrl = process.env.NEXTAUTH_URL || "";
    return NextResponse.redirect(
      `${baseUrl}/dashboard?tab=Accounts&tiktok_error=${encodeURIComponent(error?.message || "unknown_error")}`
    );
  }
}

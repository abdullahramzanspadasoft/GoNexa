import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";

/**
 * Google OAuth Callback Handler
 * Handles OAuth callback from Google at /callback/aouth
 * This route processes the OAuth code and redirects to NextAuth's callback
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    // Handle OAuth errors
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        `/login?error=${encodeURIComponent(error)}`
      );
    }

    // If we have a code, redirect to NextAuth's callback to process it
    // NextAuth will handle the token exchange and session creation
    if (code) {
      // Redirect to NextAuth's callback with the code
      // NextAuth expects the callback at /api/auth/callback/google
      // NextAuth will then redirect to dashboard after processing
      const nextAuthCallbackUrl = `/api/auth/callback/google?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ""}`;
      return NextResponse.redirect(nextAuthCallbackUrl);
    }

    // If no code, check if user is already authenticated (fallback)
    // This handles cases where NextAuth redirects back here after processing
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      // User is authenticated, redirect to dashboard
      return NextResponse.redirect(`/dashboard?tab=Accounts`);
    }

    // If no code and no session, redirect to login
    return NextResponse.redirect(`/login?error=no_code`);
  } catch (error: unknown) {
    console.error("Callback aouth error:", error);
    const errorMessage = error instanceof Error ? error.message : "authentication_failed";
    return NextResponse.redirect(
      `/login?error=${encodeURIComponent(errorMessage)}`
    );
  }
}

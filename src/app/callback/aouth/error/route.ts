import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";

/**
 * Google OAuth Error Handler
 * Handles OAuth errors at /callback/aouth/error
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const error = searchParams.get("error");
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Check if user is authenticated despite the error
    const session = await getServerSession(authOptions);

    // If session exists, redirect to dashboard (error might be minor)
    if (session?.user?.email) {
      return NextResponse.redirect(`${baseUrl}/dashboard?tab=Accounts`);
    }

    // Map OAuth errors to user-friendly messages
    let errorMessage = "Authentication failed. Please try again.";
    
    switch (error) {
      case "OAuthSignin":
        errorMessage = "Error initiating Google sign-in. Please check your Google OAuth configuration.";
        break;
      case "OAuthCallback":
        errorMessage = "Error processing Google callback. Please try again.";
        break;
      case "OAuthCreateAccount":
        errorMessage = "Could not create account. Please try again.";
        break;
      case "EmailCreateAccount":
        errorMessage = "Could not create account with this email.";
        break;
      case "Callback":
        errorMessage = "Authentication callback error. Please try again.";
        break;
      case "OAuthAccountNotLinked":
        errorMessage = "An account with this email already exists. Please sign in with your password.";
        break;
      case "AccessDenied":
        errorMessage = "Access denied. You may need to grant permissions to the application.";
        break;
      case "Configuration":
        errorMessage = "Google OAuth is not properly configured. Please check your environment variables.";
        break;
      default:
        if (error) {
          errorMessage = `Authentication error: ${error}`;
        }
    }

    // Redirect to login with error message
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(errorMessage)}`
    );
  } catch (error: unknown) {
    console.error("Callback aouth error handler error:", error);
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const errorMessage = error instanceof Error ? error.message : "authentication_failed";
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(errorMessage)}`
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?tab=Accounts&youtube_error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?tab=Accounts&youtube_error=no_code`);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?tab=Accounts`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/youtube/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text().catch(() => "Unknown error");
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      console.error("Token exchange error:", errorData);
      
      // Check for specific error types
      let errorMessage = "token_exchange_failed";
      if (errorData.error === "invalid_grant") {
        errorMessage = "Authorization code expired or invalid. Please try again.";
      } else if (errorData.error === "redirect_uri_mismatch") {
        errorMessage = "redirect_uri_mismatch";
      } else if (errorData.error_description) {
        errorMessage = errorData.error_description;
      }
      
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?tab=Accounts&youtube_error=${encodeURIComponent(errorMessage)}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;

    if (!accessToken) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?tab=Accounts&youtube_error=no_access_token`);
    }

    // Calculate token expiry
    const tokenExpiry = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

    // Fetch YouTube channel data using the provided API key
    const youtubeApiKey = process.env.YOUTUBE_API_KEY || "AIzaSyCt39IZsbKhgvE4HKCiWICMNJR0ueV9oeM";
    if (!youtubeApiKey) {
      console.error("YouTube API key not configured");
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?tab=Accounts&youtube_error=api_key_missing`);
    }

    const channelResponse = await fetch(
      `https://youtube.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&mine=true&key=${youtubeApiKey}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!channelResponse.ok) {
      const errorText = await channelResponse.text().catch(() => "Unknown error");
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }
      console.error("YouTube channel fetch error:", errorData);
      
      // Provide more specific error messages
      let errorMessage = "channel_fetch_failed";
      if (errorData.error?.message) {
        if (errorData.error.message.includes("Invalid Credentials") || errorData.error.message.includes("401")) {
          errorMessage = "Invalid access token. Please try connecting again.";
        } else if (errorData.error.message.includes("403") || errorData.error.message.includes("Forbidden")) {
          errorMessage = "Access forbidden. Please check YouTube API permissions.";
        } else if (errorData.error.message.includes("quota") || errorData.error.message.includes("Quota")) {
          errorMessage = "YouTube API quota exceeded. Please try again later.";
        } else {
          errorMessage = errorData.error.message;
        }
      } else if (errorData.error) {
        errorMessage = String(errorData.error);
      }
      
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?tab=Accounts&youtube_error=${encodeURIComponent(errorMessage)}`);
    }

    const channelData = await channelResponse.json();

    if (channelData.items && channelData.items.length > 0) {
      const channel = channelData.items[0];
      const channelId = channel.id || null;
      const channelName = channel.snippet?.title || null;
      
      // Get channel logo from thumbnails - prefer high quality, fallback to medium/default
      let channelLogo = null;
      if (channel.snippet?.thumbnails) {
        // Try different thumbnail sizes in order of preference
        channelLogo = channel.snippet.thumbnails.high?.url || 
                     channel.snippet.thumbnails.medium?.url || 
                     channel.snippet.thumbnails.default?.url || 
                     null;
        
        // Ensure URL is properly formatted (YouTube API returns full URLs)
        if (channelLogo) {
          // Remove any protocol prefix if present and add https
          channelLogo = channelLogo.replace(/^\/\//, "https://");
          if (!channelLogo.startsWith("http")) {
            channelLogo = `https:${channelLogo}`;
          }
        }
      }
      
      // Log channel data for debugging
      console.log("YouTube Channel Data:", {
        channelId,
        channelName,
        hasLogo: !!channelLogo,
        logoUrl: channelLogo,
        thumbnails: channel.snippet?.thumbnails,
        fullSnippet: JSON.stringify(channel.snippet, null, 2)
      });
      
      const subscribers = parseInt(channel.statistics?.subscriberCount || "0", 10);

      await connectDB();
      const updatedUser = await User.findOneAndUpdate(
        { email: session.user.email.toLowerCase() },
        {
          $set: {
            youtubeChannelId: channelId,
            youtubeChannelName: channelName,
            youtubeChannelLogo: channelLogo,
            youtubeChannelSubscribers: subscribers,
            youtubeAccessToken: accessToken,
            youtubeRefreshToken: refreshToken || null,
            youtubeTokenExpiry: tokenExpiry,
          },
        },
        { new: true }
      );
      
      // Verify logo was saved
      console.log("User updated with YouTube data:", {
        email: session.user.email,
        channelId: updatedUser?.youtubeChannelId,
        channelName: updatedUser?.youtubeChannelName,
        channelLogo: updatedUser?.youtubeChannelLogo,
        logoSaved: !!updatedUser?.youtubeChannelLogo
      });

      // Fetch playlists
      if (channelId && youtubeApiKey) {
        try {
          const playlistsResponse = await fetch(
            `https://youtube.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${channelId}&maxResults=25&key=${youtubeApiKey}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (playlistsResponse.ok) {
            const playlistsData = await playlistsResponse.json();
            console.log(`Fetched ${playlistsData.items?.length || 0} playlists for channel ${channelId}`);
          } else {
            const playlistError = await playlistsResponse.json().catch(() => ({}));
            console.error("Playlist fetch error:", playlistError);
          }
        } catch (playlistError) {
          console.error("Error fetching YouTube playlists:", playlistError);
        }
      }

      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?tab=Accounts&youtube_connected=true`);
    }

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?tab=Accounts&youtube_error=no_channel_found`);
  } catch (error: any) {
    console.error("YouTube callback error:", error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?tab=Accounts&youtube_error=${encodeURIComponent(error.message || "unknown_error")}`);
  }
}

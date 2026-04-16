import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Video from "@/models/Video";

async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Token refresh error:", error);
    throw error;
  }
}

async function getValidAccessToken(user: any) {
  let accessToken = user.youtubeAccessToken;

  // Check if token is expired or will expire soon (within 5 minutes)
  if (user.youtubeTokenExpiry && new Date(user.youtubeTokenExpiry) <= new Date(Date.now() + 5 * 60 * 1000)) {
    if (user.youtubeRefreshToken) {
      accessToken = await refreshAccessToken(user.youtubeRefreshToken);
      
      // Update token in database
      const expiresIn = 3600; // 1 hour default
      await User.findOneAndUpdate(
        { email: user.email.toLowerCase() },
        {
          $set: {
            youtubeAccessToken: accessToken,
            youtubeTokenExpiry: new Date(Date.now() + expiresIn * 1000),
          },
        }
      );
    } else {
      throw new Error("Access token expired and no refresh token available");
    }
  }

  return accessToken;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { videoId } = await params;
    if (!videoId) {
      return NextResponse.json({ success: false, message: "Video ID is required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (!user.youtubeChannelId) {
      return NextResponse.json({ success: false, message: "YouTube channel not connected" }, { status: 400 });
    }

    if (!user.youtubeAccessToken) {
      return NextResponse.json({ success: false, message: "YouTube access token not available. Please reconnect your channel." }, { status: 400 });
    }

    // Check if video belongs to user
    const video = await Video.findOne({ 
      youtubeVideoId: videoId,
      userId: user._id 
    });

    if (!video) {
      return NextResponse.json({ success: false, message: "Video not found or you don't have permission to delete it" }, { status: 404 });
    }

    // Get valid access token (refresh if needed)
    const accessToken = await getValidAccessToken(user);

    // Use googleapis to delete video from YouTube
    const { google } = await import("googleapis");

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/youtube/callback`
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: user.youtubeRefreshToken || undefined,
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    // Delete video from YouTube
    try {
      await youtube.videos.delete({
        id: videoId,
      });
    } catch (youtubeError: any) {
      console.error("YouTube delete error:", youtubeError);
      // If video is already deleted on YouTube or doesn't exist, continue to delete from DB
      if (youtubeError.code !== 404 && youtubeError.code !== 403) {
        throw youtubeError;
      }
    }

    // Delete video from database
    await Video.deleteOne({ youtubeVideoId: videoId, userId: user._id });

    return NextResponse.json({
      success: true,
      message: "Video deleted successfully",
    });

  } catch (error: any) {
    console.error("Video delete error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete video" },
      { status: 500 }
    );
  }
}

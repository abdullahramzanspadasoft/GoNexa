import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { Readable } from "stream";

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

export async function POST(request: Request) {
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

    if (!user.youtubeChannelId) {
      return NextResponse.json({ success: false, message: "YouTube channel not connected" }, { status: 400 });
    }

    if (!user.youtubeAccessToken) {
      return NextResponse.json({ success: false, message: "YouTube access token not available. Please reconnect your channel." }, { status: 400 });
    }

    const formData = await request.formData();
    const videoFile = formData.get("video") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const privacyStatus = (formData.get("privacyStatus") as string) || "private";
    const scheduleDate = formData.get("scheduleDate") as string;
    const scheduleTime = formData.get("scheduleTime") as string;

    if (!videoFile) {
      return NextResponse.json({ success: false, message: "Video file is required" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ success: false, message: "Video title is required" }, { status: 400 });
    }

    // Get valid access token (refresh if needed)
    const accessToken = await getValidAccessToken(user);

    // Convert File to Buffer, then to Readable Stream (required by googleapis)
    const arrayBuffer = await videoFile.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);
    const videoStream = Readable.from(videoBuffer);

    // Prepare video metadata
    const videoMetadata = {
      snippet: {
        title: title,
        description: description || "",
        tags: [],
        categoryId: "22", // People & Blogs category
      },
      status: {
        privacyStatus: privacyStatus,
        selfDeclaredMadeForKids: false,
      } as any,
    };

    // Add scheduling if date and time provided
    if (scheduleDate && scheduleTime) {
      const scheduleDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      if (scheduleDateTime > new Date()) {
        videoMetadata.status.publishAt = scheduleDateTime.toISOString();
        videoMetadata.status.privacyStatus = "private"; // Must be private for scheduled videos
      }
    }

    // Use googleapis for video upload
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

    // Upload video
    const uploadResponse = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: videoMetadata,
      media: {
        body: videoStream, // Use stream instead of Buffer
        mimeType: videoFile.type || "video/*",
      },
    });

    if (uploadResponse.data.id) {
      const videoId = uploadResponse.data.id;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const isScheduled = !!(scheduleDate && scheduleTime);
      
      // Get thumbnail URL - YouTube might not have thumbnail immediately after upload
      // Use standard YouTube thumbnail URL format as fallback
      let thumbnailUrl = uploadResponse.data.snippet?.thumbnails?.medium?.url 
        || uploadResponse.data.snippet?.thumbnails?.default?.url
        || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
      
      // Save video to database
      try {
        await Video.findOneAndUpdate(
          { youtubeVideoId: videoId },
          {
            youtubeVideoId: videoId,
            userId: user._id,
            title: uploadResponse.data.snippet?.title || title,
            description: description || "",
            privacyStatus: videoMetadata.status.privacyStatus as "private" | "unlisted" | "public",
            publishAt: videoMetadata.status.publishAt ? new Date(videoMetadata.status.publishAt) : undefined,
            status: isScheduled ? "scheduled" : "uploaded",
            videoUrl: videoUrl,
            thumbnailUrl: thumbnailUrl,
            channelId: user.youtubeChannelId!,
            channelName: user.youtubeChannelName || undefined,
          },
          { upsert: true, new: true }
        );
      } catch (dbError) {
        console.error("Error saving video to database:", dbError);
        // Continue even if database save fails
      }
      
      return NextResponse.json({
        success: true,
        message: isScheduled ? "Video scheduled successfully" : "Video uploaded successfully",
        data: {
          videoId,
          title: uploadResponse.data.snippet?.title,
          url: videoUrl,
          scheduled: isScheduled,
          publishAt: videoMetadata.status.publishAt || null,
        },
      });
    }

    return NextResponse.json({
      success: false,
      message: "Video upload completed but no video ID returned",
    }, { status: 500 });

  } catch (error: any) {
    console.error("YouTube upload error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to upload video" },
      { status: 500 }
    );
  }
}

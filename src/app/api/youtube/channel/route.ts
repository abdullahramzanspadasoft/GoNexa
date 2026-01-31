import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

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

    if (!user.youtubeAccessToken) {
      return NextResponse.json(
        { success: false, message: "YouTube not connected" },
        { status: 400 }
      );
    }

    const { google } = await import("googleapis");

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    );

    oauth2Client.setCredentials({
      access_token: user.youtubeAccessToken,
      refresh_token: user.youtubeRefreshToken,
    });

    oauth2Client.on("tokens", async (tokens) => {
      if (tokens.access_token && session.user?.email) {
        await User.findOneAndUpdate(
          { email: session.user.email.toLowerCase() },
          {
            $set: {
              youtubeAccessToken: tokens.access_token,
              ...(tokens.refresh_token && { youtubeRefreshToken: tokens.refresh_token }),
            },
          }
        );
      }
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    const channelResponse = await youtube.channels.list({
      part: ["snippet", "statistics"],
      mine: true,
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return NextResponse.json(
        { success: false, message: "No YouTube channel found" },
        { status: 404 }
      );
    }

    const channel = channelResponse.data.items[0];
    const channelId = channel.id || null;
    const channelName = channel.snippet?.title || null;
    const channelLogo = channel.snippet?.thumbnails?.default?.url || null;
    const subscribers = parseInt(channel.statistics?.subscriberCount || "0", 10);

    await User.findOneAndUpdate(
      { email: session.user.email.toLowerCase() },
      {
        $set: {
          youtubeChannelId: channelId,
          youtubeChannelName: channelName,
          youtubeChannelLogo: channelLogo,
          youtubeChannelSubscribers: subscribers,
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        channelId,
        channelName,
        channelLogo,
        subscribers,
      },
    });
  } catch (error: any) {
    console.error("YouTube channel fetch error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch YouTube channel" },
      { status: 500 }
    );
  }
}

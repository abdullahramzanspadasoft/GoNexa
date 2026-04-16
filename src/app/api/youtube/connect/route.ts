import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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

    // Check if user already has YouTube channel connected
    if (user.youtubeChannelId) {
      return NextResponse.json({
        success: true,
        message: "YouTube channel already connected",
        data: {
          channelId: user.youtubeChannelId,
          channelName: user.youtubeChannelName,
          channelLogo: user.youtubeChannelLogo,
          subscribers: user.youtubeChannelSubscribers,
        },
      });
    }

    // Return OAuth URL for YouTube connection with upload scope
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/youtube/callback`;
    const scope = "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload";
    const responseType = "code";
    const accessType = "offline";
    const prompt = "consent";

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&access_type=${accessType}&prompt=${prompt}`;

    return NextResponse.json({
      success: true,
      authUrl,
    });
  } catch (error: any) {
    console.error("YouTube connect error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to initiate YouTube connection" },
      { status: 500 }
    );
  }
}

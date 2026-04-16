import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Video from "@/models/Video";

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

    if (!user.youtubeChannelId) {
      return NextResponse.json({ success: false, message: "YouTube channel not connected" }, { status: 400 });
    }

    // Fetch videos from database (no infinite API calls)
    const dbVideos = await Video.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Convert database videos to API format
    const videos = dbVideos.map((video) => ({
      videoId: video.youtubeVideoId,
      title: video.title,
      description: video.description || "",
      thumbnail: video.thumbnailUrl || "",
      publishedAt: video.createdAt?.toISOString() || "",
      viewCount: video.viewCount || 0,
      likeCount: video.likeCount || 0,
      duration: video.duration || "",
      channelTitle: video.channelName || user.youtubeChannelName || "",
      status: video.status,
      url: video.videoUrl,
    }));

    return NextResponse.json({
      success: true,
      data: {
        videos: videos,
        total: videos.length,
        channelId: user.youtubeChannelId,
        channelName: user.youtubeChannelName,
      },
    });
  } catch (error: any) {
    console.error("YouTube videos fetch error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch YouTube videos" },
      { status: 500 }
    );
  }
}

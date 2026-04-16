import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    await User.findOneAndUpdate(
      { email: session.user.email.toLowerCase() },
      {
        $set: {
          youtubeChannelId: null,
          youtubeChannelName: null,
          youtubeChannelLogo: null,
          youtubeChannelSubscribers: null,
          youtubeAccessToken: null,
          youtubeRefreshToken: null,
          youtubeTokenExpiry: null,
        },
      }
    );

    return NextResponse.json({ success: true, message: "YouTube channel disconnected successfully" });
  } catch (error: any) {
    console.error("YouTube disconnect error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to disconnect YouTube channel" },
      { status: 500 }
    );
  }
}

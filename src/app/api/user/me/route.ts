import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase() }).select("-password");

  if (!user) {
    return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileImage: user.profileImage,
      youtubeChannelId: user.youtubeChannelId || null,
      youtubeChannelName: user.youtubeChannelName || null,
      youtubeChannelLogo: user.youtubeChannelLogo || null,
      youtubeChannelSubscribers: user.youtubeChannelSubscribers || 0,
      linkedinId: user.linkedinId || null,
      linkedinName: user.linkedinName || null,
      linkedinLogo: user.linkedinLogo || null,
      linkedinConnected: user.linkedinConnected !== undefined ? user.linkedinConnected : Boolean(user.linkedinAccessToken || user.linkedinId),
      instagramId: user.instagramId || null,
      instagramName: user.instagramName || null,
      instagramLogo: user.instagramLogo || null,
      instagramConnected: Boolean(user.instagramAccessToken || user.instagramId),
      facebookId: user.facebookId || null,
      facebookName: user.facebookName || null,
      facebookLogo: user.facebookLogo || null,
      facebookConnected: Boolean(user.facebookAccessToken || user.facebookId),
      tiktokId: user.tiktokId || null,
      tiktokName: user.tiktokName || null,
      tiktokLogo: user.tiktokLogo || null,
      tiktokConnected: Boolean(user.tiktokAccessToken || user.tiktokId),
      createdAt: user.createdAt,
    },
  });
}


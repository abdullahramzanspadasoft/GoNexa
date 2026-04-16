import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// Dummy auth user ID
const DUMMY_USER_ID = "dummy_user_12345";
const DUMMY_EMAIL = "test@gmail.com";

export async function GET(request: Request) {
  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json(
        { success: false, message: "JWT_SECRET not configured" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication token required" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };

    // Handle dummy auth user
    if (decoded.userId === DUMMY_USER_ID) {
      return NextResponse.json({
        success: true,
        data: {
          id: DUMMY_USER_ID,
          firstName: "Test",
          lastName: "User",
          email: DUMMY_EMAIL,
          profileImage: null,
          youtubeChannelId: null,
          youtubeChannelName: null,
          youtubeChannelLogo: null,
          youtubeChannelSubscribers: 0,
          linkedinId: null,
          linkedinName: null,
          linkedinLogo: null,
          linkedinConnected: false,
          instagramId: null,
          instagramName: null,
          instagramLogo: null,
          instagramConnected: false,
          tiktokId: null,
          tiktokName: null,
          tiktokLogo: null,
          tiktokConnected: false,
          createdAt: new Date().toISOString(),
        },
      });
    }

    if (!process.env.MONGO_URI) {
      return NextResponse.json(
        { success: false, message: "MONGO_URI not configured" },
        { status: 500 }
      );
    }

    await connectDB();

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
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
        linkedinConnected: Boolean(user.linkedinAccessToken || user.linkedinId),
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ success: false, message }, { status: 401 });
  }
}

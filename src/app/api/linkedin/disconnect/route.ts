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
          linkedinId: null,
          linkedinName: null,
          linkedinLogo: null,
          linkedinAccessToken: null,
          linkedinRefreshToken: null,
          linkedinTokenExpiry: null,
          linkedinConnected: false, // Explicitly set to false on disconnect
        },
      }
    );

    return NextResponse.json({ success: true, message: "LinkedIn account disconnected successfully" });
  } catch (error: any) {
    console.error("LinkedIn disconnect error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to disconnect LinkedIn account" },
      { status: 500 }
    );
  }
}

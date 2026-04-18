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
          facebookId: null,
          facebookName: null,
          facebookLogo: null,
          facebookAccessToken: null,
          facebookRefreshToken: null,
          facebookTokenExpiry: null,
        },
      }
    );

    return NextResponse.json({ success: true, message: "Facebook disconnected" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to disconnect";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

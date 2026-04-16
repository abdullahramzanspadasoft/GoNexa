import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import User from "@/models/User";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Build query
    const query: any = { userId: user._id };
    if (status && status !== "all") {
      // Map tab names to status values
      const statusMap: { [key: string]: string } = {
        draft: "draft",
        scheduled: "scheduled",
        published: "published",
        processing: "processing",
      };
      const mappedStatus = statusMap[status.toLowerCase()] || status.toLowerCase();
      query.status = mappedStatus;
    }

    // Fetch posts
    const posts = await Post.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .limit(100);

    return NextResponse.json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all posts for this user
    let posts: any[] = [];
    try {
      posts = await Post.find({ userId: user._id });
    } catch (error) {
      // If Post model doesn't exist or collection is empty, return zeros
      console.log("No posts found or Post model not initialized");
    }

    // Calculate statistics
    const totalPosts = posts.length;
    const totalImpressions = posts.reduce((sum, post) => sum + (post.impressions || 0), 0);
    const totalReactions = posts.reduce((sum, post) => sum + (post.reactions || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        postCount: totalPosts,
        impressions: totalImpressions,
        reactions: totalReactions,
      },
    });
  } catch (error) {
    console.error("Error fetching post statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}

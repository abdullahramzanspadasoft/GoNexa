import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import User from "@/models/User";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const postId = typeof resolvedParams === 'object' && 'id' in resolvedParams ? resolvedParams.id : resolvedParams;
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

    const { status } = await request.json();

    const post = await Post.findOneAndUpdate(
      {
        _id: postId,
        userId: user._id,
      },
      {
        $set: {
          status: status,
          ...(status === "published" && { publishedAt: new Date() }),
        },
      },
      { new: true }
    );

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Error updating post status:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

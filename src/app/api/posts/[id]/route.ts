import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import Post from "@/models/Post";
import User from "@/models/User";

export async function GET(
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

    const post = await Post.findOne({
      _id: postId,
      userId: user._id,
    });

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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

    const post = await Post.findOneAndDelete({
      _id: postId,
      userId: user._id,
    });

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

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

    // Handle both JSON and FormData
    let platform: string;
    let content: string = "";
    let link: string = "";
    let comment: string = "";
    let status: string = "draft";
    let mediaUrls: string[] = [];

    const contentType = request.headers.get("content-type");
    
    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData();
      platform = formData.get("platform") as string;
      content = (formData.get("content") as string) || "";
      link = (formData.get("link") as string) || "";
      comment = (formData.get("comment") as string) || "";
      status = (formData.get("status") as string) || (formData.get("postStatus") as string) || "draft";
      
      // Handle file uploads
      const files = formData.getAll("files") as File[];
      if (files.length > 0) {
        for (const file of files) {
          const fileInfo = {
            name: file.name,
            type: file.type,
            size: file.size,
            url: `temp://${file.name}`,
          };
          mediaUrls.push(JSON.stringify(fileInfo));
        }
      }
    } else {
      const body = await request.json();
      platform = body.platform;
      content = body.content || "";
      link = body.link || "";
      comment = body.comment || "";
      status = body.status || body.postStatus || "draft";
      mediaUrls = body.mediaUrls || [];
    }

    const updateData: any = {
      content: content || "",
      status: status === "published" ? "published" : 
              status === "scheduled" ? "scheduled" : 
              status === "private" ? "private" :
              status === "processing" ? "processing" : "draft",
      ...(status === "published" && { publishedAt: new Date() }),
      ...(status === "scheduled" && { scheduledAt: new Date() }),
    };

    if (mediaUrls.length > 0) {
      updateData.mediaUrls = mediaUrls;
    }

    if (platform) {
      updateData.platform = platform;
    }

    const post = await Post.findOneAndUpdate(
      {
        _id: postId,
        userId: user._id,
      },
      { $set: updateData },
      { new: true }
    );

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: post,
      message: "Post updated successfully",
    });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

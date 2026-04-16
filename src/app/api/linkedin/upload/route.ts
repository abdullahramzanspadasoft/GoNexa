import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";

export async function POST(request: Request) {
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

    if (!user.linkedinAccessToken) {
      return NextResponse.json({ error: "LinkedIn not connected" }, { status: 400 });
    }

    const formData = await request.formData();
    const postId = formData.get("postId") as string;
    const videoFile = formData.get("video") as File;
    const content = formData.get("content") as string || "";
    const visibility = formData.get("visibility") as string || "PUBLIC";

    if (!postId || !videoFile) {
      return NextResponse.json({ error: "Post ID and video file are required" }, { status: 400 });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Refresh LinkedIn token if needed
    let accessToken = user.linkedinAccessToken;
    const now = new Date();
    const tokenExpiry = user.linkedinTokenExpiry ? new Date(user.linkedinTokenExpiry) : null;
    const isTokenExpired = tokenExpiry && tokenExpiry <= now;

    if (isTokenExpired && user.linkedinRefreshToken) {
      console.log("LinkedIn token expired, refreshing...");
      try {
        const refreshResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: user.linkedinRefreshToken,
            client_id: process.env.LINKEDIN_CLIENT_ID || "",
            client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
          }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          accessToken = refreshData.access_token;
          const newRefreshToken = refreshData.refresh_token || user.linkedinRefreshToken;
          const expiresIn = refreshData.expires_in || 5184000;
          const newTokenExpiry = new Date(now.getTime() + expiresIn * 1000);

          await User.findOneAndUpdate(
            { email: session.user.email.toLowerCase() },
            {
              $set: {
                linkedinAccessToken: accessToken,
                linkedinRefreshToken: newRefreshToken,
                linkedinTokenExpiry: newTokenExpiry,
                linkedinConnected: true,
              },
            }
          );
          console.log("LinkedIn token refreshed successfully");
        }
      } catch (refreshError) {
        console.error("LinkedIn token refresh error:", refreshError);
        return NextResponse.json(
          { error: "Failed to refresh LinkedIn token. Please reconnect." },
          { status: 401 }
        );
      }
    }

    // Step 1: Register upload
    console.log("Step 1: Registering LinkedIn video upload...");
    const registerResponse = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-video"],
          owner: `urn:li:person:${user.linkedinId}`,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      }),
    });

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      console.error("LinkedIn register upload error:", registerResponse.status, errorText);
      post.status = "failed";
      await post.save();
      return NextResponse.json(
        { error: "Failed to register upload", details: errorText },
        { status: registerResponse.status }
      );
    }

    const registerData = await registerResponse.json();
    const uploadUrl = registerData.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
    const asset = registerData.value?.asset;

    if (!uploadUrl || !asset) {
      console.error("LinkedIn register upload missing uploadUrl or asset");
      post.status = "failed";
      await post.save();
      return NextResponse.json(
        { error: "Failed to get upload URL from LinkedIn" },
        { status: 500 }
      );
    }

    console.log("Step 2: Uploading video to LinkedIn...");
    // Step 2: Upload video file
    const videoBuffer = await videoFile.arrayBuffer();
    const uploadVideoResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": videoFile.type || "video/mp4",
      },
      body: videoBuffer,
    });

    if (!uploadVideoResponse.ok) {
      const errorText = await uploadVideoResponse.text();
      console.error("LinkedIn video upload error:", uploadVideoResponse.status, errorText);
      post.status = "failed";
      await post.save();
      return NextResponse.json(
        { error: "Failed to upload video", details: errorText },
        { status: uploadVideoResponse.status }
      );
    }

    console.log("Step 3: Creating LinkedIn post with video...");
    // Step 3: Create post with video
    const postResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: `urn:li:person:${user.linkedinId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: content,
            },
            shareMediaCategory: "VIDEO",
            media: [
              {
                status: "READY",
                description: {
                  text: content,
                },
                media: asset,
                title: {
                  text: content.substring(0, 200) || "Video Post",
                },
              },
            ],
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": visibility,
        },
      }),
    });

    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      console.error("LinkedIn post creation error:", postResponse.status, errorText);
      post.status = "failed";
      await post.save();
      return NextResponse.json(
        { error: "Failed to create LinkedIn post", details: errorText },
        { status: postResponse.status }
      );
    }

    const postData = await postResponse.json();
    const linkedinPostId = postData.id;
    const linkedinPostUrl = `https://www.linkedin.com/feed/update/${linkedinPostId}`;

    // Update post with LinkedIn post ID and URL
    post.mediaUrls = [linkedinPostUrl];
    post.status = "published";
    post.publishedAt = new Date();
    await post.save();

    console.log("LinkedIn video post created successfully:", linkedinPostId);

    return NextResponse.json({
      success: true,
      data: {
        postId: post._id,
        linkedinPostId,
        linkedinPostUrl,
        status: "published",
      },
      message: "Video uploaded and post published to LinkedIn successfully",
    });
  } catch (error: any) {
    console.error("LinkedIn upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload to LinkedIn", message: error.message },
      { status: 500 }
    );
  }
}

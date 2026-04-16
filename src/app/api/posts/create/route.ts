import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";
import { Readable } from "stream";
import { google } from "googleapis";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    try {
      await connectDB();
    } catch (dbError: any) {
      console.error("Database connection error:", dbError);
      return NextResponse.json(
        { error: "Database connection failed", message: dbError.message },
        { status: 500 }
      );
    }

    const user = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle both JSON and FormData
    let platform: string;
    let content: string = "";
    let link: string = "";
    let comment: string = "";
    // status actually stored in DB (after mapping / processing)
    let status: string = "draft";
    // requestedStatus is what UI really asked for (draft / published / scheduled / private / processing)
    let requestedStatus: string = "draft";
    let mediaUrls: string[] = [];
    let files: File[] = []; // Initialize files array

    const contentType = request.headers.get("content-type");
    
    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData();
      platform = formData.get("platform") as string;
      content = (formData.get("content") as string) || "";
      link = (formData.get("link") as string) || "";
      comment = (formData.get("comment") as string) || "";

      // UI sends \"postStatus\" = real choice, and may send \"status\" = processing.
      requestedStatus =
        (formData.get("postStatus") as string) ||
        (formData.get("status") as string) ||
        "draft";
      
      // Handle file uploads - save files and get URLs
      const filesArray = formData.getAll("files") as File[];
      files = filesArray; // Store files for later use
      
      if (files.length > 0) {
        // Convert files to base64 or save to temporary storage
        // For now, we'll create data URLs for preview and store file info
        // In production, upload to cloud storage (S3, Cloudinary, etc.)
        for (const file of files) {
          // Validate file
          if (!file || !file.name || file.size === 0) {
            console.warn("Invalid file detected:", { name: file?.name, size: file?.size });
            continue;
          }
          
          // Store file metadata - in production, upload to cloud storage and get URL
          const fileInfo = {
            name: file.name,
            type: file.type,
            size: file.size,
            // In production: upload to cloud storage and store the URL here
            url: `temp://${file.name}`, // Temporary placeholder
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
      requestedStatus = body.postStatus || body.status || "draft";
      files = []; // No files for JSON requests
    }

    if (!platform) {
      return NextResponse.json({ error: "Platform is required" }, { status: 400 });
    }

    // Normalize requestedStatus to allowed values
    const normalizedRequestedStatus =
      requestedStatus === "published"
        ? "published"
        : requestedStatus === "scheduled"
        ? "scheduled"
        : requestedStatus === "private"
        ? "private"
        : requestedStatus === "processing"
        ? "processing"
        : "draft";

    // Validate platform is YouTube or LinkedIn
    if (!["youtube", "linkedin"].includes(platform)) {
      return NextResponse.json({ error: "Only YouTube and LinkedIn are supported" }, { status: 400 });
    }

    // Check if user has connected the platform
    if (platform === "youtube" && !user.youtubeChannelId) {
      return NextResponse.json({ error: "YouTube channel not connected" }, { status: 400 });
    }

    if (platform === "linkedin" && !user.linkedinId) {
      return NextResponse.json({ error: "LinkedIn account not connected" }, { status: 400 });
    }

    // Check if this is a YouTube video upload
    const isYouTubeVideo =
      platform === "youtube" &&
      files.length > 0 &&
      files.some((f) => f.type?.startsWith("video/"));

    // Check if this is a LinkedIn video upload
    const isLinkedInVideo =
      platform === "linkedin" &&
      files.length > 0 &&
      files.some((f) => f.type?.startsWith("video/"));

    // Check if this is a LinkedIn post (text/image/video) that needs to be published
    const isLinkedInPost = platform === "linkedin" && normalizedRequestedStatus === "published";

    // If YouTube or LinkedIn video and user selected \"published\", start as processing.
    // If LinkedIn regular post (text/image) and user selected \"published\", also start as processing.
    const initialStatus =
      (isYouTubeVideo || isLinkedInVideo || isLinkedInPost) && normalizedRequestedStatus === "published"
        ? "processing"
        : normalizedRequestedStatus;

    status = initialStatus;

    // Create post
    const postData: any = {
      userId: user._id,
      platform,
      content: content || "",
      mediaUrls: mediaUrls || [],
      status,
      impressions: 0,
      reactions: 0,
    };

    if (status === "published") {
      postData.publishedAt = new Date();
    }

    if (status === "scheduled") {
      postData.scheduledAt = new Date();
    }

    const post = new Post(postData);
    
    try {
      await post.save();
    } catch (saveError: any) {
      console.error("Error saving post to database:", saveError);
      return NextResponse.json(
        { 
          error: "Failed to save post",
          message: saveError.message || "Database save failed",
          details: process.env.NODE_ENV === "development" ? saveError.errors : undefined
        },
        { status: 500 }
      );
    }

    // If YouTube video upload, trigger the upload directly
    if (isYouTubeVideo && files.length > 0) {
      try {
        const videoFile = files.find(f => f.type?.startsWith("video/"));
        if (videoFile && user.youtubeAccessToken) {
          // Refresh token if needed
          let accessToken = user.youtubeAccessToken;
          if (user.youtubeTokenExpiry && new Date(user.youtubeTokenExpiry) <= new Date(Date.now() + 5 * 60 * 1000)) {
            if (user.youtubeRefreshToken) {
              const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                  client_id: process.env.GOOGLE_CLIENT_ID ?? "",
                  client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
                  refresh_token: user.youtubeRefreshToken,
                  grant_type: "refresh_token",
                }),
              });
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                accessToken = refreshData.access_token;
                const expiresIn = refreshData.expires_in || 3600;
                await User.findOneAndUpdate(
                  { email: user.email.toLowerCase() },
                  {
                    $set: {
                      youtubeAccessToken: accessToken,
                      youtubeTokenExpiry: new Date(Date.now() + expiresIn * 1000),
                    },
                  }
                );
              }
            }
          }

          // Convert File to Buffer, then to Readable Stream
          const arrayBuffer = await videoFile.arrayBuffer();
          const videoBuffer = Buffer.from(arrayBuffer);
          const videoStream = Readable.from(videoBuffer);

          // Prepare video metadata
          const videoMetadata = {
            snippet: {
              title: content || "Untitled Video",
              description: comment || "",
              tags: [],
              categoryId: "22",
            },
            status: {
              privacyStatus:
                normalizedRequestedStatus === "published"
                  ? "public"
                  : normalizedRequestedStatus === "private"
                  ? "private"
                  : "unlisted",
              selfDeclaredMadeForKids: false,
            } as any,
          };

          // Use googleapis for video upload
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.NEXTAUTH_URL}/api/youtube/callback`
          );

          oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: user.youtubeRefreshToken || undefined,
          });

          const youtube = google.youtube({ version: "v3", auth: oauth2Client });

          // Upload video
          const uploadResponse = await youtube.videos.insert({
            part: ["snippet", "status"],
            requestBody: videoMetadata,
            media: {
              body: videoStream,
              mimeType: videoFile.type || "video/*",
            },
          });

          if (uploadResponse.data.id) {
            const videoId = uploadResponse.data.id;
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            
            // Update post with video ID and URL
            post.mediaUrls = [videoUrl];
            // For YouTube, if user requested published, set to published now (video is live)
            // Otherwise keep as processing for polling to check
            if (normalizedRequestedStatus === "published") {
              post.status = "published";
              post.publishedAt = new Date();
            } else {
              // Keep as processing so polling can check status
              post.status = "processing";
            }
            await post.save();
            
            return NextResponse.json({
              success: true,
              data: post,
              message: status === "published" ? "Post created and video uploaded successfully" : "Post created and video upload in progress",
            });
          } else {
            // Upload completed but no video ID
            post.status = "failed";
            await post.save();
          }
        } else {
          // No video file or no access token
          post.status = "failed";
          await post.save();
        }
      } catch (uploadError: any) {
        console.error("Error uploading video to YouTube:", uploadError);
        // Set status to failed
        post.status = "failed";
        await post.save();
      }
    }

    // If LinkedIn video upload, trigger the upload
    if (isLinkedInVideo && files.length > 0) {
      try {
        // Find video file - check both type and ensure file is valid
        const videoFile = files.find(f => {
          const isValid = f && f.name && f.size > 0;
          const isVideo = f.type?.startsWith("video/") || f.name?.match(/\.(mp4|mov|avi|wmv|flv|webm|mkv)$/i);
          return isValid && isVideo;
        });
        
        console.log("LinkedIn video upload check:", {
          totalFiles: files.length,
          fileTypes: files.map(f => ({ name: f.name, type: f.type, size: f.size })),
          hasVideoFile: !!videoFile,
          videoFileName: videoFile?.name,
          videoFileSize: videoFile?.size,
          videoFileType: videoFile?.type,
          hasAccessToken: !!user.linkedinAccessToken,
          linkedinId: user.linkedinId,
        });

        if (videoFile && user.linkedinAccessToken && user.linkedinId) {
          console.log("Starting LinkedIn video upload for post:", post._id);
          
          // Set status to processing
          post.status = "processing";
          await post.save();

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
                  { email: user.email.toLowerCase() },
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
              } else {
                const refreshErrorText = await refreshResponse.text();
                console.error("LinkedIn token refresh failed:", refreshResponse.status, refreshErrorText);
              }
            } catch (refreshError) {
              console.error("LinkedIn token refresh error:", refreshError);
            }
          }

          // Handle LinkedIn video upload inline (avoid server-to-server fetch issues)
          console.log("Starting LinkedIn video upload inline...");
          try {
            // Step 1: Register upload
            console.log("Step 1: Registering LinkedIn video upload...");
            console.log("Register upload request:", {
              owner: `urn:li:person:${user.linkedinId}`,
              recipes: ["urn:li:digitalmediaRecipe:feedshare-video"],
            });

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
              return NextResponse.json({
                success: false,
                data: post,
                error: "Failed to register LinkedIn video upload",
                details: errorText,
              }, { status: registerResponse.status });
            }

            const registerData = await registerResponse.json();
            console.log("Register upload response:", JSON.stringify(registerData, null, 2));
            
            const uploadUrl = registerData.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
            const asset = registerData.value?.asset;

            if (!uploadUrl || !asset) {
              console.error("LinkedIn register upload missing uploadUrl or asset");
              console.error("Full response:", JSON.stringify(registerData, null, 2));
              post.status = "failed";
              await post.save();
              return NextResponse.json({
                success: false,
                data: post,
                error: "Failed to get upload URL from LinkedIn",
                details: registerData,
              }, { status: 500 });
            }

            console.log("Step 2: Uploading video to LinkedIn...");
            console.log("Upload details:", {
              uploadUrl: uploadUrl.substring(0, 100) + "...",
              asset,
              videoSize: videoFile.size,
              videoType: videoFile.type,
            });

            // Step 2: Upload video file
            const videoBuffer = await videoFile.arrayBuffer();
            const uploadVideoResponse = await fetch(uploadUrl, {
              method: "PUT",
              headers: {
                "Content-Type": videoFile.type || "video/mp4",
                "Content-Length": videoFile.size.toString(),
              },
              body: videoBuffer,
            });

            if (!uploadVideoResponse.ok) {
              const errorText = await uploadVideoResponse.text();
              console.error("LinkedIn video upload error:", uploadVideoResponse.status, errorText);
              post.status = "failed";
              await post.save();
              return NextResponse.json({
                success: false,
                data: post,
                error: "Failed to upload video to LinkedIn",
                details: errorText,
              }, { status: uploadVideoResponse.status });
            }

            console.log("Step 2 completed: Video uploaded successfully");

            // Wait a bit for LinkedIn to process the upload
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log("Step 3: Creating LinkedIn post with video...");
            // Step 3: Create post with video
            const postBody = {
              author: `urn:li:person:${user.linkedinId}`,
              lifecycleState: "PUBLISHED",
              specificContent: {
                "com.linkedin.ugc.ShareContent": {
                  shareCommentary: {
                    text: content || "",
                  },
                  shareMediaCategory: "VIDEO",
                  media: [
                    {
                      status: "READY",
                      description: {
                        text: content || "Video post",
                      },
                      media: asset,
                      title: {
                        text: (content || "Video Post").substring(0, 200),
                      },
                    },
                  ],
                },
              },
              visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility": normalizedRequestedStatus === "published" ? "PUBLIC" : "CONNECTIONS",
              },
            };

            console.log("Post creation request:", JSON.stringify(postBody, null, 2));

            const linkedinPostResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
              },
              body: JSON.stringify(postBody),
            });

            if (!linkedinPostResponse.ok) {
              const errorText = await linkedinPostResponse.text();
              console.error("LinkedIn post creation error:", linkedinPostResponse.status, errorText);
              post.status = "failed";
              await post.save();
              return NextResponse.json({
                success: false,
                data: post,
                error: "Failed to create LinkedIn post",
                details: errorText,
              }, { status: linkedinPostResponse.status });
            }

            const linkedinPostData = await linkedinPostResponse.json();
            console.log("LinkedIn post created:", JSON.stringify(linkedinPostData, null, 2));
            
            const linkedinPostId = linkedinPostData.id;
            const linkedinPostUrl = `https://www.linkedin.com/feed/update/${linkedinPostId}`;

            // Update post with LinkedIn post URL
            post.mediaUrls = [linkedinPostUrl];
            post.status = "published";
            post.publishedAt = new Date();
            await post.save();

            console.log("LinkedIn video post created successfully:", linkedinPostId);

            return NextResponse.json({
              success: true,
              data: post,
              message: "Post created and video uploaded to LinkedIn successfully",
            });
          } catch (inlineUploadError: any) {
            console.error("Error in inline LinkedIn upload:", inlineUploadError);
            console.error("Error stack:", inlineUploadError.stack);
            post.status = "failed";
            await post.save();
            return NextResponse.json({
              success: false,
              data: post,
              error: "Failed to upload video to LinkedIn",
              message: inlineUploadError.message,
            }, { status: 500 });
          }
        } else {
          // No video file or no access token
          const missingItems = [];
          if (!videoFile) missingItems.push("video file");
          if (!user.linkedinAccessToken) missingItems.push("LinkedIn access token");
          if (!user.linkedinId) missingItems.push("LinkedIn ID");
          
          console.error("LinkedIn upload: Missing required items:", missingItems);
          post.status = "failed";
          await post.save();
          return NextResponse.json({
            success: false,
            data: post,
            error: `LinkedIn upload failed: Missing ${missingItems.join(", ")}`,
          }, { status: 400 });
        }
      } catch (uploadError: any) {
        console.error("Error uploading video to LinkedIn:", uploadError);
        console.error("Error stack:", uploadError.stack);
        // Set status to failed
        post.status = "failed";
        await post.save();
        return NextResponse.json({
          success: false,
          data: post,
          error: "Failed to upload video to LinkedIn",
          message: uploadError.message,
        }, { status: 500 });
      }
    }

    // If LinkedIn post (text/image, not video) and user wants to publish, upload to LinkedIn
    if (isLinkedInPost && !isLinkedInVideo && user.linkedinAccessToken) {
      try {
        console.log("Starting LinkedIn post upload (text/image) for post:", post._id);
        
        // Set status to processing
        post.status = "processing";
        await post.save();

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
                { email: user.email.toLowerCase() },
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
          }
        }

        // Prepare post content
        const postText = content || "";
        const visibility = normalizedRequestedStatus === "published" ? "PUBLIC" : "CONNECTIONS";

        // Create LinkedIn post (text only or with image)
        let postBody: any = {
          author: `urn:li:person:${user.linkedinId}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: {
                text: postText,
              },
              shareMediaCategory: files.length > 0 && files.some(f => f.type?.startsWith("image/")) ? "IMAGE" : "NONE",
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": visibility,
          },
        };

        // If there are images, we need to upload them first (simplified - just text for now)
        // For images, we would need to use LinkedIn Assets API similar to videos

        // Create post on LinkedIn
        const linkedinPostResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
          body: JSON.stringify(postBody),
        });

        if (linkedinPostResponse.ok) {
          const linkedinPostData = await linkedinPostResponse.json();
          const linkedinPostId = linkedinPostData.id;
          const linkedinPostUrl = `https://www.linkedin.com/feed/update/${linkedinPostId}`;

          // Update post with LinkedIn post URL
          post.mediaUrls = [linkedinPostUrl];
          post.status = "published";
          post.publishedAt = new Date();
          await post.save();

          console.log("LinkedIn post created successfully:", linkedinPostId);

          return NextResponse.json({
            success: true,
            data: post,
            message: "Post created and published to LinkedIn successfully",
          });
        } else {
          const errorText = await linkedinPostResponse.text();
          console.error("LinkedIn post creation error:", linkedinPostResponse.status, errorText);
          post.status = "failed";
          await post.save();

          return NextResponse.json({
            success: false,
            data: post,
            error: "Failed to publish post to LinkedIn",
            details: errorText,
          }, { status: linkedinPostResponse.status });
        }
      } catch (postError: any) {
        console.error("Error creating LinkedIn post:", postError);
        post.status = "failed";
        await post.save();
      }
    }

    return NextResponse.json({
      success: true,
      data: post,
      message: "Post created successfully",
    });
  } catch (error: any) {
    console.error("Error creating post:", error);
    console.error("Error details:", error.message, error.stack);
    return NextResponse.json(
      { 
        error: "Failed to create post",
        message: error.message || "An unexpected error occurred",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

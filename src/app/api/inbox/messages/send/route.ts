import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import InboxMessage from "@/models/InboxMessage";
import InboxConversation from "@/models/InboxConversation";

function normalizeConversationId(conversationId: string) {
  if (conversationId.includes("urn:li:fs_conversation:")) {
    return conversationId.replace("urn:li:fs_conversation:", "");
  }
  return conversationId;
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { platform, conversationId, recipientId, message } = body;

    if (!platform || !conversationId || !message) {
      return NextResponse.json({ message: "Platform, conversationId, and message are required" }, { status: 400 });
    }

    if (platform !== "linkedin") {
      return NextResponse.json({ message: "Only LinkedIn is supported for now" }, { status: 400 });
    }

    if (!user.linkedinAccessToken) {
      return NextResponse.json({ message: "LinkedIn not connected" }, { status: 400 });
    }

    // Refresh LinkedIn token if needed
    let accessToken = user.linkedinAccessToken;
    const now = new Date();
    const tokenExpiry = user.linkedinTokenExpiry ? new Date(user.linkedinTokenExpiry) : null;
    const isTokenExpired = tokenExpiry && tokenExpiry <= now;

    if (isTokenExpired && user.linkedinRefreshToken) {
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
        }
      } catch (refreshError) {
        console.error("LinkedIn token refresh error:", refreshError);
      }
    }

    // Send message via LinkedIn Messaging API
    // Note: LinkedIn Messaging API requires specific permissions and may have limitations
    try {
      const normalizedConversationId = normalizeConversationId(conversationId);
      const accountId = user.linkedinId || "linkedin-account";

      // LinkedIn Messaging API endpoint
      const sendMessageResponse = await fetch(
        `https://api.linkedin.com/v2/messaging/conversations/${normalizedConversationId}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
          body: JSON.stringify({
            eventCreate: {
              value: {
                "com.linkedin.ims.MessagingEvent": {
                  body: message,
                  attachments: [],
                  messageType: "MEMBER_TO_MEMBER",
                },
              },
            },
          }),
        }
      );

      if (sendMessageResponse.ok) {
        const sendData = await sendMessageResponse.json();
        const nowDate = new Date();
        const messageId =
          sendData?.entityUrn || sendData?.id || `local-${nowDate.getTime()}-${Math.random()}`;

        await InboxMessage.updateOne(
          {
            userEmail: user.email.toLowerCase(),
            platform,
            accountId,
            conversationId: normalizedConversationId,
            messageId,
          },
          {
            $set: {
              text: message,
              time: "Just now",
              timestamp: nowDate,
              isFromMe: true,
              source: "local_send",
            },
          },
          { upsert: true }
        );

        await InboxConversation.updateOne(
          {
            userEmail: user.email.toLowerCase(),
            platform,
            accountId,
            conversationId: normalizedConversationId,
          },
          {
            $set: {
              name: recipientId ? String(recipientId) : "LinkedIn Contact",
              handle: recipientId ? `@${String(recipientId)}` : "@linkedin",
              avatarGradient: "linear-gradient(135deg, #0077b5 0%, #0a66c2 100%)",
              lastMessage: message.length > 50 ? `${message.substring(0, 50)}...` : message,
              time: "Just now",
              unread: false,
              lastSyncedAt: nowDate,
            },
          },
          { upsert: true }
        );

        return NextResponse.json({
          success: true,
          data: sendData,
          message: "Message sent successfully",
        });
      } else {
        const errorText = await sendMessageResponse.text();
        console.error("LinkedIn send message error:", sendMessageResponse.status, errorText);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to send message",
            details: errorText,
          },
          { status: sendMessageResponse.status }
        );
      }
    } catch (error: any) {
      console.error("Error sending LinkedIn message:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send message",
          message: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in send message API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

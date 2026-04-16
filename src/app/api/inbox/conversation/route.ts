import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import InboxMessage from "@/models/InboxMessage";

function formatRelativeTime(dateValue?: string | number | Date | null): string {
  if (!dateValue) return "Just now";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Just now";
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

function normalizeConversationId(conversationId: string) {
  if (conversationId.includes("urn:li:fs_conversation:")) {
    return conversationId.replace("urn:li:fs_conversation:", "");
  }
  return conversationId;
}

async function getMessagesFromDb(
  userEmail: string,
  platform: string,
  accountId: string,
  conversationId: string
) {
  const docs = await InboxMessage.find({
    userEmail: userEmail.toLowerCase(),
    platform,
    accountId,
    conversationId,
  })
    .sort({ timestamp: 1, createdAt: 1 })
    .lean();

  return docs.map((doc: any) => ({
    id: doc.messageId,
    text: doc.text || "",
    time: doc.time || formatRelativeTime(doc.timestamp),
    timestamp: doc.timestamp,
    isFromMe: Boolean(doc.isFromMe),
  }));
}

async function saveMessagesToDb(
  userEmail: string,
  platform: string,
  accountId: string,
  conversationId: string,
  messages: Array<{ id: string; text: string; time: string; timestamp?: any; isFromMe: boolean }>
) {
  if (!messages.length) return;
  await Promise.all(
    messages.map((message) =>
      InboxMessage.updateOne(
        {
          userEmail: userEmail.toLowerCase(),
          platform,
          accountId,
          conversationId,
          messageId: message.id,
        },
        {
          $set: {
            text: message.text,
            time: message.time,
            timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
            isFromMe: message.isFromMe,
            source: "api",
          },
        },
        { upsert: true }
      )
    )
  );
}

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
    const conversationId = searchParams.get("conversationId");
    const platform = searchParams.get("platform");

    if (!conversationId || !platform) {
      return NextResponse.json({ message: "conversationId and platform are required" }, { status: 400 });
    }

    if (platform !== "linkedin") {
      return NextResponse.json({ message: "Only LinkedIn is supported for now" }, { status: 400 });
    }

    const accountId = user.linkedinId || "linkedin-account";
    const normalizedConversationId = normalizeConversationId(conversationId);

    if (!user.linkedinAccessToken) {
      const dbMessages = await getMessagesFromDb(
        user.email,
        platform,
        accountId,
        normalizedConversationId
      );
      return NextResponse.json({
        success: true,
        data: dbMessages,
        conversationId,
        platform,
        message:
          dbMessages.length > 0
            ? "LinkedIn token missing. Showing saved messages from database."
            : "LinkedIn not connected",
      });
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

    try {
      // Fetch conversation messages from LinkedIn
      console.log("Fetching LinkedIn conversation messages for:", normalizedConversationId);
      
      const messagesResponse = await fetch(
        `https://api.linkedin.com/v2/messaging/conversations/${normalizedConversationId}/events`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
          signal: AbortSignal.timeout(30000),
        }
      );

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        console.log("LinkedIn messages response:", JSON.stringify(messagesData, null, 2));

        // Transform LinkedIn messages to our format
        const transformedMessages = [];
        
        if (messagesData.elements && Array.isArray(messagesData.elements)) {
          for (const event of messagesData.elements) {
            try {
              const messageText = event.eventContent?.body?.text || "";
              const messageTime = event.createdAt;
              const senderEntity = event.from?.entity;
              const isFromMe = senderEntity?.includes(user.linkedinId);

              // Format time
              let timeDisplay = "Just now";
              if (messageTime) {
                const messageDate = new Date(messageTime);
                const now = new Date();
                const diffMs = now.getTime() - messageDate.getTime();
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);
                
                if (diffMins < 1) {
                  timeDisplay = "Just now";
                } else if (diffMins < 60) {
                  timeDisplay = `${diffMins}m`;
                } else if (diffHours < 24) {
                  timeDisplay = `${diffHours}h`;
                } else {
                  timeDisplay = `${diffDays}d`;
                }
              }

              transformedMessages.push({
                id: event.entityUrn || event.id || `msg-${Date.now()}-${Math.random()}`,
                text: messageText,
                time: timeDisplay,
                timestamp: messageTime,
                isFromMe,
              });
            } catch (msgError) {
              console.error("Error processing message:", msgError);
            }
          }
        }

        // Sort messages by timestamp (oldest first)
        transformedMessages.sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return timeA - timeB;
        });

        await saveMessagesToDb(
          user.email,
          platform,
          accountId,
          normalizedConversationId,
          transformedMessages
        );

        return NextResponse.json({
          success: true,
          data: transformedMessages,
          conversationId,
          platform,
        });
      } else {
        const errorText = await messagesResponse.text();
        console.error("LinkedIn messages API error:", messagesResponse.status, errorText);

        const dbMessages = await getMessagesFromDb(
          user.email,
          platform,
          accountId,
          normalizedConversationId
        );
        if (dbMessages.length > 0) {
          return NextResponse.json({
            success: true,
            data: dbMessages,
            conversationId,
            platform,
            message: "LinkedIn live messages unavailable. Showing saved messages from database.",
          });
        }

        return NextResponse.json({
          success: false,
          data: [],
          conversationId,
          platform,
          message: "Failed to fetch messages",
          error: errorText,
        }, { status: messagesResponse.status });
      }
    } catch (fetchError: any) {
      console.error("Error fetching LinkedIn conversation messages:", fetchError);
      const dbMessages = await getMessagesFromDb(
        user.email,
        platform,
        accountId,
        normalizedConversationId
      );
      if (dbMessages.length > 0) {
        return NextResponse.json({
          success: true,
          data: dbMessages,
          conversationId,
          platform,
          message: "LinkedIn API failed. Showing saved messages from database.",
        });
      }
      return NextResponse.json({
        success: false,
        data: [],
        conversationId,
        platform,
        message: "Error fetching messages",
        error: fetchError.message,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in conversation API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

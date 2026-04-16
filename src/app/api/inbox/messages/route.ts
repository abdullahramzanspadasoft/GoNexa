import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import InboxConversation from "@/models/InboxConversation";
import InboxMessage from "@/models/InboxMessage";

const LINKEDIN_API_VERSION = process.env.LINKEDIN_API_VERSION || "202604";

type ConversationPayload = {
  id: string;
  conversationId: string;
  name: string;
  handle: string;
  avatarGradient: string;
  lastMessage: string;
  time: string;
  unread: boolean;
};

const defaultGradient = "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)";

function normalizeConversationId(conversationId?: string | null): string {
  if (!conversationId) return "";
  if (conversationId.includes("urn:li:fs_conversation:")) {
    return conversationId.replace("urn:li:fs_conversation:", "");
  }
  return conversationId;
}

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

function toConversationPayload(doc: any): ConversationPayload {
  return {
    id: doc.conversationId,
    conversationId: doc.conversationId,
    name: doc.name || "Unknown",
    handle: doc.handle || "@unknown",
    avatarGradient: doc.avatarGradient || defaultGradient,
    lastMessage: doc.lastMessage || "No message",
    time: doc.time || formatRelativeTime(doc.updatedAt),
    unread: Boolean(doc.unread),
  };
}

async function getConversationsFromDb(userEmail: string, platform: string, accountId: string) {
  const docs = await InboxConversation.find({
    userEmail: userEmail.toLowerCase(),
    platform,
    accountId,
  })
    .sort({ updatedAt: -1 })
    .lean();

  const mappedConversations = docs.map(toConversationPayload);
  if (mappedConversations.length > 0) {
    return mappedConversations;
  }

  // Fallback: rebuild conversation list from stored messages.
  const latestMessages = await InboxMessage.aggregate([
    {
      $match: {
        userEmail: userEmail.toLowerCase(),
        platform,
        accountId,
      },
    },
    { $sort: { timestamp: -1, createdAt: -1 } },
    {
      $group: {
        _id: "$conversationId",
        latestText: { $first: "$text" },
        latestTime: { $first: "$time" },
        latestTimestamp: { $first: "$timestamp" },
      },
    },
    { $sort: { latestTimestamp: -1 } },
    { $limit: 50 },
  ]);

  return latestMessages.map((item: any) => ({
    id: item._id,
    conversationId: item._id,
    name: "LinkedIn Contact",
    handle: "@linkedin",
    avatarGradient: defaultGradient,
    lastMessage: item.latestText || "No message",
    time: item.latestTime || formatRelativeTime(item.latestTimestamp),
    unread: false,
  }));
}

async function saveConversationsToDb(
  userEmail: string,
  platform: string,
  accountId: string,
  conversations: ConversationPayload[]
) {
  if (!conversations.length) return;

  await Promise.all(
    conversations.map((conversation) =>
      InboxConversation.updateOne(
        {
          userEmail: userEmail.toLowerCase(),
          platform,
          accountId,
          conversationId: conversation.conversationId,
        },
        {
          $set: {
            name: conversation.name,
            handle: conversation.handle,
            avatarGradient: conversation.avatarGradient || defaultGradient,
            lastMessage: conversation.lastMessage,
            time: conversation.time,
            unread: conversation.unread,
            lastSyncedAt: new Date(),
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
    const platform = searchParams.get("platform");
    const accountId = searchParams.get("accountId");

    if (!platform || !accountId) {
      return NextResponse.json({ message: "Platform and accountId are required" }, { status: 400 });
    }

    // Validate platform
    if (!["linkedin", "youtube"].includes(platform)) {
      return NextResponse.json({ message: "Only LinkedIn and YouTube are supported" }, { status: 400 });
    }

    // Check if user has connected this account
    if (platform === "linkedin" && user.linkedinId !== accountId) {
      return NextResponse.json({ message: "LinkedIn account not connected" }, { status: 403 });
    }

    if (platform === "youtube" && user.youtubeChannelId !== accountId) {
      return NextResponse.json({ message: "YouTube account not connected" }, { status: 403 });
    }

    // Fetch actual messages from LinkedIn/YouTube API
    if (platform === "linkedin") {
      if (!user.linkedinAccessToken) {
        const dbConversations = await getConversationsFromDb(user.email, platform, accountId);
        return NextResponse.json({
          success: true,
          data: dbConversations,
          platform,
          accountId,
          message:
            dbConversations.length > 0
              ? "LinkedIn token missing. Showing saved inbox from database."
              : "LinkedIn not connected.",
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
        const linkedinHeaders = {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "Linkedin-Version": LINKEDIN_API_VERSION,
        };

        // Try versioned REST endpoints first, then legacy v2 endpoint.
        const endpointCandidates = [
          "https://api.linkedin.com/rest/messages/conversations",
          "https://api.linkedin.com/rest/messaging/conversations",
          "https://api.linkedin.com/v2/messaging/conversations",
        ];

        let timeoutDetected = false;
        let sawPermissionError = false;
        let sawResourceNotFound = false;
        let lastErrorText = "";
        let lastStatus: number | null = null;

        for (const endpoint of endpointCandidates) {
          try {
            console.log("Fetching LinkedIn conversations from endpoint:", endpoint);
            const conversationsResponse = await fetch(endpoint, {
              headers: linkedinHeaders,
              signal: AbortSignal.timeout(10000),
            });

            if (conversationsResponse.ok) {
              const conversationsData = await conversationsResponse.json();
              console.log("LinkedIn conversations response:", JSON.stringify(conversationsData, null, 2));

              const transformedMessages = [];
              const list = Array.isArray(conversationsData?.elements)
                ? conversationsData.elements
                : Array.isArray(conversationsData?.items)
                ? conversationsData.items
                : [];

              for (const conversation of list) {
                try {
                  const participants = conversation.participants?.elements || conversation.participants || [];
                  const otherParticipant = Array.isArray(participants)
                    ? participants.find((p: any) => p?.entity !== `urn:li:person:${user.linkedinId}`)
                    : null;
                  const lastMessageEvent = conversation.lastMessageEvent || conversation.lastMessage || null;
                  const messageText =
                    lastMessageEvent?.eventContent?.body?.text ||
                    lastMessageEvent?.text ||
                    "No message";
                  const messageTime = lastMessageEvent?.createdAt || conversation.lastActivityAt;

                  let timeDisplay = "Just now";
                  if (messageTime) {
                    const messageDate = new Date(messageTime);
                    const now = new Date();
                    const diffMs = now.getTime() - messageDate.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);

                    if (diffMins < 1) timeDisplay = "Just now";
                    else if (diffMins < 60) timeDisplay = `${diffMins}m`;
                    else if (diffHours < 24) timeDisplay = `${diffHours}h`;
                    else timeDisplay = `${diffDays}d`;
                  }

                  let participantName = "Unknown";
                  let participantHandle = "@unknown";

                  if (otherParticipant?.entity) {
                    const personIdMatch = String(otherParticipant.entity).match(/urn:li:person:(\w+)/);
                    if (personIdMatch) {
                      participantHandle = `@${personIdMatch[1]}`;
                      participantName = personIdMatch[1];
                    }
                  }

                  transformedMessages.push({
                    id: conversation.entityUrn || conversation.id || `conv-${Date.now()}-${Math.random()}`,
                    conversationId: conversation.entityUrn || conversation.id || "",
                    name: participantName,
                    handle: participantHandle,
                    avatarGradient: `linear-gradient(135deg, #${Math.floor(Math.random() * 16777215).toString(16)} 0%, #${Math.floor(Math.random() * 16777215).toString(16)} 100%)`,
                    lastMessage:
                      messageText.length > 50 ? `${messageText.substring(0, 50)}...` : messageText,
                    time: timeDisplay,
                    unread: conversation.read === false,
                  });
                } catch (convError) {
                  console.error("Error processing conversation:", convError);
                }
              }

              const normalizedConversations: ConversationPayload[] = transformedMessages
                .map((item: any) => {
                  const normalizedId = normalizeConversationId(item.conversationId);
                  return {
                    ...item,
                    id: normalizedId || item.id,
                    conversationId: normalizedId,
                  };
                })
                .filter((item: any) => item.conversationId)
                .map((item: any) => ({
                  id: item.id,
                  conversationId: item.conversationId,
                  name: item.name || "Unknown",
                  handle: item.handle || "@unknown",
                  avatarGradient: item.avatarGradient || defaultGradient,
                  lastMessage: item.lastMessage || "No message",
                  time: item.time || "Just now",
                  unread: Boolean(item.unread),
                }));

              await saveConversationsToDb(user.email, platform, accountId, normalizedConversations);

              return NextResponse.json({
                success: true,
                data: normalizedConversations,
                platform,
                accountId,
              });
            }

            lastStatus = conversationsResponse.status;
            lastErrorText = await conversationsResponse.text();
            const normalized = lastErrorText.toLowerCase();
            console.error("LinkedIn conversations API error:", endpoint, conversationsResponse.status, lastErrorText);

            if (
              conversationsResponse.status === 403 &&
              (normalized.includes("access_denied") || normalized.includes("not enough permissions"))
            ) {
              sawPermissionError = true;
            }

            if (
              conversationsResponse.status === 404 &&
              (normalized.includes("resource_not_found") || normalized.includes("no virtual resource found"))
            ) {
              sawResourceNotFound = true;
            }
          } catch (endpointError: any) {
            const isTimeout =
              endpointError?.name === "TimeoutError" ||
              endpointError?.cause?.code === "ETIMEDOUT" ||
              endpointError?.message?.toLowerCase?.().includes("timeout");
            if (isTimeout) {
              timeoutDetected = true;
            }
            console.error("LinkedIn conversations fetch failed for endpoint:", endpoint, endpointError);
          }
        }

        let message = "Failed to fetch LinkedIn inbox conversations.";
        if (sawPermissionError || sawResourceNotFound) {
          message =
            "LinkedIn inbox API is not available for this app. LinkedIn messaging requires approved partner access.";
        } else if (timeoutDetected) {
          message =
            "LinkedIn inbox service is not responding from server right now. Please try again later.";
        } else if (lastStatus) {
          message = `LinkedIn inbox request failed (${lastStatus}).`;
        }

        const dbConversations = await getConversationsFromDb(user.email, platform, accountId);
        if (dbConversations.length > 0) {
          return NextResponse.json({
            success: true,
            data: dbConversations,
            platform,
            accountId,
            message: `${message} Showing saved inbox from database.`,
            details: lastErrorText || null,
          });
        }

        return NextResponse.json({
          success: true,
          data: [],
          platform,
          accountId,
          message,
          details: lastErrorText || null,
        });
      } catch (fetchError: any) {
        console.error("Error fetching LinkedIn conversations:", fetchError);
        const dbConversations = await getConversationsFromDb(user.email, platform, accountId);
        if (dbConversations.length > 0) {
          return NextResponse.json({
            success: true,
            data: dbConversations,
            platform,
            accountId,
            message:
              "LinkedIn inbox live API unavailable. Showing saved inbox from database.",
          });
        }
        return NextResponse.json({
          success: true,
          data: [],
          platform,
          accountId,
          message:
            "LinkedIn inbox is currently unavailable for this app. Please verify LinkedIn messaging partner access.",
        });
      }
    }

    // For YouTube, return empty for now
    return NextResponse.json({
      success: true,
      data: await getConversationsFromDb(user.email, platform, accountId),
      platform,
      accountId,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

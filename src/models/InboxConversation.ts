import mongoose, { Schema, models } from "mongoose";

const inboxConversationSchema = new Schema(
  {
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    platform: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    accountId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    conversationId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      default: "Unknown",
    },
    handle: {
      type: String,
      default: "@unknown",
    },
    avatarGradient: {
      type: String,
      default: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
    },
    lastMessage: {
      type: String,
      default: "",
    },
    time: {
      type: String,
      default: "Just now",
    },
    unread: {
      type: Boolean,
      default: false,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

inboxConversationSchema.index(
  { userEmail: 1, platform: 1, accountId: 1, conversationId: 1 },
  { unique: true }
);

const InboxConversation =
  models.InboxConversation ||
  mongoose.model("InboxConversation", inboxConversationSchema, "inbox_conversations");

export default InboxConversation;

import mongoose, { Schema, models } from "mongoose";

const inboxMessageSchema = new Schema(
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
      index: true,
    },
    messageId: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      default: "",
    },
    time: {
      type: String,
      default: "Just now",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isFromMe: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      enum: ["api", "local_send"],
      default: "api",
    },
  },
  { timestamps: true }
);

inboxMessageSchema.index(
  { userEmail: 1, platform: 1, accountId: 1, conversationId: 1, messageId: 1 },
  { unique: true }
);

const InboxMessage =
  models.InboxMessage || mongoose.model("InboxMessage", inboxMessageSchema, "inbox_messages");

export default InboxMessage;

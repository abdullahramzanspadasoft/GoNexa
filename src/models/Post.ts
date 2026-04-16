import mongoose, { Schema, models } from "mongoose";

const postSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    platform: {
      type: String,
      enum: ["youtube", "linkedin", "facebook", "instagram", "tiktok", "twitter"],
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    mediaUrls: [{
      type: String,
    }],
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "processing", "failed", "private"],
      default: "draft",
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    impressions: {
      type: Number,
      default: 0,
    },
    reactions: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    externalPostId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Post = models.Post || mongoose.model("Post", postSchema, "posts");

export default Post;

import mongoose, { Schema, models } from "mongoose";

const videoSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    youtubeVideoId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    privacyStatus: {
      type: String,
      enum: ["private", "unlisted", "public"],
      default: "private",
    },
    publishAt: {
      type: Date,
      default: null,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    videoUrl: {
      type: String,
      default: null,
    },
    duration: {
      type: String,
      default: null,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["uploading", "processing", "published", "failed", "scheduled"],
      default: "uploading",
    },
  },
  { timestamps: true }
);

const Video = models.Video || mongoose.model("Video", videoSchema);

export default Video;

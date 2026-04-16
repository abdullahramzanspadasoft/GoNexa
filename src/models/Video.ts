import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVideo extends Document {
  youtubeVideoId: string;
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  privacyStatus: "private" | "unlisted" | "public";
  publishAt?: Date;
  status: "uploaded" | "scheduled" | "published";
  thumbnailUrl?: string;
  videoUrl: string;
  duration?: string;
  viewCount?: number;
  likeCount?: number;
  channelId: string;
  channelName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema: Schema = new Schema(
  {
    youtubeVideoId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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
    },
    status: {
      type: String,
      enum: ["uploaded", "scheduled", "published"],
      default: "uploaded",
    },
    thumbnailUrl: {
      type: String,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    channelId: {
      type: String,
      required: true,
      index: true,
    },
    channelName: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
VideoSchema.index({ userId: 1, youtubeVideoId: 1 });
VideoSchema.index({ channelId: 1, createdAt: -1 });

const Video: Model<IVideo> = mongoose.models.Video || mongoose.model<IVideo>("Video", VideoSchema);

export default Video;

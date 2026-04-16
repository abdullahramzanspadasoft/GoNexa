import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function requiredPassword(this: { googleId?: string | null }) {
        return !this.googleId;
      },
      minlength: 6,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
    },
    profileImage: {
      type: String,
      default: null,
    },
    youtubeChannelId: {
      type: String,
      default: null,
    },
    youtubeChannelName: {
      type: String,
      default: null,
    },
    youtubeChannelLogo: {
      type: String,
      default: null,
    },
    youtubeChannelSubscribers: {
      type: Number,
      default: 0,
    },
    youtubeAccessToken: {
      type: String,
      default: null,
    },
    youtubeRefreshToken: {
      type: String,
      default: null,
    },
    youtubeTokenExpiry: {
      type: Date,
      default: null,
    },
    // LinkedIn fields
    linkedinId: {
      type: String,
      default: null,
    },
    linkedinName: {
      type: String,
      default: null,
    },
    linkedinLogo: {
      type: String,
      default: null,
    },
    linkedinAccessToken: {
      type: String,
      default: null,
    },
    linkedinRefreshToken: {
      type: String,
      default: null,
    },
    linkedinTokenExpiry: {
      type: Date,
      default: null,
    },
    linkedinConnected: {
      type: Boolean,
      default: false,
    },
    // Instagram fields
    instagramId: {
      type: String,
      default: null,
    },
    instagramName: {
      type: String,
      default: null,
    },
    instagramLogo: {
      type: String,
      default: null,
    },
    instagramAccessToken: {
      type: String,
      default: null,
    },
    instagramRefreshToken: {
      type: String,
      default: null,
    },
    instagramTokenExpiry: {
      type: Date,
      default: null,
    },
    // Facebook fields
    facebookId: {
      type: String,
      default: null,
    },
    facebookName: {
      type: String,
      default: null,
    },
    facebookLogo: {
      type: String,
      default: null,
    },
    facebookAccessToken: {
      type: String,
      default: null,
    },
    facebookRefreshToken: {
      type: String,
      default: null,
    },
    facebookTokenExpiry: {
      type: Date,
      default: null,
    },
    // TikTok fields
    tiktokId: {
      type: String,
      default: null,
    },
    tiktokName: {
      type: String,
      default: null,
    },
    tiktokLogo: {
      type: String,
      default: null,
    },
    tiktokAccessToken: {
      type: String,
      default: null,
    },
    tiktokRefreshToken: {
      type: String,
      default: null,
    },
    tiktokTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const User = models.User || mongoose.model("User", userSchema, "nexaswork");

export default User;

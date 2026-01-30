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
      required: [true, "Last name is required"],
      trim: true,
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
      required: [true, "Password is required"],
      minlength: 6,
    },
    googleId: {
      type: String,
      default: null,
    },
    profileImage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const User = models.User || mongoose.model("User", userSchema, "nexaswork");

export default User;

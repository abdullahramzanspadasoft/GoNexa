import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, password } = await request.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email: String(email).toLowerCase() });
    if (existingUser) {
      // If account exists via OAuth (no password), allow setting password through signup form.
      if (!existingUser.password) {
        const hashedPassword = await bcrypt.hash(String(password), 10);
        existingUser.password = hashedPassword;

        if (!existingUser.firstName && firstName) {
          existingUser.firstName = String(firstName);
        }
        if (!existingUser.lastName && lastName) {
          existingUser.lastName = String(lastName);
        }

        await existingUser.save();

        const token = jwt.sign(
          { userId: existingUser._id },
          process.env.JWT_SECRET as string,
          { expiresIn: "7d" }
        );

        return NextResponse.json({
          success: true,
          message: "Password set successfully for existing account",
          data: {
            user: {
              id: existingUser._id,
              firstName: existingUser.firstName,
              lastName: existingUser.lastName,
              email: existingUser.email,
              profileImage: existingUser.profileImage,
              createdAt: existingUser.createdAt,
            },
            token,
          },
        });
      }

      return NextResponse.json(
        { success: false, message: "User already exists with this email" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      firstName,
      lastName,
      email: String(email).toLowerCase(),
      password: hashedPassword,
    });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profileImage: user.profileImage,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

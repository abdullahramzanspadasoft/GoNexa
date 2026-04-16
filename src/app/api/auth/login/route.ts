import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// Dummy auth credentials
const DUMMY_EMAIL = "test@gmail.com";
const DUMMY_PASSWORD = "testemail";
const DUMMY_USER_ID = "dummy_user_12345";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Dummy auth check
    if (email.toLowerCase() === DUMMY_EMAIL && password === DUMMY_PASSWORD) {
      const token = jwt.sign(
        { userId: DUMMY_USER_ID },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
      );

      return NextResponse.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: DUMMY_USER_ID,
            firstName: "Test",
            lastName: "User",
            email: DUMMY_EMAIL,
            profileImage: null,
            createdAt: new Date().toISOString(),
          },
          token,
        },
      });
    }

    await connectDB();

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(String(password), user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      message: "Login successful",
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
    const message = error instanceof Error ? error.message : "Signin failed";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

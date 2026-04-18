// Instagram OAuth temporarily disabled.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, message: "Instagram disconnect is temporarily disabled." },
    { status: 503 }
  );
}

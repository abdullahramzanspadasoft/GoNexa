// Facebook OAuth temporarily disabled.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { success: false, message: "Facebook connection is temporarily disabled." },
    { status: 503 }
  );
}

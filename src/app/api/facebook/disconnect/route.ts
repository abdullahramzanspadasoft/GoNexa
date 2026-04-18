// Facebook OAuth temporarily disabled.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, message: "Facebook disconnect is temporarily disabled." },
    { status: 503 }
  );
}

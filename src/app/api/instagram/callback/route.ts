// Instagram OAuth temporarily disabled — callback kept so old redirect URIs do not 404.
import { NextResponse } from "next/server";

import { trimOAuthEnv } from "@/lib/oauthEnv";

export async function GET() {
  const base = trimOAuthEnv(process.env.NEXTAUTH_URL) || "http://localhost:3000";
  return NextResponse.redirect(`${base}/dashboard?tab=Accounts`);
}

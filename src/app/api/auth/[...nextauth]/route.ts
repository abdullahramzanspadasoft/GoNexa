import NextAuth, { type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import { setDefaultResultOrder } from "node:dns";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// Some environments resolve Google hosts to unreachable IPv6 first, causing OAuth callback timeouts.
setDefaultResultOrder("ipv4first");

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  console.warn("Warning: NEXTAUTH_SECRET is not set. Google sign-in may not work properly.");
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("Warning: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set. Google sign-in will not work.");
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "online",
          response_type: "code",
          scope: "openid email profile",
        },
      },
    }),
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async signIn({ user, account, profile }: any) {
      if (account?.provider !== "google") return true;

      const email = user.email;
      if (!email) return false;

      try {
      await connectDB();
      } catch (dbError) {
        console.error("Database connection error during Google sign-in:", dbError);
        // Continue even if DB connection fails - user can still sign in
      }

      const name = user.name ?? "";
      const [firstName, ...rest] = name.trim().split(/\s+/);
      const lastName = rest.join(" ");

      const googleId =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof profile === "object" && profile && "sub" in profile ? String((profile as any).sub) : null;

      await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        {
          $set: {
            email: email.toLowerCase(),
            googleId,
            profileImage: user.image ?? null,
          },
          $setOnInsert: {
            firstName: firstName || "User",
            lastName: lastName || "",
          },
        },
        { upsert: true, new: true }
      );

      // Note: YouTube scope removed to avoid verification requirement
      // YouTube channel can be connected separately after sign-in

      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user, account }: any) {
      // Initial sign in
      if (account && user) {
        token.accessToken = account.access_token;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (session.user) {
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.picture;
      }
      return session;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async redirect({ url, baseUrl }: any) {
      // Don't redirect error URLs - let NextAuth handle them
      if (url.includes("/error")) {
        return url;
      }
      // After successful authentication via callback, redirect directly to dashboard
      if (url.includes("/api/auth/callback") || url.includes("/callback/aouth")) {
        return `${baseUrl}/dashboard?tab=Accounts`;
      }
      // If callbackUrl is set to /callback/aouth, redirect to dashboard
      if (url === `${baseUrl}/callback/aouth` || url === "/callback/aouth") {
        return `${baseUrl}/dashboard?tab=Accounts`;
      }
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

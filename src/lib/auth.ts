import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const email = user.email;
      if (!email) return false;

      await connectDB();

      const name = user.name ?? "";
      const [firstName, ...rest] = name.trim().split(/\s+/);
      const lastName = rest.join(" ");

      const googleId =
        typeof profile === "object" && profile && "sub" in profile
          ? String((profile as any).sub)
          : null;

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

      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/hello`;
    },
  },
};


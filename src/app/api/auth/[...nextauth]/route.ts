import NextAuth, { type NextAuthOptions } from "next-auth";
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
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account?.provider !== "google") return true;

      const email = user.email;
      if (!email) return false;

      await connectDB();

      const name = user.name ?? "";
      const [firstName, ...rest] = name.trim().split(/\s+/);
      const lastName = rest.join(" ");

      const googleId =
        typeof profile === "object" && profile && "sub" in profile ? String((profile as any).sub) : null;

      const youtubeAccessToken = account.access_token ?? null;
      const youtubeRefreshToken = account.refresh_token ?? null;

      const updatedUser = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        {
          $set: {
            email: email.toLowerCase(),
            googleId,
            profileImage: user.image ?? null,
            youtubeAccessToken,
            youtubeRefreshToken,
          },
          $setOnInsert: {
            firstName: firstName || "User",
            lastName: lastName || "",
          },
        },
        { upsert: true, new: true }
      );

      if (youtubeAccessToken && updatedUser) {
        try {
          const { google } = await import("googleapis");
          
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
          );

          oauth2Client.setCredentials({
            access_token: youtubeAccessToken,
            refresh_token: youtubeRefreshToken,
          });

          const youtube = google.youtube({ version: "v3", auth: oauth2Client });

          const channelResponse = await youtube.channels.list({
            part: ["snippet", "statistics"],
            mine: true,
          });

          if (channelResponse.data.items && channelResponse.data.items.length > 0) {
            const channel = channelResponse.data.items[0];
            await User.findOneAndUpdate(
              { email: email.toLowerCase() },
              {
                $set: {
                  youtubeChannelId: channel.id || null,
                  youtubeChannelName: channel.snippet?.title || null,
                  youtubeChannelLogo: channel.snippet?.thumbnails?.default?.url || null,
                  youtubeChannelSubscribers: parseInt(
                    channel.statistics?.subscriberCount || "0",
                    10
                  ),
                },
              }
            );
          }
        } catch (error) {
          console.error("Auto-fetch YouTube channel error:", error);
        }
      }

      return true;
    },
    async jwt({ token, account, user }: any) {
      if (account?.access_token) {
        token.youtubeAccessToken = account.access_token;
      }
      if (account?.refresh_token) {
        token.youtubeRefreshToken = account.refresh_token;
      }
      return token;
    },
    async redirect({ url, baseUrl }: any) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/hello`;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

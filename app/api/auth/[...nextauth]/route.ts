import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextRequest, NextResponse } from "next/server";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "your-username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const USERNAME = process.env.AUTH_USERNAME;
        const PASSWORD = process.env.AUTH_PASSWORD;
        if (!USERNAME || !PASSWORD) {
          throw new Error("AUTH_USERNAME and AUTH_PASSWORD must be set in environment variables.");
        }
        if (
          credentials?.username === USERNAME &&
          credentials?.password === PASSWORD
        ) {
          return { id: "1", name: USERNAME };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET || "changemeinproduction",
});

export { handler as GET, handler as POST };

import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import type { NextAuthOptions } from "next-auth";

/** How often a signed-in session is re-validated against the database. */
const SESSION_RECHECK_MS = 60 * 1000;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        await dbConnect();
        const user = await User.findOne({ email: credentials.email });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        if (user.isVerified === false) {
          throw new Error("Please verify your email before logging in.");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.authTime = Date.now();
        token.checkedAt = Date.now();
        // Intentionally omitting user.image from token.picture here
        // to avoid crashing HTTP headers with massive 2MB base64 cookies!
        return token;
      }

      // Re-check the account at most once a minute: a session must end when the password
      // is reset (e.g. a stolen cookie) or the account is deleted, and a role change
      // should take effect without logging out. Throwing here makes NextAuth clear the
      // session cookie, so the user is treated as signed out.
      if (!token.checkedAt || Date.now() - token.checkedAt > SESSION_RECHECK_MS) {
        await dbConnect();
        const account = await User.findById(token.id)
          .select("role passwordChangedAt")
          .lean<{ role: string; passwordChangedAt?: Date | null }>();
        if (!account) throw new Error("Session revoked: account no longer exists");
        if (account.passwordChangedAt && new Date(account.passwordChangedAt).getTime() > (token.authTime ?? 0)) {
          throw new Error("Session revoked: password was changed");
        }
        token.role = account.role;
        token.checkedAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        // Specifically omitting image from session because NextAuth crashes 
        // when trying to serialize 2MB+ Base64 strings over the network.
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

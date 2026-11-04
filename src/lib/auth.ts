import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import type { NextAuthOptions } from "next-auth";
import { normalizeEmail } from "@/lib/validation";
import { checkRateLimit, clientIp, isBlocked, recordFailure } from "@/lib/rateLimit";

/** How often a signed-in session is re-validated against the database. */
const SESSION_RECHECK_MS = 60 * 1000;

const INVALID_CREDENTIALS = "Invalid email or password";
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_IP_LIMIT = 30; // attempts per IP per 15 minutes
const LOGIN_ACCOUNT_FAILURES = 10; // wrong passwords per account per 15 minutes
/** bcrypt hash of a random value, used to keep timing equal for unknown emails. */
const DUMMY_BCRYPT_HASH = "$2b$12$JhtrnfbsjK3xlSsJkBeJA.oEew8BFFPV.BFqEt.Ld6VrFtkGs170q";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // Strict type checks also block NoSQL operator injection like { "email": { "$ne": null } }
        const email = normalizeEmail(credentials?.email);
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password || password.length > 128) {
          throw new Error(INVALID_CREDENTIALS);
        }

        // Brute-force protection: a per-IP cap on attempts, and a per-account cap on
        // failures (failures only, so the owner's own successful logins never count).
        const ipLimit = await checkRateLimit(`login-ip:${clientIp(req?.headers)}`, LOGIN_IP_LIMIT, LOGIN_WINDOW_MS);
        const accountLimit = await isBlocked(`login-fail:${email}`, LOGIN_ACCOUNT_FAILURES, LOGIN_WINDOW_MS);
        if (!ipLimit.ok || !accountLimit.ok) {
          throw new Error("Too many login attempts. Please wait 15 minutes, or reset your password.");
        }

        await dbConnect();
        const user = await User.findOne({ email });

        // Compare against a dummy hash when the account doesn't exist, so the response
        // time doesn't reveal which emails are registered.
        const isCorrectPassword = await bcrypt.compare(password, user?.password || DUMMY_BCRYPT_HASH);
        if (!user || !user.password || !isCorrectPassword) {
          await recordFailure(`login-fail:${email}`, LOGIN_WINDOW_MS);
          throw new Error(INVALID_CREDENTIALS);
        }

        // Checked only after the password, so this message can't be used to probe accounts.
        if (user.isVerified === false) {
          throw new Error("Please verify your email before logging in.");
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
    maxAge: 30 * 24 * 60 * 60, // 30 days, re-checked against the database every minute (see jwt callback)
  },
  secret: process.env.NEXTAUTH_SECRET,
};

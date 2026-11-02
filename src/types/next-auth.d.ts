import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    /** When the user signed in (ms). Sessions older than a password change are rejected. */
    authTime?: number;
    /** When the account was last re-checked against the database (ms). */
    checkedAt?: number;
  }
}

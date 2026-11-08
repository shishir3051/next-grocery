import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      /** Signed in to a live-demo account (lib/demo.ts). */
      isDemo?: boolean;
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
    /** Live-demo account (lib/demo.ts). */
    isDemo?: boolean;
    /** Signed in with a one-click demo login; revoked once DEMO_MODE is off (lib/auth.ts). */
    demoLogin?: boolean;
  }
}

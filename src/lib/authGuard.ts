import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import { isObjectId } from "@/lib/validation";
import { DEMO_READ_ONLY_HEADER, DEMO_READ_ONLY_MESSAGE, isDemoEmail, isDemoModeEnabled } from "@/lib/demo";
import { decideAccess, type Role } from "@/lib/access";

export type { Role };

export interface AuthorizedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** A live-demo account (see lib/demo.ts). */
  isDemo: boolean;
}

type Guarded = Promise<{ user: AuthorizedUser } | { response: NextResponse }>;

/**
 * Fields that must never leave the server, even to admins: password hash, one-time-code
 * hashes and the rate-limit counters behind them. Use with `.select(PRIVATE_USER_FIELDS)`.
 */
export const PRIVATE_USER_FIELDS =
  "-password -verificationOtp -otpExpiry -otpAttempts -resetOtp -resetOtpExpiry -resetOtpAttempts " +
  "-resetWindowStart -resetCodesSent -resetFailures -passwordChangedAt -googleId";

/**
 * The single authorization check for API routes.
 *
 * Returns the signed-in user when their role (read from the database, not from the
 * JWT, so a demotion or deletion takes effect immediately) is one of `roles`.
 * Otherwise returns a ready 401/403 response:
 *
 *   const auth = await requireRole("admin");
 *   if ("response" in auth) return auth.response;
 *   auth.user.id ...
 *
 * Handlers that change data use requireRoleForWrite instead. The rule itself is
 * decideAccess in lib/access.ts (unit-tested in tests/access.test.ts); which guard each
 * route uses is checked by tests/route-access.test.ts and listed in docs/SECURITY.md.
 */
export function requireRole(...roles: Role[]): Guarded {
  return authorize(roles, false);
}

/**
 * requireRole for handlers that change data: on a live-demo deployment the demo accounts
 * get a 403 "read-only demo" answer instead. Use it for every POST/PUT/PATCH/DELETE that
 * a demo account must not perform.
 */
export function requireRoleForWrite(...roles: Role[]): Guarded {
  return authorize(roles, true);
}

/** Any signed-in user whose account still exists. */
export const requireUser = () => requireRole();

/** Returns the signed-in admin's id, or null. Kept for routes that only need a yes/no. */
export async function requireAdmin(): Promise<string | null> {
  const auth = await requireRole("admin");
  return "user" in auth ? auth.user.id : null;
}

/** True when this user is a demo account on a live-demo deployment (DEMO_MODE=true). */
export const isDemoRestricted = (user: AuthorizedUser) => user.isDemo && isDemoModeEnabled();

/** The 403 answer for a change a demo account isn't allowed to make. */
export const demoReadOnly = () =>
  NextResponse.json(
    { error: DEMO_READ_ONLY_MESSAGE, code: "DEMO_READ_ONLY" },
    { status: 403, headers: { [DEMO_READ_ONLY_HEADER]: "1" } }
  );

/** Loads the signed-in account from the database, then applies decideAccess. */
async function authorize(roles: Role[], write: boolean): Guarded {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  let account: { _id: unknown; email: string; name: string; role: Role } | null = null;
  if (isObjectId(id)) {
    await dbConnect();
    account = await User.findById(id).select("email name role").lean<{ _id: unknown; email: string; name: string; role: Role }>();
  }

  const decision = decideAccess(account, roles, { write, demoMode: isDemoModeEnabled() });
  if (!decision.ok) {
    if (decision.reason === "demo-read-only") return { response: demoReadOnly() };
    return { response: NextResponse.json({ error: decision.status === 401 ? "Unauthorized" : "Forbidden" }, { status: decision.status }) };
  }
  // decideAccess only allows an existing account.
  const user = account!;
  return { user: { id: String(user._id), email: user.email, name: user.name, role: user.role, isDemo: isDemoEmail(user.email) } };
}

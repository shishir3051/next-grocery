import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import { isObjectId } from "@/lib/validation";

export type Role = "user" | "admin" | "delivery";

export interface AuthorizedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

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
 */
export async function requireRole(...roles: Role[]): Promise<{ user: AuthorizedUser } | { response: NextResponse }> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!isObjectId(id)) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  await dbConnect();
  const user = await User.findById(id).select("email name role").lean<{ _id: unknown; email: string; name: string; role: Role }>();
  if (!user) return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (roles.length > 0 && !roles.includes(user.role)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user: { id: String(user._id), email: user.email, name: user.name, role: user.role } };
}

/** Any signed-in user whose account still exists. */
export const requireUser = () => requireRole();

/** Returns the signed-in admin's id, or null. Kept for routes that only need a yes/no. */
export async function requireAdmin(): Promise<string | null> {
  const auth = await requireRole("admin");
  return "user" in auth ? auth.user.id : null;
}

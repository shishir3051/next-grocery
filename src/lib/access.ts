import { isDemoEmail } from "@/lib/demo";

export type Role = "user" | "admin" | "delivery";

/** The account as stored in the database (never the JWT), or null when it doesn't exist. */
export interface AccountForAccess {
  role: Role;
  email: string;
}

export type AccessDecision =
  | { ok: true }
  | { ok: false; status: 401 | 403; reason: "signed-out" | "wrong-role" | "demo-read-only" };

/**
 * The access rule behind every protected API route (see lib/authGuard.ts), kept free of
 * sessions and database calls so tests can check it directly.
 *
 * - No account (signed out, or the account was deleted): 401.
 * - A role list is given and the account's role isn't in it: 403. An empty list means
 *   "any signed-in account".
 * - A data-changing request (`write`) from a demo account while the live demo is on: 403
 *   "read-only demo".
 */
export function decideAccess(
  account: AccountForAccess | null | undefined,
  roles: readonly Role[],
  options: { write?: boolean; demoMode?: boolean } = {}
): AccessDecision {
  if (!account) return { ok: false, status: 401, reason: "signed-out" };
  if (roles.length > 0 && !roles.includes(account.role)) return { ok: false, status: 403, reason: "wrong-role" };
  if (options.write && options.demoMode && isDemoEmail(account.email)) {
    return { ok: false, status: 403, reason: "demo-read-only" };
  }
  return { ok: true };
}

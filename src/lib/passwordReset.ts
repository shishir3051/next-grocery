import { User } from "@/models/User";
import { RESET_WINDOW_MS } from "@/lib/otp";

/**
 * Starts a fresh rate-limit window for this account if the current one is over
 * (or was never started). Both reset routes call this before checking limits.
 */
export async function rollResetWindow(filter: Record<string, unknown>) {
  const now = Date.now();
  await User.updateOne(
    { ...filter, $or: [{ resetWindowStart: null }, { resetWindowStart: { $lt: new Date(now - RESET_WINDOW_MS) } }] },
    { $set: { resetWindowStart: new Date(now), resetCodesSent: 0, resetFailures: 0 } }
  );
}

/** Reads the JSON body, returning null for malformed or non-object bodies. */
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

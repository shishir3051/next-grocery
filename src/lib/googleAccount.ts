import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import { normalizeEmail } from "@/lib/validation";
import { isDemoEmail } from "@/lib/demo";

export interface GoogleIdentity {
  sub: string;
  email?: string | null;
  email_verified?: boolean;
  name?: string | null;
}

/** A password nobody knows, for accounts created through Google (the schema requires one). */
const unusablePassword = () => bcrypt.hash(randomBytes(32).toString("hex"), 12);

/**
 * Finds or creates the FreshBasket account for a Google sign-in. Returns null to refuse.
 *
 * - Only Google accounts with a verified email are accepted.
 * - A returning user is matched by their Google id first, then by email.
 * - An existing account with the same email is linked. If that account was never
 *   verified, whoever registered it may not own the inbox (pre-registration takeover),
 *   so its password and pending code are replaced before it is marked verified.
 */
export async function findOrCreateGoogleUser(identity: GoogleIdentity): Promise<{ id: string; role: string } | null> {
  const email = normalizeEmail(identity.email);
  if (!identity.sub || !email || identity.email_verified !== true) return null;
  // Live-demo addresses (lib/demo.ts) are never linked: whoever owns that domain must not
  // be able to sign in as a demo account.
  if (isDemoEmail(email)) return null;

  await dbConnect();

  const linked = await User.findOne({ googleId: identity.sub }).select("_id role").lean<{ _id: unknown; role: string }>();
  if (linked) return { id: String(linked._id), role: linked.role };

  const existing = await User.findOne({ email }).select("_id role isVerified googleId").lean<{
    _id: unknown; role: string; isVerified?: boolean; googleId?: string | null;
  }>();

  if (existing) {
    // The email already belongs to a different Google account: refuse rather than guess.
    if (existing.googleId && existing.googleId !== identity.sub) return null;

    const set: Record<string, unknown> = { googleId: identity.sub };
    if (!existing.isVerified) {
      Object.assign(set, {
        isVerified: true,
        password: await unusablePassword(),
        passwordChangedAt: new Date(),
        verificationOtp: null,
        otpExpiry: null,
        otpAttempts: 0,
      });
    }
    await User.updateOne({ _id: existing._id }, { $set: set });
    return { id: String(existing._id), role: existing.role };
  }

  try {
    const created = await User.create({
      name: (identity.name || email.split("@")[0]).trim().slice(0, 80),
      email,
      password: await unusablePassword(),
      googleId: identity.sub,
      isVerified: true,
      referralCode: `FRESH-${randomBytes(4).toString("hex").toUpperCase()}`,
    });
    return { id: String(created._id), role: created.role };
  } catch (error) {
    // Two first-time sign-ins racing: the other request created it; use that one.
    if ((error as { code?: number })?.code === 11000) {
      const raced = await User.findOne({ googleId: identity.sub }).select("_id role").lean<{ _id: unknown; role: string }>();
      if (raced) return { id: String(raced._id), role: raced.role };
    }
    throw error;
  }
}

export const isGoogleConfigured = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

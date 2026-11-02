import { createHmac, randomInt, timingSafeEqual } from "crypto";

/** Email verification code rules. */
export const OTP_TTL_MS = 10 * 60 * 1000; // code is valid for 10 minutes
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // at most one email per minute
export const OTP_MAX_ATTEMPTS = 5; // wrong guesses before the code is burned

/**
 * Password-reset limits per account, over a rolling window. Per-code limits alone are not
 * enough: an attacker could burn a code, request a new one and keep guessing forever.
 * With these caps an attacker gets at most 10 guesses an hour (~1 in 100,000 per hour).
 */
export const RESET_WINDOW_MS = 60 * 60 * 1000;
export const RESET_MAX_CODES_PER_WINDOW = 5;
export const RESET_MAX_FAILURES_PER_WINDOW = 10;

/** Cryptographically random 6-digit code (Math.random is predictable). */
export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** What a code is for. A verification code can never be used to reset a password, and vice versa. */
export type OtpPurpose = "verify" | "reset";

/**
 * Keyed hash of the code, bound to the email and its purpose. Only this is stored.
 * A plain SHA-256 of a 6-digit code could be reversed instantly with a lookup
 * table; with a server-side secret a leaked database doesn't reveal codes.
 */
export function hashOtp(email: string, otp: string, purpose: OtpPurpose = "verify"): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required to hash OTPs");
  // "verify" keeps the original format so codes issued before this change still work.
  const message = purpose === "verify" ? `${email}:${otp}` : `${purpose}:${email}:${otp}`;
  return createHmac("sha256", secret).update(message).digest("hex");
}

export function otpMatches(email: string, otp: string, storedHash: string | null | undefined, purpose: OtpPurpose = "verify"): boolean {
  if (!storedHash) return false;
  const a = Buffer.from(hashOtp(email, otp, purpose));
  const b = Buffer.from(storedHash);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Latest expiry a code may have if a new one is allowed to be sent now (enforces the resend cooldown). */
export function resendAllowedIfExpiryBefore(): Date {
  return new Date(Date.now() + OTP_TTL_MS - OTP_RESEND_COOLDOWN_MS);
}

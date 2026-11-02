import { NextRequest, NextResponse, after } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import {
  generateOtp,
  hashOtp,
  resendAllowedIfExpiryBefore,
  OTP_TTL_MS,
  RESET_MAX_CODES_PER_WINDOW,
  RESET_MAX_FAILURES_PER_WINDOW,
} from "@/lib/otp";
import { readJsonObject, rollResetWindow } from "@/lib/passwordReset";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Step 1 of "Forgot password?": email a 6-digit reset code.
 *
 * The response is identical whether or not the account exists (and whether a
 * code was actually sent), and the email is sent after the response so response
 * time doesn't reveal it either. Limits per account: one code per minute, five
 * codes and ten wrong guesses per hour.
 */
const GENERIC_RESPONSE = {
  message: "If an account exists for that email, we've sent a 6-digit code to it.",
};

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    const email = body?.email;

    // Strict type check also blocks NoSQL operator injection like { "email": { "$ne": null } }
    if (typeof email !== "string" || email.length > 254 || !EMAIL_PATTERN.test(email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    await dbConnect();

    const normalizedEmail = email.trim();
    const account = { email: normalizedEmail, isVerified: true };
    await rollResetWindow(account);

    const otp = generateOtp();
    // Atomic claim: only verified accounts within their hourly limits, and at most one code
    // per cooldown window, even if many requests arrive in parallel (prevents email bombing).
    const previous = await User.findOneAndUpdate(
      {
        ...account,
        resetCodesSent: { $lt: RESET_MAX_CODES_PER_WINDOW },
        resetFailures: { $lt: RESET_MAX_FAILURES_PER_WINDOW },
        $or: [{ resetOtpExpiry: null }, { resetOtpExpiry: { $lte: resendAllowedIfExpiryBefore() } }],
      },
      {
        $set: {
          resetOtp: hashOtp(normalizedEmail, otp, "reset"),
          resetOtpExpiry: new Date(Date.now() + OTP_TTL_MS),
          resetOtpAttempts: 0,
        },
        $inc: { resetCodesSent: 1 },
      }
    );

    if (previous) {
      // Send after the response so existing and unknown accounts take the same time to answer.
      after(async () => {
        try {
          const { sendPasswordResetCode } = await import("@/lib/email");
          await sendPasswordResetCode(normalizedEmail, otp);
        } catch (error) {
          // Put the previous code state back so the user can retry right away
          // and an earlier, still-valid code keeps working.
          console.error("Password reset email failed:", error);
          await User.updateOne(
            { _id: previous._id, resetOtp: hashOtp(normalizedEmail, otp, "reset") },
            {
              $set: {
                resetOtp: previous.resetOtp ?? null,
                resetOtpExpiry: previous.resetOtpExpiry ?? null,
                resetOtpAttempts: previous.resetOtpAttempts ?? 0,
              },
              $inc: { resetCodesSent: -1 },
            }
          );
        }
      });
    }

    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

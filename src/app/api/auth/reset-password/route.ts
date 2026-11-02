import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import { hashOtp, otpMatches, OTP_MAX_ATTEMPTS, RESET_MAX_FAILURES_PER_WINDOW } from "@/lib/otp";
import { readJsonObject, rollResetWindow } from "@/lib/passwordReset";

/**
 * One reply for every failure (no account, no code, expired, wrong code, too many tries),
 * so this endpoint can't be used to find out which emails are registered.
 */
const INVALID_CODE = "That code is invalid or has expired. Check it, or request a new code and try again.";
const invalid = () => NextResponse.json({ error: INVALID_CODE }, { status: 400 });

/**
 * Step 2 of "Forgot password?": check the emailed code and set the new password.
 * On success every existing session for the account is signed out (see lib/auth.ts).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    const { email, otp, password } = body ?? {};

    // Strict type checks block NoSQL operator injection like { "email": { "$ne": null } }
    if (typeof email !== "string" || typeof otp !== "string" || typeof password !== "string" || !email.trim() || email.length > 254 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "Enter your email and the 6-digit code" }, { status: 400 });
    }
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: "Password must be between 8 and 128 characters" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email: email.trim() }).select("email resetOtp resetOtpExpiry");
    if (!user || !user.resetOtp || !user.resetOtpExpiry || new Date() > new Date(user.resetOtpExpiry)) {
      return invalid();
    }

    await rollResetWindow({ _id: user._id });

    // Count the attempt atomically BEFORE comparing, so parallel guesses can't exceed the
    // per-code limit or the account's hourly limit.
    const attempt = await User.findOneAndUpdate(
      {
        _id: user._id,
        resetOtp: user.resetOtp,
        resetOtpAttempts: { $lt: OTP_MAX_ATTEMPTS },
        resetFailures: { $lt: RESET_MAX_FAILURES_PER_WINDOW },
      },
      { $inc: { resetOtpAttempts: 1, resetFailures: 1 } },
      { returnDocument: "after" }
    );
    if (!attempt) {
      // Burn this code (only this one: a newer code must survive) but keep its expiry,
      // so the resend cooldown still applies.
      await User.updateOne({ _id: user._id, resetOtp: user.resetOtp }, { $set: { resetOtp: null } });
      return invalid();
    }

    if (!otpMatches(user.email, otp, attempt.resetOtp, "reset")) {
      return invalid();
    }

    // One-time transition: the filter on the code hash means a code can only be used once,
    // even if two requests race.
    const updated = await User.findOneAndUpdate(
      { _id: user._id, resetOtp: hashOtp(user.email, otp, "reset") },
      {
        $set: {
          password: await bcrypt.hash(password, 12),
          passwordChangedAt: new Date(),
          resetOtp: null,
          resetOtpExpiry: null,
          resetOtpAttempts: 0,
          resetFailures: 0,
        },
      }
    );
    if (!updated) return invalid();

    return NextResponse.json({ message: "Your password has been reset. You can now log in." }, { status: 200 });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import { hashOtp, otpMatches, OTP_MAX_ATTEMPTS } from "@/lib/otp";
import { normalizeEmail } from "@/lib/validation";
import { checkRateLimit, clientKey } from "@/lib/rateLimit";
import { readJsonObject, tooManyRequests } from "@/lib/http";

const REFERRAL_REWARD = 50;
const HOUR = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const { email, otp, password } = (await readJsonObject(request)) ?? {};

    // Strict type checks block NoSQL operator injection like { "email": { "$ne": null } }
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || typeof otp !== "string" || typeof password !== "string" || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: "Missing email or OTP" },
        { status: 400 }
      );
    }

    // Per-code attempts are capped at 5; these caps stop guessing across many re-sent
    // codes (per account) and across many accounts (per IP).
    const [byIp, byAccount] = await Promise.all([
      checkRateLimit(clientKey(request, "verify-otp"), 30, HOUR),
      checkRateLimit(`verify-otp-account:${normalizedEmail}`, 15, HOUR),
    ]);
    if (!byIp.ok || !byAccount.ok) {
      return tooManyRequests(Math.max(byIp.retryAfterSeconds, byAccount.retryAfterSeconds), "Too many attempts. Please try again later.");
    }

    await dbConnect();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || user.isVerified) {
      // Same response for both cases so this endpoint can't be used to probe accounts.
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Check OTP expiry
    if (!user.otpExpiry || new Date() > new Date(user.otpExpiry)) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Count the attempt atomically BEFORE comparing, so parallel guesses can't exceed the limit.
    const attempt = await User.findOneAndUpdate(
      // Accounts created before attempt counting have no otpAttempts field yet.
      { _id: user._id, isVerified: false, $or: [{ otpAttempts: { $lt: OTP_MAX_ATTEMPTS } }, { otpAttempts: { $exists: false } }] },
      { $inc: { otpAttempts: 1 } },
      { new: true }
    );
    if (!attempt) {
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please register again to get a new code." },
        { status: 429 }
      );
    }

    // The password must match too: a code delivered to the owner's inbox can only
    // verify the account with the password the owner chose.
    const passwordMatches = await bcrypt.compare(password, attempt.password);
    if (!otpMatches(user.email, otp, attempt.verificationOtp) || !passwordMatches) {
      return NextResponse.json(
        { error: "Invalid OTP or password" },
        { status: 400 }
      );
    }

    // Mark as verified and clear OTP. The filter makes this a one-time transition,
    // so concurrent requests can't grant the referral reward twice.
    const verified = await User.findOneAndUpdate(
      { _id: user._id, isVerified: false, verificationOtp: hashOtp(user.email, otp) },
      { $set: { isVerified: true, verificationOtp: null, otpExpiry: null, otpAttempts: 0 } },
      { new: true }
    );
    if (!verified) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // 💸 Referral Reward System
    if (verified.referredBy && !verified.referralRewarded) {
      const rewarded = await User.findOneAndUpdate(
        { _id: verified._id, referralRewarded: { $ne: true } },
        { $set: { referralRewarded: true }, $inc: { walletBalance: REFERRAL_REWARD } }
      );
      if (rewarded) {
        await User.updateOne({ _id: verified.referredBy }, { $inc: { walletBalance: REFERRAL_REWARD } });
      }
    }

    return NextResponse.json(
      { message: "Email verified successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "An error occurred during verification" },
      { status: 500 }
    );
  }
}

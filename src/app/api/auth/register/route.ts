import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import { generateOtp, hashOtp, resendAllowedIfExpiryBefore, OTP_TTL_MS } from "@/lib/otp";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function findReferrerId(referralCode: unknown) {
  if (typeof referralCode !== "string" || !referralCode.trim() || referralCode.length > 20) return null;
  const referrer = await User.findOne({ referralCode: referralCode.trim().toUpperCase() }).select("_id");
  return referrer?._id ?? null;
}

/**
 * Sends the code. If sending fails, restore the previous expiry so the user
 * isn't blocked by the resend cooldown for an email they never received.
 */
async function sendOtpOrReleaseCooldown(userId: unknown, email: string, otp: string, previousExpiry: Date | null) {
  try {
    // Import here to avoid issues if email.ts is imported globally and fails
    const { sendOTP } = await import("@/lib/email");
    await sendOTP(email, otp);
  } catch (error) {
    await User.updateOne({ _id: userId }, { $set: { otpExpiry: previousExpiry } });
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, referralCode } = await request.json();

    // Strict type checks also block NoSQL operator injection like { "email": { "$ne": null } }
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string" || !name.trim() || !email.trim()) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (name.length > 80 || email.length > 254 || !EMAIL_PATTERN.test(email.trim())) {
      return NextResponse.json({ error: "Please enter a valid name and email address" }, { status: 400 });
    }
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: "Password must be between 8 and 128 characters" }, { status: 400 });
    }

    await dbConnect();

    const normalizedEmail = email.trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + OTP_TTL_MS);

    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 400 }
        );
      }

      // While a code is still pending, only the original registrant (same password) may resend it.
      // verify-otp also re-checks the password, so a swapped password can never inherit a code
      // that was delivered to the real owner's inbox.
      const codeStillValid = existingUser.otpExpiry && new Date(existingUser.otpExpiry) > new Date();
      const samePassword = await bcrypt.compare(password, existingUser.password);
      if (codeStillValid && !samePassword) {
        return NextResponse.json(
          { error: "A verification code was already sent to this email. Enter it, or try again after it expires." },
          { status: 409 }
        );
      }

      const update: Record<string, unknown> = {
        verificationOtp: hashOtp(normalizedEmail, otp),
        otpExpiry,
        otpAttempts: 0,
      };
      if (!samePassword) {
        update.password = await bcrypt.hash(password, 12);
        update.name = name.trim();
      }
      const referredById = await findReferrerId(referralCode);
      if (referredById && !existingUser.referredBy) update.referredBy = referredById;

      // Atomic claim: only one request per cooldown window can issue a new code,
      // even if many arrive in parallel (prevents email bombing).
      const previous = await User.findOneAndUpdate(
        { _id: existingUser._id, isVerified: false, $or: [{ otpExpiry: null }, { otpExpiry: { $lte: resendAllowedIfExpiryBefore() } }] },
        { $set: update }
      );
      if (!previous) {
        return NextResponse.json({ error: "Please wait a minute before requesting another code." }, { status: 429 });
      }

      await sendOtpOrReleaseCooldown(existingUser._id, normalizedEmail, otp, previous.otpExpiry ?? null);

      return NextResponse.json(
        { message: "OTP sent successfully to email", requireOtp: true, email: normalizedEmail },
        { status: 200 }
      );
    }

    const referredById = await findReferrerId(referralCode);
    const newReferralCode = `FRESH-${randomBytes(4).toString("hex").toUpperCase()}`;

    // Create new unverified user
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      isVerified: false,
      verificationOtp: hashOtp(normalizedEmail, otp),
      otpExpiry,
      otpAttempts: 0,
      referralCode: newReferralCode,
      referredBy: referredById,
    });

    await sendOtpOrReleaseCooldown(newUser._id, normalizedEmail, otp, null);

    return NextResponse.json(
      { message: "OTP sent successfully to email", requireOtp: true, email: normalizedEmail },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins from now

    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json(
          { error: "User already exists" },
          { status: 400 }
        );
      }
      
      // Update existing unverified user with new OTP and password
      existingUser.verificationOtp = otp;
      existingUser.otpExpiry = otpExpiry;
      existingUser.password = hashedPassword;
      existingUser.name = name;
      await existingUser.save();
      
      // Import here to avoid issues if email.ts is imported globally and fails
      const { sendOTP } = await import('@/lib/email');
      await sendOTP(email, otp);

      return NextResponse.json(
        { message: "OTP sent successfully to email", requireOtp: true, email },
        { status: 200 }
      );
    }

    // Create new unverified user
    await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationOtp: otp,
      otpExpiry,
    });

    const { sendOTP } = await import('@/lib/email');
    await sendOTP(email, otp);

    return NextResponse.json(
      { message: "OTP sent successfully to email", requireOtp: true, email },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}

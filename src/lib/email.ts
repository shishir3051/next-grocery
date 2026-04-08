import nodemailer from "nodemailer";

export async function sendOTP(email: string, otp: string) {
  // Check if credentials are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ EMAIL_USER or EMAIL_PASS is not set in .env! OTP will only be logged.");
    console.log(`\n=======================================\nMock Email to: ${email}\nOTP: ${otp}\n=======================================\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "FreshBasket - Verify your email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h1 style="color: #0d9488;">Welcome to FreshBasket!</h1>
        <p>Thank you for registering. To complete your registration, please verify your email address using the following One-Time Password (OTP):</p>
        <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f766e;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 14px;">This OTP is valid for 10 minutes from the time it was generated.</p>
        <p>If you did not attempt to register an account, you can safely ignore this email.</p>
        <br>
        <p>Best regards,<br><strong>The FreshBasket Team</strong></p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("OTP Email sent: " + info.messageId);
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw new Error("Failed to send verification email");
  }
}

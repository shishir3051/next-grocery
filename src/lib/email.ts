import nodemailer from "nodemailer";

interface CodeEmail {
  to: string;
  subject: string;
  heading: string;
  intro: string;
  code: string;
  /** Shown under the code, e.g. what to do if the email was unexpected. */
  footer: string;
}

/** Sends an email containing a one-time code. Shared by verification and password reset. */
async function sendCodeEmail({ to, subject, heading, intro, code, footer }: CodeEmail) {
  // Check if credentials are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    // Never pretend an email was sent in production; the user would be stuck without a code.
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured (EMAIL_USER / EMAIL_PASS)");
    }
    console.warn("⚠️ EMAIL_USER or EMAIL_PASS is not set in .env! The code will only be logged.");
    console.log(`\n=======================================\nMock email to: ${to}\nSubject: ${subject}\nCode: ${code}\n=======================================\n`);
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
    to,
    subject,
    text: `${heading}\n\n${intro}\n\n${code}\n\nThis code is valid for 10 minutes.\n\n${footer}\n\nThe FreshBasket Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h1 style="color: #0f766e;">${heading}</h1>
        <p>${intro}</p>
        <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f766e;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 14px;">This code is valid for 10 minutes from the time it was generated.</p>
        <p>${footer}</p>
        <br>
        <p>Best regards,<br><strong>The FreshBasket Team</strong></p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Code email sent: " + info.messageId);
  } catch (error) {
    console.error("Failed to send code email:", error);
    throw new Error("Failed to send email");
  }
}

/** Escapes text for safe use inside an HTML email (customer-written content). */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Plain text → escaped HTML paragraphs with line breaks kept. */
export const textToHtml = (text: string) => escapeHtml(text).replace(/\r?\n/g, "<br>");

interface PlainEmail {
  to: string;
  subject: string;
  /** Plain-text body. The HTML version is generated from it (escaped). */
  text: string;
  /** Where replies go, e.g. the customer's address on a contact-form alert. */
  replyTo?: string;
}

/**
 * Sends a simple text email (with an escaped HTML copy). Subject lines are stripped of
 * line breaks so customer text can never inject extra email headers.
 */
export async function sendPlainEmail({ to, subject, text, replyTo }: PlainEmail) {
  const safeSubject = subject.replace(/[\r\n]+/g, " ").slice(0, 200);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured (EMAIL_USER / EMAIL_PASS)");
    }
    console.log(`\n=======================================\nMock email to: ${to}\nReply-To: ${replyTo ?? "-"}\nSubject: ${safeSubject}\n\n${text}\n=======================================\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.sendMail({
    from: { name: "FreshBasket", address: process.env.EMAIL_USER },
    to,
    replyTo,
    subject: safeSubject,
    text,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.5;">${textToHtml(text)}</div>`,
  });
}

export async function sendOTP(email: string, otp: string) {
  await sendCodeEmail({
    to: email,
    subject: "FreshBasket - Verify your email",
    heading: "Welcome to FreshBasket!",
    intro: "Thank you for registering. To complete your registration, please verify your email address using the following one-time code:",
    code: otp,
    footer: "If you did not attempt to register an account, you can safely ignore this email.",
  });
}

export async function sendPasswordResetCode(email: string, otp: string) {
  await sendCodeEmail({
    to: email,
    subject: "FreshBasket - Reset your password",
    heading: "Reset your password",
    intro: "We received a request to reset the password for your FreshBasket account. Enter this code to choose a new password:",
    code: otp,
    footer: "If you didn't ask to reset your password, you can ignore this email. Your password won't change.",
  });
}

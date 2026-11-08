import { NextRequest, NextResponse, after } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { ContactMessage, CONTACT_SUBJECTS, contactReference } from "@/models/ContactMessage";
import { badRequest, readJsonObject, serverError, tooManyRequests } from "@/lib/http";
import { normalizeEmail, optionalString, requiredString } from "@/lib/validation";
import { checkRateLimit, clientKey } from "@/lib/rateLimit";
import { sendPlainEmail } from "@/lib/email";
import { demoReadOnly } from "@/lib/authGuard";
import { isDemoEmail, isDemoModeEnabled } from "@/lib/demo";

const HOUR = 60 * 60 * 1000;

/** Where new-message alerts go: CONTACT_EMAIL_TO, else the sending mailbox. */
const alertRecipient = () => process.env.CONTACT_EMAIL_TO || process.env.EMAIL_USER || "";

/**
 * POST /api/contact — public contact form.
 * Saves the message for the admin inbox (/admin/messages) and emails the store.
 * Protected by per-IP and per-email limits and a hidden "website" field that only bots fill.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    if (!body) return badRequest();

    // Honeypot: a hidden field real visitors never see. Pretend it worked so bots move on.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ ok: true, reference: "#000000" }, { status: 201 });
    }

    const name = requiredString(body.name, 80);
    const email = normalizeEmail(body.email);
    const message = requiredString(body.message, 3000);
    const subject = typeof body.subject === "string" && (CONTACT_SUBJECTS as readonly string[]).includes(body.subject) ? body.subject : null;
    const phone = optionalString(body.phone, 30);
    const orderRef = optionalString(body.orderRef, 40);

    if (!name) return badRequest("Please enter your name (max 80 characters).");
    if (!email) return badRequest("Please enter a valid email address.");
    if (!subject) return badRequest("Please choose a subject.");
    if (!message || message.length < 10) return badRequest("Please write a message of at least 10 characters (max 3,000).");
    if (phone === null || (phone && !/^[+\d][\d\s()-]{5,29}$/.test(phone))) return badRequest("Please enter a valid phone number.");
    if (orderRef === null) return badRequest("Order number is too long.");

    // In the live demo, the shared demo accounts can't send messages: messages from demo
    // addresses aren't masked, so they would show anyone's text to every demo visitor.
    // Real visitors can still write in (their messages are masked in the demo admin).
    const session = await getServerSession(authOptions);
    if (isDemoModeEnabled() && (session?.user?.isDemo || isDemoEmail(email))) return demoReadOnly();

    // Limits count only valid messages, so a customer fixing a typo isn't locked out.
    const limit = await checkRateLimit(clientKey(request, "contact"), 5, HOUR);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds, "You've sent several messages already. Please try again later or call us.");
    const perEmail = await checkRateLimit(`contact-email:${email}`, 3, HOUR);
    if (!perEmail.ok) return tooManyRequests(perEmail.retryAfterSeconds, "You've sent several messages already. We'll reply soon.");

    await dbConnect();
    const saved = await ContactMessage.create({
      name, email, subject, message,
      phone: phone ?? "",
      orderRef: orderRef ?? "",
      user: session?.user?.id ?? null,
    });
    const reference = contactReference(saved._id);

    // Email the store after responding, so a slow mail server doesn't slow the form down.
    const to = alertRecipient();
    if (to) {
      after(async () => {
        try {
          await sendPlainEmail({
            to,
            replyTo: email,
            subject: `[FreshBasket ${reference}] ${subject} — ${name}`,
            text: [
              `New contact message ${reference}`,
              "",
              `From: ${name} <${email}>`,
              phone ? `Phone: ${phone}` : "",
              orderRef ? `Order: ${orderRef}` : "",
              `Subject: ${subject}`,
              "",
              message,
              "",
              "Reply from the admin panel (Admin → Messages) so the reply is recorded.",
            ].filter((line, i, all) => line !== "" || all[i - 1] !== "").join("\n"),
          });
        } catch (error) {
          console.error("Contact alert email failed:", error);
        }
      });
    }

    return NextResponse.json({ ok: true, reference }, { status: 201 });
  } catch (error) {
    return serverError(error, "Contact form error", "We couldn't send your message. Please try again or call us.");
  }
}

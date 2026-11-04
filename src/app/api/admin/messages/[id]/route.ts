import { NextRequest, NextResponse } from "next/server";
import { ContactMessage, CONTACT_STATUSES, contactReference } from "@/models/ContactMessage";
import { requireRole } from "@/lib/authGuard";
import { badRequest, jsonError, notFound, readJsonObject, serverError } from "@/lib/http";
import { isObjectId, requiredString } from "@/lib/validation";
import { sendPlainEmail } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/messages/:id
 *   { status: "new" | "read" | "replied" | "closed" }  change the status
 *   { reply: "text" }                                   email the customer and record the reply
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const { id } = await params;
    if (!isObjectId(id)) return notFound("Message not found");

    const body = await readJsonObject(request);
    if (!body) return badRequest();

    if (body.reply !== undefined) {
      const reply = requiredString(body.reply, 5000);
      if (!reply) return badRequest("Write a reply (max 5,000 characters).");

      const message = await ContactMessage.findById(id).lean<{
        _id: unknown; name: string; email: string; subject: string; message: string; createdAt: Date;
      }>();
      if (!message) return notFound("Message not found");

      const reference = contactReference(message._id);
      try {
        await sendPlainEmail({
          to: message.email,
          replyTo: process.env.CONTACT_EMAIL_TO || undefined,
          subject: `Re: ${message.subject} [FreshBasket ${reference}]`,
          text: [
            `Hi ${message.name},`,
            "",
            reply,
            "",
            "Best regards,",
            `${auth.user.name} — FreshBasket support`,
            "",
            `---- Your message (${new Date(message.createdAt).toUTCString()}) ----`,
            message.message,
          ].join("\n"),
        });
      } catch (error) {
        console.error("Contact reply email failed:", error);
        return jsonError("The reply email couldn't be sent. Check the email settings and try again.", 502);
      }

      const updated = await ContactMessage.findByIdAndUpdate(
        id,
        {
          $push: { replies: { body: reply, sentBy: auth.user.id, sentByName: auth.user.name, sentAt: new Date() } },
          $set: { status: "replied" },
        },
        { new: true }
      ).lean();
      return NextResponse.json({ message: "Reply sent", contact: updated });
    }

    if (typeof body.status !== "string" || !(CONTACT_STATUSES as readonly string[]).includes(body.status)) {
      return badRequest("Invalid status");
    }
    const updated = await ContactMessage.findByIdAndUpdate(id, { $set: { status: body.status } }, { new: true }).lean();
    if (!updated) return notFound("Message not found");
    return NextResponse.json({ message: "Status updated", contact: updated });
  } catch (error) {
    return serverError(error, "Admin message update error");
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const { id } = await params;
    if (!isObjectId(id)) return notFound("Message not found");

    const deleted = await ContactMessage.findByIdAndDelete(id);
    if (!deleted) return notFound("Message not found");
    return NextResponse.json({ message: "Message deleted" });
  } catch (error) {
    return serverError(error, "Admin message delete error");
  }
}

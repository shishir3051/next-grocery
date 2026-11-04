import { NextRequest, NextResponse } from "next/server";
import { ContactMessage, CONTACT_STATUSES } from "@/models/ContactMessage";
import { requireRole } from "@/lib/authGuard";
import { serverError } from "@/lib/http";

const PAGE_SIZE = 50;

/** GET /api/admin/messages?status=new&page=1 — the admin inbox, newest first, with counts. */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const status = request.nextUrl.searchParams.get("status");
    const page = Math.max(1, Math.min(1000, Number(request.nextUrl.searchParams.get("page")) || 1));
    const filter = status && (CONTACT_STATUSES as readonly string[]).includes(status) ? { status } : {};

    const [messages, total, grouped] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
      ContactMessage.countDocuments(filter),
      ContactMessage.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const counts = Object.fromEntries(CONTACT_STATUSES.map(s => [s, 0])) as Record<string, number>;
    for (const g of grouped as { _id: string; count: number }[]) counts[g._id] = g.count;

    return NextResponse.json({ messages, total, page, pageSize: PAGE_SIZE, counts });
  } catch (error) {
    return serverError(error, "Admin messages fetch error");
  }
}

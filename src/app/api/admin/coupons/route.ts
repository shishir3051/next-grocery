import { NextRequest, NextResponse } from "next/server";
import { Coupon } from "@/models/Coupon";
import { requireRole } from "@/lib/authGuard";
import { badRequest, isDuplicateKeyError, notFound, readJsonObject, serverError } from "@/lib/http";
import { isObjectId, toDate, toNumber } from "@/lib/validation";

const CODE_PATTERN = /^[A-Z0-9_-]{3,30}$/;

/**
 * Validates the coupon fields present in the body (all required fields when `partial`
 * is false). Only these fields can be written.
 */
function parseCoupon(body: Record<string, unknown>, partial: boolean) {
  const has = (key: string) => body[key] !== undefined;
  const out: Record<string, unknown> = {};

  if (!partial || has("code")) {
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    if (!CODE_PATTERN.test(code)) return { error: "Code must be 3–30 letters, digits, - or _" };
    out.code = code;
  }
  if (!partial || has("discountType")) {
    if (body.discountType !== "percentage" && body.discountType !== "fixed") return { error: "Discount type must be percentage or fixed" };
    out.discountType = body.discountType;
  }
  if (!partial || has("discountValue")) {
    const discountValue = toNumber(body.discountValue, { min: 0.01, max: 1_000_000 });
    if (discountValue === null) return { error: "Discount value must be a positive number" };
    out.discountValue = discountValue;
  }
  if (has("minOrderAmount")) {
    const raw = body.minOrderAmount === "" || body.minOrderAmount === null ? 0 : body.minOrderAmount;
    const minOrderAmount = toNumber(raw, { min: 0, max: 1_000_000 });
    if (minOrderAmount === null) return { error: "Minimum order must be 0 or more" };
    out.minOrderAmount = minOrderAmount;
  }
  if (has("maxDiscount")) {
    if (body.maxDiscount === "" || body.maxDiscount === null || body.maxDiscount === 0) {
      out.maxDiscount = null;
    } else {
      const maxDiscount = toNumber(body.maxDiscount, { min: 0.01, max: 1_000_000 });
      if (maxDiscount === null) return { error: "Maximum discount must be a positive number" };
      out.maxDiscount = maxDiscount;
    }
  }
  if (has("startDate") && body.startDate) {
    const startDate = toDate(body.startDate);
    if (!startDate) return { error: "Invalid start date" };
    out.startDate = startDate;
  }
  if (!partial || has("expiryDate")) {
    const expiryDate = toDate(body.expiryDate);
    if (!expiryDate) return { error: "Invalid expiry date" };
    // A date-only value ("2026-12-31") means the end of that day, not midnight at its start.
    if (typeof body.expiryDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.expiryDate)) {
      expiryDate.setUTCHours(23, 59, 59, 999);
    }
    out.expiryDate = expiryDate;
  }
  if (has("isActive")) {
    if (typeof body.isActive !== "boolean") return { error: "Invalid active flag" };
    out.isActive = body.isActive;
  }
  if (has("usageLimit")) {
    if (body.usageLimit === "" || body.usageLimit === null || body.usageLimit === 0) {
      out.usageLimit = null;
    } else {
      const usageLimit = toNumber(body.usageLimit, { min: 1, max: 10_000_000, integer: true });
      if (usageLimit === null) return { error: "Usage limit must be a whole number of 1 or more" };
      out.usageLimit = usageLimit;
    }
  }

  if (out.discountType === "percentage" && typeof out.discountValue === "number" && out.discountValue > 100) {
    return { error: "A percentage discount can't be more than 100%" };
  }
  return { value: out };
}

export async function GET() {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ coupons });
  } catch (error) {
    return serverError(error, "Admin coupons fetch error");
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const body = await readJsonObject(request);
    if (!body) return badRequest();

    const parsed = parseCoupon(body, false);
    if ("error" in parsed) return badRequest(parsed.error);

    const newCoupon = await Coupon.create({ isActive: true, ...parsed.value });
    return NextResponse.json({ message: "Coupon created successfully", coupon: newCoupon });
  } catch (error) {
    if (isDuplicateKeyError(error)) return badRequest("Coupon code already exists");
    return serverError(error, "Admin coupon create error");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const body = await readJsonObject(request);
    if (!body || !isObjectId(body.id)) return badRequest("Coupon ID required");

    const parsed = parseCoupon(body, true);
    if ("error" in parsed) return badRequest(parsed.error);

    // Re-check the percentage cap against the stored type when only one side changes.
    if (parsed.value.discountValue !== undefined && parsed.value.discountType === undefined) {
      const current = await Coupon.findById(body.id).select("discountType").lean<{ discountType: string }>();
      if (!current) return notFound("Coupon not found");
      if (current.discountType === "percentage" && (parsed.value.discountValue as number) > 100) {
        return badRequest("A percentage discount can't be more than 100%");
      }
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(body.id, { $set: parsed.value }, { new: true, runValidators: true });
    if (!updatedCoupon) return notFound("Coupon not found");

    return NextResponse.json({ message: "Coupon updated successfully", coupon: updatedCoupon });
  } catch (error) {
    if (isDuplicateKeyError(error)) return badRequest("Coupon code already exists");
    return serverError(error, "Admin coupon update error");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const id = request.nextUrl.searchParams.get('id');
    if (!isObjectId(id)) return badRequest("ID required");

    await Coupon.findByIdAndDelete(id);
    return NextResponse.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    return serverError(error, "Admin coupon delete error");
  }
}

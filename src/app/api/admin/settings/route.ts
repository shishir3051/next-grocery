import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Settings } from "@/models/Settings";
import { requireRole } from "@/lib/authGuard";
import { badRequest, readJsonObject, serverError } from "@/lib/http";
import { normalizeEmail, optionalString, toNumber } from "@/lib/validation";

export async function GET() {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    await dbConnect();
    const settings = (await Settings.findOne()) ?? (await Settings.create({}));
    return NextResponse.json({ settings });
  } catch (error) {
    return serverError(error, "Admin settings fetch error");
  }
}

/** Updates store settings. Only the known fields are accepted, each validated. */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const body = await readJsonObject(request);
    if (!body) return badRequest();

    const update: Record<string, unknown> = {};

    const storeName = optionalString(body.storeName, 80);
    if (storeName === null) return badRequest("Store name is too long");
    if (storeName) update.storeName = storeName;

    if (body.supportEmail !== undefined) {
      const supportEmail = normalizeEmail(body.supportEmail);
      if (!supportEmail) return badRequest("Enter a valid support email");
      update.supportEmail = supportEmail;
    }

    const supportPhone = optionalString(body.supportPhone, 30);
    if (supportPhone === null) return badRequest("Support phone is too long");
    if (supportPhone !== undefined) update.supportPhone = supportPhone;

    if (body.deliveryFee !== undefined) {
      const deliveryFee = toNumber(body.deliveryFee, { min: 0, max: 10_000 });
      if (deliveryFee === null) return badRequest("Delivery fee must be between 0 and 10,000");
      update.deliveryFee = deliveryFee;
    }
    if (body.minFreeDelivery !== undefined) {
      const minFreeDelivery = toNumber(body.minFreeDelivery, { min: 0, max: 1_000_000 });
      if (minFreeDelivery === null) return badRequest("Free-delivery threshold must be between 0 and 1,000,000");
      update.minFreeDelivery = minFreeDelivery;
    }
    if (body.maintenanceMode !== undefined) {
      if (typeof body.maintenanceMode !== "boolean") return badRequest("Invalid maintenance mode");
      update.maintenanceMode = body.maintenanceMode;
    }

    await dbConnect();
    const settings = await Settings.findOneAndUpdate({}, { $set: update }, { new: true, upsert: true, runValidators: true });
    return NextResponse.json({ message: "Settings updated successfully", settings });
  } catch (error) {
    return serverError(error, "Admin settings update error");
  }
}

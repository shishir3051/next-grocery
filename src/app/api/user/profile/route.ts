import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import { requireUser, PRIVATE_USER_FIELDS } from "@/lib/authGuard";
import { badRequest, notFound, readJsonObject, serverError } from "@/lib/http";
import { optionalImage, optionalString, requiredString } from "@/lib/validation";

export async function GET() {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    const user = await User.findById(auth.user.id).select(PRIVATE_USER_FIELDS).lean();
    if (!user) return notFound("User not found");

    return NextResponse.json({ user });
  } catch (error) {
    return serverError(error, "Profile fetch error", "Internal server error");
  }
}

/**
 * Updates the signed-in user's own name, phone, address and avatar.
 * Email, role, wallet and verification fields can't be changed here.
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    const body = await readJsonObject(request);
    if (!body) return badRequest();

    const set: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = requiredString(body.name, 80);
      if (!name) return badRequest("Name is required (max 80 characters)");
      set.name = name;
    }

    const image = optionalImage(body.image);
    if (image === null) return badRequest("Profile photo must be a PNG, JPEG, WebP, GIF or AVIF under 2 MB");
    if (image !== undefined) set.image = image;

    const address = body.address && typeof body.address === "object" && !Array.isArray(body.address)
      ? (body.address as Record<string, unknown>)
      : {};
    const fields: [string, unknown, number][] = [
      ["address.street", address.street, 300],
      ["address.city", address.city, 100],
      ["address.zipCode", address.zipCode, 20],
      ["address.phone", body.phone ?? address.phone, 30],
    ];
    for (const [path, value, max] of fields) {
      const text = optionalString(value, max);
      if (text === null) return badRequest("Please check your address and phone number");
      if (text !== undefined) set[path] = text;
    }

    const user = await User.findByIdAndUpdate(auth.user.id, { $set: set }, { new: true, runValidators: true })
      .select(PRIVATE_USER_FIELDS)
      .lean();
    if (!user) return notFound("User not found");

    return NextResponse.json({ message: "Profile updated successfully", user });
  } catch (error) {
    return serverError(error, "Profile update error", "Internal server error");
  }
}

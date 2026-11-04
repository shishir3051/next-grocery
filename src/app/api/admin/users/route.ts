import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import { requireRole, PRIVATE_USER_FIELDS, type Role } from "@/lib/authGuard";
import { badRequest, isDuplicateKeyError, notFound, readJsonObject, serverError } from "@/lib/http";
import { isObjectId, normalizeEmail, requiredString } from "@/lib/validation";

const ROLES: Role[] = ["user", "admin", "delivery"];
const isRole = (value: unknown): value is Role => typeof value === "string" && (ROLES as string[]).includes(value);

/** Creates a verified account with a chosen role (e.g. a delivery rider). Admin only. */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const body = await readJsonObject(request);
    const name = requiredString(body?.name, 80);
    const email = normalizeEmail(body?.email);
    const password = typeof body?.password === "string" ? body.password : "";
    const role = body?.role;

    if (!name || !email || !isRole(role)) {
      return badRequest("Enter a name, a valid email and a role");
    }
    if (password.length < 8 || password.length > 128) {
      return badRequest("Password must be between 8 and 128 characters");
    }

    await dbConnect();
    const newUser = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role,
      isVerified: true,
      referralCode: `FRESH-${randomBytes(4).toString("hex").toUpperCase()}`,
    });

    return NextResponse.json({
      message: "User created successfully",
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
    }, { status: 201 });
  } catch (error) {
    if (isDuplicateKeyError(error)) return badRequest("User already exists with this email");
    return serverError(error, "Admin user creation error");
  }
}

export async function GET() {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    // Never send password hashes or one-time-code hashes, even to admins.
    const users = await User.find({}).select(PRIVATE_USER_FIELDS).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ users });
  } catch (error) {
    return serverError(error, "Admin users fetch error");
  }
}

/** Changes a user's role. */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const body = await readJsonObject(request);
    const id = body?.id;
    const role = body?.role;
    if (!isObjectId(id) || !isRole(role)) return badRequest("Invalid user or role");

    if (auth.user.id === id && role !== "admin") {
      return badRequest("Cannot demote yourself");
    }

    const updatedUser = await User.findByIdAndUpdate(id, { $set: { role } }, { new: true, runValidators: true })
      .select(PRIVATE_USER_FIELDS)
      .lean();
    if (!updatedUser) return notFound("User not found");

    return NextResponse.json({ message: "User role updated", user: updatedUser });
  } catch (error) {
    return serverError(error, "Admin user role update error");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const id = request.nextUrl.searchParams.get("id");
    if (!isObjectId(id)) return badRequest("ID required");

    if (auth.user.id === id) {
      return badRequest("Cannot delete yourself");
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return notFound("User not found");
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    return serverError(error, "Admin user delete error");
  }
}

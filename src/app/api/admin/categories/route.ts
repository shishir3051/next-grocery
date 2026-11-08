import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Category, Product } from "@/models/Product";
import { requireRole, requireRoleForWrite } from "@/lib/authGuard";
import { badRequest, isDuplicateKeyError, notFound, readJsonObject, serverError } from "@/lib/http";
import { isObjectId, optionalString, requiredString, slugify } from "@/lib/validation";

const MAX_DEPTH = 2; // top level (0) → subcategory (1) → sub-subcategory (2)

/** Reads and validates name / parentId / icon. Returns an error message or the clean values. */
async function parseCategory(body: Record<string, unknown> | null, selfId?: string) {
  const name = requiredString(body?.name, 60);
  if (!name) return { error: "Name is required (max 60 characters)" };

  const icon = optionalString(body?.icon, 16);
  if (icon === null) return { error: "Icon must be a short emoji or text" };

  const rawParent = body?.parentId;
  let parentId: string | null = null;
  let level = 0;
  if (rawParent !== undefined && rawParent !== null && rawParent !== "" && rawParent !== "null") {
    if (!isObjectId(rawParent) || rawParent === selfId) return { error: "Invalid parent category" };
    const parent = await Category.findById(rawParent).select("level").lean<{ level?: number }>();
    if (!parent) return { error: "Parent category not found" };
    level = (parent.level || 0) + 1;
    if (level > MAX_DEPTH) return { error: "Categories can be nested at most three levels deep" };
    parentId = rawParent;
  }

  return { value: { name, slug: slugify(name, "category"), parentId, icon: icon || "", level } };
}

export async function GET() {
  try {
    const auth = await requireRole("admin");
    if ("response" in auth) return auth.response;

    const categories = await Category.find().sort({ level: 1, name: 1 }).lean();
    return NextResponse.json({ categories });
  } catch (error) {
    return serverError(error, "Admin categories fetch error");
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRoleForWrite("admin");
    if ("response" in auth) return auth.response;

    const parsed = await parseCategory(await readJsonObject(request));
    if ("error" in parsed) return badRequest(parsed.error);

    const newCategory = await Category.create(parsed.value);
    return NextResponse.json({ message: "Category created successfully", category: newCategory });
  } catch (error) {
    if (isDuplicateKeyError(error)) return badRequest("A category with this name already exists");
    return serverError(error, "Admin category create error");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireRoleForWrite("admin");
    if ("response" in auth) return auth.response;

    const body = await readJsonObject(request);
    const id = body?.id;
    if (!isObjectId(id)) return badRequest("ID and Name are required");

    await dbConnect();
    const parsed = await parseCategory(body, id);
    if ("error" in parsed) return badRequest(parsed.error);

    const updatedCategory = await Category.findByIdAndUpdate(id, { $set: parsed.value }, { new: true, runValidators: true });
    if (!updatedCategory) return notFound("Category not found");

    return NextResponse.json({ message: "Category updated successfully", category: updatedCategory });
  } catch (error) {
    if (isDuplicateKeyError(error)) return badRequest("A category with this name already exists");
    return serverError(error, "Admin category update error");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireRoleForWrite("admin");
    if ("response" in auth) return auth.response;

    const id = request.nextUrl.searchParams.get("id");
    if (!isObjectId(id)) return badRequest("ID required");

    if (await Category.exists({ parentId: id })) {
      return badRequest("Cannot delete category with subcategories");
    }
    if (await Product.exists({ category: id })) {
      return badRequest("Cannot delete category with assigned products");
    }

    await Category.findByIdAndDelete(id);
    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    return serverError(error, "Admin category delete error");
  }
}

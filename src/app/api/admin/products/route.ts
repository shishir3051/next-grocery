import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Product, Category } from "@/models/Product";
import { User } from "@/models/User";
import { getBase64FromUrl } from "@/lib/imageUtils";

async function resolveCategoryId(categoryName: string) {
  if (categoryName.match(/^[0-9a-fA-F]{24}$/)) return categoryName; // Already an ID
  const cat = await Category.findOne({ name: categoryName });
  return cat ? cat._id : null;
}

/**
 * Handle Product management for admins.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const adminUser = await User.findOne({ email: session.user.email });
    if (adminUser?.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const products = await Product.find().sort({ createdAt: -1 });
    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const adminUser = await User.findOne({ email: session.user.email });
    if (adminUser?.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    let { name, price, discountPrice, unit, category, description, image, imageUrl, stock, isOrganic, isHalal } = body;

    const resolvedCategory = await resolveCategoryId(category);
    if (!resolvedCategory) {
      return NextResponse.json({ error: `Category "${category}" not found` }, { status: 400 });
    }

    // Process image if URL is provided
    let imageData = "";
    if (imageUrl) {
      imageData = await getBase64FromUrl(imageUrl) || "";
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newProduct = await Product.create({
      name,
      slug,
      price: Number(price),
      discountPrice: Number(discountPrice) || 0,
      unit,
      category: resolvedCategory,
      description,
      images: [imageUrl || image],
      imageData: imageData || body.imageData,
      stock: Number(stock) || 100,
      isOrganic: !!isOrganic,
      isHalal: !!isHalal,
    });

    return NextResponse.json({ message: "Product created successfully", product: newProduct });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const adminUser = await User.findOne({ email: session.user.email });
    if (adminUser?.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    // If category is a name, resolve it to ID
    if (updateData.category) {
      const resolved = await resolveCategoryId(updateData.category);
      if (resolved) updateData.category = resolved;
    }

    // Ensure numbers are numbers
    if (updateData.price) updateData.price = Number(updateData.price);
    if (updateData.discountPrice !== undefined) updateData.discountPrice = Number(updateData.discountPrice) || 0;
    if (updateData.stock !== undefined) updateData.stock = Number(updateData.stock) || 0;

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Product updated successfully", product: updatedProduct });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const adminUser = await User.findOne({ email: session.user.email });
    if (adminUser?.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await Product.findByIdAndDelete(id);
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

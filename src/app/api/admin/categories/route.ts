import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Category, Product } from "@/models/Product";
import { User } from "@/models/User";

async function checkAdmin(session: any) {
  if (!session || !session.user) return false;
  await dbConnect();
  const adminUser = await User.findOne({ email: session.user.email });
  return adminUser?.role === 'admin';
}

/**
 * Handle Category management for admins.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!(await checkAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const categories = await Category.find().sort({ level: 1, name: 1 });
    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(await checkAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, parentId, icon } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    let level = 0;
    if (parentId && parentId !== 'null' && parentId !== '') {
        const parent = await Category.findById(parentId);
        if (parent) {
            level = (parent.level || 0) + 1;
        }
    }

    const newCategory = await Category.create({ 
      name, 
      slug, 
      parentId: (parentId && parentId !== 'null' && parentId !== '') ? parentId : null, 
      icon: icon || '', 
      level 
    });

    return NextResponse.json({ message: "Category created successfully", category: newCategory });
  } catch (error: any) {
    if (error.code === 11000) {
        return NextResponse.json({ error: "A category with this name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(await checkAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, parentId, icon } = await request.json();

    if (!id || !name) {
      return NextResponse.json({ error: "ID and Name are required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    let level = 0;
    if (parentId && parentId !== 'null' && parentId !== '') {
        const parent = await Category.findById(parentId);
        if (parent) {
            level = (parent.level || 0) + 1;
        }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id, 
      { 
        name, 
        slug, 
        parentId: (parentId && parentId !== 'null' && parentId !== '') ? parentId : null, 
        icon: icon || '', 
        level 
      }, 
      { new: true }
    );

    if (!updatedCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Category updated successfully", category: updatedCategory });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(await checkAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    // Check if category has subcategories
    const hasSubs = await Category.findOne({ parentId: id });
    if (hasSubs) {
        return NextResponse.json({ error: "Cannot delete category with subcategories" }, { status: 400 });
    }

    // Check if category has products
    const hasProducts = await Product.findOne({ category: id });
    if (hasProducts) {
        return NextResponse.json({ error: "Cannot delete category with assigned products" }, { status: 400 });
    }

    await Category.findByIdAndDelete(id);
    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

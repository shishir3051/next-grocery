import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";

/**
 * Temporary setup route to promote the currently logged-in user to 'admin'.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Please log in first" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { role: "admin" },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: `User ${user.email} promoted to admin. You can now access the Admin Dashboard!`,
      status: "success"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

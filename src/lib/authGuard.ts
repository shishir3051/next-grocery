import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";

/**
 * Returns the signed-in user's id if they are an admin, otherwise null.
 *
 * The role is read from the database, not from the JWT, so a user who is
 * demoted (or deleted) loses admin access immediately instead of keeping it
 * until their token expires.
 */
export async function requireAdmin(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  await dbConnect();
  const user = await User.findOne({ email: session.user.email }).select("role").lean<{ _id: unknown; role: string }>();
  return user?.role === "admin" ? String(user._id) : null;
}

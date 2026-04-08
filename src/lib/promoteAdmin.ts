import dbConnect from "./mongodb";
import { User } from "@/models/User";

/**
 * Promoting a user to admin by email.
 * This can be run using a scratch script or integrated into a temporary API.
 */
export async function promoteUserToAdmin(email: string) {
  try {
    await dbConnect();
    const user = await User.findOneAndUpdate(
      { email },
      { role: "admin" },
      { new: true }
    );
    
    if (!user) {
      return { success: false, message: "User not found" };
    }
    
    return { success: true, message: `User ${email} promoted to admin successfully` };
  } catch (error: any) {
    console.error("Promotion error:", error);
    return { success: false, message: error.message };
  }
}

"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isAuth = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";
  
  // Only the home page currently features the fixed categories sidebar
  const showSidebarOffset = pathname === "/";

  // The /showcase landing page renders its own footer.
  if (isAdmin || isAuth || pathname === "/checkout" || pathname?.startsWith("/showcase")) return null;

  return <Footer showSidebarOffset={showSidebarOffset} />;
}

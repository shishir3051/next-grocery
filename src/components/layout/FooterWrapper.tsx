"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isAuth = pathname === "/login" || pathname === "/register";
  
  // Only the home page currently features the fixed categories sidebar
  const showSidebarOffset = pathname === "/";

  if (isAdmin || isAuth) return null;

  return <Footer showSidebarOffset={showSidebarOffset} />;
}

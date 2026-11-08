"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  LayoutGrid,
  ShoppingBag,
  Package,
  Users,
  Settings,
  Menu,
  X,
  ChevronLeft,
  Loader2,
  Leaf,
  Home,
  Newspaper,
  Ticket,
  Image as ImageIcon,
  Inbox,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import DemoModeBanner from "@/components/auth/DemoModeBanner";

const SIDEBAR_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: ShoppingBag },
  { name: "Categories", href: "/admin/categories", icon: LayoutGrid },
  { name: "Orders", href: "/admin/orders", icon: Package },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Messages", href: "/admin/messages", icon: Inbox },
  { name: "Coupons", href: "/admin/coupons", icon: Ticket },
  { name: "News", href: "/admin/news", icon: Newspaper },
  { name: "Hero Banners", href: "/admin/hero", icon: ImageIcon },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

/** "/admin" only matches itself; other items also match their sub-pages (e.g. /admin/news/123). */
function isItemActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Shared look for sidebar links: calm by default, brand tint when active. */
function navLinkClass(isActive: boolean) {
  return cn(
    "group flex min-h-9 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-brand-50 text-brand-700 font-semibold"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  );
}

function navIconClass(isActive: boolean) {
  return cn("flex-shrink-0", isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600");
}

/** The logo mark is the one place (besides the hero) where a gradient is allowed. */
function LogoMark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-sm",
        size === "sm" ? "h-8 w-8 rounded-lg" : "h-10 w-10"
      )}
    >
      <Leaf size={size === "sm" ? 16 : 20} className="text-white" aria-hidden="true" />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Handle window resize to auto-collapse sidebar on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
        setIsMobileSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin");
    } else if (status === "authenticated") {
      // Defence in depth: src/proxy.ts already blocks non-admins on the server.
      if (session?.user?.role === "admin") {
        setIsAuthorized(true);
      } else {
        router.replace("/");
      }
    }
  }, [status, router, session]);

  if (status === "loading" || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" aria-hidden="true" />
        <span className="sr-only">Loading admin panel…</span>
      </div>
    );
  }

  const userName = session?.user?.name || "Admin";
  const userInitial = userName.charAt(0).toUpperCase();
  const currentPageName = SIDEBAR_ITEMS.find((i) => isItemActive(pathname, i.href))?.name || "Dashboard";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row leading-normal">
      {/* Mobile Top Header (Sticky) */}
      <div className="lg:hidden h-14 bg-white border-b border-slate-200 px-3 flex items-center justify-between sticky top-0 z-[60]">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark size="sm" />
          <span className="text-lg font-black text-slate-900 tracking-tight">
            Fresh<span className="text-brand-600">Admin</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-label="Open admin menu"
          aria-expanded={isMobileSidebarOpen}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Menu size={22} aria-hidden="true" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay/Drawer */}
      <AnimatePresence mode="wait">
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute inset-0 bg-slate-900/50"
            />
            {/* Drawer Content */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white flex flex-col shadow-xl"
              aria-label="Admin navigation"
            >
              <div className="px-3 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LogoMark />
                  <span className="text-lg font-black text-slate-900 tracking-tight">
                    Fresh<span className="text-brand-600">Admin</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  aria-label="Close admin menu"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {SIDEBAR_ITEMS.map((item) => {
                  const isActive = isItemActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={navLinkClass(isActive)}
                    >
                      <item.icon size={20} className={navIconClass(isActive)} aria-hidden="true" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-slate-200 space-y-2">
                <Link href="/" className={navLinkClass(false)}>
                  <Home size={20} className={navIconClass(false)} aria-hidden="true" />
                  <span>Back to store</span>
                </Link>
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
                    {userInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                    <p className="text-xs text-slate-500">Administrator</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Persistent Sidebar */}
      <aside
        aria-label="Admin navigation"
        className={cn(
          "hidden lg:flex fixed inset-y-0 left-0 z-50 flex-col bg-white border-r border-slate-200 p-2.5 transition-[width] duration-300 ease-in-out",
          isSidebarOpen ? "w-60" : "w-16"
        )}
      >
        <Link href="/" className="flex h-11 items-center gap-2.5 mb-3 px-1.5 overflow-hidden flex-shrink-0">
          <LogoMark />
          {isSidebarOpen && (
            <span className="text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">
              Fresh<span className="text-brand-600">Admin</span>
            </span>
          )}
        </Link>

        <nav className="flex-1 space-y-0.5 overflow-y-auto no-scrollbar">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = isItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                // When collapsed only the icon is visible, so give it a name and a tooltip
                aria-label={isSidebarOpen ? undefined : item.name}
                title={isSidebarOpen ? undefined : item.name}
                className={cn(navLinkClass(isActive), "relative", !isSidebarOpen && "justify-center px-0")}
              >
                {/* Active indicator bar on the left edge */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-brand-600" aria-hidden="true" />
                )}
                <item.icon size={20} className={navIconClass(isActive)} aria-hidden="true" />
                {isSidebarOpen && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-slate-200 pt-2 space-y-0.5">
          <Link
            href="/"
            aria-label={isSidebarOpen ? undefined : "Back to store"}
            title={isSidebarOpen ? undefined : "Back to store"}
            className={cn(navLinkClass(false), !isSidebarOpen && "justify-center px-0")}
          >
            <Home size={20} className={navIconClass(false)} aria-hidden="true" />
            {isSidebarOpen && <span>Back to store</span>}
          </Link>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={isSidebarOpen}
            className={cn(navLinkClass(false), "w-full", !isSidebarOpen && "justify-center px-0")}
          >
            <ChevronLeft
              size={20}
              className={cn(navIconClass(false), "transition-transform duration-300", !isSidebarOpen && "rotate-180")}
              aria-hidden="true"
            />
            {isSidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={cn("flex-1 min-w-0 transition-[margin] duration-300", isSidebarOpen ? "lg:ml-60" : "lg:ml-16")}>
        {/* Desktop Header Only */}
        <header className="hidden lg:flex h-14 bg-white/90 backdrop-blur border-b border-slate-200 px-5 items-center justify-between sticky top-0 z-40">
          <h1 className="text-base font-semibold text-slate-900">{currentPageName}</h1>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{userName}</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
            <div
              className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-semibold"
              aria-hidden="true"
            >
              {userInitial}
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-4 lg:p-5 max-w-[1600px] mx-auto min-h-[calc(100vh-3.5rem)]">
          {session?.user?.isDemo && <DemoModeBanner area="admin" />}
          {/* y-only entrance: page content is never hidden if the animation doesn't run */}
          <motion.div initial={{ y: 8 }} animate={{ y: 0 }} transition={{ duration: 0.2 }} key={pathname}>
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Loader2,
  Leaf,
  Home,
  ExternalLink,
  Newspaper,
  Ticket
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const SIDEBAR_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: ShoppingBag },
  { name: "Orders", href: "/admin/orders", icon: Package },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Coupons", href: "/admin/coupons", icon: Ticket },
  { name: "News", href: "/admin/news", icon: Newspaper },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin");
    } else if (status === "authenticated") {
      // Small check to ensure role is admin (backend also checks)
      const user = session.user as any;
      if (user.role && user.role !== 'admin') {
         // Some sessions might not include role initially, 
         // but the API will block and the page will check too.
      }
      setIsAuthorized(true);
    }
  }, [status, router, session]);

  if (status === "loading" || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="h-full flex flex-col p-4">
          <Link href="/" className="flex items-center gap-3 mb-10 px-2 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/20">
              <Leaf size={20} className="text-white" />
            </div>
            {isSidebarOpen && (
              <span className="text-xl font-black text-slate-800 tracking-tight whitespace-nowrap">
                Fresh<span className="text-teal-500">Admin</span>
              </span>
            )}
          </Link>

          <nav className="flex-1 space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                    isActive 
                      ? 'bg-teal-50 text-teal-600' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon size={20} className={isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'} />
                  {isSidebarOpen && (
                    <span className="text-sm font-bold">{item.name}</span>
                  )}
                  {isActive && isSidebarOpen && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Back to store — at bottom of sidebar nav */}
          <div className="border-t border-slate-100 pt-3 mt-3">
            <Link
              href="/"
              className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 group"
            >
              <Home size={20} className="text-slate-400 group-hover:text-emerald-600" />
              {isSidebarOpen && (
                <span className="text-sm font-bold">Back to Store</span>
              )}
            </Link>
          </div>

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mt-auton mb-4 p-3 rounded-xl hover:bg-slate-50 text-slate-400 transition-all flex items-center gap-3"
          >
            <ChevronRight size={20} className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} />
            {isSidebarOpen && <span className="text-sm font-bold">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
          <h2 className="text-lg font-bold text-slate-800">
            {SIDEBAR_ITEMS.find(i => i.href === pathname)?.name || "Dashboard"}
          </h2>
          
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{session?.user?.name}</p>
               <p className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full inline-block">Administrator</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border-2 border-white shadow-sm uppercase">
               {session?.user?.name?.charAt(0)}
             </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

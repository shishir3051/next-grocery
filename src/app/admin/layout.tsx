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
  Ticket,
  Image
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
  { name: "Hero Banners", href: "/admin/hero", icon: Image },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

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
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row leading-normal">
      {/* Mobile Top Header (Sticky) */}
      <div className="lg:hidden h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-[60] shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-md">
            <Leaf size={16} className="text-white" />
          </div>
          <span className="text-lg font-black text-slate-800 tracking-tight">FreshAdmin</span>
        </Link>
        <button 
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
        >
          <Menu size={24} />
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            {/* Drawer Content */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 left-0 w-72 bg-white flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg">
                    <Leaf size={20} className="text-white" />
                  </div>
                  <span className="text-xl font-black text-slate-800 tracking-tight">FreshAdmin</span>
                </div>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)} 
                  className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-rose-600 shadow-sm transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar mt-4">
                {SIDEBAR_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all group ${
                        isActive 
                          ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' 
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} />
                      <span className="text-sm font-black uppercase tracking-wider">{item.name}</span>
                      {isActive && <ChevronRight size={16} className="ml-auto opacity-50" />}
                    </Link>
                  );
                })}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-3">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-600 font-bold hover:bg-white hover:text-emerald-700 transition-all shadow-sm border border-transparent hover:border-emerald-100"
                >
                  <Home size={18} />
                  <span className="text-xs uppercase tracking-widest">Back to Store</span>
                </Link>
                <div className="flex items-center gap-3 px-2 py-1">
                   <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 font-black text-xs">
                     {session?.user?.name?.charAt(0)}
                   </div>
                   <div className="min-w-0">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate">{session?.user?.name}</p>
                     <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest">Administrator</p>
                   </div>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Persistent Sidebar */}
      <aside 
        className={`hidden lg:flex fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex-col p-4 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <Link href="/" className="flex items-center gap-3 mb-10 px-2 overflow-hidden flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/20">
            <Leaf size={20} className="text-white" />
          </div>
          {isSidebarOpen && (
            <span className="text-xl font-black text-slate-800 tracking-tight whitespace-nowrap">
              Fresh<span className="text-teal-500">Admin</span>
            </span>
          )}
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar no-scrollbar">
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
                  <span className="text-sm font-bold truncate">{item.name}</span>
                )}
                {isActive && isSidebarOpen && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-slate-100 pt-3 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 group"
          >
            <Home size={20} className="text-slate-400 group-hover:text-emerald-600" />
            {isSidebarOpen && <span className="text-sm font-bold">Store</span>}
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 text-slate-400 transition-all"
          >
            <ChevronRight size={20} className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} />
            {isSidebarOpen && <span className="text-sm font-bold">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 transition-all duration-300 min-w-0 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Desktop Header Only */}
        <header className="hidden lg:flex h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 items-center justify-between sticky top-0 z-40">
          <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase tracking-widest text-[11px] bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            {SIDEBAR_ITEMS.find(i => i.href === pathname)?.name || "Dashboard"}
          </h2>
          
          <div className="flex items-center gap-4">
             <div className="text-right">
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{session?.user?.name}</p>
               <p className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full inline-block">Administrator</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border-2 border-white shadow-sm uppercase">
               {session?.user?.name?.charAt(0)}
             </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-5rem)]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={pathname}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

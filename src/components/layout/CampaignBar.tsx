"use client";

import { 
  Zap, 
  Tag, 
  Sparkles, 
  Truck, 
  Gift, 
  ChevronRight,
  Clock,
  Flame
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const CAMPAIGNS = [
  { name: "Flash Sales", icon: Zap, href: "/offers", color: "text-amber-500", bg: "bg-amber-50", badge: "HOT" },
  { name: "Best Coupons", icon: Tag, href: "/offers", color: "text-teal-600", bg: "bg-teal-50" },
  { name: "New Arrivals", icon: Sparkles, href: "/", color: "text-purple-600", bg: "bg-purple-50" },
  { name: "Free Shipping", icon: Truck, href: "/", color: "text-blue-600", bg: "bg-blue-50" },
  { name: "Summer Fest", icon: Gift, href: "/offers", color: "text-rose-600", bg: "bg-rose-50", badge: "NEW" },
  { name: "Last Minute", icon: Clock, href: "/", color: "text-emerald-600", bg: "bg-emerald-50" },
  { name: "Trending", icon: Flame, href: "/", color: "text-orange-600", bg: "bg-orange-50" },
];

export default function CampaignBar() {
  return (
    <div className="bg-white border-b border-slate-100 sticky top-[var(--navbar-height)] z-40">
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center gap-6 py-2.5">
          {CAMPAIGNS.map((item, idx) => (
            <Link 
              key={idx} 
              href={item.href}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-50 transition-all flex-shrink-0 group relative overflow-hidden"
            >
              <div className={`w-8 h-8 ${item.bg} rounded-full flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform shadow-sm`}>
                <item.icon size={16} />
              </div>
              <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 whitespace-nowrap">
                {item.name}
              </span>
              {item.badge && (
                <span className={`px-1.5 py-0.5 ${item.name === 'Flash Sales' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'} text-[8px] font-black rounded-md uppercase tracking-tighter`}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          
          <div className="ml-auto hidden md:flex items-center gap-2 pl-6 border-l border-slate-100">
            <Link href="/" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-teal-600 transition-colors flex items-center gap-1">
              Shop All <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </div>
  );
}

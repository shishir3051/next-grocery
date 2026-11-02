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

// Deals and offers use the accent (amber) scale, everything else the brand (teal)
// scale, with success (emerald) for delivery perks. See docs/design/DESIGN_SYSTEM.md.
const CAMPAIGNS = [
  { name: "Flash sales", icon: Zap, href: "/offers", tone: "bg-accent-50 text-accent-700", badge: "Hot" },
  { name: "Best coupons", icon: Tag, href: "/offers", tone: "bg-accent-50 text-accent-700" },
  { name: "New arrivals", icon: Sparkles, href: "/", tone: "bg-brand-50 text-brand-700" },
  { name: "Free shipping", icon: Truck, href: "/", tone: "bg-success-50 text-success-700" },
  { name: "Summer fest", icon: Gift, href: "/offers", tone: "bg-accent-50 text-accent-700", badge: "New" },
  { name: "Last minute", icon: Clock, href: "/", tone: "bg-brand-50 text-brand-700" },
  { name: "Trending", icon: Flame, href: "/", tone: "bg-accent-50 text-accent-700" },
];

export default function CampaignBar() {
  return (
    <nav aria-label="Campaigns" className="bg-white border-b border-slate-200 sticky top-[var(--navbar-height)] z-40">
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center gap-2 py-2">
          {CAMPAIGNS.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex min-h-11 flex-shrink-0 items-center gap-2 rounded-full px-3 transition-colors hover:bg-slate-50"
            >
              <span aria-hidden="true" className={`flex h-8 w-8 items-center justify-center rounded-full ${item.tone}`}>
                <item.icon size={16} />
              </span>
              <span className="whitespace-nowrap text-sm font-medium text-slate-700">
                {item.name}
              </span>
              {item.badge && (
                <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-semibold text-accent-800">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          <div className="ml-auto hidden md:flex items-center pl-4 border-l border-slate-200">
            <Link href="/" className="flex min-h-11 items-center gap-1 whitespace-nowrap px-2 text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors">
              Shop all <ChevronRight size={16} aria-hidden="true" />
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
    </nav>
  );
}

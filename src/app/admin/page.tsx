"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Search,
  Inbox,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import Link from "next/link";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

// Recharts needs literal colour values, so these mirror the design tokens in globals.css.
const CHART_COLORS = {
  line: "#0f766e", // brand-600
  grid: "#e2e8f0", // slate-200
  tick: "#64748b", // slate-500 (readable on white)
  label: "#0f172a", // slate-900
};

// Order status → badge colours (tokens only). Unknown statuses fall back to slate.
const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: "bg-accent-50 text-accent-800",
  processing: "bg-slate-100 text-slate-700",
  shipped: "bg-brand-50 text-brand-700",
  delivered: "bg-success-50 text-success-700",
  cancelled: "bg-danger-50 text-danger-700",
};

/** Card wrapper used by every dashboard panel. */
const PANEL_CLASS = "bg-white rounded-xl border border-slate-200 shadow-sm p-4";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error("Fetch stats error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[40vh] flex items-center justify-center" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" aria-hidden="true" />
        <span className="sr-only">Loading dashboard…</span>
      </div>
    );
  }

  const cards = [
    {
      name: 'Total sales',
      value: `৳${stats?.metrics?.totalSales || 0}`,
      icon: TrendingUp,
      iconClass: 'bg-success-50 text-success-700',
      trend: stats?.metrics?.trends?.sales || "0%"
    },
    {
      name: 'Total orders',
      value: stats?.metrics?.totalOrders || 0,
      icon: Package,
      iconClass: 'bg-brand-50 text-brand-700',
      trend: stats?.metrics?.trends?.orders || "0%"
    },
    {
      name: 'Total users',
      value: stats?.metrics?.totalUsers || 0,
      icon: Users,
      iconClass: 'bg-slate-100 text-slate-700',
      trend: stats?.metrics?.trends?.users || "0%"
    },
    {
      name: 'Active inventory',
      value: stats?.metrics?.totalProducts || 0,
      icon: ShoppingBag,
      iconClass: 'bg-accent-50 text-accent-700',
      trend: stats?.metrics?.trends?.inventory || "Healthy"
    },
  ];

  const lowStockCount = stats?.lowStockProducts?.length || 0;

  return (
    <div className="space-y-4 pb-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => {
          const isUp = card.trend.includes('+');
          const isDown = card.trend.includes('-');
          return (
            <div key={card.name} className={PANEL_CLASS}>
              <div className="flex items-center justify-between mb-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", card.iconClass)}>
                  <card.icon size={16} aria-hidden="true" />
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    isUp ? "bg-success-50 text-success-700" : isDown ? "bg-danger-50 text-danger-700" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {isUp && <ArrowUpRight size={12} aria-hidden="true" />}
                  {isDown && <ArrowDownRight size={12} aria-hidden="true" />}
                  {card.trend}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-600">{card.name}</p>
              <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Sales Chart (no scale animation: Recharts measures its container on mount) */}
        <section className={cn(PANEL_CLASS, "lg:col-span-2")} aria-labelledby="sales-overview-title">
          <div className="flex items-center justify-between mb-4">
            <h2 id="sales-overview-title" className="text-base font-semibold text-slate-900">Sales overview</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              Last 7 days
            </span>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.salesHistory || []} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.line} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={CHART_COLORS.line} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_COLORS.grid} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: CHART_COLORS.tick, fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: CHART_COLORS.tick, fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: `1px solid ${CHART_COLORS.grid}`, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 13 }}
                  labelStyle={{ fontWeight: 600, color: CHART_COLORS.label }}
                />
                <Area type="monotone" dataKey="sales" stroke={CHART_COLORS.line} strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Latest Activity */}
        <div className="space-y-4">
          <section className={PANEL_CLASS} aria-labelledby="recent-orders-title">
            <h2 id="recent-orders-title" className="text-base font-semibold text-slate-900 mb-3">Recent orders</h2>
            {stats?.latestOrders?.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {stats.latestOrders.map((order: any) => (
                  <li key={order._id} className="flex items-center gap-3 py-2 first:pt-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{order.user?.name || 'Guest user'}</p>
                      <p className="text-xs text-slate-500">Order #{order._id.slice(-6).toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900 tabular-nums">৳{order.totalAmount}</p>
                      <span
                        className={cn(
                          "mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          ORDER_STATUS_STYLES[order.status] || "bg-slate-100 text-slate-700"
                        )}
                      >
                        {order.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <Inbox size={24} className="text-slate-400 mb-2" aria-hidden="true" />
                <p className="text-sm text-slate-500">No orders yet.</p>
              </div>
            )}
            <Button href="/admin/orders" variant="secondary" size="sm" fullWidth className="mt-3 h-9">
              View all orders
            </Button>
          </section>

          <section className={PANEL_CLASS} aria-labelledby="low-stock-title">
            <div className="flex items-center justify-between mb-3">
              <h2 id="low-stock-title" className="text-base font-semibold text-slate-900">Low stock</h2>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  lowStockCount > 0 ? "bg-danger-50 text-danger-700" : "bg-slate-100 text-slate-600"
                )}
              >
                {lowStockCount} {lowStockCount === 1 ? "alert" : "alerts"}
              </span>
            </div>
            {lowStockCount > 0 ? (
              <ul className="divide-y divide-slate-100">
                {stats.lowStockProducts.map((product: any) => (
                  <li key={product._id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                    <div className="relative w-10 h-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                       <img src={product.imageData || (product.images && product.images[0]) || 'https://via.placeholder.com/150'} alt="" className="object-cover w-full h-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                      <p className="text-xs font-medium text-danger-700">Only {product.stock} left</p>
                    </div>
                    <Link
                      href={`/admin/products?search=${encodeURIComponent(product.name)}`}
                      aria-label={`Find ${product.name} in products`}
                      className="flex h-8 w-8 pointer-coarse:h-10 pointer-coarse:w-10 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-brand-700 transition-colors"
                    >
                      <Search size={16} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 py-4 text-center">All inventory levels are healthy.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

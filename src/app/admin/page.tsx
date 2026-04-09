"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Package, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import Link from "next/link";

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
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  const cards = [
    { 
      name: 'Total Sales', 
      value: `৳${stats?.metrics?.totalSales || 0}`, 
      icon: TrendingUp, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50', 
      trend: stats?.metrics?.trends?.sales || "0%"
    },
    { 
      name: 'Total Orders', 
      value: stats?.metrics?.totalOrders || 0, 
      icon: Package, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50', 
      trend: stats?.metrics?.trends?.orders || "0%"
    },
    { 
      name: 'Total Users', 
      value: stats?.metrics?.totalUsers || 0, 
      icon: Users, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50', 
      trend: stats?.metrics?.trends?.users || "0%"
    },
    { 
      name: 'Active Inventory', 
      value: stats?.metrics?.totalProducts || 0, 
      icon: ShoppingBag, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50', 
      trend: stats?.metrics?.trends?.inventory || "Healthy"
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center`}>
                <card.icon size={24} />
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                card.trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 
                card.trend.includes('-') ? 'bg-rose-50 text-rose-600' : 
                'bg-slate-50 text-slate-500'
              }`}>
                {card.trend.includes('+') ? <ArrowUpRight size={12} /> : 
                 card.trend.includes('-') ? <ArrowDownRight size={12} /> : null}
                {card.trend}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{card.name}</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{card.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-800">Sales Overview</h3>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Last 7 Days
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.salesHistory || []}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'black', color: '#1e293b' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Latest Activity */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
          >
            <h3 className="text-xl font-bold text-slate-800 mb-6">Recent Orders</h3>
            <div className="space-y-6">
              {stats?.latestOrders?.map((order: any) => (
                <div key={order._id} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock size={18} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{order.user?.name || 'Guest User'}</p>
                    <p className="text-xs text-slate-400">Order #{order._id.slice(-6).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-800">৳{order.totalAmount}</p>
                    <p className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                      order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link 
              href="/admin/orders"
              className="w-full mt-8 py-4 bg-slate-50 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-all text-sm block text-center"
            >
              View All Transactions
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 rounded-3xl border border-rose-100 shadow-sm shadow-rose-200/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Low Stock</h3>
              <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-black">
                {stats?.lowStockProducts?.length || 0} Alerts
              </span>
            </div>
            <div className="space-y-6">
              {stats?.lowStockProducts?.length > 0 ? (
                stats.lowStockProducts.map((product: any) => (
                  <div key={product._id} className="flex items-center gap-4">
                    <div className="relative w-10 h-10 rounded-xl bg-slate-50 overflow-hidden border border-slate-100 flex-shrink-0">
                       <img src={product.imageData || (product.images && product.images[0]) || 'https://via.placeholder.com/150'} alt="" className="object-cover w-full h-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{product.name}</p>
                      <p className="text-xs text-rose-500 font-bold">Only {product.stock} units left</p>
                    </div>
                    <Link href={`/admin/products?search=${product.name}`} className="p-2 hover:bg-slate-50 text-slate-400 hover:text-teal-600 transition-all">
                       <ArrowUpRight size={18} />
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 py-4 text-center">All inventory levels are healthy.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

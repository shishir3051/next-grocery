"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Truck, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  CreditCard, 
  ChevronRight,
  Package,
  Calendar,
  Loader2,
  LogOut,
  Navigation,
  DollarSign
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";

export default function DeliveryDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session.user.role !== 'delivery' && session.user.role !== 'admin') {
      router.push("/");
    } else if (status === "authenticated") {
      fetchMyOrders();
    }
  }, [status, session, router]);

  const fetchMyOrders = async () => {
    try {
      const res = await fetch("/api/delivery/orders");
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Fetch delivery orders error:", error);
      toast.error("Could not load your tasks.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrder = async (orderId: string, updates: any) => {
    try {
      const res = await fetch("/api/delivery/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, ...updates }),
      });
      if (res.ok) {
        toast.success("Task updated!");
        fetchMyOrders();
      }
    } catch (error) {
      toast.error("Failed to update status.");
    }
  };

  if (isLoading || status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white px-6 py-8 border-b border-slate-100 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800">My Deliveries</h1>
            <p className="text-teal-600 font-bold text-xs uppercase tracking-widest mt-1">
              Active Specialist: {session?.user?.name}
            </p>
          </div>
          <button 
            onClick={() => signOut()}
            className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        {orders.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-teal-900/5">
              <Package size={40} className="text-slate-200" />
            </div>
            <div>
              <p className="text-slate-800 font-black">All Tasks Completed!</p>
              <p className="text-slate-400 text-sm font-bold">Waiting for new assignments...</p>
            </div>
            <button 
              onClick={fetchMyOrders}
              className="px-6 py-3 bg-white border border-slate-200 text-teal-600 font-black rounded-2xl text-xs uppercase tracking-widest hover:border-teal-300"
            >
              Refresh Tasks
            </button>
          </div>
        ) : (
          orders.map((order, idx) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                    <Truck size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {order.items.length} Items • ৳{order.totalAmount}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {order.paymentStatus}
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Customer</p>
                    <p className="text-sm font-bold text-slate-700">{order.user?.name}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Phone</p>
                    <a href={`tel:${order.shippingAddress?.phone}`} className="text-sm font-black text-teal-600 flex items-center justify-end gap-1">
                      <Phone size={14} /> {order.shippingAddress?.phone}
                    </a>
                  </div>
                </div>

                {/* Address */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Delivery Address</p>
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-bold text-slate-600 leading-relaxed">
                      {order.shippingAddress?.street}, {order.shippingAddress?.city}
                    </p>
                  </div>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shippingAddress?.street + ', ' + order.shippingAddress?.city)}`}
                    target="_blank"
                    className="mt-4 w-full py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-center gap-2 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all shadow-sm"
                  >
                    <Navigation size={12} /> Open in Navigation
                  </a>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  <button 
                    onClick={() => updateOrder(order._id, { status: 'delivered' })}
                    className="w-full py-4 bg-teal-600 text-white rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all hover:bg-teal-700"
                  >
                    <CheckCircle2 size={14} /> Finish Delivery
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Stats Filter/Footer Placeholder if needed */}
    </div>
  );
}

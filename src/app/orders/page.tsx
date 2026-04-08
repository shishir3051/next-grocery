"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Package, Clock, CheckCircle2, ChevronRight, Loader2, ShoppingBag, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const { items, clearCart } = useCart();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get('session') === 'success' && items.length > 0) {
      clearCart();
    }
  }, [searchParams, clearCart, items.length]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/orders");
    } else if (status === "authenticated") {
      fetchOrders();
    }
  }, [status, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Fetch orders error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Order History</h1>
            <p className="text-slate-500 mt-2">Track and manage your recent purchases</p>
          </div>
          <Link href="/" className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
            <ShoppingBag size={16} />
            Continue Shopping
          </Link>
        </header>

        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="text-slate-300 w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">No orders yet</h2>
            <p className="text-slate-500 mt-2 mb-8">Ready to order some fresh groceries?</p>
            <Link href="/" className="inline-flex items-center gap-2 px-8 py-3 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 transition-all">
              Browse Products
              <ChevronRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center">
                        <Package className="text-teal-600 w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order ID</p>
                        <p className="font-bold text-slate-800">#{order._id.slice(-8).toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div className="px-4 py-1.5 bg-slate-50 rounded-full text-xs font-bold text-slate-600 border border-slate-100 flex items-center gap-2">
                        <Clock size={14} />
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${
                        order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        order.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-teal-50 text-teal-600 border-teal-100'
                      }`}>
                        {order.status === 'delivered' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Items Section */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Items Summary</h3>
                      <div className="space-y-4">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-4">
                            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                              <Image src={item.imageData || item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=100'} alt={item.name} fill className="object-cover" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-bold text-slate-800">{item.name}</h4>
                              <p className="text-xs text-slate-500">{item.quantity} x ৳{item.price}</p>
                            </div>
                            <span className="text-sm font-bold text-slate-800">৳{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Section */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Delivery Details</h3>
                        <div className="flex gap-3">
                          <MapPin size={18} className="text-slate-300 mt-1" />
                          <div className="text-sm">
                            <p className="font-bold text-slate-800">{order.shippingAddress.street}</p>
                            <p className="text-slate-500">{order.shippingAddress.city}, {order.shippingAddress.zipCode}</p>
                            <p className="text-slate-500 mt-1">{order.shippingAddress.phone}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 text-left">Total Paid</p>
                          <p className="text-lg font-black text-teal-600">৳{order.totalAmount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Payment</p>
                          <div className="flex flex-col items-end gap-1">
                            <p className="text-sm font-bold text-slate-800">
                              {order.paymentProvider === 'sslcommerz' || order.paymentProvider === 'stripe' ? 'Online Payment' : 'Cash on Delivery'}
                            </p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {order.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

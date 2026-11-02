"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  Package,
  Loader2,
  LogOut,
  Navigation,
  RefreshCw
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export default function DeliveryDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Small cast to fix build errors if typed session isn't picked up
      const user = session?.user as any;
      if (user?.role !== 'delivery' && user?.role !== 'admin') {
        router.push("/");
      } else {
        fetchMyOrders();
      }
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
      <div className="h-screen flex items-center justify-center bg-slate-50" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" aria-hidden="true" />
        <span className="sr-only">Loading your deliveries…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">My deliveries</h1>
            <p className="text-sm text-slate-600 mt-0.5 truncate">
              Signed in as <span className="font-medium text-slate-800">{session?.user?.name}</span>
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => signOut()} className="h-10 flex-shrink-0">
            <LogOut size={16} aria-hidden="true" /> Sign out
          </Button>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-6 space-y-4 max-w-2xl mx-auto">
        {orders.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm">
              <Package size={28} className="text-slate-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">All caught up</p>
              <p className="text-sm text-slate-500 mt-1">New delivery assignments will appear here.</p>
            </div>
            <Button variant="secondary" onClick={fetchMyOrders}>
              <RefreshCw size={16} aria-hidden="true" /> Refresh tasks
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-600">
              {orders.length} active {orders.length === 1 ? "delivery" : "deliveries"}
            </p>
            {orders.map((order, idx) => (
              <motion.article
                key={order._id}
                // y-only entrance so cards are never invisible; skipped for reduced motion
                initial={prefersReducedMotion ? false : { y: 12 }}
                animate={{ y: 0 }}
                transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
                aria-labelledby={`delivery-${order._id}-title`}
              >
                <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-700 flex-shrink-0">
                      <Truck size={20} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h2 id={`delivery-${order._id}-title`} className="text-sm font-semibold text-slate-900">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </h2>
                      <p className="text-xs text-slate-500 tabular-nums">
                        {order.items.length} {order.items.length === 1 ? "item" : "items"} · ৳{order.totalAmount}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                      order.paymentStatus === 'paid'
                        ? 'bg-success-50 text-success-700 border-success-100'
                        : 'bg-accent-50 text-accent-800 border-accent-200'
                    )}
                  >
                    {order.paymentStatus}
                  </span>
                </div>

                <div className="p-4 sm:p-6 space-y-5">
                  {/* Customer Info */}
                  <dl className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 min-w-0">
                      <dt className="text-xs font-medium text-slate-500">Customer</dt>
                      <dd className="text-sm font-medium text-slate-900 truncate">{order.user?.name}</dd>
                    </div>
                    <div className="space-y-1 text-right min-w-0">
                      <dt className="text-xs font-medium text-slate-500">Phone</dt>
                      <dd>
                        <a
                          href={`tel:${order.shippingAddress?.phone}`}
                          className="inline-flex min-h-10 items-center justify-end gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline"
                        >
                          <Phone size={14} aria-hidden="true" /> {order.shippingAddress?.phone}
                        </a>
                      </dd>
                    </div>
                  </dl>

                  {/* Address */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-medium text-slate-500 mb-2">Delivery address</p>
                    <div className="flex items-start gap-2.5">
                      <MapPin size={18} className="text-brand-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <p className="text-sm text-slate-800 leading-relaxed">
                        {order.shippingAddress?.street}, {order.shippingAddress?.city}
                      </p>
                    </div>
                    <Button
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shippingAddress?.street + ', ' + order.shippingAddress?.city)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="secondary"
                      fullWidth
                      className="mt-3"
                    >
                      <Navigation size={16} aria-hidden="true" /> Open in Maps
                    </Button>
                  </div>

                  {/* Actions */}
                  <Button size="lg" fullWidth onClick={() => updateOrder(order._id, { status: 'delivered' })}>
                    <CheckCircle2 size={18} aria-hidden="true" /> Mark as delivered
                  </Button>
                </div>
              </motion.article>
            ))}
          </>
        )}
      </main>
    </div>
  );
}

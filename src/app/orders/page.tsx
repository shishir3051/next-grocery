"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Package, Clock, CheckCircle2, ChevronRight, Loader2, ShoppingBag, MapPin, Truck, XCircle, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Button from "@/components/ui/Button";

/**
 * One colour + icon + text label per order status (never colour alone).
 * pending = accent, processing = brand, shipped = slate, delivered = success, cancelled = danger.
 */
const ORDER_STATUS_STYLES: Record<string, { label: string; className: string; Icon: LucideIcon }> = {
  pending:    { label: "Pending",    className: "bg-accent-50 text-accent-800 border-accent-200",  Icon: Clock },
  processing: { label: "Processing", className: "bg-brand-50 text-brand-700 border-brand-200",     Icon: Package },
  shipped:    { label: "Shipped",    className: "bg-slate-100 text-slate-700 border-slate-300",    Icon: Truck },
  delivered:  { label: "Delivered",  className: "bg-success-50 text-success-700 border-success-100", Icon: CheckCircle2 },
  cancelled:  { label: "Cancelled",  className: "bg-danger-50 text-danger-700 border-danger-200",  Icon: XCircle },
};

function getStatusStyle(status: string) {
  return ORDER_STATUS_STYLES[status] ?? {
    label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    Icon: Clock,
  };
}

const OVERLINE_CLASS = "text-xs font-semibold text-slate-500 uppercase tracking-wide";

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const { items, clearCart } = useCart();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const reduceMotion = useReducedMotion();

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
      <div className="min-h-[60vh] flex items-center justify-center" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" aria-hidden="true" />
        <span className="sr-only">Loading your orders…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Order history</h1>
            <p className="text-sm text-slate-600 mt-1">Track and manage your recent purchases</p>
          </div>
          {/* Only shown alongside orders; the empty state has its own call to action */}
          {orders.length > 0 && (
            <Button href="/" variant="secondary" size="sm" className="self-start sm:self-auto h-10">
              <ShoppingBag size={16} aria-hidden="true" />
              Continue shopping
            </Button>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Package className="text-brand-600 w-8 h-8" aria-hidden="true" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900">No orders yet</h2>
            <p className="text-sm text-slate-600 mt-2 mb-6">Ready to order some fresh groceries?</p>
            <Button href="/">
              Browse products
              <ChevronRight size={18} aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <ul className="space-y-6">
            {orders.map((order) => {
              const statusStyle = getStatusStyle(order.status);
              const StatusIcon = statusStyle.Icon;
              const isPaid = order.paymentStatus === 'paid';

              return (
                <motion.li
                  key={order._id}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <article className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                          <Package className="text-brand-600 w-5 h-5" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Order ID</p>
                          <h2 className="font-semibold text-slate-900">#{order._id.slice(-8).toUpperCase()}</h2>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-slate-50 rounded-full text-xs font-medium text-slate-600 border border-slate-200 inline-flex items-center gap-1.5">
                          <Clock size={14} aria-hidden="true" />
                          <time dateTime={order.createdAt}>
                            {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </time>
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 ${statusStyle.className}`}>
                          <StatusIcon size={14} aria-hidden="true" />
                          <span className="sr-only">Status: </span>
                          {statusStyle.label}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                      {/* Items Section */}
                      <section>
                        <h3 className={`${OVERLINE_CLASS} mb-3`}>Items</h3>
                        <ul className="space-y-3">
                          {order.items.map((item: any, idx: number) => (
                            <li key={idx} className="flex items-center gap-3">
                              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0">
                                <Image src={item.imageData || item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=100'} alt={item.name} fill sizes="56px" className="object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-slate-800 truncate">{item.name}</h4>
                                <p className="text-xs text-slate-500">{item.quantity} × ৳{item.price}</p>
                              </div>
                              <span className="text-sm font-semibold text-slate-900">৳{item.price * item.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      </section>

                      {/* Delivery Section */}
                      <div className="space-y-5">
                        <section>
                          <h3 className={`${OVERLINE_CLASS} mb-3`}>Delivery details</h3>
                          <div className="flex gap-3">
                            <MapPin size={18} className="text-slate-400 mt-0.5 shrink-0" aria-hidden="true" />
                            <address className="text-sm not-italic">
                              <p className="font-semibold text-slate-800">{order.shippingAddress.street}</p>
                              <p className="text-slate-600">{order.shippingAddress.city}, {order.shippingAddress.zipCode}</p>
                              <p className="text-slate-600 mt-1">{order.shippingAddress.phone}</p>
                            </address>
                          </div>
                        </section>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Order total</p>
                            <p className="text-lg font-bold text-brand-700">৳{order.totalAmount}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500 mb-1">Payment</p>
                            <div className="flex flex-col items-end gap-1">
                              <p className="text-sm font-semibold text-slate-800">
                                {order.paymentProvider === 'sslcommerz' || order.paymentProvider === 'stripe' ? 'Online payment' : 'Cash on delivery'}
                              </p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                                isPaid ? 'bg-success-100 text-success-700' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {order.paymentStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

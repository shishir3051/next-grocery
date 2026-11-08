"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Eye,
  Truck,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Phone,
  CreditCard,
  Navigation,
  ShoppingBasket
} from "lucide-react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { TH_CLASS, PAGE_BUTTON_CLASS, INPUT_CLASS as FIELD_CLASS, BADGE_CLASS } from "@/components/admin/adminStyles";

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveryUsers, setDeliveryUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();
    fetchDeliveryUsers();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
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

  const fetchDeliveryUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) {
        setDeliveryUsers(data.users.filter((u: any) => u.role === 'delivery'));
      }
    } catch (error) {
      console.error("Fetch users error:", error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      if (res.ok) {
        if (selectedOrder?._id === orderId) {
            setSelectedOrder({ ...selectedOrder, status });
        }
        fetchOrders();
      }
    } catch (error) {
      console.error("Update status error:", error);
    }
  };

  const assignDelivery = async (orderId: string, assignedTo: string) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, assignedTo }),
      });
      if (res.ok) {
        if (selectedOrder?._id === orderId) {
            setSelectedOrder({ ...selectedOrder, assignedTo, status: 'shipped' });
        }
        fetchOrders();
      }
    } catch (error) {
      console.error("Assignment error:", error);
    }
  };

  const filteredOrders = orders.filter(o => 
    o._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Status badge colours (design tokens): amber = waiting, slate = in progress,
  // brand = on the way, green = done, red = cancelled.
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-accent-50 text-accent-800 border-accent-200';
      case 'processing': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'shipped': return 'bg-brand-50 text-brand-700 border-brand-200';
      case 'delivered': return 'bg-success-50 text-success-700 border-success-100';
      case 'cancelled': return 'bg-danger-50 text-danger-700 border-danger-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getPaymentColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid': return 'bg-success-50 text-success-700 border-success-100';
      case 'failed': return 'bg-danger-50 text-danger-700 border-danger-200';
      default: return 'bg-accent-50 text-accent-800 border-accent-200';
    }
  };

  // Range shown in the pagination footer ("Showing 1–10 of 42")
  const firstShown = filteredOrders.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const lastShown = Math.min(currentPage * itemsPerPage, filteredOrders.length);

  const assignedUserId = selectedOrder ? selectedOrder.assignedTo?._id || selectedOrder.assignedTo || "" : "";
  const assignedUserName = deliveryUsers.find(u => u._id === assignedUserId)?.name;

  return (
    <div className="space-y-4">
      {/* Header & toolbar */}
      <div className="flex flex-col gap-3">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Order management</h2>
          <p className="text-sm text-slate-500">Manage and track all customer orders from here.</p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <label htmlFor="order-search" className="sr-only">Search orders</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden="true" />
              <input
                id="order-search"
                type="search"
                placeholder="Search by order ID, customer name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(FIELD_CLASS, "pl-10")}
              />
            </div>
        </div>
      </div>

      {isLoading && orders.length === 0 ? (
        <div className="h-[40vh] flex items-center justify-center" role="status">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" aria-hidden="true" />
          <span className="sr-only">Loading orders…</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th scope="col" className={TH_CLASS}>Order</th>
                  <th scope="col" className={TH_CLASS}>Customer</th>
                  <th scope="col" className={TH_CLASS}>Items</th>
                  <th scope="col" className={TH_CLASS}>Status</th>
                  <th scope="col" className={TH_CLASS}>Payment</th>
                  <th scope="col" className={cn(TH_CLASS, "text-right")}>Total</th>
                  <th scope="col" className={cn(TH_CLASS, "text-right")}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {paginatedOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-500">
                      {searchTerm ? `No orders match "${searchTerm}".` : "No orders yet."}
                    </td>
                  </tr>
                )}
                {paginatedOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">#{order._id.slice(-8).toUpperCase()}</span>
                        <span className="text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-slate-900">{order.user?.name || 'Guest'}</span>
                        <span className="text-xs text-slate-500 truncate">{order.user?.email}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn(BADGE_CLASS, "capitalize", getStatusColor(order.status))}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                       <span className={cn(BADGE_CLASS, "capitalize", getPaymentColor(order.paymentStatus))}>
                         {order.paymentStatus}
                       </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="font-semibold text-slate-900 tabular-nums">৳{order.totalAmount}</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                        aria-label={`View order #${order._id.slice(-8).toUpperCase()}`}
                        className="h-9"
                      >
                        <Eye size={16} aria-hidden="true" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav
            aria-label="Orders pagination"
            className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3"
          >
            <p className="text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{firstShown}</span>–<span className="font-semibold text-slate-900">{lastShown}</span> of <span className="font-semibold text-slate-900">{filteredOrders.length}</span> orders
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                aria-label="Previous page"
                className={cn(PAGE_BUTTON_CLASS, "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed")}
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  type="button"
                  key={i+1}
                  onClick={() => setCurrentPage(i+1)}
                  aria-label={`Page ${i+1}`}
                  aria-current={currentPage === i+1 ? "page" : undefined}
                  className={cn(
                    PAGE_BUTTON_CLASS,
                    currentPage === i+1
                      ? "bg-brand-600 text-white"
                      : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {i+1}
                </button>
              )).slice(Math.max(0, currentPage-3), Math.min(totalPages, currentPage+2))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                aria-label="Next page"
                className={cn(PAGE_BUTTON_CLASS, "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed")}
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Order Details Drawer */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[60] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-slate-900/50" />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="order-drawer-title"
              className="relative w-full max-w-lg bg-white h-full shadow-xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 id="order-drawer-title" className="text-base font-semibold text-slate-900">Order details</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">#{selectedOrder._id.toUpperCase()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Close order details"
                  className="flex h-8 w-8 pointer-coarse:h-10 pointer-coarse:w-10 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Assignment Section */}
                <section className="rounded-xl border border-slate-200 p-3">
                  <label htmlFor="assign-delivery" className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Navigation size={16} className="text-slate-500" aria-hidden="true" /> Delivery partner
                  </label>
                  <select
                    id="assign-delivery"
                    className={cn(FIELD_CLASS, "cursor-pointer")}
                    value={assignedUserId}
                    onChange={(e) => assignDelivery(selectedOrder._id, e.target.value)}
                  >
                    <option value="">Unassigned (select a delivery partner)</option>
                    {deliveryUsers.map(user => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>
                  {selectedOrder.assignedTo && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-success-700" role="status">
                      <CheckCircle2 size={14} aria-hidden="true" />
                      Assigned to {assignedUserName || "a delivery partner"}
                    </p>
                  )}
                </section>

                <section className="rounded-xl border border-slate-200 p-3" aria-labelledby="order-status-title">
                  <h3 id="order-status-title" className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Truck size={16} className="text-slate-500" aria-hidden="true" /> Order status
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ORDER_STATUSES.map((s) => {
                      const isCurrent = selectedOrder.status === s;
                      return (
                        <button
                          type="button"
                          key={s}
                          onClick={() => updateOrderStatus(selectedOrder._id, s)}
                          aria-pressed={isCurrent}
                          className={cn(
                            "flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-medium capitalize transition-colors",
                            isCurrent
                              ? cn(getStatusColor(s), "ring-2 ring-brand-500 ring-offset-1")
                              : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          {isCurrent && <CheckCircle2 size={14} aria-hidden="true" />}
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="space-y-3" aria-labelledby="order-summary-title">
                  <h3 id="order-summary-title" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <ShoppingBasket size={16} className="text-slate-500" aria-hidden="true" /> Order summary
                  </h3>
                  <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {selectedOrder.items.map((item: any, idx: number) => (
                      <li key={idx} className="flex items-center gap-3 px-3 py-2">
                        <div className="relative w-10 h-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                          <Image src={item.imageData || item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=100'} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                          <p className="text-xs text-slate-500 tabular-nums">{item.quantity} × ৳{item.price}</p>
                        </div>
                        <span className="text-sm font-semibold text-slate-900 tabular-nums">৳{item.price * item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between items-center pt-1 text-base font-semibold text-slate-900">
                     <span>Total amount</span>
                     <span className="text-brand-700 tabular-nums">৳{selectedOrder.totalAmount}</span>
                  </div>
                </section>

                <div className="grid sm:grid-cols-2 gap-4">
                   <section className="space-y-2">
                     <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Truck size={16} className="text-slate-500" aria-hidden="true" /> Shipping</h3>
                     <div className="text-sm space-y-1">
                        <p className="font-medium text-slate-800">{selectedOrder.shippingAddress?.street}</p>
                        <p className="text-slate-600">{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.zipCode}</p>
                        <p className="text-slate-700 flex items-center gap-1.5 pt-1 font-medium"><Phone size={14} className="text-slate-500" aria-hidden="true" /> {selectedOrder.shippingAddress?.phone}</p>
                     </div>
                   </section>
                   <section className="space-y-2">
                     <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><CreditCard size={16} className="text-slate-500" aria-hidden="true" /> Payment</h3>
                     <div className="text-sm space-y-1.5">
                        <p className="font-medium text-slate-800">{selectedOrder.paymentMethod}</p>
                        <span className={cn(BADGE_CLASS, getPaymentColor(selectedOrder.paymentStatus))}>{selectedOrder.paymentStatus}</span>
                     </div>
                   </section>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-200">
                 <Button variant="secondary" size="sm" fullWidth onClick={() => setSelectedOrder(null)}>Close</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

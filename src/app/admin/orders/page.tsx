"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  Search, 
  Filter, 
  Eye, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Phone,
  Calendar,
  CreditCard,
  Check,
  X,
  User as UserIcon,
  Navigation
} from "lucide-react";
import Image from "next/image";

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'processing': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'shipped': return 'bg-teal-50 text-teal-600 border-teal-100';
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search orders by ID or customer..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
             <Filter size={16} /> Filter
           </button>
        </div>
      </div>

      {isLoading && orders.length === 0 ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Order Details</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Items</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Payment</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Total</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 italic-none">
                {paginatedOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">#{order._id.slice(-8).toUpperCase()}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{order.user?.name || 'Guest'}</span>
                        <span className="text-xs text-slate-400">{order.user?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-600">
                        {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                         order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                       }`}>
                         {order.paymentStatus}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-slate-800">৳{order.totalAmount}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 hover:bg-teal-50 hover:text-teal-600 text-slate-400 rounded-lg transition-all"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400">
              Showing <span className="text-slate-700">{(currentPage-1)*itemsPerPage + 1}</span> to <span className="text-slate-700">{Math.min(currentPage*itemsPerPage, filteredOrders.length)}</span> of <span className="text-slate-700">{filteredOrders.length}</span> orders
            </p>
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p-1))} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronLeft size={16} /></button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i+1} onClick={() => setCurrentPage(i+1)} className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === i+1 ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20' : 'bg-white border border-slate-200 text-slate-400 hover:border-teal-300 hover:text-teal-600'}`}>{i+1}</button>
                )).slice(Math.max(0, currentPage-3), Math.min(totalPages, currentPage+2))}
              </div>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Drawer */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[60] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-800">Order Details</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">#{selectedOrder._id.toUpperCase()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-all"><XCircle size={24} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Assignment Section */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm shadow-blue-500/5">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Navigation size={14} /> Assign Delivery Specialist
                  </h3>
                  <div className="space-y-3">
                    <select 
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer"
                      value={selectedOrder.assignedTo?._id || selectedOrder.assignedTo || ""}
                      onChange={(e) => assignDelivery(selectedOrder._id, e.target.value)}
                    >
                      <option value="">Unassigned (Select Personnel)</option>
                      {deliveryUsers.map(user => (
                        <option key={user._id} value={user._id}>{user.name}</option>
                      ))}
                    </select>
                    {selectedOrder.assignedTo && (
                      <p className="text-[10px] text-teal-600 font-black uppercase tracking-widest animate-pulse">
                         Successfully assigned to {deliveryUsers.find(u => u._id === (selectedOrder.assignedTo?._id || selectedOrder.assignedTo))?.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Truck size={14} /> Order Fulfillment
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                      <button key={s} onClick={() => updateOrderStatus(selectedOrder._id, s)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${selectedOrder.status === s ? getStatusColor(s).replace('bg-', 'bg-').replace('border-', 'border-') + ' ring-2 ring-teal-500' : 'bg-white text-slate-500 border-slate-200 hover:border-teal-300'}`}>{s}</button>
                    ))}
                  </div>
                </div>


                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Order Summary</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100">
                        <div className="relative w-12 h-12 rounded-xl bg-slate-50 overflow-hidden border border-slate-100">
                          <Image src={item.imageData || item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=100'} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800">{item.name}</p>
                          <p className="text-xs text-slate-400">{item.quantity} x ৳{item.price}</p>
                        </div>
                        <span className="text-sm font-black text-slate-800">৳{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 flex justify-between items-center text-lg font-black text-slate-800">
                     <span>Total Amount</span>
                     <span className="text-teal-600">৳{selectedOrder.totalAmount}</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Truck size={14} /> Shipping</h3>
                     <div className="text-sm space-y-1">
                        <p className="font-bold text-slate-800">{selectedOrder.shippingAddress?.street}</p>
                        <p className="text-slate-500">{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.zipCode}</p>
                        <p className="text-slate-500 flex items-center gap-1 mt-1 font-bold"><Phone size={12} /> {selectedOrder.shippingAddress?.phone}</p>
                     </div>
                   </div>
                   <div className="space-y-3">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CreditCard size={14} /> Payment</h3>
                     <div className="text-sm">
                        <p className="font-bold text-slate-800">{selectedOrder.paymentMethod}</p>
                        <span className={`text-[10px] font-black uppercase inline-block mt-1 ${selectedOrder.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>{selectedOrder.paymentStatus}</span>
                     </div>
                   </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                 <button onClick={() => setSelectedOrder(null)} className="w-full py-4 bg-teal-600 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 hover:bg-teal-700 transition-all text-sm">Close Details</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

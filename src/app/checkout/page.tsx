"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Truck, Tag, FileText, ChevronLeft,
  CheckCircle2, ShoppingBag, Loader2, Plus, Minus, Wallet
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const { items, totalPrice, clearCart, updateQuantity, removeItem } = useCart();
  const router = useRouter();

  const [address, setAddress] = useState({
    street: "",
    city: "",
    zipCode: "",
    phone: ""
  });
  const [coupon, setCoupon] = useState("");
  const [note, setNote] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');

  // Coupon Logic State
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [isCouponsModalOpen, setIsCouponsModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/public/coupons")
      .then(res => res.json())
      .then(data => { if (data.success) setAvailableCoupons(data.coupons); })
      .catch(console.error);
  }, []);

  const handleApplySelectedCoupon = async (code: string) => {
    setCoupon(code);
    setIsCouponsModalOpen(false);
    // Trigger validation with the new code
    setIsValidatingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code, subtotal: totalPrice })
      });
      const data = await res.json();
      if (data.isValid) {
        setDiscountAmount(data.discountAmount);
        setAppliedCoupon(data.code);
        setCouponError("");
      } else {
        setCouponError(data.message || "Invalid coupon");
        setDiscountAmount(0);
        setAppliedCoupon(null);
      }
    } catch (e) {
      setCouponError("Failed to validate coupon");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetch("/api/user/profile")
        .then(res => res.json())
        .then(data => { if (data.user) setWalletBalance(data.user.walletBalance || 0); })
        .catch(console.error);
    }
  }, [status]);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => { if (data.settings) setStoreSettings(data.settings); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (storeSettings) {
      setShippingFee(totalPrice >= storeSettings.minFreeDelivery ? 0 : storeSettings.deliveryFee);
    }
  }, [totalPrice, storeSettings]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/checkout");
  }, [status, router]);

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon, subtotal: totalPrice })
      });
      const data = await res.json();
      if (data.isValid) {
        setDiscountAmount(data.discountAmount);
        setAppliedCoupon(data.code);
        setCouponError("");
      } else {
        setCouponError(data.message || "Invalid coupon");
        setDiscountAmount(0);
        setAppliedCoupon(null);
      }
    } catch (e) {
      setCouponError("Failed to validate coupon");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const subTotalWithShipping = totalPrice + shippingFee - discountAmount;
  const maxWalletApplicable = Math.min(walletBalance, subTotalWithShipping);
  const walletDeduction = useWallet ? maxWalletApplicable : 0;
  const finalTotal = Math.max(0, subTotalWithShipping - walletDeduction);

  const isAddressValid = address.street && address.city && address.phone;

  const initPayment = async () => {
    setIsPlacingOrder(true);
    try {
      const res = await fetch('/api/payments/ssl-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image, imageData: i.imageData })),
          totalAmount: finalTotal,
          shippingAddress: address,
          useWallet,
          deliveryNote: note,
          couponCode: appliedCoupon,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else if (res.status === 503) {
        setModalConfig({ isOpen: true, title: "Store Maintenance", message: "The store is in maintenance mode. Please try again later.", type: "warning" });
        setIsPlacingOrder(false);
      } else {
        alert(data.gatewayResponse?.failedreason || data.error || "Payment initialization failed.");
        setIsPlacingOrder(false);
      }
    } catch (e) { console.error(e); setIsPlacingOrder(false); }
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'card') { await initPayment(); return; }
    setIsPlacingOrder(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image, imageData: i.imageData })),
          totalAmount: finalTotal,
          shippingAddress: address,
          paymentProvider: 'cod',
          useWallet,
          deliveryNote: note,
          couponCode: appliedCoupon,
        }),
      });
      if (res.ok) { setOrderSuccess(true); clearCart(); }
      else if (res.status === 503) {
        setModalConfig({ isOpen: true, title: "Maintenance Notice", message: "Store entered maintenance mode. Please try again later.", type: "warning" });
      } else {
        const data = await res.json();
        alert(data.error || "Failed to place order");
      }
    } catch (error) { console.error("Order error:", error); }
    finally { setIsPlacingOrder(false); }
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-[#CC0000]" />
      </div>
    );
  }

  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-50">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-5">
          <ShoppingBag className="text-[#CC0000] w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Your cart is empty</h1>
        <p className="text-slate-500 mt-2 mb-6">Add some fresh groceries to start your order.</p>
        <Link href="/" className="px-8 py-3 bg-[#CC0000] text-white font-bold rounded-full hover:bg-[#A30000] transition-all shadow-lg">
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full text-center bg-white rounded-2xl p-10 shadow-lg">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-50 rounded-full mb-6">
            <CheckCircle2 className="text-green-500 w-12 h-12" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Order Placed Successfully!</h1>
          <p className="text-slate-500 mt-3 mb-8">Thank you! Your fresh groceries are being prepared for delivery.</p>
          <div className="space-y-3">
            <Link href="/orders" className="block w-full py-4 bg-[#CC0000] text-white font-bold rounded-full hover:bg-[#A30000] transition-all shadow">Track Order</Link>
            <Link href="/" className="block w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-full hover:bg-slate-200 transition-all">Back to Home</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-800 pb-28">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-slate-500 hover:text-[#CC0000] transition-colors">
            <ChevronLeft size={22} />
          </Link>
          <h1 className="text-lg font-black text-slate-800">Checkout</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-5">

          {/* ─── LEFT: Cart Items ─── */}
          <div className="w-full lg:w-[340px] space-y-4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 text-sm">Your Items ({items.length})</h2>
                <Link href="/" className="text-[#CC0000] text-xs font-bold hover:underline flex items-center gap-1">
                  <Plus size={12} /> Add more
                </Link>
              </div>
              <div className="divide-y divide-slate-50 max-h-[480px] overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                      <Image
                        src={item.imageData || item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=100'}
                        alt={item.name} fill className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">৳{item.price} each</p>
                      <p className="text-sm font-bold text-[#CC0000] mt-0.5">৳{item.price * item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => item.quantity > 1 ? updateQuantity(item.id, -1) : removeItem(item.id)}
                        className="w-7 h-7 rounded-full bg-slate-100 hover:bg-red-50 hover:text-[#CC0000] flex items-center justify-center transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-full bg-[#CC0000] text-white hover:bg-[#A30000] flex items-center justify-center transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Info Card */}
            <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Truck className="text-green-600" size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Estimated Delivery</p>
                <p className="text-sm font-bold text-slate-800">Within 60 minutes</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-slate-500">Delivery Fee</p>
                <p className={`text-sm font-bold ${shippingFee === 0 ? 'text-green-600' : 'text-slate-800'}`}>
                  {shippingFee === 0 ? 'FREE' : `৳${shippingFee}`}
                </p>
              </div>
            </div>

            {/* Coupon & Notes */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <Tag size={16} className="text-[#CC0000]" />
                <h2 className="font-bold text-slate-800 text-sm">Coupon & Notes</h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Enter promo code"
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] transition-all"
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon || !coupon.trim()}
                    className="px-5 py-3 bg-[#CC0000] text-white text-sm font-bold rounded-lg hover:bg-[#A30000] transition-colors disabled:opacity-50"
                  >
                    {isValidatingCoupon ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
                  </button>
                </div>
                {availableCoupons.length > 0 && !appliedCoupon && (
                  <button 
                    onClick={() => setIsCouponsModalOpen(true)}
                    className="text-[10px] font-black text-[#CC0000] uppercase tracking-widest flex items-center gap-1 hover:underline"
                  >
                    <Plus size={10} /> View available coupons
                  </button>
                )}
                {couponError && <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">{couponError}</p>}
                {appliedCoupon && <p className="text-[10px] text-green-600 font-bold ml-1 mt-1">Coupon "{appliedCoupon}" applied!</p>}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={14} className="text-slate-400" />
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Delivery Note</label>
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 500))}
                    placeholder="Any special instructions..."
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─── CENTER: Address + Details ─── */}
          <div className="flex-1 space-y-4">

            {/* Delivery Address */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <MapPin size={16} className="text-[#CC0000]" />
                <h2 className="font-bold text-slate-800 text-sm">Delivery Address</h2>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Street Address *</label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    placeholder="House 12, Road 4, Banani"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">City *</label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="Dhaka"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    placeholder="017xxxxxxxx"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Zip Code</label>
                  <input
                    type="text"
                    value={address.zipCode}
                    onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                    placeholder="1213"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 text-sm">Payment Method</h2>
              </div>
              <div className="p-4 space-y-3">
                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-[#CC0000] bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-[#CC0000]" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">Cash on Delivery</p>
                    <p className="text-xs text-slate-500">Pay when your order arrives</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-[#CC0000] bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="accent-[#CC0000]" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">Online Payment</p>
                    <p className="text-xs text-slate-500">bKash, Nagad, Rocket, Card</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 text-sm">Order Summary</h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="font-semibold">৳{totalPrice}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Delivery Fee</span>
                  <span className={`font-semibold ${shippingFee === 0 ? 'text-green-600' : ''}`}>
                    {shippingFee === 0 ? 'FREE' : `৳${shippingFee}`}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Coupon Discount {appliedCoupon && `(${appliedCoupon})`}</span>
                    <span className="font-semibold">-৳{discountAmount}</span>
                  </div>
                )}
                {walletBalance > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={useWallet}
                          onChange={(e) => setUseWallet(e.target.checked)}
                          className="accent-[#CC0000] w-4 h-4"
                        />
                        <Wallet size={14} className="text-[#CC0000]" />
                        <span className="font-bold">Use Wallet (৳{walletBalance})</span>
                      </div>
                      {useWallet && <span className="text-green-600 text-sm font-bold">-৳{walletDeduction}</span>}
                    </label>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t-2 border-slate-100">
                  <span className="font-black text-base text-slate-800">Total</span>
                  <span className="font-black text-xl text-[#CC0000]">৳{finalTotal}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── STICKY BOTTOM BAR ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs text-slate-500">Total Amount</p>
            <p className="text-xl font-black text-[#CC0000]">৳{finalTotal}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {!isAddressValid && (
              <p className="text-[10px] md:text-xs text-red-500 font-medium">Please fill in required address fields</p>
            )}
            <button
              onClick={handlePlaceOrder}
              disabled={!isAddressValid || isPlacingOrder}
              className="px-8 md:px-10 py-3 md:py-4 bg-[#CC0000] text-white font-black rounded-full text-sm md:text-base shadow-lg hover:bg-[#A30000] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isPlacingOrder ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              ) : (
                `Confirm Order`
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Available Coupons Modal */}
      <AnimatePresence>
        {isCouponsModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCouponsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Available Coupons</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select one to apply</p>
                </div>
                <button onClick={() => setIsCouponsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                  <Minus size={20} className="rotate-45" />
                </button>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                {availableCoupons.map((c) => {
                  const isApplicable = totalPrice >= c.minOrderAmount;
                  return (
                    <div 
                      key={c._id} 
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        isApplicable ? 'border-slate-100 bg-white hover:border-teal-200 group' : 'border-slate-50 bg-slate-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="px-3 py-1 bg-teal-50 text-teal-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-teal-100 mb-2">
                           {c.code}
                        </div>
                        {isApplicable && (
                          <button 
                            onClick={() => handleApplySelectedCoupon(c.code)}
                            className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:underline"
                          >
                            Apply Now
                          </button>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-700">
                        Get {c.discountType === 'percentage' ? `${c.discountValue}%` : `৳${c.discountValue}`} Off
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">
                        {isApplicable 
                          ? `Valid on orders above ৳${c.minOrderAmount}` 
                          : `Add ৳${c.minOrderAmount - totalPrice} more to use this coupon`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={() => setModalConfig({ ...modalConfig, isOpen: false })}
        confirmText="Understood"
        cancelText=""
      />
    </div>
  );
}

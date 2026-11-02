"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Truck, Tag, ChevronLeft, CheckCircle2, ShoppingBag, Loader2,
  Plus, Minus, Wallet, Trash2, Lock, Info, X, Ticket, Banknote, CreditCard
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

// Shared form styles (design-system inputs, see docs/design/DESIGN_SYSTEM.md)
const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-slate-700";
const INPUT_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

// Payment option cards
const PAYMENT_OPTION_CLASS = "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors";
const PAYMENT_SELECTED_CLASS = "border-brand-600 bg-brand-50 ring-1 ring-brand-600";
const PAYMENT_IDLE_CLASS = "border-slate-200 hover:border-slate-300 hover:bg-slate-50";

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

  // Missing State for Wallet, Settings, and Modal
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [shippingFee, setShippingFee] = useState(0);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info" as "info" | "warning" | "danger"
  });

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

    // Autofill address from userLocation
    const savedLoc = localStorage.getItem('userLocation');
    if (savedLoc) {
      const parts = savedLoc.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        setAddress(prev => ({
          ...prev,
          street: parts[0],
          city: parts[parts.length - 1]
        }));
      } else {
        setAddress(prev => ({
          ...prev,
          city: savedLoc
        }));
      }
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

  // Escape closes the "Available coupons" modal
  useEffect(() => {
    if (!isCouponsModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsCouponsModalOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCouponsModalOpen]);

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
  // The wallet is only supported for Cash on Delivery (the card gateway is charged the full total).
  const walletDeduction = useWallet && paymentMethod === 'cod' ? maxWalletApplicable : 0;
  const finalTotal = Math.max(0, subTotalWithShipping - walletDeduction);

  const isAddressValid = address.street && address.city && address.phone;

  // Which required fields are still empty (drives the helper text under "Confirm order").
  const missingFields = [
    !address.street && "street address",
    !address.city && "city",
    !address.phone && "phone number",
  ].filter(Boolean) as string[];

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
        alert(data.error || "Payment initialization failed.");
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50" role="status">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600" aria-hidden="true" />
        <span className="sr-only">Loading checkout</span>
      </div>
    );
  }

  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-50">
        <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-5">
          <ShoppingBag className="text-brand-600 w-10 h-10" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your cart is empty</h1>
        <p className="text-slate-600 mt-2 mb-6">Add some fresh groceries to start your order.</p>
        <Button href="/" size="lg">Continue shopping</Button>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center bg-white rounded-2xl p-8 sm:p-10 shadow-xl"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-success-50 rounded-full mb-6">
            <CheckCircle2 className="text-success-600 w-10 h-10" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Order placed successfully</h1>
          <p className="text-slate-600 mt-3 mb-8">Thank you! Your fresh groceries are being prepared for delivery.</p>
          <div className="space-y-3">
            <Button href="/orders" size="lg" fullWidth>Track order</Button>
            <Button href="/" variant="secondary" size="lg" fullWidth>Back to home</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // The "Confirm order" button + helper text. Rendered twice: inside the sticky summary
  // on desktop and in the fixed bottom bar on mobile (only one is visible at a time).
  const renderPlaceOrder = (placement: "summary" | "bar") => {
    const helperId = `place-order-helper-${placement}`;
    return (
      <div className={placement === "bar" ? "flex min-w-0 flex-col items-end gap-1.5" : "space-y-2"}>
        <Button
          size="lg"
          fullWidth={placement === "summary"}
          onClick={handlePlaceOrder}
          disabled={!isAddressValid || isPlacingOrder}
          loading={isPlacingOrder}
          aria-describedby={!isAddressValid ? helperId : undefined}
          // A neutral grey disabled state reads as "not ready yet", unlike a faded brand colour
          className={cn(!isAddressValid && "disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-100 disabled:shadow-none")}
        >
          {isPlacingOrder ? "Processing..." : "Confirm order"}
        </Button>
        {!isAddressValid && (
          <p
            id={helperId}
            className={cn("flex items-start gap-1.5 text-xs text-slate-600", placement === "bar" && "text-right")}
          >
            <Info size={14} className="mt-px flex-shrink-0 text-slate-400" aria-hidden="true" />
            Add your {missingFields.join(", ")} to place the order.
          </p>
        )}
      </div>
    );
  };

  return (
    // Bottom padding on mobile keeps the fixed "Confirm order" bar from covering the summary.
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-40 lg:pb-12">
      {/* Page header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2">
          <Link
            href="/"
            aria-label="Back to shop"
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft size={22} />
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Checkout</h1>
          <p className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
            <Lock size={14} aria-hidden="true" />
            Secure checkout
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">

          {/* ─── MAIN: address, payment, items ─── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Delivery address */}
            <section aria-labelledby="address-heading" className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <MapPin size={18} className="text-brand-600" aria-hidden="true" />
                <h2 id="address-heading" className="font-semibold text-slate-900">Delivery address</h2>
              </div>
              <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="checkout-street" className={LABEL_CLASS}>
                    Street address <span className="text-danger-600" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="checkout-street"
                    type="text"
                    autoComplete="street-address"
                    aria-required="true"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    placeholder="House 12, Road 4, Banani"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="checkout-city" className={LABEL_CLASS}>
                    City <span className="text-danger-600" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="checkout-city"
                    type="text"
                    autoComplete="address-level2"
                    aria-required="true"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="Dhaka"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="checkout-phone" className={LABEL_CLASS}>
                    Phone number <span className="text-danger-600" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    aria-required="true"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    placeholder="017xxxxxxxx"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="checkout-zip" className={LABEL_CLASS}>
                    Zip code <span className="font-normal text-slate-500">(optional)</span>
                  </label>
                  <input
                    id="checkout-zip"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    value={address.zipCode}
                    onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                    placeholder="1213"
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="checkout-note" className={LABEL_CLASS}>
                    Delivery note <span className="font-normal text-slate-500">(optional)</span>
                  </label>
                  <textarea
                    id="checkout-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 500))}
                    maxLength={500}
                    placeholder="Any special instructions, e.g. a landmark or gate code"
                    rows={2}
                    aria-describedby="checkout-note-count"
                    className={cn(INPUT_CLASS, "resize-none")}
                  />
                  <p id="checkout-note-count" className="mt-1 text-right text-xs text-slate-500">{note.length}/500</p>
                </div>
              </div>
            </section>

            {/* Payment method */}
            <section aria-labelledby="payment-heading" className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Wallet size={18} className="text-brand-600" aria-hidden="true" />
                <h2 id="payment-heading" className="font-semibold text-slate-900">Payment method</h2>
              </div>
              <fieldset className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <legend className="sr-only">Choose a payment method</legend>
                <label className={cn(PAYMENT_OPTION_CLASS, paymentMethod === 'cod' ? PAYMENT_SELECTED_CLASS : PAYMENT_IDLE_CLASS)}>
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="h-4 w-4 accent-brand-600" />
                  <Banknote size={20} className="text-slate-500" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">Cash on delivery</span>
                    <span className="block text-xs text-slate-500">Pay when your order arrives</span>
                  </span>
                </label>
                <label className={cn(PAYMENT_OPTION_CLASS, paymentMethod === 'card' ? PAYMENT_SELECTED_CLASS : PAYMENT_IDLE_CLASS)}>
                  <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="h-4 w-4 accent-brand-600" />
                  <CreditCard size={20} className="text-slate-500" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">Online payment</span>
                    <span className="block text-xs text-slate-500">bKash, Nagad, Rocket, Card</span>
                  </span>
                </label>
              </fieldset>
            </section>

            {/* Items */}
            <section aria-labelledby="items-heading" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
                <h2 id="items-heading" className="font-semibold text-slate-900">Your items ({items.length})</h2>
                <Link href="/" className="-mr-2 inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                  <Plus size={16} aria-hidden="true" /> Add more
                </Link>
              </div>
              <ul className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
                {items.map((item) => (
                  <li key={item.id} className="px-4 sm:px-6 py-3 flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                      <Image
                        src={item.imageData || item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=100'}
                        alt={item.name} fill className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">৳{item.price} each</p>
                      <p className="text-sm font-bold text-brand-700 mt-0.5">৳{item.price * item.quantity}</p>
                    </div>
                    {/* Quantity stepper. At quantity 1 the minus button removes the item, so it shows a bin icon. */}
                    <div className="flex items-center rounded-lg border border-slate-200 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => item.quantity > 1 ? updateQuantity(item.id, -1) : removeItem(item.id)}
                        aria-label={item.quantity > 1 ? `Decrease quantity of ${item.name}` : `Remove ${item.name}`}
                        className={cn(
                          "w-10 h-10 rounded-l-lg flex items-center justify-center transition-colors",
                          item.quantity > 1 ? "text-slate-600 hover:bg-slate-100" : "text-slate-500 hover:bg-danger-50 hover:text-danger-600"
                        )}
                      >
                        {item.quantity > 1 ? <Minus size={14} /> : <Trash2 size={14} />}
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-slate-900" aria-live="polite">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        aria-label={`Increase quantity of ${item.name}`}
                        className="w-10 h-10 rounded-r-lg text-brand-700 hover:bg-brand-50 flex items-center justify-center transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* ─── ASIDE: order summary (sticky on desktop) ─── */}
          <aside aria-labelledby="summary-heading" className="w-full lg:w-[380px] lg:flex-shrink-0 lg:sticky lg:top-20">
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
                <h2 id="summary-heading" className="font-semibold text-slate-900">Order summary</h2>
              </div>

              <div className="p-4 sm:p-6 space-y-5">
                {/* Delivery estimate */}
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 border border-slate-200">
                    <Truck className="text-brand-600" size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Estimated delivery</p>
                    <p className="text-sm font-semibold text-slate-900">Within 60 minutes</p>
                  </div>
                </div>

                {/* Coupon */}
                <div>
                  <label htmlFor="checkout-coupon" className={cn(LABEL_CLASS, "flex items-center gap-1.5")}>
                    <Tag size={14} className="text-slate-400" aria-hidden="true" />
                    Promo code
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="checkout-coupon"
                      type="text"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      placeholder="Enter promo code"
                      aria-invalid={couponError ? true : undefined}
                      aria-describedby={couponError ? "checkout-coupon-error" : undefined}
                      className={cn(INPUT_CLASS, "flex-1 min-w-0", couponError && "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20")}
                    />
                    <Button
                      variant="secondary"
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !coupon.trim()}
                      loading={isValidatingCoupon}
                    >
                      Apply
                    </Button>
                  </div>
                  {availableCoupons.length > 0 && !appliedCoupon && (
                    <button
                      type="button"
                      onClick={() => setIsCouponsModalOpen(true)}
                      className="mt-1 inline-flex min-h-10 items-center gap-1.5 rounded-lg text-sm font-semibold text-brand-700 hover:underline"
                    >
                      <Ticket size={16} aria-hidden="true" /> View available coupons
                    </button>
                  )}
                  {couponError && (
                    <p id="checkout-coupon-error" role="alert" className="mt-1.5 text-sm text-danger-600">{couponError}</p>
                  )}
                  {appliedCoupon && (
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-success-100 bg-success-50 pl-3 pr-1 text-sm text-success-700">
                      <span className="flex min-w-0 items-center gap-1.5 font-medium">
                        <CheckCircle2 size={16} className="flex-shrink-0" aria-hidden="true" />
                        <span className="truncate">Coupon &quot;{appliedCoupon}&quot; applied</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => { setAppliedCoupon(null); setDiscountAmount(0); setCouponError(""); }}
                        aria-label={`Remove coupon ${appliedCoupon}`}
                        className="min-h-10 flex-shrink-0 rounded-lg px-3 font-semibold text-danger-600 hover:bg-danger-50"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Price breakdown */}
                <dl className="space-y-3 border-t border-slate-100 pt-4 text-sm">
                  <div className="flex justify-between gap-3 text-slate-600">
                    <dt>Subtotal ({items.length} items)</dt>
                    <dd className="font-semibold text-slate-900">৳{totalPrice}</dd>
                  </div>
                  <div className="flex justify-between gap-3 text-slate-600">
                    <dt>Delivery fee</dt>
                    <dd className={cn("font-semibold", shippingFee === 0 ? "text-success-600" : "text-slate-900")}>
                      {shippingFee === 0 ? 'Free' : `৳${shippingFee}`}
                    </dd>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between gap-3 text-success-700">
                      <dt>Coupon discount {appliedCoupon && `(${appliedCoupon})`}</dt>
                      <dd className="font-semibold">-৳{discountAmount}</dd>
                    </div>
                  )}
                </dl>

                {/* Wallet (only offered for Cash on Delivery) */}
                {walletBalance > 0 && paymentMethod === 'cod' && (
                  <label htmlFor="checkout-wallet" className="flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                    <span className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        id="checkout-wallet"
                        type="checkbox"
                        checked={useWallet}
                        onChange={(e) => setUseWallet(e.target.checked)}
                        className="h-4 w-4 accent-brand-600"
                      />
                      <Wallet size={16} className="text-brand-600" aria-hidden="true" />
                      <span className="font-semibold">Use wallet balance (৳{walletBalance})</span>
                    </span>
                    {useWallet && <span className="text-sm font-semibold text-success-700">-৳{walletDeduction}</span>}
                  </label>
                )}

                <div className="flex items-baseline justify-between border-t border-slate-200 pt-4">
                  <span className="text-base font-semibold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-brand-700">৳{finalTotal}</span>
                </div>

                {/* Desktop: the confirm button lives in the sticky summary */}
                <div className="hidden lg:block">{renderPlaceOrder("summary")}</div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* ─── MOBILE BOTTOM BAR (hidden on desktop, where the summary is sticky) ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-xl lg:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex-shrink-0">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-xl font-bold text-brand-700">৳{finalTotal}</p>
          </div>
          {renderPlaceOrder("bar")}
        </div>
      </div>

      {/* Available coupons modal */}
      <AnimatePresence>
        {isCouponsModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCouponsModalOpen(false)}
              aria-hidden="true"
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="coupons-modal-title"
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative shadow-xl"
            >
              <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
                <div>
                  <h3 id="coupons-modal-title" className="text-lg font-semibold text-slate-900">Available coupons</h3>
                  <p className="text-sm text-slate-500">Select one to apply</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCouponsModalOpen(false)}
                  aria-label="Close coupons"
                  className="-mr-2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>
              <ul className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                {availableCoupons.map((c) => {
                  const isApplicable = totalPrice >= c.minOrderAmount;
                  return (
                    <li
                      key={c._id}
                      className={cn(
                        "p-4 rounded-xl border transition-colors",
                        isApplicable ? "border-slate-200 bg-white hover:border-brand-300" : "border-slate-200 bg-slate-50"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-lg border border-dashed border-accent-300 bg-accent-50 px-2.5 py-1 font-mono text-sm font-semibold tracking-wide text-accent-800">
                          {c.code}
                        </span>
                        {isApplicable && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleApplySelectedCoupon(c.code)}
                            aria-label={`Apply coupon ${c.code}`}
                            className="h-10"
                          >
                            Apply
                          </Button>
                        )}
                      </div>
                      <p className={cn("mt-3 text-sm font-semibold", isApplicable ? "text-slate-900" : "text-slate-600")}>
                        Get {c.discountType === 'percentage' ? `${c.discountValue}%` : `৳${c.discountValue}`} off
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {isApplicable
                          ? `Valid on orders above ৳${c.minOrderAmount}`
                          : `Add ৳${c.minOrderAmount - totalPrice} more to use this coupon`}
                      </p>
                    </li>
                  );
                })}
              </ul>
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

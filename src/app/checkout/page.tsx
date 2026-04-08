"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Truck, CreditCard, ChevronRight, CheckCircle2, ShoppingBag, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [address, setAddress] = useState({
    street: "",
    city: "",
    zipCode: "",
    phone: ""
  });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');
  
  // Modal State for maintenance or errors
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: 'warning'
  });
  
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [shippingFee, setShippingFee] = useState(0);
  
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch("/api/user/profile")
        .then(res => res.json())
        .then(data => {
          if (data.user) setWalletBalance(data.user.walletBalance || 0);
        })
        .catch(console.error);
    }
  }, [status]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (res.ok) {
        setStoreSettings(data.settings);
      }
    } catch (e) {
      console.error("Settings fetch error:", e);
    }
  };

  useEffect(() => {
    if (storeSettings) {
      const fee = totalPrice >= storeSettings.minFreeDelivery ? 0 : storeSettings.deliveryFee;
      setShippingFee(fee);
    }
  }, [totalPrice, storeSettings]);

  const subTotalWithShipping = totalPrice + shippingFee;
  const maxWalletApplicable = Math.min(walletBalance, subTotalWithShipping);
  const walletDeduction = useWallet ? maxWalletApplicable : 0;
  const finalTotal = Math.max(0, subTotalWithShipping - walletDeduction);


  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <ShoppingBag className="text-slate-300 w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Your cart is empty</h1>
        <p className="text-slate-500 mt-2 mb-6">Add some fresh groceries to start your order.</p>
        <Link href="/" className="px-8 py-3 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 transition-all">
          Go Shopping
        </Link>
      </div>
    );
  }



  // SSLCommerz Payment Initiation
  const initPayment = async () => {
    setIsPlacingOrder(true);
    try {
      const res = await fetch('/api/payments/ssl-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            productId: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
            imageData: i.imageData,
          })),
          totalAmount: finalTotal,
          shippingAddress: address,
          useWallet,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url; // Redirect to SSLCommerz
      } else if (res.status === 503) {
        setModalConfig({
          isOpen: true,
          title: "Store Maintenance",
          message: "We're sorry! The store just went into maintenance mode and cannot process new orders right now. Please try again later.",
          type: "warning"
        });
        setIsPlacingOrder(false);
      } else {
        console.error('Failed to initialize SSLCommerz:', data);
        const errorMsg = data.gatewayResponse?.failedreason || data.error || "Payment initialization failed.";
        alert(`Error: ${errorMsg}`);
        setIsPlacingOrder(false);
      }
    } catch (e) {
      console.error(e);
      setIsPlacingOrder(false);
    }
  };

  const handleProceed = async () => {
    if (paymentMethod === 'card') {
      await initPayment();
    } else {
      setStep(2);
    }
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(i => ({
            productId: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
            imageData: i.imageData
          })),
          totalAmount: finalTotal,
          shippingAddress: address,
          paymentProvider: 'cod',
          useWallet,
        }),
      });

      if (res.ok) {
        setOrderSuccess(true);
        clearCart();
      } else if (res.status === 503) {
        setModalConfig({
          isOpen: true,
          title: "Maintenance Notice",
          message: "The store just entered maintenance mode. Your order cannot be placed at this time. We apologize for the inconvenience.",
          type: "warning"
        });
      } else {
        const data = await res.json();
        alert(data.error || "Failed to place order");
      }
    } catch (error) {
      console.error("Order error:", error);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-teal-50 rounded-full mb-6">
            <CheckCircle2 className="text-teal-600 w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 leading-tight">Order Placed Successfully!</h1>
          <p className="text-slate-500 mt-4 mb-8 leading-relaxed">
            Thank you for shopping with FreshBasket. Your fresh groceries are being prepared for delivery.
          </p>
          <div className="space-y-3">
            <Link href="/orders" className="block w-full py-4 bg-teal-600 text-white font-bold rounded-2xl shadow-lg hover:bg-teal-700 transition-all">
              Track Order
            </Link>
            <Link href="/" className="block w-full py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all">
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Checkout Area */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/" className="text-teal-600 font-bold text-sm hover:underline">← Shopping</Link>
              <h1 className="text-2xl md:text-3xl font-black">Checkout</h1>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-4 mb-8">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step >= i ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {i}
                  </div>
                  <span className={`text-sm font-bold ${step >= i ? 'text-teal-600' : 'text-slate-400'}`}>
                    {i === 1 ? 'Delivery' : 'Confirmation'}
                  </span>
                  {i === 1 && <ChevronRight className="text-slate-300 w-4 h-4 mx-2" />}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                      <MapPin className="text-teal-600 w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold">Delivery Address</h2>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Street Address</label>
                      <input
                        type="text"
                        value={address.street}
                        onChange={(e) => setAddress({...address, street: e.target.value})}
                        placeholder="House 12, Road 4, Banani"
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">City</label>
                      <input
                        type="text"
                        value={address.city}
                        onChange={(e) => setAddress({...address, city: e.target.value})}
                        placeholder="Dhaka"
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Zip Code</label>
                      <input
                        type="text"
                        value={address.zipCode}
                        onChange={(e) => setAddress({...address, zipCode: e.target.value})}
                        placeholder="1213"
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                      <input
                        type="text"
                        value={address.phone}
                        onChange={(e) => setAddress({...address, phone: e.target.value})}
                        placeholder="017xxxxxxxx"
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selection */}
            <div className="mt-6">
              <p className="text-sm font-bold text-slate-700 mb-2">Payment Method</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="form-radio h-4 w-4 text-teal-600"
                  />
                  Cash on Delivery
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="form-radio h-4 w-4 text-teal-600"
                  />
                  Online Payment (bKash, Nagad, Card)
                </label>
              </div>
            </div>
            <button
              disabled={!address.street || !address.city || !address.phone}
              onClick={handleProceed}
              className="w-full py-4 bg-teal-600 text-white font-black rounded-2xl shadow-lg hover:bg-teal-700 transition-all disabled:opacity-50"
            >
              Continue to Confirmation
            </button>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-8"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                      <CreditCard className="text-teal-600 w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold">Review & Payment</h2>
                  </div>

                  {/* Order Summary in Review */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Order Items ({items.length})</h3>
                    <div className="divide-y divide-slate-50">
                      {items.map((item) => (
                        <div key={item.id} className="py-3 flex items-center gap-4">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-50">
                            <Image src={item.imageData || item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=100'} alt={item.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold">{item.name}</h4>
                            <p className="text-xs text-slate-400">{item.quantity} x ৳{item.price}</p>
                          </div>
                          <span className="font-bold text-sm">৳{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <Truck className="text-teal-600 w-6 h-6" />
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Delivery Method</p>
                        <p className="text-sm font-bold">Standard Delivery (within 60 mins)</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-teal-50 rounded-2xl border border-teal-100">
                    <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1">Payment Method</p>
                    <p className="text-sm font-bold text-teal-700">
                      {paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment (bKash, Nagad, Card)'}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                    >
                      Back
                    </button>
                    {paymentMethod === 'cod' ? (
                      <button
                        disabled={isPlacingOrder}
                        onClick={handlePlaceOrder}
                        className="flex-[2] py-4 bg-teal-600 text-white font-black rounded-2xl shadow-xl hover:bg-teal-700 transition-all flex items-center justify-center"
                      >
                        {isPlacingOrder ? <Loader2 className="w-6 h-6 animate-spin" /> : `Place Order (৳${finalTotal})`}
                      </button>
                    ) : (
                      <div className="flex-[2]" /> // CardPaymentForm has its own button
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Summary */}
          <div className="w-full lg:w-[380px] space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold mb-6">Order Totals</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">৳{totalPrice}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Delivery Fee</span>
                  <span className={`font-semibold ${shippingFee === 0 ? 'text-teal-600' : 'text-slate-800'}`}>
                    {shippingFee === 0 ? 'FREE' : `৳${shippingFee}`}
                  </span>
                </div>
                {walletBalance > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <label className="flex items-center justify-between text-sm font-bold text-slate-700 cursor-pointer group">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                          checked={useWallet}
                          onChange={(e) => setUseWallet(e.target.checked)}
                        />
                        Apply Wallet Balance (৳{walletBalance})
                      </div>
                      {useWallet && <span className="text-emerald-600">-৳{walletDeduction}</span>}
                    </label>
                  </div>
                )}
                <div className="h-px bg-slate-50" />
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-bold">Total Amount</span>
                  <span className="text-2xl font-black text-teal-600">৳{finalTotal}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalConfig({...modalConfig, isOpen: false})}
        onConfirm={() => setModalConfig({...modalConfig, isOpen: false})}
        confirmText="Understood"
        cancelText=""
      />
    </div>
  );
}



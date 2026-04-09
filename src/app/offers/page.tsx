"use client";

import { useState, useEffect } from "react";
import { 
  Tag, 
  Copy, 
  CheckCircle2, 
  Clock, 
  ShoppingBag, 
  ArrowRight,
  Loader2,
  Gift,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";

interface Coupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiryDate: string;
  isActive: boolean;
}

export default function OffersPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/public/coupons");
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons);
      }
    } catch (error) {
      console.error("Fetch coupons error:", error);
      toast.error("Could not load latest offers.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Code ${code} copied!`, {
      icon: '🎁',
      style: {
        borderRadius: '1rem',
        background: '#333',
        color: '#fff',
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-teal-600 transition-all">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Latest Offers</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-teal-50 rounded-2xl mb-4"
          >
            <Gift className="text-teal-600 w-8 h-8" />
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-3">Fresh Deals Just For You</h2>
          <p className="text-slate-500 max-w-md mx-auto text-sm md:text-base font-medium">Use these promo codes at checkout to save big on your fresh groceries today!</p>
        </header>

        {coupons.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Tag className="text-slate-300 w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No active offers right now</h3>
            <p className="text-slate-500 mt-1 mb-6">Check back soon for exciting new discounts!</p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20">
              Go Shopping <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {coupons.map((coupon, idx) => (
              <motion.div
                key={coupon._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative bg-white rounded-3xl border border-slate-200 overflow-hidden hover:border-teal-300 hover:shadow-xl transition-all duration-500"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Left Section: Value */}
                  <div className={`w-full md:w-56 p-8 flex flex-col items-center justify-center text-center transition-colors duration-500 ${
                    coupon.discountType === 'percentage' ? 'bg-teal-500 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    <div className="relative">
                      <Tag className="w-12 h-12 opacity-20 absolute -top-4 -left-4 rotate-12" />
                      <p className="text-5xl font-black leading-none">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `৳${coupon.discountValue}`}
                      </p>
                      <p className="text-xs font-black uppercase tracking-widest mt-2 opacity-80">OFF DISCOUNT</p>
                    </div>
                  </div>

                  {/* Right Section: Details */}
                  <div className="flex-1 p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-teal-500" /> Min. Order ৳{coupon.minOrderAmount}
                        </span>
                        <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 flex items-center gap-1.5">
                          <Clock size={12} className="text-amber-500" /> Exp: {new Date(coupon.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-800 mb-2 truncate group-hover:text-teal-600 transition-colors">
                        Special {coupon.discountType === 'percentage' ? 'Percentage' : 'Flat'} Saver
                      </h3>
                      {coupon.maxDiscount && (
                        <p className="text-sm text-slate-500 font-medium italic">Save up to ৳{coupon.maxDiscount} on your total bill</p>
                      )}
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-full sm:flex-1 relative group/btn">
                        <input 
                          readOnly 
                          value={coupon.code}
                          className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl px-6 py-4 text-center font-black text-slate-800 tracking-[0.2em] outline-none group-hover/btn:border-teal-400 group-hover/btn:bg-white transition-all"
                        />
                        <div className="absolute inset-y-1 right-1">
                          <button 
                            onClick={() => copyToClipboard(coupon.code)}
                            className="h-full px-6 bg-slate-800 text-white font-bold rounded-[0.8rem] hover:bg-teal-600 transition-all flex items-center gap-2"
                          >
                            <Copy size={16} />
                            <span className="hidden sm:inline">Copy</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aesthetic Scalloped Edge Effect */}
                <div className="hidden md:block absolute left-52 top-0 bottom-0 w-8 pointer-events-none">
                  <div className="h-full flex flex-col justify-around py-2">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="w-4 h-4 bg-slate-50 rounded-full -ml-2 border border-slate-100 shadow-inner" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Bottom Tips */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <ShoppingBag size={20} />
              </div>
              <h4 className="font-bold text-slate-800">How to use?</h4>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Simply copy your favorite promo code and paste it in the "Coupon" field during checkout to enjoy your savings!
            </p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <Clock size={20} />
              </div>
              <h4 className="font-bold text-slate-800">Limited Time Only</h4>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Most of our deals are time-sensitive. Be sure to use them before they expire to get the best value on your groceries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Tag, Copy, CheckCircle2, Clock, ShoppingBag, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";

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
  const reduceMotion = useReducedMotion();

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
    toast.success(`Code ${code} copied!`, { icon: '🎁' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Page title */}
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-700">Offers</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Fresh deals just for you</h1>
          <p className="mt-3 text-base text-slate-600">
            Use these promo codes at checkout to save on your fresh groceries today.
          </p>
        </header>

        <div className="mt-8 max-w-4xl sm:mt-10">
          {isLoading ? (
            // Skeleton coupons keep the layout stable while loading
            <div className="grid gap-4" aria-busy="true" aria-label="Loading offers">
              {[0, 1].map(i => (
                <div key={i} className="skeleton h-40 rounded-2xl!" />
              ))}
            </div>
          ) : coupons.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
                <Tag className="text-slate-400" size={28} aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">No active offers right now</h2>
              <p className="mt-1 text-sm text-slate-500">Check back soon for new discounts.</p>
              <Button href="/" className="mt-6">
                Go shopping <ArrowRight size={18} aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {coupons.map((coupon, idx) => {
                const isPercentage = coupon.discountType === 'percentage';
                return (
                  <motion.article
                    key={coupon._id}
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx, 6) * 0.06 }}
                    className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md md:flex-row"
                  >
                    {/* Value: deals use the accent (amber) palette */}
                    <div className="flex flex-col items-center justify-center bg-accent-50 p-6 text-center md:w-52 md:border-r-2 md:border-dashed md:border-accent-200">
                      <p className="text-4xl font-bold leading-none text-accent-800">
                        {isPercentage ? `${coupon.discountValue}%` : `৳${coupon.discountValue}`}
                      </p>
                      <p className="mt-2 text-sm font-medium text-accent-800">off your order</p>
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between gap-5 p-5 sm:p-6">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          {isPercentage ? 'Percentage' : 'Flat'} saver
                        </h2>
                        {coupon.maxDiscount ? (
                          <p className="mt-1 text-sm text-slate-600">Save up to ৳{coupon.maxDiscount} on your total bill</p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            <CheckCircle2 size={14} className="text-brand-600" aria-hidden="true" /> Min. order ৳{coupon.minOrderAmount}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            <Clock size={14} className="text-accent-600" aria-hidden="true" /> Expires {new Date(coupon.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <code
                          className="flex h-11 flex-1 select-all items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 font-mono text-base font-semibold tracking-widest text-slate-900"
                        >
                          {coupon.code}
                        </code>
                        <Button
                          onClick={() => copyToClipboard(coupon.code)}
                          aria-label={`Copy code ${coupon.code}`}
                        >
                          <Copy size={16} aria-hidden="true" /> Copy code
                        </Button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}

          {/* Tips */}
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <ShoppingBag size={20} aria-hidden="true" />
                </div>
                <h2 className="text-base font-semibold text-slate-900">How to use a code</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Copy your favourite promo code and paste it into the &quot;Coupon&quot; field during checkout to enjoy your savings.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-700">
                  <Clock size={20} aria-hidden="true" />
                </div>
                <h2 className="text-base font-semibold text-slate-900">Limited time only</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Most of our deals are time-sensitive. Use them before they expire to get the best value on your groceries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

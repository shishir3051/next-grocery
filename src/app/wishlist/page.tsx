"use client";

import { useWishlist } from "@/context/WishlistContext";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import Button from "@/components/ui/Button";

export default function WishlistPage() {
  const { wishlist, clearWishlist } = useWishlist();
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Page title row (a plain div: the global Navbar already provides the banner <header>) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              My wishlist
              <span className="inline-flex min-w-8 h-8 px-2.5 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700 border border-brand-100">
                {wishlist.length}
                <span className="sr-only">&nbsp;{wishlist.length === 1 ? "item" : "items"}</span>
              </span>
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Save your favourite fresh products here and add them to your cart later.
            </p>
          </div>

          {wishlist.length > 0 && (
            <Button
              onClick={clearWishlist}
              variant="secondary"
              size="sm"
              className="self-start sm:self-auto h-10 text-danger-700 border-danger-200 hover:bg-danger-50 hover:border-danger-200"
            >
              <Trash2 size={16} aria-hidden="true" />
              Clear all
            </Button>
          )}
        </div>

        {/* Wishlist Grid */}
        <AnimatePresence mode="popLayout">
          {wishlist.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
            >
              {wishlist.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm"
            >
              <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Heart className="text-brand-600 w-8 h-8" aria-hidden="true" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Your wishlist is empty</h2>
              <p className="text-sm text-slate-600 max-w-sm mx-auto mt-2 mb-6">
                Browse our fresh groceries and tap the heart on items you love to save them here.
              </p>
              <Button href="/">
                <ShoppingBag size={18} aria-hidden="true" />
                Start shopping
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

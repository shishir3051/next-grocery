"use client";

import { useWishlist } from "@/context/WishlistContext";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";

export default function WishlistPage() {
  const { wishlist, clearWishlist } = useWishlist();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 text-teal-600 font-bold text-sm hover:underline">
               <ArrowLeft size={16} /> Continue Shopping
            </Link>
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight flex items-center gap-4">
              My <span className="text-teal-600">Wishlist</span>
              <div className="px-4 py-1.5 bg-white rounded-2xl text-lg font-black text-slate-400 border border-slate-100 shadow-sm">
                {wishlist.length}
              </div>
            </h1>
            <p className="text-slate-500 font-medium">
              Save your favorite fresh products here and add them to your cart later.
            </p>
          </div>

          {wishlist.length > 0 && (
            <button 
              onClick={clearWishlist}
              className="px-6 py-3 bg-white text-red-500 font-bold rounded-xl border border-red-50 hover:bg-red-50 transition-all text-sm"
            >
              Clear All
            </button>
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[3rem] p-12 md:p-20 text-center space-y-8 border border-slate-100 shadow-sm"
            >
              <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mx-auto">
                <Heart className="text-teal-600 w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800 italic">Your wishlist is empty</h2>
                <p className="text-slate-500 font-medium max-w-sm mx-auto">
                  Browse our fresh groceries and heart the items you love to save them here!
                </p>
              </div>
              <div className="pt-4">
                <Link href="/" className="inline-flex items-center gap-3 px-10 py-5 bg-teal-600 text-white font-black rounded-2xl shadow-xl hover:bg-teal-700 transition-all uppercase tracking-widest text-sm">
                  <ShoppingBag size={20} />
                  Start Shopping
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

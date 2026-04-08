'use client';
import { useCart } from '@/context/CartContext';
import { X, Trash2, ShoppingCart, Zap, ChevronRight, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const FREE_DELIVERY_THRESHOLD = 500; // ৳500

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, subtotal, isCartOpen, setIsCartOpen } = useCart();

  const progress = Math.min((subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_DELIVERY_THRESHOLD - subtotal, 0);

  return (
    <>
      {/* Backdrop */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-40 bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: 'var(--cart-width)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-teal-600" />
            <h2 className="text-lg font-bold text-slate-800">My Cart</h2>
            {items.length > 0 && (
              <span className="bg-teal-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Delivery Progress */}
        <div className="px-5 py-3 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100">
          {remaining > 0 ? (
            <p className="text-xs font-medium text-teal-700 mb-2 flex items-center gap-1">
              <Zap size={13} className="text-amber-500" />
              Add <span className="font-bold text-teal-800 mx-0.5">৳{remaining}</span> more for free delivery
            </p>
          ) : (
            <p className="text-xs font-bold text-teal-700 mb-2 flex items-center gap-1">
              🎉 You've unlocked <span className="text-emerald-600 ml-0.5">Free Delivery!</span>
            </p>
          )}
          <div className="w-full h-2 bg-teal-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <ShoppingCart size={56} className="mb-4 opacity-30" />
              <p className="font-semibold text-slate-500">Your cart is empty</p>
              <p className="text-sm mt-1">Add items to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  {item.image && (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-50 flex-shrink-0">
                      <Image src={item.imageData || item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=100'} alt={item.name} fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.unit}</p>
                    <p className="text-sm font-bold text-teal-600 mt-1">৳{(item.price * item.quantity).toFixed(0)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-300 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                    <div className="flex items-center gap-1 bg-teal-50 rounded-lg px-1 py-0.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-md bg-white text-teal-600 font-bold text-sm hover:bg-teal-100 transition-all flex items-center justify-center shadow-sm"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-teal-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-md bg-teal-500 text-white font-bold text-sm hover:bg-teal-600 transition-all flex items-center justify-center shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        {items.length > 0 && (
          <div className="p-4 bg-white border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between font-black text-slate-800">
              <span className="text-lg">Total Amount</span>
              <span className="text-2xl text-teal-600">৳{subtotal.toFixed(0)}</span>
            </div>

            <Link
              href="/checkout"
              onClick={() => setIsCartOpen(false)}
              className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 transition-all flex items-center justify-center gap-2 group"
            >
              Proceed to Checkout
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <p className="text-[10px] text-center text-slate-400 font-medium uppercase tracking-widest">
              Safe & Secure Checkout
            </p>
          </div>
        )}
      </div>
    </>
  );
}

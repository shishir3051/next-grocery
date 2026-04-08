'use client';
import { useCart } from '@/context/CartContext';
import { Plus, Minus, ShoppingCart, Heart } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWishlist } from '@/context/WishlistContext';

interface Product {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  unit: string;
  images: string[];
  image?: string;
  imageData?: string;
  isOrganic?: boolean;
  isHalal?: boolean;
  stock: number;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, updateQuantity, items } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isAdding, setIsAdding] = useState(false);
  
  const isWishlisted = isInWishlist(product._id);


  const cartItem = items.find(i => i.id === product._id);
  const qty = cartItem?.quantity ?? 0;

  const discountAmount = Number(product.discountPrice) || 0;
  const finalPrice = product.price - discountAmount;
  const imageUrl = product.imageData || (product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400');

  const handleAdd = () => {
    setIsAdding(true);
    addItem({ ...product, price: finalPrice });
    setTimeout(() => setIsAdding(false), 300);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-900/5 transition-all duration-300 flex flex-col h-full"
    >
      {/* Image */}
      <div className="relative pt-[75%] bg-slate-50 overflow-hidden">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, 200px"
        />

        {/* Discount Sticker Badge */}
        {discountAmount > 0 && (
          <div className="absolute top-0 left-2 z-10 scale-110 origin-top">
            <div className="bg-red-600 text-white px-1.5 pt-1.5 pb-2 text-[10px] font-black flex flex-col items-center leading-none shadow-lg sticker-jagged animate-bounce-subtle">
              <span className="text-[8px] opacity-90 mb-0.5">৳</span>
              <span className="text-sm">{discountAmount}</span>
              <span className="text-[7px] mt-0.5">OFF</span>
            </div>
          </div>
        )}

        <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-20">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isWishlisted ? 'bg-red-50 text-red-500' : 'bg-white/80 text-slate-400 hover:text-red-500 backdrop-blur-sm'
            }`}
          >
            <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
          </button>
          {product.isOrganic && (
            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-bold rounded-full shadow-sm backdrop-blur-sm">
              🌿 Organic
            </span>
          )}
          {product.isHalal && (
            <span className="px-2 py-0.5 bg-teal-600 text-white text-[8px] font-bold rounded-full shadow-sm backdrop-blur-sm">
              ☪ Halal
            </span>
          )}
          {product.stock <= 0 && (
            <span className="px-2 py-0.5 bg-slate-800 text-white text-[8px] font-bold rounded-full shadow-sm">
              🚫 Out
            </span>
          )}
        </div>

        {/* Quick Add Overlay - shows on hover when qty=0 and in stock */}
        {qty === 0 && product.stock > 0 && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
            <button
              onClick={handleAdd}
              className={`add-btn px-4 py-1.5 bg-teal-500 text-white text-xs font-bold rounded-full shadow-lg hover:bg-teal-600 flex items-center gap-1 ${
                isAdding ? 'scale-90' : 'scale-100'
              }`}
            >
              <Plus size={12} />
              Add
            </button>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-slate-400 mb-1">{product.unit}</p>
        <h3 className="text-sm font-semibold text-slate-800 leading-snug mb-2 line-clamp-2 flex-1">
          {product.name}
        </h3>

        {/* Price & Cart Control */}
        <div className="flex items-center justify-between mt-auto">
          <div>
            {discountAmount > 0 ? (
              <div className="flex flex-col leading-tight">
                <span className="text-base font-black text-teal-600">৳{finalPrice}</span>
                <span className="text-[10px] text-slate-400 line-through">৳{product.price}</span>
              </div>
            ) : (
              <span className="text-base font-black text-teal-600">৳{product.price}</span>
            )}
          </div>

          {/* Quantity Pill */}
          {product.stock <= 0 ? (
             <div className="px-3 py-1.5 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-full">
               Unavailable
             </div>
          ) : qty === 0 ? (
            <button
              onClick={handleAdd}
              className="add-btn w-8 h-8 rounded-full bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={16} />
            </button>
          ) : (
            <div className="add-btn flex items-center gap-1 bg-teal-500 rounded-full px-1 py-1 shadow-md">
              <button
                onClick={() => updateQuantity(product._id, -1)}
                className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all"
              >
                <Minus size={12} />
              </button>
              <span className="text-white text-xs font-bold w-5 text-center">{qty}</span>
              <button
                disabled={qty >= product.stock}
                onClick={() => updateQuantity(product._id, 1)}
                className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>
        {product.stock > 0 && product.stock < 10 && (
           <p className="text-[10px] font-bold text-red-500 mt-2 italic text-right animate-pulse">
             🔥 Only {product.stock} items left!
           </p>
        )}
      </div>
    </motion.div>
  );
}

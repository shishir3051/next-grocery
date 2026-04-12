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
      initial={{ opacity: 0, y: 20, rotateX: 5 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(13, 148, 136, 0.1)" }}
      viewport={{ once: false, amount: 0.1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ transformPerspective: 1000 }}
      className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-teal-200 transition-colors duration-200 flex flex-col h-full z-0 hover:z-10"
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
          <div className="absolute top-2 left-2 z-10 origin-top">
            <div className="bg-red-600 text-white px-2 py-1 rounded-md text-[10px] font-bold flex flex-col items-center leading-none shadow-sm backdrop-blur-sm">
              <span className="text-[8px] opacity-90 mb-0.5">SAVE</span>
              <span className="text-sm font-black">৳{discountAmount}</span>
            </div>
          </div>
        )}

        <div className="absolute top-2 right-2 flex items-start gap-1.5 z-20">
          <div className="flex flex-col items-end gap-1 pt-1">
            {product.isOrganic && (
              <span className="px-2 py-0.5 bg-emerald-500/95 text-white text-[9px] font-semibold rounded-full shadow-sm backdrop-blur-sm">
                🌿 Organic
              </span>
            )}
            {product.isHalal && (
              <span className="px-2 py-0.5 bg-teal-600/95 text-white text-[9px] font-semibold rounded-full shadow-sm backdrop-blur-sm">
                ☪ Halal
              </span>
            )}
            {product.stock <= 0 && (
              <span className="px-2 py-0.5 bg-slate-800/95 text-white text-[9px] font-semibold rounded-full shadow-sm border backdrop-blur-sm">
                🚫 Out of Stock
              </span>
            )}
          </div>

          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm backdrop-blur-md border ${
              isWishlisted ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white/90 border-white/40 text-slate-400 hover:text-red-500 hover:bg-white'
            }`}
          >
            <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} className={isWishlisted ? 'scale-110 transition-transform' : ''} />
          </button>
        </div>

        {/* Quick Add Overlay */}
        {qty === 0 && product.stock > 0 && (
          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAdd}
              className={`px-4 py-2 bg-white/95 text-teal-700 text-xs font-bold rounded-full shadow-md hover:bg-teal-600 hover:text-white transition-colors duration-200 flex items-center gap-1.5 border border-slate-100 ${
                isAdding ? 'scale-95 bg-teal-600 text-white' : ''
              }`}
            >
              <Plus size={14} strokeWidth={2.5} />
              Quick Add
            </motion.button>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-3 flex flex-col flex-1 bg-white relative">
        <p className="text-xs text-slate-500 mb-1">{product.unit}</p>
        <h3 className="text-sm font-semibold text-slate-800 leading-snug mb-3 line-clamp-2 flex-1 group-hover:text-teal-700 transition-colors">
          {product.name}
        </h3>

        {/* Price & Cart Control */}
        <div className="flex items-center justify-between mt-auto">
          <div>
            {discountAmount > 0 ? (
              <div className="flex flex-col leading-tight">
                <span className="text-base font-bold text-teal-700 tracking-tight">৳{finalPrice}</span>
                <span className="text-xs text-slate-400 line-through">৳{product.price}</span>
              </div>
            ) : (
              <span className="text-base font-bold text-teal-700 tracking-tight">৳{product.price}</span>
            )}
          </div>

          {/* Quantity Pill */}
          {product.stock <= 0 ? (
             <div className="px-3 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded-full">
               Unavailable
             </div>
          ) : qty === 0 ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleAdd}
              className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 hover:bg-teal-600 text-teal-600 hover:text-white flex items-center justify-center transition-colors duration-200"
            >
              <Plus size={16} strokeWidth={2} />
            </motion.button>
          ) : (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 bg-teal-600 rounded-full p-1"
            >
              <button
                onClick={() => updateQuantity(product._id, -1)}
                className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
              >
                <Minus size={14} strokeWidth={2} />
              </button>
              <span className="text-white text-xs font-semibold w-5 text-center">{qty}</span>
              <button
                disabled={qty >= product.stock}
                onClick={() => updateQuantity(product._id, 1)}
                className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:hover:bg-white/20"
              >
                <Plus size={14} strokeWidth={2} />
              </button>
            </motion.div>
          )}
        </div>
        {product.stock > 0 && product.stock < 10 && (
           <p className="text-[10px] font-medium text-red-500 mt-2 flex items-center justify-end gap-1">
             ⚡ {product.stock} left
           </p>
        )}
      </div>
    </motion.div>
  );
}

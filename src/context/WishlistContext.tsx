"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

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

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('freshbasket_wishlist');
      if (saved) {
        try {
          setWishlist(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to load wishlist", e);
        }
      }
      setIsInitialized(true);
    }
  }, []);

  // Sync to localStorage on update
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('freshbasket_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, isInitialized]);

  const toggleWishlist = (product: Product) => {
    if (!product?._id) return;

    const exists = wishlist.find(p => p._id === product._id);
    
    if (exists) {
      setWishlist(prev => prev.filter(p => p._id !== product._id));
      toast.success(`Removed ${product.name} from wishlist`, {
        icon: '💔',
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
    } else {
      setWishlist(prev => [...prev, product]);
      toast.success(`Added ${product.name} to wishlist`, {
        icon: '❤️',
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
    }
  };

  const isInWishlist = (id: string) => {
    if (!id) return false;
    return wishlist.some(p => p._id === id);
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

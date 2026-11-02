'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image: string;
  imageData?: string;
  /** Stock when the item was last added; caps the quantity. */
  stock?: number;
}

interface CartContextType {
  items: CartItem[];
  /** Adds `quantity` units (default 1), never beyond stock, and opens the cart drawer. */
  addItem: (product: any, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load from local storage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart');
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: any, quantity = 1) => {
    setItems((prev) => {
      const id = product._id || product.id;
      const existing = prev.find((item) => item.id === id);

      // One atomic update, clamped to the product's current stock (the fresh value from the
      // product wins over the stock remembered on an older cart line).
      const currentQty = existing ? existing.quantity : 0;
      const limit = Number(product.stock ?? existing?.stock ?? 0);
      const newQty = Math.min(currentQty + Math.max(1, Math.floor(quantity)), limit);
      if (newQty <= currentQty) {
        return prev; // Don't add more than stock
      }

      if (existing) {
        return prev.map((item) =>
          item.id === id ? { ...item, quantity: newQty, stock: limit } : item
        );
      }
      return [...prev, {
        id: id,
        name: product.name,
        price: product.price,
        quantity: newQty,
        unit: product.unit,
        image: product.image || (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400',
        imageData: product.imageData,
        stock: product.stock, // Store stock limit in cart item
      }];
    });
    setIsCartOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          // Check against stock limit stored in the cart item
          if (newQty > (item as any).stock) {
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter((item) => item.quantity > 0)
    );
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalPrice = subtotal;

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal, totalPrice, isCartOpen, setIsCartOpen }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

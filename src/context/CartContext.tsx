'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

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
  /**
   * Adds `quantity` units (default 1), never beyond stock. The cart drawer stays closed:
   * a short "Added to cart" toast (with a "View cart" button) confirms it instead, and the
   * drawer opens only when the shopper clicks the cart icon or that button.
   */
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

  // Save to local storage. The untouched initial [] is never written: on mount this effect
  // runs before the saved cart above is loaded, and writing it would wipe the saved cart
  // (every reload in development, where React runs effects twice).
  const initialItemsRef = useRef(items);
  useEffect(() => {
    if (items === initialItemsRef.current) return;
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // Latest items for the add-to-cart feedback (the state updater below stays the source of truth).
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const addItem = useCallback((product: any, quantity = 1) => {
    // Feedback without opening the drawer: one toast at a time (same id), replaced on each add.
    const id = product._id || product.id;
    const existingLine = itemsRef.current.find((item) => item.id === id);
    const inCart = existingLine?.quantity ?? 0;
    const stockLimit = Number(product.stock ?? existingLine?.stock ?? 0);
    if (inCart >= stockLimit) {
      toast.error(stockLimit > 0 ? `Only ${stockLimit} of ${product.name} in stock` : `${product.name} is out of stock`, { id: 'cart-feedback' });
    } else {
      toast.success(
        (t) => (
          <span className="flex items-center gap-3">
            <span>
              <span className="font-semibold">{product.name}</span> added to cart
            </span>
            <button
              type="button"
              data-testid="toast-view-cart"
              onClick={() => { toast.dismiss(t.id); setIsCartOpen(true); }}
              className="min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              View cart
            </button>
          </span>
        ),
        // Long enough to reach "View cart"; the header cart button is always there as well.
        { id: 'cart-feedback', duration: 5000 }
      );
    }

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

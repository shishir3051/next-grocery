import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import AuthProvider from '@/context/AuthProvider';
import CartDrawer from '@/components/layout/CartDrawer';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FreshBasket – Online Grocery Delivery in Bangladesh',
  description:
    'Shop fresh vegetables, fruits, dairy, meat and more. Get fast grocery delivery across Dhaka, Chittagong, Sylhet and beyond.',
  keywords: 'online grocery, Bangladesh, fresh food, vegetables, delivery, Dhaka',
};

import MaintenanceGuard from '@/components/layout/MaintenanceGuard';

import FooterWrapper from '@/components/layout/FooterWrapper';

import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased relative">
        <Toaster position="top-center" reverseOrder={false} />
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <MaintenanceGuard>
                <div className="flex-1">
                  {children}
                </div>
                <FooterWrapper />
                <CartDrawer />
              </MaintenanceGuard>
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

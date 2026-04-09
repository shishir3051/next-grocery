'use client';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Search, MapPin, Menu, X, Leaf, Package, LogOut, User, LayoutDashboard, Truck, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import LocationModal from './LocationModal';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onMenuToggle: () => void;
  isMobileMenuOpen: boolean;
  location: string;
  onLocationChange: (loc: string) => void;
}

const LOCATIONS = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Cumilla'];

export default function Navbar({ searchQuery, onSearchChange, location, onLocationChange, onMenuToggle, isMobileMenuOpen }: NavbarProps) {
  const { data: session, status } = useSession();
  const { totalItems, subtotal, setIsCartOpen } = useCart();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm"
      style={{ height: 'var(--navbar-height)' }}
    >
      <div className="h-full flex items-center gap-2 px-2 sm:px-4 max-w-full">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-all"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo */}
        <a href="/" className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-sm">
            <Leaf size={16} className="text-white" />
          </div>
         <span className="text-xl font-black text-slate-800 tracking-tight hidden md:block">
            Fresh<span className="text-teal-500">Basket</span>
          </span>
        </a>

        {/* Location Selector - Shwapno Style */}
        <div className="relative location-picker hidden lg:block flex-shrink-0">
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-3 px-3 py-1.5 rounded bg-[#D90000] hover:bg-[#B30000] text-white transition-all border border-white/40 shadow-sm"
          >
            <Truck size={24} className="text-white flex-shrink-0" strokeWidth={1.5} />
            <div className="flex flex-col items-start text-left">
              <span className="text-[12px] font-bold text-white mb-[2px]">Today: 9AM - 10AM</span>
              <span className="text-[13px] font-medium text-white/95 truncate max-w-[200px] leading-none">{location}</span>
            </div>
          </button>
        </div>

        <AnimatePresence>
          {isLocationModalOpen && (
            <LocationModal
              isOpen={isLocationModalOpen}
              onClose={() => setIsLocationModalOpen(false)}
              currentLocation={location}
              onLocationChange={onLocationChange}
            />
          )}
        </AnimatePresence>

        {/* Search Bar - Center Aligned & Bounded */}
        <div className={`flex-1 min-w-0 relative transition-all ${isSearchFocused ? 'scale-[1.01]' : ''}`}>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all bg-slate-50 ${
            isSearchFocused ? 'border-teal-400 bg-white shadow-md shadow-teal-100' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200 mr-1 hidden md:flex">
              <MapPin size={12} className="text-teal-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[80px]">{location}</span>
            </div>
            <Search size={16} className={`flex-shrink-0 transition-colors ${isSearchFocused ? 'text-teal-500' : 'text-slate-400'}`} />
            <input
              ref={searchRef}
              type="text"
              placeholder={`Search for items for order.`}
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* User Account / Auth */}
      <div className="flex items-center gap-1 flex-shrink-0">
          {status === 'authenticated' ? (
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-sm uppercase">
                  {session.user?.name?.charAt(0)}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Account</p>
                  <p className="text-xs font-bold text-slate-700 leading-none">{session.user?.name?.split(' ')[0]}</p>
                </div>
              </button>
              
              {/* Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {(session.user as any).role === 'admin' && (
                  <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-teal-600 font-bold hover:bg-teal-50 transition-all border-b border-slate-50">
                    <LayoutDashboard size={16} />
                    Admin Dashboard
                  </Link>
                )}
                <Link href="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-all">
                  <User size={16} />
                  My Profile
                </Link>
                {(session.user as any).role !== 'admin' && (
                  <Link href="/orders" className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-all">
                    <Package size={16} />
                    My Orders
                  </Link>
                )}
                <button 
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all text-left"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </div>
            </div>
          ) : (
            <Link 
              href="/login"
              className="px-3 py-2 md:px-5 md:py-2.5 text-sm font-bold text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all flex items-center gap-2"
            >
              <User size={18} className="md:hidden" />
              <span className="hidden md:block">Log In</span>
            </Link>
          )}
        </div>
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex items-center gap-1 px-2 sm:px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-teal-200 hover:shadow-lg hover:shadow-teal-200 flex-shrink-0 relative"
        >
          <ShoppingCart size={17} />
          <span className="hidden sm:block">৳{subtotal.toFixed(0)}</span>
          {totalItems > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 text-slate-900 text-xs font-bold rounded-full flex items-center justify-center border-2 border-white badge-pulse">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
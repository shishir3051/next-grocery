'use client';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Search, MapPin, Menu, X, Leaf, Package, LogOut, User, LayoutDashboard, Truck, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import LocationModal from './LocationModal';

/**
 * Site header.
 *
 * On the home page HomeClient passes the search/location/menu props and owns that state.
 * Everywhere else the header is used without props ("standalone"): it keeps its own
 * search text and sends the shopper to `/?q=…` when they submit.
 */
interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
  location?: string;
  onLocationChange?: (loc: string) => void;
}

const menuItemClass = 'flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors';

export default function Navbar({ searchQuery, onSearchChange, location, onLocationChange, onMenuToggle, isMobileMenuOpen }: NavbarProps) {
  const { data: session, status } = useSession();
  const { totalItems, subtotal, setIsCartOpen } = useCart();
  const router = useRouter();
  const isStandalone = onSearchChange === undefined;

  // Standalone mode keeps its own search text and location.
  const [localQuery, setLocalQuery] = useState('');
  const [localLocation, setLocalLocation] = useState('Dhaka');
  useEffect(() => {
    if (!isStandalone) return;
    try {
      const saved = localStorage.getItem('userLocation');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only value
      if (saved) setLocalLocation(saved);
    } catch { /* storage unavailable */ }
  }, [isStandalone]);

  const query = isStandalone ? localQuery : (searchQuery ?? '');
  const setQuery = isStandalone ? setLocalQuery : onSearchChange!;
  const currentLocation = location ?? localLocation;
  const changeLocation = (loc: string) => {
    if (onLocationChange) onLocationChange(loc);
    else {
      setLocalLocation(loc);
      try { localStorage.setItem('userLocation', loc); } catch { /* storage unavailable */ }
    }
  };

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsUserMenuOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStandalone && query.trim()) router.push(`/?q=${encodeURIComponent(query.trim())}`);
  };

  const role = session?.user?.role;
  const showCart = status !== 'authenticated' || role !== 'admin';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200"
      style={{ height: 'var(--navbar-height)' }}
    >
      {/* Signature stripe: brand teal → leaf green → tangerine */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-brand-600 via-success-500 to-accent-500" />
      <div className="h-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4">
        {/* Mobile category menu toggle (home page only) */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            aria-label={isMobileMenuOpen ? 'Close categories' : 'Open categories'}
            aria-expanded={isMobileMenuOpen}
            className="md:hidden h-10 w-10 -ml-1 grid place-items-center rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="FreshBasket home">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center shadow-sm">
            <Leaf size={18} className="text-white" aria-hidden="true" />
          </span>
          <span className="text-xl font-black text-slate-900 tracking-tight hidden md:block">
            Fresh<span className="text-brand-600">Basket</span>
          </span>
        </Link>

        {/* Delivery location */}
        <button
          onClick={() => setIsLocationModalOpen(true)}
          className="hidden lg:flex items-center gap-2.5 h-11 pl-3 pr-2.5 rounded-xl border border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50 transition-colors flex-shrink-0"
          aria-label={`Delivery location: ${currentLocation}. Change location`}
        >
          <Truck size={20} className="text-brand-600 flex-shrink-0" aria-hidden="true" />
          <span className="flex flex-col items-start text-left leading-tight">
            <span className="text-xs text-slate-500">Delivery in 60 min</span>
            <span className="text-sm font-semibold text-slate-800 truncate max-w-[160px]">{currentLocation}</span>
          </span>
          <ChevronDown size={16} className="text-slate-400" aria-hidden="true" />
        </button>

        <AnimatePresence>
          {isLocationModalOpen && (
            <LocationModal
              isOpen={isLocationModalOpen}
              onClose={() => setIsLocationModalOpen(false)}
              currentLocation={currentLocation}
              onLocationChange={changeLocation}
            />
          )}
        </AnimatePresence>

        {/* Search */}
        <form role="search" onSubmit={handleSearchSubmit} className="flex-1 min-w-0">
          <label htmlFor="site-search" className="sr-only">Search groceries</label>
          <div className="flex items-center gap-2 h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 transition-colors focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/20">
            <span className="hidden md:flex items-center gap-1 pr-2.5 mr-0.5 border-r border-slate-200 text-xs font-medium text-slate-600 flex-shrink-0">
              <MapPin size={13} className="text-brand-600" aria-hidden="true" />
              <span className="truncate max-w-[90px]">{currentLocation}</span>
            </span>
            <Search size={17} className="flex-shrink-0 text-slate-400" aria-hidden="true" />
            <input
              id="site-search"
              type="search"
              placeholder="Search vegetables, milk, rice…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="h-7 w-7 grid place-items-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </form>

        {/* Account */}
        <div className="flex items-center flex-shrink-0">
          {status === 'authenticated' ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                aria-label="Account menu"
                className="flex items-center gap-2 h-11 px-1.5 sm:px-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-brand-100 grid place-items-center text-brand-700 font-semibold text-sm uppercase overflow-hidden">
                  {session.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- avatar may be a data URL
                    <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    session.user?.name?.charAt(0) || <User size={16} />
                  )}
                </span>
                <span className="text-left hidden lg:block leading-tight">
                  <span className="block text-xs text-slate-500">Hello,</span>
                  <span className="block text-sm font-semibold text-slate-800">{session.user?.name?.split(' ')[0]}</span>
                </span>
                <ChevronDown size={16} className="text-slate-400 hidden lg:block" aria-hidden="true" />
              </button>

              {isUserMenuOpen && (
                <div role="menu" className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
                  {role === 'admin' && (
                    <>
                      <Link role="menuitem" href="/admin" onClick={() => setIsUserMenuOpen(false)} className={`${menuItemClass} font-semibold text-brand-700`}>
                        <LayoutDashboard size={16} aria-hidden="true" /> Admin dashboard
                      </Link>
                      <Link role="menuitem" href="/admin/orders" onClick={() => setIsUserMenuOpen(false)} className={menuItemClass}>
                        <Package size={16} aria-hidden="true" /> Manage orders
                      </Link>
                      <div className="my-1.5 border-t border-slate-100" />
                    </>
                  )}
                  {role === 'delivery' && (
                    <>
                      <Link role="menuitem" href="/delivery" onClick={() => setIsUserMenuOpen(false)} className={`${menuItemClass} font-semibold text-brand-700`}>
                        <Truck size={16} aria-hidden="true" /> Delivery dashboard
                      </Link>
                      <div className="my-1.5 border-t border-slate-100" />
                    </>
                  )}
                  <Link role="menuitem" href="/profile" onClick={() => setIsUserMenuOpen(false)} className={menuItemClass}>
                    <User size={16} aria-hidden="true" /> My profile
                  </Link>
                  {role !== 'admin' && (
                    <Link role="menuitem" href="/orders" onClick={() => setIsUserMenuOpen(false)} className={menuItemClass}>
                      <Package size={16} aria-hidden="true" /> My orders
                    </Link>
                  )}
                  <div className="my-1.5 border-t border-slate-100" />
                  <button
                    role="menuitem"
                    onClick={() => { setIsUserMenuOpen(false); signOut(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors text-left"
                  >
                    <LogOut size={16} aria-hidden="true" /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              aria-label="Log in"
              className="h-11 px-2.5 md:px-4 text-sm font-semibold text-slate-700 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-colors flex items-center gap-2"
            >
              <User size={18} className="md:hidden" aria-hidden="true" />
              <span className="hidden md:block">Log in</span>
            </Link>
          )}
        </div>

        {showCart && (
          <button
            onClick={() => setIsCartOpen(true)}
            aria-label={`Open cart, ${totalItems} ${totalItems === 1 ? 'item' : 'items'}, ৳${subtotal.toFixed(0)}`}
            className="relative flex items-center gap-2 h-11 px-3 sm:px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm flex-shrink-0"
          >
            <ShoppingCart size={18} aria-hidden="true" />
            <span className="hidden sm:block tabular-nums">৳{subtotal.toFixed(0)}</span>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-accent-400 text-slate-900 text-[11px] font-bold rounded-full grid place-items-center ring-2 ring-white tabular-nums" aria-hidden="true">
                {totalItems}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}

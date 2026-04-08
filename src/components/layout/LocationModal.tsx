'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Search, Crosshair, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DISTRICTS = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Cumilla'];
const AREAS: Record<string, string[]> = {
  Dhaka: ['Banani', 'Gulshan', 'Dhanmondi', 'Uttara', 'Mirpur', 'Mohakhali'],
  Chittagong: ['Agrabad', 'Halishahar', 'Khulshi', 'Pahartali'],
};

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: string;
  onLocationChange: (loc: string) => void;
}

export default function LocationModal({ isOpen, onClose, currentLocation, onLocationChange }: LocationModalProps) {
  const [district, setDistrict] = useState('Dhaka');
  const [area, setArea] = useState('');
  const [search, setSearch] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset to search mode when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsManualMode(false);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleDone = () => {
    if (area) {
      onLocationChange(`${area}, ${district}`);
    } else {
      onLocationChange(district);
    }
    onClose();
  };

  const handleGeoLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSearch(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to retrieve your location. Please check your browser permissions.");
      }
    );
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="text-center py-5 relative border-b border-slate-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
            <MapPin size={22} className="text-slate-600" />
            Delivery Location
          </h2>
          <button 
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-6 overflow-y-auto">
          {/* Map Area Container */}
          <div className="relative h-64 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 mb-6 flex flex-col group">
            {/* Live Interactive Map Iframe */}
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(
                (search ? search + ', ' : '') + 
                (area ? area + ', ' : '') + 
                district + ', Bangladesh'
              )}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0, filter: 'contrast(1.1) brightness(1.05)' }}
              allowFullScreen
              className="absolute inset-0 w-full h-full z-0"
            />
            
            {/* Search Bar Overlay - Higher Z-Index to remain clickable */}
            <div className="absolute top-3 left-3 right-3 flex items-center shadow-lg rounded-lg overflow-hidden border border-slate-200 z-20">
              <div className="flex-1 flex items-center bg-white px-3 py-2.5 gap-2">
                <Search size={18} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search delivery location"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-sm outline-none font-medium placeholder-slate-400 text-slate-700"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                )}
              </div>
              <button 
                onClick={handleGeoLocation}
                className="bg-[#ED1C24] hover:bg-[#D4181E] text-white p-3 flex-shrink-0 transition-colors"
                title="Use current location"
              >
                <Crosshair size={20} />
              </button>
            </div>

            {/* Visual Center Pin Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-md pointer-events-none z-10 transition-transform group-hover:-translate-y-4 duration-300">
              <div className="w-10 h-10 bg-[#ED1C24] rounded-full flex items-center justify-center border-4 border-white text-white font-bold text-[10px] shadow-xl animate-pulse">
                PIN
              </div>
              <div className="w-1.5 h-6 bg-[#ED1C24] mx-auto -mt-1 rounded-b-full shadow-xl" />
              <div className="w-4 h-1.5 bg-black/30 rounded-[50%] mx-auto mt-[1px] blur-[1px]" />
            </div>

            {/* Bottom Primary Actions Overlay - Initial Mode Only */}
            {!isManualMode && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3 px-3 z-20">
                <button 
                  onClick={() => setIsManualMode(true)}
                  className="bg-[#ED1C24] hover:bg-[#D4181E] text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-lg transition-all active:scale-95"
                >
                  Manual Input
                </button>
                <button 
                  onClick={() => {
                    if (search) onLocationChange(search);
                    else handleDone();
                    onClose();
                  }}
                  className="bg-[#FFD500] hover:bg-[#F2CA00] text-slate-900 text-sm font-bold px-6 py-2.5 rounded-full shadow-lg transition-all active:scale-95"
                >
                  Confirm Location
                </button>
              </div>
            )}
          </div>

          {/* Manual Mode Elements */}
          {isManualMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col"
            >
              {/* OR Divider */}
              <div className="flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 flex items-center text-slate-200">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex items-center justify-center bg-white px-4 text-xs font-bold text-slate-400 border border-slate-200 rounded-full py-1 uppercase tracking-wider">
                  OR
                </div>
              </div>

              {/* Dropdowns */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="relative">
                  <select 
                    value={district}
                    onChange={(e) => {
                      setDistrict(e.target.value);
                      setArea(''); 
                    }}
                    className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-3.5 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-bold cursor-pointer"
                  >
                    <option value="" disabled>District</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select 
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    disabled={!district || !AREAS[district]}
                    className="w-full appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-3.5 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-bold cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">Area</option>
                    {district && AREAS[district]?.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Final Done Button */}
              <button 
                onClick={handleDone}
                className="w-full bg-[#FFD500] hover:bg-[#F2CA00] text-slate-900 font-bold py-4 rounded-xl shadow-sm transition-all text-base tracking-wide"
              >
                Done
              </button>
            </motion.div>
          )}
        </div>
        
        {/* Decorative Brand Bottom Bar */}
        <div className="h-2 bg-gradient-to-r from-[#ED1C24] via-orange-400 to-[#FFD500] w-full flex-shrink-0" />
      </motion.div>
    </div>
  );

  return createPortal(modalContent, typeof document !== 'undefined' ? document.body : ({} as any));
}

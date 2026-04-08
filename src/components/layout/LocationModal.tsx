'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Search, Crosshair, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DynamicMap from '../map/DynamicMap';

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
  const [mapCenter, setMapCenter] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset mode when opened
  useEffect(() => {
    if (isOpen) setIsManualMode(false);
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleDone = () => {
    if (area) {
      onLocationChange(`${area}, ${district}`);
    } else if (district) {
      onLocationChange(district);
    } else if (search) {
      onLocationChange(search);
    }
    onClose();
  };

  const resolveLocationData = (data: any) => {
    if (data && (data.locality || data.city)) {
      const cityName = data.city || data.principalSubdivision || 'Dhaka';
      const localArea = data.locality || '';
      const locationString = localArea && cityName !== localArea ? `${localArea}, ${cityName}` : cityName;
      
      setSearch(locationString);
      
      if (cityName) {
        const matchedDistrict = DISTRICTS.find(d => cityName.includes(d) || d.includes(cityName));
        if (matchedDistrict) {
           setDistrict(matchedDistrict);
           if (localArea && AREAS[matchedDistrict]) {
             const cleanArea = localArea.replace(/ /g, '');
             const matchedArea = AREAS[matchedDistrict].find(a => 
               cleanArea.toLowerCase().includes(a.toLowerCase()) || 
               a.toLowerCase().includes(cleanArea.toLowerCase())
             );
             if (matchedArea) setArea(matchedArea);
           }
        }
      }
    } else {
      setSearch(`Unknown Area`);
    }
  };

  const fetchIPFallback = async () => {
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en`);
      const data = await res.json();
      if (data.latitude && data.longitude) {
        setMapCenter(`${data.latitude},${data.longitude}`);
      }
      resolveLocationData(data);
    } catch (e) {
      setSearch('Location Detection Failed');
    } finally {
      setIsLocating(false);
    }
  };

  const handleMarkerDragEnd = async (lat: number, lng: number) => {
    setMapCenter(`${lat},${lng}`);
    setIsLocating(true);
    setSearch('Locating Area...');
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      const data = await res.json();
      resolveLocationData(data);
    } catch (e) {
      setSearch('Location Detection Failed');
    } finally {
      setIsLocating(false);
    }
  };

  const activeCenter: [number, number] = mapCenter 
    ? [parseFloat(mapCenter.split(',')[0]), parseFloat(mapCenter.split(',')[1])]
    : [23.8103, 90.4125]; // Default Dhaka center

  const handleGeoLocation = () => {
    setIsLocating(true);
    setSearch('Locating...');

    if (!navigator.geolocation) {
      fetchIPFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setMapCenter(`${latitude},${longitude}`);
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await res.json();
          resolveLocationData(data);
        } catch (error) {
          console.error("Reverse geocoding failed", error);
          setSearch(`Location Detected`);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.warn("GPS failed, falling back to IP API");
        fetchIPFallback();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
        className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ minHeight: '500px', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="text-center py-4 relative border-b border-slate-100 flex-shrink-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
            <MapPin size={22} className="text-slate-800" strokeWidth={2.5} />
            Delivery Location
          </h2>
        </div>

        <div className="flex-1 flex flex-col relative bg-slate-50">
          {!isManualMode ? (
            // MAP MODE (Matching Screenshot Exactly)
            <div className="absolute inset-0 flex flex-col">
              {/* Interactive Leaflet Map */}
              <DynamicMap 
                center={activeCenter}
                onMarkerDragEnd={handleMarkerDragEnd}
              />

              {/* Top Search Overlay */}
              <div className="absolute top-4 left-4 right-4 z-20 flex bg-white rounded shadow-lg overflow-hidden border border-slate-200">
                <div className="flex-1 flex items-center px-3 py-2.5 gap-2">
                  <Search size={18} className="text-slate-500 flex-shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Search delivery location"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setMapCenter('');
                    }}
                    className="w-full text-sm outline-none font-medium placeholder-slate-400 text-slate-700 bg-transparent"
                  />
                  {search && (
                    <button onClick={() => {
                        setSearch('');
                        setMapCenter('');
                      }} 
                      className="text-slate-400 hover:text-slate-600 flex-shrink-0 px-1"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                
                {/* Crosshair Button */}
                <button 
                  onClick={handleGeoLocation}
                  disabled={isLocating}
                  className={`bg-[#CC0000] hover:bg-[#A30000] text-white px-3.5 py-3 flex items-center justify-center transition-all ${isLocating ? 'opacity-80' : ''}`}
                >
                  <Crosshair size={20} className={isLocating ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Removed Static Pin because Leaflet Marker takes its place */}

              {/* Bottom Action Buttons (Pills) */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-4 z-20 pointer-events-none">
                <button 
                  onClick={() => setIsManualMode(true)}
                  className="bg-[#CC0000] hover:bg-[#A30000] text-white font-bold px-6 py-2.5 rounded-full shadow-lg transition-transform active:scale-95 border-2 border-white/20 pointer-events-auto"
                >
                  Manual Input
                </button>
                <button 
                  onClick={() => {
                    if (search) onLocationChange(search);
                    else handleDone();
                    onClose();
                  }}
                  className="bg-[#FFD500] hover:bg-[#F2CA00] text-slate-900 font-bold px-6 py-2.5 rounded-full shadow-lg transition-transform active:scale-95 pointer-events-auto"
                >
                  Confirm Location
                </button>
              </div>
            </div>
          ) : (
            // MANUAL MODE (Dropdowns)
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col p-6 absolute inset-0 bg-white z-30"
            >
              <button 
                onClick={() => setIsManualMode(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-2 bg-slate-100"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-sm font-bold text-slate-500 tracking-wider uppercase mb-6 mt-4">Select Manually</h3>
              
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <select 
                    value={district}
                    onChange={(e) => {
                      setDistrict(e.target.value);
                      setArea(''); 
                    }}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-base rounded-xl px-4 py-3.5 outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] font-bold cursor-pointer transition-all"
                  >
                    <option value="" disabled>Select City</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select 
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    disabled={!district || !AREAS[district]}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-base rounded-xl px-4 py-3.5 outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] font-bold cursor-pointer transition-all disabled:opacity-50"
                  >
                    <option value="">Select Area</option>
                    {district && AREAS[district]?.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="mt-auto pt-6 flex gap-4">
                <button 
                  onClick={() => setIsManualMode(false)}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-all"
                >
                  Back to Map
                </button>
                <button 
                  onClick={handleDone}
                  className="w-2/3 bg-[#FFD500] hover:bg-[#F2CA00] text-slate-900 font-bold py-3.5 rounded-xl shadow-md transition-all text-lg"
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, typeof document !== 'undefined' ? document.body : ({} as any));
}


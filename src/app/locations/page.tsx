"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Search, Navigation } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const locations = [
  {
    city: "Dhaka",
    branches: [
      {
        name: "Banani Branch",
        address: "Plot 22, Road 4, Banani C/A, Dhaka 1213",
        phone: "017xxxxxxxx",
        hours: "08:00 AM - 10:00 PM"
      },
      {
        name: "Dhanmondi Branch",
        address: "House 15, Road 27, Dhanmondi, Dhaka 1209",
        phone: "017xxxxxxxx",
        hours: "08:00 AM - 10:00 PM"
      },
      {
        name: "Uttara Sector 7",
        address: "Lake Drive, Sector 7, Uttara, Dhaka 1230",
        phone: "017xxxxxxxx",
        hours: "08:00 AM - 10:00 PM"
      }
    ]
  },
  {
    city: "Chittagong",
    branches: [
      {
        name: "GEC Circle",
        address: "CDA Avenue, GEC, Chittagong",
        phone: "017xxxxxxxx",
        hours: "08:00 AM - 09:30 PM"
      },
      {
        name: "Agrabad C/A",
        address: "Sabdar Ali Road, Agrabad, Chittagong",
        phone: "017xxxxxxxx",
        hours: "08:00 AM - 09:30 PM"
      }
    ]
  },
  {
    city: "Sylhet",
    branches: [
      {
        name: "Zindabazar",
        address: "Zindabazar Point, Sylhet 3100",
        phone: "017xxxxxxxx",
        hours: "10:00 AM - 09:00 PM"
      }
    ]
  }
];

export default function LocationsPage() {
  const [activeCity, setActiveCity] = useState("Dhaka");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Search Header */}
      <div className="bg-white border-b border-slate-100 py-20 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-8">
           <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight"
          >
            Find a <span className="text-teal-600">FreshBasket</span> near you
          </motion.h1>
          
          <div className="max-w-2xl mx-auto relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by area, city or zip code..."
              className="w-full pl-16 pr-6 py-6 bg-slate-50 border-none rounded-[2rem] text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none shadow-sm"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-3">
             {locations.map(city => (
               <button 
                key={city.city}
                onClick={() => setActiveCity(city.city)}
                className={`px-8 py-3 rounded-2xl font-bold transition-all ${
                  activeCity === city.city 
                  ? 'bg-teal-600 text-white shadow-lg' 
                  : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
                }`}
               >
                 {city.city}
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* Locations Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {locations.find(c => c.city === activeCity)?.branches.map((branch, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6 group hover:border-teal-200 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center">
                  <MapPin className="text-teal-600" size={24} />
                </div>
                <button className="text-teal-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-70">
                   Get Directions <Navigation size={14} />
                </button>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{branch.name}</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">{branch.address}</p>
              </div>

              <div className="pt-4 border-t border-slate-50 space-y-3">
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone size={16} className="text-teal-500" />
                  <span className="text-sm font-bold">{branch.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Clock size={16} className="text-teal-500" />
                  <span className="text-sm font-bold">{branch.hours}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Online only notice */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-center text-white relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <h2 className="text-2xl md:text-3xl font-black italic">Prefer shopping from home?</h2>
            <p className="text-slate-400 max-w-md mx-auto">Get your groceries delivered within 60 minutes across any part of {activeCity}.</p>
            <div className="pt-4">
               <Link href="/" className="inline-block px-10 py-4 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 transition-all">
                 Order Online Now
               </Link>
            </div>
          </div>
          {/* Subtle decor */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-600/10 rounded-full blur-[100px]" />
        </div>
      </div>
    </div>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Phone, Clock, Search, Navigation } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";

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
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Page title */}
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Store locations</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Find a FreshBasket near you</h1>
          <p className="mt-3 text-base text-slate-600">Visit one of our branches or order online for delivery.</p>
        </header>

        {/* Search (visual only for now) + city filter */}
        <div className="mt-8 flex flex-col gap-4 sm:mt-10 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <label htmlFor="location-search" className="sr-only">Search by area, city or zip code</label>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
            <input
              id="location-search"
              type="search"
              placeholder="Search by area, city or zip code…"
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter branches by city">
            {locations.map(city => {
              const isActive = activeCity === city.city;
              return (
                <button
                  key={city.city}
                  type="button"
                  onClick={() => setActiveCity(city.city)}
                  aria-pressed={isActive}
                  className={`h-10 rounded-full px-5 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {city.city}
                </button>
              );
            })}
          </div>
        </div>

        {/* Locations grid */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {locations.find(c => c.city === activeCity)?.branches.map((branch, i) => (
            <motion.article
              key={branch.name}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
                  <MapPin className="text-brand-600" size={22} aria-hidden="true" />
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                >
                  Get directions <Navigation size={14} aria-hidden="true" />
                  <span className="sr-only">to {branch.name}</span>
                </button>
              </div>

              <h2 className="mt-4 text-lg font-semibold text-slate-900">{branch.name}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{branch.address}</p>

              <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  <dt>
                    <Phone size={16} className="text-brand-600" aria-hidden="true" />
                    <span className="sr-only">Phone</span>
                  </dt>
                  <dd className="font-medium">{branch.phone}</dd>
                </div>
                <div className="flex items-center gap-3">
                  <dt>
                    <Clock size={16} className="text-brand-600" aria-hidden="true" />
                    <span className="sr-only">Opening hours</span>
                  </dt>
                  <dd className="font-medium">{branch.hours}</dd>
                </div>
              </dl>
            </motion.article>
          ))}
        </div>

        {/* Online ordering prompt */}
        <section className="mt-10 rounded-2xl bg-slate-900 px-6 py-10 text-center text-white sm:mt-14 sm:px-12 sm:py-12">
          <h2 className="text-xl font-bold sm:text-2xl">Prefer shopping from home?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-300 sm:text-base">
            Get your groceries delivered within 60 minutes across any part of {activeCity}.
          </p>
          <Button href="/" size="lg" className="mt-6">
            Order online now
          </Button>
        </section>
      </div>
    </div>
  );
}

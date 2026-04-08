"use client";

import { motion } from "framer-motion";
import { ShoppingBasket, ShieldCheck, Truck, Users, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AboutPage() {
  const [stats, setStats] = useState({ customers: null as number | null, cities: null as number | null, products: null as number | null });

  useEffect(() => {
    fetch('/api/stats/public')
      .then(res => res.json())
      .then(data => {
        if (!data.error && data.customers !== undefined) {
          setStats({ customers: data.customers, cities: data.cities, products: data.products });
        }
      })
      .catch(console.error);
  }, []);

  const formatStat = (num: number | null, fallback: string) => {
    if (num === null) return fallback;
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k+';
    if (num >= 10) return num + '+';
    return num;
  };
  const values = [
    {
      icon: <ShoppingBasket className="text-teal-600" size={32} />,
      title: "Freshness Guaranteed",
      description: "We source our products directly from local farmers and trusted suppliers every single morning."
    },
    {
      icon: <Truck className="text-teal-600" size={32} />,
      title: "Express Delivery",
      description: "Our fleet is optimized to get your groceries to your door within 60 minutes or at your chosen time."
    },
    {
      icon: <ShieldCheck className="text-teal-600" size={32} />,
      title: "Quality Control",
      description: "Every item undergoes a rigorous 5-step quality check before it leaves our warehouse."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
           <Image 
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2000" 
            alt="Fresh Groceries" 
            fill 
            className="object-cover"
          />
        </div>
        <div className="relative z-10 text-center px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white mb-6"
          >
            Freshness delivered <span className="text-teal-400">to your door.</span>
          </motion.h1>
          <p className="text-lg text-slate-200 max-w-2xl mx-auto font-medium">
            FreshBasket is on a mission to simplify grocery shopping for every household in Bangladesh.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-slate-800">Our Story</h2>
            <p className="text-slate-600 leading-relaxed">
              Founded in 2024, FreshBasket started with a simple observation: grocery shopping was taking too much time away from what truly matters—family. We set out to build a platform that doesn't just sell products, but sells time and peace of mind.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Today, we serve thousands of families across the major cities, partnering with local specialists to bring you the finest meat, fish, and farm-fresh vegetables within an hour of your order.
            </p>
            <div className="flex gap-8 pt-4">
              <div>
                <p className="text-3xl font-black text-teal-600">
                  {stats.customers === null ? '...' : formatStat(stats.customers, '0')}
                </p>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Customers</p>
              </div>
              <div>
                <p className="text-3xl font-black text-teal-600">
                  {stats.cities === null ? '...' : formatStat(stats.cities, '0')}
                </p>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cities</p>
              </div>
              <div>
                <p className="text-3xl font-black text-teal-600">
                  {stats.products === null ? '...' : formatStat(stats.products, '0')}
                </p>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Products</p>
              </div>
            </div>
          </div>
          <div className="relative h-[500px] rounded-[3rem] overflow-hidden shadow-2xl">
             <Image 
              src="/images/team.png" 
              alt="Grocery Team" 
              fill 
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 text-center mb-16">
          <h2 className="text-3xl font-black text-slate-800 mb-4">What We Stand For</h2>
          <p className="text-slate-500 max-w-xl mx-auto font-medium">
            At FreshBasket, our values guide every decision we make, from the farmers we choose to the way we deliver.
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          {values.map((v, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4"
            >
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-6">
                {v.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-800">{v.title}</h3>
              <p className="text-slate-500 leading-relaxed">{v.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 max-w-7xl mx-auto px-4 text-center">
        <div className="bg-teal-600 rounded-[3.5rem] p-12 md:p-20 text-white relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl md:text-5xl font-black italic">Ready to experience freshness?</h2>
            <p className="text-teal-50 max-w-lg mx-auto text-lg">
              Join thousands of happy families who have made FreshBasket their primary grocery partner.
            </p>
            <div className="pt-6">
              <Link href="/" className="inline-block px-10 py-5 bg-white text-teal-600 font-black rounded-2xl shadow-xl hover:bg-slate-50 transition-all uppercase tracking-widest text-sm">
                Start Shopping Now
              </Link>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-teal-500/30 rounded-full" />
          <div className="absolute bottom-[-50px] right-[-50px] w-96 h-96 bg-teal-500/30 rounded-full" />
        </div>
      </section>
    </div>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ShoppingBasket, ShieldCheck, Truck } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

export default function AboutPage() {
  const [stats, setStats] = useState({ customers: null as number | null, cities: null as number | null, products: null as number | null });
  const reduceMotion = useReducedMotion();

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

  const statItems = [
    { label: "Customers", value: stats.customers },
    { label: "Cities", value: stats.cities },
    { label: "Products", value: stats.products },
  ];

  const values = [
    {
      icon: <ShoppingBasket className="text-brand-600" size={24} aria-hidden="true" />,
      title: "Freshness guaranteed",
      description: "We source our products directly from local farmers and trusted suppliers every single morning."
    },
    {
      icon: <Truck className="text-brand-600" size={24} aria-hidden="true" />,
      title: "Express delivery",
      description: "Our fleet is optimized to get your groceries to your door within 60 minutes or at your chosen time."
    },
    {
      icon: <ShieldCheck className="text-brand-600" size={24} aria-hidden="true" />,
      title: "Quality control",
      description: "Every item undergoes a rigorous 5-step quality check before it leaves our warehouse."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:space-y-16 sm:px-6 sm:py-14">
        {/* Hero banner (the one place a photo + dark overlay is used) */}
        <section className="relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-16 text-center sm:px-12 sm:py-24">
          <Image
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2000"
            alt=""
            fill
            preload
            sizes="(min-width: 1152px) 1152px, 100vw"
            className="object-cover opacity-40"
          />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-300">About FreshBasket</p>
            <h1 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">
              Freshness delivered <span className="text-brand-300">to your door.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-200 sm:text-lg">
              FreshBasket is on a mission to simplify grocery shopping for every household in Bangladesh.
            </p>
          </div>
        </section>

        {/* Our story */}
        <section className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Our story</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-700">
              Founded in 2024, FreshBasket started with a simple observation: grocery shopping was taking too much time away from what truly matters—family. We set out to build a platform that doesn&apos;t just sell products, but sells time and peace of mind.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-700">
              Today, we serve thousands of families across the major cities, partnering with local specialists to bring you the finest meat, fish, and farm-fresh vegetables within an hour of your order.
            </p>
            <dl className="mt-8 grid grid-cols-3 gap-4">
              {statItems.map(item => (
                // flex-col-reverse shows the number above its label while keeping <dt> before <dd>
                <div key={item.label} className="flex flex-col-reverse rounded-xl border border-slate-200 bg-white p-4">
                  <dt className="mt-1 text-sm text-slate-500">{item.label}</dt>
                  <dd className="text-2xl font-bold text-brand-700 sm:text-3xl">
                    {item.value === null ? '…' : formatStat(item.value, '0')}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative h-72 overflow-hidden rounded-2xl shadow-md sm:h-[420px]">
            <Image
              src="/images/team.png"
              alt="The FreshBasket grocery team"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </section>

        {/* Values */}
        <section>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">What we stand for</h2>
            <p className="mt-3 text-base text-slate-600">
              At FreshBasket, our values guide every decision we make, from the farmers we choose to the way we deliver.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-6">
            {values.map(v => (
              <motion.div
                key={v.title}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                  {v.icon}
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section className="relative overflow-hidden rounded-2xl bg-brand-700 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to experience freshness?</h2>
            <p className="mx-auto mt-3 max-w-lg text-base text-brand-50">
              Join thousands of happy families who have made FreshBasket their primary grocery partner.
            </p>
            <Button href="/" variant="secondary" size="lg" className="mt-6 border-white text-brand-700 focus-visible:outline-white">
              Start shopping now
            </Button>
          </div>
          {/* Decorative circles */}
          <div aria-hidden="true" className="absolute -left-12 -top-12 h-64 w-64 rounded-full bg-brand-600/40" />
          <div aria-hidden="true" className="absolute -bottom-12 -right-12 h-96 w-96 rounded-full bg-brand-600/40" />
        </section>
      </div>
    </div>
  );
}

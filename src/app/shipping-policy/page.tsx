"use client";

import Link from "next/link";
import { Truck, Package, Clock, RefreshCw, HelpCircle, ArrowRight } from "lucide-react";

export default function ShippingPolicyPage() {
  const policies = [
    {
      icon: <Truck size={22} className="text-brand-600" aria-hidden="true" />,
      title: "Delivery areas",
      content: "We currently deliver to all major areas of Dhaka, Chittagong, and Sylhet. If you are outside these areas, we're coming soon! Check your zip code at checkout to confirm availability."
    },
    {
      icon: <Package size={22} className="text-brand-600" aria-hidden="true" />,
      title: "Delivery fees",
      content: "Standard delivery is ৳60. Orders over ৳500 qualify for FREE delivery. Special rush delivery (within 30 mins) is available for ৳100 in selected zones."
    },
    {
      icon: <Clock size={22} className="text-brand-600" aria-hidden="true" />,
      title: "Delivery slots",
      content: "Instant Delivery: Within 60 minutes. Scheduled Delivery: Choose any 2-hour slot from 8:00 AM to 10:00 PM, up to 7 days in advance."
    },
    {
      icon: <RefreshCw size={22} className="text-brand-600" aria-hidden="true" />,
      title: "Return policy",
      content: "If you are not satisfied with the quality of any product, you can return it to the delivery person immediately for an instant refund or replacement. No questions asked."
    }
  ];

  const helpLinks = [
    {
      icon: <HelpCircle size={22} className="text-brand-600" aria-hidden="true" />,
      title: "Have more questions?",
      text: "Our FAQ section covers detailed ordering and payment instructions.",
      linkLabel: "Read our FAQs",
      href: "/faq",
    },
    {
      icon: <RefreshCw size={22} className="text-brand-600" aria-hidden="true" />,
      title: "Damaged goods?",
      text: "Contact our 24/7 support line for immediate assistance with any issues.",
      linkLabel: "Contact support",
      href: "/contact",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Page title */}
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Customer service</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Shipping &amp; returns</h1>
          <p className="mt-3 text-base text-slate-600">
            Everything you need to know about how we get fresh groceries to your door and our commitment to quality.
          </p>
        </header>

        <div className="mt-8 grid max-w-4xl gap-4 sm:mt-10 md:grid-cols-2">
          {policies.map(p => (
            <section key={p.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
                {p.icon}
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">{p.title}</h2>
              <p className="mt-2 text-base leading-relaxed text-slate-700">{p.content}</p>
            </section>
          ))}
        </div>

        {/* Helpful links */}
        <div className="mt-8 grid max-w-4xl gap-4 md:grid-cols-2">
          {helpLinks.map(item => (
            <div key={item.href} className="flex items-start gap-4 rounded-2xl border border-brand-100 bg-brand-50 p-5 sm:p-6">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white">
                {item.icon}
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{item.text}</p>
                <Link
                  href={item.href}
                  className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-lg text-sm font-semibold text-brand-700 hover:text-brand-800"
                >
                  {item.linkLabel} <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

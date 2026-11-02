"use client";

import { Lock, Eye, ShieldCheck, Database, Bell } from "lucide-react";

export default function PrivacyPage() {
  const sections = [
    {
      icon: <Database size={22} className="text-brand-600" aria-hidden="true" />,
      title: "Data collection",
      content: "We collect information you provide directly to us, such as when you create an account, place an order, or contact customer support. This includes your name, email, phone number, and delivery address."
    },
    {
      icon: <Eye size={22} className="text-brand-600" aria-hidden="true" />,
      title: "How we use data",
      content: "Your data is used solely to process orders, improve our services, and communicate with you about your account or promotional offers. We never sell your personal information to third parties."
    },
    {
      icon: <Lock size={22} className="text-brand-600" aria-hidden="true" />,
      title: "Security measures",
      content: "We implement industry-standard security measures, including 256-bit SSL encryption, to protect your personal and payment information from unauthorized access."
    },
    {
      icon: <Bell size={22} className="text-brand-600" aria-hidden="true" />,
      title: "Your choices",
      content: "You can update your account information at any time. You may also opt-out of promotional emails by following the instructions in those messages or by contacting us directly."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Page title */}
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Legal</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Privacy policy</h1>
          <p className="mt-3 text-base text-slate-600">
            Your privacy is our priority. Learn how we handle your data with transparency and care.
          </p>
          <p className="mt-2 text-sm text-slate-500">Last updated: April 08, 2026</p>
        </header>

        <div className="mt-8 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:mt-10 sm:p-10">
          <div className="space-y-8">
            {sections.map(s => (
              <section key={s.title} className="flex gap-4 sm:gap-5">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50">
                  {s.icon}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{s.title}</h2>
                  <p className="mt-2 text-base leading-relaxed text-slate-700">{s.content}</p>
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="mt-6 flex max-w-3xl items-start gap-4 rounded-2xl border border-brand-100 bg-brand-50 p-6">
          <ShieldCheck size={28} className="flex-shrink-0 text-brand-700" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-brand-900">Committed to data safety</h2>
            <p className="mt-1 text-sm leading-relaxed text-brand-800">
              FreshBasket complies with all relevant data protection regulations in Bangladesh to ensure your information is handled legally and ethically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

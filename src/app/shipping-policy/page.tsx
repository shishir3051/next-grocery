"use client";

import { motion } from "framer-motion";
import { Truck, Package, Clock, ShieldCheck, MapPin, RefreshCw, HelpCircle } from "lucide-react";

export default function ShippingPolicyPage() {
  const policies = [
    {
      icon: <Truck className="text-teal-600" />,
      title: "Delivery Areas",
      content: "We currently deliver to all major areas of Dhaka, Chittagong, and Sylhet. If you are outside these areas, we're coming soon! Check your zip code at checkout to confirm availability."
    },
    {
      icon: <Package className="text-teal-600" />,
      title: "Delivery Fees",
      content: "Standard delivery is ৳60. Orders over ৳500 qualify for FREE delivery. Special rush delivery (within 30 mins) is available for ৳100 in selected zones."
    },
    {
      icon: <Clock className="text-teal-600" />,
      title: "Delivery Slots",
      content: "Instant Delivery: Within 60 minutes. Scheduled Delivery: Choose any 2-hour slot from 8:00 AM to 10:00 PM, up to 7 days in advance."
    },
    {
      icon: <RefreshCw className="text-teal-600" />,
      title: "Return Policy",
      content: "If you are not satisfied with the quality of any product, you can return it to the delivery person immediately for an instant refund or replacement. No questions asked."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-100 py-24 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 tracking-tight">Shipping & <span className="text-teal-600">Returns</span></h1>
        <p className="text-slate-500 max-w-xl mx-auto font-medium">
          Everything you need to know about how we get fresh groceries to your door and our commitment to quality.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-20 divide-y divide-slate-100">
        {policies.map((p, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="py-12 flex flex-col md:flex-row gap-8 items-start"
          >
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center flex-shrink-0">
              {p.icon}
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-slate-800">{p.title}</h2>
              <p className="text-lg text-slate-500 leading-relaxed font-medium">
                {p.content}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Helpful Links */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
             <HelpCircle className="text-teal-600 mb-4" size={32} />
             <h3 className="text-lg font-bold text-slate-800 mb-2">Have more questions?</h3>
             <p className="text-sm text-slate-500 mb-6">Our FAQ section covers detailed ordering and payment instructions.</p>
             <button className="text-teal-600 font-bold text-sm underline underline-offset-4">Read our FAQs</button>
          </div>
          <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
             <RefreshCw className="text-teal-600 mb-4" size={32} />
             <h3 className="text-lg font-bold text-slate-800 mb-2">Damaged Goods?</h3>
             <p className="text-sm text-slate-500 mb-6">Contact our 24/7 support line for immediate assistance with any issues.</p>
             <button className="text-teal-600 font-bold text-sm underline underline-offset-4">Contact Support</button>
          </div>
        </div>
      </div>
    </div>
  );
}

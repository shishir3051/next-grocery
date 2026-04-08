"use client";

import { motion } from "framer-motion";
import { Lock, Eye, ShieldCheck, Database, Bell } from "lucide-react";

export default function PrivacyPage() {
  const sections = [
    {
      icon: <Database size={24} className="text-teal-600" />,
      title: "Data Collection",
      content: "We collect information you provide directly to us, such as when you create an account, place an order, or contact customer support. This includes your name, email, phone number, and delivery address."
    },
    {
      icon: <Eye size={24} className="text-teal-600" />,
      title: "How We Use Data",
      content: "Your data is used solely to process orders, improve our services, and communicate with you about your account or promotional offers. We never sell your personal information to third parties."
    },
    {
      icon: <Lock size={24} className="text-teal-600" />,
      title: "Security Measures",
      content: "We implement industry-standard security measures, including 256-bit SSL encryption, to protect your personal and payment information from unauthorized access."
    },
    {
      icon: <Bell size={24} className="text-teal-600" />,
      title: "Your Choices",
      content: "You can update your account information at any time. You may also opt-out of promotional emails by following the instructions in those messages or by contacting us directly."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-100 py-24 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 tracking-tight">Privacy <span className="text-teal-600">Policy</span></h1>
        <p className="text-slate-500 max-w-xl mx-auto font-medium">
          Your privacy is our priority. Learn how we handle your data with transparency and care.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="space-y-16">
          {sections.map((s, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-8 group"
            >
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center flex-shrink-0 group-hover:border-teal-200 transition-all">
                {s.icon}
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-slate-800">{s.title}</h2>
                <p className="text-lg text-slate-500 leading-relaxed font-medium">
                  {s.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 p-12 bg-teal-600 rounded-[3rem] text-white space-y-6 text-center">
           <ShieldCheck size={48} className="mx-auto opacity-50" />
           <h3 className="text-2xl font-black italic">Committed to Data Safety</h3>
           <p className="max-w-md mx-auto text-teal-50 opacity-90 font-medium">
             FreshBasket complies with all relevant data protection regulations in Bangladesh to ensure your information is handled legally and ethically.
           </p>
           <div className="pt-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em]">Last Updated: April 08, 2026</p>
           </div>
        </div>
      </div>
    </div>
  );
}

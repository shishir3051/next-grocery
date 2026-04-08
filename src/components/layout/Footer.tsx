"use client";

import Link from "next/link";
import { 
  PhoneCall, 
  Mail, 
  MapPin, 
  Smartphone,
  ChevronRight,
  ShieldCheck,
  CreditCard
} from "lucide-react";
import { 
  IconBrandFacebook, 
  IconBrandTwitter, 
  IconBrandInstagram, 
  IconBrandYoutube 
} from "@tabler/icons-react";

const footerLinks = {
  company: [
    { name: "About FreshBasket", href: "/about" },
    { name: "Store Locations", href: "/locations" },
    { name: "Latest News", href: "/news" }
  ],
  customerService: [
    { name: "Contact Us", href: "/contact" },
    { name: "FAQ", href: "/faq" },
    { name: "Shipping & Returns", href: "/shipping-policy" },
    { name: "Terms & Conditions", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" }
  ],
  myAccount: [
    { name: "My Profile", href: "/profile" },
    { name: "Order History", href: "/orders" },
    { name: "My Wishlist", href: "/wishlist" }
  ]
};

export default function Footer() {
  return (
    <footer className="bg-slate-50 pt-20 pb-10 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Column 1: Brand & Contact */}
          <div className="space-y-6 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20">
                <span className="text-white text-xl font-black">F</span>
              </div>
              <span className="text-2xl font-black text-slate-800 tracking-tight">FreshBasket</span>
            </Link>
            <p className="text-sm text-slate-500 font-bold leading-relaxed">
              "Always Here for You" — Delivering fresh groceries to your doorstep with love and care.
            </p>
            <div className="space-y-3 pt-2">
              <a href="tel:16469" className="flex items-center gap-3 text-slate-700 hover:text-teal-600 transition-colors">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 flex-shrink-0">
                  <PhoneCall size={18} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Hotline</p>
                  <p className="text-lg font-black tracking-tight">16469</p>
                </div>
              </a>
              <a href="mailto:queries@freshbasket.com" className="flex items-center gap-3 text-slate-700 hover:text-teal-600 transition-colors">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 flex-shrink-0">
                  <Mail size={18} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Email</p>
                  <p className="text-sm font-bold truncate">support@freshbasket.com</p>
                </div>
              </a>
            </div>
          </div>

          {/* Column 2: Information */}
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Information</h4>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm font-bold text-slate-600 hover:text-teal-600 flex items-center gap-1 group transition-all">
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-teal-500" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Customer Service */}
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Customer Service</h4>
            <ul className="space-y-4">
              {footerLinks.customerService.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm font-bold text-slate-600 hover:text-teal-600 flex items-center gap-1 group transition-all">
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-teal-500" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Account */}
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">My Account</h4>
            <ul className="space-y-4">
              {footerLinks.myAccount.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm font-bold text-slate-600 hover:text-teal-600 flex items-center gap-1 group transition-all">
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-teal-500" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Payment & Social */}
          <div className="space-y-10">
            <div>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Pay With</h4>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
                   <span className="text-[10px] font-black italic text-[#E2136E]">bKash</span>
                </div>
                <div className="px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
                   <span className="text-[10px] font-black italic text-[#F7941D]">Nagad</span>
                </div>
                <div className="px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
                   <span className="text-[10px] font-black text-blue-800">VISA</span>
                </div>
                <div className="px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
                   <span className="text-[10px] font-black text-red-600">MasterCard</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Follow Us</h4>
              <div className="flex items-center gap-3">
                {[IconBrandFacebook, IconBrandTwitter, IconBrandInstagram, IconBrandYoutube].map((Icon, i) => (
                  <button key={i} className="w-10 h-10 bg-white border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-200 rounded-xl flex items-center justify-center transition-all shadow-sm">
                    <Icon size={18} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Download App</h4>
               <div className="flex flex-col gap-2">
                  <button className="flex items-center gap-3 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all">
                    <Smartphone size={20} />
                    <div className="text-left">
                      <p className="text-[8px] font-bold uppercase opacity-60 leading-none">Get it on</p>
                      <p className="text-xs font-black leading-none mt-1 uppercase tracking-wider">Play Store</p>
                    </div>
                  </button>
               </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm font-bold text-slate-400">
            Copyright © {new Date().getFullYear()} <span className="text-slate-600">FreshBasket Ltd.</span> All Rights Reserved.
          </p>
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest italic">100% Secure Shopping Environment</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

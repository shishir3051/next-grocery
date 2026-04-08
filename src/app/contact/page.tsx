"use client";

import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Send, MessageCircle, Clock, Loader2 } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* Contact Information Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-black text-slate-800 leading-tight">Get in <span className="text-teal-600">touch.</span></h1>
              <p className="text-slate-500 font-medium leading-relaxed">
                Have a question about an order, delivery, or a specific product? We're here to help!
              </p>
            </div>

            <div className="space-y-6 pt-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 flex-shrink-0">
                  <Phone size={20} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Call center</p>
                  <p className="text-lg font-black text-slate-800">16469</p>
                  <p className="text-sm text-slate-500 font-medium">Available 8am - 10pm</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 flex-shrink-0">
                  <Mail size={20} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">General inquiries</p>
                  <p className="text-lg font-black text-slate-800">support@freshbasket.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 flex-shrink-0">
                  <MapPin size={20} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">Corporate Office</p>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed">
                    Level 14, Fresh Tower<br />
                    Plot 22, Road 4, Banani C/A<br />
                    Dhaka 1213, Bangladesh
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-teal-50 rounded-3xl border border-teal-100 inline-flex items-start gap-3">
              <Clock size={18} className="text-teal-600 mt-1" />
              <div>
                <p className="text-sm font-bold text-teal-900">Live Support Hours</p>
                <p className="text-xs font-medium text-teal-600">Everyday: 08:30 AM - 10:30 PM (BST)</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-100">
              {isSent ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 space-y-6"
                >
                  <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto">
                    <Send className="text-teal-600 w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Message Sent Successfully!</h2>
                  <p className="text-slate-500 font-medium max-w-sm mx-auto">
                    Thank you for reaching out. Our team will get back to you at your email address within the next 2 hours.
                  </p>
                  <button 
                    onClick={() => setIsSent(false)}
                    className="px-8 py-3 text-teal-600 font-bold border border-teal-100 rounded-xl hover:bg-teal-50 transition-all"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        required
                        type="text" 
                        placeholder="John Doe"
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      <input 
                        required
                        type="email" 
                        placeholder="john@example.com"
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                    <select className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm appearance-none focus:ring-2 focus:ring-teal-500 transition-all outline-none">
                      <option>Order Difficulty</option>
                      <option>Delivery Delay</option>
                      <option>Product Quality Issue</option>
                      <option>Account Support</option>
                      <option>Other / Feedback</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Message</label>
                    <textarea 
                      required
                      rows={5}
                      placeholder="How can we help you today?"
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none resize-none"
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-teal-600 text-white font-black rounded-2xl shadow-xl hover:bg-teal-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        <Send size={18} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Send, Clock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";

/* Shared form styles (see docs/design/DESIGN_SYSTEM.md, "Inputs") */
const labelClass = "block text-sm font-medium text-slate-700";
const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

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
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">

          {/* Contact information */}
          <div className="space-y-8 lg:col-span-1">
            <header>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Contact</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Get in touch</h1>
              <p className="mt-3 text-base text-slate-600">
                Have a question about an order, delivery, or a specific product? We&apos;re here to help.
              </p>
            </header>

            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                  <Phone size={20} className="text-brand-600" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs text-slate-500">Call centre</p>
                  <a href="tel:16469" className="rounded-lg text-lg font-bold text-slate-900 hover:text-brand-700">16469</a>
                  <p className="text-sm text-slate-500">Available 8am – 10pm</p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                  <Mail size={20} className="text-brand-600" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">General inquiries</p>
                  <a
                    href="mailto:support@freshbasket.com"
                    className="break-all rounded-lg text-base font-semibold text-slate-900 hover:text-brand-700"
                  >
                    support@freshbasket.com
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                  <MapPin size={20} className="text-brand-600" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs text-slate-500">Corporate office</p>
                  <address className="text-sm not-italic leading-relaxed text-slate-700">
                    Level 14, Fresh Tower<br />
                    Plot 22, Road 4, Banani C/A<br />
                    Dhaka 1213, Bangladesh
                  </address>
                </div>
              </li>
            </ul>

            <div className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4">
              <Clock size={18} className="mt-0.5 flex-shrink-0 text-brand-700" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-brand-900">Live support hours</p>
                <p className="text-sm text-brand-800">Every day: 08:30 AM – 10:30 PM (BST)</p>
              </div>
            </div>
          </div>

          {/* Contact form (submission is simulated; no backend yet) */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {isSent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-10 text-center"
                  role="status"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
                    <CheckCircle2 className="h-8 w-8 text-success-600" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-slate-900">Message sent</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
                    Thank you for reaching out. Our team will get back to you at your email address within the next 2 hours.
                  </p>
                  <Button variant="secondary" onClick={() => setIsSent(false)} className="mt-6">
                    Send another message
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="text-lg font-semibold text-slate-900">Send us a message</h2>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="contact-name" className={labelClass}>Full name</label>
                      <input
                        id="contact-name"
                        name="name"
                        required
                        type="text"
                        autoComplete="name"
                        placeholder="John Doe"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className={labelClass}>Email address</label>
                      <input
                        id="contact-email"
                        name="email"
                        required
                        type="email"
                        autoComplete="email"
                        placeholder="john@example.com"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className={labelClass}>Subject</label>
                    <select id="contact-subject" name="subject" className={inputClass}>
                      <option>Order difficulty</option>
                      <option>Delivery delay</option>
                      <option>Product quality issue</option>
                      <option>Account support</option>
                      <option>Other / feedback</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className={labelClass}>Message</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={5}
                      placeholder="How can we help you today?"
                      className={`${inputClass} resize-y`}
                    />
                  </div>

                  <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
                    {!isSubmitting && <Send size={18} aria-hidden="true" />}
                    {isSubmitting ? "Sending…" : "Send message"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Send, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";

const SUBJECTS = ["Order difficulty", "Delivery delay", "Product quality issue", "Account support", "Other / feedback"];
const MAX_MESSAGE = 3000;
const EMPTY_FORM = { name: "", email: "", phone: "", subject: SUBJECTS[0], orderRef: "", message: "", website: "" };

/* Shared form styles (see docs/design/DESIGN_SYSTEM.md, "Inputs") */
const labelClass = "block text-sm font-medium text-slate-700";
const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export default function ContactPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentReference, setSentReference] = useState<string | null>(null);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);

  // The error banner sits at the top of the form; bring it into view when it appears.
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  // Signed-in customers don't have to type their name and email: until they edit a
  // field, it shows their account details.
  const [edited, setEdited] = useState({ name: false, email: false });
  const values = {
    ...form,
    name: edited.name ? form.name : form.name || session?.user?.name || "",
    email: edited.email ? form.email : form.email || session?.user?.email || "",
  };

  const update = (field: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      if (field === "name" || field === "email") setEdited(s => ({ ...s, [field]: true }));
      setForm(f => ({ ...f, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "We couldn't send your message. Please try again.");
      setSentReference(data.reference);
      setForm({ ...EMPTY_FORM, name: values.name, email: values.email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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

          {/* Contact form: POST /api/contact → saved for Admin → Messages and emailed to the store */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              {sentReference ? (
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
                    Thank you for reaching out. Your reference is{" "}
                    <span className="font-semibold text-slate-900">{sentReference}</span>. We&apos;ll reply to your email address, usually within a few hours.
                  </p>
                  <Button variant="secondary" onClick={() => setSentReference(null)} className="mt-6">
                    Send another message
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="relative space-y-5">
                  <h2 className="text-lg font-semibold text-slate-900">Send us a message</h2>

                  {error && (
                    <div ref={errorRef} role="alert" className="flex items-start gap-2 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      {error}
                    </div>
                  )}

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="contact-name" className={labelClass}>Full name</label>
                      <input
                        id="contact-name"
                        name="name"
                        required
                        maxLength={80}
                        type="text"
                        autoComplete="name"
                        placeholder="John Doe"
                        value={values.name}
                        onChange={update("name")}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className={labelClass}>Email address</label>
                      <input
                        id="contact-email"
                        name="email"
                        required
                        maxLength={254}
                        type="email"
                        autoComplete="email"
                        placeholder="john@example.com"
                        value={values.email}
                        onChange={update("email")}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="contact-phone" className={labelClass}>Phone <span className="font-normal text-slate-400">(optional)</span></label>
                      <input
                        id="contact-phone"
                        name="phone"
                        maxLength={30}
                        type="tel"
                        autoComplete="tel"
                        placeholder="01XXXXXXXXX"
                        value={values.phone}
                        onChange={update("phone")}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-subject" className={labelClass}>Subject</label>
                      <select id="contact-subject" name="subject" value={values.subject} onChange={update("subject")} className={inputClass}>
                        {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {(values.subject === "Order difficulty" || values.subject === "Delivery delay" || values.subject === "Product quality issue") && (
                    <div>
                      <label htmlFor="contact-order" className={labelClass}>Order number <span className="font-normal text-slate-400">(optional)</span></label>
                      <input
                        id="contact-order"
                        name="orderRef"
                        maxLength={40}
                        type="text"
                        placeholder="From My Orders"
                        value={values.orderRef}
                        onChange={update("orderRef")}
                        className={inputClass}
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="contact-message" className={labelClass}>Message</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      minLength={10}
                      maxLength={MAX_MESSAGE}
                      rows={5}
                      placeholder="How can we help you today?"
                      value={values.message}
                      onChange={update("message")}
                      className={`${inputClass} resize-y`}
                    />
                    <p className="mt-1 text-right text-xs text-slate-500 tabular-nums">{values.message.length} / {MAX_MESSAGE}</p>
                  </div>

                  {/* Spam trap: hidden from people and screen readers; bots that fill it are ignored. */}
                  <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                    <label htmlFor="contact-website">Website</label>
                    <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={update("website")} />
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

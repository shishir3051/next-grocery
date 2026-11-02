"use client";

import { motion } from "framer-motion";
import { HelpCircle, ChevronDown, Truck, CreditCard, RotateCcw, MessageCircle, Phone } from "lucide-react";
import { useId, useState } from "react";
import ChatWidget from "@/components/ui/ChatWidget";
import Button from "@/components/ui/Button";

const faqs = [
  {
    category: "General",
    icon: <HelpCircle className="text-brand-600" size={20} aria-hidden="true" />,
    questions: [
      {
        q: "What is FreshBasket's delivery hour?",
        a: "We deliver every day from 8:00 AM to 10:00 PM. Orders placed after 9:30 PM will be delivered the next morning."
      },
      {
        q: "In which areas do you deliver?",
        a: "Currently, we serve all major areas of Dhaka, Chittagong, and Sylhet. We are rapidly expanding to other cities."
      }
    ]
  },
  {
    category: "Ordering & delivery",
    icon: <Truck className="text-brand-600" size={20} aria-hidden="true" />,
    questions: [
      {
        q: "How much is the delivery fee?",
        a: "Our standard delivery fee is ৳60. However, orders over ৳500 qualify for FREE delivery!"
      },
      {
        q: "How long does it take to deliver?",
        a: "We aim to deliver within 60 minutes of order confirmation. You can also schedule a specific slot for up to 7 days in advance."
      }
    ]
  },
  {
    category: "Payments",
    icon: <CreditCard className="text-brand-600" size={20} aria-hidden="true" />,
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept Cash on Delivery (COD), bKash, Nagad, and all major Debit/Credit cards (Visa, Mastercard)."
      }
    ]
  },
  {
    category: "Returns & quality",
    icon: <RotateCcw className="text-brand-600" size={20} aria-hidden="true" />,
    questions: [
      {
        q: "What if I receive a damaged product?",
        a: "Your satisfaction is our priority. If any item is damaged or not fresh, please inform the delivery assistant immediately or call our hotline. We will replace it or refund you instantly."
      }
    ]
  }
];

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="border-b border-slate-100 last:border-0">
      <h3>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls={isOpen ? panelId : undefined}
          className="group flex w-full items-center justify-between gap-4 rounded-lg py-4 text-left"
        >
          <span className="text-base font-semibold text-slate-900 transition-colors group-hover:text-brand-700">{question}</span>
          <ChevronDown
            size={20}
            aria-hidden="true"
            className={`flex-shrink-0 transition-transform ${isOpen ? "rotate-180 text-brand-600" : "text-slate-400"}`}
          />
        </button>
      </h3>
      {isOpen && (
        <motion.div
          id={panelId}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="overflow-hidden"
        >
          <p className="pb-4 text-sm leading-relaxed text-slate-600 sm:text-base">{answer}</p>
        </motion.div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Page title */}
        <header className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Help centre</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">How can we help?</h1>
          <p className="mt-3 text-base text-slate-600">
            Browse our most frequently asked questions. Can&apos;t find what you&apos;re looking for? Reach out to our support team.
          </p>
        </header>

        <div className="mt-8 max-w-3xl space-y-4 sm:mt-10 sm:space-y-6">
          {faqs.map(category => (
            <section key={category.category} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
                {category.icon}
                <h2 className="text-base font-semibold text-slate-900">{category.category}</h2>
              </div>
              <div className="px-5 sm:px-6">
                {category.questions.map(item => (
                  <FAQItem key={item.q} question={item.q} answer={item.a} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Still have questions */}
        <section className="mt-10 max-w-3xl rounded-2xl bg-brand-700 px-6 py-10 text-center text-white sm:mt-14 sm:px-10">
          <h2 className="text-xl font-bold sm:text-2xl">Still have questions?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-brand-50 sm:text-base">
            Our customer support team is available 14 hours a day to assist you.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => setIsChatOpen(true)}
              className="w-full border-white text-brand-700 focus-visible:outline-white sm:w-auto"
            >
              <MessageCircle size={18} aria-hidden="true" /> Live chat
            </Button>
            <a
              href="tel:16469"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/40 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-white sm:w-auto"
            >
              <Phone size={18} aria-hidden="true" /> Call 16469
            </a>
          </div>
        </section>
      </div>

      <ChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}

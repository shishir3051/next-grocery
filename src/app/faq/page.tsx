"use client";

import { motion } from "framer-motion";
import { HelpCircle, ChevronDown, ChevronUp, Package, Truck, CreditCard, RotateCcw } from "lucide-react";
import { useState } from "react";
import ChatWidget from "@/components/ui/ChatWidget";

const faqs = [
  {
    category: "General",
    icon: <HelpCircle className="text-teal-600" size={20} />,
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
    category: "Ordering & Delivery",
    icon: <Truck className="text-teal-600" size={20} />,
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
    icon: <CreditCard className="text-teal-600" size={20} />,
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept Cash on Delivery (COD), bKash, Nagad, and all major Debit/Credit cards (Visa, Mastercard)."
      }
    ]
  },
  {
    category: "Returns & Quality",
    icon: <RotateCcw className="text-teal-600" size={20} />,
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

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left hover:text-teal-600 transition-colors group"
      >
        <span className="text-lg font-bold text-slate-800 group-hover:text-teal-600">{question}</span>
        {isOpen ? <ChevronUp size={20} className="text-teal-600" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>
      {isOpen && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="pb-6 text-slate-500 leading-relaxed font-medium"
        >
          {answer}
        </motion.div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 tracking-tight">How can we <span className="text-teal-600">help?</span></h1>
        <p className="text-slate-500 max-w-xl mx-auto font-medium">
          Search our most frequently asked questions. Can't find what you're looking for? Reach out to our support team.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
        {faqs.map((category, idx) => (
          <div key={idx} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 p-6 flex items-center gap-3 border-b border-slate-100">
              {category.icon}
              <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">{category.category}</h2>
            </div>
            <div className="px-8">
              {category.questions.map((item, i) => (
                <FAQItem key={i} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Still have questions */}
      <div className="pb-20 px-4">
        <div className="max-w-4xl mx-auto bg-teal-600 rounded-[2.5rem] p-10 text-center text-white space-y-6">
          <h2 className="text-2xl font-black italic">Still have questions?</h2>
          <p className="text-teal-50 opacity-90 font-medium">Our customer support team is available 14 hours a day to assist you.</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={() => setIsChatOpen(true)}
              className="px-8 py-4 bg-white text-teal-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
            >
              Live Chat
            </button>
            <a href="tel:16469" className="px-8 py-4 bg-teal-500 font-bold rounded-2xl hover:bg-teal-400 transition-all border border-teal-400">
              Call 16469
            </a>
          </div>
        </div>
      </div>

      <ChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}

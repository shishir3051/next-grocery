"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Send, Bot } from "lucide-react";
import { getEffectivePrice } from "@/lib/pricing";
import Button from "@/components/ui/Button";

// Ids that tie the dialog to its title and the input to its label.
const TITLE_ID = "chat-widget-title";
const INPUT_ID = "chat-widget-input";

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function ChatWidget({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! How can I help you with FreshBasket today?", sender: 'bot', timestamp: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Move keyboard focus into the chat when it opens, and hand it back to whatever
  // opened it (e.g. the launcher button) when it closes, so focus is never lost to <body>.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => {
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [isOpen]);

  // Escape closes the chat (same onClose the close button uses).
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now(), text: input, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const responseText = await getBotResponse(input);
      setIsTyping(false);
      const botMsg: Message = { 
        id: Date.now() + 1, 
        text: responseText, 
        sender: 'bot', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setIsTyping(false);
      const botMsg: Message = { 
        id: Date.now() + 1, 
        text: "I'm having trouble connecting to our store right now. Please try again in a moment!", 
        sender: 'bot', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, botMsg]);
    }
  };

  const getBotResponse = async (text: string) => {
    const t = text.toLowerCase();
    
    // 1. Static Keyword Triggers
    if (t.includes("delivery")) return "We aim to deliver within 60 minutes. You can track your order in the 'Orders' section!";
    if (t.includes("payment")) return "We accept Cash on Delivery, bKash, Nagad, and all major cards.";
    if (t.includes("refund") || t.includes("return")) return "You can return any fresh item to the delivery person immediately for an instant refund.";
    
    // 2. Real-time Product Search with Keyword Extraction
    try {
      // Strip filler phrases for better matching
      let query = t
        .replace(/i want to buy|do you have|show me|can i get|is there|looking for|available|please/gi, "")
        .trim();
      
      if (query.length < 2) query = t; // Fallback to full text if query becomes too short

      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        const products = data?.products || [];
        
        if (products.length > 0) {
          const p = products[0];
          const finalPrice = getEffectivePrice(p);
          
          if (products.length === 1) {
            return `Yes! We have "${p.name}" in stock for ৳${finalPrice} per ${p.unit}. Would you like to add it to your cart?`;
          } else {
            return `I found matching items! The best match is "${p.name}" at ৳${finalPrice}. You can also find other varieties in our search results!`;
          }
        }
      }
    } catch (e) {
      console.error("Chat product search failed", e);
    }

    // 3. Fallback
    // There is no live agent behind this chat, so point people to the real support channels.
    return "Sorry, I couldn't find an answer to that. Please visit our Contact page or email our support team, and we'll get back to you as soon as we can.";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-labelledby={TITLE_ID}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          // Full width minus a 16px gutter on phones, a 400px panel from `sm` up.
          className="fixed inset-x-4 bottom-4 z-[2000] flex h-[min(560px,calc(100dvh-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[400px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 bg-brand-600 px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/15" aria-hidden="true">
                <Bot size={22} />
              </span>
              <div className="min-w-0">
                <h2 id={TITLE_ID} className="text-base font-semibold leading-tight">Fresh Support</h2>
                <p className="text-xs text-brand-50">Instant answers about orders and products</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chat"
              // The global focus ring is brand-600, invisible on this header, so use white here.
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/15 focus-visible:outline-white"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {/* Messages: role="log" + aria-live so screen readers announce new replies */}
          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-5"
          >
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <motion.div
                  key={m.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && <BotAvatar />}
                  <div
                    className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isUser
                        ? 'rounded-br-lg bg-brand-600 text-white'
                        : 'rounded-bl-lg border border-slate-200 bg-white text-slate-700 shadow-sm'
                    }`}
                  >
                    <span className="sr-only">{isUser ? 'You: ' : 'Fresh Support: '}</span>
                    {m.text}
                  </div>
                </motion.div>
              );
            })}
            {isTyping && (
              <div className="flex items-end gap-2" role="status">
                <BotAvatar />
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-lg border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
                  <span className="sr-only">Fresh Support is typing</span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" aria-hidden="true" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]" aria-hidden="true" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.4s]" aria-hidden="true" />
                </div>
              </div>
            )}
          </div>

          {/* Footer input */}
          <div className="border-t border-slate-200 bg-white p-3">
            <label htmlFor={INPUT_ID} className="sr-only">Type your question</label>
            <div className="flex items-center gap-2">
              <input
                id={INPUT_ID}
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your question..."
                autoComplete="off"
                className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim()}
                aria-label="Send message"
                className="w-11 flex-shrink-0 px-0"
              >
                <Send size={18} aria-hidden="true" />
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-500">
              Need more help?{' '}
              <Link href="/contact" className="font-medium text-brand-700 underline-offset-2 hover:underline">
                Contact our team
              </Link>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Small round avatar shown next to every assistant message. */
function BotAvatar() {
  return (
    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700" aria-hidden="true">
      <Bot size={16} />
    </span>
  );
}

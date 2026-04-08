"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, User, Bot, Loader2 } from "lucide-react";

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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
          const discount = Number(p.discountPrice) || 0;
          const finalPrice = p.price - discount;
          
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
    return "Thank you for reaching out! I couldn't find a specific answer for that, but a human agent will be with you shortly to help.";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-6 right-6 z-[2000] w-[350px] md:w-[400px] h-[500px] bg-white rounded-[2.5rem] shadow-2xl shadow-teal-900/10 border border-slate-100 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-teal-600 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Fresh Support</h3>
                <p className="text-[10px] text-teal-100">Usually responds in minutes</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            {messages.map((m) => (
              <motion.div 
                key={m.id}
                initial={{ opacity: 0, x: m.sender === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium shadow-sm ${
                  m.sender === 'user' 
                    ? 'bg-teal-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                }`}>
                  {m.text}
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-slate-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-teal-300 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Footer Input */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your question..."
                className="w-full pl-6 pr-14 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim()}
                className="absolute right-2 p-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all disabled:opacity-30"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

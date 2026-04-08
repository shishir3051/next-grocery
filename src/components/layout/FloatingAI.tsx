"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Bot, Sparkles, X } from "lucide-react";
import ChatWidget from "../ui/ChatWidget";

export default function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end gap-3 pointer-events-none">
        
        {/* Text Bubble */}
        <AnimatePresence>
          {!isOpen && !isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className="bg-[#1a4d2e] text-white px-6 py-3 rounded-2xl rounded-br-none shadow-2xl border border-white/10 mb-2 relative"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight whitespace-nowrap">Ask Fresh AI</span>
              </div>
              {/* Triangle Tail */}
              <div className="absolute bottom-[-8px] right-0 w-4 h-4 bg-[#1a4d2e] transform rotate-45 border-r border-b border-white/10" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Icon */}
        <motion.button
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => setIsOpen(prev => !prev)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`pointer-events-auto w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 overflow-hidden relative ${
            isOpen ? 'bg-slate-900 border-2 border-white/20' : 'bg-gradient-to-br from-teal-500 to-emerald-600 shadow-teal-500/30'
          }`}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <X className="text-white" size={28} />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                className="relative"
              >
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                   <Bot className="text-white" size={28} />
                </div>
                {/* Notification Badge */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Animated pulsing rings */}
          {!isOpen && (
            <div className="absolute inset-0">
               <div className="absolute inset-0 border-4 border-white/30 rounded-full animate-ping [animation-duration:2s]" />
               <div className="absolute inset-0 border-4 border-white/20 rounded-full animate-ping [animation-duration:3s]" />
            </div>
          )}
        </motion.button>
      </div>

      <ChatWidget isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

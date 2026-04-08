"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Info } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = 'warning'
}: ConfirmationModalProps) {
  
  const colors = {
    danger: "bg-red-50 text-red-600 ring-red-100",
    warning: "bg-amber-50 text-amber-600 ring-amber-100",
    info: "bg-teal-50 text-teal-600 ring-teal-100"
  };

  const btnColors = {
    danger: "bg-red-600 hover:bg-red-700 shadow-red-600/20",
    warning: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20",
    info: "bg-teal-600 hover:bg-teal-700 shadow-teal-600/20"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden p-8 text-center"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-all"
            >
              <X size={20} />
            </button>

            <div className={`w-16 h-16 ${colors[type]} rounded-2xl flex items-center justify-center mx-auto mb-6 ring-4`}>
              {type === 'danger' ? <AlertTriangle size={32} /> : type === 'info' ? <Info size={32} /> : <AlertTriangle size={32} />}
            </div>

            <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
              {message}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => { onConfirm(); onClose(); }}
                className={`w-full py-4 ${btnColors[type]} text-white font-black rounded-2xl shadow-xl transition-all`}
              >
                {confirmText}
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 bg-slate-50 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-all"
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

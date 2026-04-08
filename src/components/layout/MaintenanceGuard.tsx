"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Construction, Mail, ShieldAlert } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  
  const { data, error, isLoading } = useSWR("/api/settings", fetcher, {
    refreshInterval: 10000, // Poll every 10 seconds
    revalidateOnFocus: true,
  });

  const settings = data?.settings;


  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  // Check if maintenance is on and user is NOT an admin
  const isMaintenance = settings?.maintenanceMode;
  const isAdmin = (session?.user as any)?.role === 'admin';

  if (isMaintenance && !isAdmin) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-6 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400" />
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full text-center space-y-8"
        >
          <div className="relative inline-block">
            <div className="w-32 h-32 bg-amber-50 rounded-[2.5rem] flex items-center justify-center mx-auto ring-8 ring-amber-50">
              <Construction size={64} className="text-amber-600" />
            </div>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-amber-50"
            >
              <ShieldAlert size={24} className="text-amber-500" />
            </motion.div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight">
              We'll be <span className="text-teal-600 underline decoration-amber-300 underline-offset-8">back soon!</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
              {settings.storeName} is currently undergoing scheduled maintenance to improve your shopping experience. We'll be live again shortly.
            </p>
          </div>

          <div className="pt-8 flex flex-col items-center gap-6">
            <div className="h-px w-24 bg-slate-100" />
            <div className="flex items-center gap-3 text-slate-400 font-bold bg-slate-50 px-6 py-3 rounded-2xl">
                <Mail size={18} />
                <span className="text-sm">{settings.supportEmail}</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {isMaintenance && isAdmin && (
        <div className="fixed bottom-6 right-6 z-[1000] bg-amber-600 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-2xl flex items-center gap-3 animate-pulse border-4 border-white">
            <Construction size={16} />
            MAINTENANCE ACTIVE (ADMIN VIEW)
        </div>
      )}
      {children}
    </>
  );
}

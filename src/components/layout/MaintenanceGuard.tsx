"use client";

import { useSession } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Construction, Mail, Leaf } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const reduceMotion = useReducedMotion();

  const { data, error, isLoading } = useSWR("/api/settings", fetcher, {
    refreshInterval: 10000, // Poll every 10 seconds
    revalidateOnFocus: true,
  });

  const settings = data?.settings;


  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-hidden="true" />
        <span className="sr-only">Loading the store</span>
      </div>
    );
  }

  // Check if maintenance is on and user is NOT an admin
  const isMaintenance = settings?.maintenanceMode;
  const isAdmin = (session?.user as any)?.role === 'admin';

  if (isMaintenance && !isAdmin) {
    return (
      // items-start + my-auto on the card centres it, but (unlike items-center) never clips
      // the top of the card when it is taller than a short/landscape phone screen.
      <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-50 px-4 py-8">
        {/* Thin accent strip: a quiet "notice" signal without decoration */}
        <div className="absolute inset-x-0 top-0 h-1 bg-accent-400" aria-hidden="true" />

        <motion.main
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="my-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10"
        >
          {/* Brand mark (same leaf mark as the header logo) */}
          <div className="mb-8 flex items-center justify-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-sm" aria-hidden="true">
              <Leaf size={18} className="text-white" />
            </span>
            <span className="text-lg font-black tracking-tight text-slate-900">{settings.storeName}</span>
          </div>

          {/* Accent notice */}
          <p className="inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-sm font-medium text-accent-800">
            <Construction size={16} aria-hidden="true" />
            Scheduled maintenance
          </p>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            We&apos;ll be back soon
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-slate-600">
            {settings.storeName} is currently undergoing scheduled maintenance to improve your shopping experience. We&apos;ll be live again shortly.
          </p>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-600">Need help in the meantime?</p>
            <a
              href={`mailto:${settings.supportEmail}`}
              className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              <Mail size={18} aria-hidden="true" />
              {settings.supportEmail}
            </a>
          </div>
        </motion.main>
      </div>
    );
  }

  return (
    <>
      {isMaintenance && isAdmin && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-[1000] flex items-center gap-2 rounded-xl border border-accent-200 bg-accent-50 px-4 py-2.5 text-sm font-semibold text-accent-800 shadow-md"
        >
          <Construction size={16} aria-hidden="true" />
          Maintenance mode is on (admin view)
        </div>
      )}
      {children}
    </>
  );
}

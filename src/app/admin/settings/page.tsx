"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Store, Truck, Wrench, Save, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { PANEL_CLASS, LABEL_CLASS, INPUT_CLASS, HELP_CLASS } from "@/components/admin/adminStyles";

/** Titled panel that groups related settings fields. */
function SettingsSection({
  id,
  icon: Icon,
  title,
  description,
  children
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className={PANEL_CLASS}>
      <div className="flex items-start gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700" aria-hidden="true">
          <Icon size={20} />
        </div>
        <div>
          <h3 id={`${id}-title`} className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({
    storeName: "",
    supportEmail: "",
    deliveryFee: 0,
    minFreeDelivery: 0,
    maintenanceMode: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (res.ok) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Fetch settings error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setMessage("Settings updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" aria-hidden="true" />
        <span className="sr-only">Loading settings…</span>
      </div>
    );
  }

  const isMaintenanceOn = Boolean(settings.maintenanceMode);

  return (
    <form onSubmit={handleSave} className="max-w-3xl space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Store settings</h2>
        <p className="text-sm text-slate-500">Changes apply to the storefront and checkout after you save.</p>
      </div>

      <SettingsSection id="store-details" icon={Store} title="Store details" description="How your store is named and how customers reach you.">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="settings-store-name" className={LABEL_CLASS}>Store name</label>
            <input
              id="settings-store-name"
              type="text"
              value={settings.storeName}
              onChange={(e) => setSettings({...settings, storeName: e.target.value})}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="settings-support-email" className={LABEL_CLASS}>Support email</label>
            <input
              id="settings-support-email"
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
              aria-describedby="settings-support-email-help"
              className={INPUT_CLASS}
            />
            <p id="settings-support-email-help" className={HELP_CLASS}>Where customers send questions about their orders.</p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection id="delivery" icon={Truck} title="Delivery" description="Shipping charges added at checkout.">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="settings-delivery-fee" className={LABEL_CLASS}>Delivery fee (৳)</label>
            <input
              id="settings-delivery-fee"
              type="number"
              inputMode="numeric"
              value={settings.deliveryFee}
              onChange={(e) => setSettings({...settings, deliveryFee: Number(e.target.value)})}
              aria-describedby="settings-delivery-fee-help"
              className={cn(INPUT_CLASS, "tabular-nums")}
            />
            <p id="settings-delivery-fee-help" className={HELP_CLASS}>Charged on orders below the free delivery minimum.</p>
          </div>
          <div>
            <label htmlFor="settings-free-delivery" className={LABEL_CLASS}>Free delivery minimum (৳)</label>
            <input
              id="settings-free-delivery"
              type="number"
              inputMode="numeric"
              value={settings.minFreeDelivery}
              onChange={(e) => setSettings({...settings, minFreeDelivery: Number(e.target.value)})}
              aria-describedby="settings-free-delivery-help"
              className={cn(INPUT_CLASS, "tabular-nums")}
            />
            <p id="settings-free-delivery-help" className={HELP_CLASS}>Orders at or above this amount ship free.</p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection id="maintenance" icon={Wrench} title="Maintenance" description="Temporarily pause the store while you make changes.">
        <div className="flex items-center justify-between gap-4">
          <div>
            {/* A <label> on a button forwards clicks, so the text also toggles the switch */}
            <label htmlFor="settings-maintenance" className="cursor-pointer text-sm font-medium text-slate-800">
              Maintenance mode
            </label>
            <p id="settings-maintenance-help" className="text-sm text-slate-500">
              Shows a maintenance notice on the storefront and stops new orders.
            </p>
          </div>
          <button
            id="settings-maintenance"
            type="button"
            role="switch"
            aria-checked={isMaintenanceOn}
            aria-describedby="settings-maintenance-help"
            onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
            className="flex h-10 w-14 flex-shrink-0 items-center justify-center rounded-full"
          >
            <span
              className={cn(
                "flex h-6 w-11 items-center rounded-full p-0.5 transition-colors",
                isMaintenanceOn ? "bg-accent-500" : "bg-slate-300"
              )}
              aria-hidden="true"
            >
              <span
                className={cn(
                  "h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                  isMaintenanceOn ? "translate-x-5" : "translate-x-0"
                )}
              />
            </span>
          </button>
        </div>

        {isMaintenanceOn && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-accent-200 bg-accent-50 p-4 text-sm text-accent-800">
            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
            <p>
              <span className="font-semibold">Maintenance mode is on.</span>{" "}Customers can&apos;t place orders until you switch it off and save.
            </p>
          </div>
        )}
      </SettingsSection>

      {/* Single save action for every section above */}
      <div className={cn(PANEL_CLASS, "flex flex-col-reverse items-stretch gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6")}>
        <div aria-live="polite" role="status" className="sm:mr-auto">
          {message && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm font-medium text-success-700"
            >
              <CheckCircle2 size={16} aria-hidden="true" />
              {message}
            </motion.p>
          )}
        </div>
        <Button type="submit" loading={isSaving}>
          {!isSaving && <Save size={16} aria-hidden="true" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}

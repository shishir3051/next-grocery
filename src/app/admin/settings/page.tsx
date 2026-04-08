"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Shield, Bell, Database, Globe, Save, Loader2, CheckCircle2 } from "lucide-react";

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
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <SettingsIcon className="text-teal-600 w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-800">Store Settings</h2>
          </div>
          {message && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 px-4 py-2 rounded-xl"
            >
              <CheckCircle2 size={16} />
              {message}
            </motion.div>
          )}
        </div>
        
        <div className="p-8 space-y-10">
          <div className="grid md:grid-cols-2 gap-10">
            {/* Global Config */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Globe size={14} /> Global Configuration
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Store Name</label>
                  <input 
                    type="text" 
                    value={settings.storeName}
                    onChange={(e) => setSettings({...settings, storeName: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Support Email</label>
                  <input 
                    type="email" 
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none" 
                  />
                </div>
              </div>
            </div>

            {/* Price & Delivery */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Shield size={14} /> Price & Delivery
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Delivery Fee (৳)</label>
                  <input 
                    type="number" 
                    value={settings.deliveryFee}
                    onChange={(e) => setSettings({...settings, deliveryFee: Number(e.target.value)})}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Free Delivery Min (৳)</label>
                  <input 
                    type="number" 
                    value={settings.minFreeDelivery}
                    onChange={(e) => setSettings({...settings, minFreeDelivery: Number(e.target.value)})}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* System Toggles */}
          <div className="pt-6 border-t border-slate-100">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
               <Database size={14} /> System Controls
             </h3>
             <div className="grid md:grid-cols-2 gap-6">
                <div 
                  onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                  className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl cursor-pointer group hover:bg-slate-100 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.maintenanceMode ? 'bg-amber-100 text-amber-600' : 'bg-white text-slate-400'}`}>
                      <Database size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Maintenance Mode</p>
                      <p className="text-xs text-slate-400">Suspend store operations</p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-all ${settings.maintenanceMode ? 'bg-teal-500' : 'bg-slate-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </div>
             </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            type="submit"
            disabled={isSaving}
            className="px-10 py-4 bg-teal-600 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 hover:bg-teal-700 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}


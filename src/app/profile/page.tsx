"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, MapPin, Phone, Save, Loader2, CheckCircle2, ChevronRight, Camera } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    image: "",
    address: {
      street: "",
      city: "",
      zipCode: "",
    },
    walletBalance: 0
  });

  const [copied, setCopied] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile");
    } else if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (res.ok) {
        setFormData({
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.address?.phone || "",
          image: data.user.image || "",
          address: {
            street: data.user.address?.street || "",
            city: data.user.address?.city || "",
            zipCode: data.user.address?.zipCode || "",
          },
          walletBalance: data.user.walletBalance || 0
        });
      }
    } catch (error) {
      console.error("Fetch profile error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: "error", text: "Image size must be less than 2MB" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await update();
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: "Failed to update profile." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred." });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-teal-600 font-bold text-sm hover:underline">← Home</Link>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Account Settings</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center border-4 border-white shadow-inner overflow-hidden">
                  {formData.image ? (
                    <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
                  ) : session?.user?.image ? (
                    <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-teal-600">{formData.name ? formData.name.charAt(0).toUpperCase() : "-"}</span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-white border border-slate-200 shadow-sm rounded-full p-1.5 cursor-pointer hover:bg-slate-50 transition-colors" title="Upload New Avatar">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Camera size={14} className="text-slate-600" />
                </label>
              </div>
              <h2 className="text-xl font-bold text-slate-800">{formData.name}</h2>
              <p className="text-sm text-slate-500">{formData.email}</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Links</h3>
              <div className="space-y-2">
                {(session?.user as any)?.role === 'admin' ? (
                  <>
                    <Link href="/admin/users" className="flex items-center justify-between p-3 rounded-xl bg-teal-50 hover:bg-teal-100 transition-all text-sm font-bold text-teal-700 border border-teal-100">
                      User Management
                      <ChevronRight size={16} className="text-teal-500" />
                    </Link>
                    <Link href="/admin/orders" className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all text-sm font-bold text-slate-700">
                      Sales Reports
                      <ChevronRight size={16} className="text-slate-300" />
                    </Link>
                    <Link href="/admin" className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all text-sm font-bold text-slate-700">
                      Admin Settings
                      <ChevronRight size={16} className="text-slate-300" />
                    </Link>
                  </>
                ) : (session?.user as any)?.role === 'delivery' ? (
                  <Link href="/delivery" className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-all text-sm font-bold text-emerald-700 border border-emerald-100">
                    Delivery Dashboard
                    <ChevronRight size={16} className="text-emerald-500" />
                  </Link>
                ) : (
                  <Link href="/orders" className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all text-sm font-bold text-slate-700">
                    My Orders
                    <ChevronRight size={16} className="text-slate-300" />
                  </Link>
                )}
              </div>
            </div>

            {/* Wallet & Referral Card */}
            {(session?.user as any)?.role !== 'admin' && (
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-1 opacity-90">Digital Wallet</h3>
                  <div className="text-4xl font-black flex items-start gap-1">
                     <span className="text-2xl mt-1 opacity-80">৳</span>
                     {formData.walletBalance}
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 bg-black/10 rounded-full blur-xl" />
              </div>
            )}
          </div>

          {/* Edit Form */}
          <form onSubmit={handleUpdate} className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                  <User className="text-teal-600 w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Personal Information</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative opacity-60">
                    <input
                      type="email"
                      readOnly
                      value={formData.email}
                      className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm cursor-not-allowed"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="017xxxxxxxx"
                      className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                    />
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                  <MapPin className="text-teal-600 w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Primary Delivery Address</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Street Address</label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                    placeholder="House 12, Road 4, Sector 7"
                    className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">City</label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
                      className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Zip Code</label>
                    <input
                      type="text"
                      value={formData.address.zipCode}
                      onChange={(e) => setFormData({...formData, address: {...formData.address, zipCode: e.target.value}})}
                      className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {message.text && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${
                  message.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                }`}
              >
                {message.type === "success" && <CheckCircle2 size={18} />}
                {message.text}
              </motion.div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-4 bg-teal-600 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 hover:bg-teal-700 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

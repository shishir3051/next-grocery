"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Mail, MapPin, Phone, Save, Loader2, CheckCircle2, ChevronRight, Camera, AlertCircle, Wallet } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

// Shared form styles from docs/design/DESIGN_SYSTEM.md
const INPUT_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";
const INPUT_WITH_ICON_CLASS = `${INPUT_CLASS} pl-10`;
const ICON_CLASS = "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4";
const LABEL_CLASS = "block text-sm font-medium text-slate-700";
const CARD_CLASS = "bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm";
const QUICK_LINK_CLASS =
  "flex min-h-11 items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors";

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
    } catch {
      setMessage({ type: "error", text: "An error occurred." });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" aria-hidden="true" />
        <span className="sr-only">Loading your profile…</span>
      </div>
    );
  }

  const role = session?.user?.role;
  const avatarSrc = formData.image || session?.user?.image;

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* The global header provides navigation, so no page-level "Home" link. Plain div, not <header>, to avoid a second banner landmark. */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Account settings</h1>
          <p className="text-sm text-slate-600 mt-1">Manage your personal details and delivery address.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Sidebar Info */}
          <aside className="lg:col-span-1 space-y-6">
            <div className={`${CARD_CLASS} text-center`}>
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm overflow-hidden">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Profile photo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-brand-700" aria-hidden="true">
                      {formData.name ? formData.name.charAt(0).toUpperCase() : "-"}
                    </span>
                  )}
                </div>
                {/* Visually an icon button; the file input stays keyboard-focusable via sr-only */}
                <label
                  className="absolute -bottom-1 -right-1 w-10 h-10 grid place-items-center bg-white border border-slate-300 shadow-sm rounded-full cursor-pointer hover:bg-slate-50 transition-colors focus-within:ring-2 focus-within:ring-brand-500"
                  title="Upload new photo"
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label="Upload new profile photo (max 2MB)"
                    onChange={handleImageUpload}
                  />
                  <Camera size={16} className="text-slate-600" aria-hidden="true" />
                </label>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{formData.name}</h2>
              <p className="text-sm text-slate-500 break-all">{formData.email}</p>
            </div>

            <nav aria-labelledby="quick-links-title" className={CARD_CLASS}>
              <h3 id="quick-links-title" className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Quick links
              </h3>
              <div className="space-y-1">
                {role === 'admin' ? (
                  <>
                    <Link href="/admin/users" className={`${QUICK_LINK_CLASS} bg-brand-50 text-brand-700 hover:bg-brand-100`}>
                      User management
                      <ChevronRight size={16} className="text-brand-500" aria-hidden="true" />
                    </Link>
                    <Link href="/admin/orders" className={`${QUICK_LINK_CLASS} text-slate-700 hover:bg-slate-50`}>
                      Sales reports
                      <ChevronRight size={16} className="text-slate-400" aria-hidden="true" />
                    </Link>
                    <Link href="/admin" className={`${QUICK_LINK_CLASS} text-slate-700 hover:bg-slate-50`}>
                      Admin settings
                      <ChevronRight size={16} className="text-slate-400" aria-hidden="true" />
                    </Link>
                  </>
                ) : role === 'delivery' ? (
                  <Link href="/delivery" className={`${QUICK_LINK_CLASS} bg-brand-50 text-brand-700 hover:bg-brand-100`}>
                    Delivery dashboard
                    <ChevronRight size={16} className="text-brand-500" aria-hidden="true" />
                  </Link>
                ) : (
                  <Link href="/orders" className={`${QUICK_LINK_CLASS} text-slate-700 hover:bg-slate-50`}>
                    My orders
                    <ChevronRight size={16} className="text-slate-400" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </nav>

            {/* Wallet card (solid brand surface; gradients are reserved for hero + logo) */}
            {role !== 'admin' && (
              <div className="bg-brand-700 rounded-2xl p-4 sm:p-6 shadow-sm text-white">
                <div className="flex items-center gap-2 text-sm font-medium text-brand-100">
                  <Wallet size={16} aria-hidden="true" />
                  Digital wallet
                </div>
                <p className="mt-2 text-3xl font-bold tracking-tight">
                  <span className="text-xl font-semibold text-brand-100 mr-1">৳</span>
                  {formData.walletBalance}
                </p>
                <p className="mt-1 text-xs text-brand-100">Available balance</p>
              </div>
            )}
          </aside>

          {/* Edit Form */}
          <form onSubmit={handleUpdate} className="lg:col-span-2 space-y-6">
            <section className={`${CARD_CLASS} space-y-5`} aria-labelledby="personal-info-title">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                  <User className="text-brand-600 w-5 h-5" aria-hidden="true" />
                </div>
                <h2 id="personal-info-title" className="text-lg sm:text-xl font-semibold text-slate-900">Personal information</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="profile-name" className={LABEL_CLASS}>Full name</label>
                  <div className="relative">
                    <User className={ICON_CLASS} aria-hidden="true" />
                    <input
                      id="profile-name"
                      type="text"
                      autoComplete="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={INPUT_WITH_ICON_CLASS}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="profile-email" className={LABEL_CLASS}>Email address</label>
                  <div className="relative">
                    <Mail className={ICON_CLASS} aria-hidden="true" />
                    <input
                      id="profile-email"
                      type="email"
                      readOnly
                      aria-describedby="profile-email-hint"
                      value={formData.email}
                      className={`${INPUT_WITH_ICON_CLASS} bg-slate-50 text-slate-500 cursor-not-allowed`}
                    />
                  </div>
                  <p id="profile-email-hint" className="text-xs text-slate-500">Email can&apos;t be changed.</p>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="profile-phone" className={LABEL_CLASS}>Phone number</label>
                  <div className="relative">
                    <Phone className={ICON_CLASS} aria-hidden="true" />
                    <input
                      id="profile-phone"
                      type="tel"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="017xxxxxxxx"
                      className={INPUT_WITH_ICON_CLASS}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className={`${CARD_CLASS} space-y-5`} aria-labelledby="address-title">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                  <MapPin className="text-brand-600 w-5 h-5" aria-hidden="true" />
                </div>
                <h2 id="address-title" className="text-lg sm:text-xl font-semibold text-slate-900">Primary delivery address</h2>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="profile-street" className={LABEL_CLASS}>Street address</label>
                  <input
                    id="profile-street"
                    type="text"
                    autoComplete="street-address"
                    value={formData.address.street}
                    onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                    placeholder="House 12, Road 4, Sector 7"
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="profile-city" className={LABEL_CLASS}>City</label>
                    <input
                      id="profile-city"
                      type="text"
                      autoComplete="address-level2"
                      value={formData.address.city}
                      onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="profile-zip" className={LABEL_CLASS}>Zip code</label>
                    <input
                      id="profile-zip"
                      type="text"
                      autoComplete="postal-code"
                      value={formData.address.zipCode}
                      onChange={(e) => setFormData({...formData, address: {...formData.address, zipCode: e.target.value}})}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              </div>
            </section>

            {message.text && (
              <div
                role={message.type === "success" ? "status" : "alert"}
                className={`flex items-start gap-2 rounded-lg border p-3 text-sm font-medium ${
                  message.type === "success"
                    ? "bg-success-50 text-success-700 border-success-100"
                    : "bg-danger-50 text-danger-700 border-danger-200"
                }`}
              >
                {message.type === "success"
                  ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                  : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />}
                {message.text}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" size="lg" loading={isSaving} className="w-full sm:w-auto">
                {!isSaving && <Save size={18} aria-hidden="true" />}
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

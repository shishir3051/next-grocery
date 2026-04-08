"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Mail, Lock, User, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, referralCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "An error occurred");
      } else if (data.requireOtp) {
        setSuccessMsg("OTP has been sent to your email.");
        setStep(2);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid OTP");
        setIsLoading(false);
      } else {
        // Auto sign in after successful verification
        setSuccessMsg("Email verified! Logging you in...");
        const signInRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        
        if (signInRes?.ok) {
           router.push("/");
           router.refresh();
        } else {
           setError("Auto-login failed. Please go to Login page.");
           setIsLoading(false);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsLoading(false);
    } 
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-50 rounded-2xl mb-4">
              <UserPlus className="text-teal-600 w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Join FreshBasket</h1>
            <p className="text-slate-500 mt-2">
               {step === 1 ? "Start your premium grocery journey today" : "Verify your email to continue"}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100"
            >
              {error}
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-medium border border-emerald-100 flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              {successMsg}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRegister} 
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                    />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1 flex justify-between">
                    <span>Referral Code</span>
                    <span className="text-slate-400 font-normal">Optional</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="e.g. FRESH-XXXXXX"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold tracking-wider focus:ring-2 focus:ring-teal-500 transition-all outline-none placeholder:font-normal placeholder:tracking-normal uppercase"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
                       <span className="text-teal-600 font-black text-xs leading-none">৳</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-teal-600 font-bold px-1 uppercase tracking-widest">Enter a friend's code to both get ৳50</p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerifyOtp} 
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1 text-center block">Enter 6-digit OTP</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="------"
                      className="w-full text-center tracking-[1em] py-4 bg-slate-50 border-none rounded-2xl text-2xl font-black focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                    />
                  </div>
                  <p className="text-xs text-slate-400 text-center mt-2">
                    Sent to {email}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length < 6}
                  className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Verify & Log In
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                   <button 
                    type="button" 
                    disabled={isLoading}
                    onClick={handleRegister}
                    className="text-teal-600 text-sm font-bold hover:underline"
                   >
                     Resend OTP
                   </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {step === 1 && (
            <div className="mt-8 pt-8 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-teal-600 font-bold hover:underline">
                  Log In
                </Link>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

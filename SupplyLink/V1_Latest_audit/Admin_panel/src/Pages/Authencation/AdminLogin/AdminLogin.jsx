import React, { useState } from "react";
import Lottie from "lottie-react";
import { useForm } from "react-hook-form";
import loginAnimation from "./login-security.json";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Provider/AuthProvider";
import { motion } from "framer-motion";
import { FiEye, FiEyeOff, FiLock, FiUser, FiArrowRight, FiShield } from "react-icons/fi";
import LuxuryToast from "../../../components/Modal/LuxuryToast";

const AdminLogin = () => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [luxuryToast, setLuxuryToast] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const id = data?.id?.trim();
      const password = data?.password;
      const res = await login(id, password);

      if (res?.success) {
        setLuxuryToast({
          title: "স্বাগতম! 🎉",
          message: "লগইন সফল হয়েছে। সিস্টেম ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...",
          tag: "Authorized",
          type: "success",
        });
        setTimeout(() => {
          navigate("/");
        }, 900);
      } else {
        setLuxuryToast({
          title: "লগইন ব্যর্থ ⚠️",
          message: res?.message || "ইউজার আইডি অথবা পাসওয়ার্ড সঠিক নয়। দয়া করে পুনরায় যাচাই করুন।",
          tag: "Auth Failed",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "সার্ভার সংযোগ ত্রুটি ⚠️",
        message: err?.message || "সার্ভারে সংযোগ করা সম্ভব হচ্ছে না। ইন্টারনেট বা ব্যাকএন্ড চেক করুন।",
        tag: "Network Error",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#030712] text-white px-4 py-8 overflow-hidden select-none">
      {/* Ambient Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/3 translate-y-1/3 w-[28rem] h-[28rem] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-[110px] pointer-events-none" />

      {/* Subtle Grid Backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-[#091224]/85 backdrop-blur-2xl rounded-3xl p-7 sm:p-9 border border-white/10 shadow-[0_25px_65px_-15px_rgba(0,0,0,0.95)]"
      >
        {/* Top subtle glow line */}
        <div className="absolute -top-[1px] left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Header with Animation */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-cyan-500/10 blur-xl pointer-events-none" />
            <Lottie animationData={loginAnimation} loop className="w-24 h-24 relative z-10 drop-shadow-md" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold tracking-wider uppercase mb-2">
            <FiShield className="text-cyan-400 text-xs" />
            <span>Enterprise Secure Portal</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">
            Supply<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Link</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            অ্যাডমিন ও স্টাফদের জন্য সংরক্ষিত ম্যানেজমেন্ট পোর্টাল
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* User ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>ইউজার আইডি / মোবাইল নম্বর</span>
              <span className="text-[10px] text-slate-500 font-normal">Staff ID or Mobile</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <FiUser size={16} />
              </div>
              <input
                type="text"
                autoComplete="username"
                placeholder="যেমন: admin বা 01700..."
                {...register("id", { required: "ইউজার আইডি বা মোবাইল নম্বর আবশ্যক" })}
                className={`w-full rounded-xl bg-[#050b17] border px-4 py-3 pl-10 text-sm text-white placeholder:text-slate-600 outline-none transition-all font-medium ${
                  errors.id
                    ? "border-rose-500/80 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-800 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                }`}
              />
            </div>
            {errors.id && (
              <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                <span>⚠</span> {errors.id.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>গোপন পাসওয়ার্ড</span>
              <span className="text-[10px] text-slate-500 font-normal">Password</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <FiLock size={16} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="আপনার পাসওয়ার্ড দিন"
                {...register("password", { required: "পাসওয়ার্ড প্রদান করা আবশ্যক" })}
                className={`w-full rounded-xl bg-[#050b17] border px-4 py-3 pl-10 pr-10 text-sm text-white placeholder:text-slate-600 outline-none transition-all font-medium ${
                  errors.password
                    ? "border-rose-500/80 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-800 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                <span>⚠</span> {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-950/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>যাচাই করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>লগইন করুন</span>
                  <FiArrowRight size={16} />
                </>
              )}
            </motion.button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-white/5 text-center">
          <p className="text-[11px] text-slate-500">
            © 2026 SupplyLink Enterprise. All rights reserved.
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5">
            যেকোনো সমস্যায় আইটি অ্যাডমিন বা সাপোর্ট সেন্টারে যোগাযোগ করুন
          </p>
        </div>
      </motion.div>

      {/* Luxury Toast Notification */}
      <LuxuryToast toast={luxuryToast} onClose={() => setLuxuryToast(null)} />
    </div>
  );
};

export default AdminLogin;

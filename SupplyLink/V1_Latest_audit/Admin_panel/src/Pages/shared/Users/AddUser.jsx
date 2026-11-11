import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import LuxuryToast from "../../../components/Modal/LuxuryToast";
import { ID_TYPES, ROLES } from "./UsersType";
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaMapMarkerAlt,
  FaLock,
  FaUserTag,
  FaImage,
  FaCalendarAlt,
  FaUserPlus,
  FaCheckCircle,
  FaTimes,
  FaCloudUploadAlt,
} from "react-icons/fa";
import IconInput from "../../../components/IconInput";
import BackButton from "../../../components/BackButton/BackButton";

const ROLE_DISPLAY_NAMES = {
  admin: "Admin (অ্যাডমিন)",
  manager: "Manager (ম্যানেজার)",
  staff: "Staff (স্টাফ)",
  developer: "Developer (ডেভেলপার)",
  investor: "Investor (বিনিয়োগকারী)",
  customer: "Customer (গ্রাহক)",
  supplier: "Supplier (সাপ্লায়ার)",
  granter: "Granter (জামিনদার)",
};

const ID_TYPE_NAMES = {
  smart_nid: "Smart NID (স্মার্ট এনআইডি)",
  voter_id: "Voter ID (ভোটার আইডি)",
  birthday_certificate: "Birth Certificate (জন্ম নিবন্ধন)",
  passport: "Passport (পাসপোর্ট)",
};

const AddUser = () => {
  const { register, handleSubmit, reset } = useForm();
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [luxuryToast, setLuxuryToast] = useState(null);
  const fileRef = useRef(null);
  const photoReg = register("photo");

  useEffect(() => {
    // cleanup object URL
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onSubmit = async (data) => {
    const requiredFields = [
      { key: "name", message: "নাম দিতে হবে" },
      { key: "id_type", message: "ID টাইপ নির্বাচন করতে হবে" },
      { key: "id_number", message: "ID নম্বর দিতে হবে" },
      { key: "mobile", message: "মোবাইল নম্বর দিতে হবে" },
      { key: "address", message: "ঠিকানা দিতে হবে" },
      { key: "role", message: "রোল নির্বাচন করতে হবে" },
    ];

    for (let field of requiredFields) {
      if (!data[field.key]) {
        setLuxuryToast({
          title: "তথ্য অসম্পূর্ণ ⚠️",
          message: field.message,
          tag: "ফর্ম ভ্যালিডেশন",
          type: "warning",
        });
        toast.error(field.message);
        return;
      }
    }

    // Optional email format validation
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      setLuxuryToast({
        title: "ভুল ইমেইল ফরম্যাট ⚠️",
        message: "দয়া করে সঠিক ইমেইল এড্রেস প্রদান করুন (যেমন: user@example.com)",
        tag: "ইমেইল ভ্যালিডেশন",
        type: "warning",
      });
      toast.error("সঠিক ইমেইল ফরম্যাট দিন");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (k !== "photo") formData.append(k, v ?? "");
      });

      // ✅ file
      if (data.photo && data.photo[0]) {
        formData.append("photo", data.photo[0]);
      }

      // 🔹 API CALL
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/users/create_user.php`,
        {
          credentials: "include",
          method: "POST",
          body: formData,
        }
      );

      const result = await res.json();
      if (!result.success) {
        const errorDetail = result.error ? `${result.message}: ${result.error}` : (result.message || "User create failed");
        setLuxuryToast({
          title: "ইউজার তৈরি ব্যর্থ ❌",
          message: errorDetail,
          tag: "সিস্টেম এরর",
          type: "error",
        });
        toast.error(errorDetail);
        return;
      }

      const roleLabel = ROLE_DISPLAY_NAMES[data.role] || data.role;
      setLuxuryToast({
        title: "ইউজার সফলভাবে তৈরি হয়েছে 🎉",
        message: `${data.name} এর প্রোফাইল ও ${roleLabel} অ্যাক্সেস নিশ্চিত হয়েছে। অ্যাডমিন${data.email ? " ও ইউজারের" : ""} ইমেইলে তথ্য ও ছবি পাঠানো হয়েছে।`,
        tag: `আইডি: #${result.user_id || "NEW"} • ${data.email || data.mobile}`,
        type: "success",
      });
      toast.success("ইউজার সফলভাবে তৈরি হয়েছে 🎉");

      setPreview("");
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      reset(); // form clear
    } catch (error) {
      setLuxuryToast({
        title: "সার্ভারে সমস্যা ❌",
        message: "সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।",
        tag: "নেটওয়ার্ক এরর",
        type: "error",
      });
      toast.error("সার্ভার সমস্যা হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className=" mx-auto p-4 md:p-6 space-y-5 animate-fadeIn">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <BackButton />
        <span className="text-xs text-slate-400 font-mono bg-white/[0.04] border border-white/10 px-3 py-1 rounded-full">
          User Management • New Registration
        </span>
      </div>

      {/* Main Container Card */}
      <div className="card-surface-elevated p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-28 bg-gradient-to-b from-indigo-500/15 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-white/[0.08] relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600/30 via-purple-600/25 to-pink-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/15 shrink-0">
            <FaUserPlus size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Create New User
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              নতুন গ্রাহক, বিনিয়োগকারী বা স্টাফের প্রোফাইল ও অ্যাক্সেস তৈরি করুন
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* NAME */}
            <IconInput
              label="পূর্ণ নাম (Full Name) *"
              icon={FaUser}
              register={register}
              name="name"
              placeholder="যেমন: মোঃ কামরুল হাসান"
            />

            {/* MOBILE */}
            <IconInput
              label="মোবাইল নম্বর (Mobile Number) *"
              icon={FaPhone}
              register={register}
              name="mobile"
              placeholder="যেমন: 01712345678"
            />

            {/* EMAIL */}
            <IconInput
              label="ইমেইল এড্রেস (Email Address)"
              icon={FaEnvelope}
              register={register}
              name="email"
              type="email"
              placeholder="যেমন: user@example.com"
            />

            {/* ID TYPE & ID NUMBER */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wide text-slate-300">
                আইডি টাইপ (ID Type) *
              </label>
              <div className="flex items-center gap-2.5 bg-[#091122] border border-white/10 rounded-xl px-3.5 py-2.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                <FaIdCard className="text-slate-400 shrink-0" />
                <select
                  {...register("id_type")}
                  className="bg-transparent text-white w-full py-0.5 text-sm outline-none cursor-pointer"
                >
                  <option value="" className="bg-[#0b132b] text-slate-400">
                    -- ID টাইপ নির্বাচন করুন --
                  </option>
                  {ID_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-[#0b132b] text-white">
                      {ID_TYPE_NAMES[t] || t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <IconInput
              label="আইডি নম্বর (ID Number) *"
              icon={FaIdCard}
              register={register}
              name="id_number"
              placeholder="এনআইডি বা জন্ম নিবন্ধন নম্বর"
            />

            {/* ROLE */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wide text-slate-300">
                ইউজার রোল (User Role) *
              </label>
              <div className="flex items-center gap-2.5 bg-[#091122] border border-white/10 rounded-xl px-3.5 py-2.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                <FaUserTag className="text-slate-400 shrink-0" />
                <select
                  {...register("role")}
                  className="bg-transparent text-white w-full py-0.5 text-sm outline-none cursor-pointer"
                >
                  <option value="" className="bg-[#0b132b] text-slate-400">
                    -- রোল নির্বাচন করুন --
                  </option>
                  {ROLES.map((r) => (
                    <option key={r} value={r} className="bg-[#0b132b] text-white">
                      {ROLE_DISPLAY_NAMES[r] || r.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* START DATE */}
            <IconInput
              label="শুরুর তারিখ (Start Date)"
              icon={FaCalendarAlt}
              register={register}
              name="start_date"
              style={{ colorScheme: "dark" }}
              type="date"
            />

            {/* PASSWORD */}
            <div className="">
              <IconInput
                label="লগইন পাসওয়ার্ড (Default Password)"
                icon={FaLock}
                register={register}
                name="password"
                type="password"
                placeholder="ডিফল্ট পাসওয়ার্ড (যেমন: 123456)"
              />
            </div>

            {/* ADDRESS */}
            <div className="md:col-span-2">
              <IconInput
                label="ঠিকানা (Full Address) *"
                icon={FaMapMarkerAlt}
                register={register}
                name="address"
                placeholder="গ্রাম/রোড, পোস্ট অফিস, থানা, জেলা"
                textarea
                rows={3}
              />
            </div>
          </div>

          {/* PHOTO UPLOAD */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <label className="text-xs font-semibold tracking-wide text-slate-300 block">
              প্রোফাইল ছবি (User Profile Photo)
            </label>

            <label
              htmlFor="photo"
              className="relative block w-full rounded-2xl border-2 border-dashed border-white/15
                         bg-[#091122]/60 hover:bg-white/[0.03] hover:border-indigo-500/40 transition-all cursor-pointer
                         overflow-hidden group"
            >
              <div className="h-44 w-full flex items-center justify-center p-4">
                {preview ? (
                  <div className="relative h-full flex items-center justify-center">
                    <img
                      src={preview}
                      alt="Preview"
                      className="h-full max-w-xs object-cover rounded-xl ring-2 ring-indigo-500/40 shadow-lg"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center px-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                      <FaCloudUploadAlt size={22} />
                    </div>
                    <p className="text-sm font-medium text-slate-200">
                      ছবি আপলোড করতে ক্লিক করুন অথবা ড্র্যাগ করুন
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      সমর্থিত ফরম্যাট: JPG, PNG, WEBP (সর্বোচ্চ 2MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Remove button */}
              {preview && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (preview) URL.revokeObjectURL(preview);
                    setPreview("");
                    setFileName("");
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="absolute top-3 right-3 rounded-xl bg-black/70 hover:bg-rose-600/80 border border-white/10 px-3 py-1.5 text-xs text-white transition-all flex items-center gap-1.5 shadow-lg"
                >
                  <FaTimes size={12} />
                  <span>Remove</span>
                </button>
              )}

              <input
                id="photo"
                type="file"
                accept="image/*"
                className="hidden"
                {...photoReg}
                ref={(el) => {
                  photoReg.ref(el);
                  fileRef.current = el;
                }}
                onChange={(e) => {
                  photoReg.onChange(e);
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (preview) URL.revokeObjectURL(preview);
                  setPreview(URL.createObjectURL(file));
                  setFileName(file.name);
                }}
              />
            </label>

            {/* Selected File Name Tag */}
            {fileName && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-lg w-fit">
                <FaImage className="text-indigo-400" />
                <span>Selected:</span>
                <span className="text-indigo-300 font-mono font-medium truncate max-w-xs">{fileName}</span>
              </div>
            )}
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3.5 text-base font-bold shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              <FaCheckCircle size={17} />
              <span>{isSubmitting ? "ইউজার তৈরি হচ্ছে..." : "নতুন ইউজার নিশ্চিত করুন (Submit)"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Luxury Notification Toast */}
      <LuxuryToast
        toast={luxuryToast}
        onClose={() => setLuxuryToast(null)}
        duration={5000}
      />
    </div>
  );
};

export default AddUser;

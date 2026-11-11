import React, { useEffect, useMemo, useState, useRef } from "react";
import BackButton from "../../../components/BackButton/BackButton";
import axios from "axios";
import { toast } from "react-toastify";
import useUsers from "../../../utils/Hooks/useUsers";
import { useAuth } from "../../../Provider/AuthProvider";
import LuxuryToast from "../../../components/Modal/LuxuryToast";
import { 
  FiCreditCard, 
  FiUser, 
  FiCalendar, 
  FiLayers, 
  FiCheckCircle, 
  FiClock, 
  FiPlus, 
  FiShield,
  FiPhone,
  FiSearch,
  FiChevronDown,
  FiX,
  FiMail
} from "react-icons/fi";
import { RiBankCard2Line } from "react-icons/ri";

/* ---------- helpers ---------- */
const pad2 = (n) => String(n).padStart(2, "0");

const formatYMD = (d) => {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
};

const addYearsKeepDate = (ymd, years = 1) => {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return "";
  const dt = new Date(y, m - 1, d);
  dt.setFullYear(dt.getFullYear() + years);
  return formatYMD(dt);
};

const getUserAvatarSrc = (u) => {
  if (!u) return "";
  if (u.photo && typeof u.photo === "string" && u.photo.trim() !== "") {
    if (u.photo.startsWith("http")) return u.photo;
    const clean = u.photo.replace(/^\/+/, "");
    return `https://api.supplylinkbd.com/${clean.replace(/^uploads\//, "uploads/")}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    u.name || "User"
  )}&background=0284c7&color=fff`;
};

export default function CreateInvestmentCard() {
  const { user: currentAuthUser } = useAuth() || {};
  const { isUsersLoading, users, isUsersError } = useUsers();
  const today = useMemo(() => formatYMD(new Date()), []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [luxuryToast, setLuxuryToast] = useState(null);

  // 🔍 User Dropdown & Suggestion state
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [userSearchText, setUserSearchText] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all"); // 'all' | 'investor' | 'customer'
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const officialStaff = useMemo(() => {
    const allowedRoles = ["admin", "manager", "staff", "developer"];

    return (users || []).filter((u) => {
      if (Array.isArray(u.roles)) {
        return u.roles.some((r) =>
          allowedRoles.includes(String(r).toLowerCase())
        );
      }
      const role =
        u.role_name ?? u.role ?? u.user_role ?? u.userType ?? u.type ?? "";
      return allowedRoles.includes(String(role).toLowerCase());
    });
  }, [users]);

  const [form, setForm] = useState({
    investor_id: "",
    card_name: "",
    payment_type: "flexible",
    start_date: today,
    maturity_date: addYearsKeepDate(today, 1),
    status: "running",
    created_at: today,
    reference_user_id: "",
  });

  // start_date change হলে maturity_date auto +1 year
  useEffect(() => {
    setForm((p) => ({
      ...p,
      maturity_date: addYearsKeepDate(p.start_date, 1),
    }));
  }, [form.start_date]);

  // Live lookup of investor by ID
  const selectedInvestor = useMemo(() => {
    if (!form.investor_id || !users) return null;
    const id = Number(form.investor_id);
    return users.find((u) => Number(u.id) === id) || null;
  }, [form.investor_id, users]);

  // Filter users for the dropdown suggestions
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const q = userSearchText.trim().toLowerCase();

    return users.filter((u) => {
      // Role filter check
      if (userRoleFilter !== "all") {
        const roles = Array.isArray(u.roles) ? u.roles.map(r => String(r).toLowerCase()) : [String(u.role || u.role_name || "").toLowerCase()];
        if (!roles.some(r => r.includes(userRoleFilter))) {
          return false;
        }
      }

      // Keyword check (Name, Mobile, ID, NID, Email)
      if (!q) return true;
      const idMatch = String(u.id).includes(q);
      const nameMatch = u.name?.toLowerCase().includes(q);
      const mobileMatch = u.mobile?.toLowerCase().includes(q);
      const emailMatch = u.email?.toLowerCase().includes(q);
      const nidMatch = u.id_number?.toLowerCase().includes(q);

      return idMatch || nameMatch || mobileMatch || emailMatch || nidMatch;
    });
  }, [users, userSearchText, userRoleFilter]);

  // Select a user from dropdown
  const handleSelectUser = (user) => {
    setForm((p) => {
      const isAutoName = !p.card_name || p.card_name.includes("কার্ড") || p.card_name.includes("Card");
      return {
        ...p,
        investor_id: String(user.id),
        card_name: isAutoName ? `${user.name} এর কার্ড` : p.card_name,
      };
    });
    setUserDropdownOpen(false);
    setUserSearchText("");
  };

  // Selected Reference Staff
  const selectedStaff = useMemo(() => {
    if (!form.reference_user_id || !officialStaff) return null;
    const id = Number(form.reference_user_id);
    return officialStaff.find((u) => Number(u.id) === id) || null;
  }, [form.reference_user_id, officialStaff]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.investor_id || !form.card_name || !form.start_date) {
      setLuxuryToast({
        title: "তথ্য অসম্পূর্ণ ⚠️",
        message: "গ্রাহক নির্বাচন, কার্ডের নাম এবং শুরুর তারিখ পূরণ করা আবশ্যক!",
        type: "warning",
      });
      toast.warning("গ্রাহক নির্বাচন, কার্ডের নাম এবং শুরুর তারিখ পূরণ করুন!");
      return;
    }

    const payload = {
      investor_id: Number(form.investor_id),
      card_name: form.card_name.trim(),
      payment_type: form.payment_type,
      start_date: form.start_date,
      maturity_date: addYearsKeepDate(form.start_date, 1),
      status: "running",
      created_at: today,
      reference_user_id: form.reference_user_id
        ? Number(form.reference_user_id)
        : null,
      actor_id: currentAuthUser?.id || null,
      actor_name: currentAuthUser?.name || "Admin",
      actor_role: Array.isArray(currentAuthUser?.role)
        ? currentAuthUser.role.join(",")
        : (currentAuthUser?.role || "admin"),
    };

    try {
      setIsSubmitting(true);
      const response = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/investors/create_investment_card.php`,
        payload
      );

      const createdCard = response.data?.data || {};
      const cardTitle = createdCard.card_name || form.card_name;
      const cardId = response.data?.id || createdCard.id || "";

      // 🌟 Luxury Toast Alert
      setLuxuryToast({
        title: "ইনভেস্টমেন্ট কার্ড তৈরি সফল! 🎉",
        message: `${cardTitle} কার্ডটি গ্রাহক ${selectedInvestor?.name || "ইউজার"} (ID: #${form.investor_id}) এর জন্য সফলভাবে সক্রিয় করা হয়েছে। ইমেইল নোটিফিকেশন পাঠানো হয়েছে।`,
        tag: `কার্ড #${cardId}`,
        type: "success",
      });

      toast.success(
        `${cardTitle} এর কার্ড সফলভাবে তৈরি হয়েছে!`
      );

      // reset form
      setForm({
        investor_id: "",
        card_name: "",
        payment_type: "flexible",
        start_date: today,
        maturity_date: addYearsKeepDate(today, 1),
        status: "running",
        created_at: today,
        reference_user_id: "",
      });
    } catch (err) {
      const errMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "কার্ড তৈরি করতে সমস্যা হয়েছে";
      setLuxuryToast({
        title: "কার্ড তৈরি ব্যর্থ ❌",
        message: errMsg,
        tag: "সিস্টেম এরর",
        type: "error",
      });
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto  space-y-6 text-slate-200">

      <BackButton />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/25">
          <RiBankCard2Line className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
            নতুন ইনভেস্টমেন্ট কার্ড তৈরি (Create Investment Card)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            নির্দিষ্ট গ্রাহকের জন্য নতুন বিনিয়োগ অ্যাকাউন্ট ও মেয়াদ নির্ধারণ করুন
          </p>
        </div>
      </div>

      {/* 2-Column Grid: Form + Live Holographic Card Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Container */}
        <div className="lg:col-span-7 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0c162b]/95 via-[#091122]/95 to-[#060b17]/95 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Investor / Customer Suggestion & Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FiUser className="text-cyan-400 h-3.5 w-3.5" />
                  <span>গ্রাহক বা ইনভেস্টর নির্বাচন (Select User) <span className="text-rose-400">*</span></span>
                </label>
                {selectedInvestor ? (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <FiCheckCircle className="h-3 w-3" /> আইডি #{selectedInvestor.id} নির্বাচিত
                  </span>
                ) : (
                  <span className="text-[11px] text-cyan-400">
                    {users?.length ? `${users.length} জন ইউজার তালিকাভুক্ত` : ""}
                  </span>
                )}
              </div>

              {/* Selected User Showcase Card OR Trigger Search Input */}
              {selectedInvestor && !userDropdownOpen ? (
                <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-[#0c162b] p-3 shadow-lg flex items-center justify-between gap-3 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={getUserAvatarSrc(selectedInvestor)}
                        alt={selectedInvestor.name || "User"}
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-cyan-400/50 shadow-lg bg-slate-800"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            selectedInvestor.name || "User"
                          )}&background=0284c7&color=fff`;
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm truncate">{selectedInvestor.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                          ID: #{selectedInvestor.id}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 mt-0.5">
                        <span className="flex items-center gap-1 font-mono text-emerald-300 text-[11px]">
                          <FiPhone className="h-3 w-3" /> {selectedInvestor.mobile || "ফোন নেই"}
                        </span>
                        {selectedInvestor.email ? (
                          <span className="flex items-center gap-1 font-mono text-sky-300 text-[11px]">
                            <FiMail className="h-3 w-3" /> {selectedInvestor.email}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">
                            (ইমেইল যুক্ত নেই)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(true);
                      setUserSearchText("");
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-200 transition font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <FiSearch className="h-3 w-3" /> পরিবর্তন
                  </button>
                </div>
              ) : (
                /* Search Box with Suggestions Dropdown */
                <div className="relative">
                  <div className="relative">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 h-4 w-4 pointer-events-none" />
                    <input
                      type="text"
                      value={userSearchText}
                      onChange={(e) => {
                        setUserSearchText(e.target.value);
                        if (!userDropdownOpen) setUserDropdownOpen(true);
                      }}
                      onFocus={() => setUserDropdownOpen(true)}
                      placeholder="নাম, মোবাইল বা আইডি দিয়ে ইউজার খুঁজুন..."
                      className="w-full rounded-xl bg-black/40 border border-cyan-500/30 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setUserDropdownOpen((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <FiChevronDown className={`h-4 w-4 transition-transform duration-200 ${userDropdownOpen ? "rotate-180 text-cyan-400" : ""}`} />
                    </button>
                  </div>

                  {/* Dropdown Menu Container */}
                  {userDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border border-white/10 bg-[#091224] shadow-2xl backdrop-blur-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      {/* Dropdown Filter Bar */}
                      <div className="flex items-center justify-between p-2.5 bg-black/40 border-b border-white/10 text-xs">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setUserRoleFilter("all")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${userRoleFilter === "all" ? "bg-cyan-500 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`}
                          >
                            সকল ({users?.length || 0})
                          </button>
                          <button
                            type="button"
                            onClick={() => setUserRoleFilter("investor")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${userRoleFilter === "investor" ? "bg-violet-600 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`}
                          >
                            ইনভেস্টর
                          </button>
                          <button
                            type="button"
                            onClick={() => setUserRoleFilter("customer")}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${userRoleFilter === "customer" ? "bg-emerald-600 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`}
                          >
                            কাস্টমার
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUserDropdownOpen(false)}
                          className="text-slate-400 hover:text-white p-1"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      </div>

                      {/* User Items List */}
                      <div className="max-h-64 overflow-y-auto divide-y divide-white/[0.04] scrollbar-thin scrollbar-thumb-white/10">
                        {isUsersLoading ? (
                          <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                            ইউজার তালিকা লোড হচ্ছে...
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400">
                            🔍 কোনো ইউজার খুঁজে পাওয়া যায়নি {userSearchText ? `("${userSearchText}")` : ""}
                          </div>
                        ) : (
                          filteredUsers.map((u) => {
                            const isCurrentSelected = Number(form.investor_id) === Number(u.id);
                            const roleList = Array.isArray(u.roles) ? u.roles : [u.role || u.role_name || "user"];

                            return (
                              <div
                                key={u.id}
                                onClick={() => handleSelectUser(u)}
                                className={`p-2.5 sm:p-3 flex items-center justify-between gap-3 cursor-pointer transition ${
                                  isCurrentSelected
                                    ? "bg-cyan-500/15 border-l-4 border-cyan-400"
                                    : "hover:bg-white/[0.06]"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="relative shrink-0">
                                    <img
                                      src={getUserAvatarSrc(u)}
                                      alt={u.name || "User"}
                                      className="h-9 w-9 rounded-full object-cover ring-2 ring-white/10 shadow-sm bg-slate-800"
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                          u.name || "User"
                                        )}&background=0284c7&color=fff`;
                                      }}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-white text-xs truncate">{u.name}</span>
                                      <span className="text-[10px] font-mono text-cyan-400">#{u.id}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                                      <span>{u.mobile || "ফোন নেই"}</span>
                                      {u.email && (
                                        <span className="text-sky-400/80 truncate max-w-[130px]">
                                          • {u.email}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {roleList.slice(0, 2).map((r, i) => (
                                    <span
                                      key={i}
                                      className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300"
                                    >
                                      {r}
                                    </span>
                                  ))}
                                  {isCurrentSelected && (
                                    <FiCheckCircle className="text-cyan-400 h-4 w-4 ml-1" />
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Card Name */}
            <div>
              <label className="text-xs font-semibold text-slate-300">
                কার্ডের নাম (Card Name / Label) <span className="text-rose-400">*</span>
              </label>
              <div className="relative mt-1">
                <FiCreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  name="card_name"
                  value={form.card_name}
                  onChange={handleChange}
                  placeholder="যেমন: VIP Platinum Card বা গ্রাহকের নাম"
                  className="w-full rounded-xl bg-black/40 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/40 transition"
                />
              </div>
            </div>

            {/* 3. Payment Type */}
            <div>
              <label className="text-xs font-semibold text-slate-300">
                পেমেন্ট ধরণ (Payment Frequency Type)
              </label>
              <div className="relative mt-1">
                <FiLayers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                <select
                  name="payment_type"
                  value={form.payment_type}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-black/40 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/40 transition appearance-none cursor-pointer"
                >
                  <option value="flexible" className="bg-[#0b1322]">Flexible (ফ্লেক্সিবল / যখন ইচ্ছা)</option>
                  <option value="onetime" className="bg-[#0b1322]">Onetime (এককালীন)</option>
                  <option value="daily" className="bg-[#0b1322]">Daily (দৈনিক)</option>
                  <option value="weekly" className="bg-[#0b1322]">Weekly (সাপ্তাহিক)</option>
                  <option value="monthly" className="bg-[#0b1322]">Monthly (মাসিক)</option>
                </select>
              </div>
            </div>

            {/* 4. Start Date */}
            <div>
              <label className="text-xs font-semibold text-slate-300">
                শুরুর তারিখ (Start Date) <span className="text-rose-400">*</span>
              </label>
              <div className="relative mt-1">
                <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  name="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-black/40 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/40 transition cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                শুরুর তারিখ দিলে মেয়াদ উত্তীর্ণের তারিখ (Maturity) স্বয়ংক্রিয়ভাবে ১ বছর নির্ধারণ হবে।
              </p>
            </div>

            {/* 5. Reference User (Official Staff) */}
            <div>
              <label className="text-xs font-semibold text-slate-300">
                রেফারেন্স কর্মী (Official Reference Staff)
              </label>
              <select
                name="reference_user_id"
                value={form.reference_user_id}
                onChange={handleChange}
                disabled={isUsersLoading || isUsersError}
                className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/40 transition cursor-pointer"
              >
                <option value="" className="bg-[#0b1322]">
                  {isUsersLoading
                    ? "কর্মী তালিকা লোড হচ্ছে..."
                    : isUsersError
                    ? "লোড ব্যর্থ হয়েছে"
                    : "-- রেফারেন্স স্টাফ নির্বাচন করুন (ঐচ্ছিক) --"}
                </option>
                {officialStaff.map((u) => (
                  <option key={u.id} value={u.id} className="bg-[#0b1322]">
                    {u.name ?? u.full_name ?? u.username ?? `User #${u.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Auto System Fields */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="text-[11px] text-slate-400">মেয়াদ উত্তীর্ণ (Maturity Date)</div>
                <div className="text-xs sm:text-sm font-bold font-mono text-cyan-300 mt-0.5">
                  {form.maturity_date || "N/A"}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="text-[11px] text-slate-400">ডিফল্ট স্ট্যাটাস</div>
                <div className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Running (সক্রিয়)</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 py-3 text-sm font-bold text-white shadow-xl shadow-cyan-950/50 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>কার্ড তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <FiPlus className="h-4 w-4" />
                  <span>কার্ড নিশ্চিত ও তৈরি করুন</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Live Visual Card Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 px-1">
            <FiShield className="text-cyan-400 h-3.5 w-3.5" />
            <span>লাইভ কার্ড প্রিভিউ (Live Card Preview)</span>
          </div>

          {/* Futuristic Digital Card */}
          <div className="relative rounded-3xl p-6 bg-gradient-to-tr from-[#0a1936] via-[#102554] to-[#1c377a] border border-cyan-500/30 shadow-2xl shadow-cyan-950/70 overflow-hidden text-white min-h-[220px] flex flex-col justify-between">
            {/* Holographic glowing auras */}
            <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />

            {/* Top Bar of Digital Card */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                  <RiBankCard2Line className="h-4.5 w-4.5 text-cyan-300" />
                </div>
                <div>
                  <div className="text-[10px] tracking-widest uppercase font-mono text-cyan-200">SUPPLYLINK</div>
                  <div className="text-[9px] text-slate-300">Investment Portal</div>
                </div>
              </div>

              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300 uppercase">
                {form.payment_type}
              </span>
            </div>

            {/* Middle: Card Title & Chip */}
            <div className="my-5 relative z-10">
              <div className="text-lg sm:text-xl font-extrabold tracking-wide text-white truncate drop-shadow-md">
                {form.card_name || "কার্ডের নাম দিন..."}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                {selectedInvestor && (
                  <img
                    src={getUserAvatarSrc(selectedInvestor)}
                    alt={selectedInvestor.name || "User"}
                    className="h-6 w-6 rounded-full object-cover ring-1 ring-cyan-300/40 shadow-sm shrink-0 bg-slate-800"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        selectedInvestor.name || "User"
                      )}&background=0284c7&color=fff`;
                    }}
                  />
                )}
                <span className="text-xs text-cyan-300/90 font-mono truncate">
                  {selectedInvestor ? `${selectedInvestor.name} (ID: #${selectedInvestor.id})` : "গ্রাহক নির্বাচন করুন"}
                </span>
              </div>
            </div>

            {/* Bottom Bar: Dates & Status */}
            <div className="flex items-end justify-between relative z-10 pt-3 border-t border-white/10 text-xs font-mono">
              <div>
                <div className="text-[9px] text-slate-400 uppercase">START DATE</div>
                <div className="text-[11px] font-bold text-white">{form.start_date || "-"}</div>
              </div>

              <div className="text-right">
                <div className="text-[9px] text-slate-400 uppercase">MATURITY DATE</div>
                <div className="text-[11px] font-bold text-cyan-300">{form.maturity_date || "-"}</div>
              </div>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-slate-400 space-y-2">
            <div className="font-semibold text-slate-300">💡 গুরুত্বপূর্ণ তথ্য:</div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
              <li>কার্ড তৈরির পর এর বিপরীতে যেকোনো সময়ে কিস্তি আদায় করা যাবে।</li>
              <li>মেয়াদ পূর্ণ হলে (১ বছর পর) স্বয়ংক্রিয়ভাবে উইথড্র ও ক্লোজিং নোটিফিকেশন তৈরি হবে।</li>
              <li>রেফারেন্স কর্মীর অধীনে এই কার্ডের সার্বিক কালেকশন রিপোর্ট যুক্ত থাকবে।</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 🌟 Luxury Toast Notification */}
      <LuxuryToast
        toast={luxuryToast}
        onClose={() => setLuxuryToast(null)}
        duration={4500}
      />
    </div>
  );
}

import React, { useMemo, useState } from "react";
import useUsers from "../../../utils/Hooks/useUsers";
import Loader from "../../../components/Loader/Loader";
import { Link } from "react-router-dom";
import { 
  FiSearch, 
  FiPhone, 
  FiCreditCard, 
  FiMapPin, 
  FiUser, 
  FiArrowRight, 
  FiX, 
  FiUsers, 
  FiShield,
  FiExternalLink
} from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";

export default function Investors() {
  const { isUsersLoading, users, isUsersError } = useUsers();
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const keyword = search.toLowerCase().trim();

    return users
      // only investors
      .filter((user) => user.roles?.includes("investor"))
      // search inside investors
      .filter((user) => {
        if (!keyword) return true;
        return (
          user.name?.toLowerCase().includes(keyword) ||
          user.mobile?.toLowerCase().includes(keyword) ||
          String(user.id).includes(keyword) ||
          (user.id_number && String(user.id_number).toLowerCase().includes(keyword)) ||
          (user.address && user.address.toLowerCase().includes(keyword))
        );
      });
  }, [users, search]);

  const totalInvestors = useMemo(() => {
    if (!users) return 0;
    return users.filter((u) => u.roles?.includes("investor")).length;
  }, [users]);

  if (isUsersLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader />
        <p className="text-xs text-slate-400 font-medium">ইনভেস্টর তালিকা লোড হচ্ছে...</p>
      </div>
    );
  }

  if (isUsersError) {
    return (
      <div className="p-8 mx-auto max-w-lg my-12 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-center">
        <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3">
          <FiShield className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-white">ইনভেস্টর ডাটা লোড ব্যর্থ হয়েছে</h3>
        <p className="text-xs text-slate-400 mt-1">সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। অনুগ্রহ করে পেজটি রিফ্রেশ করুন।</p>
      </div>
    );
  }

  return (
    <div className="mx-auto  p-4 space-y-6 text-slate-200">
      {/* ===== Header & Title ===== */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
              <FiUsers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                ইনভেস্টর তালিকা (All Investors)
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                সিস্টেমে নিবন্ধিত সকল বিনিয়োগকারী গ্রাহক ও তাদের প্রোফাইল ব্যবস্থাপনা
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-[10px] text-slate-400 leading-none">মোট ইনভেস্টর</div>
              <div className="text-sm font-bold font-mono text-white mt-0.5">{totalInvestors} জন</div>
            </div>
          </div>
          {search && (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2 flex items-center gap-2.5">
              <div>
                <div className="text-[10px] text-cyan-300 leading-none">অনুসন্ধান ফলাফল</div>
                <div className="text-sm font-bold font-mono text-cyan-200 mt-0.5">{filteredUsers.length} জন</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Search & Filter Bar ===== */}
      <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#0d162a] via-[#0b1325] to-[#090f1d] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="relative w-full sm:max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="নাম, মোবাইল নম্বর, আইডি বা এনআইডি দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-black/40 border border-white/10 pl-10 pr-9 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/40 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <FiX className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 w-full sm:w-auto text-right">
          প্রদর্শিত হচ্ছে: <span className="font-bold text-white font-mono">{filteredUsers.length}</span> জন
        </div>
      </div>

      {/* ===== Investors Cards Grid ===== */}
      {filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-white/[0.06] bg-white/[0.01] text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/10 text-slate-500 mb-3 shadow-inner">
            <FiUser className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-300">কোনো ইনভেস্টর পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            "{search}" দিয়ে কোনো ইনভেস্টরের নাম বা মোবাইল পাওয়া যায়নি। সঠিক তথ্য দিয়ে পুনরায় খুঁজুন।
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredUsers.map((user) => {
            const avatarUrl = user.photo
              ? `https://api.supplylinkbd.com/${user.photo.replace(/^\/?(uploads\/)?/, "uploads/")}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=0284c7&color=fff&bold=true`;

            return (
              <div
                key={user.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0c162b]/90 via-[#0a1222]/90 to-[#070c18]/95 p-4.5 sm:p-5 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-950/30 transition-all duration-300"
              >
                {/* Top: Avatar, Name & ID */}
                <div>
                  <div className="flex items-start gap-3 mb-3.5">
                    <div className="relative shrink-0">
                      <img
                        src={avatarUrl}
                        alt={user.name}
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=0284c7&color=fff&bold=true`;
                        }}
                        className="w-13 h-13 rounded-2xl object-cover border-2 border-white/10 group-hover:border-cyan-400/50 shadow-md transition-colors"
                      />
                      <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-[#091122]" title="Active Investor" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                          ID #{user.id}
                        </span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          INVESTOR
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white truncate mt-1 group-hover:text-cyan-300 transition-colors">
                        {user.name || "নাম পাওয়া যায়নি"}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                        <FiPhone className="text-cyan-400 h-3 w-3 shrink-0" />
                        <span className="font-mono">{user.mobile || "N/A"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="space-y-1.5 text-xs text-slate-300 rounded-xl bg-black/25 border border-white/[0.04] p-3 mb-4">
                    {user.id_number && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <FiCreditCard className="text-slate-500 h-3.5 w-3.5 shrink-0" />
                        <span className="font-mono text-[11px] truncate">NID: {user.id_number}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-slate-400">
                      <FiMapPin className="text-slate-500 h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span className="text-[11px] line-clamp-1 text-slate-300">
                        {user.address || "ঠিকানা অন্তর্ভুক্ত নেই"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action: View Profile */}
                <Link
                  to={`/investors/details?user_id=${user.id}`}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-white/[0.04] hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/40 py-2.5 px-4 text-xs font-semibold text-slate-200 hover:text-white transition group-hover:shadow-sm"
                >
                  <span>প্রোফাইল ও কার্ডসমূহ দেখুন</span>
                  <FiArrowRight className="h-3.5 w-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

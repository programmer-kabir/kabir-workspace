import React, { useState } from "react";
import BackButton from "../../../components/BackButton/BackButton";
import LuxuryToast from "../../../components/Modal/LuxuryToast";
import { useAuth } from "../../../Provider/AuthProvider";
import useUserRole from "../../../utils/Hooks/useUserRole";
import HistoricalGapCard from "../../../components/cash/HistoricalGapCard";
import { FaHistory, FaShieldAlt, FaBookOpen } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function CashGapTracker() {
  const { user } = useAuth();
  const { userRoles, isAdminOrDev } = useUserRole();
  const userRole = isAdminOrDev ? "admin" : (userRoles?.[0] || user?.role || "staff");
  const [luxuryToast, setLuxuryToast] = useState(null);

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 text-slate-200">
      <BackButton />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <FaHistory size={14} />
            <span>HISTORICAL CASH AUDIT & GAP RECONCILIATION</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            অতীত ক্যাশ ঘাটতি ও আদায় ট্র্যাকার
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            সফটওয়্যার বা নতুন সিস্টেম চালুর পূর্ববর্তী সময়ে যে সমস্ত ক্যাশ টাকার অমিল বা ঘাটতি রয়ে গেছে, 
            এডমিন তা এখানে এককালীন ক্যাশ আউট হিসেবে এন্ট্রি করে ক্যাশ ব্যালেন্স সামঞ্জস্য করতে পারবেন 
            এবং পরবর্তীতে ধাপে ধাপে টাকা আদায় হলে ক্যাশ ইন সমন্বয় করতে পারবেন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdminOrDev ? (
            <span className="px-3.5 py-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-2 shadow-sm">
              <FaShieldAlt size={13} className="text-purple-400" />
              <span>এডমিন কন্ট্রোল অ্যাক্টিভ</span>
            </span>
          ) : (
            <span className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-400 border border-white/10 text-xs font-medium">
              ভিউ অনলি মোড
            </span>
          )}

          <Link
            to="/cash/bank-reconciliation"
            className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-2 transition"
          >
            <FaBookOpen size={12} className="text-emerald-400" />
            <span>ব্যাংক রিকনসিলিয়েশন</span>
          </Link>
        </div>
      </div>

      {/* Main Historical Gap Manager Card */}
      <HistoricalGapCard
        user={user}
        userRole={userRole}
        isAdminOrDev={isAdminOrDev}
        setLuxuryToast={setLuxuryToast}
      />

      {/* Toast Notification */}
      {luxuryToast && (
        <LuxuryToast
          {...luxuryToast}
          onClose={() => setLuxuryToast(null)}
        />
      )}
    </div>
  );
}


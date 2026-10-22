import React, { useMemo } from "react";
import {
  HiUser,
  HiPhone,
  HiMapPin,
  HiCube,
  HiCurrencyBangladeshi,
  HiCalendarDays,
  HiShieldCheck,
  HiCheckCircle,
  HiClock,
  HiTag,
} from "react-icons/hi2";
import { FaIdCard, FaUserShield } from "react-icons/fa";
import useUsers from "../../utils/Hooks/useUsers";
import useCustomerGranter from "../../utils/Granters/useCustomerGranter";

const CustomerOrderInfo = ({ currentCard, InstallmentPayments = [] }) => {
  const { users = [] } = useUsers();
  const { CustomerGranter = [] } = useCustomerGranter();

  // Find customer
  const currentUser = useMemo(() => {
    return users.find((u) => Number(u.id) === Number(currentCard?.user_id));
  }, [users, currentCard?.user_id]);

  // Find guarantor
  const guarantor = useMemo(() => {
    const link = CustomerGranter.find(
      (g) => Number(g.customer_user_id) === Number(currentCard?.user_id)
    );
    if (!link?.guarantor_user_id) return null;
    return users.find((u) => Number(u.id) === Number(link.guarantor_user_id));
  }, [CustomerGranter, users, currentCard?.user_id]);

  // Financial calculations
  const salePrice = Number(currentCard?.sale_price || 0);
  const purchasePrice = Number(currentCard?.purchase_price || 0);
  const estimatedProfit = salePrice - purchasePrice;

  const totalPayments = InstallmentPayments.length;
  const paidPayments = InstallmentPayments.filter((p) => p.status === "Paid");
  const paidAmount = paidPayments.reduce(
    (sum, p) => sum + Number(p.due_amount || 0),
    0
  );
  const remainingDue = Math.max(0, salePrice - paidAmount);
  const progressPercent =
    salePrice > 0 ? Math.min(100, Math.round((paidAmount / salePrice) * 100)) : 0;

  const isFullPaid =
    currentCard?.status === "Fully Paid" ||
    (totalPayments > 0 && paidPayments.length === totalPayments);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* ================= CARD 1: CUSTOMER & GUARANTOR ================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-5 shadow-xl hover:border-indigo-500/30 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <HiUser className="text-lg" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                কার্ড গ্রাহকের তথ্য
              </h3>
              <p className="text-[11px] text-slate-400">ব্যক্তিগত ও যোগাযোগের বিবরণ</p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            ID: #{currentUser?.id || currentCard?.user_id || "—"}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
              <HiUser className="text-xs" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400">নাম</p>
              <p className="text-sm font-semibold text-slate-200 truncate">
                {currentUser?.name || "নাম পাওয়া যায়নি"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                <HiPhone className="text-xs" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400">মোবাইল</p>
                <p className="text-xs font-mono font-medium text-slate-200 truncate">
                  {currentUser?.mobile || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                <FaIdCard className="text-xs" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400">জাতীয় পরিচয়পত্র</p>
                <p className="text-xs font-mono font-medium text-slate-200 truncate">
                  {currentUser?.id_number || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
              <HiMapPin className="text-xs" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400">ঠিকানা</p>
              <p className="text-xs text-slate-300 leading-relaxed truncate">
                {currentUser?.address || "ঠিকানা উল্লেখ নেই"}
              </p>
            </div>
          </div>

          {/* Guarantor Snippet */}
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <FaUserShield className="text-emerald-400 text-xs" />
              <span>গ্যারান্টার:</span>
            </div>
            {guarantor ? (
              <span className="font-medium text-emerald-400 truncate max-w-[160px]">
                {guarantor.name} ({guarantor.mobile})
              </span>
            ) : (
              <span className="text-slate-500 italic">নির্ধারিত নেই</span>
            )}
          </div>
        </div>
      </div>

      {/* ================= CARD 2: PRODUCT & FINANCIAL TERMS ================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-5 shadow-xl hover:border-sky-500/30 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <HiCube className="text-lg" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                পণ্য ও চুক্তি বিবরণী
              </h3>
              <p className="text-[11px] text-slate-400">ক্রয়-বিক্রয় ও লাভ মার্জিন</p>
            </div>
          </div>
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
            {currentCard?.installment_count || totalPayments || 0} কিস্তি
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-800/40 px-3 py-2 rounded-xl border border-white/[0.04]">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <HiTag className="text-sky-400" /> পণ্যের নাম:
            </span>
            <span className="text-xs font-semibold text-white truncate max-w-[170px]" title={currentCard?.product_name}>
              {currentCard?.product_name || "—"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800/30 p-2.5 rounded-xl border border-white/[0.04]">
              <p className="text-[10px] text-slate-400">বিক্রয় মূল্য (Total)</p>
              <p className="text-sm font-mono font-bold text-emerald-400">
                ৳ {salePrice.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-800/30 p-2.5 rounded-xl border border-white/[0.04]">
              <p className="text-[10px] text-slate-400">ক্রয় মূল্য (Cost)</p>
              <p className="text-sm font-mono font-bold text-slate-300">
                ৳ {purchasePrice.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between bg-slate-800/20 p-2 rounded-lg">
              <span className="text-[11px] text-slate-400">মোট লাভ:</span>
              <span className="font-mono font-bold text-amber-300">
                ৳ {estimatedProfit.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between bg-slate-800/20 p-2 rounded-lg">
              <span className="text-[11px] text-slate-400">প্রতি কিস্তি:</span>
              <span className="font-mono font-bold text-sky-300">
                ৳ {Number(currentCard?.per_installment_amount || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <HiCalendarDays className="text-slate-500" /> ডেলিভারি: {currentCard?.delivery_date || "—"}
            </span>
            <span>১ম কিস্তি: {currentCard?.first_installment_date || "—"}</span>
          </div>
        </div>
      </div>

      {/* ================= CARD 3: PROGRESS & STATUS ================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-5 shadow-xl hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div>
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <HiShieldCheck className="text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  আদায় ও অগ্রগতি স্থিতি
                </h3>
                <p className="text-[11px] text-slate-400">লাইভ রিকভারি স্ট্যাটাস</p>
              </div>
            </div>

            {isFullPaid ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <HiCheckCircle className="text-xs" /> সম্পূর্ণ পরিশোধিত
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <HiClock className="text-xs" /> চলমান (Running)
              </span>
            )}
          </div>

          {/* Progress Bar Section */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">পরিশোধের অগ্রগতি</span>
              <span className="font-mono font-bold text-emerald-400">
                {progressPercent}%
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/[0.05]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>
                {paidPayments.length} / {totalPayments || currentCard?.installment_count || 0} কিস্তি পরিশোধিত
              </span>
              <span>{totalPayments - paidPayments.length} টি বাকি</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/[0.06]">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-emerald-300 font-medium">মোট আদায় হয়েছে</p>
            <p className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
              ৳ {paidAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 text-center">
            <p className="text-[10px] text-rose-300 font-medium">মোট বকেয়া আছে</p>
            <p className="text-sm font-mono font-bold text-rose-400 mt-0.5">
              ৳ {remainingDue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderInfo;

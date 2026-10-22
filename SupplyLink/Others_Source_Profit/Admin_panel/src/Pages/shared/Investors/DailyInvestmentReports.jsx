import React, { useState, useMemo } from "react";
import useInvestInstallment from "../../../utils/Investors/useInvestInstallment";
import useUsers from "../../../utils/Hooks/useUsers";
import Loader from "../../../components/Loader/Loader";
import BackButton from "../../../components/BackButton/BackButton";
import { 
  FiCalendar, 
  FiPrinter, 
  FiFileText, 
  FiUser, 
  FiTrendingUp, 
  FiClock, 
  FiAlertCircle 
} from "react-icons/fi";
import { FaMoneyBillWave, FaReceipt } from "react-icons/fa";

/* 🔁 yyyy-mm-dd → yy-mm-dd */
const toYYMMDD = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${y.slice(2)}-${m}-${d}`;
};

export default function DailyInvestmentReports() {
  const { users, isUsersLoading } = useUsers();
  const { investInstallments, inInvestInstallmentsLoading } = useInvestInstallment();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  /* 🧠 users map (id → name) */
  const usersMap = useMemo(() => {
    return (
      users?.reduce((acc, u) => {
        acc[u.id] = u.name;
        return acc;
      }, {}) || {}
    );
  }, [users]);

  const getShortName = (name = "") => {
    return name
      .replace(/^(মোঃ|মো:|মো|মোহাম্মদ|Md\.?|MD\.?|Mohammad|Mohammed)\s*/i, "")
      .trim();
  };

  const filteredData = useMemo(() => {
    if (!investInstallments?.length) return [];
    return investInstallments
      .filter(
        (item) =>
          item.investment_date?.slice(0, 10) === date &&
          Number(item.investment_card_no) !== 1,
      )
      .sort((a, b) => a.investor_id - b.investor_id)
      .map((item) => ({
        id: item.id,
        investorId: item.investor_id,
        investorName: usersMap[item.investor_id] || "অজানা গ্রাহক",
        slip: item.investment_no,
        amount: Number(item.amount || 0),
        collector: getShortName(usersMap[item.signature_by] || "স্টাফ"),
        updatedBy: getShortName(usersMap[item.updated_by]),
        updatedAt: item.updated_at,
        updateReason: item.update_reason,
      }));
  }, [investInstallments, date, usersMap]);

  /* 💰 total amount (dynamic) */
  const totalAmount = useMemo(() => {
    return filteredData.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  }, [filteredData]);

  if (isUsersLoading || inInvestInstallmentsLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader />
        <p className="text-xs text-slate-400 font-medium">দৈনিক রিপোর্ট লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6 text-slate-200">
      <div className="print:hidden">
        <BackButton />
      </div>

      {/* Header & Date Controls */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25">
              <FiTrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                দৈনিক বিনিয়োগ সংগ্রহ রিপোর্ট (Daily Investment Summary)
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                নির্বাচিত তারিখে আদায়কৃত সকল বিনিয়োগ কিস্তি ও কালেকশন বিস্তারিত
              </p>
            </div>
          </div>
        </div>

        {/* Date Filter & Print */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl bg-[#0b1324] border border-white/10 px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400/50 cursor-pointer"
            />
          </div>

          <button
            onClick={() => setDate(today)}
            className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
          >
            আজকের তারিখ
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer"
          >
            <FiPrinter className="h-3.5 w-3.5" />
            <span>প্রিন্ট করুন</span>
          </button>
        </div>
      </header>

      {/* Top 2 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="p-4.5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#081a15] to-[#0d2a20] shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span>মোট দৈনিক সংগ্রহ</span>
            <FaMoneyBillWave className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-300 mt-2">
            ৳{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            তারিখ: <strong className="text-white font-mono">{date}</strong>
          </div>
        </div>

        <div className="p-4.5 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-[#071626] to-[#0c243c] shadow-lg">
          <div className="flex items-center justify-between text-xs text-cyan-400 font-semibold">
            <span>সংগৃহীত কিস্তির সংখ্যা</span>
            <FaReceipt className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-200 mt-2">
            {filteredData.length} টি
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            মোট অনন্য গ্রাহক কালেকশন সম্পন্ন
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0c162b]/95 to-[#070d19]/95 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-white/[0.08] bg-black/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 text-center w-12">#</th>
                <th className="py-3 px-4">গ্রাহকের নাম ও আইডি</th>
                <th className="py-3 px-4">স্লিপ নং</th>
                <th className="py-3 px-4 text-right">টাকা (৳)</th>
                <th className="py-3 px-4">সংগ্রহকারী</th>
                <th className="py-3 px-4">আপডেটকারী</th>
                <th className="py-3 px-4">আপডেট সময়</th>
                <th className="py-3 px-4">কারণ (Reason)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.04]">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <FiFileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">এই তারিখে কোনো বিনিয়োগ কালেকশন রেকর্ড নেই</p>
                    <p className="text-xs text-slate-500 mt-0.5">তারিখ পরিবর্তন করে অন্য দিনের ডাটা পরীক্ষা করুন</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => (
                  <tr key={row.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">{index + 1}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{row.investorName}</div>
                      <span className="font-mono text-[10px] text-cyan-300">ID #{row.investorId}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 text-slate-300 text-xs">
                        #{row.slip}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      ৳{row.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 capitalize">
                      <div className="flex items-center gap-1.5">
                        <FiUser className="h-3 w-3 text-cyan-400" />
                        <span>{row.collector}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {row.updatedBy ? (
                        <span className="text-amber-300 font-medium">{row.updatedBy}</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {row.updatedAt || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {row.updateReason ? (
                        <span className="italic text-xs text-amber-200/90">"{row.updateReason}"</span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Total Footer */}
            {filteredData.length > 0 && (
              <tfoot className="border-t-2 border-white/10 bg-black/60 font-bold">
                <tr>
                  <td colSpan="3" className="py-3.5 px-4 text-right text-xs uppercase tracking-wider text-slate-300">
                    সর্বমোট সংগ্রহ:
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-base font-extrabold text-emerald-300">
                    ৳{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan="4" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </main>
  );
}

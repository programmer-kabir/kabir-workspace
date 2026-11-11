import React, { useMemo, useState } from "react";
import useInvestInstallment from "../../../utils/Investors/useInvestInstallment";
import useUsers from "../../../utils/Hooks/useUsers";
import Loader from "../../../components/Loader/Loader";
import BackButton from "../../../components/BackButton/BackButton";
import { 
  FiCalendar, 
  FiPrinter, 
  FiTrendingUp, 
  FiFileText, 
  FiDollarSign, 
  FiLayers 
} from "react-icons/fi";
import { FaMoneyBillWave, FaCoins, FaHistory } from "react-icons/fa";

/* 🔁 yyyy-mm-dd → yy-mm-dd */
const toYYMMDD = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${y.slice(2)}-${m}-${d}`;
};

const pad2 = (n) => String(n).padStart(2, "0");

export default function MonthlyInvestmentReport() {
  const { users, isUsersLoading } = useUsers();
  const { investInstallments, inInvestInstallmentsLoading } = useInvestInstallment();

  // default current month (yyyy-mm)
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
  const [month, setMonth] = useState(defaultMonth);

  /* 🧠 users map (id → name) */
  const usersMap = useMemo(() => {
    return (
      users?.reduce((acc, u) => {
        acc[Number(u.id)] = u.name;
        return acc;
      }, {}) || {}
    );
  }, [users]);

  // month start date (yyyy-mm-01)
  const monthStart = useMemo(() => `${month}-01`, [month]);

  // Opening Balance = selected month-এর আগের সব জমা যোগফল
  const openingBalance = useMemo(() => {
    if (!investInstallments?.length) return 0;

    return investInstallments.reduce((sum, item) => {
      if (Number(item.investment_card_no) === 1) return sum;

      const d = item.investment_date?.slice(0, 10);
      if (!d) return sum;
      if (d < monthStart) return sum + Number(item.amount || 0);
      return sum;
    }, 0);
  }, [investInstallments, monthStart]);

  // monthly flat rows
  const monthlyRows = useMemo(() => {
    if (!investInstallments?.length) return [];

    return investInstallments
      .filter((item) => {
        if (Number(item.investment_card_no) === 1) return false;
        const d = item.investment_date?.slice(0, 10);
        return d && d.slice(0, 7) === month;
      })
      .map((item) => ({
        id: item.id,
        date: item.investment_date?.slice(0, 10),
        investorId: Number(item.investor_id),
        investorName: usersMap[Number(item.investor_id)] || "Unknown",
        slip: item.investment_no,
        amount: Number(item.amount || 0),
        collector: item.signature_by || "",
      }));
  }, [investInstallments, month, usersMap]);

  // group by date + running total
  const dailySummary = useMemo(() => {
    const map = new Map();

    for (const r of monthlyRows) {
      if (!r.date) continue;

      if (!map.has(r.date)) {
        map.set(r.date, {
          date: r.date,
          uniqueInvestors: new Set(),
          dailyTotal: 0,
        });
      }

      const obj = map.get(r.date);
      obj.uniqueInvestors.add(r.investorId);
      obj.dailyTotal += r.amount;
    }

    const sorted = Array.from(map.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    let running = Number(openingBalance || 0);

    return sorted.map((d) => {
      const daily = Number(d.dailyTotal || 0);
      running += daily;

      return {
        date: d.date,
        investorsCount: d.uniqueInvestors.size,
        dailyTotal: daily,
        runningTotal: running,
      };
    });
  }, [monthlyRows, openingBalance]);

  const monthDepositTotal = useMemo(() => {
    return dailySummary.reduce((sum, d) => sum + Number(d.dailyTotal || 0), 0);
  }, [dailySummary]);

  const closingBalance = useMemo(() => {
    return Number(openingBalance || 0) + Number(monthDepositTotal || 0);
  }, [openingBalance, monthDepositTotal]);

  const BN_MONTHS = [
    "জানুয়ারি",
    "ফেব্রুয়ারি",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্টেম্বর",
    "অক্টোবর",
    "নভেম্বর",
    "ডিসেম্বর",
  ];

  const formatMonthLabelBN = (yyyyMM) => {
    if (!yyyyMM) return "";
    const [y, m] = yyyyMM.split("-");
    const idx = Number(m) - 1;
    const name = BN_MONTHS[idx] || yyyyMM;
    return `${name} ${y}`;
  };

  if (isUsersLoading || inInvestInstallmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader />
        <p className="text-xs text-slate-400 font-medium">মাসিক রিপোর্ট প্রস্তুত হচ্ছে...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6 text-slate-200 print:p-0 print:bg-white print:text-black">
      {/* PRINT STYLES */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }

        @media print {
          :root {
            --tbl-font: 12px;
            --cell-py: 6px;
            --cell-px: 8px;
            --tbl-scale: 1;
          }

          html, body {
            background: #fff !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #root, #app, main, section, header, footer, div {
            background: #fff !important;
            color: #000 !important;
          }

          .print-hidden, .print\\:hidden {
            display: none !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: var(--tbl-font) !important;
            background: #fff !important;
          }

          th, td {
            padding: var(--cell-py) var(--cell-px) !important;
            color: #000 !important;
            border-bottom: 1px solid #e5e7eb !important;
            line-height: 1.2 !important;
          }

          thead tr {
            background: #f3f4f6 !important;
            color: #000 !important;
          }

          tr, td, th {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="print:hidden">
        <BackButton />
      </div>

      {/* Screen Header */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25">
              <FaCoins className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                মাসিক বিনিয়োগ সংগ্রহ রিপোর্ট (Monthly Investment Summary)
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                নির্বাচিত মাসের দৈনিক অগ্রগতি ও ক্রমবর্ধমান মোট জমা হিসাব
              </p>
            </div>
          </div>
        </div>

        {/* Month Selector & Print */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-xl bg-[#0b1324] border border-white/10 px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400/50 cursor-pointer"
            />
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer"
          >
            <FiPrinter className="h-3.5 w-3.5" />
            <span>প্রিন্ট রিপোর্ট</span>
          </button>
        </div>
      </header>

      {/* 3 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 print:hidden">
        {/* 1. Opening Balance */}
        <div className="p-4.5 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1424] to-[#101b30] shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>প্রারম্ভিক জমা (Opening Balance)</span>
            <FaHistory className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-200 mt-2">
            ৳{openingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {month} এর পূর্ববর্তী মোট সংরক্ষিত স্থিতি
          </div>
        </div>

        {/* 2. Month Deposits */}
        <div className="p-4.5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#081a15] to-[#0e2e22] shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span>এই মাসের মোট সংগ্রহ (Month Deposit)</span>
            <FaMoneyBillWave className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-2">
            ৳{monthDepositTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {formatMonthLabelBN(month)} এর সর্বমোট আদায়
          </div>
        </div>

        {/* 3. Closing Cumulative Balance */}
        <div className="p-4.5 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-[#071626] to-[#0c243c] shadow-lg">
          <div className="flex items-center justify-between text-xs text-cyan-400 font-semibold">
            <span>সমাপনী স্থিতি (Cumulative Total)</span>
            <FiTrendingUp className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-200 mt-2">
            ৳{closingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            মাস শেষে মোট সঞ্চিত বিনিয়োগ
          </div>
        </div>
      </div>

      {/* Print Document Title Header */}
      <div className="hidden print:block mb-4 p-4 border-b border-gray-300 bg-white">
        <h1 className="text-xl font-bold text-black">মাসিক বিনিয়োগ সংগ্রহ রিপোর্ট</h1>
        <p className="text-sm text-gray-700 mt-0.5">মাস: {formatMonthLabelBN(month)} ({month})</p>
        <div className="flex gap-6 mt-2 text-xs font-mono font-semibold">
          <span>প্রারম্ভিক: ৳{openingBalance.toFixed(2)}</span>
          <span>এই মাসের জমা: ৳{monthDepositTotal.toFixed(2)}</span>
          <span>সর্বমোট স্থিতি: ৳{closingBalance.toFixed(2)}</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0c162b]/95 to-[#070d19]/95 overflow-hidden shadow-xl print:shadow-none print:border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-white/[0.08] bg-black/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider print:bg-gray-100 print:text-black">
              <tr>
                <th className="py-3 px-4 text-center w-14">ক্রমিক</th>
                <th className="py-3 px-4">তারিখ</th>
                <th className="py-3 px-4 text-center">ইনভেস্টর সংখ্যা</th>
                <th className="py-3 px-4 text-right">দৈনিক সংগ্রহ (৳)</th>
                <th className="py-3 px-4 text-right">এখন পর্যন্ত মোট স্থিতি (৳)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.04]">
              {dailySummary.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <FiFileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">এই মাসে কোনো বিনিয়োগ কালেকশন রেকর্ড পাওয়া যায়নি</p>
                    <p className="text-xs text-slate-500 mt-0.5">অন্য কোনো মাস নির্বাচন করে রিপোর্ট দেখুন</p>
                  </td>
                </tr>
              ) : (
                dailySummary.map((d, index) => (
                  <tr key={d.date} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">{index + 1}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-white print:text-black">
                      {d.date} ({toYYMMDD(d.date)})
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold">
                        {d.investorsCount} জন
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 print:text-black text-sm">
                      ৳{d.dailyTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-cyan-300 print:text-black text-sm">
                      ৳{d.runningTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Total Footer */}
            {dailySummary.length > 0 && (
              <tfoot className="border-t-2 border-white/10 bg-black/60 font-bold print:bg-gray-100 print:text-black">
                <tr>
                  <td colSpan="3" className="py-3.5 px-4 text-right text-xs uppercase tracking-wider text-slate-300 print:text-black">
                    এই মাসে মোট সংগৃহীত:
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-base font-extrabold text-emerald-300 print:text-black">
                    ৳{monthDepositTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-base font-extrabold text-cyan-300 print:text-black">
                    ৳{closingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </main>
  );
}

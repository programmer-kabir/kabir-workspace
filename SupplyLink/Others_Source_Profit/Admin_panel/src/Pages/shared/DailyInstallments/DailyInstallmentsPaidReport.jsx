import React, { useMemo, useState } from "react";
import { useAuth } from "../../../Provider/AuthProvider";
import useUsers from "../../../utils/Hooks/useUsers";
import useCustomerInstallmentPayments from "../../../utils/Hooks/Customers/useCustomerInstallmentPayments";
import useCustomerInstallmentCards from "../../../utils/Hooks/useCustomerInstallmentCards";
import Loader from "../../../components/Loader/Loader";
import BackButton from "../../../components/BackButton/BackButton";
import { MONTHS } from "../../../../public/month";
import {
  FiCalendar,
  FiPrinter,
  FiSearch,
  FiX,
  FiUser,
  FiCreditCard,
  FiDollarSign,
  FiCheckCircle,
  FiExternalLink,
  FiRefreshCw
} from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";
import { Link } from "react-router-dom";

const toYYMMDD = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${y.slice(2)}-${m}-${d}`;
};

const getMonthNameFromYYMMDD = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length < 2) return "";
  const monthNumber = Number(parts[1]);
  const month = MONTHS.find((m) => m.value === monthNumber);
  return month?.label || "";
};

const cleanName = (name) => {
  return (name || "")
    .replace(/^মোঃ\s*/g, "")
    .replace(/^Md\.?\s*/gi, "")
    .replace(/^Mohammad\s*/gi, "")
    .trim();
};

const DailyInstallmentsPaidReport = () => {
  const { user } = useAuth();
  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role];
  const isDeveloperOrAdmin = userRoles.some((r) =>
    ["developer", "admin"].includes(String(r || "").toLowerCase())
  );

  const { users = [], isUsersLoading } = useUsers();
  const {
    isCustomerInstallmentsPaymentsLoading,
    customerInstallmentPayments = [],
  } = useCustomerInstallmentPayments();

  const {
    isCustomerInstallmentsCardsLoading,
    customerInstallmentCards = [],
  } = useCustomerInstallmentCards();

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [search, setSearch] = useState("");

  const usersMap = useMemo(() => {
    return (
      users?.reduce((acc, u) => {
        acc[u.id] = {
          name: u.name,
          cleanName: cleanName(u.name),
          photo: u.photo ? `https://api.supplylinkbd.com/${u.photo}` : null,
          mobile: u.mobile,
        };
        return acc;
      }, {}) || {}
    );
  }, [users]);

  const cardsById = useMemo(() => {
    return (
      customerInstallmentCards?.reduce((acc, c) => {
        const cardId = Number(c.id);
        acc[cardId] = {
          card_id: cardId,
          card_number: c.card_number || "N/A",
          user_id: Number(c.user_id || 0),
          remarks: c.remarks || "",
          is_daily: Number(c.is_daily || 0),
        };
        return acc;
      }, {}) || {}
    );
  }, [customerInstallmentCards]);

  const filteredData = useMemo(() => {
    if (!customerInstallmentPayments?.length) return [];

    return customerInstallmentPayments
      .filter((p) => {
        if ((p.paid_date || "").slice(0, 10) !== date) return false;

        const card = cardsById[Number(p.card_id || 0)];
        const remarks = (card?.remarks || "").trim().toLowerCase();

        return card?.is_daily === 1 || remarks === "daily";
      })
      .map((p) => {
        const cardId = Number(p.card_id || 0);
        const card = cardsById[cardId];

        const customerId = Number(
          card?.user_id || p.user_id || p.customer_id || p.investor_id || 0
        );

        const customerInfo = usersMap[customerId] || {
          name: "Unknown",
          cleanName: "Unknown",
          photo: null,
          mobile: "",
        };

        const collectorInfo = usersMap[p.collected_by] || {
          name: `Staff #${p.collected_by || "—"}`,
          cleanName: `Staff #${p.collected_by || "—"}`,
          photo: null,
        };

        const dueDate = p.due_date || "";
        const monthName = getMonthNameFromYYMMDD(dueDate);

        return {
          id: p.id,
          paid_date: (p.paid_date || "").slice(0, 10),
          customerId,
          customerName: customerInfo.name,
          customerCleanName: customerInfo.cleanName,
          customerPhoto: customerInfo.photo,
          customerMobile: customerInfo.mobile,
          collectedBy: p.collected_by,
          collectedByName: collectorInfo.cleanName,
          collectedByPhoto: collectorInfo.photo,
          cardId,
          cardNumber: card?.card_number || "N/A",
          dueDate,
          monthName,
          amount: Number(p.due_amount || 0),
          installmentNo: p.tag,
        };
      })
      .sort((a, b) => a.customerId - b.customerId);
  }, [
    customerInstallmentPayments,
    customerInstallmentCards,
    date,
    cardsById,
    usersMap,
  ]);

  const searchedData = useMemo(() => {
    if (!search.trim()) return filteredData;
    const term = search.toLowerCase().trim();
    return filteredData.filter((row) => {
      return (
        row.customerName.toLowerCase().includes(term) ||
        String(row.customerId).includes(term) ||
        String(row.cardNumber).includes(term) ||
        row.collectedByName.toLowerCase().includes(term) ||
        String(row.amount).includes(term)
      );
    });
  }, [filteredData, search]);

  const totalAmount = useMemo(() => {
    return searchedData.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  }, [searchedData]);

  const uniqueCustomersCount = useMemo(() => {
    return new Set(searchedData.map((r) => r.customerId)).size;
  }, [searchedData]);

  if (
    isUsersLoading ||
    isCustomerInstallmentsPaymentsLoading ||
    isCustomerInstallmentsCardsLoading
  ) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader />
      </div>
    );
  }

  return (
    <main className="min-h-screen text-slate-100 space-y-6 pb-12 print:bg-white print:text-black">
      {/* ================= HEADER & CONTROLS ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08] print:border-black">
        <div className="flex items-center gap-3">
          <div className="print:hidden">
            <BackButton />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white print:text-black flex items-center gap-2">
              দৈনিক কিস্তি আদায়ের সংগৃহীত রিপোর্ট
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono print:border-black print:text-black">
                {toYYMMDD(date)}
              </span>
            </h1>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">
              কার্ডভিত্তিক সফলভাবে পরিশোধিত কিস্তি ও আদায়কারী কর্মীদের হিসাব
            </p>
          </div>
        </div>

        {/* Date Filter & Print */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-[#090f20] border border-white/10 px-3.5 py-2 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
          />

          <button
            onClick={() => setDate(today)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition active:scale-95 shadow cursor-pointer"
          >
            আজ
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <FiPrinter className="text-xs" />
            <span>প্রিন্ট করুন</span>
          </button>
        </div>
      </div>

      {/* ================= METRIC KPI TILES ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 print:grid-cols-3">
        <div className="p-4 rounded-2xl bg-[#080d1a] border border-white/[0.08] shadow-lg print:border-black print:bg-white">
          <p className="text-slate-400 print:text-gray-600 text-xs flex items-center justify-between">
            <span>মোট আদায়কৃত অর্থ</span>
            <FaMoneyBillWave className="text-emerald-400 print:text-black" />
          </p>
          <h2 className="text-2xl font-bold font-mono text-emerald-400 print:text-black mt-1">
            ৳{totalAmount.toLocaleString("en-IN")}
          </h2>
          <p className="text-[11px] text-slate-500 print:text-gray-500 mt-0.5">
            এই তারিখে সম্পূর্ণ সংগৃহীত টাকা
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#080d1a] border border-white/[0.08] shadow-lg print:border-black print:bg-white">
          <p className="text-slate-400 print:text-gray-600 text-xs flex items-center justify-between">
            <span>পরিশোধিত কিস্তির সংখ্যা</span>
            <FiCreditCard className="text-cyan-400 print:text-black" />
          </p>
          <h2 className="text-2xl font-bold font-mono text-cyan-300 print:text-black mt-1">
            {searchedData.length} টি
          </h2>
          <p className="text-[11px] text-slate-500 print:text-gray-500 mt-0.5">
            আদায় এন্ট্রির সংখ্যা
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#080d1a] border border-white/[0.08] shadow-lg print:border-black print:bg-white">
          <p className="text-slate-400 print:text-gray-600 text-xs flex items-center justify-between">
            <span>আদায়কৃত গ্রাহক সংখ্যা</span>
            <FiUser className="text-indigo-400 print:text-black" />
          </p>
          <h2 className="text-2xl font-bold font-mono text-indigo-300 print:text-black mt-1">
            {uniqueCustomersCount} জন
          </h2>
          <p className="text-[11px] text-slate-500 print:text-gray-500 mt-0.5">
            স্বতন্ত্র পরিশোধকারী গ্রাহক
          </p>
        </div>
      </div>

      {/* ================= SEARCH INPUT ================= */}
      <div className="relative print:hidden">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="গ্রাহকের নাম, আইডি, কার্ড নং বা সংগ্রাহক কর্মী দিয়ে খুঁজুন..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#080d1a] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <FiX className="text-xs" />
          </button>
        )}
      </div>

      {/* ================= TABLE ================= */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070b16] shadow-2xl print:border-black print:bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#0a1020] text-slate-400 font-semibold text-[11px] print:border-black print:bg-gray-100 print:text-black">
                <th className="py-3.5 px-4 min-w-[50px]">#</th>
                <th className="py-3.5 px-4 min-w-[200px]">গ্রাহকের নাম (আইডি)</th>
                <th className="py-3.5 px-4 min-w-[120px]">কার্ড নং</th>
                <th className="py-3.5 px-4 min-w-[120px]">মাসের নাম</th>
                <th className="py-3.5 px-4 min-w-[100px]">কিস্তির ট্যাগ</th>
                <th className="py-3.5 px-4 min-w-[130px] text-right">আদায়কৃত টাকা (৳)</th>
                <th className="py-3.5 px-4 min-w-[180px]">সংগ্রাহক (Receiver)</th>
                <th className="py-3.5 px-4 min-w-[100px] text-center print:hidden">চার্ট</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.04] text-slate-200 print:text-black print:divide-gray-300">
              {searchedData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FiCalendar className="h-8 w-8 text-slate-600 mb-2" />
                      <span className="text-sm font-medium text-slate-400 print:text-black">
                        এই তারিখে কোনো দৈনিক কিস্তি আদায়ের ডাটা নেই
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                searchedData.map((row, index) => (
                  <tr
                    key={row.id}
                    className="hover:bg-white/[0.02] transition-colors print:hover:bg-transparent"
                  >
                    {/* Index */}
                    <td className="py-3.5 px-4 font-mono text-slate-500 print:text-gray-700">
                      {index + 1}
                    </td>

                    {/* Customer Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {row.customerPhoto ? (
                          <img
                            src={row.customerPhoto}
                            alt={row.customerCleanName}
                            className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0 print:hidden"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0 print:hidden font-mono">
                            {row.customerCleanName.charAt(0) || "C"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-semibold text-white print:text-black text-xs block truncate">
                            {row.customerCleanName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ID: #{row.customerId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Card Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-300 print:text-black">
                      #{row.cardNumber}
                    </td>

                    {/* Month Name */}
                    <td className="py-3.5 px-4 text-slate-300 print:text-black">
                      {row.monthName || "—"}
                    </td>

                    {/* Installment Tag */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium print:border-black print:text-black">
                        {row.installmentNo || "কিস্তি"}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 print:text-black text-sm">
                      ৳{row.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Collector Name & Avatar (Real Name NOT 290) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {row.collectedByPhoto ? (
                          <img
                            src={row.collectedByPhoto}
                            alt={row.collectedByName}
                            className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0 print:hidden"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-[10px] shrink-0 print:hidden font-mono">
                            {row.collectedByName.charAt(0) || "S"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-200 print:text-black text-xs block truncate">
                            {row.collectedByName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ID: {row.collectedBy}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Direct Chart Link */}
                    <td className="py-3.5 px-4 text-center print:hidden">
                      <Link
                        to={`/customers/installment_chart?cardId=${row.cardId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 text-[11px] font-semibold border border-white/10 transition"
                      >
                        <span>চার্ট</span>
                        <FiExternalLink className="text-[10px]" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Footer Total */}
            {searchedData.length > 0 && (
              <tfoot>
                <tr className="border-t border-white/[0.08] bg-[#0a1020] print:bg-gray-100 print:border-black font-semibold text-xs">
                  <td colSpan="5" className="py-3 px-4 text-right text-slate-400 print:text-black">
                    সর্বমোট আদায়কৃত টাকা ({searchedData.length} টি কিস্তি)
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 print:text-black text-sm">
                    ৳{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan="2" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </main>
  );
};

export default DailyInstallmentsPaidReport;
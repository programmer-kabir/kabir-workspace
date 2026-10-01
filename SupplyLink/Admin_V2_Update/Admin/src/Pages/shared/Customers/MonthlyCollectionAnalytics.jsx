import React, { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import useUsers from "../../../utils/Hooks/useUsers";
import useCustomerInstallmentPayments from "../../../utils/Hooks/Customers/useCustomerInstallmentPayments";
import useCustomerInstallmentCards from "../../../utils/Hooks/useCustomerInstallmentCards";
import Loader from "../../../components/Loader/Loader";
import NoDataFound from "../../../components/NoData/NoDataFound";
import BackButton from "../../../components/BackButton/BackButton";
import Pagination from "../../../components/Pagination";
import { MONTHS } from "../../../../public/month";
import {
  FaCalendarAlt,
  FaSearch,
  FaFilter,
  FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaArrowCircleUp,
  FaHistory,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCreditCard,
  FaPhoneAlt,
  FaUser,
  FaPrint,
  FaChartPie,
  FaSyncAlt,
  FaExternalLinkAlt,
  FaRegClock,
} from "react-icons/fa";

const LS_KEY = "SL_MonthlyCollectionAnalytics_v1";
const PAGE_SIZE = 25;

// Bengali installment numbers fallback
const banglaNumberMap = {
  0: "ডাউন পেমেন্ট",
  1: "১ম কিস্তি",
  2: "২য় কিস্তি",
  3: "৩য় কিস্তি",
  4: "৪র্থ কিস্তি",
  5: "৫ম কিস্তি",
  6: "৬ষ্ঠ কিস্তি",
  7: "৭ম কিস্তি",
  8: "৮ম কিস্তি",
  9: "৯ম কিস্তি",
  10: "১০ম কিস্তি",
  11: "১১তম কিস্তি",
  12: "১২তম কিস্তি",
};

const getCleanTag = (p) => {
  if (p.installment_no === 0) return "ডাউন পেমেন্ট";
  if (p.tag && !p.tag.includes("?")) return p.tag;
  return banglaNumberMap[p.installment_no] || `কিস্তি #${p.installment_no}`;
};

const MonthlyCollectionAnalytics = () => {
  const today = new Date();
  const printRef = useRef();

  const saved = useMemo(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  /* ---------------- STATE ---------------- */
  const [month, setMonth] = useState(() =>
    saved?.month ? Number(saved.month) : today.getMonth() + 1
  );
  const [year, setYear] = useState(() =>
    saved?.year ? Number(saved.year) : today.getFullYear()
  );
  const [activeTab, setActiveTab] = useState(() => saved?.activeTab || "all");
  const [search, setSearch] = useState(() => saved?.search || "");
  const [selectedStaffId, setSelectedStaffId] = useState(
    () => saved?.selectedStaffId || "All"
  );
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  /* ---------------- HOOKS ---------------- */
  const { users, isUsersLoading } = useUsers();
  const {
    customerInstallmentPayments,
    isCustomerInstallmentsPaymentsLoading,
    refetch: refetchPayments,
  } = useCustomerInstallmentPayments();
  const {
    customerInstallmentCards,
    isCustomerInstallmentsCardsLoading,
    refetch: refetchCards,
  } = useCustomerInstallmentCards();

  // Save filters to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ month, year, activeTab, search, selectedStaffId })
      );
    } catch {
      // ignore
    }
  }, [month, year, activeTab, search, selectedStaffId]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [month, year, activeTab, search, selectedStaffId, paymentMethodFilter]);

  /* ---------------- LOOKUP MAPS ---------------- */
  const usersMap = useMemo(() => {
    return (
      (users || []).reduce((acc, u) => {
        if (u.user_id !== undefined && u.user_id !== null) {
          acc[Number(u.user_id)] = u;
        }
        return acc;
      }, {}) || {}
    );
  }, [users]);

  const cardsMap = useMemo(() => {
    const acc = {};
    (customerInstallmentCards || []).forEach((c) => {
      if (c.card_id !== undefined && c.card_id !== null) {
        acc[String(c.card_id)] = c;
      }
    });
    return acc;
  }, [customerInstallmentCards]);

  const officialStaff = useMemo(() => {
    const allowedRoles = ["admin", "manager", "staff", "developer"];
    return (users || []).filter((u) => {
      if (Array.isArray(u.roles)) {
        return u.roles.some((r) => allowedRoles.includes(String(r).toLowerCase()));
      }
      const role = u.role_name ?? u.role ?? u.user_role ?? u.userType ?? u.type ?? "";
      return allowedRoles.includes(String(role).toLowerCase());
    });
  }, [users]);

  /* ---------------- YEAR LIST ---------------- */
  const years = useMemo(() => {
    const defaultYears = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1];
    if (!customerInstallmentPayments?.length) return defaultYears;

    const setY = new Set(defaultYears);
    customerInstallmentPayments.forEach((p) => {
      if (p.due_date) {
        const y = new Date(p.due_date).getFullYear();
        if (y && !isNaN(y)) setY.add(y);
      }
      if (p.paid_date) {
        const y = new Date(p.paid_date).getFullYear();
        if (y && !isNaN(y)) setY.add(y);
      }
    });
    return Array.from(setY).sort((a, b) => a - b);
  }, [customerInstallmentPayments]);

  const selectedMonthStr = `${year}-${String(month).padStart(2, "0")}`;
  const monthName = MONTHS.find((m) => m.value === month)?.label || `Month ${month}`;

  /* ---------------- MASTER DATA CALCULATION ---------------- */
  const processedData = useMemo(() => {
    if (!customerInstallmentPayments?.length) return [];

    return customerInstallmentPayments
      .map((p) => {
        const card = cardsMap[String(p.card_id)] || null;

        // Skip daily cards if marked
        if ((card?.remarks || "").trim().toLowerCase() === "daily") {
          return null;
        }

        const dueMonthStr = (p.due_date || "").slice(0, 7);
        const paidMonthStr = (p.paid_date || "").slice(0, 7);
        const isPaid = p.status === "Paid";
        const customerId = card?.user_id || p.user_id || p.customer_id;
        const customer = usersMap[Number(customerId)] || null;

        const rawImg = customer?.photo || customer?.image || customer?.image_url;
        const customerImage = rawImg
          ? (String(rawImg).startsWith("http")
              ? rawImg
              : `https://management.supplylinkbd.com/${String(rawImg).replace(/^\/+/, "")}`)
          : null;

        const staffId = p.collected_by || p.signature || card?.reference_user_id;
        const staff = usersMap[Number(staffId)] || null;

        const dueAmount = Number(p.due_amount || 0);
        const principalAmount = Number(p.principal_amount || 0);
        const profitAmount = Number(p.profit_amount || 0);

        // Classification flags
        const isScheduledThisMonth = dueMonthStr === selectedMonthStr;
        const isPaidThisMonth = isPaid && paidMonthStr === selectedMonthStr;

        let collectionType = "other";
        let timingBadge = { label: "N/A", color: "bg-slate-800 text-slate-400 border-slate-700" };

        if (isPaidThisMonth) {
          if (dueMonthStr === selectedMonthStr) {
            collectionType = "current_paid";
            timingBadge = {
              label: "চলতি মাসের আদায়",
              desc: "Scheduled & Collected this month",
              color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
            };
          } else if (dueMonthStr > selectedMonthStr) {
            collectionType = "advance_paid";
            timingBadge = {
              label: "অগ্রিম আদায়",
              desc: `Due in ${p.due_date?.slice(0, 7)} (Advance)`,
              color: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
            };
          } else if (dueMonthStr < selectedMonthStr) {
            collectionType = "old_due_paid";
            timingBadge = {
              label: "পূর্বের বকেয়া আদায়",
              desc: `Due was ${p.due_date?.slice(0, 7)} (Arrears)`,
              color: "bg-amber-500/15 text-amber-300 border-amber-500/40",
            };
          }
        } else if (isScheduledThisMonth) {
          if (!isPaid) {
            collectionType = "unpaid";
            timingBadge = {
              label: "এই মাসের বাকি",
              desc: "Not yet paid",
              color: "bg-rose-500/15 text-rose-300 border-rose-500/40",
            };
          } else {
            collectionType = "paid_other_month";
            timingBadge = {
              label: `অন্য মাসে পরিশোধিত (${paidMonthStr || "N/A"})`,
              desc: `Paid on ${p.paid_date || "N/A"}`,
              color: "bg-indigo-500/15 text-indigo-300 border-indigo-500/40",
            };
          }
        }

        // Is this record relevant to the current month view?
        // Relevant if: (1) scheduled in this month OR (2) collected in this month
        const isRelevant = isScheduledThisMonth || isPaidThisMonth;
        if (!isRelevant) return null;

        return {
          id: p.id,
          rawPayment: p,
          card,
          cardDisplayId: card?.card_id || card?.id || p.card_id,
          customer,
          customerId,
          customerName: customer?.name || "Unknown Customer",
          customerPhone: customer?.mobile || customer?.phone || "—",
          customerImage: customerImage,
          staff,
          staffId,
          staffName: staff?.name || "Office / Unknown",
          due_date: p.due_date,
          paid_date: p.paid_date,
          dueMonthStr,
          paidMonthStr,
          dueAmount,
          principalAmount,
          profitAmount,
          status: p.status,
          isPaid,
          tag: getCleanTag(p),
          installment_no: p.installment_no,
          payment_method: p.payment_method || "Cash",
          receipt_number: p.receipt_number || "",
          collectionType,
          timingBadge,
          isScheduledThisMonth,
          isPaidThisMonth,
        };
      })
      .filter(Boolean);
  }, [customerInstallmentPayments, cardsMap, usersMap, selectedMonthStr]);

  /* ---------------- FINANCIAL SUMMARY KPI CALCULATIONS ---------------- */
  const analyticsSummary = useMemo(() => {
    let expectedDueAmount = 0;
    let expectedDueCount = 0;

    let totalActualReceivedAmount = 0;
    let totalActualReceivedCount = 0;

    let currentMonthPaidAmount = 0;
    let currentMonthPaidCount = 0;

    let advanceCollectedAmount = 0;
    let advanceCollectedCount = 0;

    let oldDueCollectedAmount = 0;
    let oldDueCollectedCount = 0;

    let unpaidDueAmount = 0;
    let unpaidDueCount = 0;

    let totalProfitCollected = 0;
    let totalPrincipalCollected = 0;

    processedData.forEach((item) => {
      // 1. Expected Due scheduled for this month
      if (item.isScheduledThisMonth) {
        expectedDueAmount += item.dueAmount;
        expectedDueCount += 1;

        if (!item.isPaid) {
          unpaidDueAmount += item.dueAmount;
          unpaidDueCount += 1;
        }
      }

      // 2. Actual Received collected in this month (cash inflow)
      if (item.isPaidThisMonth) {
        totalActualReceivedAmount += item.dueAmount;
        totalActualReceivedCount += 1;
        totalProfitCollected += item.profitAmount;
        totalPrincipalCollected += item.principalAmount;

        if (item.collectionType === "current_paid") {
          currentMonthPaidAmount += item.dueAmount;
          currentMonthPaidCount += 1;
        } else if (item.collectionType === "advance_paid") {
          advanceCollectedAmount += item.dueAmount;
          advanceCollectedCount += 1;
        } else if (item.collectionType === "old_due_paid") {
          oldDueCollectedAmount += item.dueAmount;
          oldDueCollectedCount += 1;
        }
      }
    });

    const recoveryRate =
      expectedDueAmount > 0
        ? ((currentMonthPaidAmount / expectedDueAmount) * 100).toFixed(1)
        : 0;

    const totalCollectionVsExpectedRatio =
      expectedDueAmount > 0
        ? ((totalActualReceivedAmount / expectedDueAmount) * 100).toFixed(1)
        : 0;

    return {
      expectedDueAmount,
      expectedDueCount,
      totalActualReceivedAmount,
      totalActualReceivedCount,
      currentMonthPaidAmount,
      currentMonthPaidCount,
      advanceCollectedAmount,
      advanceCollectedCount,
      oldDueCollectedAmount,
      oldDueCollectedCount,
      unpaidDueAmount,
      unpaidDueCount,
      totalProfitCollected,
      totalPrincipalCollected,
      recoveryRate,
      totalCollectionVsExpectedRatio,
    };
  }, [processedData]);

  /* ---------------- FILTERED ROWS FOR TABLE ---------------- */
  const filteredRows = useMemo(() => {
    return processedData.filter((row) => {
      // Tab Filter
      if (activeTab === "actual_received" && !row.isPaidThisMonth) return false;
      if (activeTab === "current_paid" && row.collectionType !== "current_paid") return false;
      if (activeTab === "advance_paid" && row.collectionType !== "advance_paid") return false;
      if (activeTab === "old_due_paid" && row.collectionType !== "old_due_paid") return false;
      if (activeTab === "unpaid" && row.collectionType !== "unpaid") return false;

      // Staff Filter
      if (selectedStaffId !== "All") {
        if (String(row.staffId) !== String(selectedStaffId)) return false;
      }

      // Payment Method Filter
      if (paymentMethodFilter !== "All") {
        if (
          String(row.payment_method).toLowerCase() !==
          paymentMethodFilter.toLowerCase()
        )
          return false;
      }

      // Search Filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = row.customerName?.toLowerCase().includes(q);
        const matchesPhone = String(row.customerPhone).includes(q);
        const matchesCard = String(row.cardDisplayId).includes(q);
        const matchesCustomerId = String(row.customerId).includes(q);
        const matchesStaff = row.staffName?.toLowerCase().includes(q);
        const matchesReceipt = row.receipt_number?.toLowerCase().includes(q);

        if (
          !matchesName &&
          !matchesPhone &&
          !matchesCard &&
          !matchesCustomerId &&
          !matchesStaff &&
          !matchesReceipt
        ) {
          return false;
        }
      }

      return true;
    });
  }, [processedData, activeTab, selectedStaffId, paymentMethodFilter, search]);

  /* ---------------- PAGINATION ---------------- */
  const totalCount = filteredRows.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  const handlePrint = () => {
    window.print();
  };

  const handleResetFilters = () => {
    setMonth(today.getMonth() + 1);
    setYear(today.getFullYear());
    setActiveTab("all");
    setSearch("");
    setSelectedStaffId("All");
    setPaymentMethodFilter("All");
    setCurrentPage(1);
  };

  const isLoading =
    isUsersLoading ||
    isCustomerInstallmentsPaymentsLoading ||
    isCustomerInstallmentsCardsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2 pb-16 text-slate-100 print:text-black print:bg-white">
      {/* ===== TOP BAR / HEADER ===== */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400">
                <FaChartPie className="text-lg" />
              </span>
              <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                মাসিক কিস্তি কালেকশন ও রিকভারি অ্যানালিটিক্স
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>{monthName} {year} মাসের পূর্ণাঙ্গ কিস্তি আদায়, অগ্রিম পেমেন্ট ও বকেয়া রিপোর্ট</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
              <span className="font-mono text-cyan-300 font-semibold">{processedData.length} Total Records</span>
            </p>
          </div>
        </div>

        {/* Top Controls (Month/Year Selectors & Actions) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector */}
          <div className="relative">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="appearance-none px-3.5 py-2 pr-8 text-xs font-bold rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 cursor-pointer shadow-sm transition"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value} className="bg-slate-900 text-white">
                  {m.label}
                </option>
              ))}
            </select>
            <FaCalendarAlt className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 pointer-events-none" />
          </div>

          {/* Year Selector */}
          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="appearance-none px-3.5 py-2 pr-8 text-xs font-bold rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 cursor-pointer shadow-sm transition"
            >
              {years.map((y) => (
                <option key={y} value={y} className="bg-slate-900 text-white">
                  {y}
                </option>
              ))}
            </select>
            <FaCalendarAlt className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 pointer-events-none" />
          </div>

          {/* Quick Refresh */}
          <button
            onClick={() => {
              refetchPayments?.();
              refetchCards?.();
            }}
            title="Refresh Data"
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
          >
            <FaSyncAlt className="text-xs" />
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition"
          >
            <FaPrint className="text-xs" />
            <span>প্রিন্ট রিপোর্ট</span>
          </button>
        </div>
      </div>

      {/* ===== PRINT ONLY HEADER ===== */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h2 className="text-2xl font-bold text-black">SupplyLink - মাসিক কিস্তি কালেকশন অ্যানালিটিক্স</h2>
        <p className="text-sm text-gray-700">রিপোর্ট মাস: {monthName} {year} | প্রিন্ট তারিখ: {new Date().toLocaleDateString()}</p>
      </div>

      {/* ===== HERO FINANCIAL KPI METRICS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 print:grid-cols-3 print:gap-2">
        {/* KPI 1: Expected Due */}
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-blue-500/30 shadow-lg shadow-blue-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">
              ১. মোট উঠবার কথা
            </span>
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <FaFileInvoiceDollar className="text-xs" />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-black font-mono text-white tracking-tight">
              ৳ {analyticsSummary.expectedDueAmount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>শিডিউল কিস্তি:</span>
              <span className="font-bold text-blue-300 font-mono">{analyticsSummary.expectedDueCount} টি</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 truncate">
            {monthName} মাসের নির্ধারিত কিস্তি
          </div>
        </div>

        {/* KPI 2: Total Actual Received */}
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-slate-900/90 via-emerald-950/30 to-slate-950/90 border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/15 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
              ২. মোট নগদ আদায়
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
              <FaMoneyBillWave className="text-xs" />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-black font-mono text-emerald-400 tracking-tight">
              ৳ {analyticsSummary.totalActualReceivedAmount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>মোট রসিদ:</span>
              <span className="font-bold text-emerald-300 font-mono">{analyticsSummary.totalActualReceivedCount} টি</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-emerald-300/80 font-semibold flex items-center justify-between">
            <span>রিকভারি রেশিও:</span>
            <span>{analyticsSummary.totalCollectionVsExpectedRatio}%</span>
          </div>
        </div>

        {/* KPI 3: Current Month Due Paid */}
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-teal-500/30 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">
              ৩. এই মাসের আদায়
            </span>
            <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300">
              <FaCheckCircle className="text-xs" />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-black font-mono text-teal-300 tracking-tight">
              ৳ {analyticsSummary.currentMonthPaidAmount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>এই মাসের কিস্তি:</span>
              <span className="font-bold text-teal-300 font-mono">{analyticsSummary.currentMonthPaidCount} টি</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-teal-400/80 font-semibold flex items-center justify-between">
            <span>লক্ষ্যমাত্রার আদায়:</span>
            <span>{analyticsSummary.recoveryRate}%</span>
          </div>
        </div>

        {/* KPI 4: Advance Collected (Samner Maser Kisti) */}
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-slate-900/90 via-cyan-950/30 to-slate-950/90 border border-cyan-500/35 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
              ৪. অগ্রিম কিস্তি আদায়
            </span>
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
              <FaArrowCircleUp className="text-xs" />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-black font-mono text-cyan-300 tracking-tight">
              ৳ {analyticsSummary.advanceCollectedAmount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>পরবর্তী মাসের:</span>
              <span className="font-bold text-cyan-300 font-mono">{analyticsSummary.advanceCollectedCount} টি</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-cyan-400 font-semibold">
            ভবিষ্যৎ কিস্তি অগ্রিম জমা
          </div>
        </div>

        {/* KPI 5: Old Arrears Collected */}
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-slate-900/90 via-amber-950/25 to-slate-950/90 border border-amber-500/35 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
              ৫. পূর্বের বকেয়া আদায়
            </span>
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
              <FaHistory className="text-xs" />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-black font-mono text-amber-300 tracking-tight">
              ৳ {analyticsSummary.oldDueCollectedAmount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>পুরাতন বকেয়া:</span>
              <span className="font-bold text-amber-300 font-mono">{analyticsSummary.oldDueCollectedCount} টি</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-amber-400/90 font-semibold">
            পূর্ববর্তী মাসের বকেয়া রিকভারি
          </div>
        </div>

        {/* KPI 6: Unpaid Current Due */}
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-slate-900/90 via-rose-950/30 to-slate-950/90 border border-rose-500/40 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider">
              ৬. এই মাসের বাকি
            </span>
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300">
              <FaExclamationTriangle className="text-xs" />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-black font-mono text-rose-400 tracking-tight">
              ৳ {analyticsSummary.unpaidDueAmount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>বকেয়া কিস্তি:</span>
              <span className="font-bold text-rose-300 font-mono">{analyticsSummary.unpaidDueCount} টি</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-rose-400/90 font-semibold">
            এখনও জমা হয়নি
          </div>
        </div>
      </div>

      {/* ===== PROFIT & PRINCIPAL SUMMARY STRIP ===== */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/95 via-indigo-950/40 to-slate-900/95 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 font-mono font-bold">
            📊 ক্যাশ ফ্লো ব্রেকডাউন:
          </span>
          <span className="text-slate-300">
            {monthName} {year} এ সংগৃহীত মোট নগদ টাকার মধ্যে:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-5 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">মূলধন রিকভারি (Principal):</span>
            <span className="font-bold text-cyan-300 bg-cyan-950/50 px-2.5 py-1 rounded-lg border border-cyan-800/60">
              ৳ {analyticsSummary.totalPrincipalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">মুনাফা বা লাভ (Profit):</span>
            <span className="font-bold text-emerald-300 bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-800/60">
              ৳ {analyticsSummary.totalProfitCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* ===== FILTER TABS & SEARCH BAR ===== */}
      <div className="p-4 rounded-2xl bg-slate-900/85 border border-slate-800 space-y-4 print:hidden">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "all"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <span>সব কালেকশন ও ডিউ</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/30 font-mono text-[11px]">
              {processedData.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("actual_received")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "actual_received"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <span>💰 মোট নগদ আদায় ({monthName})</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/30 font-mono text-[11px]">
              {analyticsSummary.totalActualReceivedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("current_paid")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "current_paid"
                ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <span>📅 এই মাসের কিস্তি আদায়</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/30 font-mono text-[11px]">
              {analyticsSummary.currentMonthPaidCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("advance_paid")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "advance_paid"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/20"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <span>🚀 অগ্রিম আদায় (পরবর্তী মাসের)</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/30 font-mono text-[11px]">
              {analyticsSummary.advanceCollectedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("old_due_paid")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "old_due_paid"
                ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <span>⏳ পূর্বের বকেয়া আদায়</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/30 font-mono text-[11px]">
              {analyticsSummary.oldDueCollectedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("unpaid")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "unpaid"
                ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <span>⚠️ এই মাসের বাকি</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/30 font-mono text-[11px]">
              {analyticsSummary.unpaidDueCount}
            </span>
          </button>
        </div>

        {/* Search & Secondary Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          {/* Search Box */}
          <div className="relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="গ্রাহকের নাম, কার্ড নং, ফোন বা ইউজার আইডি..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>

          {/* Staff Filter */}
          <div className="relative">
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-white">
                👤 All Staff (সকল আদায়কারী)
              </option>
              {officialStaff.map((s) => (
                <option
                  key={s.id || s.user_id}
                  value={s.id || s.user_id}
                  className="bg-slate-900 text-white"
                >
                  {s.name} (ID #{s.id || s.user_id})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="relative">
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950/80 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-white">
                💳 All Payment Methods
              </option>
              <option value="Cash" className="bg-slate-900 text-white">Cash</option>
              <option value="bKash" className="bg-slate-900 text-white">bKash</option>
              <option value="Nagad" className="bg-slate-900 text-white">Nagad</option>
              <option value="Rocket" className="bg-slate-900 text-white">Rocket</option>
              <option value="Bank" className="bg-slate-900 text-white">Bank</option>
            </select>
          </div>

          {/* Reset Filters */}
          <button
            onClick={handleResetFilters}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white border border-slate-700 transition"
          >
            ফিল্টার রিসেট (Reset)
          </button>
        </div>
      </div>

      {/* ===== DATA TABLE ===== */}
      <div className="overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl" ref={printRef}>
        <div className="p-4 bg-slate-950/80 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white">
              📋 কিস্তি আদায় ও বকেয়া তালিকা
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
              {filteredRows.length} টি রেকর্ড পাওয়া গেছে
            </span>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            পৃষ্ঠা {currentPage} / {totalPages}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-bold">
              <tr>
                <th className="py-3.5 px-4 text-center w-12">#</th>
                <th className="py-3.5 px-4">গ্রাহক ও ইউজার আইডি</th>
                <th className="py-3.5 px-4 text-center">কার্ড নং</th>
                <th className="py-3.5 px-4">ফোন</th>
                <th className="py-3.5 px-4">কিস্তির বিবরণ</th>
                <th className="py-3.5 px-4 text-right">কিস্তির টাকা</th>
                <th className="py-3.5 px-4 text-center">নির্ধারিত তারিখ</th>
                <th className="py-3.5 px-4 text-center">পরিশোধের তারিখ</th>
                <th className="py-3.5 px-4 text-center">আদায়ের ধরন / টাইমিং</th>
                <th className="py-3.5 px-4">আদায়কারী স্টাফ</th>
                <th className="py-3.5 px-4 text-center">স্ট্যাটাস</th>
                <th className="py-3.5 px-4 text-center print:hidden">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    <NoDataFound
                      message="কোনো কিস্তির রেকর্ড পাওয়া যায়নি"
                      subMessage="ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন"
                    />
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const serialNo = (currentPage - 1) * PAGE_SIZE + idx + 1;
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-800/40 transition duration-150 group"
                    >
                      {/* Serial */}
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {serialNo}
                      </td>

                      {/* Customer Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700/80 flex items-center justify-center shrink-0 shadow-md">
                            {row.customerImage ? (
                              <img
                                src={row.customerImage}
                                alt={row.customerName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.customerName || "C")}&background=082f49&color=38bdf8`;
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-cyan-900 via-slate-800 to-indigo-950 flex items-center justify-center text-cyan-300 font-extrabold text-sm">
                                {row.customerName?.charAt(0).toUpperCase() || "C"}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate text-xs group-hover:text-cyan-300 transition">
                              {row.customerName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              ID: #{row.customerId || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Card Number */}
                      <td className="py-3 px-4 text-center">
                        <Link
                          to={`/customers/installment_cards/card_Details?cardId=${row.cardDisplayId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-xs transition"
                        >
                          <FaCreditCard className="text-[10px]" />
                          <span>#{row.cardDisplayId}</span>
                        </Link>
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-4 font-mono text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <FaPhoneAlt className="text-[10px] text-slate-500" />
                          <span>{row.customerPhone}</span>
                        </div>
                      </td>

                      {/* Installment Tag */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-200">
                          {row.tag}
                        </span>
                      </td>

                      {/* Due Amount & Breakdown */}
                      <td className="py-3 px-4 text-right font-mono">
                        <div className="font-bold text-white text-sm">
                          ৳ {row.dueAmount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1.5 mt-0.5">
                          <span title="মূল টাকা">মূল: {Number(row.principalAmount).toFixed(0)}</span>
                          <span>•</span>
                          <span title="লাভের টাকা" className="text-emerald-400">লাভ: {Number(row.profitAmount).toFixed(0)}</span>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-4 text-center font-mono text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-950/60 border border-slate-800">
                          {row.due_date || "—"}
                        </span>
                      </td>

                      {/* Paid Date */}
                      <td className="py-3 px-4 text-center font-mono">
                        {row.paid_date ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/60 font-semibold">
                            {row.paid_date}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Timing & Type Badge */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex flex-col items-center px-2.5 py-1 rounded-lg border text-[11px] font-bold ${row.timingBadge.color}`}
                        >
                          <span>{row.timingBadge.label}</span>
                          {row.timingBadge.desc && (
                            <span className="text-[9px] opacity-75 font-normal">
                              {row.timingBadge.desc}
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Staff */}
                      <td className="py-3 px-4">
                        <div className="text-xs text-slate-300 font-medium truncate max-w-[130px]">
                          {row.staffName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {row.payment_method} {row.receipt_number ? `• #${row.receipt_number}` : ""}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            row.isPaid
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                              : "bg-rose-500/15 text-rose-300 border-rose-500/40"
                          }`}
                        >
                          {row.isPaid ? (
                            <>
                              <FaCheckCircle className="text-[10px]" /> Paid
                            </>
                          ) : (
                            <>
                              <FaRegClock className="text-[10px]" /> Unpaid
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center print:hidden">
                        <Link
                          to={`/customer/update_installment_chart?cardId=${row.cardDisplayId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/35 text-blue-300 border border-blue-500/30 text-[11px] font-bold transition shadow-sm"
                          title="View / Update Chart"
                        >
                          <FaExternalLinkAlt className="text-[9px]" />
                          <span>চার্ট</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-center print:hidden">
            <Pagination
              reportData={{ length: totalCount }}
              currentPage={currentPage}
              totalPages={totalPages}
              PAGE_SIZE={PAGE_SIZE}
              pageNumbers={pageNumbers}
              setCurrentPage={setCurrentPage}
              storageKey="monthly_collection_analytics_page"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyCollectionAnalytics;

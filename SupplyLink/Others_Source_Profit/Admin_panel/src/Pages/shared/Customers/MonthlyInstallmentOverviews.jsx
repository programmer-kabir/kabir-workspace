import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useUsers from "../../../utils/Hooks/useUsers";
import useCustomerInstallmentPayments from "../../../utils/Hooks/Customers/useCustomerInstallmentPayments";
import useCustomerInstallmentCards from "../../../utils/Hooks/useCustomerInstallmentCards";
import Loader from "../../../components/Loader/Loader";
import NoDataFound from "../../../components/NoData/NoDataFound";
import Pagination from "../../../components/Pagination";
import { MONTHS } from "../../../../public/month";
import BackButton from "../../../components/BackButton/BackButton";
import { FaSearch, FaTimes, FaCheckCircle, FaClock, FaListOl, FaChartBar, FaUserTie } from "react-icons/fa";

const LS_KEY = "SLStaffInstallmentOverviewFilters_v1";

const safeInt = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const MonthlyInstallmentOverviews = () => {
  const today = new Date();
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
    saved?.month
      ? safeInt(saved.month, today.getMonth() + 1)
      : today.getMonth() + 1,
  );
  const [year, setYear] = useState(() =>
    saved?.year
      ? safeInt(saved.year, today.getFullYear())
      : today.getFullYear(),
  );
  const [statusFilter, setStatusFilter] = useState(
    () => saved?.statusFilter || "All",
  );
  const [search, setSearch] = useState(() => saved?.search || "");
  const [selectedStaffId, setSelectedStaffId] = useState(
    () => saved?.selectedStaffId || "All",
  );

  /* ---------------- DATA ---------------- */
  const { users, isUsersLoading, isUsersError } = useUsers();
  const {
    customerInstallmentPayments,
    isCustomerInstallmentsPaymentsError,
    isCustomerInstallmentsPaymentsLoading,
    refetch:isInstallmentPaymentRefetch
  } = useCustomerInstallmentPayments();
  const {
    customerInstallmentCards,
    isCustomerInstallmentsCardsError,
    isCustomerInstallmentsCardsLoading,
    refetch:isCardRefetch
  } = useCustomerInstallmentCards();

  /* ---------------- CUSTOMERS ---------------- */
  const customers = users || [];

  const officialStaff = useMemo(() => {
    const allowedRoles = ["manager", "staff", "developer"];

    return (users || []).filter((u) => {
      if (Array.isArray(u.roles)) {
        return u.roles.some((r) =>
          allowedRoles.includes(String(r).toLowerCase()),
        );
      }
      const role =
        u.role_name ?? u.role ?? u.user_role ?? u.userType ?? u.type ?? "";
      return allowedRoles.includes(String(role).toLowerCase());
    });
  }, [users]);

  /* ---------------- YEARS (SAFE) ---------------- */
  const years = useMemo(() => {
    if (!customerInstallmentPayments?.length) return [];

    const validYears = customerInstallmentPayments
      .map((p) => {
        if (!p.due_date) return null;
        const d = new Date(p.due_date);
        if (isNaN(d.getTime())) return null;
        return d.getFullYear();
      })
      .filter((y) => Number.isInteger(y));

    if (!validYears.length) return [];

    const minYear = Math.min(...validYears);
    const maxYear = Math.max(...validYears);

    const result = [];
    for (let y = minYear; y <= maxYear; y++) result.push(y);
    return result;
  }, [customerInstallmentPayments]);

  /* ---------------- CLAMP YEAR/MONTH (IF OUT OF RANGE) ---------------- */
  useEffect(() => {
    // month clamp
    if (month < 1) setMonth(1);
    else if (month > 12) setMonth(12);

    // year clamp (if years list available)
    if (years.length) {
      const minY = years[0];
      const maxY = years[years.length - 1];
      if (year < minY) setYear(minY);
      else if (year > maxY) setYear(maxY);
    }
  }, [month, year, years]);

  /* ---------------- SAVE FILTERS TO LOCAL STORAGE ---------------- */
  useEffect(() => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          month,
          year,
          statusFilter,
          search,
          selectedStaffId,
        }),
      );
    } catch {
      // ignore storage errors
    }
  }, [month, year, statusFilter, search, selectedStaffId]);

  /* ---------------- CARD SERIAL (NUMERIC SORT) ---------------- */
  const cardSerialMap = useMemo(() => {
    const map = {};
    let serial = 1;

    const sortedCards = [...(customerInstallmentCards || [])].sort(
      (a, b) => Number(a.card_number) - Number(b.card_number),
    );

    sortedCards.forEach((card) => {
      if (!map[card.card_number]) {
        map[card.card_number] = serial;
        serial++;
      }
    });

    return map;
  }, [customerInstallmentCards]);
// const validCards = useMemo(() => {
//   return (customerInstallmentCards || []).filter(
//     (c) => String(c?.remarks).toLowerCase() !== "daily"
//   );
// }, [customerInstallmentCards]);



  /* ---------------- REPORT DATA ---------------- */
  const reportData = useMemo(() => {
    const rows = [];

    (customerInstallmentPayments || []).forEach((payment) => {
      if (!payment.due_date) return;

      const dueDate = new Date(payment.due_date);
      if (isNaN(dueDate.getTime())) return;

      const isSameMonth =
        dueDate.getFullYear() === year && dueDate.getMonth() + 1 === month;

      if (!isSameMonth) return;

      const card = (customerInstallmentCards || []).find(
        (c) =>
          String(c.card_number) === String(payment.card_id) ||
          String(c.id) === String(payment.card_id),
      );

if (!card) return;
      const customer = customers.find((u) => u.id === card?.user_id);
if (!customer) return;
      const isPaid = payment.status === "Paid" || payment.paid_date;

      rows.push({
        cardSerial: card ? cardSerialMap[card.card_number] : "-",
        cardNo: card?.card_number || payment.card_id || "-",
        customerName: customer?.name || "Unknown",
        phone: customer?.mobile || "-",
        image: customer?.photo || "-",
        userId: customer?.id || "-",
        dueAmount: Number(payment.due_amount || 0),
        principal: Number(payment.principal_amount || 0),
        installmentNo: payment?.tag,
        profit: Number(payment.profit_amount || 0),
        dueDate: payment.due_date,
        method: payment.payment_method || "-",
        status: isPaid ? "Paid" : "Unpaid",
        recipt: payment?.receipt_number,
        refStaffId: card?.reference_user_id
          ? String(card.reference_user_id)
          : "Unknown",
      });
    });

    rows.sort((a, b) => {
      if (a.cardSerial === "-" || b.cardSerial === "-") return 0;
      return a.cardSerial - b.cardSerial;
    });

    return rows;
  }, [
    customers,
    customerInstallmentCards,
    customerInstallmentPayments,
    cardSerialMap,
    month,
    year,
  ]);

  /* ---------------- FILTERED DATA ---------------- */
  const filteredReportData = useMemo(() => {
    let data = reportData;

    // ✅ staff filter
    if (selectedStaffId !== "All") {
      data = data.filter(
        (r) => String(r.refStaffId) === String(selectedStaffId),
      );
    }

    // ✅ status filter
    if (statusFilter !== "All") {
      data = data.filter((r) => r.status === statusFilter);
    }

    // ✅ search
    const q = search.trim().toLowerCase();
    if (q) {
      data = data.filter((r) => {
        const name = String(r.customerName || "").toLowerCase();
        const cardSerial = String(r.cardSerial ?? "").toLowerCase();
        const cardNo = String(r.cardNo ?? "").toLowerCase();
        const userId = String(r.userId ?? "").toLowerCase();

        return (
          name.includes(q) ||
          cardSerial.includes(q) ||
          cardNo.includes(q) ||
          userId.includes(q)
        );
      });
    }

    return data;
  }, [reportData, statusFilter, search, selectedStaffId]);

  /* ---------------- SUMMARY ---------------- */
  const paid = filteredReportData.filter((r) => r.status === "Paid");
  const unpaid = filteredReportData.filter((r) => r.status === "Unpaid");

  const paidAmount = paid.reduce((s, r) => s + r.dueAmount, 0);
  const unpaidAmount = unpaid.reduce((s, r) => s + r.dueAmount, 0);

  /* ---------------- PAGINATION ---------------- */
  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [month, year, statusFilter, search, selectedStaffId]);

  const totalPages = Math.ceil(filteredReportData.length / PAGE_SIZE);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredReportData.slice(start, end);
  }, [filteredReportData, currentPage]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  /* ---------------- LOAD/ERROR ---------------- */
  const isLoading =
    isUsersLoading ||
    isCustomerInstallmentsCardsLoading ||
    isCustomerInstallmentsPaymentsLoading;

  const isError =
    isCustomerInstallmentsPaymentsError ||
    isCustomerInstallmentsCardsError ||
    isUsersError;

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    );

  if (isError)
    return (
      <div className="h-screen flex items-center justify-center">
        <NoDataFound />
      </div>
    );

  /* ---------------- UI ---------------- */
  return (
    <main className="mx-auto text-gray-200 max-w-[1600px] p-4 md:p-6 space-y-6 animate-fadeIn">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <BackButton />
        <span className="text-xs text-slate-400 font-mono bg-white/[0.04] border border-white/10 px-3 py-1 rounded-full">
          Customer Analytics • {MONTHS.find((m) => m.value === month)?.label} {year}
        </span>
      </div>

      {/* Header & Page Title */}
      <div className="card-surface p-5 md:p-6 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
            <FaChartBar size={20} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              মাসিক কিস্তি আদায় রিপোর্ট (Installment Analytics)
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              ফিল্টার অনুযায়ী গ্রাহকের পরিশোধিত ও বকেয়া কিস্তির বিস্তারিত অডিট ও কালেকশন রিপোর্ট
            </p>
          </div>
        </div>

        {/* Selected Parameters Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            মাস: {MONTHS.find((m) => m.value === month)?.label} {year}
          </span>
          {statusFilter !== "All" && (
            <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30">
              স্ট্যাটাস: {statusFilter}
            </span>
          )}
          {selectedStaffId !== "All" && (
            <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-500/30">
              স্টাফ: {officialStaff.find(s => String(s?.id) === String(selectedStaffId))?.name || `ID #${selectedStaffId}`}
            </span>
          )}
        </div>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Paid Card */}
        <div className="card-surface p-5 border-l-4 border-l-emerald-500 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FaCheckCircle className="text-emerald-400" size={13} /> আদায় সম্পন্ন (Paid)
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {paid.length} টি কিস্তি
            </span>
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-emerald-400 mt-2 font-mono tracking-tight">
            ৳ {Number(paidAmount || 0).toLocaleString()}
          </h3>
        </div>

        {/* Unpaid Card */}
        <div className="card-surface p-5 border-l-4 border-l-amber-500 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FaClock className="text-amber-400" size={13} /> বকেয়া / বাকি (Unpaid)
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {unpaid.length} টি কিস্তি
            </span>
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-amber-400 mt-2 font-mono tracking-tight">
            ৳ {Number(unpaidAmount || 0).toLocaleString()}
          </h3>
        </div>

        {/* Total Rows Card */}
        <div className="card-surface p-5 border-l-4 border-l-indigo-500 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FaListOl className="text-indigo-400" size={13} /> মোট রেকর্ড সংখ্যা (Total Rows)
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              {filteredReportData.length} Records
            </span>
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white mt-2 font-mono tracking-tight">
            {filteredReportData.length} টি
          </h3>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="card-surface p-4 md:p-5 rounded-2xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Search */}
        <div className="w-full lg:w-96 relative flex items-center">
          <FaSearch className="absolute left-3.5 text-slate-400" size={13} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="গ্রাহকের নাম, কার্ড আইডি, ইউজার আইডি..."
            className="w-full bg-[#091122] border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
          />
          {search.trim() ? (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 text-slate-400 hover:text-white transition-colors"
            >
              <FaTimes size={13} />
            </button>
          ) : null}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Month */}
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-[#091122] border border-white/10 text-white text-xs md:text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-500 cursor-pointer"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value} className="bg-[#0b132b] text-white">
                {m.label}
              </option>
            ))}
          </select>

          {/* Year */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-[#091122] border border-white/10 text-white text-xs md:text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-500 cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-[#0b132b] text-white">
                {y}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#091122] border border-white/10 text-white text-xs md:text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All" className="bg-[#0b132b]">All Status</option>
            <option value="Paid" className="bg-[#0b132b]">Paid Only</option>
            <option value="Unpaid" className="bg-[#0b132b]">Unpaid Only</option>
          </select>

          {/* Staff Filter */}
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="bg-[#091122] border border-white/10 text-white text-xs md:text-sm px-3.5 py-2.5 rounded-xl outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All" className="bg-[#0b132b]">All Staff</option>
            {officialStaff.map((staff) => (
              <option key={staff?.id} value={String(staff?.id)} className="bg-[#0b132b]">
                {staff?.name} (ID: {staff?.id})
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setMonth(today.getMonth() + 1);
              setYear(today.getFullYear());
              setStatusFilter("All");
              setSelectedStaffId("All");
              setSearch("");
              try {
                localStorage.removeItem(LS_KEY);
              } catch {}
            }}
            className="btn-secondary text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
            title="সব ফিল্টার রিসেট করুন"
          >
            Reset
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="card-surface overflow-hidden rounded-2xl border border-white/[0.08]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm text-left">
            <thead className="bg-[#091122] text-slate-400 font-semibold border-b border-white/[0.08]">
              <tr>
                <th className="px-4 py-3.5 hidden md:table-cell">#</th>
                <th className="px-4 py-3.5">ছবি</th>
                <th className="px-4 py-3.5">কার্ড নং</th>
                <th className="px-4 py-3.5">গ্রাহক</th>
                <th className="px-4 py-3.5">ফোন</th>
                <th className="px-4 py-3.5">কিস্তি নং</th>
                <th className="px-4 py-3.5 hidden md:table-cell">মূল টাকা (৳)</th>
                <th className="px-4 py-3.5 hidden md:table-cell">লাভ (৳)</th>
                <th className="px-4 py-3.5 hidden md:table-cell">Due Date</th>
                <th className="px-4 py-3.5 hidden md:table-cell">পেমেন্ট মেথড</th>
                <th className="px-4 py-3.5 hidden md:table-cell">রসিদ / TnxID</th>
                <th className="px-4 py-3.5">স্ট্যাটাস</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.05]">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center py-12 text-slate-400">
                    <span className="text-3xl block mb-2">📋</span>
                    এই তারিখে বা ফিল্টারে কোনো কিস্তির ডাটা পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr
                    key={`${row.cardNo}-${index}`}
                    className="hover:bg-indigo-500/[0.03] transition-colors"
                  >
                    <td className="px-4 py-3 hidden md:table-cell font-mono text-slate-500">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </td>

                    <td className="px-4 py-3">
                      <img
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10"
                        src={
                          row?.image
                            ? `https://api.supplylinkbd.com/${row.image}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                row.customerName || "Customer"
                              )}&background=10b981&color=fff`
                        }
                        alt=""
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            row.customerName || "Customer"
                          )}&background=10b981&color=fff`;
                        }}
                      />
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-indigo-400">
                      <Link
                        target="_blank"
                        rel="noopener noreferrer"
                        to={`/customer/create_installment_chart?cardId=${row.cardSerial}`}
                        className="hover:underline"
                        title={row.cardNo}
                      >
                        {row.cardSerial}
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      {row.userId !== "-" ? (
                        <Link
                          target="_blank"
                          rel="noopener noreferrer"
                          to={`/customers/all_customer/customer_details?userId=${row.userId}`}
                          className="font-medium text-white hover:text-indigo-300 transition-colors"
                        >
                          {row.customerName}{" "}
                          <span className="text-indigo-400 font-mono text-xs">({row.userId})</span>
                        </Link>
                      ) : (
                        <span className="font-medium text-white">
                          {row.customerName} ({row.userId})
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono font-semibold text-emerald-400">
                      {row.phone !== "-" ? (
                        <a
                          href={`tel:${String(row.phone).replace(/\s+/g, "")}`}
                          className="hover:underline"
                          title="Call Customer"
                        >
                          {row.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-300">কিস্তি #{row.installmentNo}</span>
                      <div className="font-mono font-bold text-white text-xs mt-0.5">
                        ৳ {Number(row?.dueAmount || 0).toLocaleString()}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono hidden md:table-cell text-slate-300">
                      ৳ {Number(row.principal || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono hidden md:table-cell text-amber-300">
                      ৳ {Number(row.profit || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono hidden md:table-cell text-slate-400">
                      {row.dueDate}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-300">
                      {row.method || "—"}
                    </td>

                    <td
                      className="px-4 py-3 max-w-[140px] truncate cursor-pointer hidden md:table-cell font-mono text-xs text-slate-400"
                      title={row.recipt}
                    >
                      {row.recipt || "—"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          row.status === "Paid"
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Container */}
        <div className="p-4 border-t border-white/[0.08] bg-[#091122]/50">
          <Pagination
            reportData={filteredReportData}
            currentPage={currentPage}
            totalPages={totalPages}
            PAGE_SIZE={PAGE_SIZE}
            pageNumbers={pageNumbers}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </div>
    </main>
  );
};

export default MonthlyInstallmentOverviews;

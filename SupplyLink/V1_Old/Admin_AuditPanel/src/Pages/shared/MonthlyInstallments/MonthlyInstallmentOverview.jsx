import "./montly.css";
import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useUsers from "../../../utils/Hooks/useUsers";
import Loader from "../../../components/Loader/Loader";
import NoDataFound from "../../../components/NoData/NoDataFound";
import Pagination from "../../../components/Pagination";
import { MONTHS } from "../../../../public/month";
import useSalesCard from "../../../utils/Hooks/Sales/useSalesCards";
import useSalesPayments from "../../../utils/Hooks/Sales/useSalesPayments";

const LS_KEY = "SLStaffInstallmentOverviewFilters_v1";

const safeInt = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const MonthlyInstallmentOverview = () => {
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

  /* ---------------- DATA ---------------- */
  const { users, isUsersLoading, isUsersError } = useUsers();

  const { salesCards, isSalesCardError, isSalesCardLoading } = useSalesCard();

  const {
    isSalesPaymentsError,
    isSalesPaymentsLoading,
    refetch,
    salesPayments,
  } = useSalesPayments();


  /* ---------------- CUSTOMERS ---------------- */
  const customers = users || [];

  /* ---------------- YEARS (SAFE) ---------------- */
  const years = useMemo(() => {
    if (!salesPayments?.length) return [];

    const validYears = salesPayments
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
  }, [salesPayments]);

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
        }),
      );
    } catch {
      // ignore storage errors
    }
  }, [month, year]);

  /* ---------------- CARD SERIAL (NUMERIC SORT) ---------------- */
  const cardSerialMap = useMemo(() => {
    const map = {};
    let serial = 1;

    const sortedCards = [...(salesCards || [])].sort(
      (a, b) => Number(a.card_number) - Number(b.card_number),
    );

    sortedCards.forEach((card) => {
      if (!map[card.card_number]) {
        map[card.card_number] = serial;
        serial++;
      }
    });

    return map;
  }, [salesCards]);

  /* ---------------- REPORT DATA ---------------- */
  const reportData = useMemo(() => {
    const rows = [];

    (salesPayments || []).forEach((payment) => {
      if (!payment.due_date) return;

      const dueDate = new Date(payment.due_date);
      if (isNaN(dueDate.getTime())) return;

      const isSameMonth =
        dueDate.getFullYear() === year && dueDate.getMonth() + 1 === month;

      if (!isSameMonth) return;

      const card = (salesCards || []).find(
        (c) =>
          String(c.card_number) === String(payment.card_id) ||
          String(c.id) === String(payment.card_id),
      );

      const customer = customers.find((u) => u.id === card?.user_id);

      const isPaid = payment.status === "Paid" || payment.paid_date;

      rows.push({
        cardSerial: card ? cardSerialMap[card.card_number] : "-",
        cardNo: card?.card_number || payment.card_id || "-",
        customerName: customer?.name || "Unknown",
        remarks:card?.remarks,
        phone: customer?.mobile || "-",
        image: customer?.photo || "-",
        userId: customer?.id || "-",
        dueAmount: Number(payment.due_amount || 0),
        principal: Number(payment.principal_amount || 0),
        installmentNo: payment?.tag,
        profit: Number(payment.profit_amount || 0),
        dueDate: payment.due_date,
        paid_date: payment.paid_date,
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
    salesCards,
    salesPayments,
    cardSerialMap,
    month,
    year,
  ]);

  /* ---------------- FILTERED DATA ---------------- */
const filteredReportData = useMemo(() => {
  return reportData.filter(
    (row) =>
      row.status === "Paid" &&
      row.remarks?.toLowerCase() !== "daily"
  );
}, [reportData]);
  /* ---------------- SUMMARY ---------------- */
  const paid = filteredReportData.filter((r) => r.status === "Paid");
  const unpaid = filteredReportData.filter((r) => r.status === "Unpaid");

  const paidAmount = paid.reduce((s, r) => s + r.dueAmount, 0);
const downPaymentTotal = filteredReportData
  .filter((item) =>
    item.installmentNo?.includes("ডাউন")
  )
  .reduce((sum, item) => sum + Number(item.dueAmount || 0), 0);

const installmentTotal = filteredReportData
  .filter((item) =>
    item.installmentNo?.includes("কিস্তি")
  )
  .reduce((sum, item) => sum + Number(item.dueAmount || 0), 0);
  /* ---------------- PAGINATION ---------------- */
  const PAGE_SIZE = 30;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [month, year]);
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
    isSalesPaymentsLoading ||
    isSalesCardLoading;

  const isError =
    isSalesCardError ||
    isSalesPaymentsError ||
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
    <main>
      <h1 className="text-2xl font-bold text-center mb-6 print:hidden">
        মাসিক কিস্তি আদায় রিপোর্ট
      </h1>
      <div className="hidden print:block text-center mb-4 print-summary">
        <h1 className="text-xl font-bold">Monthly Installment Summary</h1>

        <p className="mt-1">
          {MONTHS.find((m) => m.value === month)?.label} {year}
        </p>

        <div className="mt-1 text-sm">
          <p>
            Paid Installments: {paid.length} | ৳ {paidAmount}
          </p>
        </div>
        
      </div>
      <div className="mt-1 text-sm">
  <p>
    Down Payment : ৳ {downPaymentTotal}
  </p>

  <p>
    Installment : ৳ {installmentTotal}
  </p>
</div>
      {/* FILTER */}
      <div className="flex gap-4 justify-between mb-6 flex-wrap print:hidden">
        <div className="flex items-center gap-5 flex-wrap">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded print:hidden"
          >
            🖨️ Print
          </button>
        </div>
      </div>
      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-700 text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left hidden  md:table-cell ">
                সিরিয়াল
              </th>
              <th className="px-4 py-3 text-left hidden  print:block ">
                সিরিয়াল
              </th>
                  <th className="px-4 py-3 text-left">ছবি</th>

              <th className="px-4 py-3 text-left">কার্ড নং</th>
              <th className="px-4 py-3 text-left">গ্রাহক</th>
              <th className="px-4 py-3 text-left">ফোন</th>
              <th className="px-4 py-3 text-left">কিস্তি</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">
                মূল টাকা (৳)
              </th>
              <th className="px-4 py-3 text-left hidden md:table-cell">
                লাভ (৳)
              </th>
              <th className="px-4 py-3 text-left hidden md:table-cell">
                Due Date
              </th>
              <th className="px-4 py-3 text-left hidden md:table-cell">
                পেমেন্ট মেথড
              </th>
              <th className="px-4 py-3 text-left">জমার তারিখ</th>
              <th className="px-4 py-3 text-left">remarks</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="12" className="text-center py-6 text-slate-400">
                  এই তারিখে কোন ডাটা নেই
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={`${row.cardNo}-${index}`}
                  className="border-b border-slate-700 hover:bg-slate-700/50"
                >
                  <td className="px-4 hidden md:table-cell ">
                    {(currentPage - 1) * PAGE_SIZE + index + 1}
                  </td>
                  <td className="px-4 hidden   print:block border-none">
                    {(currentPage - 1) * PAGE_SIZE + index + 1}
                  </td>
                  <td className="px-4 py-2">
 <img
    src={`https://app.supplylinkbd.com/${row.image}`}
    alt={row.customerName}
    className="w-12 h-12 rounded-full object-cover border border-slate-600"
    onError={(e) => {
      e.target.src =
        "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff";
    }}
  />
</td>
                  <td
                    title={row.cardNo}
                    className="text-blue-400 font-semibold px-4"
                  >
                    <Link
                      target="_blank"
                      rel="noopener noreferrer"
                      to={`/customer/create_installment_chart?cardId=${row.cardSerial}`}
                    >
                      {row.cardSerial}
                    </Link>
                  </td>

                  <td className="px-4">
                    {row.userId !== "-" ? (
                      <Link
                        target="_blank"
                        rel="noopener noreferrer"
                        to={`/customers/all_customer/customer_details?userId=${row.userId}`}
                      >
                        {row.customerName}{" "}
                        <span className="text-blue-400">({row.userId})</span>
                      </Link>
                    ) : (
                      `${row.customerName} (${row.userId})`
                    )}
                  </td>

                  <td className="px-4 font-semibold text-emerald-400">
                    {row.phone !== "-" ? (
                      <a
                        href={`tel:${String(row.phone).replace(/\s+/g, "")}`}
                        className="hover:underline"
                        title="Call"
                      >
                        {row.phone}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="px-4 capitalize py-2">
                    {row.installmentNo} - <br className="print:hidden" />{" "}
                    {row?.dueAmount} (৳)
                  </td>

                  <td className="px-4 capitalize hidden md:table-cell">
                    {row.principal}
                  </td>
                  <td className="px-4 capitalize hidden md:table-cell">
                    {row.profit}
                  </td>
                  <td className="px-4 capitalize hidden md:table-cell">
                    {row.dueDate}
                  </td>
                  <td className="px-4 capitalize hidden md:table-cell">
                    {row.method}
                  </td>
                  <td className="px-4 capitalize">{row.paid_date}</td>
                  <td className="px-4 capitalize">{row.remarks}</td>
                </tr>
              ))
            )}
            {/* TOTAL ROW */}
<tr className="bg-slate-800 font-bold border-t border-slate-500">
  <td className="px-4 py-3 hidden md:table-cell"></td>

  <td className="px-4 py-3"></td>

  <td className="px-4 py-3" colSpan="3">
    মোট
  </td>

  <td className="px-4 py-3 text-emerald-400">
    ৳{" "}
    {filteredReportData
      .reduce((sum, item) => sum + Number(item.dueAmount || 0), 0)
      .toLocaleString()}
  </td>

  <td className="px-4 py-3 hidden md:table-cell">
    ৳{" "}
    {filteredReportData
      .reduce((sum, item) => sum + Number(item.principal || 0), 0)
      .toLocaleString()}
  </td>

  <td className="px-4 py-3 hidden md:table-cell">
    ৳{" "}
    {filteredReportData
      .reduce((sum, item) => sum + Number(item.profit || 0), 0)
      .toLocaleString()}
  </td>

  <td className="px-4 py-3 hidden md:table-cell"></td>

  <td className="px-4 py-3 hidden md:table-cell"></td>

  <td className="px-4 py-3"></td>
</tr>
          </tbody>
        </table>
      </div>
      <div className="print:hidden">
        <Pagination
          reportData={filteredReportData}
          currentPage={currentPage}
          totalPages={totalPages}
          PAGE_SIZE={PAGE_SIZE}
          pageNumbers={pageNumbers}
          setCurrentPage={setCurrentPage}
        />
      </div>
    </main>
  );
};

export default MonthlyInstallmentOverview;

import React, { useMemo, useState } from "react";
import useUsers from "../../../utils/Hooks/useUsers";
import useCustomerInstallmentPayments from "../../../utils/Hooks/Customers/useCustomerInstallmentPayments";
import BackButton from "../../../components/BackButton/BackButton";
import Loader from "../../../components/Loader/Loader";
import useCustomerInstallmentCards from "../../../utils/Hooks/useCustomerInstallmentCards";
import { MONTHS } from "../../../../public/month";
import { useAuth } from "../../../Provider/AuthProvider";

/* 🔁 yyyy-mm-dd → yy-mm-dd */
const toYYMMDD = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${y.slice(2)}-${m}-${d}`;
};
const getMonthNameFromYYMMDD = (dateStr) => {
  if (!dateStr) return "";

  const parts = dateStr.split("-");
  if (parts.length < 2) return "";

  const monthNumber = Number(parts[1]); // MM
  const month = MONTHS.find((m) => m.value === monthNumber);

  return month?.label || "";
};

const MonthlyInstallmentReport = () => {
  const { user, logout } = useAuth();

  const { users, isUsersLoading } = useUsers();
  const {
    isCustomerInstallmentsPaymentsLoading,
    customerInstallmentPayments,
    isCustomerInstallmentsPaymentsError,
  } = useCustomerInstallmentPayments();

  const {
    isCustomerInstallmentsCardsLoading,
    customerInstallmentCards,
    isCustomerInstallmentsCardsError,
  } = useCustomerInstallmentCards();
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
  const cardsById = useMemo(() => {
    return (
      customerInstallmentCards?.reduce((acc, c) => {
        const cardId = Number(c.id);
        acc[cardId] = {
          card_id: cardId,
          card_number: c.card_number || "N/A",
          user_id: Number(c.user_id || 0),
           remarks: c.remarks || "",
        };
        return acc;
      }, {}) || {}
    );
  }, [customerInstallmentCards]);
const filteredData = useMemo(() => {
  if (!customerInstallmentPayments?.length) return [];

  return customerInstallmentPayments
    .filter((p) => {
      // শুধু নির্বাচিত তারিখের data
      if ((p.paid_date || "").slice(0, 10) !== date) return false;

      const card = cardsById[Number(p.card_id || 0)];

      // Daily card বাদ
      if ((card?.remarks || "").trim().toLowerCase() === "daily") {
        return false;
      }

      return true;
    })
    .map((p) => {
      const cardId = Number(p.card_id || 0);
      const card = cardsById[cardId];

      const customerId = Number(
        card?.user_id || p.user_id || p.customer_id || p.investor_id || 0
      );

      const collected_by = p.collected_by;
      const collectedByName = usersMap[collected_by] || "Unknown Staff";

      const dueDate = p.due_date || "";
      const monthName = getMonthNameFromYYMMDD(dueDate);

      return {
        id: p.id,
        paid_date: (p.paid_date || "").slice(0, 10),
        customerId,
        customerName: usersMap[customerId] || "Unknown",
        collectedByName,
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

  const totalAmount = useMemo(() => {
    return filteredData.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  }, [filteredData]);

  if (
    isUsersLoading ||
    isCustomerInstallmentsPaymentsLoading ||
    isCustomerInstallmentsCardsLoading
  ) {
    return (
      <div className="flex items-center justify-center">
        <Loader />
      </div>
    );
  }
  return (
    <main className="mx-auto text-slate-200 max-w-[1600px] p-4 md:p-6 space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <BackButton />
        <span className="text-xs text-slate-400 font-mono bg-white/[0.04] border border-white/10 px-3 py-1 rounded-full">
          Daily Collection Report • {toYYMMDD(date)}
        </span>
      </div>

      {/* Header & Controls Card */}
      <div className="card-surface p-5 md:p-6 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            দৈনিক কিস্তি সংগ্রহের রিপোর্ট
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            নির্দিষ্ট তারিখে মাঠপর্যায়ে কর্মকর্তা কর্তৃক সংগৃহীত কিস্তির তালিকা ও মোট টাকার হিসাব
          </p>
        </div>

        {/* Date Filter & Print */}
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-[#091122] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none date-fix shadow-inner cursor-pointer"
          />

          <button
            onClick={() => window.print()}
            className="btn-primary text-xs md:text-sm px-4 py-2 font-semibold shadow-md shadow-indigo-500/20"
          >
            🖨️ রিপোর্ট প্রিন্ট
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-surface p-4 border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            মোট সংগৃহীত কিস্তি (Total Amount)
          </span>
          <h3 className="text-2xl md:text-3xl font-extrabold text-emerald-400 mt-1 font-mono">
            ৳ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>

        <div className="card-surface p-4 border-l-4 border-l-indigo-500">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            মোট কিস্তির সংখ্যা (Collections Count)
          </span>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white mt-1 font-mono">
            {filteredData.length} টি
          </h3>
        </div>
      </div>

      {/* Table */}
      <div className="card-surface overflow-hidden rounded-2xl border border-white/[0.08]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm text-left">
            <thead className="bg-[#091122] text-slate-400 font-semibold border-b border-white/[0.08]">
              <tr>
                <th className="px-4 py-3.5">#</th>
                <th className="px-4 py-3.5">গ্রাহকের নাম (ID)</th>
                <th className="px-4 py-3.5">কার্ড নং</th>
                <th className="px-4 py-3.5">মাসের নাম</th>
                <th className="px-4 py-3.5">কিস্তি ট্যাগ</th>
                <th className="px-4 py-3.5">টাকা (৳)</th>
                <th className="px-4 py-3.5">আদায়কারী (Staff)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.05]">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    <span className="text-3xl block mb-2">📋</span>
                    এই তারিখে কোনো কিস্তির ডাটা পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => (
                  <tr
                    key={row.id}
                    className="hover:bg-indigo-500/[0.03] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-white">
                      {row.customerName}{" "}
                      <span className="text-indigo-400 font-mono text-xs">({row.customerId})</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300 font-semibold">{row.cardNumber}</td>
                    <td className="px-4 py-3 text-slate-300">{row.monthName}</td>
                    <td className="px-4 py-3 text-slate-300 font-mono">
                      {row.installmentNo || "—"}
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                      ৳ {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="px-4 py-3 text-slate-300 font-medium">
                      {row.collectedByName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Footer total */}
            {filteredData.length > 0 && (
              <tfoot className="bg-[#091122] border-t border-white/[0.1] font-semibold">
                <tr>
                  <td colSpan="5" className="px-4 py-3.5 text-right text-slate-300">
                    সর্বমোট কালেকশন:
                  </td>
                  <td className="px-4 py-3.5 font-mono font-extrabold text-emerald-400 text-base">
                    ৳ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </main>
  );
};

export default MonthlyInstallmentReport;

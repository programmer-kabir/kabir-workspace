import React, { useEffect, useState, useMemo } from "react";
import useUsers from "../../../utils/Hooks/useUsers";
import useCustomerInstallmentCards from "../../../utils/Hooks/useCustomerInstallmentCards";
import {
  FiCalendar,
  FiPrinter,
  FiSearch,
  FiX,
  FiUser,
  FiCreditCard,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiRefreshCw
} from "react-icons/fi";
import { FaMoneyBillWave } from "react-icons/fa";
import BackButton from "../../../components/BackButton/BackButton";
import { Link } from "react-router-dom";

const DailyInstallmentsReports = () => {
  const { users = [], isUsersLoading } = useUsers();
  const { customerInstallmentCards = [], isCustomerInstallmentsCardsLoading } =
    useCustomerInstallmentCards();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${
          import.meta.env.VITE_LOCALHOST_KEY ||
          "https://api.supplylinkbd.com/apis"
        }/DailyInstallments/getDailyInstallments.php`
      );
      const json = await res.json();
      setData(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const cleanName = (name) => {
    return (name || "")
      .replace(/^মোঃ\s*/g, "")
      .replace(/^Md\.?\s*/gi, "")
      .replace(/^Mohammad\s*/gi, "")
      .trim();
  };

  // Helper to get User Info
  const getUserInfo = (userId) => {
    const found = users.find((u) => Number(u.id) === Number(userId));
    if (!found) {
      return {
        name: `কর্মী #${userId || "—"}`,
        cleanName: `কর্মী #${userId || "—"}`,
        photo: null,
      };
    }
    return {
      name: found.name,
      cleanName: cleanName(found.name),
      photo: found.photo
        ? `https://api.supplylinkbd.com/${found.photo}`
        : null,
    };
  };

  // Filter by Date
  const filteredByDate = useMemo(() => {
    return data.filter((item) => item.date === selectedDate);
  }, [data, selectedDate]);

  // Enrich Report Data
  const reportData = useMemo(() => {
    return filteredByDate.map((item) => {
      const customer = users.find((u) => Number(u.id) === Number(item.userId));
      const receiverInfo = getUserInfo(item.receiver);
      const updaterInfo = item.update_by ? getUserInfo(item.update_by) : null;
      const card = customerInstallmentCards.find(
        (c) => Number(c.id) === Number(item.cardId)
      );

      return {
        ...item,
        customerName: customer?.name || `Customer #${item.userId}`,
        customerCleanName: cleanName(customer?.name || `Customer #${item.userId}`),
        customerPhoto: customer?.photo
          ? `https://api.supplylinkbd.com/${customer.photo}`
          : null,
        customerMobile: customer?.mobile || "",
        receiverName: receiverInfo.cleanName,
        receiverPhoto: receiverInfo.photo,
        updaterName: updaterInfo ? updaterInfo.cleanName : "",
        cardNumber: card?.card_number || item.cardId,
        isUpdated: Boolean(item.update_at && item.update_reason),
      };
    });
  }, [filteredByDate, users, customerInstallmentCards]);

  // Search Filter
  const finalReport = useMemo(() => {
    if (!search.trim()) return reportData;
    const term = search.toLowerCase().trim();
    return reportData.filter((item) => {
      return (
        item.customerName.toLowerCase().includes(term) ||
        String(item.cardId).includes(term) ||
        String(item.userId).includes(term) ||
        item.receiverName.toLowerCase().includes(term) ||
        String(item.amount).includes(term)
      );
    });
  }, [reportData, search]);

  // KPI Metrics
  const totalAmount = useMemo(() => {
    return finalReport.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [finalReport]);

  const uniqueCustomers = useMemo(() => {
    return new Set(finalReport.map((i) => i.userId)).size;
  }, [finalReport]);

  const avgCollection = finalReport.length > 0
    ? Math.round(totalAmount / finalReport.length)
    : 0;

  return (
    <div className="min-h-screen text-slate-100 space-y-6 pb-12 print:bg-white print:text-black">
      {/* ================= HEADER & CONTROLS ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08] print:border-black">
        <div className="flex items-center gap-3">
          <div className="print:hidden">
            <BackButton />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white print:text-black flex items-center gap-2">
              দৈনিক কিস্তি সংগ্রহ রিপোর্ট
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono print:border-black print:text-black">
                {selectedDate}
              </span>
            </h1>
            <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">
              নির্বাচিত তারিখের সকল আদায়কৃত কিস্তি, সংগ্রাহক ও ক্যাশ ইন রেকর্ড
            </p>
          </div>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#090f20] border border-white/10 px-3.5 py-2 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
          />

          <button
            onClick={() =>
              setSelectedDate(new Date().toISOString().slice(0, 10))
            }
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition active:scale-95 shadow cursor-pointer"
          >
            আজ
          </button>

          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().slice(0, 10));
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition active:scale-95 shadow cursor-pointer"
          >
            গতকাল
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 print:grid-cols-4">
        <div className="p-4 rounded-2xl bg-[#080d1a] border border-white/[0.08] shadow-lg print:border-black print:bg-white">
          <p className="text-slate-400 print:text-gray-600 text-xs flex items-center justify-between">
            <span>মোট আদায় (Total Collection)</span>
            <FaMoneyBillWave className="text-emerald-400 print:text-black" />
          </p>
          <h2 className="text-2xl font-bold font-mono text-emerald-400 print:text-black mt-1">
            ৳{totalAmount.toLocaleString("en-IN")}
          </h2>
          <p className="text-[11px] text-slate-500 print:text-gray-500 mt-0.5">
            ক্যাশ ইনভুক্ত মোট অর্থ
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#080d1a] border border-white/[0.08] shadow-lg print:border-black print:bg-white">
          <p className="text-slate-400 print:text-gray-600 text-xs flex items-center justify-between">
            <span>কিস্তির সংখ্যা (Transactions)</span>
            <FiCreditCard className="text-cyan-400 print:text-black" />
          </p>
          <h2 className="text-2xl font-bold font-mono text-cyan-300 print:text-black mt-1">
            {finalReport.length} টি
          </h2>
          <p className="text-[11px] text-slate-500 print:text-gray-500 mt-0.5">
            আজকের আদায় এন্ট্রি
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#080d1a] border border-white/[0.08] shadow-lg print:border-black print:bg-white">
          <p className="text-slate-400 print:text-gray-600 text-xs flex items-center justify-between">
            <span>গ্রাহক সংখ্যা (Customers)</span>
            <FiUser className="text-indigo-400 print:text-black" />
          </p>
          <h2 className="text-2xl font-bold font-mono text-indigo-300 print:text-black mt-1">
            {uniqueCustomers} জন
          </h2>
          <p className="text-[11px] text-slate-500 print:text-gray-500 mt-0.5">
            আদায়কৃত স্বতন্ত্র গ্রাহক
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#080d1a] border border-white/[0.08] shadow-lg print:border-black print:bg-white">
          <p className="text-slate-400 print:text-gray-600 text-xs flex items-center justify-between">
            <span>গড় আদায় (Average)</span>
            <FiCheckCircle className="text-amber-400 print:text-black" />
          </p>
          <h2 className="text-2xl font-bold font-mono text-amber-300 print:text-black mt-1">
            ৳{avgCollection.toLocaleString("en-IN")}
          </h2>
          <p className="text-[11px] text-slate-500 print:text-gray-500 mt-0.5">
            প্রতি কিস্তির গড় হার
          </p>
        </div>
      </div>

      {/* ================= SEARCH BAR ================= */}
      <div className="relative print:hidden">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="গ্রাহক, কার্ড #, বা সংগ্রাহক দিয়ে রিপোর্ট খুঁজুন..."
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

      {/* ================= REPORT TABLE ================= */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070b16] shadow-2xl print:border-black print:bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#0a1020] text-slate-400 font-semibold text-[11px] print:border-black print:bg-gray-100 print:text-black">
                <th className="py-3.5 px-4 min-w-[50px]">#</th>
                <th className="py-3.5 px-4 min-w-[200px]">গ্রাহকের নাম ও আইডি</th>
                <th className="py-3.5 px-4 min-w-[120px]">কার্ড আইডি</th>
                <th className="py-3.5 px-4 min-w-[130px] text-right">আদায়কৃত টাকা (৳)</th>
                <th className="py-3.5 px-4 min-w-[180px]">সংগ্রাহক (Receiver)</th>
                <th className="py-3.5 px-4 min-w-[170px]">স্ট্যাটাস / আপডেট তথ্য</th>
                <th className="py-3.5 px-4 min-w-[100px] text-center print:hidden">অ্যাকশন</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.04] text-slate-200 print:text-black print:divide-gray-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FiRefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
                      <span className="text-xs">রিপোর্ট লোড হচ্ছে...</span>
                    </div>
                  </td>
                </tr>
              ) : finalReport.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FiClock className="h-8 w-8 text-slate-600 mb-2" />
                      <span className="text-sm font-medium text-slate-400 print:text-black">
                        এই তারিখে কোনো কিস্তি আদায়ের রেকর্ড পাওয়া যায়নি
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                finalReport.map((item, index) => {
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-white/[0.02] transition-colors print:hover:bg-transparent"
                    >
                      {/* 1. Serial */}
                      <td className="py-3.5 px-4 font-mono text-slate-500 print:text-gray-700">
                        {index + 1}
                      </td>

                      {/* 2. Customer Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {item.customerPhoto ? (
                            <img
                              src={item.customerPhoto}
                              alt={item.customerCleanName}
                              className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0 print:hidden"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0 print:hidden font-mono">
                              {item.customerCleanName.charAt(0) || "C"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-white print:text-black text-xs truncate">
                              {item.customerCleanName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              গ্রাহক ID: #{item.userId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Card ID */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs print:border-black print:text-black">
                          #{item.cardId}
                        </span>
                      </td>

                      {/* 4. Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 print:text-black text-sm">
                        ৳{Number(item.amount).toLocaleString("en-IN")}
                      </td>

                      {/* 5. Receiver with Full Name & Avatar (NOT RAW ID) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {item.receiverPhoto ? (
                            <img
                              src={item.receiverPhoto}
                              alt={item.receiverName}
                              className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0 print:hidden"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-[10px] shrink-0 print:hidden font-mono">
                              {item.receiverName.charAt(0) || "U"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-200 print:text-black text-xs">
                              {item.receiverName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              ID: {item.receiver}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 6. Status & Update Reason */}
                      <td className="py-3.5 px-4">
                        {item.isUpdated ? (
                          <div className="text-[10px] space-y-0.5">
                            <span className="inline-block px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold print:text-black">
                              সংশোধিত
                            </span>
                            {item.updaterName && (
                              <div className="text-slate-400 print:text-black">
                                <strong>দ্বারা:</strong> {item.updaterName}
                              </div>
                            )}
                            {item.update_reason && (
                              <div
                                className="text-slate-400 truncate max-w-[150px] print:text-black"
                                title={item.update_reason}
                              >
                                {item.update_reason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-[10px] print:border-black print:text-black">
                            মূল জমা (Original)
                          </span>
                        )}
                      </td>

                      {/* 7. Action Button */}
                      <td className="py-3.5 px-4 text-center print:hidden">
                        <Link
                          to={`/DailyInstallments/daily_installments_users/${item.cardId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 text-[11px] font-semibold border border-white/10 transition"
                        >
                          <span>কার্ড দেখুন</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer */}
            {finalReport.length > 0 && (
              <tfoot>
                <tr className="border-t border-white/[0.08] bg-[#0a1020] print:bg-gray-100 print:border-black font-semibold text-xs">
                  <td colSpan="3" className="py-3 px-4 text-center text-slate-400 print:text-black">
                    সর্বমোট আদায় ({finalReport.length} টি কিস্তি)
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 print:text-black text-sm">
                    ৳{totalAmount.toLocaleString("en-IN")}
                  </td>
                  <td colSpan="3" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyInstallmentsReports;

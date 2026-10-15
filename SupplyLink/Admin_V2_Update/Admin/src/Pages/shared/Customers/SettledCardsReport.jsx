import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FaCreditCard,
  FaSearch,
  FaSyncAlt,
  FaPrint,
  FaFileInvoiceDollar,
  FaUser,
  FaPhoneAlt,
  FaCalendarAlt,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaMoneyBillWave,
  FaTag,
} from "react-icons/fa";
import { GiReceiveMoney } from "react-icons/gi";
import Loader from "../../../components/Loader/Loader";

const SettledCardsReport = () => {
  const [settlements, setSettlements] = useState([]);
  const [summary, setSummary] = useState({
    total_settled_cards: 0,
    total_original_due: 0,
    total_discount_given: 0,
    total_cash_collected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSettlement, setSelectedSettlement] = useState(null);

  const fetchSettledCards = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEY}/customers/settle_installment_card.php`
      );
      if (res.data?.success) {
        setSettlements(res.data.data || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error("Failed to load settled cards:", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettledCards();
  }, []);

  // Filtered List
  const filteredList = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return settlements;
    return settlements.filter((item) => {
      const cardId = String(item.card_id || "");
      const custName = (item.customer_name || "").toLowerCase();
      const custMobile = (item.customer_mobile || "").toLowerCase();
      const staffName = (item.staff_name || item.settled_by_name || "").toLowerCase();
      const product = (item.product_name || "").toLowerCase();
      return (
        cardId.includes(q) ||
        custName.includes(q) ||
        custMobile.includes(q) ||
        staffName.includes(q) ||
        product.includes(q)
      );
    });
  }, [settlements, searchTerm]);

  // Recalculate summary if filtered
  const activeSummary = useMemo(() => {
    if (!searchTerm.trim()) return summary;
    return {
      total_settled_cards: filteredList.length,
      total_original_due: filteredList.reduce((sum, s) => sum + Number(s.remaining_due || 0), 0),
      total_discount_given: filteredList.reduce((sum, s) => sum + Number(s.discount_amount || 0), 0),
      total_cash_collected: filteredList.reduce((sum, s) => sum + Number(s.final_settled_amount || 0), 0),
    };
  }, [filteredList, summary, searchTerm]);

  return (
    <div className="w-full space-y-6 pb-12 pt-2">
      {/* ===== Header & Title Banner ===== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg">
              <GiReceiveMoney className="text-2xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  অগ্রিম নিষ্পত্তিকৃত কার্ডের রিপোর্ট
                </h1>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  Early Settled Cards
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ছাড় (Discount) দিয়ে মেয়াদ শেষ হওয়ার পূর্বে নিষ্পত্তি করা সকল কিস্তি কার্ডের বিবরণী ও ক্যাশ হিসেব
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={fetchSettledCards}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#0C1427] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold shadow-md transition"
          >
            <FaSyncAlt className={`text-xs ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
            <span>রিফ্রেশ</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition print:hidden"
          >
            <FaPrint className="text-xs" />
            <span>প্রিন্ট রিপোর্ট</span>
          </button>
        </div>
      </div>

      {/* ===== KPI Metrics Bar ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Settled Cards */}
        <div className="rounded-2xl p-4 bg-[#070D1E]/90 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              মোট নিষ্পত্তিকৃত কার্ড
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center text-xs">
              <FaCreditCard />
            </div>
          </div>
          <p className="text-2xl font-black text-cyan-300 mt-1 font-mono">
            {activeSummary.total_settled_cards} <span className="text-xs text-slate-400 font-sans">টি</span>
          </p>
        </div>

        {/* Total Original Due */}
        <div className="rounded-2xl p-4 bg-[#070D1E]/90 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              মোট বকেয়া ছিল
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center text-xs">
              <FaFileInvoiceDollar />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-1 font-mono">
            ৳ {Number(activeSummary.total_original_due || 0).toLocaleString()}
          </p>
        </div>

        {/* Total Discount Given */}
        <div className="rounded-2xl p-4 bg-[#070D1E]/90 border border-rose-900/30 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
              মোট দেওয়া ছাড় (মওকুফ)
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center text-xs">
              <FaTag />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-400 mt-1 font-mono">
            -৳ {Number(activeSummary.total_discount_given || 0).toLocaleString()}
          </p>
        </div>

        {/* Total Cash Collected */}
        <div className="rounded-2xl p-4 bg-[#070D1E]/90 border border-emerald-900/30 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              মোট সংগৃহীত ক্যাশ
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xs">
              <FaMoneyBillWave />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            ৳ {Number(activeSummary.total_cash_collected || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* ===== Search & Filter Controls ===== */}
      <div className="p-3.5 rounded-2xl bg-[#070D1E]/80 border border-slate-800/90 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="কার্ড #, কাস্টমারের নাম, মোবাইল অথবা স্টাফ..."
            className="w-full bg-[#0C1427] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono font-medium">
          প্রদর্শিত হচ্ছে: <span className="text-cyan-300 font-bold">{filteredList.length}</span> টি রেকর্ড
        </div>
      </div>

      {/* ===== Settled Cards Table ===== */}
      {isLoading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader />
        </div>
      ) : isError ? (
        <div className="p-8 rounded-3xl bg-rose-950/20 border border-rose-800/40 text-center text-rose-300 space-y-2">
          <p className="font-semibold text-sm">তথ্য লোড করতে সমস্যা হয়েছে</p>
          <button
            onClick={fetchSettledCards}
            className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold border border-rose-500/30 transition"
          >
            পুনরায় চেষ্টা করুন
          </button>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
          <FaCreditCard className="text-4xl text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">কোনো নিষ্পত্তিকৃত কার্ড পাওয়া যায়নি</p>
          <p className="text-xs text-slate-500">
            {searchTerm ? "আপনার সার্চ কুয়েরির সাথে কোনো রেকর্ড মেলেনি" : "এখনও পর্যন্ত কোনো কার্ডে অগ্রিম ছাড় দিয়ে নিষ্পত্তি করা হয়নি"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-gradient-to-b from-slate-900/95 via-[#0C1427]/90 to-slate-950/95 border border-slate-800 shadow-2xl sl-scroll">
          <table className="w-full text-left text-xs text-slate-300 min-w-[950px]">
            <thead className="bg-[#070D1E] text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-4 whitespace-nowrap">কার্ড #</th>
                <th className="py-4 px-4 whitespace-nowrap">কাস্টমার</th>
                <th className="py-4 px-4 whitespace-nowrap">পণ্য ও মূল্য</th>
                <th className="py-4 px-4 whitespace-nowrap text-right">বকেয়া ছিল</th>
                <th className="py-4 px-4 whitespace-nowrap text-right">ছাড় (মওকুফ)</th>
                <th className="py-4 px-4 whitespace-nowrap text-right">গৃহীত ক্যাশ</th>
                <th className="py-4 px-4 whitespace-nowrap text-center">মাধ্যম</th>
                <th className="py-4 px-4 whitespace-nowrap">তারিখ</th>
                <th className="py-4 px-4 whitespace-nowrap">অনুমোদনকারী</th>
                <th className="py-4 px-4 whitespace-nowrap text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  {/* Card ID */}
                  <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                    <Link
                      to={`/customer/update_installment_chart?cardId=${item.card_id}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/30 transition group"
                      title="কার্ডের বিস্তারিত কিস্তি চার্ট দেখুন"
                    >
                      <FaCreditCard className="text-[10px]" />
                      <span>Card #{item.card_id}</span>
                      <FaExternalLinkAlt className="text-[9px] opacity-70 group-hover:opacity-100" />
                    </Link>
                  </td>

                  {/* Customer Info */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <FaUser className="text-[10px] text-indigo-400" />
                      <span>{item.customer_name || `User #${item.customer_id}`}</span>
                    </div>
                    {item.customer_mobile && (
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <FaPhoneAlt className="text-[9px] text-cyan-400" />
                        <span>{item.customer_mobile}</span>
                      </div>
                    )}
                  </td>

                  {/* Product & Sale Price */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200">
                      {item.product_name || "N/A"}
                    </div>
                    {item.sale_price && (
                      <div className="text-[11px] text-slate-400 font-mono">
                        বিক্রয়: ৳{Number(item.sale_price).toLocaleString()}
                      </div>
                    )}
                  </td>

                  {/* Original Remaining Due */}
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-300">
                    ৳{Number(item.remaining_due || 0).toLocaleString()}
                  </td>

                  {/* Discount Amount */}
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono font-extrabold text-xs">
                      -৳{Number(item.discount_amount || 0).toLocaleString()}
                    </span>
                  </td>

                  {/* Final Settled Amount */}
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-extrabold text-xs">
                      ৳{Number(item.final_settled_amount || 0).toLocaleString()}
                    </span>
                  </td>

                  {/* Payment Method */}
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium text-[11px]">
                      {item.payment_method || "Cash"}
                    </span>
                  </td>

                  {/* Settlement Date */}
                  <td className="py-3 px-4 font-mono text-slate-300 text-xs whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <FaCalendarAlt className="text-[10px] text-amber-400" />
                      <span>{item.settlement_date}</span>
                    </div>
                  </td>

                  {/* Settled By Staff */}
                  <td className="py-3 px-4 text-xs font-semibold text-slate-200 whitespace-nowrap">
                    {item.staff_name || item.settled_by_name || "Admin"}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => setSelectedSettlement(item)}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-semibold transition"
                    >
                      নোট ও বিবরণ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== Details Modal ===== */}
      {selectedSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#0B132B] border border-slate-700 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm">
                  #{selectedSettlement.card_id}
                </div>
                <h3 className="font-bold text-base">অগ্রিম নিষ্পত্তি বিবরণী</h3>
              </div>
              <button
                onClick={() => setSelectedSettlement(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div>
                  <span className="text-slate-400 block">কাস্টমার:</span>
                  <span className="font-bold text-white text-sm">
                    {selectedSettlement.customer_name || `User #${selectedSettlement.customer_id}`}
                  </span>
                  {selectedSettlement.customer_mobile && (
                    <span className="font-mono text-cyan-300 block">{selectedSettlement.customer_mobile}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block">অনুমোদনকারী:</span>
                  <span className="font-bold text-white text-sm">
                    {selectedSettlement.staff_name || selectedSettlement.settled_by_name || "Admin"}
                  </span>
                  <span className="text-slate-400 block font-mono">তারিখ: {selectedSettlement.settlement_date}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#070D1E] border border-slate-800/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">মোট আসল চুক্তি মূল্য:</span>
                  <span className="font-mono font-bold text-white">
                    ৳{Number(selectedSettlement.total_original_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">নিষ্পত্তির পূর্বে পরিশোধিত ছিল:</span>
                  <span className="font-mono font-bold text-cyan-300">
                    ৳{Number(selectedSettlement.total_paid_before || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">নিষ্পত্তির সময় বকেয়া ছিল:</span>
                  <span className="font-mono font-bold text-white">
                    ৳{Number(selectedSettlement.remaining_due || 0).toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-slate-800 my-1"></div>
                <div className="flex justify-between text-rose-300">
                  <span className="font-semibold">বিশেষ ছাড় (মওকুফ):</span>
                  <span className="font-mono font-black text-sm">
                    -৳{Number(selectedSettlement.discount_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-300">
                  <span className="font-semibold">গৃহীত নগদ ক্যাশ:</span>
                  <span className="font-mono font-black text-base">
                    ৳{Number(selectedSettlement.final_settled_amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedSettlement.note && (
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-semibold block">নিষ্পত্তির নোট / কারণ:</span>
                  <p className="text-slate-300 italic">{selectedSettlement.note}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Link
                to={`/customer/update_installment_chart?cardId=${selectedSettlement.card_id}`}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>কার্ড ভিউ খুলুন</span>
                <FaExternalLinkAlt className="text-[10px]" />
              </Link>
              <button
                onClick={() => setSelectedSettlement(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettledCardsReport;

import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaFileInvoiceDollar,
  FaStore,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPlus,
  FaSyncAlt,
  FaPrint,
  FaCalendarAlt,
  FaSearch,
  FaCheckCircle,
  FaArrowDown,
  FaArrowUp,
  FaEye,
  FaBoxOpen,
} from "react-icons/fa";
import axios from "axios";

import useSupplierPayments from "../../../utils/Hooks/useSupplierPayments";

const ShopLedgerModal = ({
  isOpen,
  onClose,
  shop,
  onCreditPurchase,
  onPayDue,
}) => {
  const { supplierPayments } = useSupplierPayments();
  const [ledgerData, setLedgerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [previewImage, setPreviewImage] = useState(null);

  const fetchLedger = async () => {
    if (!shop?.shop_name) return;
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEY}/supplierPayments/getShopLedger.php?shop_name=${encodeURIComponent(
          shop.shop_name
        )}`
      );
      if (res.data?.success && res.data.shop) {
        setLedgerData(res.data);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn("getShopLedger API fallback to client ledger", err);
    }

    // Client fallback from supplierPayments
    if (Array.isArray(supplierPayments)) {
      const targetName = shop.shop_name.toLowerCase().trim();
      const matched = supplierPayments.filter(
        (p) => (p.shop_name || p.supplier || "").toLowerCase().trim() === targetName
      );

      let running = 0;
      let tb = 0;
      let tp = 0;

      const txs = matched.map((m) => {
        const b = parseFloat(m.total_amount || 0);
        const p = parseFloat(m.paid || 0);
        const d = parseFloat(m.due || 0);
        running += (b - p);
        tb += b;
        tp += p;
        const isPay = (b <= 0 && p > 0) || (m.memo_no || "").startsWith("PAY-");
        return {
          id: m.id,
          memo_no: m.memo_no || "-",
          date: m.date,
          type: isPay ? "Payment" : "Purchase",
          brand: m.brand || "-",
          total_amount: b,
          paid: p,
          due: d,
          running_due: Math.max(0, running),
          image: m.image,
          remarks: m.remarks || "",
        };
      });

      setLedgerData({
        shop: {
          shop_name: shop.shop_name,
          category: shop.category || "Distributor / Dealer",
          owner_name: shop.owner_name || "-",
          phone: shop.phone || "-",
          address: shop.address || "-",
        },
        summary: {
          total_bought: tb,
          total_paid: tp,
          current_due: Math.max(0, tb - tp),
          total_transactions: txs.length,
        },
        transactions: txs.reverse(),
      });
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && shop?.shop_name) {
      fetchLedger();
    }
  }, [isOpen, shop?.shop_name, supplierPayments]);

  if (!isOpen || !shop) return null;

  const transactions = ledgerData?.transactions || [];
  const summary = ledgerData?.summary || {
    total_bought: shop.total_bought || 0,
    total_paid: shop.total_paid || 0,
    current_due: shop.current_due || 0,
  };

  const filteredTx = transactions.filter((tx) => {
    if (filterType !== "ALL" && tx.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const memoMatch = tx.memo_no?.toLowerCase().includes(q);
      const brandMatch = tx.brand?.toLowerCase().includes(q);
      const remarksMatch = tx.remarks?.toLowerCase().includes(q);
      return memoMatch || brandMatch || remarksMatch;
    }
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const getImageUrl = (imgPath) => {
    if (!imgPath) return null;
    if (imgPath.startsWith("http://") || imgPath.startsWith("https://") || imgPath.startsWith("blob:") || imgPath.startsWith("data:")) {
      return imgPath;
    }
    const clean = imgPath.replace(/^\/+/, "");
    const base = import.meta.env.VITE_LOCALHOST_KEY || "https://management.supplylinkbd.com/apis";
    const host = base.replace(/\/apis\/?.*$/, "");
    return `${host}/${clean}`;
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-3 md:p-6 overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose}></div>

      <div
        className="relative bg-gradient-to-b from-slate-900 via-[#0B132B] to-slate-950 p-5 md:p-8 rounded-3xl w-full max-w-5xl border border-slate-700/80 shadow-2xl z-10 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl shrink-0 shadow-lg shadow-amber-500/10">
              <FaStore />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-white">
                  {shop.shop_name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {shop.category || "Supplier"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                <span>
                  <strong className="text-slate-300">Owner:</strong> {shop.owner_name || "-"}
                </span>
                {shop.phone && shop.phone !== "-" && (
                  <span>
                    <strong className="text-slate-300">Phone:</strong> {shop.phone}
                  </span>
                )}
                {shop.address && shop.address !== "-" && (
                  <span>
                    <strong className="text-slate-300">Address:</strong> {shop.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Top Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onCreditPurchase(shop)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition flex items-center gap-1.5"
            >
              <FaPlus className="text-[10px]" />
              <span>+ Purchase</span>
            </button>
            <button
              onClick={() => onPayDue(shop)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              <FaMoneyBillWave className="text-xs" />
              <span>Pay Due</span>
            </button>
            <button
              onClick={fetchLedger}
              title="রিফ্রেশ"
              className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <FaSyncAlt className={`text-xs ${isLoading ? "animate-spin text-amber-400" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        </div>

        {/* 3 Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-5">
          {/* Total Bought */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 shadow-md flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                মোট ক্রয় / বিল (Total Bought)
              </span>
              <div className="text-xl font-black font-mono text-white mt-0.5">
                ৳ {parseFloat(summary.total_bought || 0).toLocaleString()}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FaFileInvoiceDollar className="text-lg" />
            </div>
          </div>

          {/* Total Paid */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 shadow-md flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                পরিশোধিত টাকা (Total Paid)
              </span>
              <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                ৳ {parseFloat(summary.total_paid || 0).toLocaleString()}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FaCheckCircle className="text-lg" />
            </div>
          </div>

          {/* Current Due */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-rose-500/30 shadow-md flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                বর্তমান মোট বকেয়া (Current Due)
              </span>
              <div className="text-xl font-black font-mono text-rose-400 mt-0.5">
                ৳ {parseFloat(summary.current_due || 0).toLocaleString()}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <FaMoneyBillWave className="text-lg" />
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="মেমো নং, ব্র্যান্ড বা মন্তব্য খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {["ALL", "Purchase", "Payment"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    filterType === t
                      ? t === "Payment"
                        ? "bg-emerald-600 text-white"
                        : t === "Purchase"
                        ? "bg-amber-600 text-white"
                        : "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t === "ALL" ? "সব লেনদেন" : t === "Purchase" ? "ক্রয় মেমো" : "পরিশোধ রসিদ"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ledger Transactions Table */}
        <div className="rounded-2xl bg-slate-950/90 border border-slate-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">তারিখ</th>
                  <th className="px-4 py-3">ধরন</th>
                  <th className="px-4 py-3">মেমো নং</th>
                  <th className="px-4 py-3">বিবরণ / ব্র্যান্ড</th>
                  <th className="px-4 py-3 text-right">বিলের পরিমাণ</th>
                  <th className="px-4 py-3 text-right">পরিশোধ</th>
                  <th className="px-4 py-3 text-right">চলতি জের (Due)</th>
                  <th className="px-4 py-3 text-center">মেমো ছবি</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-slate-400">
                      <FaSyncAlt className="animate-spin text-2xl text-amber-400 mx-auto mb-2" />
                      <span>লেজার হিস্ট্রি লোড হচ্ছে...</span>
                    </td>
                  </tr>
                ) : filteredTx.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-slate-500">
                      কোনো লেনদেন বা মেমো পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  filteredTx.map((tx) => {
                    const isPayment = tx.type === "Payment";
                    const imgUrl = getImageUrl(tx.image);

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-900/50 transition duration-150"
                      >
                        {/* Date */}
                        <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">
                          {tx.date || "-"}
                        </td>

                        {/* Type Badge */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isPayment
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {isPayment ? <FaArrowDown className="text-[9px]" /> : <FaArrowUp className="text-[9px]" />}
                            <span>{isPayment ? "পরিশোধ" : "ক্রয় মেমো"}</span>
                          </span>
                        </td>

                        {/* Memo No */}
                        <td className="px-4 py-3 font-mono font-bold text-slate-200">
                          {tx.memo_no}
                        </td>

                        {/* Description & Brand */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{tx.brand}</div>
                          {tx.remarks && (
                            <div className="text-[11px] text-slate-400 italic truncate max-w-xs">
                              {tx.remarks}
                            </div>
                          )}
                        </td>

                        {/* Bill Amount */}
                        <td className="px-4 py-3 font-mono font-bold text-right text-slate-200">
                          {tx.total_amount > 0 ? `৳ ${tx.total_amount.toLocaleString()}` : "-"}
                        </td>

                        {/* Paid */}
                        <td className="px-4 py-3 font-mono font-bold text-right text-emerald-400">
                          {tx.paid > 0 ? `৳ ${tx.paid.toLocaleString()}` : "-"}
                        </td>

                        {/* Running Due Balance */}
                        <td className="px-4 py-3 font-mono font-black text-right text-rose-400">
                          ৳ {tx.running_due.toLocaleString()}
                        </td>

                        {/* Image Preview */}
                        <td className="px-4 py-3 text-center">
                          {imgUrl ? (
                            <button
                              onClick={() => setPreviewImage(imgUrl)}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 transition"
                              title="মেমো ছবি দেখুন"
                            >
                              <FaEye />
                            </button>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-800 text-xs">
          <span className="text-slate-400">
            সর্বমোট লেনদেন: <strong className="text-white">{filteredTx.length}</strong> টি
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold transition"
          >
            বন্ধ করুন (Close)
          </button>
        </div>

        {/* Image Modal Lightbox */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
                <h3 className="text-sm font-bold text-white">মেমো / চালান রসিদ প্রিভিউ</h3>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <img
                src={previewImage}
                alt="Receipt"
                className="w-full max-h-[75vh] object-contain rounded-2xl bg-black/40"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopLedgerModal;

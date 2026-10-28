import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaMoneyBillWave,
  FaReceipt,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaPhoneAlt,
  FaUser,
  FaTimes,
  FaMotorcycle,
  FaStore,
  FaHome,
  FaTools,
  FaProjectDiagram,
  FaBox,
  FaHandHoldingUsd,
  FaBuilding,
  FaCoins,
} from "react-icons/fa";
import Loader from "../../../components/Loader/Loader";
import BackButton from "../../../components/BackButton/BackButton";
import LuxuryToast from "../../../components/Modal/LuxuryToast";
import { useAuth } from "../../../Provider/AuthProvider";

const API = import.meta.env.VITE_LOCALHOST_KEY;

const categoryIcons = {
  bike: <FaMotorcycle className="text-orange-400" size={15} />,
  shop: <FaStore className="text-blue-400" size={15} />,
  house: <FaHome className="text-emerald-400" size={15} />,
  equipment: <FaTools className="text-amber-400" size={15} />,
  project: <FaProjectDiagram className="text-purple-400" size={15} />,
  company_share: <FaBuilding className="text-cyan-400" size={15} />,
  other: <FaBox className="text-slate-400" size={15} />,
};

const OtherSourcesCollections = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState([]);
  const [summary, setSummary] = useState(null);
  const [luxuryToast, setLuxuryToast] = useState(null);

  // Collect Modal
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectTarget, setCollectTarget] = useState(null);
  const [collectForm, setCollectForm] = useState({
    amount: "",
    collection_date: new Date().toISOString().split("T")[0],
    payment_method: "Cash",
    remarks: "",
    create_cash_in: true,
  });
  const [submittingCollect, setSubmittingCollect] = useState(false);

  const fetchCollections = async (month) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API}/other_sources/get_monthly_collections.php?month=${month}`
      );
      const data = await res.json();
      if (data.success) {
        setCollections(data.data || []);
        setSummary(data.summary || null);
      } else {
        setLuxuryToast({
          title: "লোড ব্যর্থ ❌",
          message: data.message || "কালেকশন লোড করা যায়নি।",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "সার্ভারে সমস্যা ❌",
        message: "সার্ভার এরর, পরে চেষ্টা করুন।",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections(selectedMonth);
  }, [selectedMonth]);

  // Month Navigation
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month - 2, 1);
    setSelectedMonth(date.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month, 1);
    setSelectedMonth(date.toISOString().slice(0, 7));
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(new Date().toISOString().slice(0, 7));
  };

  // Open Collect Modal
  const handleOpenCollectModal = (item) => {
    setCollectTarget(item);
    setCollectForm({
      amount: item.monthly_rent,
      collection_date: new Date().toISOString().split("T")[0],
      payment_method: "Cash",
      remarks: "",
      create_cash_in: true,
    });
    setShowCollectModal(true);
  };

  // Submit Collect
  const handleCollectSubmit = async (e) => {
    e.preventDefault();
    if (Number(collectForm.amount) <= 0) {
      return setLuxuryToast({
        title: "সঠিক পরিমাণ দিন ⚠️",
        message: "আদায়ের সঠিক টাকার পরিমাণ লিখুন।",
        type: "warning",
      });
    }

    try {
      setSubmittingCollect(true);
      const payload = {
        agreement_id: collectTarget.agreement_id,
        asset_id: collectTarget.asset_id,
        billing_month: selectedMonth,
        amount: Number(collectForm.amount),
        collection_date: collectForm.collection_date,
        payment_method: collectForm.payment_method,
        remarks: collectForm.remarks,
        create_cash_in: true,
        user_id: user?.id || null,
        approved_by: user?.id || null,
      };

      const res = await fetch(`${API}/other_sources/collect_payment.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setLuxuryToast({
          title: "ভাড়া আদায় সম্পন্ন 🎉",
          message: `${collectTarget?.asset_name || "অ্যাসেট"} এর (${selectedMonth}) মাসের ভাড়া সফলভাবে আদায় করা হয়েছে।`,
          tag: collectTarget?.lessee_name ? `ভাড়াটিয়া: ${collectTarget.lessee_name}` : "ভাড়া আদায়",
          amount: Number(collectForm.amount),
          type: "success",
        });
        setShowCollectModal(false);
        fetchCollections(selectedMonth);
      } else {
        setLuxuryToast({
          title: "আদায় ব্যর্থ ❌",
          message: data.message || "কালেকশন সংরক্ষণ করা যায়নি।",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "সার্ভারে সমস্যা ❌",
        message: "সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।",
        type: "error",
      });
    } finally {
      setSubmittingCollect(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 text-slate-200">
      <BackButton />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 mb-1">
            <FaReceipt size={13} />
            <span>MONTHLY COLLECTION BOARD</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Monthly Rent & Lease Collections
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            চলতি মাসের কালেকশন বোর্ড ও ১-ক্লিকে স্বয়ংক্রিয় ক্যাশ-ইন (Cash In)
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2 bg-[#0f1b2d] border border-white/10 rounded-2xl p-1.5 self-start md:self-auto shadow-md">
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
            title="পূর্ববর্তী মাস"
          >
            <FaChevronLeft size={11} />
          </button>

          <div className="flex items-center gap-1.5 px-3">
            <FaCalendarAlt size={13} className="text-orange-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-bold text-sm outline-none cursor-pointer font-mono"
            />
          </div>

          <button
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
            title="পরবর্তী মাস"
          >
            <FaChevronRight size={11} />
          </button>

          <button
            onClick={handleCurrentMonth}
            className="px-2.5 py-1 text-xs rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 font-semibold transition cursor-pointer"
          >
            চলতি মাস
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-[#0f1b2d] border border-white/10 rounded-2xl p-4 shadow-lg">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              মোট প্রত্যাশিত আদায়
            </span>
            <h3 className="text-2xl font-bold text-white mt-1 font-mono">
              ৳ {summary.total_expected.toLocaleString()}
            </h3>
            <span className="text-[11px] text-slate-500 mt-1 block">
              মোট চুক্তি: {summary.total_agreements} টি
            </span>
          </div>

          <div className="bg-[#0f1b2d] border border-white/10 rounded-2xl p-4 shadow-lg">
            <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
              <FaCheckCircle size={11} /> আদায় সম্পন্ন (Cash In)
            </span>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
              ৳ {summary.total_collected.toLocaleString()}
            </h3>
            <span className="text-[11px] text-emerald-500 mt-1 block font-medium">
              {summary.paid_count} জন পরিশোধ করেছেন
            </span>
          </div>

          <div className="bg-[#0f1b2d] border border-white/10 rounded-2xl p-4 shadow-lg">
            <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider block flex items-center gap-1">
              <FaClock size={11} /> বকেয়া / বাকি আছে
            </span>
            <h3 className="text-2xl font-bold text-amber-400 mt-1 font-mono">
              ৳ {summary.total_due.toLocaleString()}
            </h3>
            <span className="text-[11px] text-amber-500 mt-1 block font-medium">
              {summary.unpaid_count} জন এখনো বাকি
            </span>
          </div>

          <div className="bg-[#0f1b2d] border border-white/10 rounded-2xl p-4 shadow-lg">
            <span className="text-[11px] font-medium text-orange-400 uppercase tracking-wider block">
              আদায়ের হার (Rate)
            </span>
            <h3 className="text-2xl font-bold text-orange-400 mt-1 font-mono">
              {summary.collection_rate}%
            </h3>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-500 to-emerald-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, summary.collection_rate)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Collections Board */}
      <div className="bg-[#0f1b2d] border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 md:p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FaReceipt className="text-orange-400" />
            <span>
              {selectedMonth} মাসের কালেকশন শিডিউল ({collections.length})
            </span>
          </h2>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/email-logs")}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1.5"
            >
              <span>✉️ ইমেইল হিস্ট্রি</span>
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => navigate("/other-sources/assets")}
              className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition"
            >
              অ্যাসেট ম্যানেজমেন্ট ➔
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader />
          </div>
        ) : collections.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <FaReceipt className="text-slate-600 text-5xl mx-auto mb-3" />
            <h4 className="text-base font-bold text-white">এই মাসে কোনো সক্রিয় চুক্তি ছিল না</h4>
            <p className="text-xs text-slate-500 mt-1">
              নির্বাচিত মাসে ({selectedMonth}) কোনো অ্যাসেট বা লিজ কার্যকর ছিল না।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#071025] text-slate-400 uppercase tracking-wider border-b border-white/10">
                  <th className="py-3 px-4">অ্যাসেটের নাম</th>
                  <th className="py-3 px-4">গ্রহীতা / ভাড়াটিয়া</th>
                  <th className="py-3 px-4">প্রদেয় তারিখ</th>
                  <th className="py-3 px-4 text-right">ভাড়া / কিস্তি</th>
                  <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {collections.map((item) => {
                  const isPaid = item.is_paid;

                  return (
                    <tr
                      key={item.agreement_id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      {/* Asset Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#071025] border border-white/10 flex items-center justify-center shrink-0">
                            {categoryIcons[item.category] || categoryIcons.other}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm block">
                              {item.asset_name}
                            </span>
                            <span className="text-[11px] text-slate-400 capitalize">
                              {item.agreement_type === "hire_purchase"
                                ? "হায়ার পারচেজ"
                                : "ভাড়া/লিজ"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Lessee */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">
                          {item.lessee_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <FaPhoneAlt size={9} className="text-slate-500" />
                          <span>{item.lessee_mobile}</span>
                        </div>
                      </td>

                      {/* Due Day */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        প্রতি মাসের {item.due_day} তারিখ
                      </td>

                      {/* Monthly Rent */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-white">
                        ৳ {item.monthly_rent.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isPaid ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                              <FaCheckCircle size={10} /> পেইড
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {item.collection_date} ({item.payment_method})
                            </span>
                          </div>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                            <FaClock size={10} /> বাকি আছে
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        {isPaid ? (
                          <span className="text-xs text-emerald-400 font-medium font-mono">
                            আদায়: ৳ {item.paid_amount.toLocaleString()}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenCollectModal(item)}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                          >
                            <FaHandHoldingUsd size={13} />
                            <span>টাকা আদায় (Cash In)</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================================= */}
      {/* 💰 COLLECT PAYMENT MODAL (With Automatic Cash In)                        */}
      {/* ======================================================================= */}
      {showCollectModal && collectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0f1b2d] border border-white/15 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white">ভাড়া / কিস্তি আদায়</h3>
                <p className="text-xs text-orange-400 font-mono">
                  মাস: {selectedMonth}
                </p>
              </div>

              <button
                onClick={() => setShowCollectModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleCollectSubmit} className="space-y-4 text-xs">
              <div className="bg-[#071025] border border-white/5 rounded-xl p-3 space-y-1">
                <span className="text-slate-400 block">অ্যাসেট:</span>
                <p className="text-sm font-bold text-white">
                  {collectTarget.asset_name}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-slate-300">
                  <span>গ্রহীতা: {collectTarget.lessee_name}</span>
                  <span className="font-mono text-slate-400">
                    {collectTarget.lessee_mobile}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
                  আদায়ের পরিমাণ (টাকা) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={collectForm.amount}
                  onChange={(e) =>
                    setCollectForm({ ...collectForm, amount: e.target.value })
                  }
                  className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white font-mono font-bold text-base outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    আদায়ের তারিখ
                  </label>
                  <input
                    type="date"
                    required
                    value={collectForm.collection_date}
                    onChange={(e) =>
                      setCollectForm({
                        ...collectForm,
                        collection_date: e.target.value,
                      })
                    }
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">
                    পেমেন্ট মেথড
                  </label>
                  <select
                    value={collectForm.payment_method}
                    onChange={(e) =>
                      setCollectForm({
                        ...collectForm,
                        payment_method: e.target.value,
                      })
                    }
                    className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500"
                  >
                    <option value="Cash">Cash (ক্যাশ)</option>
                    <option value="Bank">Bank (ব্যাংক)</option>
                    <option value="bKash">bKash (বিকাশ)</option>
                    <option value="Nagad">Nagad (নগদ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
                  মন্তব্য (Remarks)
                </label>
                <input
                  type="text"
                  placeholder="রসিদ নম্বর বা বিশেষ তথ্য..."
                  value={collectForm.remarks}
                  onChange={(e) =>
                    setCollectForm({ ...collectForm, remarks: e.target.value })
                  }
                  className="w-full bg-[#071025] border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-orange-500"
                />
              </div>

              {/* Automatic Cash In Status Card (Directly Approved) */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/25 via-[#060c18] to-[#060c18] border border-emerald-500/30 p-2.5 px-3 flex items-start gap-3 shadow-inner">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                  <FaCoins size={13} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      স্বয়ংক্রিয় Cash In (সরাসরি Approved)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-sm shrink-0">
                      <FaCheckCircle size={10} className="text-emerald-400" />
                      অটো অনুমোদিত
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    ভাড়া আদায়ের সাথে সাথে ক্যাশ ম্যানেজমেন্টে সরাসরি Approved ক্যাশ ইন রেকর্ড হবে (আলাদা কোনো অনুমোদনের প্রয়োজন নেই)।
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingCollect}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {submittingCollect ? "সংরক্ষণ হচ্ছে..." : "টাকা আদায় সম্পন্ন করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Luxury Floating Toast Notification */}
      <LuxuryToast toast={luxuryToast} onClose={() => setLuxuryToast(null)} duration={4500} />
    </div>
  );
};

export default OtherSourcesCollections;

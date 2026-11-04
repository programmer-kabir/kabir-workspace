import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import BackButton from "../../components/BackButton/BackButton";
import Loader from "../../components/Loader/Loader";
import {
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaSyncAlt,
  FaTrashAlt,
  FaCreditCard,
  FaLayerGroup,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaSearch
} from "react-icons/fa";

const DuplicateEntryAudit = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total_issues_found: 0, total_excess_amount: 0 });
  const [audit, setAudit] = useState({
    ref_duplicates: [],
    payment_duplicates: [],
    same_day_duplicates: [],
    multiple_downpayments: [],
    cross_type_conflicts: [],
  });
  const [archivingId, setArchivingId] = useState(null);

  const baseUrl = import.meta.env.VITE_LOCALHOST_KEY || "https://management.supplylinkbd.com/apis";

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/audit/audit_duplicate_payments.php`, {
        withCredentials: true,
      });

      if (res.data?.success) {
        setSummary(res.data.summary || { total_issues_found: 0, total_excess_amount: 0 });
        setAudit(res.data.audit || {});
      } else {
        toast.error("ডাটা স্ক্যান করতে ব্যর্থ হয়েছে");
      }
    } catch (err) {
      console.error(err);
      toast.error("সার্ভার ত্রুটি: অডিট ডাটা লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const handleArchiveCash = async (cashId, reason) => {
    const result = await Swal.fire({
      title: `ক্যাশ #${cashId} ডুপ্লিকেট হিসেবে আর্কাইভ করবেন?`,
      text: "এই এন্ট্রিটি ক্যাশ টেবিল থেকে নিষ্ক্রিয় (soft delete) করা হবে।",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "হ্যাঁ, আর্কাইভ করুন",
      cancelButtonText: "বাতিল",
    });

    if (!result.isConfirmed) return;

    setArchivingId(cashId);
    try {
      const res = await axios.post(
        `${baseUrl}/audit/audit_duplicate_payments.php`,
        {
          action: "archive_cash_duplicate",
          cash_id: cashId,
          reason: reason || "Archived duplicate entry via audit",
        },
        { withCredentials: true }
      );

      if (res.data?.success) {
        Swal.fire({
          icon: "success",
          title: "সফল!",
          text: res.data.message,
          timer: 2000,
          showConfirmButton: false,
        });
        fetchAudit();
      } else {
        Swal.fire({
          icon: "error",
          title: "ব্যর্থ",
          text: res.data?.message || "আর্কাইভ করা যায়নি",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "সার্ভার এরর",
        text: err.response?.data?.message || "সার্ভার এরর",
      });
    } finally {
      setArchivingId(null);
    }
  };

  const hasIssues = summary.total_issues_found > 0;

  return (
    <div className="min-h-screen bg-[#0b132b] text-white p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <FaShieldAlt className="text-cyan-400" />
              ডাবল এন্ট্রি ও অতিরিক্ত পেমেন্ট অডিট (Double Entry Audit)
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              ক্যাশ টেবিল এবং কিস্তি চার্টের মধ্যে ডুপ্লিকেট, পুনরাবৃত্তি বা ডাবল ক্যাশ-ইন রিয়েল-টাইম শনাক্তকরণ
            </p>
          </div>
        </div>

        {/* Refresh Action */}
        <button
          onClick={fetchAudit}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#1c2541] hover:bg-[#253256] text-gray-200 rounded-lg text-sm transition-all border border-gray-700 disabled:opacity-50"
        >
          <FaSyncAlt className={loading ? "animate-spin text-cyan-400" : ""} />
          পুনরায় স্ক্যান করুন
        </button>
      </div>

      {/* Main Status Banner */}
      {loading ? (
        <div className="py-20">
          <Loader />
        </div>
      ) : (
        <>
          <div
            className={`border rounded-xl p-5 mb-6 shadow-lg backdrop-blur transition-all ${
              hasIssues
                ? "bg-rose-950/40 border-rose-800/80"
                : "bg-emerald-950/30 border-emerald-800/60"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${
                    hasIssues
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {hasIssues ? <FaExclamationTriangle /> : <FaCheckCircle />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {hasIssues
                      ? `সতর্কতা: ${summary.total_issues_found} টি সম্ভাব্য ডাবল বা পুনরাবৃত্তি এন্ট্রি পাওয়া গেছে!`
                      : "ডাটাবেজ সম্পূর্ণ ব্যালেন্সড ও সুরক্ষিত!"}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
                    {hasIssues
                      ? `ক্যাশ ও কিস্তি রেকর্ডে মোট ৳${Number(summary.total_excess_amount).toLocaleString()} অতিরিক্ত/ডাবল টাকার অমিল শনাক্ত হয়েছে।`
                      : "ক্যাশ টেবিল এবং কিস্তি চার্টের মধ্যে কোনো ডাবল এন্ট্রি, ডুপ্লিকেট রেফারেন্স বা অতিরিক্ত পেমেন্ট নেই।"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                    hasIssues
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {hasIssues ? (
                    <>
                      <FaTimesCircle /> সমস্যা: {summary.total_issues_found} টি
                    </>
                  ) : (
                    <>
                      <FaCheckCircle /> ১০০% অল ক্লিয়ার
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Checkpoints Sections */}
          <div className="space-y-6">
            {/* CHECK 1: Cash RefId Duplicates */}
            <div className="bg-[#1c2541]/80 backdrop-blur border border-gray-800 rounded-xl overflow-hidden shadow">
              <div className="p-4 bg-[#141d36] border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    ১. ক্যাশ রেফারেন্স আইডি ডুপ্লিকেট (`refId` Duplicates)
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    একই কিস্তির বা ডাউনপেমেন্টের রেফারেন্সে একাধিক ক্যাশ ভাউচার তৈরি হয়েছে কিনা।
                  </p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    audit.ref_duplicates.length > 0
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {audit.ref_duplicates.length > 0
                    ? `${audit.ref_duplicates.length} টি ডুপ্লিকেট`
                    : "✓ ক্লিয়ার (০)"}
                </span>
              </div>

              {audit.ref_duplicates.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                  <FaCheckCircle className="text-emerald-400 text-sm" />
                  ক্যাশ টেবিলে কোনো ডুপ্লিকেট রেফারেন্স আইডি নেই।
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0b132b] text-gray-300 border-b border-gray-800">
                        <th className="py-2.5 px-4">রেফারেন্স ID</th>
                        <th className="py-2.5 px-4">ক্যাটাগরি</th>
                        <th className="py-2.5 px-4 text-center">পুনরাবৃত্তি</th>
                        <th className="py-2.5 px-4">ক্যাশ এন্ট্রি IDs</th>
                        <th className="py-2.5 px-4 text-rose-400 text-right">অতিরিক্ত টাকা</th>
                        <th className="py-2.5 px-4 text-center">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {audit.ref_duplicates.map((r, i) => (
                        <tr key={i} className="hover:bg-[#253256]/40">
                          <td className="py-2.5 px-4 font-mono font-semibold text-cyan-400">
                            {r.refId}
                          </td>
                          <td className="py-2.5 px-4">{r.category}</td>
                          <td className="py-2.5 px-4 text-center font-bold text-rose-400">
                            {r.count} বার
                          </td>
                          <td className="py-2.5 px-4 font-mono text-gray-300">
                            #{r.cash_ids.join(", #")}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-rose-400">
                            +৳{Number(r.excess_amount).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <button
                              onClick={() =>
                                handleArchiveCash(
                                  r.cash_ids[r.cash_ids.length - 1],
                                  `Duplicate of refId ${r.refId}`
                                )
                              }
                              disabled={archivingId}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-medium"
                            >
                              ডুপ্লিকেট রিমুভ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* CHECK 2: Duplicate Paid in installment_payments chart */}
            <div className="bg-[#1c2541]/80 backdrop-blur border border-gray-800 rounded-xl overflow-hidden shadow">
              <div className="p-4 bg-[#141d36] border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    ২. কিস্তি চার্টে একই কিস্তি একাধিকবার পেইড (Duplicate Paid in Chart)
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    একই কার্ডে একই কিস্তি নম্বর (যেমন: ১ম কিস্তি বা ২য় কিস্তি) চার্টে একাধিকবার "Paid" মার্ক হয়েছে কিনা।
                  </p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    audit.payment_duplicates.length > 0
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {audit.payment_duplicates.length > 0
                    ? `${audit.payment_duplicates.length} টি ডুপ্লিকেট`
                    : "✓ ক্লিয়ার (০)"}
                </span>
              </div>

              {audit.payment_duplicates.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                  <FaCheckCircle className="text-emerald-400 text-sm" />
                  কিস্তি চার্টে কোনো কিস্তি একাধিকবার পেইড মার্ক করা হয়নি।
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0b132b] text-gray-300 border-b border-gray-800">
                        <th className="py-2.5 px-4">কার্ড নং</th>
                        <th className="py-2.5 px-4">কাস্টমার ও প্রোডাক্ট</th>
                        <th className="py-2.5 px-4">কিস্তি নং</th>
                        <th className="py-2.5 px-4 text-center">পুনরাবৃত্তি</th>
                        <th className="py-2.5 px-4 text-rose-400 text-right">অতিরিক্ত টাকা</th>
                        <th className="py-2.5 px-4">পেমেন্ট IDs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {audit.payment_duplicates.map((p, i) => (
                        <tr key={i} className="hover:bg-[#253256]/40">
                          <td className="py-2.5 px-4 font-mono font-bold text-indigo-400">
                            #{p.card_id}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="font-semibold">{p.customer_name}</div>
                            <div className="text-[11px] text-gray-400">{p.product_name}</div>
                          </td>
                          <td className="py-2.5 px-4 font-semibold">
                            {p.installment_no === 0 ? "ডাউনপেমেন্ট" : `কিস্তি #${p.installment_no}`}
                          </td>
                          <td className="py-2.5 px-4 text-center font-bold text-rose-400">
                            {p.count} বার
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-rose-400">
                            +৳{Number(p.excess_amount).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-gray-400">
                            #{p.payment_ids.join(", #")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* CHECK 3: Same day same amount duplicates */}
            <div className="bg-[#1c2541]/80 backdrop-blur border border-gray-800 rounded-xl overflow-hidden shadow">
              <div className="p-4 bg-[#141d36] border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    ৩. একই দিনে একই ব্যক্তির হুবহু ক্যাশ-ইন (Same Day Same Person)
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    একই দিনে একই কাস্টমারের জন্য একই টাকার ক্যাশ-ইন দুইবার ঢোকানো হয়েছে কিনা (ডাবল ক্লিকের কারণে)।
                  </p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    audit.same_day_duplicates.length > 0
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {audit.same_day_duplicates.length > 0
                    ? `${audit.same_day_duplicates.length} টি ডুপ্লিকেট`
                    : "✓ ক্লিয়ার (০)"}
                </span>
              </div>

              {audit.same_day_duplicates.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                  <FaCheckCircle className="text-emerald-400 text-sm" />
                  একই তারিখে একই পরিমাণ টাকার কোনো ডুপ্লিকেট ক্যাশ এন্ট্রি নেই।
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0b132b] text-gray-300 border-b border-gray-800">
                        <th className="py-2.5 px-4">তারিখ</th>
                        <th className="py-2.5 px-4">সোর্স / বিবরণ</th>
                        <th className="py-2.5 px-4">পরিমাণ</th>
                        <th className="py-2.5 px-4 text-center">পুনরাবৃত্তি</th>
                        <th className="py-2.5 px-4">ক্যাশ IDs</th>
                        <th className="py-2.5 px-4 text-center">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {audit.same_day_duplicates.map((s, i) => (
                        <tr key={i} className="hover:bg-[#253256]/40">
                          <td className="py-2.5 px-4 font-mono">{s.date}</td>
                          <td className="py-2.5 px-4 font-semibold text-white">{s.source}</td>
                          <td className="py-2.5 px-4 font-bold text-emerald-400">
                            ৳{Number(s.amount).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-center font-bold text-rose-400">
                            {s.count} বার
                          </td>
                          <td className="py-2.5 px-4 font-mono text-gray-300">
                            #{s.cash_ids.join(", #")}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <button
                              onClick={() =>
                                handleArchiveCash(
                                  s.cash_ids[s.cash_ids.length - 1],
                                  `Duplicate same-day cash entry for ${s.source}`
                                )
                              }
                              disabled={archivingId}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-medium"
                            >
                              অতিরিক্তটি রিমুভ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* CHECK 4: Cross Type Conflict (Daily Card vs Monthly Cash) */}
            <div className="bg-[#1c2541]/80 backdrop-blur border border-gray-800 rounded-xl overflow-hidden shadow">
              <div className="p-4 bg-[#141d36] border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    ৪. দৈনিক বনাম মাসিক ডাবল ক্যাশ-ইন সংঘাত (Daily vs Monthly Conflict)
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    দৈনিক কিস্তির কার্ডে দৈনিক কালেকশন চালু থাকা অবস্থায় মাসিক চার্টেও 'Paid' করে ডাবল ক্যাশ-ইন করা হয়েছে কিনা।
                  </p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    audit.cross_type_conflicts.length > 0
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {audit.cross_type_conflicts.length > 0
                    ? `${audit.cross_type_conflicts.length} টি সংঘাত`
                    : "✓ ক্লিয়ার (০)"}
                </span>
              </div>

              {audit.cross_type_conflicts.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                  <FaCheckCircle className="text-emerald-400 text-sm" />
                  কোনো দৈনিক কার্ডের সাথে মাসিক চার্টের ডাবল ক্যাশ-ইন সংঘাত নেই।
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0b132b] text-gray-300 border-b border-gray-800">
                        <th className="py-2.5 px-4">কার্ড নং</th>
                        <th className="py-2.5 px-4">কাস্টমার</th>
                        <th className="py-2.5 px-4">মাসিক ক্যাশ ID ও পরিমাণ</th>
                        <th className="py-2.5 px-4">দৈনিক কালেকশন পরিমাণ</th>
                        <th className="py-2.5 px-4">বিবরণ</th>
                        <th className="py-2.5 px-4 text-center">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {audit.cross_type_conflicts.map((c, i) => (
                        <tr key={i} className="hover:bg-[#253256]/40">
                          <td className="py-2.5 px-4 font-mono font-bold text-purple-400">
                            #{c.card_id}
                          </td>
                          <td className="py-2.5 px-4 font-semibold">{c.customer_name}</td>
                          <td className="py-2.5 px-4 font-bold text-rose-400">
                            #{c.cash_id} (৳{Number(c.cash_amount).toLocaleString()})
                          </td>
                          <td className="py-2.5 px-4 font-bold text-cyan-400">
                            ৳{Number(c.daily_collections_amount).toLocaleString()} ({c.daily_collections_count} বার)
                          </td>
                          <td className="py-2.5 px-4 text-gray-300 text-[11px] max-w-xs">
                            {c.description}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <button
                              onClick={() =>
                                handleArchiveCash(
                                  c.cash_id,
                                  `Removed monthly cash conflict for daily card #${c.card_id}`
                                )
                              }
                              disabled={archivingId}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-medium"
                            >
                              মাসিক এন্ট্রি রিমুভ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DuplicateEntryAudit;


import React, { useState, useMemo } from "react";
import useCashReports from "../../../utils/Hooks/cash/useCashReports";
import Loader from "../../../components/Loader/Loader";
import { useAuth } from "../../../Provider/AuthProvider";
import axios from "axios";
import { toast } from "react-toastify";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Check,
  X,
  FileText,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const CashReportApproved = () => {
  const { CashReports, isCashReportsError, isCashReportsLoading, refetch } =
    useCashReports();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("pending");
  const [selectedReason, setSelectedReason] = useState("");
  const [rejectModal, setRejectModal] = useState(false);
  const [selectedCash, setSelectedCash] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reports = useMemo(() => {
    if (Array.isArray(CashReports)) return CashReports;
    if (Array.isArray(CashReports?.data)) return CashReports.data;
    return [];
  }, [CashReports]);

  const pendingReports = useMemo(
    () => reports.filter((item) => item.approval_status === "pending"),
    [reports]
  );

  const rejectedReports = useMemo(
    () => reports.filter((item) => item.approval_status === "rejected"),
    [reports]
  );

  const approvedReports = useMemo(
    () => reports.filter((item) => item.approval_status === "approved"),
    [reports]
  );

  // Tab data selection
  const rawData = useMemo(() => {
    if (activeTab === "pending") return pendingReports;
    if (activeTab === "rejected") return rejectedReports;
    return approvedReports;
  }, [activeTab, pendingReports, rejectedReports, approvedReports]);

  // Search filter
  const currentData = useMemo(() => {
    if (!searchTerm.trim()) return rawData;
    const term = searchTerm.toLowerCase();
    return rawData.filter((item) => {
      const purpose = (item.type === "in" ? item.source : item.purpose) || "";
      const category = item.category || "";
      const date = item.date || "";
      const amount = String(item.amount || "");
      const reason = item.reject_reason || "";
      return (
        purpose.toLowerCase().includes(term) ||
        category.toLowerCase().includes(term) ||
        date.toLowerCase().includes(term) ||
        amount.includes(term) ||
        reason.toLowerCase().includes(term)
      );
    });
  }, [rawData, searchTerm]);

  // Aggregate sums
  const pendingSum = useMemo(
    () => pendingReports.reduce((acc, c) => acc + Number(c.amount || 0), 0),
    [pendingReports]
  );
  const approvedSum = useMemo(
    () => approvedReports.reduce((acc, c) => acc + Number(c.amount || 0), 0),
    [approvedReports]
  );
  const rejectedSum = useMemo(
    () => rejectedReports.reduce((acc, c) => acc + Number(c.amount || 0), 0),
    [rejectedReports]
  );

  const handleApprove = async (cash) => {
    try {
      setIsSubmitting(true);
      const payload = {
        id: cash.id,
        approval_status: "approved",
        approved_by: user?.id,
      };

      const result = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/cash/update_cash.php`,
        payload
      );

      if (result.data.success) {
        toast.success(result.data.message || "লেনদেন সফলভাবে অনুমোদিত হয়েছে");
        setRejectModal(false);
        setRejectReason("");
        setSelectedCash(null);
        refetch?.();
      } else {
        toast.error(result.data.message || "অনুমোদন ব্যর্থ হয়েছে");
      }
    } catch (error) {
      console.error(error);
      toast.error("অনুমোদনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCash || !rejectReason.trim()) return;
    try {
      setIsSubmitting(true);
      const payload = {
        id: selectedCash.id,
        approval_status: "rejected",
        approved_by: user?.id,
        reject_reason: rejectReason.trim(),
      };

      const result = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/cash/update_cash.php`,
        payload
      );

      if (result.data.success) {
        toast.success(result.data.message || "লেনদেন বাতিল করা হয়েছে");
        setRejectModal(false);
        setRejectReason("");
        setSelectedCash(null);
        refetch?.();
      } else {
        toast.error(result.data.message || "বাতিল ব্যর্থ হয়েছে");
      }
    } catch (error) {
      console.error(error);
      toast.error("বাতিল করতে সমস্যা হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCashReportsLoading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (isCashReportsError) {
    return (
      <div className="p-6">
        <div className="card-surface p-6 rounded-2xl border-rose-500/20 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">তথ্য লোড করতে সমস্যা হয়েছে</h2>
          <p className="text-sm text-slate-400">
            ক্যাশ রিপোর্ট বা অনুমোদন সংক্রান্ত তথ্য সার্ভার থেকে লোড করা সম্ভব হয়নি।
          </p>
          <button
            onClick={() => refetch?.()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            পুনরায় চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 md:p-6 space-y-6  mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                ক্যাশ ও অনুদান অনুমোদন (Approval Desk)
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                সকল পেন্ডিং লেনদেন ও অনুদান যাচাই-বাছাই করে অনুমোদন বা বাতিল করুন
              </p>
            </div>
          </div>
        </div>

        {/* Pending Alert Badge */}
        {pendingReports.length > 0 && (
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 self-start md:self-auto">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="text-xs font-semibold text-amber-300">
              {pendingReports.length}টি লেনদেন অনুমোদনের অপেক্ষায়
            </span>
          </div>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Card */}
        <div
          onClick={() => setActiveTab("pending")}
          className={`card-surface p-4 rounded-2xl cursor-pointer transition-all border ${
            activeTab === "pending"
              ? "ring-2 ring-amber-500/50 border-amber-500/40 bg-amber-500/[0.04]"
              : "hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">পেন্ডিং আবেদন</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white font-mono">
              {pendingReports.length}
            </div>
            <p className="text-xs text-amber-400/90 font-mono mt-1">
              মোট: ৳{pendingSum.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Approved Card */}
        <div
          onClick={() => setActiveTab("approved")}
          className={`card-surface p-4 rounded-2xl cursor-pointer transition-all border ${
            activeTab === "approved"
              ? "ring-2 ring-emerald-500/50 border-emerald-500/40 bg-emerald-500/[0.04]"
              : "hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">অনুমোদিত লেনদেন</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white font-mono">
              {approvedReports.length}
            </div>
            <p className="text-xs text-emerald-400/90 font-mono mt-1">
              মোট: ৳{approvedSum.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Rejected Card */}
        <div
          onClick={() => setActiveTab("rejected")}
          className={`card-surface p-4 rounded-2xl cursor-pointer transition-all border ${
            activeTab === "rejected"
              ? "ring-2 ring-rose-500/50 border-rose-500/40 bg-rose-500/[0.04]"
              : "hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">বাতিলকৃত আবেদন</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/25">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white font-mono">
              {rejectedReports.length}
            </div>
            <p className="text-xs text-rose-400/90 font-mono mt-1">
              মোট: ৳{rejectedSum.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Control Bar: Segmented Tabs + Search Filter */}
      <div className="card-surface p-3 sm:p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Segmented Tab Switcher */}
          <div className="inline-flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] self-start md:self-auto w-full md:w-auto">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "pending"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>পেন্ডিং</span>
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "pending"
                    ? "bg-slate-950 text-amber-400"
                    : "bg-white/[0.08] text-slate-300"
                }`}
              >
                {pendingReports.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("approved")}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "approved"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>অনুমোদিত</span>
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "approved"
                    ? "bg-white/20 text-white"
                    : "bg-white/[0.08] text-slate-300"
                }`}
              >
                {approvedReports.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("rejected")}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "rejected"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>বাতিলকৃত</span>
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "rejected"
                    ? "bg-white/20 text-white"
                    : "bg-white/[0.08] text-slate-300"
                }`}
              >
                {rejectedReports.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="বিবরণ, ক্যাটাগরি বা পরিমাণ খুঁজুন..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block card-surface rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm text-left">
            <thead className="bg-white/[0.03] text-slate-300 uppercase text-xs tracking-wider border-b border-white/[0.08]">
              <tr>
                <th className="px-5 py-4 font-semibold">#</th>
                <th className="px-5 py-4 font-semibold">তারিখ</th>
                <th className="px-5 py-4 font-semibold">ধরণ</th>
                <th className="px-5 py-4 font-semibold">বিবরণ / উদ্দেশ্য</th>
                <th className="px-5 py-4 font-semibold">ক্যাটাগরি</th>
                <th className="px-5 py-4 font-semibold text-right">পরিমাণ</th>
                {activeTab === "rejected" && (
                  <th className="px-5 py-4 font-semibold">বাতিলের কারণ</th>
                )}
                {activeTab === "pending" && (
                  <th className="px-5 py-4 font-semibold text-center">কার্যক্রম</th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.05]">
              {currentData.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeTab === "pending" || activeTab === "rejected" ? 7 : 6}
                    className="px-5 py-12 text-center text-slate-500 space-y-2"
                  >
                    <Layers className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-sm">কোন তথ্য পাওয়া যায়নি</p>
                  </td>
                </tr>
              ) : (
                currentData.map((cash, index) => {
                  const isCashIn = cash.type === "in";
                  const purposeText = isCashIn
                    ? cash.source || "-"
                    : cash.purpose || "-";

                  return (
                    <tr
                      key={cash.id || index}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Serial */}
                      <td className="px-5 py-4 text-slate-400 font-mono text-xs">
                        {currentData.length - index}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-300 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{cash.date || "-"}</span>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isCashIn
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {isCashIn ? (
                            <>
                              <ArrowDownRight className="w-3.5 h-3.5" /> Cash In
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3.5 h-3.5" /> Cash Out
                            </>
                          )}
                        </span>
                      </td>

                      {/* Purpose */}
                      <td className="px-5 py-4 max-w-[280px]">
                        <p className="text-sm font-medium text-slate-100 truncate" title={purposeText}>
                          {purposeText}
                        </p>
                        {cash.note && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {cash.note}
                          </p>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4 text-slate-300 text-xs">
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-300">
                          {cash.category || "-"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-bold text-base ${
                            isCashIn ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          ৳ {Number(cash.amount || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Reject Reason Column */}
                      {activeTab === "rejected" && (
                        <td className="px-5 py-4 max-w-[220px]">
                          <button
                            onClick={() => setSelectedReason(cash.reject_reason || "কারণ উল্লেখ করা হয়নি")}
                            className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 underline underline-offset-2 truncate"
                            title="সম্পূর্ণ কারণ দেখতে ক্লিক করুন"
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              {cash.reject_reason || "কারণ দেখুন"}
                            </span>
                          </button>
                        </td>
                      )}

                      {/* Actions Column */}
                      {activeTab === "pending" && (
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              disabled={isSubmitting}
                              onClick={() => handleApprove(cash)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>অনুমোদন</span>
                            </button>

                            <button
                              disabled={isSubmitting}
                              onClick={() => {
                                setSelectedCash(cash);
                                setRejectModal(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>বাতিল</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {currentData.length === 0 ? (
          <div className="card-surface rounded-2xl p-8 text-center text-slate-500 space-y-2">
            <Layers className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm">কোন তথ্য পাওয়া যায়নি</p>
          </div>
        ) : (
          currentData.map((cash, index) => {
            const isCashIn = cash.type === "in";
            const purposeText = isCashIn
              ? cash.source || "-"
              : cash.purpose || "-";

            return (
              <div
                key={cash.id || index}
                className="card-surface rounded-2xl p-4 space-y-3"
              >
                {/* Top: Serial, Type, and Amount */}
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400">
                      #{currentData.length - index}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        isCashIn
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {isCashIn ? "Cash In" : "Cash Out"}
                    </span>
                  </div>

                  <span
                    className={`font-mono font-bold text-base ${
                      isCashIn ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    ৳{Number(cash.amount || 0).toLocaleString()}
                  </span>
                </div>

                {/* Purpose / Description */}
                <div>
                  <p className="text-xs text-slate-400">বিবরণ / উদ্দেশ্য</p>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {purposeText}
                  </p>
                  {cash.note && (
                    <p className="text-xs text-slate-500 mt-0.5">{cash.note}</p>
                  )}
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-500 block text-[11px]">ক্যাটাগরি</span>
                    <span className="text-slate-300 font-medium">
                      {cash.category || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">তারিখ</span>
                    <span className="text-slate-300 font-mono">
                      {cash.date || "-"}
                    </span>
                  </div>
                </div>

                {/* Reject Reason Button for Mobile */}
                {activeTab === "rejected" && cash.reject_reason && (
                  <div className="pt-2 border-t border-white/[0.06]">
                    <span className="text-[11px] text-slate-500 block">বাতিলের কারণ:</span>
                    <button
                      onClick={() => setSelectedReason(cash.reject_reason)}
                      className="text-xs text-rose-400 hover:text-rose-300 text-left underline underline-offset-2 mt-0.5 line-clamp-2"
                    >
                      {cash.reject_reason}
                    </button>
                  </div>
                )}

                {/* Mobile Pending Action Buttons */}
                {activeTab === "pending" && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
                    <button
                      disabled={isSubmitting}
                      onClick={() => handleApprove(cash)}
                      className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>অনুমোদন</span>
                    </button>

                    <button
                      disabled={isSubmitting}
                      onClick={() => {
                        setSelectedCash(cash);
                        setRejectModal(true);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold active:scale-95 disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>বাতিল</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reject Reason Preview Modal */}
      {selectedReason && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-surface border-slate-700 rounded-2xl p-5 md:p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-rose-400">
                <FileText className="w-5 h-5" />
                <h2 className="text-base font-bold text-white">বাতিলের বিস্তারিত কারণ</h2>
              </div>
              <button
                onClick={() => setSelectedReason("")}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-rose-500/20">
              <p className="text-sm text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                {selectedReason}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedReason("")}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-slate-200 text-xs font-semibold transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Action Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-surface border-rose-500/30 rounded-2xl w-full max-w-md p-5 md:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/25 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  লেনদেন বাতিলের কারণ লিখুন
                </h2>
                <p className="text-xs text-slate-400">
                  লেনদেনটি বাতিল করার কারণ উল্লেখ করা বাধ্যতামূলক
                </p>
              </div>
            </div>

            {/* Selected Transaction Summary */}
            {selectedCash && (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">পরিমাণ:</span>
                  <span className="font-mono font-bold text-rose-400">
                    ৳{Number(selectedCash.amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">বিবরণ:</span>
                  <span className="text-slate-200 truncate max-w-[220px]">
                    {selectedCash.type === "in"
                      ? selectedCash.source
                      : selectedCash.purpose || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">তারিখ:</span>
                  <span className="font-mono text-slate-300">{selectedCash.date}</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                বাতিলের কারণ (Reject Reason) <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="কেন লেনদেনটি বাতিল করছেন তা বিস্তারিত লিখুন..."
                rows={4}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none transition"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
              <button
                disabled={isSubmitting}
                onClick={() => {
                  setRejectModal(false);
                  setRejectReason("");
                  setSelectedCash(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition disabled:opacity-50"
              >
                ফিরে যান
              </button>

              <button
                disabled={!rejectReason.trim() || isSubmitting}
                onClick={handleReject}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "বাতিল হচ্ছে..." : "বাতিল নিশ্চিত করুন"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashReportApproved;
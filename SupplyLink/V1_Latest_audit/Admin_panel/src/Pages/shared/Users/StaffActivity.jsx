import React, { useState, useEffect, useCallback, useMemo } from "react";
import useUsers from "../../../utils/Hooks/useUsers";
import Loader from "../../../components/Loader/Loader";
import {
  Clock,
  User,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Coins,
  Shield,
  Smartphone,
  Monitor,
  Globe,
  FileText,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Eye,
  X
} from "lucide-react";

const money = (n) => `৳ ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getRoleBadge = (role) => {
  const r = String(role || "").toLowerCase();
  if (r.includes("admin")) return "bg-rose-500/15 text-rose-300 border-rose-500/30";
  if (r.includes("developer")) return "bg-purple-500/15 text-purple-300 border-purple-500/30";
  if (r.includes("manager")) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  if (r.includes("staff")) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (r.includes("data_entry")) return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
  return "bg-slate-500/15 text-slate-300 border-white/10";
};

const getActionIcon = (actionType, category) => {
  const a = String(actionType || "").toUpperCase();
  const c = String(category || "").toLowerCase();

  if (a.includes("INVEST")) {
    return <Coins className="w-4 h-4 text-emerald-400" />;
  }
  if (a.includes("INSTALLMENT")) {
    return <ArrowDownLeft className="w-4 h-4 text-cyan-400" />;
  }
  if (a.includes("CASH_IN")) {
    return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  }
  if (a.includes("CASH_OUT") || a.includes("EXPENSE")) {
    return <ArrowUpRight className="w-4 h-4 text-rose-400" />;
  }
  if (a.includes("LOGIN") || c === "auth") {
    return <Shield className="w-4 h-4 text-indigo-400" />;
  }
  if (c === "navigation" || a.includes("PAGE")) {
    return <Globe className="w-4 h-4 text-amber-400" />;
  }
  return <Clock className="w-4 h-4 text-slate-400" />;
};

export default function StaffActivity() {
  const { users = [], isUsersLoading } = useUsers();

  // Filter States
  const [selectedStaffId, setSelectedStaffId] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Data States
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState({
    total_actions: 0,
    total_financial_actions: 0,
    total_investments: 0,
    total_installments: 0,
    total_cash_out: 0
  });
  const [pagination, setPagination] = useState({
    total_records: 0,
    page: 1,
    limit: 50,
    total_pages: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [detailModal, setDetailModal] = useState(null);

  // Filter staff list (only staff, manager, data_entry, admin)
  const staffList = useMemo(() => {
    return users.filter((u) => {
      const raw = Array.isArray(u.roles) ? u.roles : [u.role || u.roles];
      const r = raw.map((x) => String(x).toLowerCase());
      return r.some((role) => ["staff", "manager", "data_entry", "admin", "developer"].includes(role));
    });
  }, [users]);

  // Fetch Activities API
  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        user_id: selectedStaffId,
        category: selectedCategory,
        date: selectedDate,
        page: String(currentPage),
        limit: String(pageSize)
      });

      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/users/get_staff_activities.php?${params.toString()}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities || []);
        setSummary(data.summary || {});
        setPagination(data.pagination || {});
      } else {
        setActivities([]);
      }
    } catch (e) {
      console.error("Activity fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStaffId, selectedCategory, selectedDate, currentPage, pageSize]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Filtered by Search Term
  const filteredActivities = useMemo(() => {
    if (!searchTerm.trim()) return activities;
    const q = searchTerm.toLowerCase();
    return activities.filter((a) => {
      const u = String(a.user_name || "").toLowerCase();
      const d = String(a.description || "").toLowerCase();
      const t = String(a.action_type || "").toLowerCase();
      const ip = String(a.ip_address || "").toLowerCase();
      return u.includes(q) || d.includes(q) || t.includes(q) || ip.includes(q);
    });
  }, [activities, searchTerm]);

  return (
    <div className="p-4 sm:p-6 text-white max-w-[1700px] mx-auto space-y-6">
      {/* 🔹 Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shadow-inner">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Staff Activity & Financial Audit</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-normal">
                Live Audit Trail
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              স্টাফদের দৈনিক কাজের সিসিটিভি অডিট টাইমলাইন, কিস্তি আদায়, ইনভেস্টমেন্ট এন্ট্রি ও পেজ নেভিগেশন
            </p>
          </div>
        </div>

        <button
          onClick={fetchActivities}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
          <span>রিলোড টাইমলাইন</span>
        </button>
      </div>

      {/* 🔹 Filter Controls Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0c1426]/75 p-4 rounded-2xl border border-white/[0.08] shadow-xl backdrop-blur-md">
        {/* Staff Selector */}
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>স্টাফ নির্বাচন:</span>
          </label>
          <select
            value={selectedStaffId}
            onChange={(e) => {
              setSelectedStaffId(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-medium"
          >
            <option value="all">সকল স্টাফ ও ম্যানেজার (All Staff)</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.full_name || `User #${s.id}`} ({Array.isArray(s.roles) ? s.roles.join(", ") : s.role})
              </option>
            ))}
          </select>
        </div>

        {/* Date Selector */}
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>তারিখ (Date):</span>
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* Category Filter */}
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>অ্যাকশন ক্যাটাগরি:</span>
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
          >
            <option value="all">সব কার্যক্রম (All Activities)</option>
            <option value="financial">অর্থনৈতিক লেনদেন (Financial Only)</option>
            <option value="navigation">পেজ ভিজিট (Navigation)</option>
            <option value="auth">লগইন ও সেশন (Auth Logs)</option>
            <option value="modification">এডিট ও ডিলিট (Modifications)</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span>খুঁজুন:</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="বিবরণ, নাম বা আইপি..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 🔹 KPI Summary Cards (Financial Impact of Staff on Selected Day) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0c1426]/80 p-4 shadow-lg backdrop-blur-md">
          <span className="text-xs text-slate-400 block">মোট অ্যাকশন সংখ্যা</span>
          <span className="text-xl font-black font-mono text-white mt-1 block">
            {summary.total_actions} টি
          </span>
          <span className="text-[11px] text-indigo-400 mt-0.5 block">
            ({summary.total_financial_actions} টি আর্থিক লেনদেন)
          </span>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0c1426]/80 p-4 shadow-lg backdrop-blur-md">
          <span className="text-xs text-slate-400 block">মোট ইনভেস্টমেন্ট এন্ট্রি</span>
          <span className="text-xl font-black font-mono text-emerald-400 mt-1 block truncate">
            {money(summary.total_investments)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            বিনিয়োগকারীদের থেকে সংগৃহীত
          </span>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0c1426]/80 p-4 shadow-lg backdrop-blur-md">
          <span className="text-xs text-slate-400 block">মোট কিস্তি আদায়</span>
          <span className="text-xl font-black font-mono text-cyan-400 mt-1 block truncate">
            {money(summary.total_installments)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            কাস্টমার কিস্তি কালেকশন
          </span>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0c1426]/80 p-4 shadow-lg backdrop-blur-md">
          <span className="text-xs text-slate-400 block">ক্যাশ আউট / খরচ</span>
          <span className="text-xl font-black font-mono text-rose-400 mt-1 block truncate">
            {money(summary.total_cash_out)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            উইথড্র বা অফিস ব্যয়
          </span>
        </div>
      </div>

      {/* 🔹 Visual Audit Timeline Feed */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c1426]/85 p-5 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              অ্যাক্টিভিটি টাইমলাইন ({filteredActivities.length} টি রেকর্ড)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            তারিখ: {selectedDate}
          </span>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader />
            <p className="text-xs text-slate-400 font-mono">অ্যাক্টিভিটি ডাটা লোড হচ্ছে...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
            <AlertTriangle className="w-10 h-10 text-slate-600" />
            <p className="text-sm font-medium">এই ফিল্টারে কোনো অ্যাক্টিভিটি পাওয়া যায়নি</p>
            <p className="text-xs text-slate-500">
              অন্য কোনো তারিখ বা স্টাফ নির্বাচন করে দেখুন।
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((act) => {
              const timeStr = act.created_at?.slice(11, 19) || "";
              const hasAmount = Number(act.amount || 0) > 0;

              return (
                <div
                  key={act.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.05] transition group"
                >
                  {/* Left: Icon, Staff & Description */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] shrink-0 mt-0.5 sm:mt-0">
                      {getActionIcon(act.action_type, act.category)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {act.user_name || `User #${act.user_id}`}
                        </span>
                        {act.user_role && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${getRoleBadge(act.user_role)}`}>
                            {act.user_role}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-white/[0.06]">
                          {timeStr}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {act.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1 font-mono">
                        {act.ip_address && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-slate-600" />
                            <span>IP: {act.ip_address}</span>
                          </span>
                        )}
                        {act.entity_type && (
                          <span className="text-slate-600">• Entity: {act.entity_type} {act.entity_id ? `#${act.entity_id}` : ""}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Details Button */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center pl-10 sm:pl-0">
                    {hasAmount && (
                      <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                        {money(act.amount)}
                      </span>
                    )}

                    {act.details && (
                      <button
                        onClick={() => setDetailModal(act)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                        title="অডিট পেলোড দেখুন"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08] text-xs">
            <span className="text-slate-400">
              রেকর্ড {activities.length} টি (মোট {pagination.total_records} টি)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isLoading}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                Previous
              </button>
              <span className="font-mono text-indigo-300 px-2 font-bold">
                {currentPage} / {pagination.total_pages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))}
                disabled={currentPage >= pagination.total_pages || isLoading}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🔹 Audit Details Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0F172A] rounded-2xl border border-white/10 p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>অ্যাক্টিভিটি অডিট ডাটা (Audit Payload)</span>
              </h3>
              <button
                onClick={() => setDetailModal(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1">
                <p className="text-slate-400">
                  <span className="font-semibold text-white">অ্যাকশন:</span> {detailModal.action_type} ({detailModal.category})
                </p>
                <p className="text-slate-400">
                  <span className="font-semibold text-white">স্টাফ:</span> {detailModal.user_name} ({detailModal.user_role})
                </p>
                <p className="text-slate-400">
                  <span className="font-semibold text-white">সময়:</span> {detailModal.created_at}
                </p>
                <p className="text-slate-400">
                  <span className="font-semibold text-white">IP:</span> {detailModal.ip_address}
                </p>
              </div>

              <span className="text-[11px] font-semibold text-slate-400 block pt-1">
                বিস্তারিত পেলোড (Raw Data):
              </span>
              <pre className="p-3.5 rounded-xl bg-black/60 border border-white/10 text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-64 scrollbar-thin">
                {JSON.stringify(detailModal.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

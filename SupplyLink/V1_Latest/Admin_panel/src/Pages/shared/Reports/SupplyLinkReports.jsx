import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  HardDrive,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  Shield,
  ArrowRight,
  X,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import Loader from "../../../components/Loader/Loader";

const SupplyLinkReports = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    totalCount: 0,
    totalSize: "0 KB",
    latestDate: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState("");

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEY}/cash/get_daily_reports_archive.php`
      );
      if (res.data?.success) {
        setReports(res.data.reports || []);
        setStats({
          totalCount: res.data.total_count || 0,
          totalSize: res.data.total_size || "0 KB",
          latestDate: res.data.latest_date || "",
        });
      }
    } catch (err) {
      console.error("Error fetching daily reports archive:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.file_name.toLowerCase().includes(q) ||
        r.date.toLowerCase().includes(q) ||
        r.formatted_date.toLowerCase().includes(q);

      const matchMonth =
        !selectedMonth || r.date.startsWith(selectedMonth);

      return matchSearch && matchMonth;
    });
  }, [reports, searchQuery, selectedMonth]);

  const handleOpenPreview = (report) => {
    setPreviewPdfUrl(report.file_url);
    setPreviewPdfTitle(`Daily Cash Ledger - ${report.formatted_date}`);
  };

  const handleDownload = (report) => {
    const link = document.createElement("a");
    link.href = report.file_url;
    link.download = report.file_name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 border border-white/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                SupplyLink Reports Archive
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                  Official PDF
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                সার্ভারে স্বয়ংক্রিয়ভাবে সংরক্ষিত সমস্ত দৈনিক ড্রাইভ ব্যাকআপ ও অডিট PDF রিপোর্ট
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchReports}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.08] transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>রিফ্রেশ</span>
          </button>

          <Link
            to="/today-report"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition active:scale-95"
          >
            <span>আজকের লাইভ রিপোর্ট</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-surface p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              মোট সংরক্ষিত রিপোর্ট
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">
              {stats.totalCount} টি
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">দৈনিক PDF আর্কাইভ</p>
          </div>
        </div>

        <div className="card-surface p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              সর্বশেষ রিপোর্ট
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-lg font-bold font-mono text-emerald-400 truncate block">
              {stats.latestDate || "N/A"}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">রাত ১১:৫৫ ক্রন ব্যাকআপ</p>
          </div>
        </div>

        <div className="card-surface p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              মোট ফাইল সাইজ
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-blue-400">
              {stats.totalSize}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">সার্ভার স্টোরেজ ব্যবহার</p>
          </div>
        </div>

        <div className="card-surface p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              অডিট ও এক্সেস
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-bold text-purple-300 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Full Audit Read-Only</span>
            </span>
            <p className="text-[11px] text-slate-400 mt-1">সব ইউজার ও অডিটর ভিউযোগ্য</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card-surface p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="তারিখ বা ফাইল খুঁজুন (e.g. 2026-10)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">মাস:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 transition"
            />
          </div>

          {(searchQuery || selectedMonth) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedMonth("");
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition"
            >
              রিসেট
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400">
          দেখানো হচ্ছে: <span className="font-bold text-white">{filteredReports.length}</span> টি রিপোর্ট
        </div>
      </div>

      {/* Reports Table */}
      <div className="card-surface rounded-2xl overflow-hidden border border-white/[0.08]">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] mx-auto flex items-center justify-center text-slate-500">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">কোনো রিপোর্ট পাওয়া যায়নি</p>
            <p className="text-xs text-slate-500">
              {searchQuery || selectedMonth
                ? "ফিল্টার শর্ত অনুযায়ী কোনো ফাইল মেলেনি।"
                : "সার্ভারে এখনো কোনো দৈনিক রিপোর্ট সংরক্ষিত হয়নি।"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.03] text-slate-400 uppercase text-[11px] tracking-wider border-b border-white/[0.08]">
                <tr>
                  <th className="py-3 px-4 text-center w-12 font-semibold">#</th>
                  <th className="py-3 px-4 font-semibold">তারিখ (Report Date)</th>
                  <th className="py-3 px-4 font-semibold">ফাইলের নাম</th>
                  <th className="py-3 px-4 font-semibold">সাইজ</th>
                  <th className="py-3 px-4 font-semibold">সংরক্ষিত সময়</th>
                  <th className="py-3 px-4 font-semibold">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-center font-semibold w-48">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredReports.map((report, idx) => (
                  <tr
                    key={report.file_name}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center text-slate-500 font-mono">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-white text-xs block">
                            {report.formatted_date}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {report.date}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[11px]">
                        <FileText className="w-3 h-3 text-rose-400" />
                        {report.file_name}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px]">
                      {report.formatted_size}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {report.modified_time}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        <CheckCircle className="w-2.5 h-2.5" />
                        Verified PDF
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(report)}
                          title="রিপোর্ট প্রিভিউ দেখুন"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>দেখুন</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownload(report)}
                          title="PDF ডাউনলোড করুন"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>ডাউনলোড</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🌟 Interactive PDF Preview Modal */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0b1329] border border-white/[0.12] rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {previewPdfTitle}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    SupplyLink Official Daily Cash Ledger Document
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-medium text-slate-200 hover:text-white transition"
                  title="নতুন ট্যাবে খুলুন"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">নতুন উইন্ডো</span>
                </a>

                <a
                  href={previewPdfUrl}
                  download
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 transition"
                  title="ডাউনলোড করুন"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ডাউনলোড</span>
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewPdfUrl(null)}
                  className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-white/[0.1] flex items-center justify-center transition"
                  title="বন্ধ করুন"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Embedded PDF View Frame */}
            <div className="flex-1 bg-slate-950/70 p-2 relative">
              <iframe
                src={`${previewPdfUrl}#toolbar=1`}
                title="Daily PDF Report Viewer"
                className="w-full h-full rounded-2xl border border-white/[0.06] bg-slate-900"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyLinkReports;


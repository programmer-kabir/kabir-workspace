import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DayalLoader from "../../components/Common/DayalLoader";
import {
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  User,
  CheckSquare,
  Square,
  Ban,
  UserX,
  UserCheck
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { authFetch } from "../../api/authFetch";

const BASE_URL = import.meta.env.VITE_LOCALHOST_KEY;
const IMG_BASE = import.meta.env.VITE_IMG_KEY || "https://api.dayalstock.com";

const UserReports = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, dismissed: 0 });
  const [loading, setLoading] = useState(true);

  // Pagination & Filter States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState("newest");
  const [search, setSearch] = useState("");

  // Bulk Selection & Modal
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/reports/get_user_reports.php?page=${page}&limit=${limit}&status=${statusFilter}&sort=${sortFilter}&search=${encodeURIComponent(search)}`;
      const res = await authFetch(url);
      const data = await res.json();

      if (data.success) {
        setReports(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        toast.error(data.message || "Failed to load user reports");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, limit, statusFilter, sortFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReports();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === reports.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reports.map((r) => r.id));
    }
  };

  const toggleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleReportAction = async (targetIds, status, actionTaken = "status_update") => {
    if (!targetIds || targetIds.length === 0) return;

    const confirm = await Swal.fire({
      title: "Confirm Action",
      text: `Are you sure you want to perform this action on ${targetIds.length} user report(s)?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#6C4FE0",
      cancelButtonColor: "#374151",
      confirmButtonText: "Yes, proceed",
      background: "#12121E",
      color: "#ffffff"
    });

    if (!confirm.isConfirmed) return;

    setActionLoading(true);
    try {
      const res = await authFetch(`${BASE_URL}/reports/update_user_report.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: targetIds,
          status,
          action_taken: actionTaken,
          admin_note: adminNote
        })
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "Action executed successfully!");
        Swal.fire({
          icon: "success",
          title: "Done!",
          text: data.message || "Action executed successfully",
          timer: 1800,
          showConfirmButton: false,
          background: "#12121E",
          color: "#ffffff"
        });
        setSelectedReport(null);
        setSelectedIds([]);
        setAdminNote("");
        fetchReports();
      } else {
        toast.error(data.message || "Failed to update report");
      }
    } catch (err) {
      toast.error("Error executing action");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="text-[#6C4FE0]" size={32} />
            User Reports
          </h1>
          <p className="text-gray-400">Review and investigate reports against contributor and user accounts.</p>
        </div>

        <button
          onClick={fetchReports}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 transition-all hover:bg-white/10 hover:text-white"
        >
          <RefreshCw size={16} className={loading ? "animate-spin text-[#6C4FE0]" : ""} />
          Refresh
        </button>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#12121E] border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total User Reports</p>
            <h3 className="text-2xl font-black text-white mt-1">{stats.total}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-[#12121E] border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Pending Review</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">{stats.pending}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-[#12121E] border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Resolved</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{stats.resolved}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="bg-[#12121E] border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Dismissed</p>
            <h3 className="text-2xl font-black text-gray-400 mt-1">{stats.dismissed}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gray-500/10 border border-gray-500/20 flex items-center justify-center text-gray-400">
            <XCircle size={22} />
          </div>
        </div>
      </div>

      {/* Filter, Search & Sort Toolbar */}
      <div className="bg-[#12121E] rounded-2xl border border-white/5 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 overflow-x-auto">
          {["all", "pending", "resolved", "dismissed"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${statusFilter === st
                  ? "bg-[#6C4FE0] text-white shadow-md"
                  : "text-gray-400 hover:text-white"
                }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search user, reporter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-[#6C4FE0]"
            />
          </form>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300">
            <ArrowUpDown size={14} className="text-gray-400" />
            <select
              value={sortFilter}
              onChange={(e) => {
                setSortFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-white outline-none text-xs"
            >
              <option value="newest" className="bg-[#12121E]">Newest First</option>
              <option value="oldest" className="bg-[#12121E]">Oldest First</option>
              <option value="pending_first" className="bg-[#12121E]">Pending First</option>
              <option value="most_reported" className="bg-[#12121E]">Most Reported First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Operations Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#6C4FE0]/10 border border-[#6C4FE0]/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <span className="text-sm font-semibold text-white">
            {selectedIds.length} user report(s) selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleReportAction(selectedIds, "resolved", "bulk_resolve")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
            >
              Bulk Resolve
            </button>
            <button
              onClick={() => handleReportAction(selectedIds, "dismissed", "bulk_dismiss")}
              className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
            >
              Bulk Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main User Reports Table */}
      <div className="bg-[#12121E] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <DayalLoader text="Loading user reports..." />
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <AlertTriangle size={36} className="mx-auto mb-2 text-amber-500/60" />
            <p className="text-base font-semibold text-white">No user reports found</p>
            <p className="text-xs text-gray-500">No reports match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-white/5 border-b border-white/10 text-xs uppercase text-gray-400">
                <tr>
                  <th className="px-4 py-4 w-10">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white">
                      {selectedIds.length === reports.length ? (
                        <CheckSquare size={18} className="text-[#6C4FE0]" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 font-medium tracking-wider">Reported User</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Reason</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Reporter</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Date</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                  <th className="px-6 py-4 font-medium tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reports.map((item) => {
                  const imgPath = item.target_user_photo;
                  const imgSrc = imgPath
                    ? imgPath.startsWith("http")
                      ? imgPath
                      : `${IMG_BASE}${imgPath.startsWith("/") ? "" : "/"}${imgPath}`
                    : null;

                  let statusBadge = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                  if (item.status === "resolved") {
                    statusBadge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                  } else if (item.status === "dismissed") {
                    statusBadge = "bg-gray-500/10 text-gray-400 border-gray-500/20";
                  }

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-4">
                        <button onClick={() => toggleSelectRow(item.id)} className="text-gray-400 hover:text-white">
                          {selectedIds.includes(item.id) ? (
                            <CheckSquare size={18} className="text-[#6C4FE0]" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#1a1a2e] overflow-hidden flex-shrink-0 border border-white/10 flex items-center justify-center text-emerald-400 font-bold text-sm">
                            {imgSrc ? (
                              <img src={imgSrc} alt={item.target_user_name || "User"} className="w-full h-full object-cover" />
                            ) : (
                              (item.target_user_name?.[0] || "U").toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <span className="font-semibold text-white truncate block">
                              {item.target_user_name || `User #${item.target_user_id}`}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span>@{item.target_user_username || "user"}</span>
                              {item.reports_count > 1 && (
                                <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  🔥 {item.reports_count} Reports
                                </span>
                              )}
                              {item.warning_count > 0 && (
                                <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  ⚠️ {item.warning_count} Warned
                                </span>
                              )}
                              {item.suspension_count > 0 && (
                                <span className="bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  ⛔ {item.suspension_count} Suspended
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {item.reason}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <span className="text-white font-medium block">{item.reporter_name || "Guest User"}</span>
                          <span className="text-xs text-gray-500 block">{item.reporter_email || "N/A"}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border capitalize ${statusBadge}`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedReport(item);
                            setAdminNote(item.admin_note || "");
                          }}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-[#6C4FE0] hover:text-white hover:border-[#6C4FE0] text-gray-300 transition-all shadow-md"
                          title="Review User Report"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-side Pagination Footer */}
        <div className="bg-white/5 p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-gray-400">
            Showing Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong> ({totalCount} total entries)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-xs font-bold text-white">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* User Investigation & Action Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121E] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="text-[#6C4FE0]" size={22} />
                  User Report #{selectedReport.id} Investigation
                </h3>
                <p className="text-xs text-gray-400">Submitted on {new Date(selectedReport.created_at).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Reported User Profile Summary */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#1a1a2e] overflow-hidden flex-shrink-0 border border-white/10 flex items-center justify-center text-emerald-400 font-bold text-lg">
                {selectedReport.target_user_photo ? (
                  <img
                    src={
                      selectedReport.target_user_photo.startsWith("http")
                        ? selectedReport.target_user_photo
                        : `${IMG_BASE}${selectedReport.target_user_photo.startsWith("/") ? "" : "/"}${selectedReport.target_user_photo}`
                    }
                    alt={selectedReport.target_user_name || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (selectedReport.target_user_name?.[0] || "U").toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-white truncate">{selectedReport.target_user_name || `User #${selectedReport.target_user_id}`}</h4>
                <p className="text-xs text-gray-400">@{selectedReport.target_user_username || "user"} • {selectedReport.target_user_email || "N/A"}</p>
                {selectedReport.reports_count > 1 && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">
                    🔥 {selectedReport.reports_count} Reports Against User
                  </span>
                )}
              </div>
            </div>

            {/* Report Details */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Reason</label>
                <span className="inline-block mt-1 px-3 py-1 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {selectedReport.reason}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Reporter Information</label>
                <p className="text-sm font-medium text-white">{selectedReport.reporter_name || "Guest"}</p>
                <p className="text-xs text-gray-400">{selectedReport.reporter_email || "N/A"}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Complaint Description</label>
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-sm text-gray-200 mt-1 leading-relaxed">
                  {selectedReport.description || "No additional description provided."}
                </div>
              </div>
            </div>

            {/* Audit Logs */}
            {selectedReport.reviewed_by_name && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs space-y-1">
                <p className="font-bold text-blue-300">Audit History</p>
                <p className="text-gray-300">
                  Reviewed by <strong>{selectedReport.reviewed_by_name}</strong> on {new Date(selectedReport.reviewed_at).toLocaleString()}
                </p>
                <p className="text-gray-400">Action: <span className="font-semibold text-white">{selectedReport.action_taken}</span></p>
              </div>
            )}

            {/* Admin Note Input */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Admin Notes</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Record investigative notes or warning reasons..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-[#6C4FE0] min-h-[80px]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-white/10">
              {selectedReport.action_taken === "suspend_user" && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleReportAction([selectedReport.id], "resolved", "unsuspend_user")}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  Unsuspend / Restore User
                </button>
              )}
              <button
                disabled={actionLoading}
                onClick={() => handleReportAction([selectedReport.id], "dismissed", "dismiss_report")}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                Dismiss Report
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleReportAction([selectedReport.id], "resolved", "warn_user")}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                Warn User & Resolve
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleReportAction([selectedReport.id], "resolved", "suspend_user")}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                Suspend User Account
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleReportAction([selectedReport.id], "resolved", "ban_user")}
                className="bg-red-950 border border-red-500/50 hover:bg-red-900 text-red-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-md"
              >
                Permanently Ban User
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleReportAction([selectedReport.id], "resolved", "resolve_report")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                Resolve Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserReports;

import React, { useState, useEffect } from "react";
import DayalLoader from "../../components/Common/DayalLoader";
import {
  Mail,
  Search,
  RefreshCw,
  Eye,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  UserX,
  FileText,
  XCircle,
  Clock,
  User,
  ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";
import { authFetch } from "../../api/authFetch";

const BASE_URL = import.meta.env.VITE_LOCALHOST_KEY;

const EmailLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, warning: 0, suspension: 0, content_removal: 0 });
  const [loading, setLoading] = useState(true);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modal Preview
  const [selectedMail, setSelectedMail] = useState(null);

  const fetchEmailLogs = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/reports/get_email_logs.php?page=${page}&limit=${limit}&type=${typeFilter}&search=${encodeURIComponent(search)}`;
      const res = await authFetch(url);
      const data = await res.json();

      if (data.success) {
        setLogs(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        toast.error(data.message || "Failed to load email logs");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailLogs();
  }, [page, limit, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEmailLogs();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Mail className="text-[#6C4FE0]" size={32} />
            Sent Email Audit Logs
          </h1>
          <p className="text-gray-400">Track and view all official email communications and warnings sent to platform users.</p>
        </div>

        <button
          onClick={fetchEmailLogs}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 transition-all hover:bg-white/10 hover:text-white"
        >
          <RefreshCw size={16} className={loading ? "animate-spin text-[#6C4FE0]" : ""} />
          Refresh Logs
        </button>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#12121E] border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Emails Sent</p>
            <h3 className="text-2xl font-black text-white mt-1">{stats.total}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Send size={22} />
          </div>
        </div>

        <div className="bg-[#12121E] border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Policy Warnings</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">{stats.warning}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="bg-[#12121E] border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Suspension Notices</p>
            <h3 className="text-2xl font-black text-red-400 mt-1">{stats.suspension}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <UserX size={22} />
          </div>
        </div>

        <div className="bg-[#12121E] border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Asset Removal Notices</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{stats.content_removal}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FileText size={22} />
          </div>
        </div>
      </div>

      {/* Toolbar: Filters & Search */}
      <div className="bg-[#12121E] rounded-2xl border border-white/5 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 overflow-x-auto">
          {[
            { id: "all", label: "All Logs" },
            { id: "warning", label: "Warnings" },
            { id: "suspension", label: "Suspensions" },
            { id: "content_unpublished", label: "Asset Removals" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setTypeFilter(item.id);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                typeFilter === item.id
                  ? "bg-[#6C4FE0] text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search email, name, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-[#6C4FE0]"
          />
        </form>
      </div>

      {/* Email Audit Logs Table */}
      <div className="bg-[#12121E] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <DayalLoader text="Fetching email audit history..." />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Mail size={36} className="mx-auto mb-2 text-gray-500" />
            <p className="text-base font-semibold text-white">No email logs found</p>
            <p className="text-xs text-gray-500">Emails sent for warnings, suspensions or asset removals will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-white/5 border-b border-white/10 text-xs uppercase text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-medium tracking-wider">Recipient</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Email Type</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Subject</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Sent By</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 font-medium tracking-wider text-right">View Mail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((item) => {
                  let badgeStyle = "bg-purple-500/10 text-purple-300 border-purple-500/20";
                  if (item.email_type === "warning") {
                    badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                  } else if (item.email_type === "suspension") {
                    badgeStyle = "bg-red-500/10 text-red-400 border-red-500/20";
                  } else if (item.email_type === "content_unpublished" || item.email_type === "content_removal") {
                    badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                  }

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-semibold text-white block">{item.recipient_name || "User"}</span>
                          <span className="text-xs text-gray-400 block">{item.recipient_email}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border capitalize ${badgeStyle}`}>
                          {item.email_type}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-white font-medium block truncate max-w-xs">{item.subject}</span>
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-300">
                        {item.sent_by_name || "System Admin"}
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedMail(item)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-[#6C4FE0] hover:text-white hover:border-[#6C4FE0] text-gray-300 transition-all shadow-md"
                          title="Preview Email Content"
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

      {/* Email Letter Preview Modal */}
      {selectedMail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121E] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Mail className="text-[#6C4FE0]" size={22} />
                  Email Copy Audit #{selectedMail.id}
                </h3>
                <p className="text-xs text-gray-400">Dispatched on {new Date(selectedMail.created_at).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedMail(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Email Headers */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">To Recipient:</span>
                <span className="text-white font-bold">{selectedMail.recipient_name} &lt;{selectedMail.recipient_email}&gt;</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Subject:</span>
                <span className="text-white font-bold">{selectedMail.subject}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Sent By Admin:</span>
                <span className="text-gray-300">{selectedMail.sent_by_name || "System Admin"}</span>
              </div>
            </div>

            {/* Rendered Email Card Preview */}
            <div className="bg-white text-gray-900 rounded-2xl p-6 shadow-xl space-y-4 font-sans">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-black text-[#00D4FF] tracking-tight">PikSea</h2>
                <h4 className="text-base font-bold text-gray-800 mt-1">{selectedMail.message_title || selectedMail.subject}</h4>
              </div>

              <div className="space-y-3 text-sm leading-relaxed text-gray-700">
                <p>Dear <strong>{selectedMail.recipient_name}</strong>,</p>
                <p className="whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-200 font-medium text-gray-800">
                  {selectedMail.message_body}
                </p>
              </div>

              <div className="border-t pt-4 text-center text-xs text-gray-400">
                &copy; {new Date().getFullYear()} PikSea. All rights reserved.<br />
                Official communication dispatched via PikSea Compliance Desk.
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedMail(null)}
                className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailLogs;

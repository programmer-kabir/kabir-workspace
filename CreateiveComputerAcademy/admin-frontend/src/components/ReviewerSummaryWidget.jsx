import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  FiUserCheck, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle, 
  FiArrowUpRight, 
  FiRefreshCw, 
  FiUsers, 
  FiLayers, 
  FiShoppingCart,
  FiActivity,
  FiInbox
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const ReviewerSummaryWidget = () => {
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviewerSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/';
      const cleanBase = apiBase.endsWith('/') ? apiBase : `${apiBase}/`;
      const res = await axios.get(`${cleanBase}api/admin/dashboard/get_reviewer_summary_widget.php`);
      if (res.data.status === 'success') {
        setReviewers(res.data.data || []);
      } else {
        setError(res.data.message || 'Failed to fetch reviewer summary');
      }
    } catch (err) {
      console.error('Failed to fetch reviewer summary widget', err);
      setError('Failed to connect to the reviewer summary API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewerSummary();
  }, []);

  const apiBase = import.meta.env.VITE_API_BASE_URL || '/';
  const cleanBase = apiBase.endsWith('/') ? apiBase : `${apiBase}/`;

  // Aggregate stats across all reviewers
  const totalStats = reviewers.reduce(
    (acc, rev) => {
      const s = rev.stats || {};
      acc.total_received += s.total_received || 0;
      acc.completed += s.completed || 0;
      acc.in_review += s.in_review || 0;
      acc.rejected += s.rejected || 0;
      acc.today_received += s.today_received || 0;
      acc.today_reviewed += s.today_reviewed || 0;
      acc.market_uploads += s.market_uploads || 0;
      acc.total_team_members += rev.team_size || 0;
      return acc;
    },
    {
      total_received: 0,
      completed: 0,
      in_review: 0,
      rejected: 0,
      today_received: 0,
      today_reviewed: 0,
      market_uploads: 0,
      total_team_members: 0,
    }
  );

  return (
    <div className="bg-white dark:bg-slate-800/95 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-6">
      
      {/* ── Widget Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <FiUserCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Reviewer Performance & QA Oversight
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {reviewers.length} Reviewers
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Real-time submission pipeline, verification turnaround, and team delivery audits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchReviewerSummary}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-600 text-xs font-bold shrink-0 disabled:opacity-50"
            title="Refresh Reviewer Data"
          >
            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <Link
            to="/reviewer-report"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs transition-all border border-indigo-200/80 dark:border-indigo-800/60 shrink-0"
          >
            <span>Full QA Report</span>
            <FiArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── Aggregated Overview Quick Pills ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <FiUsers size={12} className="text-blue-500" /> Supervised
          </span>
          <p className="text-xl font-black text-slate-800 dark:text-white mt-0.5">
            {totalStats.total_team_members} <span className="text-[10px] font-semibold text-slate-400">staff</span>
          </p>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <FiInbox size={12} className="text-indigo-500" /> Today Received
          </span>
          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
            {totalStats.today_received}
          </p>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <FiActivity size={12} className="text-cyan-500" /> Today Reviewed
          </span>
          <p className="text-xl font-black text-cyan-600 dark:text-cyan-400 mt-0.5">
            {totalStats.today_reviewed}
          </p>
        </div>

        <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
          <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block flex items-center gap-1">
            <FiClock size={12} /> In Review Queue
          </span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
            {totalStats.in_review}
          </p>
        </div>

        <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40">
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
            <FiCheckCircle size={12} /> Approved
          </span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {totalStats.completed}
          </p>
        </div>

        <div className="p-3 bg-purple-50/60 dark:bg-purple-950/20 rounded-2xl border border-purple-200/60 dark:border-purple-900/40">
          <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider block flex items-center gap-1">
            <FiShoppingCart size={12} /> Market Submissions
          </span>
          <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
            {totalStats.market_uploads}
          </p>
        </div>
      </div>

      {/* ── Reviewers List / Cards Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-1/2" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-center">
          <FiXCircle size={28} className="mx-auto text-rose-500 mb-2" />
          <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{error}</p>
          <button
            type="button"
            onClick={fetchReviewerSummary}
            className="mt-3 px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-all shadow-xs"
          >
            Retry Connection
          </button>
        </div>
      ) : reviewers.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 text-slate-400">
          <FiUserCheck size={36} className="mx-auto mb-2 opacity-30 text-indigo-400" />
          <p className="text-sm font-semibold">No active reviewers assigned yet</p>
          <p className="text-xs mt-1">Assign reviewer role in the staff directory to view real-time audit stats.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5 pt-1">
          {reviewers.map((rev) => {
            const s = rev.stats || {
              total_received: 0,
              completed: 0,
              in_review: 0,
              rejected: 0,
              today_received: 0,
              today_reviewed: 0,
              market_uploads: 0,
            };

            const reviewedSum = s.completed + s.rejected;
            const approvalRate = reviewedSum > 0 ? Math.round((s.completed / reviewedSum) * 100) : 0;
            const avatarUrl = rev.profile_picture ? `${cleanBase}${rev.profile_picture}` : null;

            return (
              <motion.div
                key={rev.id}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="group relative bg-white dark:bg-slate-900/70 hover:bg-slate-50/80 dark:hover:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-xs hover:shadow-lg hover:shadow-indigo-500/5 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Reviewer Header & Profile */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-base shadow-sm overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={rev.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span>{rev.name?.charAt(0)?.toUpperCase() || 'R'}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-black text-slate-900 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {rev.name}
                          </h4>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-400 truncate">
                          {rev.designation} • <span className="text-indigo-600 dark:text-indigo-400">{rev.department_name}</span>
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 shrink-0">
                      <FiUsers size={11} /> {rev.team_size} Team
                    </span>
                  </div>

                  {/* Today's Activity Bar */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 mb-3.5 text-xs font-bold">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Today:
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {s.today_received} Rec
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {s.today_reviewed} Reviewed
                      </span>
                    </div>
                  </div>

                  {/* 4 Mini Stat Blocks */}
                  <div className="grid grid-cols-4 gap-2 mb-3.5 text-center">
                    <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                      <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 uppercase block">Pending</span>
                      <span className="text-base font-black text-amber-700 dark:text-amber-300">{s.in_review}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                      <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase block">Approved</span>
                      <span className="text-base font-black text-emerald-700 dark:text-emerald-300">{s.completed}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
                      <span className="text-[9px] font-extrabold text-rose-600 dark:text-rose-400 uppercase block">Rejected</span>
                      <span className="text-base font-black text-rose-700 dark:text-rose-300">{s.rejected}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40">
                      <span className="text-[9px] font-extrabold text-purple-600 dark:text-purple-400 uppercase block">Market</span>
                      <span className="text-base font-black text-purple-700 dark:text-purple-300">{s.market_uploads}</span>
                    </div>
                  </div>

                  {/* Quality Approval Ratio Bar */}
                  <div className="space-y-1.5 mb-2">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-400">Approval Rate</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{approvalRate}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                        style={{ width: `${approvalRate}%` }}
                      />
                      <div
                        className="h-full bg-rose-400 transition-all duration-700"
                        style={{ width: `${100 - approvalRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer Link */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Total Pipeline: <strong className="text-slate-700 dark:text-slate-200 font-bold">{s.total_received}</strong>
                  </span>
                  <Link
                    to="/reviewer-report"
                    className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>View Analytics</span>
                    <FiArrowUpRight size={14} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReviewerSummaryWidget;

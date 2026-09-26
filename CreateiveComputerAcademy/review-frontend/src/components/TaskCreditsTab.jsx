import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiDollarSign, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock, 
  FiUser, 
  FiShield, 
  FiRefreshCw, 
  FiAward, 
  FiAlertCircle,
  FiArrowUpRight,
  FiArrowDownRight
} from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const fmtDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return dateStr;
  }
};

const TaskCreditsTab = ({ task }) => {
  const taskId = task?.task_id || task?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCredits = async () => {
    if (!taskId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}api/tasks/get_task_credits.php?task_id=${taskId}`);
      if (res.data.status === 'success') {
        setData(res.data.data);
      } else {
        setError(res.data.message || 'Failed to load credits');
      }
    } catch (err) {
      console.error('Error fetching task credits:', err);
      setError('Could not connect to credits server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [taskId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse py-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-28 rounded-2xl bg-slate-100 dark:bg-dark-800" />
          <div className="h-28 rounded-2xl bg-slate-100 dark:bg-dark-800" />
          <div className="h-28 rounded-2xl bg-slate-100 dark:bg-dark-800" />
        </div>
        <div className="h-64 rounded-2xl bg-slate-100 dark:bg-dark-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 text-center space-y-3">
        <FiAlertCircle size={28} className="text-rose-600 dark:text-rose-400 mx-auto" />
        <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
        <button
          onClick={fetchCredits}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition-all cursor-pointer shadow-xs"
        >
          <FiRefreshCw size={13} /> Retry Loading
        </button>
      </div>
    );
  }

  const staff = data?.staff || {};
  const reviewer = data?.reviewer || {};
  const transactions = data?.transactions || [];
  const baseCredit = data?.base_credit || task?.credit || 5;
  const rejectionCount = data?.rejection_count || 0;

  return (
    <div className="space-y-6 animate-fade-in pb-4">
      {/* ── 3 Summary KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: Staff Net Earnings */}
        <div className="p-5 rounded-2xl bg-[#ffffff] dark:bg-dark-900 border border-slate-200 dark:border-white/10 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white/60 flex items-center gap-1.5">
              <FiUser size={13} className="text-emerald-500" />
              Staff Net Credits
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
              {task?.status || data?.task_status}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className={`text-2xl lg:text-3xl font-black ${
              staff.net_credits >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {staff.net_credits > 0 ? `+${staff.net_credits}` : staff.net_credits}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-white/50">Credits</span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-white/70">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <FiArrowUpRight size={13} /> +{staff.rewards_earned || 0} Reward
            </span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <FiArrowDownRight size={13} /> -{staff.penalties_deducted || 0} Penalty
            </span>
          </div>
        </div>

        {/* Card 2: Reviewer QA Total Earnings */}
        <div className="p-5 rounded-2xl bg-[#ffffff] dark:bg-dark-900 border border-slate-200 dark:border-white/10 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white/60 flex items-center gap-1.5">
              <FiShield size={13} className="text-amber-500" />
              Reviewer QA Credits
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
              Quality Audit
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black text-amber-600 dark:text-amber-400">
              +{reviewer.total_qa_credits || 0}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-white/50">QA Credits</span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-white/70">
            <span>
              {rejectionCount > 0 ? `${rejectionCount} Rejection Audit` : 'Initial Review'}
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              +1 per review step
            </span>
          </div>
        </div>

        {/* Card 3: Base Standard Credit */}
        <div className="p-5 rounded-2xl bg-[#ffffff] dark:bg-dark-900 border border-slate-200 dark:border-white/10 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-white/60 flex items-center gap-1.5">
              <FaCoins size={12} className="text-brand-500" />
              Task Standard Value
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30">
              Category Base
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black text-brand-600 dark:text-brand-400">
              {baseCredit}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-white/50">Max Reward</span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-white/70">
            <span>Standard Completion</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% On Pass</span>
          </div>
        </div>

      </div>

      {/* ── Transaction Ledger / Events Table ── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#ffffff] dark:bg-dark-900 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <FaCoins size={14} />
            </span>
            <span>Task Credit Activity & Audit Ledger</span>
          </h3>
          <span className="text-xs font-bold text-slate-500 dark:text-white/50">
            {transactions.length > 0 ? `${transactions.length} Recorded Transactions` : 'Calculated Lifecycle Ledger'}
          </span>
        </div>

        {transactions.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-white/5 overflow-x-auto">
            {transactions.map((tx) => {
              const isPositive = parseFloat(tx.amount) >= 0;
              const isReviewer = tx.type?.startsWith('reviewer_');
              return (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                      isPositive
                        ? isReviewer
                          ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                          : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                        : 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                    }`}>
                      {isPositive ? (isReviewer ? <FiShield size={16} /> : <FiAward size={16} />) : <FiXCircle size={16} />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {tx.description || tx.type}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          isReviewer
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : isPositive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        }`}>
                          {isReviewer ? 'Reviewer QA' : isPositive ? 'Staff Reward' : 'Staff Penalty'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-white/50 mt-1">
                        <span className="font-medium text-slate-700 dark:text-white/80">{tx.user_name || 'User'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><FiClock size={11} /> {fmtDate(tx.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-sm lg:text-base font-black px-2.5 py-1 rounded-xl border ${
                      isPositive
                        ? isReviewer
                          ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                          : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                        : 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                    }`}>
                      {isPositive ? `+${tx.amount}` : tx.amount} Credits
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Lifecycle Derived Ledger when transactions were not explicitly stored in credit_transactions table */
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200/80 dark:border-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="p-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <FiAward size={15} />
                </span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Base Task Completion Reward</p>
                  <p className="text-[11px] text-slate-500 dark:text-white/50">Allocated upon final approval</p>
                </div>
              </div>
              <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                +{baseCredit} Credits
              </span>
            </div>

            {rejectionCount > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="p-1 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
                    <FiXCircle size={15} />
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Rejection Penalty Deductions ({rejectionCount}x)</p>
                    <p className="text-[11px] text-slate-500 dark:text-white/50">-1 Credit applied per rejection cycle</p>
                  </div>
                </div>
                <span className="font-black text-rose-600 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-500/15 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-500/30">
                  -{rejectionCount} Credits
                </span>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="p-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <FiShield size={15} />
                </span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Reviewer QA Compensation</p>
                  <p className="text-[11px] text-slate-500 dark:text-white/50">
                    {rejectionCount > 0 
                      ? `${rejectionCount} Rejection QA (+${rejectionCount}) + Final Approval QA (+1)` 
                      : 'Review & Quality Assurance Reward'}
                  </p>
                </div>
              </div>
              <span className="font-black text-amber-600 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-500/30">
                +{reviewer.total_qa_credits || (rejectionCount + 1)} QA Credits
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCreditsTab;

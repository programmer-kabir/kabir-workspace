import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  FiPlus, FiTrash2, FiExternalLink, FiCheck, FiX,
  FiRefreshCw, FiEdit2, FiCalendar, FiGlobe, FiLayers,
  FiArrowUpRight, FiClock, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi';
import CustomSelect from './CustomSelect';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const MARKETPLACES = [
  'Dayal Stock', 'Shutterstock', 'Freepik', 'Dreamstime', 'Adobe Stock',
  'Pond5', '123RF', 'Getty Images', 'Alamy', 'iStock', 'Vecteezy', 'Custom'
];

const STATUS_CONFIG = {
  pending: {
    label: 'Pending (In Review)',
    color: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30',
    dot: 'bg-amber-500 animate-pulse',
    icon: FiClock,
  },
  approved: {
    label: 'Approved',
    color: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
    dot: 'bg-emerald-500',
    icon: FiCheckCircle,
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30',
    dot: 'bg-red-500',
    icon: FiAlertCircle,
  },
  resubmitted: {
    label: 'Resubmitted',
    color: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/30',
    dot: 'bg-blue-500',
    icon: FiRefreshCw,
  },
  uploaded: {
    label: 'Uploaded',
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-500',
    icon: FiLayers,
  },
};

const MARKET_COLORS = {
  'Dayal Stock':  'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 font-black',
  'Shutterstock': 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30 font-bold',
  'Freepik':      'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 font-bold',
  'Dreamstime':   'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 font-bold',
  'Adobe Stock':  'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30 font-bold',
  'Pond5':        'bg-stone-50 dark:bg-stone-500/10 text-stone-700 dark:text-stone-400 border-stone-200 dark:border-stone-500/30 font-bold',
  '123RF':        'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30 font-bold',
  'Getty Images': 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-500/30 font-bold',
  'Alamy':        'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/30 font-bold',
  'iStock':       'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30 font-bold',
  'Vecteezy':     'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30 font-bold',
  'Custom':       'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/30 font-bold',
};

const MARKETPLACE_OPTIONS = MARKETPLACES.map(m => ({
  value: m,
  label: m,
  colorClass: MARKET_COLORS[m] || 'bg-slate-100 text-slate-700 border-slate-200'
}));

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pending (In Review)', dot: 'bg-amber-500 animate-pulse' },
  { value: 'approved',    label: 'Approved',            dot: 'bg-emerald-500' },
  { value: 'rejected',    label: 'Rejected',            dot: 'bg-red-500' },
  { value: 'resubmitted', label: 'Resubmitted',         dot: 'bg-blue-500' },
];

function getMarketDisplay(entry) {
  return (entry.marketplace === 'Custom' && entry.custom_market)
    ? entry.custom_market : entry.marketplace;
}

function getMarketCreditBadge(entry) {
  const isDayal = (entry.marketplace || '').toLowerCase() === 'dayal stock';
  if (isDayal) {
    return {
      text: '+1 Credit',
      color: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
    };
  }
  if (entry.status === 'approved') {
    return {
      text: '+3 Credits',
      color: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
    };
  }
  if (entry.status === 'rejected') {
    return {
      text: '0 Credit',
      color: 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30'
    };
  }
  return {
    text: '+1 Credit',
    color: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30'
  };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatLogTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T'));
  if (isNaN(d)) return dateStr;
  return d.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const MarketplaceSubmissions = ({ taskId, userId, employeeId, addedBy, addedByRole, canManage = false }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Logs state
  const [expandedLogsId, setExpandedLogsId] = useState(null);
  const [logsMap, setLogsMap]               = useState({});
  const [loadingLogsMap, setLoadingLogsMap] = useState({});

  // Add form state
  const [newMarket, setNewMarket]   = useState('Dayal Stock');
  const [newCustom, setNewCustom]   = useState('');
  const [newStatus, setNewStatus]   = useState('pending');
  const [newDate, setNewDate]       = useState(new Date().toISOString().split('T')[0]);
  const [adding, setAdding]         = useState(false);

  // Edit state
  const [editStatus, setEditStatus] = useState('');
  const [editUrl, setEditUrl]       = useState('');
  const [editReason, setEditReason] = useState('');
  const [saving, setSaving]         = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchSubmissions = useCallback(async () => {
    if (!taskId) return;
    try {
      const res = await axios.post(`${API_BASE}api/tasks/marketplace_submissions.php`, {
        action: 'get', task_id: taskId
      });
      if (res.data?.status === 'success') {
        const list = res.data.data || res.data.submissions || [];
        setSubmissions(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.error('Marketplace fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // ── Fetch submission logs ─────────────────────────────────────────────────
  const toggleLogs = async (submissionId) => {
    if (expandedLogsId === submissionId) {
      setExpandedLogsId(null);
      return;
    }
    setExpandedLogsId(submissionId);
    if (!logsMap[submissionId]) {
      setLoadingLogsMap(prev => ({ ...prev, [submissionId]: true }));
      try {
        const res = await axios.post(`${API_BASE}api/tasks/marketplace_submissions.php`, {
          action: 'get_logs', submission_id: submissionId
        });
        const list = res.data?.data || res.data?.logs || [];
        setLogsMap(prev => ({ ...prev, [submissionId]: list }));
      } catch (e) {
        console.error('Fetch logs error:', e);
      } finally {
        setLoadingLogsMap(prev => ({ ...prev, [submissionId]: false }));
      }
    }
  };

  // ── Add ──────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!taskId) return;
    setAdding(true);
    try {
      const payload = {
        action: 'add',
        task_id: taskId,
        user_id: userId || employeeId,
        added_by: addedBy,
        added_by_role: addedByRole,
        marketplace: newMarket,
        custom_market: newMarket === 'Custom' ? newCustom : null,
        status: newStatus,
        submitted_date: newDate,
      };
      const res = await axios.post(`${API_BASE}api/tasks/marketplace_submissions.php`, payload);
      if (res.data?.status === 'success') {
        setNewMarket('Dayal Stock');
        setNewCustom('');
        setNewStatus('pending');
        setNewDate(new Date().toISOString().split('T')[0]);
        setShowAddForm(false);
        window.dispatchEvent(new Event('credit-updated'));
        await fetchSubmissions();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  // ── Start editing ─────────────────────────────────────────────────────────
  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditStatus(entry.status);
    setEditUrl(entry.approval_url || '');
    setEditReason(entry.reject_reason || '');
  };

  // ── Save edit ─────────────────────────────────────────────────────────────
  const handleSave = async (entry) => {
    setSaving(true);
    try {
      await axios.post(`${API_BASE}api/tasks/marketplace_submissions.php`, {
        action: 'update',
        id: entry.id,
        updated_by: addedBy,
        status: editStatus,
        approval_url: editStatus === 'approved' ? editUrl : null,
        reject_reason: editStatus === 'rejected' ? editReason : null,
      });
      setEditingId(null);
      window.dispatchEvent(new Event('credit-updated'));
      await fetchSubmissions();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await axios.post(`${API_BASE}api/tasks/marketplace_submissions.php`, {
        action: 'delete', id, deleted_by: addedBy
      });
      window.dispatchEvent(new Event('credit-updated'));
      await fetchSubmissions();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Loading Skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
        <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header Bar ── */}
      <div className="flex items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-xl shadow-xs">
            📦
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h4 className="font-black text-sm lg:text-base text-slate-900 dark:text-slate-100 tracking-tight">
                Marketplace Submissions
              </h4>
              {submissions.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-black">
                  {submissions.length}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Track stock marketplace submission links, approvals and rejection reasons
            </p>
          </div>
        </div>

        {canManage && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white text-xs lg:text-sm font-bold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
          >
            <FiPlus size={16} /> Add Market
          </button>
        )}
      </div>

      {/* ── Luxury Add Form ── */}
      {canManage && showAddForm && (
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-[#11192e] border border-slate-200 dark:border-indigo-500/30 shadow-md space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Subtle Top Accent Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
              <p className="text-xs lg:text-sm font-black text-slate-900 dark:text-indigo-300 uppercase tracking-wider">
                New Submission Record
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <FiX size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <FiGlobe size={13} className="text-indigo-600 dark:text-indigo-400" /> Marketplace Platform
              </label>
              <CustomSelect
                value={newMarket}
                onChange={setNewMarket}
                options={MARKETPLACE_OPTIONS}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <FiClock size={13} className="text-amber-600 dark:text-amber-400" /> Initial Status
              </label>
              <CustomSelect
                value={newStatus}
                onChange={setNewStatus}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>

          {newMarket === 'Custom' && (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                Custom Marketplace Name
              </label>
              <input
                type="text"
                placeholder="e.g. GraphicRiver, CreativeMarket..."
                value={newCustom}
                onChange={e => setNewCustom(e.target.value)}
                className="w-full bg-[#ffffff] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs lg:text-sm font-semibold placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-xs"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <FiCalendar size={13} className="text-blue-600 dark:text-blue-400" /> Submission Date
            </label>
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="w-full sm:w-64 bg-[#ffffff] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs lg:text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-xs [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleAdd}
              disabled={adding || (newMarket === 'Custom' && !newCustom)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs lg:text-sm font-black transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20"
            >
              {adding ? <FiRefreshCw size={14} className="animate-spin" /> : <FiPlus size={15} />}
              {adding ? 'Saving...' : 'Add Submission'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs lg:text-sm font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {submissions.length === 0 ? (
        <div className="py-12 px-6 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 text-center space-y-3 transition-all">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-100/70 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-2xl shadow-xs">
            📦
          </div>
          <div>
            <p className="text-sm lg:text-base font-black text-slate-800 dark:text-slate-100">
              No Marketplace Submissions Yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Track when this asset gets submitted to Dayal Stock, Shutterstock, Freepik, Adobe Stock, and verify approved live links.
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm transition-all active:scale-95 cursor-pointer mt-1"
            >
              <FiPlus size={14} /> Add First Market
            </button>
          )}
        </div>
      ) : (
        /* ── Submission Cards List ── */
        <div className="space-y-3.5">
          {submissions.map(entry => {
            const displayName = getMarketDisplay(entry);
            const statusCfg   = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending;
            const marketColor = MARKET_COLORS[entry.marketplace] || 'bg-slate-100 text-slate-700 border-slate-200';
            const creditBadge = getMarketCreditBadge(entry);
            const isEditing   = editingId === entry.id;

            return (
              <div
                key={entry.id}
                className="group relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-[#ffffff] dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500/40 shadow-xs hover:shadow-md transition-all duration-300 space-y-3"
              >
                {/* ── Card Header ── */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                    <span className={`px-3 py-1 rounded-xl border text-xs font-extrabold shrink-0 shadow-xs ${marketColor}`}>
                      {displayName}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.color}`}>
                      <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border ${creditBadge.color}`}>
                      <span>🪙 {creditBadge.text}</span>
                    </span>
                  </div>

                  {canManage && !isEditing && (
                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(entry)}
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all cursor-pointer"
                        title="Edit status"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-40"
                        title="Delete"
                      >
                        {deletingId === entry.id
                          ? <FiRefreshCw size={14} className="animate-spin" />
                          : <FiTrash2 size={14} />
                        }
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Submission Date ── */}
                {entry.submitted_date && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                    <FiCalendar size={13} className="text-slate-400 dark:text-slate-500" />
                    Submitted on: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(entry.submitted_date)}</span>
                  </p>
                )}

                {/* ── Approved: Live Marketplace Link ── */}
                {entry.status === 'approved' && entry.approval_url && !isEditing && (
                  <div className="pt-1">
                    <a
                      href={entry.approval_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 transition-all active:scale-95 group/link"
                    >
                      <span>View Live on {displayName}</span>
                      <FiArrowUpRight size={15} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                    </a>
                  </div>
                )}

                {/* ── Rejected: Reason Callout ── */}
                {entry.status === 'rejected' && entry.reject_reason && !isEditing && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 space-y-1">
                    <p className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
                      <FiAlertCircle size={11} /> Rejection Reason
                    </p>
                    <p className="text-xs lg:text-sm text-red-900 dark:text-red-300 font-medium leading-relaxed">
                      "{entry.reject_reason}"
                    </p>
                  </div>
                )}

                {/* ── Edit Panel (Admin/Reviewer) ── */}
                {isEditing && canManage && (
                  <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                        Update Submission Status
                      </label>
                      <CustomSelect
                        value={editStatus}
                        onChange={setEditStatus}
                        options={STATUS_OPTIONS}
                      />
                    </div>

                    {editStatus === 'approved' && (
                      <div>
                        <label className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                          <FiExternalLink size={13} /> Live Approved URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://www.shutterstock.com/image-vector/..."
                          value={editUrl}
                          onChange={e => setEditUrl(e.target.value)}
                          className="w-full bg-[#ffffff] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 border border-emerald-400/60 rounded-xl px-4 py-2.5 text-xs lg:text-sm font-mono placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-xs"
                        />
                      </div>
                    )}

                    {editStatus === 'rejected' && (
                      <div>
                        <label className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                          <FiAlertCircle size={13} /> Reason for Rejection
                        </label>
                        <textarea
                          placeholder="Explain why the market rejected this asset (e.g. metadata issue, rasterization artifacts, etc.)..."
                          value={editReason}
                          onChange={e => setEditReason(e.target.value)}
                          rows={2}
                          className="w-full bg-[#ffffff] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 border border-red-400/60 rounded-xl px-4 py-2.5 text-xs lg:text-sm placeholder-slate-400 outline-none focus:ring-2 focus:ring-red-500/30 transition-all resize-none font-medium shadow-xs"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleSave(entry)}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs lg:text-sm font-black transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-500/20"
                      >
                        {saving ? <FiRefreshCw size={13} className="animate-spin" /> : <FiCheck size={14} />}
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs lg:text-sm font-bold transition-all cursor-pointer"
                      >
                        <FiX size={13} /> Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Submitter Footnote & Logs Trigger ── */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-medium flex-wrap gap-2">
                  <div className="text-slate-500 dark:text-slate-400">
                    {entry.added_by_name ? (
                      <span>
                        Recorded by <strong className="text-slate-700 dark:text-slate-200 font-bold">{entry.added_by_name}</strong> ({entry.added_by_role})
                      </span>
                    ) : (
                      <span>Created: {formatDate(entry.created_at)}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleLogs(entry.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-500/20 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300 transition-all cursor-pointer text-[11px] font-bold"
                  >
                    <span>📜 Activity Logs</span>
                    <span className="text-[9px]">{expandedLogsId === entry.id ? '▲' : '▼'}</span>
                  </button>
                </div>

                {/* ── Expanded Activity Timeline ── */}
                {expandedLogsId === entry.id && (
                  <div className="mt-2 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0b1120] border border-slate-200/80 dark:border-slate-800 space-y-2.5 animate-in fade-in duration-150">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <FiClock size={11} className="text-indigo-500" /> Submission Status History
                    </p>

                    {loadingLogsMap[entry.id] ? (
                      <div className="space-y-2 animate-pulse py-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                      </div>
                    ) : (logsMap[entry.id] && logsMap[entry.id].length > 0) ? (
                      <div className="space-y-2 relative pl-3 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                        {logsMap[entry.id].map((log) => {
                          const toCfg = STATUS_CONFIG[log.status_to] || STATUS_CONFIG.pending;
                          return (
                            <div key={log.id} className="relative pl-3 space-y-0.5">
                              {/* Dot indicator */}
                              <span className="absolute -left-[11px] top-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-[#0b1120]" />

                              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {log.status_from ? (
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                                      Status changed: <span className="capitalize line-through text-slate-400">{log.status_from}</span> ➔ <span className={`font-bold uppercase px-1.5 py-0.2 rounded ${toCfg.color}`}>{log.status_to}</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                                      Initial Submission created as <span className={`font-bold uppercase px-1.5 py-0.2 rounded ${toCfg.color}`}>{log.status_to}</span>
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                  {formatLogTime(log.created_at)}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                by <strong className="text-slate-700 dark:text-slate-200 font-semibold">{log.changed_by_name || `User #${log.changed_by}`}</strong>
                                {log.changed_by_role && ` (${log.changed_by_role})`}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
                        No prior status change logs found for this entry.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MarketplaceSubmissions;

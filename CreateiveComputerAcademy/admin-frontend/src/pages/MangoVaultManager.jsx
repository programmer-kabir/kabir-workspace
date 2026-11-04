import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
  FiLock,
  FiUnlock,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiArrowRight,
  FiClock,
  FiCheckCircle,
  FiUsers,
  FiList,
  FiInfo,
  FiX,
  FiAlertTriangle
} from 'react-icons/fi';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const getAuthToken = () => {
  return localStorage.getItem('cca_admin_token') || localStorage.getItem('token') || '';
};

export default function MangoVaultManager() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_academy_mangoes: 0,
    total_vault_held_mangoes: 0,
    total_visible_mangoes: 0,
    total_staff_count: 0,
    staff_with_vault_holds_count: 0,
    staff_in_debt_count: 0,
    total_debt_hours: 0
  });
  const [staffList, setStaffList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Filters & Tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [shiftFilter, setShiftFilter] = useState('all'); // 'all' | '6h' | '8h' | 'held'
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' | 'logs'

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'hold' | 'release' | 'transfer' | null
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [modalCount, setModalCount] = useState(1);
  const [modalNote, setModalNote] = useState('');
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferSource, setTransferSource] = useState('vault'); // 'vault' | 'tree'
  const [submitting, setSubmitting] = useState(false);

  // Fetch Vault Overview
  const fetchVaultOverview = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = getAuthToken();
      const res = await axios.get(
        `${API_BASE}api/breaks/manage_mango_vault.php?action=get_overview&token=${encodeURIComponent(token)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.status === 'success') {
        setStats(res.data.data.stats || {});
        setStaffList(res.data.data.staff || []);
        setAuditLogs(res.data.data.logs || []);
      } else {
        toast.error(res.data.message || 'Failed to fetch Mango Vault data.');
      }
    } catch (err) {
      console.error('Vault overview error:', err);
      toast.error('Server error connecting to Mango Vault API.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVaultOverview();
  }, [fetchVaultOverview]);

  // Open Modals Helper
  const openHoldModal = (staff) => {
    setSelectedStaff(staff);
    setModalCount(1);
    setModalNote('Reserved in Admin Vault to regulate break consumption.');
    setActiveModal('hold');
  };

  const openReleaseModal = (staff) => {
    setSelectedStaff(staff);
    setModalCount(1);
    setModalNote('Emergency release from Admin Vault to staff tree.');
    setActiveModal('release');
  };

  const openTransferModal = (staff) => {
    setSelectedStaff(staff);
    setModalCount(1);
    setTransferSource(staff.vault_held_mangoes > 0 ? 'vault' : 'tree');
    setTransferTargetId('');
    setModalNote('Administrative Mango Transfer for peer support.');
    setActiveModal('transfer');
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedStaff(null);
    setSubmitting(false);
  };

  // Submit Actions
  const handleHoldSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff || modalCount <= 0) return;
    setSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await axios.post(
        `${API_BASE}api/breaks/manage_mango_vault.php?action=hold&token=${encodeURIComponent(token)}`,
        {
          token,
          action: 'hold',
          user_id: selectedStaff.user_id,
          mango_count: modalCount,
          note: modalNote
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Mango(es) successfully held in vault!');
        closeModal();
        fetchVaultOverview(true);
      } else {
        toast.error(res.data.message || 'Failed to hold mango(es).');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error executing hold action.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReleaseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff || modalCount <= 0) return;
    setSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await axios.post(
        `${API_BASE}api/breaks/manage_mango_vault.php?action=release&token=${encodeURIComponent(token)}`,
        {
          token,
          action: 'release',
          user_id: selectedStaff.user_id,
          mango_count: modalCount,
          note: modalNote
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Mango(es) successfully released back to tree!');
        closeModal();
        fetchVaultOverview(true);
      } else {
        toast.error(res.data.message || 'Failed to release mango(es).');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error executing release action.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff || !transferTargetId || modalCount <= 0) {
      toast.error('Please select a recipient colleague and specify mango count.');
      return;
    }
    setSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await axios.post(
        `${API_BASE}api/breaks/manage_mango_vault.php?action=transfer&token=${encodeURIComponent(token)}`,
        {
          token,
          action: 'transfer',
          source_user_id: selectedStaff.user_id,
          target_user_id: transferTargetId,
          mango_count: modalCount,
          from_source: transferSource,
          note: modalNote
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Mango(es) successfully transferred!');
        closeModal();
        fetchVaultOverview(true);
      } else {
        toast.error(res.data.message || 'Failed to transfer mango(es).');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error executing transfer action.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter staff
  const filteredStaff = staffList.filter((s) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      s.name?.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query) ||
      s.employee_code?.toLowerCase().includes(query) ||
      s.designation?.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (shiftFilter === 'debt') return s.has_debt;
    if (shiftFilter === '6h') return s.shift_hours === 6;
    if (shiftFilter === '8h') return s.shift_hours === 8;
    if (shiftFilter === 'held') return s.vault_held_mangoes > 0;
    return true;
  });

  return (
    <div className="space-y-6  mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🥭</span>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Mango Central Vault & Treasury
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  Admin & Dev Controlled
                </span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Regulate staff break consumption, hold excess overtime in secret reserve, and dispatch emergency relief leaves.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchVaultOverview()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            <span>Sync Live Bank</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Academy Mangoes */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent bg-white dark:bg-slate-800 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Total Overtime Mangoes
            </span>
            <span className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
              🥭
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {stats.total_academy_mangoes}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Ripe Mangoes Earned
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Across all {stats.total_staff_count} registered staff members
          </p>
        </div>

        {/* Card 2: In Admin Vault (Secret Reserve) */}
        <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent bg-white dark:bg-slate-800 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Held in Vault (Secret)
            </span>
            <span className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg">
              <FiLock />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {stats.total_vault_held_mangoes}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Mangoes Locked
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Hidden from staff trees ({stats.staff_with_vault_holds_count} staff held)
          </p>
        </div>

        {/* Card 3: Visible on Staff Trees */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent bg-white dark:bg-slate-800 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Visible & Claimable
            </span>
            <span className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
              🌳
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.total_visible_mangoes}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Visible on Trees
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Active mangoes staff can currently redeem for breaks
          </p>
        </div>

        {/* Card 4: 6-Hour Shift Staff Focus */}
        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent bg-white dark:bg-slate-800 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              6-Hour Shift Staff
            </span>
            <span className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg">
              <FiClock />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
              {staffList.filter((s) => s.shift_hours === 6).length}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Special Shift Staff
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            6h = 1 Mango (High overtime accumulation rate)
          </p>
        </div>

        {/* Card 5: Overtime Debt / ঘাটতি ঋণ */}
        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent bg-white dark:bg-slate-800 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Overtime Debt / ঘাটতি
            </span>
            <span className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg">
              <FiAlertTriangle />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
              {stats.staff_in_debt_count || 0}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Staff in Debt
            </span>
          </div>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
            -{stats.total_debt_hours || 0}h মোট ঘাটতি ঋণ (ওভারটাইম দিয়ে পূরণ করতে হবে)
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {/* Navigation Tabs & Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200/60 dark:border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FiUsers size={14} />
              <span>Staff Mango Balances ({staffList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FiList size={14} />
              <span>Audit Transaction Logs ({auditLogs.length})</span>
            </button>
          </div>

          {/* Search & Shift Filter */}
          {activeTab === 'staff' && (
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Shift Filter Dropdown */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <FiFilter className="text-slate-400 shrink-0 hidden sm:block" size={14} />
                <select
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="all">All Staff ({staffList.length})</option>
                  <option value="debt">⚠️ Overtime Debt / ঘাটতি ঋণ ({stats.staff_in_debt_count || 0})</option>
                  <option value="6h">🔥 6-Hour Shift Staff ({staffList.filter(s => s.shift_hours === 6).length})</option>
                  <option value="8h">8-Hour Shift Staff ({staffList.filter(s => s.shift_hours === 8).length})</option>
                  <option value="held">🔒 Has Vault Holds ({stats.staff_with_vault_holds_count || 0})</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Staff Table */}
        {activeTab === 'staff' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Shift Schedule</th>
                  <th className="py-3 px-4 text-center">Total Overtime</th>
                  <th className="py-3 px-4 text-center">In Admin Vault</th>
                  <th className="py-3 px-4 text-center">Visible on Tree</th>
                  <th className="py-3 px-4 text-right">Actions & Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      <FiRefreshCw className="animate-spin inline-block mr-2" size={18} />
                      Loading Mango Vault data...
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      No staff members match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => (
                    <tr
                      key={staff.user_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      {/* Column 1: Staff Member */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-2xs">
                            {staff.avatar ? (
                              <img
                                src={`${API_BASE}${staff.avatar}`}
                                alt={staff.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              staff.name?.charAt(0)?.toUpperCase() || 'S'
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {staff.name}
                              {staff.is_special_shift && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800" title="6-Hour Duty Schedule">
                                  6h Shift
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {staff.designation} • {staff.department}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Shift Schedule */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          {staff.shift_hours} Hours Target
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {staff.shift_start?.slice(0, 5)} - {staff.shift_end?.slice(0, 5)}
                        </div>
                      </td>

                      {/* Column 3: Total Earned / Overtime Debt */}
                      <td className="py-3.5 px-4 text-center">
                        {staff.has_debt ? (
                          <div>
                            <div
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-black border border-rose-300 dark:border-rose-800 text-[11px] shadow-2xs"
                              title={`ঘাটতি ঋণ: - ${staff.debt_formatted || `${staff.debt_hours}h`}. ভবিষ্যৎ কর্মদিবসে ওভারটাইম করে এই ঋণ পূরণ করতে হবে।`}
                            >
                              <FiAlertTriangle size={11} className="text-rose-600 dark:text-rose-400 shrink-0" />
                              <span>-{staff.debt_formatted || `${staff.debt_hours}h`} ঘাটতি</span>
                            </div>
                            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                              ওভারটাইম দিয়ে পূরণ হবে
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                              <span>🥭 {staff.total_earned_mangoes}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {staff.total_earned_hours}h Overtime
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Column 4: In Admin Vault (Held) */}
                      <td className="py-3.5 px-4 text-center">
                        {staff.vault_held_mangoes > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800/80 shadow-2xs">
                            <FiLock size={11} />
                            <span>{staff.vault_held_mangoes} Locked</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                        {staff.vault_held_mangoes > 0 && (
                          <div className="text-[10px] text-indigo-500/80 dark:text-indigo-400/80 mt-0.5">
                            {staff.vault_held_hours}h in reserve
                          </div>
                        )}
                      </td>

                      {/* Column 5: Visible on Tree */}
                      <td className="py-3.5 px-4 text-center">
                        {staff.has_debt ? (
                          <div>
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 font-bold text-[10px]">
                              <span>⛔ 0 on Tree</span>
                            </div>
                            <div className="text-[10px] text-rose-400 font-medium mt-0.5">
                              ঘাটতি ঋণ সক্রিয়
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold shadow-2xs ${
                              staff.visible_mangoes > 0
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}>
                              <span>🌳 {staff.visible_mangoes} on Tree</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {staff.visible_hours}h claimable
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Column 6: Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Hold in Vault Button */}
                          <button
                            onClick={() => openHoldModal(staff)}
                            disabled={staff.visible_mangoes <= 0 || staff.has_debt}
                            title={staff.has_debt ? "Staff is in overtime debt. No active mangoes to hold." : "Reserve mangoes from staff's tree into Admin Vault"}
                            className="px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                          >
                            <FiLock size={12} />
                            <span>Hold</span>
                          </button>

                          {/* Release Back Button */}
                          <button
                            onClick={() => openReleaseModal(staff)}
                            disabled={staff.vault_held_mangoes <= 0}
                            title="Release reserved mangoes back to staff tree"
                            className="px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                          >
                            <FiUnlock size={12} />
                            <span>Release</span>
                          </button>

                          {/* Transfer Button */}
                          <button
                            onClick={() => openTransferModal(staff)}
                            disabled={staff.total_earned_mangoes <= 0 || staff.has_debt}
                            title={staff.has_debt ? "Staff is in overtime debt. Cannot transfer out." : "Transfer mango to another colleague"}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                          >
                            <FiArrowRight size={12} />
                            <span>Transfer</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Audit Logs */}
        {activeTab === 'logs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4 text-center">Mango Count</th>
                  <th className="py-3 px-4">Notes / Reason</th>
                  <th className="py-3 px-4 text-right">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      No vault transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => {
                    let badge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {log.action_type}
                      </span>
                    );
                    if (log.action_type === 'hold') {
                      badge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center gap-1 w-max">
                          <FiLock size={10} /> Held to Vault
                        </span>
                      );
                    } else if (log.action_type === 'release') {
                      badge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 w-max">
                          <FiUnlock size={10} /> Released to Tree
                        </span>
                      );
                    } else if (log.action_type === 'transfer_out') {
                      badge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 flex items-center gap-1 w-max">
                          <FiArrowRight size={10} /> Transferred Out
                        </span>
                      );
                    } else if (log.action_type === 'transfer_in') {
                      badge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 flex items-center gap-1 w-max">
                          <FiCheckCircle size={10} /> Transferred In
                        </span>
                      );
                    }

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {log.created_at}
                        </td>
                        <td className="py-3 px-4">{badge}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {log.staff_name || `User #${log.user_id}`}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">
                          🥭 {log.mango_count} ({log.minutes_amount}m)
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={log.note}>
                          {log.note || '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-500 dark:text-slate-400">
                          {log.performed_by_name || 'Admin'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ACTION MODALS (Rendered via React Portal directly into body)  */}
      {/* ───────────────────────────────────────────────────────────── */}

      {/* 1. HOLD MODAL */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {activeModal === 'hold' && selectedStaff && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-base">
                  <FiLock />
                  <span>Reserve Mangoes in Vault</span>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedStaff.name} ({selectedStaff.shift_hours}h Shift)
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Visible on Tree: <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedStaff.visible_mangoes} Mangoes</span>
                  {' • '}
                  Already in Vault: <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedStaff.vault_held_mangoes} Mangoes</span>
                </div>
              </div>

              <form onSubmit={handleHoldSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Number of Mangoes to Hold:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedStaff.visible_mangoes}
                    value={modalCount}
                    onChange={(e) => setModalCount(Math.max(1, Math.min(selectedStaff.visible_mangoes, parseInt(e.target.value) || 1)))}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Equates to {modalCount * selectedStaff.shift_hours} hours ({modalCount * selectedStaff.shift_hours * 60} mins) overtime.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Reason / Administrative Note:
                  </label>
                  <textarea
                    rows="3"
                    value={modalNote}
                    onChange={(e) => setModalNote(e.target.value)}
                    placeholder="Enter reason for reserve..."
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  ></textarea>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2.5">
                  <FiInfo className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    <strong>Stealth Mode:</strong> This staff member will NOT see these reserved mangoes in their portal. Their tree will only display their remaining mangoes.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <FiLock size={13} />
                    <span>{submitting ? 'Reserving...' : 'Confirm Reserve'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
      )}

      {/* 2. RELEASE MODAL */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {activeModal === 'release' && selectedStaff && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-base">
                  <FiUnlock />
                  <span>Release Mangoes to Tree</span>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {selectedStaff.name} ({selectedStaff.shift_hours}h Shift)
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Currently in Vault: <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedStaff.vault_held_mangoes} Mangoes</span>
                  {' • '}
                  Visible on Tree: <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedStaff.visible_mangoes} Mangoes</span>
                </div>
              </div>

              <form onSubmit={handleReleaseSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Number of Mangoes to Release:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedStaff.vault_held_mangoes}
                    value={modalCount}
                    onChange={(e) => setModalCount(Math.max(1, Math.min(selectedStaff.vault_held_mangoes, parseInt(e.target.value) || 1)))}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Will return {modalCount * selectedStaff.shift_hours} hours to staff's visible mango tree.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Reason / Note (Emergency / Approved Relief):
                  </label>
                  <textarea
                    rows="3"
                    value={modalNote}
                    onChange={(e) => setModalNote(e.target.value)}
                    placeholder="Enter reason for release..."
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <FiUnlock size={13} />
                    <span>{submitting ? 'Releasing...' : 'Release to Tree'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
      )}

      {/* 3. TRANSFER MODAL */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {activeModal === 'transfer' && selectedStaff && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-base">
                  <FiArrowRight />
                  <span>Transfer Mango to Colleague</span>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  Sender: {selectedStaff.name} ({selectedStaff.shift_hours}h Shift)
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  In Vault: <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedStaff.vault_held_mangoes}</span>
                  {' • '}
                  On Tree: <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedStaff.visible_mangoes}</span>
                </div>
              </div>

              <form onSubmit={handleTransferSubmit} className="space-y-4">
                {/* Source Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Deduct From:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTransferSource('vault')}
                      disabled={selectedStaff.vault_held_mangoes <= 0}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        transferSource === 'vault'
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <FiLock size={12} />
                      <span>Admin Vault ({selectedStaff.vault_held_mangoes})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferSource('tree')}
                      disabled={selectedStaff.visible_mangoes <= 0}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        transferSource === 'tree'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <span>🌳 Active Tree ({selectedStaff.visible_mangoes})</span>
                    </button>
                  </div>
                </div>

                {/* Recipient Colleague Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Recipient Colleague:
                  </label>
                  <select
                    value={transferTargetId}
                    onChange={(e) => setTransferTargetId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">Select recipient colleague...</option>
                    {staffList
                      .filter((s) => s.user_id !== selectedStaff.user_id)
                      .map((s) => (
                        <option key={s.user_id} value={s.user_id}>
                          {s.name} ({s.shift_hours}h shift) — {s.has_debt ? `⚠️ Has -${s.debt_formatted || `${s.debt_hours}h`} Debt (Transfer will help clear deficit!)` : `Currently has ${s.visible_mangoes} mangoes`}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Mango Count */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Number of Mangoes to Transfer:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={
                      transferSource === 'vault'
                        ? selectedStaff.vault_held_mangoes
                        : selectedStaff.visible_mangoes
                    }
                    value={modalCount}
                    onChange={(e) => {
                      const maxVal =
                        transferSource === 'vault'
                          ? selectedStaff.vault_held_mangoes
                          : selectedStaff.visible_mangoes;
                      setModalCount(Math.max(1, Math.min(maxVal, parseInt(e.target.value) || 1)));
                    }}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Transfer Note / Reason:
                  </label>
                  <textarea
                    rows="2"
                    value={modalNote}
                    onChange={(e) => setModalNote(e.target.value)}
                    placeholder="Enter reason..."
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <FiArrowRight size={13} />
                    <span>{submitting ? 'Transferring...' : 'Confirm Transfer'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </div>
  );
}

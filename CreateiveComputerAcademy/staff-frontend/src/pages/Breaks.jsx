import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiCoffee, FiPlus } from 'react-icons/fi';
import Pusher from 'pusher-js';
import { useAuth } from '../context/AuthContext';
import ActiveBreakWidget from '../components/ActiveBreakWidget';
import BreakWidget from '../components/BreakWidget';
import BreakRequestModal from '../components/BreakRequestModal';
import TiffinTimer from '../components/TiffinTimer';
import BreakSummaryCards from '../components/Breaks/BreakSummaryCards';
import BreakFilterBar from '../components/Breaks/BreakFilterBar';
import BreakHistoryTable from '../components/Breaks/BreakHistoryTable';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Breaks = () => {
  const { currentUser } = useAuth();
  const [breaks, setBreaks] = useState([]);
  const [summary, setSummary] = useState({ total_breaks: 0, total_minutes: 0, today_minutes: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const params = { user_id: currentUser.id };
      if (dateFilter) params.date = dateFilter;
      if (typeFilter !== 'all') params.break_type = typeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await axios.post(`${API_BASE}api/breaks/get_break_history.php`, params);
      if (res.data.status === 'success') {
        setBreaks(res.data.data.breaks || []);
        setSummary(res.data.data.summary || { total_breaks: 0, total_minutes: 0, today_minutes: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch break history:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, dateFilter, typeFilter, statusFilter]);

  useEffect(() => {
    fetchHistory();

    let pusherInstance = null;
    try {
      pusherInstance = new Pusher('82a63711fed4b73bd74d', {
        cluster: 'ap2',
        forceTLS: true
      });
      const channel = pusherInstance.subscribe(`user-channel-${currentUser?.id}`);
      channel.bind('break-approved', () => fetchHistory());
      channel.bind('break-rejected', () => fetchHistory());
      channel.bind('break-ended', () => fetchHistory());
    } catch (e) { }

    return () => {
      if (pusherInstance) pusherInstance.disconnect();
    };
  }, [fetchHistory, currentUser]);

  const filteredBreaks = breaks.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.break_type?.toLowerCase().includes(q) ||
      b.purpose?.toLowerCase().includes(q) ||
      b.reason?.toLowerCase().includes(q) ||
      b.date?.includes(q) ||
      b.approved_by_name?.toLowerCase().includes(q)
    );
  });

  const handleClearFilters = () => {
    setSearchQuery('');
    setDateFilter('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = Boolean(searchQuery || dateFilter || typeFilter !== 'all' || statusFilter !== 'all');

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <FiCoffee size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Breaks & Time-Off Log
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                Track daily tiffin, personal breaks, and emergency time-off history.
              </p>
            </div>
          </div>
        </div>

        {(!currentUser?.is_manual_break && currentUser?.has_tiffin_break !== 0 && currentUser?.has_tiffin_break !== false && !(Number(currentUser?.allocated_break_minutes) > 0 && currentUser?.has_tiffin_break === 0)) && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <FiPlus size={16} />
            <span>Request New Break</span>
          </button>
        )}
      </div>

      {/* ── Active Break Live Widget (For Scheduled Tiffin Staff) ── */}
      <ActiveBreakWidget onBreakChange={() => fetchHistory()} />

      {/* ── Manual Break Widget (For Manual Allocated Break Staff) ── */}
      {(currentUser?.is_manual_break || currentUser?.has_tiffin_break === 0 || currentUser?.has_tiffin_break === false || (Number(currentUser?.allocated_break_minutes) > 0 && currentUser?.has_tiffin_break === 0)) && (
        <div className="mb-6">
          <BreakWidget />
        </div>
      )}

      {/* ── Tiffin Timer ── */}
      <TiffinTimer />

      {/* ── Summary Cards ── */}
      <BreakSummaryCards summary={summary} />

      {/* ── Filters & Search Bar ── */}
      <BreakFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* ── Break History Log Table ── */}
      <BreakHistoryTable
        loading={loading}
        filteredBreaks={filteredBreaks}
        totalBreaksCount={breaks.length}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      {/* ── Request Modal ── */}
      <BreakRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchHistory()}
      />
    </div>
  );
};

export default Breaks;

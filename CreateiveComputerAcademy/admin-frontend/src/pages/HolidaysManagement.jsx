import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  FiCalendar, FiPlus, FiTrash2, FiEdit2, FiCheckCircle,
  FiAlertCircle, FiRefreshCw, FiClock, FiShield,
  FiInfo, FiSearch, FiCheck, FiX, FiZap, FiSun
} from 'react-icons/fi';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// National Holidays presets for quick 1-click addition
const BANGLADESH_PRESETS = [
  { title: 'International Mother Language Day (একুশে ফেব্রুয়ারি)', dateSuffix: '-02-21', type: 'public_holiday', is_paid: 1 },
  { title: 'Independence Day (স্বাধীনতা দিবস)', dateSuffix: '-03-26', type: 'public_holiday', is_paid: 1 },
  { title: 'Bengali New Year (পহেলা বৈশাখ)', dateSuffix: '-04-14', type: 'public_holiday', is_paid: 1 },
  { title: 'May Day (মে দিবস / আন্তর্জাতিক শ্রমিক দিবস)', dateSuffix: '-05-01', type: 'public_holiday', is_paid: 1 },
  { title: 'Victory Day (বিজয় দিবস)', dateSuffix: '-12-16', type: 'public_holiday', is_paid: 1 }
];

const CLOSURE_TYPES = [
  { value: 'public_holiday', label: 'Public Holiday (সরকারি / জাতীয় ছুটি)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800' },
  { value: 'center_closure', label: 'Center Closed (সেন্টার সাময়িক বন্ধ)', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' },
  { value: 'emergency', label: 'Emergency Closure (জরুরি আবহাওয়া / দুর্যোগ)', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800' },
  { value: 'special_event', label: 'Special Academy Event (বার্ষিক অনুষ্ঠান)', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' },
  { value: 'renovation', label: 'Maintenance / Renovation (মেরামত ও রক্ষণাবেক্ষণ)', color: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' }
];

export default function HolidaysManagement() {
  const { currentUser } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [stats, setStats] = useState({ total: 0, paid_count: 0, unpaid_count: 0, upcoming_count: 0, next_upcoming: null });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const initialForm = {
    id: null,
    date: new Date().toISOString().split('T')[0],
    title: '',
    expected_hours: 0,
    is_paid: 1,
    closure_type: 'center_closure',
    notes: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/admin/holidays/get_holidays.php`, {
        params: { year: selectedYear }
      });
      if (res.data.status === 'success') {
        setHolidays(res.data.data || []);
        setStats(res.data.stats || { total: 0, paid_count: 0, unpaid_count: 0, upcoming_count: 0, next_upcoming: null });
      } else {
        toast.error(res.data.message || 'Failed to fetch holidays');
      }
    } catch (err) {
      toast.error('Network error while loading holidays');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [selectedYear]);

  const handleOpenCreate = () => {
    setFormData({
      ...initialForm,
      date: new Date().toISOString().split('T')[0]
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (h) => {
    setFormData({
      id: h.id,
      date: h.date,
      title: h.title,
      expected_hours: h.expected_hours || 0,
      is_paid: h.is_paid !== undefined ? h.is_paid : 1,
      closure_type: h.closure_type || 'public_holiday',
      notes: h.notes || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.warning('Please enter a holiday / closure title');
      return;
    }
    if (!formData.date) {
      toast.warning('Please choose a valid date');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        admin_id: currentUser?.id
      };
      const res = await axios.post(`${API_BASE}api/admin/holidays/save_holiday.php`, payload);
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Holiday saved successfully!');
        setShowModal(false);
        fetchHolidays();
      } else {
        toast.error(res.data.message || 'Failed to save holiday');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error occurred while saving holiday';
      toast.error(msg);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const res = await axios.post(`${API_BASE}api/admin/holidays/delete_holiday.php`, {
        id,
        admin_id: currentUser?.id
      });
      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Holiday deleted and earnings rolled back');
        setDeleteConfirmId(null);
        fetchHolidays();
      } else {
        toast.error(res.data.message || 'Failed to delete');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error occurred while deleting holiday');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleApplyPreset = (preset) => {
    const targetDate = `${selectedYear}${preset.dateSuffix}`;
    setFormData({
      ...initialForm,
      date: targetDate,
      title: preset.title,
      closure_type: preset.type,
      is_paid: preset.is_paid,
      notes: 'Bangladesh National Holiday'
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const filteredHolidays = useMemo(() => {
    return holidays.filter(h => {
      const matchesSearch = h.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.notes && h.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        h.date.includes(searchTerm);
      const matchesType = selectedType === 'all' || h.closure_type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [holidays, searchTerm, selectedType]);

  const getTypeBadge = (type) => {
    const config = CLOSURE_TYPES.find(c => c.value === type) || CLOSURE_TYPES[0];
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        {config.label.split(' (')[0]}
      </span>
    );
  };

  return (
    <div className="mx-auto space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold tracking-wide uppercase border border-indigo-500/30">
            <FiShield size={13} className="text-emerald-400" />
            Wage Protection & Attendance Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Holidays & Center Closures 🏛️
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl">
            Declare academy holidays, national celebrations, or emergency center closures. Active staff attendance is excused, base wages are fully protected (8h credited), and zero shortfall or absent penalties apply.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={fetchHolidays}
            disabled={loading}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md border border-white/10"
            title="Refresh List"
          >
            <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
          >
            <FiPlus size={18} />
            Declare Center Closed / Holiday
          </button>
        </div>
      </div>

      {/* ── Stats Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <FiCalendar size={24} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Declared ({selectedYear})</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.total} Days</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <FiCheckCircle size={24} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Paid Wage Protected</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.paid_count} Days</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <FiClock size={24} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Upcoming Closures</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{stats.upcoming_count} Days</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
            <FiZap size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Next Upcoming</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5" title={stats.next_upcoming?.title}>
              {stats.next_upcoming ? `${stats.next_upcoming.date} (${stats.next_upcoming.title})` : 'None upcoming'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Bangladesh Holiday Presets ── */}
      <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          <FiSun className="text-amber-500" size={14} />
          Quick Presets (বাংলাদেশ জাতীয় ছুটিসমূহ):
        </div>
        <div className="flex flex-wrap gap-2">
          {BANGLADESH_PRESETS.map((p, idx) => {
            const dateStr = `${selectedYear}${p.dateSuffix}`;
            const alreadyExists = holidays.some(h => h.date === dateStr);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                disabled={alreadyExists}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  alreadyExists
                    ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm'
                }`}
              >
                {alreadyExists && <FiCheck size={12} className="text-emerald-500" />}
                {p.title.split(' (')[0]} ({dateStr})
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by title, notes, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Closure Types</option>
            {CLOSURE_TYPES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {[2024, 2025, 2026, 2027, 2028].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table of Holidays ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <FiRefreshCw size={28} className="animate-spin text-indigo-500" />
            <span className="text-sm font-medium">Loading official holidays & closures...</span>
          </div>
        ) : filteredHolidays.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <FiCalendar size={40} className="mx-auto text-slate-300 dark:text-slate-700" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Holidays Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No holidays or center closures declared for {selectedYear} matching your filters. Click below to declare one.
            </p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
            >
              <FiPlus size={14} /> Declare Holiday
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Date & Day</th>
                  <th className="p-4">Title / Purpose</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Wage Protection</th>
                  <th className="p-4">Duty Expectation</th>
                  <th className="p-4">Declared By</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredHolidays.map((h) => {
                  const isPaid = (Number(h.is_paid) === 1);
                  return (
                    <tr
                      key={h.id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${
                        h.is_today ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''
                      }`}
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl ${
                            h.is_today
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            <FiCalendar size={16} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {h.formatted_date || h.date}
                              {h.is_today && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-indigo-600 text-white uppercase tracking-wider">
                                  Today
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">{h.day_of_week}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {h.title}
                        </div>
                        {h.notes && (
                          <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{h.notes}</div>
                        )}
                      </td>

                      <td className="p-4">
                        {getTypeBadge(h.closure_type)}
                      </td>

                      <td className="p-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <FiCheckCircle size={12} />
                            100% Paid (8h Credit)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Unpaid Day Off
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                        {h.expected_hours > 0 ? `${h.expected_hours}h required` : '0h (Non-working day)'}
                      </td>

                      <td className="p-4 text-xs text-slate-500 dark:text-slate-400">
                        {h.creator_name ? h.creator_name : 'Admin'}
                      </td>

                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(h)}
                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                            title="Edit Holiday"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(h.id)}
                            className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                            title="Delete Holiday"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <FiCalendar size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isEditing ? 'Edit Holiday / Center Closure' : 'Declare Center Closed / Holiday 🏛️'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Full wage protection and attendance exemption for active staff.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Holiday / Closure Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Title / Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. International Mother Language Day, Emergency Maintenance"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Closure Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Closure Category
                </label>
                <select
                  value={formData.closure_type}
                  onChange={(e) => setFormData({ ...formData, closure_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CLOSURE_TYPES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Paid Holiday Toggle */}
              <div className="p-4 rounded-2xl bg-emerald-50/75 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiShield className="text-emerald-600 dark:text-emerald-400" size={18} />
                    <span className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      Paid Wage Protection (বেতন সুরক্ষিত রাখুন)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={Number(formData.is_paid) === 1}
                    onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked ? 1 : 0 })}
                    className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-emerald-300 dark:border-emerald-700"
                  />
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  When enabled, active staff are credited their standard daily shift (8h) in payroll earnings. No auto-absent cuts and no mango break penalties are deducted.
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Internal Notes / Announcement
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional notice or instructions for staff and records..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
                >
                  {saving && <FiRefreshCw size={14} className="animate-spin" />}
                  {isEditing ? 'Update Holiday' : 'Save & Protect Wages'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50">
                <FiAlertCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Delete Holiday / Closure?
              </h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to remove this holiday? Any automated wage protection credits created for this specific holiday will be safely rolled back in staff payroll.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

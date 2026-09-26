import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import {
  FiArrowLeft, FiCheckCircle, FiXCircle, FiClock,
  FiRefreshCw, FiCalendar, FiAlertTriangle, FiTrendingUp,
  FiUser, FiList, FiEye, FiAlertCircle, FiChevronDown, FiChevronUp, FiCode
} from 'react-icons/fi';
import MarketplaceSubmissions from '../components/MarketplaceSubmissions';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ── JSON & Spec Viewer Helpers ───────────────────────────────────────────────
const isColorHex = (str) => typeof str === 'string' && /^#([0-9A-F]{3}){1,2}$/i.test(str);

const DynamicJsonViewer = ({ data, level = 0 }) => {
  if (data === null) return <span className="text-white/40 italic text-xs">null</span>;
  if (typeof data === 'boolean') return <span className={`text-xs ${data ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}`}>{data ? 'True' : 'False'}</span>;
  if (typeof data === 'number') return <span className="text-blue-400 font-medium text-xs">{data}</span>;
  if (typeof data === 'string') {
    if (isColorHex(data)) {
      return (
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full shadow-sm inline-block shrink-0 border border-white/10" style={{ backgroundColor: data }}></span>
          <span className="text-white/70 font-medium text-xs">{data}</span>
        </span>
      );
    }
    return <span className="text-white/70 text-xs leading-relaxed">{data}</span>;
  }
  if (Array.isArray(data)) {
    return (
      <ul className="flex flex-col gap-1 mt-1 list-disc list-inside text-white/30 marker:text-white/20 pl-1">
        {data.map((item, idx) => (
          <li key={idx} className="text-xs">
             <span className="inline-block align-top ml-[-4px] w-[calc(100%-12px)]">
               <DynamicJsonViewer data={item} level={level + 1} />
             </span>
          </li>
        ))}
      </ul>
    );
  }
  if (typeof data === 'object') {
    return (
      <div className={`flex flex-col gap-2 ${level > 0 ? 'mt-1.5 pl-3 border-l-2 border-white/5' : ''}`}>
        {Object.entries(data).map(([key, val]) => {
          const isComplex = typeof val === 'object' && val !== null;
          return (
            <div key={key} className={`flex ${isComplex ? 'flex-col' : 'items-start gap-3'}`}>
              <span className={`text-[10px] font-bold text-white/40 uppercase shrink-0 ${!isComplex ? 'w-1/3 min-w-[120px] max-w-[150px] pt-0.5' : 'mb-0.5 text-white/70'}`}>
                {key.replace(/_/g, ' ')}
              </span>
              <div className={`${isComplex ? 'w-full' : 'flex-1 break-words'}`}>
                <DynamicJsonViewer data={val} level={level + 1} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const DescriptionRenderer = ({ htmlContent }) => {
  let jsonData = null;
  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    let rawText = tempDiv.textContent || tempDiv.innerText || '';
    rawText = rawText.replace(/\u00A0/g, ' ').replace(/&nbsp;/g, ' ').trim();
    if (rawText.startsWith('{') || rawText.startsWith('[')) {
      jsonData = JSON.parse(rawText);
    }
  } catch (e) {
    jsonData = null;
  }

  if (jsonData) {
    return (
      <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-[11px] font-black text-brand-400 uppercase tracking-widest flex items-center gap-1.5">
            <FiCode size={14} />
            Structured Specifications (JSON)
          </h4>
        </div>
        <DynamicJsonViewer data={jsonData} />
      </div>
    );
  }

  return (
    <div
      className="text-white/70 text-xs leading-relaxed max-w-none task-description-html"
      dangerouslySetInnerHTML={{ __html: htmlContent || '<p class="italic text-white/30">No description provided.</p>' }}
    />
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const scoreInfo = (s) =>
  s >= 80 ? { text: 'text-emerald-400', bg: 'bg-emerald-500', label: 'Excellent',          fill: '#10b981' }
  : s >= 60 ? { text: 'text-yellow-400',  bg: 'bg-yellow-500',  label: 'Good',               fill: '#f59e0b' }
  : s >= 40 ? { text: 'text-orange-400',  bg: 'bg-orange-500',  label: 'Needs Improvement',  fill: '#f97316' }
  :           { text: 'text-red-400',     bg: 'bg-red-500',     label: 'Poor Performance',   fill: '#ef4444' };

// Score = (Completion Rate × 50%) + (Quality Rating % × 50%) − Rejection Penalty (max 30)
const calcScore = (completed, total, rejected, avgRating = 5.0) => {
  if (total === 0) return 0;
  const compRate   = Math.round((completed / total) * 100);
  const qualityRate = Math.min(100, Math.round(((avgRating || 5.0) / 5.0) * 100));
  const rejPenalty = Math.min(30, Math.round((rejected / total) * 30));
  return Math.max(0, Math.min(100, Math.round((compRate * 0.50) + (qualityRate * 0.50) - rejPenalty)));
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const StatusBadge = ({ status }) => {
  const map = {
    Completed:    'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'In Progress':'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'In Review':  'bg-purple-500/15 text-purple-400 border-purple-500/30',
    'To-Do':      'bg-slate-500/15 text-slate-400 border-slate-500/30',
    Rejected:     'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-semibold ${map[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30'}`}>
      {status}
    </span>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
const StaffReview = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [member, setMember]     = useState(null);
  const [taskData, setTaskData] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [expandedTasks, setExpandedTasks] = useState({});

  const toggleExpand = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Date range — default this month
  const today = new Date();
  const [startDate, setStartDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  );
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const applyPreset = (monthsBack) => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsBack);
    const y = d.getFullYear(), m = d.getMonth() + 1;
    const last = new Date(y, m, 0).getDate();
    setStartDate(`${y}-${String(m).padStart(2, '0')}-01`);
    setEndDate(monthsBack === 0
      ? today.toISOString().split('T')[0]
      : `${y}-${String(m).padStart(2, '0')}-${last}`);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('');
      try {
        // Verify member is in reviewer's team
        const teamRes = await axios.get(`${API_BASE}api/reviewer/get_my_team.php?reviewer_user_id=${currentUser.id}`);
        if (teamRes.data.status !== 'success') throw new Error('Cannot verify team access.');
        const found = (teamRes.data.data || []).find(m => String(m.user_id) === String(id));
        if (!found) { setError('This staff member is not in your team.'); setLoading(false); return; }
        setMember(found);

        const taskRes = await axios.post(`${API_BASE}api/reports/get_task_report.php`, {
          user_id: parseInt(id), start_date: startDate, end_date: endDate
        });
        if (taskRes.data.status === 'success') setTaskData(taskRes.data);
      } catch (e) {
        setError(e.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, currentUser, startDate, endDate]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    if (!taskData) return null;
    const s = taskData.summary;
    const compRate = s.total_assigned > 0 ? Math.round((s.total_completed / s.total_assigned) * 100) : 0;
    const avgRating = s.avg_rating !== undefined ? Number(s.avg_rating) : 5.0;
    const score    = calcScore(s.total_completed, s.total_assigned, s.total_rejected, avgRating);
    return { compRate, avgRating, score, s };
  }, [taskData]);

  // Bar chart: task status per month-label (group by month of created_at)
  const chartData = useMemo(() => {
    if (!taskData?.tasks) return [];
    const grouped = {};
    taskData.tasks.forEach(t => {
      const month = t.created_at?.slice(0, 7) || 'Unknown';
      if (!grouped[month]) grouped[month] = { month, Completed: 0, Rejected: 0, Other: 0 };
      if (t.status === 'Completed') grouped[month].Completed++;
      else if (t.status === 'Rejected') grouped[month].Rejected++;
      else grouped[month].Other++;
    });
    return Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [taskData]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="max-w-xl mx-auto mt-20 text-center">
      <FiAlertTriangle size={40} className="mx-auto text-red-400 mb-4" />
      <p className="text-white text-lg font-semibold">{error}</p>
      <button onClick={() => navigate(-1)} className="mt-6 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-all">
        ← Go Back
      </button>
    </div>
  );

  const sc  = metrics ? scoreInfo(metrics.score) : null;
  const gaugeData = metrics ? [{ value: metrics.score, fill: sc.fill }] : [];

  return (
    <div className=" mx-auto space-y-5 animate-fade-in">

      {/* Back + Profile */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)}
          className="mt-1 p-2 rounded-xl glass hover:bg-white/10 text-white/60 hover:text-white transition-all flex-shrink-0">
          <FiArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 overflow-hidden flex-shrink-0">
            {member?.profile_picture
              ? <img src={`${API_BASE}${member.profile_picture}`} className="w-full h-full object-cover" alt={member.name} />
              : <span className="w-full h-full flex items-center justify-center text-2xl font-bold text-brand-400">{member?.name?.[0]}</span>
            }
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{member?.name}</h1>
            <p className="text-white/50 text-sm">{member?.designation || '—'} · {member?.department_name || '—'}</p>
            <p className="text-white/30 text-xs mt-0.5">{member?.employee_code} · Joined {fmtDate(member?.joining_date)}</p>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="glass rounded-2xl p-4 border border-white/5 flex flex-wrap items-center gap-3">
        <FiCalendar size={15} className="text-brand-400 flex-shrink-0" />
        <div className="flex flex-wrap gap-2">
          {['This Month', 'Last Month', '2 Months Back'].map((label, i) => (
            <button key={label} onClick={() => applyPreset(i)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-brand-500/20 text-white/50 hover:text-brand-400 text-xs font-medium transition-all border border-white/5 hover:border-brand-500/30">
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="bg-white/5 border border-white/10 text-white/70 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-brand-500/50 transition-all" />
          <span className="text-white/30 text-xs">to</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="bg-white/5 border border-white/10 text-white/70 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-brand-500/50 transition-all" />
        </div>
      </div>

      {/* ── Score + Task Stats ── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Work Score Gauge */}
        <div className="glass rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center">
          <h2 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <FiTrendingUp size={13} /> Work Score
          </h2>
          {metrics ? (
            <>
              <div className="relative w-36 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%"
                    startAngle={210} endAngle={-30} data={gaugeData}>
                    <RadialBar dataKey="value" cornerRadius={8}
                      background={{ fill: 'rgba(255,255,255,0.04)' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-black ${sc.text}`}>{metrics.score}</span>
                  <span className="text-white/25 text-xs">/100</span>
                </div>
              </div>
              <span className={`mt-3 px-3 py-1 rounded-full text-xs font-bold ${sc.bg}/20 ${sc.text} border border-current/30`}>
                {sc.label}
              </span>

              {/* Score formula explanation */}
              <div className="mt-5 w-full glass rounded-xl p-3 text-xs space-y-1.5">
                <div className="flex justify-between text-white/40">
                  <span>Task Completion (50%)</span>
                  <span className="text-white/70 font-semibold">{metrics.compRate}%</span>
                </div>
                <div className="flex justify-between text-white/40">
                  <span>Quality / Stars (50%)</span>
                  <span className="text-amber-400 font-semibold">
                    ⭐ {metrics.avgRating} / 5.0
                  </span>
                </div>
                <div className="flex justify-between text-white/40">
                  <span>Rejection Penalty</span>
                  <span className="text-red-400 font-semibold">
                    -{metrics.s.total_assigned > 0 ? Math.min(30, Math.round((metrics.s.total_rejected / metrics.s.total_assigned) * 30)) : 0} pts
                  </span>
                </div>
              </div>
            </>
          ) : <p className="text-white/30 text-sm">No data</p>}
        </div>

        {/* Task Stats grid */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 border border-white/5">
          <h2 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-5 flex items-center gap-1.5">
            <FiList size={13} /> Task Summary
          </h2>
          {taskData ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: FiUser,        label: 'Total Assigned',    val: taskData.summary.total_assigned,      color: 'text-white' },
                  { icon: FiCheckCircle, label: 'Completed',         val: taskData.summary.total_completed,     color: 'text-emerald-400' },
                  { icon: FiEye,         label: 'In Review',         val: taskData.tasks?.filter(t => t.status === 'In Review').length ?? 0, color: 'text-purple-400' },
                  { icon: FiClock,       label: 'In Progress',       val: taskData.tasks?.filter(t => t.status === 'In Progress').length ?? 0, color: 'text-blue-400' },
                  { icon: FiXCircle,     label: 'Rejected',          val: taskData.summary.total_rejected,      color: 'text-red-400' },
                  { icon: FiRefreshCw,   label: 'Resubmitted',       val: taskData.summary.total_resubmitted,   color: 'text-yellow-400' },
                  { icon: FiAlertCircle, label: 'Delayed Completion',val: taskData.summary.delayed_completions, color: 'text-orange-400' },
                ].map(({ icon: Icon, label, val, color }) => (
                  <div key={label} className="glass rounded-xl p-3 flex items-center gap-3">
                    <Icon size={16} className={color} />
                    <div>
                      <p className="text-white/40 text-[11px]">{label}</p>
                      <p className={`text-lg font-bold ${color}`}>{val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Completion progress bar */}
              {taskData.summary.total_assigned > 0 && (
                <div className="mt-5 pt-4 border-t border-white/5">
                  <div className="flex justify-between text-xs text-white/40 mb-2">
                    <span>Overall Completion</span>
                    <span className="font-semibold text-white/70">{metrics?.compRate ?? 0}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                      style={{ width: `${metrics?.compRate ?? 0}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : <p className="text-white/30 text-sm">No task data in this period.</p>}
        </div>
      </div>

      {/* ── Task Status Bar Chart ── */}
      {chartData.length > 0 && (
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h2 className="text-white font-semibold mb-5 text-sm flex items-center gap-2">
            Task Status by Month
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={16} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#15153a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Rejected"  fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Other"     fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Task List Table ── */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm flex items-center gap-2">
            <FiList className="text-brand-400" />
            Task History
            <span className="text-white/25 font-normal">({taskData?.tasks?.length ?? 0} tasks)</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['#', 'Task Title', 'Status', 'Priority', 'Deadline', 'Delayed', 'Resubmit'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-white/30 text-xs font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(taskData?.tasks || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-white/25 text-sm">
                    No tasks assigned in this period.
                  </td>
                </tr>
              ) : (taskData?.tasks || []).map((t, idx) => (
                <React.Fragment key={t.id}>
                  <tr
                    onClick={() => toggleExpand(t.id)}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
                  >
                    <td className="px-4 py-3 text-white/20 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 text-white/80 font-medium max-w-[220px]">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{t.title}</span>
                        <FiChevronDown className={`text-white/30 transition-transform flex-shrink-0 ${expandedTasks[t.id] ? 'rotate-180' : ''}`} size={14} />
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${
                        t.priority === 'High' ? 'text-red-400'
                        : t.priority === 'Medium' ? 'text-yellow-400'
                        : 'text-slate-400'
                      }`}>{t.priority || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">{fmtDate(t.deadline)}</td>
                    <td className="px-4 py-3">
                      {t.was_delayed
                        ? <span className="text-orange-400 text-xs font-semibold">⚠ Yes</span>
                        : <span className="text-white/15 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {t.resubmit_count > 0
                        ? <span className="text-yellow-400 text-xs font-semibold">↺ {t.resubmit_count}×</span>
                        : <span className="text-white/15 text-xs">—</span>}
                    </td>
                  </tr>
                  {expandedTasks[t.id] && (
                    <tr className="bg-white/[0.01]">
                      <td colSpan={7} className="px-6 py-4 border-b border-white/5">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">Description / Instructions</h4>
                            <DescriptionRenderer htmlContent={t.description} />
                          </div>
                          {t.checklists && (() => {
                            try {
                              const checklistItems = typeof t.checklists === 'string' ? JSON.parse(t.checklists) : t.checklists;
                              if (Array.isArray(checklistItems) && checklistItems.length > 0) {
                                return (
                                  <div>
                                    <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">Checklist</h4>
                                    <div className="flex flex-col gap-2 pl-1">
                                      {checklistItems.map((item, cIdx) => (
                                        <div key={cIdx} className="flex items-center gap-2 text-xs text-white/60">
                                          <input
                                            type="checkbox"
                                            checked={item.is_completed}
                                            readOnly
                                            className="rounded border-white/10 bg-white/5 text-brand-500 focus:ring-0 cursor-default"
                                          />
                                          <span className={item.is_completed ? 'line-through text-white/30' : ''}>{item.title}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                            } catch (e) {}
                            return null;
                          })()}

                          {/* Marketplace Submissions Management */}
                          {(t.status === 'Completed' || t.status === 'In Review') && (
                            <div className="pt-3 border-t border-white/5">
                              <MarketplaceSubmissions
                                taskId={t.id}
                                userId={member?.user_id || id}
                                addedBy={currentUser?.id}
                                addedByRole="reviewer"
                                canManage={true}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffReview;

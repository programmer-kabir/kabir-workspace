import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiUsers, FiSearch, FiChevronRight, FiAlertCircle } from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const statusColor = {
  Active:     'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Probation:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Suspended:  'bg-red-500/20 text-red-400 border-red-500/30',
  Terminated: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const TeamList = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get(`${API_BASE}api/reviewer/get_my_team.php?reviewer_user_id=${currentUser.id}`)
      .then(res => { if (res.data.status === 'success') setTeam(res.data.data || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser]);

  const filtered = team.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.designation || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.department_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="mx-auto space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiUsers className="text-brand-400" /> My Team
          </h1>
          <p className="text-white/40 text-sm mt-1">{team.length} member{team.length !== 1 ? 's' : ''} under your review</p>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search members…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-500/50 transition-all"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-white/5">
          <FiAlertCircle size={36} className="mx-auto text-white/20 mb-3" />
          <p className="text-white/40">{search ? 'No members match your search.' : 'No team members assigned yet.'}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => (
            <button
              key={m.user_id}
              onClick={() => navigate(`/review/${m.user_id}`)}
              className="glass-hover rounded-2xl p-5 text-left border border-white/5 group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-white/10 border border-white/10 overflow-hidden flex-shrink-0">
                  {m.profile_picture
                    ? <img src={`${API_BASE}${m.profile_picture}`} className="w-full h-full object-cover" alt={m.name} />
                    : <span className="w-full h-full flex items-center justify-center text-xl font-bold text-brand-400">{m.name?.[0]}</span>
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold truncate group-hover:text-brand-400 transition-colors">{m.name}</p>
                  <p className="text-white/50 text-sm truncate">{m.designation || '—'}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Department</span>
                  <span className="text-white/70 font-medium">{m.department_name || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Type</span>
                  <span className="text-white/70">{m.employment_type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Status</span>
                  <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${statusColor[m.employment_status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                    {m.employment_status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Shift</span>
                  <span className="text-white/70">{m.shift_start?.slice(0,5)} – {m.shift_end?.slice(0,5)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-brand-400/70 text-xs mt-4 group-hover:text-brand-400 transition-colors">
                View Full Review <FiChevronRight size={13} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamList;

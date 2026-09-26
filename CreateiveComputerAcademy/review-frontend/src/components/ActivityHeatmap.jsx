import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiActivity } from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const ActivityHeatmap = () => {
  const { currentUser } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    axios.get(`${API_BASE}api/reviewer/get_activity_heatmap.php?user_id=${currentUser.id}`)
      .then(res => {
        if (res.data.status === 'success') {
          setData(res.data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser]);

  // Custom brand colors for levels 0 to 4
  const getLevelColor = (level) => {
    switch (level) {
      case 1: return 'bg-brand-500/30 border-brand-500/20';
      case 2: return 'bg-brand-500/60 border-brand-500/40';
      case 3: return 'bg-brand-500/80 border-brand-500/60';
      case 4: return 'bg-brand-500 border-brand-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]';
      default: return 'bg-white/5 border-white/5';
    }
  };

  if (loading) {
    return <div className="h-40 animate-pulse bg-white/5 rounded-2xl w-full"></div>;
  }

  return (
    <div className="glass-hover rounded-2xl p-6 border border-white/5 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white font-semibold flex items-center gap-2 text-sm">
          <FiActivity className="text-brand-400" /> Activity Heatmap
        </h2>
        <div className="flex items-center gap-2 text-[10px] text-white/50 font-medium">
          <span>Less</span>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map(l => (
              <div key={l} className={`w-3 h-3 rounded-[3px] border ${getLevelColor(l)}`} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-4 custom-scrollbar flex-1 flex items-end">
        <div className="grid grid-rows-7 grid-flow-col gap-[5px] w-max">
          {data.map((day, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-[3px] border transition-all duration-300 hover:scale-150 hover:z-10 cursor-crosshair relative group ${getLevelColor(day.level)}`}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-dark-950/90 backdrop-blur-md border border-white/10 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl whitespace-nowrap">
                <span className="font-bold text-brand-400">{day.count} tasks</span> on {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;

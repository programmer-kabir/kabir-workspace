import React from 'react';
import { motion } from 'framer-motion';

const fmtLogTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr.includes('T') || dateStr.includes('Z') ? dateStr : dateStr.replace(' ', 'T') + 'Z');
  return d.toLocaleString('en-GB', { 
    timeZone: 'Asia/Dhaka', 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  }).toUpperCase();
};

const TaskTimeline = ({ logs, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 justify-center text-xs text-white/40">
        <div className="w-3.5 h-3.5 border border-white/20 border-t-transparent rounded-full animate-spin" />
        <span>Loading audit trail...</span>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return null;
  }

  const cronLogs = [...logs].reverse();

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)] ring-emerald-500/20';
      case 'Rejected': return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)] ring-red-500/20';
      case 'In Review': return 'bg-brand-500 shadow-[0_0_10px_rgba(99,102,241,0.7)] ring-brand-500/20';
      case 'In Progress': return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.7)] ring-yellow-500/20';
      default: return 'bg-brand-500 ring-brand-500/20';
    }
  };

  return (
    <div className="space-y-4 bg-dark-900/30 p-5 rounded-2xl border border-white/5">
      <h4 className="text-white/70 dark:text-white/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span> Audit Trail
      </h4>
      
      <div className="relative pl-5 border-l-2 border-white/10 space-y-6 ml-1 pt-2 pb-2">
        {cronLogs.map((log, index) => {
          const isCreation = !log.status_from;
          const statusText = isCreation
            ? "Task Created & Assigned"
            : `Status changed to: ${log.status_to}`;
          const actor = log.changed_by_name || 'System / Admin';
          const timeText = fmtLogTime(log.created_at);
          const colorClass = getStatusColor(log.status_to || 'In Progress');

          return (
            <motion.div 
              key={log.id} 
              className="relative"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1, type: "spring", stiffness: 120 }}
            >
              {/* Animated Timeline Bullet */}
              <div className={`absolute left-0 -translate-x-[25.5px] top-1.5 w-3 h-3 rounded-full z-10 ${colorClass}`} />
              
              <div className="-mt-1 pb-2">
                <p className="text-white text-xs font-bold">{statusText}</p>
                <p className="text-white/70 dark:text-white/50 text-[10px] uppercase font-bold tracking-wide mt-1">
                  BY {actor} &bull; {timeText}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskTimeline;

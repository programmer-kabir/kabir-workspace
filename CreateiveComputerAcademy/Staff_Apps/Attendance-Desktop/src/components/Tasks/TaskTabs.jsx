import React from 'react';

const TaskTabs = ({ columns, activeTab, onTabChange }) => {
  return (
    <div className="flex overflow-x-auto custom-scrollbar gap-2.5 mb-6 pb-2 pt-1 px-1">
      {Object.keys(columns).map(tab => {
        const count = columns[tab]?.length || 0;
        const isActive = activeTab === tab;
        
        let tabStyle = 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md';
        let icon = null;
        
        if (isActive) {
          if (tab === 'Unassigned') { 
            tabStyle = 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-400/50 shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-400/20'; 
            icon = <span className="w-2 h-2 rounded-full bg-indigo-200 shadow-[0_0_8px_rgba(199,210,254,0.9)] animate-pulse" />; 
          }
          if (tab === 'To-Do') { 
            tabStyle = 'bg-gradient-to-r from-slate-800 to-slate-900 text-white border-slate-700 shadow-lg shadow-slate-900/25 ring-2 ring-slate-400/20'; 
            icon = <span className="w-2 h-2 rounded-full bg-slate-300 shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-pulse" />; 
          }
          if (tab === 'In Progress') { 
            tabStyle = 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400/50 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/20'; 
            icon = <span className="w-2 h-2 rounded-full bg-blue-200 shadow-[0_0_8px_rgba(191,219,254,0.9)] animate-pulse" />; 
          }
          if (tab === 'In Review') { 
            tabStyle = 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400/50 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/20'; 
            icon = <span className="w-2 h-2 rounded-full bg-amber-100 shadow-[0_0_8px_rgba(254,243,199,0.9)] animate-pulse" />; 
          }
          if (tab === 'Rejected') { 
            tabStyle = 'bg-gradient-to-r from-rose-600 to-red-600 text-white border-rose-400/50 shadow-lg shadow-rose-500/25 ring-2 ring-rose-400/20'; 
            icon = <span className="w-2 h-2 rounded-full bg-rose-200 shadow-[0_0_8px_rgba(254,202,202,0.9)] animate-pulse" />; 
          }
          if (tab === 'Completed') { 
            tabStyle = 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400/50 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/20'; 
            icon = <span className="w-2 h-2 rounded-full bg-emerald-100 shadow-[0_0_8px_rgba(209,250,229,0.9)] animate-pulse" />; 
          }
        } else {
           if (tab === 'Unassigned') icon = <span className="w-2 h-2 rounded-full bg-indigo-400" />;
           if (tab === 'To-Do') icon = <span className="w-2 h-2 rounded-full bg-slate-400" />;
           if (tab === 'In Progress') icon = <span className="w-2 h-2 rounded-full bg-blue-500" />;
           if (tab === 'In Review') icon = <span className="w-2 h-2 rounded-full bg-amber-500" />;
           if (tab === 'Rejected') icon = <span className="w-2 h-2 rounded-full bg-rose-500" />;
           if (tab === 'Completed') icon = <span className="w-2 h-2 rounded-full bg-emerald-500" />;
        }
        
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 font-bold text-xs transition-all duration-200 border rounded-xl whitespace-nowrap active:scale-95 flex-shrink-0 ${tabStyle} ${!isActive ? 'hover:-translate-y-0.5' : 'scale-[1.02] transform origin-bottom'}`}
          >
            {icon}
            <span className="uppercase tracking-wider font-extrabold">{tab}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default TaskTabs;

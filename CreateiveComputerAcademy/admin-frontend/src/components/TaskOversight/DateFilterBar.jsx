export const DateFilterBar = ({ filter, setFilter, customRange, setCustomRange }) => {
  const options = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'specific', label: 'Specific Date' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
    { id: 'custom', label: 'Custom Range' }
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl px-1 h-10 flex items-center gap-1 border border-slate-200 dark:border-slate-700 shadow-xs w-fit overflow-x-auto no-scrollbar flex-shrink-0">
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => setFilter(opt.id)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filter === opt.id
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
        >
          {opt.label}
        </button>
      ))}

      {filter === 'specific' && (
        <div className="flex items-center gap-1.5 ml-1.5 pl-3 border-l border-slate-200 h-6">
          <input
            type="date"
            value={customRange.start}
            onChange={e => setCustomRange(p => ({ ...p, start: e.target.value }))}
            className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 h-full [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      )}

      {filter === 'custom' && (
        <div className="flex items-center gap-1.5 ml-1.5 pl-3 border-l border-slate-200 h-6">
          <input
            type="date"
            value={customRange.start}
            onChange={e => setCustomRange(p => ({ ...p, start: e.target.value }))}
            className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 h-full [color-scheme:light] dark:[color-scheme:dark]"
          />
          <span className="text-slate-400 font-medium text-xs">to</span>
          <input
            type="date"
            value={customRange.end}
            onChange={e => setCustomRange(p => ({ ...p, end: e.target.value }))}
            className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 h-full [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      )}
    </div>
  );
};

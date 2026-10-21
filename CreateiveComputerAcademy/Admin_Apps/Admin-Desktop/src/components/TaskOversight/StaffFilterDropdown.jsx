import React from 'react';
import { FiChevronDown, FiSearch, FiUser, FiX } from 'react-icons/fi';

export const StaffFilterDropdown = ({ value, onChange, staff, apiBase }) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const ref = React.useRef(null);

  const selectedName = value; // 'all', 'unassigned', or staff name

  // Close on outside click
  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const getLabel = () => {
    if (selectedName === 'all') return 'All Staff';
    if (selectedName === 'unassigned') return 'Unassigned';
    return selectedName;
  };

  const selectedStaffObj = staff.find(s => s.name === selectedName);
  const isSelected = selectedName && selectedName !== 'all';

  return (
    <div ref={ref} className="relative flex-shrink-0">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch(''); }}
        className={`flex items-center gap-1.5 px-3 h-10 rounded-xl border transition-all outline-none text-left text-xs font-semibold shadow-xs flex-shrink-0
          ${open 
            ? 'border-blue-500 ring-2 ring-blue-500/15 bg-blue-50/50 dark:bg-slate-800 text-blue-600 dark:text-blue-400' 
            : isSelected
              ? 'bg-blue-50/70 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200'}`}
      >
        <FiUser size={13} className={`${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-500'} flex-shrink-0`} />
        <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Staff:</span>
        <div className="flex items-center gap-1.5 min-w-0">
          {selectedStaffObj?.profile_picture ? (
            <img
              src={`${apiBase}${selectedStaffObj.profile_picture}`}
              alt={selectedName}
              className="w-4 h-4 rounded-full object-cover flex-shrink-0"
            />
          ) : isSelected && selectedName !== 'unassigned' ? (
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-[8px] uppercase flex-shrink-0">
              {selectedName.charAt(0)}
            </div>
          ) : null}
          <span className="font-bold truncate max-w-[100px] sm:max-w-[120px]">{getLabel()}</span>
        </div>

        {isSelected ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange('all');
            }}
            className="p-0.5 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 text-slate-400 hover:text-blue-700 dark:hover:text-white transition-colors ml-0.5"
            title="Clear staff filter"
          >
            <FiX size={12} />
          </span>
        ) : (
          <FiChevronDown size={13} className={`text-slate-400 transition-transform flex-shrink-0 ${open ? 'rotate-180 text-blue-500' : ''}`} />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 mt-1.5 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-[300] overflow-hidden">
          {/* Search inside filter */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl px-2.5 py-1.5 border border-transparent dark:border-slate-700/50">
              <FiSearch size={14} className="text-slate-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search staff filter..."
                className="flex-1 bg-transparent text-xs outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          {/* Options List */}
          <ul className="max-h-56 overflow-y-auto py-1 custom-scrollbar">
            <li>
              <button
                type="button"
                onClick={() => { onChange('all'); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200
                  ${selectedName === 'all' ? 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400' : ''}`}
              >
                All Staff
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => { onChange('unassigned'); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200
                  ${selectedName === 'unassigned' ? 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400' : ''}`}
              >
                Unassigned
              </button>
            </li>
            <div className="h-px bg-slate-100 my-1" />
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-400 text-center font-medium">No staff found</li>
            ) : (
              filtered.map(s => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => { onChange(s.name); setOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-blue-50 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200
                      ${selectedName === s.name ? 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400' : ''}`}
                  >
                    {s.profile_picture ? (
                      <img src={`${apiBase}${s.profile_picture}`} alt={s.name} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-[9px] uppercase flex-shrink-0">
                        {s.name.charAt(0)}
                      </div>
                    )}
                    <span className="truncate flex-1">{s.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

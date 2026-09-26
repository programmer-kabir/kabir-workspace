import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FiChevronDown, FiSearch, FiTag, FiFolder } from 'react-icons/fi';

export const DeptFilterDropdown = ({ value, onChange, departments = [] }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const selectedName = value;

  useEffect(() => {
    const handler = (e) => { 
      if (ref.current && !ref.current.contains(e.target)) setOpen(false); 
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getLabel = () => selectedName === 'all' ? 'All Categories' : selectedName;

  // Curated categories list including departments and subcategories
  const items = useMemo(() => {
    const list = [
      { name: 'Graphic Design', icon: '🎨', type: 'category' },
      { name: 'Business Card', icon: '💳', type: 'subcategory' },
      { name: 'Doctor / Medical', icon: '🩺', type: 'child' },
      { name: 'Flyer & Brochure', icon: '📄', type: 'subcategory' },
      { name: 'Logo & Branding', icon: '🏷️', type: 'subcategory' },
      { name: 'Social Media Design', icon: '📱', type: 'subcategory' },
      { name: 'Web Development', icon: '💻', type: 'category' },
      { name: 'Frontend Development', icon: '🌐', type: 'subcategory' },
      { name: 'Fullstack & Backend', icon: '⚙️', type: 'subcategory' },
      { name: 'Video & Motion', icon: '🎬', type: 'category' },
      { name: 'Reels & Shorts Editing', icon: '📲', type: 'subcategory' },
      { name: 'Digital Marketing', icon: '📢', type: 'category' }
    ];

    // Add any database departments if not present
    if (Array.isArray(departments)) {
      const existing = new Set(list.map(i => i.name.toLowerCase()));
      departments.forEach(d => {
        if (d.name && !existing.has(d.name.toLowerCase())) {
          list.push({ name: d.name, icon: '📁', type: 'category' });
        }
      });
    }
    return list;
  }, [departments]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch(''); }}
        className={`flex items-center gap-2 px-3.5 h-11 rounded-2xl border transition-all outline-none text-left bg-white dark:bg-slate-800 shadow-sm flex-shrink-0
          ${open ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
      >
        <FiTag size={13} className="text-blue-500 flex-shrink-0" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category:</span>
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">{getLabel()}</span>
        <FiChevronDown size={14} className={`text-slate-400 transition-transform flex-shrink-0 ${open ? 'rotate-180 text-blue-500' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[300] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Search inside filter */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-slate-700">
              <FiSearch size={13} className="text-slate-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter by category/type..."
                className="flex-1 bg-transparent text-xs outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400"
              />
            </div>
          </div>

          <ul className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
            <li>
              <button
                type="button"
                onClick={() => { onChange('all'); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold
                  ${selectedName === 'all' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}
              >
                <span>🌟 All Categories & Subtypes</span>
                {selectedName === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
              </button>
            </li>
            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />

            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-xs text-slate-400 text-center font-medium">No category matching "{search}"</li>
            ) : (
              filtered.map((d, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => { onChange(d.name); setOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold
                    ${d.type === 'subcategory' ? 'pl-6 text-slate-600 dark:text-slate-300' : d.type === 'child' ? 'pl-8 text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100 font-bold'}
                    ${selectedName === d.name ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold' : ''}`}
                  >
                    <span className="text-xs">{d.icon}</span>
                    <span className="truncate flex-1">{d.name}</span>
                    {selectedName === d.name && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
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
export default DeptFilterDropdown;

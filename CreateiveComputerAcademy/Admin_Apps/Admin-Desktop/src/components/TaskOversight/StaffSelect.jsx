import React from 'react';
import { FiChevronDown, FiSearch, FiUser, FiUsers } from 'react-icons/fi';

export const StaffSelect = ({ value, onChange, staff, apiBase, workloads = {} }) => {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const ref = React.useRef(null);

    // Only active employees can be assigned new tasks
    const activeStaff = React.useMemo(() => {
        return (staff || []).filter(s => {
            const emp = (s.employment_status || 'active').toLowerCase();
            const acc = (s.status || 'active').toLowerCase();
            return emp !== 'resigned' && emp !== 'terminated' && emp !== 'inactive' && emp !== 'suspended' && acc === 'active';
        });
    }, [staff]);

    const selected = value === 'unassigned'
        ? { id: 'unassigned', name: 'Unassigned (Save for Later)', profile_picture: null, designation: 'Task Pool' }
        : staff.find(s => String(s.id) === String(value) || String(s.user_id) === String(value) || (s.name && String(s.name).toLowerCase() === String(value).toLowerCase()));

    const filtered = activeStaff.filter(s =>
        (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.designation || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(search.toLowerCase())
    );

    // Close on outside click
    React.useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const Avatar = ({ s, size = 'sm' }) => {
        const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
        return s?.profile_picture ? (
            <img src={`${apiBase}${s.profile_picture}`} alt={s.name}
                className={`${dim} rounded-full object-cover flex-shrink-0`} />
        ) : (
            <div className={`${dim} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
                {s ? s.name.charAt(0).toUpperCase() : <FiUser size={12} />}
            </div>
        );
    };

    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <button
                type="button"
                onClick={() => { setOpen(o => !o); setSearch(''); }}
                className={`w-full h-[42px] flex items-center gap-2.5 px-3 rounded-xl border transition-all outline-none text-left
          ${open
                        ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-slate-800'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
            >
                {selected ? (
                    <>
                        {value === 'unassigned' ? (
                            <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-dashed border-slate-300 dark:border-slate-600">
                                <FiUsers size={11} className="text-slate-400" />
                            </div>
                        ) : (
                            <Avatar s={selected} size="sm" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{selected.name}</p>
                            <p className="text-[10px] text-slate-400 truncate leading-none">{selected.designation || 'Staff'}</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <FiUser size={12} className="text-slate-400" />
                        </div>
                        <span className="flex-1 text-xs text-slate-400 font-medium">Select Staff Member</span>
                    </>
                )}
                <FiChevronDown size={14} className={`text-slate-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[999] overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700">
                            <FiSearch size={14} className="text-slate-400 flex-shrink-0" />
                            <input
                                autoFocus
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search staff..."
                                className="flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <ul className="max-h-56 overflow-y-auto py-1.5">
                        {/* Unassigned Option */}
                        <li>
                            <button
                                type="button"
                                onClick={() => { onChange('unassigned'); setOpen(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700
                  ${value === 'unassigned' ? 'bg-slate-50 dark:bg-slate-700' : ''}`}
                            >
                                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border border-dashed border-slate-300 dark:border-slate-600">
                                    <FiUsers size={14} className="text-slate-500 dark:text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">Unassigned (Save for Later)</p>
                                    <p className="text-xs text-slate-400">Keep in Task Pool</p>
                                </div>
                                {value === 'unassigned' && (
                                    <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 flex-shrink-0" />
                                )}
                            </button>
                        </li>
                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>

                        {filtered.length === 0 ? (
                            <li className="px-4 py-3 text-sm text-slate-400 text-center">No staff found</li>
                        ) : (
                            filtered.map(s => {
                                const activeCount = workloads[s.id] || 0;
                                return (
                                    <li key={s.id}>
                                        <button
                                            type="button"
                                            onClick={() => { onChange(String(s.id)); setOpen(false); }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20
                        ${String(value) === String(s.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                        >
                                            <Avatar s={s} size="md" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{s.name}</p>
                                                <p className="text-xs text-slate-400 flex items-center gap-2">
                                                    {s.designation || 'Staff'}
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${activeCount > 3 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : activeCount > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                                        {activeCount} Active Task{activeCount !== 1 ? 's' : ''}
                                                    </span>
                                                </p>
                                            </div>
                                            {String(value) === String(s.id) && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                            )}
                                        </button>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

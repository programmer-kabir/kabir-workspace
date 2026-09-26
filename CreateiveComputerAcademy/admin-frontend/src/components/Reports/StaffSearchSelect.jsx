import React, { useState, useMemo } from 'react';
import { FiChevronDown, FiSearch, FiCheck } from 'react-icons/fi';

/**
 * Custom Searchable Stylish Dropdown Component for Employee/Staff Selection
 */
const StaffSearchSelect = ({ value, onChange, options, apiBase }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectedOption = options.find(opt => String(opt.value) === String(value)) || options[0];

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(opt =>
      (opt.name && opt.name.toLowerCase().includes(q)) ||
      (opt.designation && opt.designation.toLowerCase().includes(q)) ||
      (opt.department_name && opt.department_name.toLowerCase().includes(q)) ||
      (opt.label && opt.label.toLowerCase().includes(q))
    );
  }, [options, search]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch('');
        }}
        className={`w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 border transition-all rounded-2xl h-11 px-3 outline-none text-left shadow-xs ${isOpen
          ? 'border-blue-500 ring-2 ring-blue-500/15 bg-blue-50/40 dark:bg-slate-800'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption?.profile_picture ? (
            <img
              src={`${apiBase}${selectedOption.profile_picture}`}
              alt={selectedOption.name}
              className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-[10px] uppercase flex-shrink-0">
              {selectedOption?.name ? selectedOption.name.charAt(0) : 'S'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
              {selectedOption?.name || 'Select Staff'}
            </p>
            {selectedOption?.designation && (
              <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate -mt-0.5">
                {selectedOption.designation}
              </p>
            )}
          </div>
        </div>
        <FiChevronDown
          size={16}
          className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 flex-shrink-0 ml-1.5 ${isOpen ? 'rotate-180 text-blue-500' : ''
            }`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Search Input */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-slate-700">
                <FiSearch size={14} className="text-slate-400 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search staff filter..."
                  className="flex-1 bg-transparent text-xs outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">
                  No staff found
                </div>
              ) : (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors flex items-center justify-between gap-2 ${String(value) === String(opt.value)
                      ? 'text-blue-600 bg-blue-50/60 dark:bg-blue-950/40 font-bold'
                      : 'text-slate-700 dark:text-slate-200'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {opt.profile_picture ? (
                        <img
                          src={`${apiBase}${opt.profile_picture}`}
                          alt={opt.name}
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-[10px] uppercase flex-shrink-0">
                          {opt.name ? opt.name.charAt(0) : 'S'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{opt.name}</p>
                        {opt.designation && (
                          <p className="text-[10px] text-slate-400 truncate font-normal">
                            {opt.designation} {opt.department_name ? `• ${opt.department_name}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    {String(value) === String(opt.value) && (
                      <FiCheck className="text-blue-600 flex-shrink-0 ml-1.5" size={15} />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StaffSearchSelect;

import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiCheck, FiSearch, FiX } from 'react-icons/fi';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  className = '',
  icon: Icon = null,
  searchable = true,
  disabled = false,
  renderOption = null,
  renderSelected = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, searchable]);

  // Format option objects
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt) };
    }
    return opt;
  });

  const selectedOpt = normalizedOptions.find(opt => String(opt.value) === String(value));

  // Filter options based on search query
  const filteredOptions = normalizedOptions.filter(opt => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const labelMatch = opt.label && String(opt.label).toLowerCase().includes(q);
    const subMatch = opt.subtext && String(opt.subtext).toLowerCase().includes(q);
    const badgeMatch = opt.badge && String(opt.badge).toLowerCase().includes(q);
    return labelMatch || subMatch || badgeMatch;
  });

  const shouldShowSearch = searchable && normalizedOptions.length > 5;

  return (
    <div className={`relative select-none ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs lg:text-sm font-semibold transition-all duration-200 outline-hidden cursor-pointer ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' : ''
        } ${
          isOpen
            ? 'bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-400 ring-3 ring-indigo-500/20 shadow-md shadow-indigo-500/10 text-slate-900 dark:text-white'
            : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-600'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
          {Icon && (
            <Icon className={`text-base shrink-0 transition-colors ${
              isOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
            }`} />
          )}

          {renderSelected && selectedOpt ? (
            renderSelected(selectedOpt)
          ) : selectedOpt ? (
            <div className="flex items-center gap-2 truncate">
              {selectedOpt.dot && (
                <span className={`w-2 h-2 rounded-full shrink-0 ${selectedOpt.dot}`} />
              )}
              {selectedOpt.avatar && (
                <img src={selectedOpt.avatar} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
              )}
              <span className="truncate font-semibold text-slate-900 dark:text-white">
                {selectedOpt.label}
              </span>
              {selectedOpt.subtext && (
                <span className="text-[11px] font-normal text-slate-400 dark:text-slate-400 shrink-0">
                  ({selectedOpt.subtext})
                </span>
              )}
              {selectedOpt.badge && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0">
                  {selectedOpt.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="truncate font-normal text-slate-400 dark:text-slate-500">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <FiChevronDown
            size={16}
            className={`text-slate-400 dark:text-slate-400 transition-transform duration-250 ${
              isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Popup Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[9999] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/15 dark:shadow-black/50 p-1.5 space-y-1 max-h-72 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
          {/* Search Box inside dropdown */}
          {shouldShowSearch && (
            <div className="p-1.5 pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <FiX size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options Scrollable Container */}
          <div className="overflow-y-auto space-y-1 flex-1 custom-scrollbar max-h-56 pr-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 font-medium">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs lg:text-sm font-medium transition-all text-left cursor-pointer group ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/90 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                      {renderOption ? (
                        renderOption(opt, isSelected)
                      ) : (
                        <>
                          {opt.dot && (
                            <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />
                          )}
                          {opt.avatar && (
                            <img src={opt.avatar} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                          )}
                          <div className="truncate flex flex-col">
                            <span className="truncate">{opt.label}</span>
                            {opt.subtext && (
                              <span className="text-[10px] font-normal text-slate-400 dark:text-slate-400 truncate">
                                {opt.subtext}
                              </span>
                            )}
                          </div>
                          {opt.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 ml-auto mr-1">
                              {opt.badge}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <FiCheck size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

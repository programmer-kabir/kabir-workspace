import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FiChevronDown, FiSearch, FiTag, FiFolder, FiX, FiLayers, FiChevronRight } from 'react-icons/fi';
import axios from 'axios';

const FALLBACK_TREE = [
  {
    id: 1,
    name: 'Graphic Design',
    icon: '🎨',
    subcategories: [
      {
        id: 101,
        name: 'Business Card',
        icon: '💳',
        children: [
          { id: 1001, name: 'Doctor / Medical', icon: '🩺' },
          { id: 1002, name: 'Corporate / Business', icon: '🏢' },
          { id: 1003, name: 'Personal / Freelancer', icon: '👤' },
          { id: 1004, name: 'Restaurant / Food', icon: '🍴' },
          { id: 1005, name: 'Real Estate / Agent', icon: '🏠' }
        ]
      },
      {
        id: 102,
        name: 'Flyer & Brochure',
        icon: '📄',
        children: [
          { id: 1006, name: 'Corporate Event Flyer', icon: '🎤' },
          { id: 1007, name: 'Product / Promo Flyer', icon: '🛍️' },
          { id: 1008, name: 'Tri-Fold Brochure', icon: '📑' }
        ]
      },
      {
        id: 103,
        name: 'Logo & Branding',
        icon: '🏷️',
        children: [
          { id: 1009, name: 'Minimalist / Wordmark', icon: '✨' },
          { id: 1010, name: 'Mascot / Illustrative', icon: '🦊' },
          { id: 1011, name: 'Brand Identity Kit', icon: '📦' }
        ]
      },
      {
        id: 104,
        name: 'Social Media Design',
        icon: '📱',
        children: [
          { id: 1012, name: 'Facebook / Insta Post', icon: '🖼️' },
          { id: 1013, name: 'Story / Reel Cover', icon: '📲' },
          { id: 1014, name: 'Real Estate / Property Post', icon: '🏠' },
          { id: 1015, name: 'YouTube Thumbnail', icon: '▶️' }
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'Web Development',
    icon: '💻',
    subcategories: [
      {
        id: 201,
        name: 'Frontend Development',
        icon: '🌐',
        children: [
          { id: 2001, name: 'Landing Page UI', icon: '🚀' },
          { id: 2002, name: 'Dashboard / Admin UI', icon: '📊' }
        ]
      },
      {
        id: 202,
        name: 'Fullstack & Backend',
        icon: '⚙️',
        children: [
          { id: 2003, name: 'REST API Development', icon: '🔌' },
          { id: 2004, name: 'Database Architecture', icon: '🗄️' }
        ]
      }
    ]
  },
  {
    id: 3,
    name: 'Video & Motion',
    icon: '🎬',
    subcategories: [
      {
        id: 301,
        name: 'Reels & Shorts Editing',
        icon: '📲',
        children: [
          { id: 3001, name: 'Talking Head Reel', icon: '🗣️' },
          { id: 3002, name: 'Product Promo Video', icon: '✨' }
        ]
      }
    ]
  },
  {
    id: 4,
    name: 'Digital Marketing',
    icon: '📢',
    subcategories: [
      {
        id: 401,
        name: 'Social Media Marketing',
        icon: '📣',
        children: [
          { id: 4001, name: 'FB / Insta Ad Campaign', icon: '🎯' }
        ]
      }
    ]
  }
];

// Single Generic Dropdown component for consistent UX
const FilterSelectMenu = ({
  label,
  value,
  placeholder,
  icon: Icon,
  badgeColor = 'text-blue-500',
  options = [],
  onSelect,
  disabled = false,
  allowClear = true,
  onClear
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedItem = useMemo(() => {
    if (!value || value === 'all') return null;
    return options.find(o => o.name === value || o.id === value) || { name: value, icon: '🏷️' };
  }, [value, options]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(o => (o.name || '').toLowerCase().includes(q));
  }, [options, search]);

  const isSelected = value && value !== 'all';

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen(o => !o);
            setSearch('');
          }
        }}
        className={`flex items-center gap-1.5 px-3 h-10 rounded-full border text-left transition-all outline-none text-xs font-semibold shadow-xs ${
          disabled
            ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
            : open
              ? 'border-blue-500 ring-2 ring-blue-500/15 bg-blue-50/50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
              : isSelected
                ? 'bg-blue-50/70 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200'
        }`}
      >
        {Icon && <Icon size={13} className={`${isSelected ? 'text-blue-600 dark:text-blue-400' : badgeColor} flex-shrink-0`} />}
        <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">{label}:</span>
        <span className="font-bold truncate max-w-[110px] sm:max-w-[130px]">
          {selectedItem ? (
            <span className="inline-flex items-center gap-1">
              <span>{selectedItem.icon}</span>
              <span className="truncate">{selectedItem.name}</span>
            </span>
          ) : (
            placeholder
          )}
        </span>

        {isSelected && allowClear ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              if (onClear) onClear();
              else onSelect('all');
            }}
            className="p-0.5 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 text-slate-400 hover:text-blue-700 dark:hover:text-white transition-colors ml-0.5"
            title="Clear"
          >
            <FiX size={12} />
          </span>
        ) : (
          <FiChevronDown
            size={13}
            className={`text-slate-400 transition-transform flex-shrink-0 ${open ? 'rotate-180 text-blue-500' : ''}`}
          />
        )}
      </button>

      {open && !disabled && (
        <div className="absolute left-0 mt-1.5 w-60 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[350] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {options.length > 5 && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl px-2 py-1.5 border border-slate-200 dark:border-slate-700">
                <FiSearch size={12} className="text-slate-400 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={`Search ${label.toLowerCase()}...`}
                  className="flex-1 bg-transparent text-xs outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400"
                />
              </div>
            </div>
          )}

          <ul className="max-h-56 overflow-y-auto py-1 custom-scrollbar">
            <li>
              <button
                type="button"
                onClick={() => {
                  onSelect('all');
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-xs transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold ${
                  value === 'all' || !value
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                <span>🌟 All {label}s</span>
                {(value === 'all' || !value) && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
              </button>
            </li>
            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />

            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2.5 text-xs text-slate-400 text-center font-medium">No options</li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isItemSel = value === opt.name || value === opt.id;
                return (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(opt.name, opt);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold ${
                        isItemSel
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <span className="text-sm flex-shrink-0">{opt.icon || '🏷️'}</span>
                      <span className="truncate flex-1">{opt.name}</span>
                      {isItemSel && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
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

export const CascadingCategoryFilter = ({
  category = 'all',
  subcategory = 'all',
  childCategory = 'all',
  onCategoryChange,
  onSubcategoryChange,
  onChildCategoryChange,
  apiBase = ''
}) => {
  const [tree, setTree] = useState(FALLBACK_TREE);

  // Fetch full category hierarchy tree from database API
  useEffect(() => {
    const fetchTree = async () => {
      try {
        const baseUrl = (apiBase || import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '') + '/';
        const res = await axios.get(`${baseUrl}api/categories/get_categories.php`);
        if (res.data && res.data.status === 'success' && res.data.data?.tree?.length > 0) {
          setTree(res.data.data.tree);
        }
      } catch (err) {
        // use fallback tree
      }
    };
    fetchTree();
  }, [apiBase]);

  // 1. Main Categories List
  const mainCategories = useMemo(() => {
    return tree.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon || '🎨',
      subcategories: cat.subcategories || []
    }));
  }, [tree]);

  // 2. Active Main Category Object
  const activeMainCatObj = useMemo(() => {
    if (!category || category === 'all') return null;
    return tree.find(c => c.name === category || c.id === category) || null;
  }, [tree, category]);

  // 3. Subcategories of the selected category
  const subcategoriesList = useMemo(() => {
    if (!activeMainCatObj || !activeMainCatObj.subcategories) return [];
    return activeMainCatObj.subcategories.map(s => ({
      id: s.id,
      name: s.name,
      icon: s.icon || '📄',
      children: s.children || []
    }));
  }, [activeMainCatObj]);

  // 4. Active Subcategory Object
  const activeSubCatObj = useMemo(() => {
    if (!subcategory || subcategory === 'all' || !activeMainCatObj) return null;
    return (activeMainCatObj.subcategories || []).find(s => s.name === subcategory || s.id === subcategory) || null;
  }, [activeMainCatObj, subcategory]);

  // 5. Child Categories of the selected subcategory
  const childCategoriesList = useMemo(() => {
    if (!activeSubCatObj || !activeSubCatObj.children) return [];
    return activeSubCatObj.children.map(c => ({
      id: c.id,
      name: c.name,
      icon: c.icon || '🏷️'
    }));
  }, [activeSubCatObj]);

  const hasCategory = category && category !== 'all';
  const hasSubcategory = subcategory && subcategory !== 'all';

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* ── Level 1: Main Category Filter ── */}
      <FilterSelectMenu
        label="Category"
        placeholder="All Categories"
        value={category}
        icon={FiTag}
        badgeColor="text-blue-500"
        options={mainCategories}
        onSelect={(val) => onCategoryChange(val)}
        onClear={() => onCategoryChange('all')}
      />

      {/* ── Level 2: Subcategory (Appears progressively once category is selected) ── */}
      {hasCategory && subcategoriesList.length > 0 && (
        <>
          <FiChevronRight size={13} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
          <FilterSelectMenu
            label="Sub"
            placeholder="All Subcategories"
            value={subcategory}
            icon={FiLayers}
            badgeColor="text-indigo-500"
            options={subcategoriesList}
            onSelect={(val) => onSubcategoryChange(val)}
            onClear={() => onSubcategoryChange('all')}
          />
        </>
      )}

      {/* ── Level 3: Child Category / Niche (Appears progressively once subcategory is selected) ── */}
      {hasCategory && hasSubcategory && childCategoriesList.length > 0 && (
        <>
          <FiChevronRight size={13} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
          <FilterSelectMenu
            label="Niche"
            placeholder="All Niches"
            value={childCategory}
            icon={FiFolder}
            badgeColor="text-purple-500"
            options={childCategoriesList}
            onSelect={(val) => onChildCategoryChange(val)}
            onClear={() => onChildCategoryChange('all')}
          />
        </>
      )}
    </div>
  );
};

export default CascadingCategoryFilter;

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FiSearch, 
  FiPlus, 
  FiCheck, 
  FiTag, 
  FiX, 
  FiChevronDown,
  FiCornerDownRight,
  FiZap
} from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'sonner';

const FALLBACK_CATEGORIES = [
  {
    id: 1,
    name: 'Graphic Design',
    icon: '🎨',
    color: 'from-pink-500 to-rose-600',
    subcategories: [
      {
        id: 101,
        name: 'Business Card',
        icon: '💳',
        children: [
          { id: 1001, name: 'Doctor / Medical', icon: '🩺', default_checklists: ['Check Doctor Name & Degree/Designation', 'Include BMDC Reg Number', 'Chamber Address, Visiting Hours & Serial Phone', 'Size 3.5x2 in, 300DPI CMYK with 0.125 Bleed', 'QR Code for Clinic Location'] },
          { id: 1002, name: 'Corporate / Business', icon: '🏢', default_checklists: ['Company Logo, Name & Employee Title', 'Corporate Email, Direct Phone & Address', 'Executive Double-Sided Layout'] },
          { id: 1003, name: 'Personal / Freelancer', icon: '👤', default_checklists: ['Name, Specialty, Social Handles, Portfolio Link'] },
          { id: 1004, name: 'Restaurant / Food', icon: '🍴', default_checklists: ['Restaurant Name, Reservation Phone & Address', 'Online Menu QR Code'] },
          { id: 1005, name: 'Real Estate / Agent', icon: '🏠', default_checklists: ['Agent Photo, Brokerage Name & License No.', 'Website, Direct Phone, Luxury Styling'] }
        ]
      },
      {
        id: 102,
        name: 'Flyer & Brochure',
        icon: '📄',
        children: [
          { id: 1006, name: 'Corporate Event Flyer', icon: '🎤', default_checklists: ['Event Title, Date, Time & Venue', 'Keynote Speakers & Agenda', 'Registration Link / QR Code'] },
          { id: 1007, name: 'Product / Promo Flyer', icon: '🛍️', default_checklists: ['High-res product images & discount badges', 'Call to Action'] },
          { id: 1008, name: 'Tri-Fold Brochure', icon: '📑', default_checklists: ['Inside & Outside 6-Panel Alignment', 'About Us, Services & Contact Details'] }
        ]
      },
      {
        id: 103,
        name: 'Logo & Branding',
        icon: '🏷️',
        children: [
          { id: 1009, name: 'Minimalist / Wordmark', icon: '✨', default_checklists: ['Custom typography & kerning', 'Light/Dark/Monochrome versions', 'Favicon / 1:1 Icon Adaptation'] },
          { id: 1010, name: 'Mascot / Illustrative', icon: '🦊', default_checklists: ['Detailed vector illustration', 'Scalable for web and print'] },
          { id: 1011, name: 'Brand Identity Kit', icon: '📦', default_checklists: ['Color palette (RGB, CMYK, HEX)', 'Typography rules', 'Mockups & Social kit'] }
        ]
      },
      {
        id: 104,
        name: 'Social Media Design',
        icon: '📱',
        children: [
          { id: 1012, name: 'Facebook / Insta Post', icon: '🖼️', default_checklists: ['1080x1080px Canvas', 'Catchy headline', 'Brand logo & CTA'] },
          { id: 1013, name: 'Story / Reel Cover', icon: '📲', default_checklists: ['1080x1920px with safe area margins'] },
          { id: 1014, name: 'YouTube Thumbnail', icon: '▶️', default_checklists: ['1280x720px High contrast dramatic visuals', 'Large bold text < 5 words'] }
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'Web Development',
    icon: '💻',
    color: 'from-blue-600 to-indigo-700',
    subcategories: [
      {
        id: 201,
        name: 'Frontend Development',
        icon: '🌐',
        children: [
          { id: 2001, name: 'Landing Page UI', icon: '🚀', default_checklists: ['Mobile/Tablet/Desktop responsive', 'Smooth scrolling animations', 'Fast Core Web Vitals'] },
          { id: 2002, name: 'Dashboard / Admin UI', icon: '📊', default_checklists: ['Dark/Light mode support', 'Data tables & charts integration'] }
        ]
      },
      {
        id: 202,
        name: 'Fullstack & Backend',
        icon: '⚙️',
        children: [
          { id: 2003, name: 'REST API Development', icon: '🔌', default_checklists: ['JWT Auth & validation', 'SQL injection security check', 'Postman documentation'] },
          { id: 2004, name: 'Database Architecture', icon: '🗄️', default_checklists: ['Indexed queries & Foreign Key integrity', 'Automated backup setup'] }
        ]
      }
    ]
  },
  {
    id: 3,
    name: 'Video & Motion',
    icon: '🎬',
    color: 'from-violet-600 to-purple-800',
    subcategories: [
      {
        id: 301,
        name: 'Reels & Shorts Editing',
        icon: '📲',
        children: [
          { id: 3001, name: 'Talking Head Reel', icon: '🗣️', default_checklists: ['Hook in first 3 seconds', 'Animated dynamic subtitles', 'SFX transitions'] },
          { id: 3002, name: 'Product Promo Video', icon: '✨', default_checklists: ['High-energy cuts', 'Color grading & music sync'] }
        ]
      },
      {
        id: 302,
        name: 'Motion Graphics',
        icon: '🎞️',
        children: [
          { id: 3003, name: 'Logo Animation', icon: '🌟', default_checklists: ['Clean vector easing', 'Sound FX sync', 'Transparent Alpha output'] },
          { id: 3004, name: 'Explainer Video', icon: '📽️', default_checklists: ['Storyboard pacing', 'Voiceover alignment', 'Infographic animation'] }
        ]
      }
    ]
  },
  {
    id: 4,
    name: 'Digital Marketing',
    icon: '📢',
    color: 'from-orange-500 to-amber-600',
    subcategories: [
      {
        id: 401,
        name: 'Social Media Ads',
        icon: '🎯',
        children: [
          { id: 4001, name: 'FB / Insta Ad Campaign', icon: '📣', default_checklists: ['Target audience persona', 'Compelling copywriting', 'Pixel tracking check'] },
          { id: 4002, name: 'Google Ads & SEM', icon: '🔍', default_checklists: ['Negative keyword list', 'High-intent search terms', 'Conversion tracking URL'] }
        ]
      }
    ]
  }
];

export const CategorySelect = ({ 
  value, 
  onChange, 
  onTemplateSelect,
  departments = [], 
  apiBase = '' 
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categoriesTree, setCategoriesTree] = useState(FALLBACK_CATEGORIES);
  const [activeTabId, setActiveTabId] = useState(1);
  const [flatIndex, setFlatIndex] = useState([]);

  // Quick Add state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddLevel, setQuickAddLevel] = useState('child'); // 'category' | 'subcategory' | 'child'
  const [quickAddParentId, setQuickAddParentId] = useState(null);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddIcon, setQuickAddIcon] = useState('🏷️');
  const [savingQuickAdd, setSavingQuickAdd] = useState(false);

  const ref = useRef(null);
  const searchInputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setIsQuickAddOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Autofocus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [open]);

  // Sync active tab with current value on mount / open
  useEffect(() => {
    if (value && categoriesTree.length > 0) {
      const matched = categoriesTree.find(cat => 
        value.startsWith(cat.name) || 
        cat.subcategories?.some(sub => value.includes(sub.name))
      );
      if (matched) {
        setActiveTabId(matched.id);
      }
    }
  }, [value, categoriesTree]);

  // Fetch from API
  const fetchCategories = async () => {
    try {
      const baseUrl = (apiBase || import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '') + '/';
      const res = await axios.get(`${baseUrl}api/categories/get_categories.php`);
      if (res.data && res.data.status === 'success' && res.data.data?.tree?.length > 0) {
        setCategoriesTree(res.data.data.tree);
        if (res.data.data.flat) {
          setFlatIndex(res.data.data.flat);
        }
        if (!activeTabId && res.data.data.tree[0]) {
          setActiveTabId(res.data.data.tree[0].id);
        }
      }
    } catch (e) {
      // Fallback
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [apiBase]);

  // Searchable flat list
  const computedFlatList = useMemo(() => {
    if (flatIndex.length > 0) return flatIndex;

    const list = [];
    categoriesTree.forEach(m => {
      if (!m.subcategories || m.subcategories.length === 0) {
        list.push({
          category_id: m.id,
          subcategory_id: null,
          child_category_id: null,
          category_name: m.name,
          full_path: m.name,
          icon: m.icon || '🎨',
          checklists: m.default_checklists || []
        });
      } else {
        m.subcategories.forEach(s => {
          if (!s.children || s.children.length === 0) {
            list.push({
              category_id: m.id,
              subcategory_id: s.id,
              child_category_id: null,
              category_name: m.name,
              subcategory_name: s.name,
              full_path: `${m.name} > ${s.name}`,
              icon: s.icon || m.icon || '📁',
              checklists: s.default_checklists || []
            });
          } else {
            s.children.forEach(c => {
              list.push({
                category_id: m.id,
                subcategory_id: s.id,
                child_category_id: c.id,
                category_name: m.name,
                subcategory_name: s.name,
                child_name: c.name,
                full_path: `${m.name} > ${s.name} > ${c.name}`,
                icon: c.icon || s.icon || m.icon || '🏷️',
                checklists: c.default_checklists || s.default_checklists || []
              });
            });
          }
        });
      }
    });
    return list;
  }, [categoriesTree, flatIndex]);

  // Filtered search results
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase().trim();
    return computedFlatList.filter(item => 
      (item.full_path || '').toLowerCase().includes(q) ||
      (item.child_name || '').toLowerCase().includes(q) ||
      (item.subcategory_name || '').toLowerCase().includes(q) ||
      (item.category_name || '').toLowerCase().includes(q)
    );
  }, [search, computedFlatList]);

  // Current active main category
  const activeCategory = useMemo(() => {
    return categoriesTree.find(c => c.id === activeTabId) || categoriesTree[0] || null;
  }, [categoriesTree, activeTabId]);

  const handleSelectHierarchy = (item) => {
    const fullPath = item.full_path || item.category_path || (item.category_name ? `${item.category_name}${item.subcategory_name ? ' > ' + item.subcategory_name : ''}${item.child_name ? ' > ' + item.child_name : ''}` : item.name);
    
    onChange(fullPath, {
      category_id: item.category_id || item.id,
      subcategory_id: item.subcategory_id || null,
      child_category_id: item.child_category_id || null,
      category_path: fullPath,
      icon: item.icon,
      credit: item.credit || 5
    });

    if (onTemplateSelect && item.checklists && item.checklists.length > 0) {
      onTemplateSelect({
        checklists: item.checklists,
        specs: item.specs || null,
        estimated_minutes: item.estimated_minutes || 90
      });
      toast.success(`Checklists applied for ${item.child_name || item.name || 'category'}`, { duration: 2500 });
    }

    setOpen(false);
    setSearch('');
  };

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    if (!quickAddName.trim()) return;

    setSavingQuickAdd(true);
    try {
      const baseUrl = (apiBase || import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '') + '/';
      const payload = {
        name: quickAddName.trim(),
        icon: quickAddIcon.trim() || '🏷️',
        level: quickAddLevel,
        parent_id: quickAddParentId || (activeCategory ? activeCategory.id : null)
      };

      const res = await axios.post(`${baseUrl}api/categories/create_category.php`, payload);
      if (res.data && res.data.status === 'success') {
        toast.success(`Added "${quickAddName}"!`);
        await fetchCategories();
        
        handleSelectHierarchy({
          category_id: res.data.data?.category_id || activeCategory?.id,
          subcategory_id: res.data.data?.subcategory_id || null,
          child_category_id: res.data.data?.id || null,
          full_path: res.data.data?.category_path || `${activeCategory?.name} > ${quickAddName}`,
          name: quickAddName,
          icon: quickAddIcon
        });

        setIsQuickAddOpen(false);
        setQuickAddName('');
      } else {
        // Local fallback
        const full = `${activeCategory?.name || 'Custom'} > ${quickAddName}`;
        handleSelectHierarchy({
          id: Date.now(),
          name: quickAddName.trim(),
          icon: quickAddIcon.trim() || '🏷️',
          full_path: full
        });
        setIsQuickAddOpen(false);
        setQuickAddName('');
      }
    } catch (err) {
      const full = `${activeCategory?.name || 'Custom'} > ${quickAddName}`;
      handleSelectHierarchy({
        id: Date.now(),
        name: quickAddName.trim(),
        icon: quickAddIcon.trim() || '🏷️',
        full_path: full
      });
      setIsQuickAddOpen(false);
      setQuickAddName('');
    } finally {
      setSavingQuickAdd(false);
    }
  };

  const currentIcon = useMemo(() => {
    if (!value) return '🏷️';
    const matched = computedFlatList.find(f => f.full_path === value || f.child_name === value || f.category_name === value);
    return matched?.icon || '🏷️';
  }, [value, computedFlatList]);

  return (
    <div className="relative w-full" ref={ref}>
      {/* ── 1. Clean Trigger Button ── */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition-all duration-150 ${
          open 
            ? 'border-blue-500 ring-2 ring-blue-500/10 bg-white dark:bg-slate-800 shadow-sm' 
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="text-base flex-shrink-0">{currentIcon}</span>
          {value ? (
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {value.replace(/ > /g, ' › ')}
              </span>
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              Select Category, Subcategory or Niche...
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('', { category_id: null, subcategory_id: null, child_category_id: null, category_path: '' });
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Clear selection"
            >
              <FiX size={13} />
            </span>
          )}
          <FiChevronDown 
            size={15} 
            className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-blue-500' : ''}`} 
          />
        </div>
      </button>

      {/* ── 2. Tabbed Popover Dropdown Panel ── */}
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-full min-w-[340px] sm:min-w-[440px] max-w-[500px] rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header Search Bar */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/80">
            <div className="relative flex items-center">
              <FiSearch className="absolute left-3 text-slate-400" size={14} />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search any category, subcategory or niche..."
                className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <FiX size={13} />
                </button>
              )}
            </div>
          </div>

          {/* ── MODE 1: SEARCH RESULTS ── */}
          {search.trim() ? (
            <div className="max-h-[340px] overflow-y-auto p-2 space-y-1">
              {searchResults.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                    <FiSearch size={16} />
                  </div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No match found for "{search}"</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">You can add it as a new niche below.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickAddName(search.trim());
                      setQuickAddLevel('child');
                      setIsQuickAddOpen(true);
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 transition-colors"
                  >
                    <FiPlus size={13} /> Quick Add "{search.trim()}"
                  </button>
                </div>
              ) : (
                <>
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Search Matches ({searchResults.length})
                  </div>
                  {searchResults.map((item, idx) => {
                    const isSelected = value === item.full_path;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectHierarchy(item)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                          isSelected 
                            ? 'bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="text-base flex-shrink-0">{item.icon || '🏷️'}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                              {item.child_name || item.subcategory_name || item.category_name}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate">
                              {item.full_path.replace(/ > /g, ' › ')}
                            </p>
                          </div>
                        </div>

                        {item.checklists && item.checklists.length > 0 && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/40 flex-shrink-0 ml-2">
                            {item.checklists.length} Tasks
                          </span>
                        )}

                        {isSelected && (
                          <FiCheck size={14} className="text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          ) : (
            
            /* ── MODE 2: TABBED SELECTOR ── */
            <div>
              {/* Category Horizontal Tabs */}
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 dark:border-slate-700/80 bg-white dark:bg-slate-800 overflow-x-auto no-scrollbar">
                {categoriesTree.map((cat) => {
                  const isActive = activeTabId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveTabId(cat.id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                          : 'bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{cat.icon || '📁'}</span>
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Subcategories & Niches Chips Container */}
              <div className="max-h-[340px] overflow-y-auto p-3 space-y-3.5">
                {activeCategory && activeCategory.subcategories && activeCategory.subcategories.length > 0 ? (
                  activeCategory.subcategories.map((sub) => {
                    const subPath = `${activeCategory.name} > ${sub.name}`;
                    const isSubSelected = value === subPath;

                    return (
                      <div key={sub.id} className="space-y-1.5">
                        {/* Subcategory Label & Direct Select */}
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleSelectHierarchy({
                              category_id: activeCategory.id,
                              subcategory_id: sub.id,
                              category_name: activeCategory.name,
                              subcategory_name: sub.name,
                              full_path: subPath,
                              icon: sub.icon || activeCategory.icon,
                              credit: sub.credit || activeCategory.credit || 5
                            })}
                            className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 group transition-colors"
                          >
                            <span className="text-sm">{sub.icon || '📄'}</span>
                            <span>{sub.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              (Select All)
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setQuickAddParentId(sub.id);
                              setQuickAddLevel('child');
                              setIsQuickAddOpen(true);
                            }}
                            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                          >
                            <FiPlus size={10} /> Add Niche
                          </button>
                        </div>

                        {/* Specific Niches as Clean Clickable Chips */}
                        <div className="flex flex-wrap gap-1.5">
                          {sub.children && sub.children.length > 0 ? (
                            sub.children.map((child) => {
                              const childPath = `${activeCategory.name} > ${sub.name} > ${child.name}`;
                              const isSelected = value === childPath;

                              return (
                                <button
                                  key={child.id}
                                  type="button"
                                  onClick={() => handleSelectHierarchy({
                                    category_id: activeCategory.id,
                                    subcategory_id: sub.id,
                                    child_category_id: child.id,
                                    category_name: activeCategory.name,
                                    subcategory_name: sub.name,
                                    child_name: child.name,
                                    full_path: childPath,
                                    icon: child.icon || sub.icon || activeCategory.icon,
                                    credit: child.credit || sub.credit || activeCategory.credit || 5,
                                    checklists: child.default_checklists || [],
                                    specs: child.default_specs || null,
                                    estimated_minutes: child.estimated_minutes || 90
                                  })}
                                  className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                                    isSelected
                                      ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-500 text-blue-600 dark:text-blue-300 shadow-xs font-bold ring-1 ring-blue-500/20'
                                      : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-300 shadow-xs'
                                  }`}
                                >
                                  <span className="text-xs">{child.icon || '🏷️'}</span>
                                  <span>{child.name}</span>
                                  {child.default_checklists && child.default_checklists.length > 0 && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 ml-0.5" title={`${child.default_checklists.length} checklists included`} />
                                  )}
                                </button>
                              );
                            })
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectHierarchy({
                                category_id: activeCategory.id,
                                subcategory_id: sub.id,
                                category_name: activeCategory.name,
                                subcategory_name: sub.name,
                                full_path: subPath,
                                icon: sub.icon || activeCategory.icon
                              })}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                            >
                              Select {sub.name}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs font-semibold">
                    No subcategories available under {activeCategory?.name}.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Footer / Quick Add Form ── */}
          <div className="p-2.5 border-t border-slate-100 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90">
            {!isQuickAddOpen ? (
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => {
                    setQuickAddName('');
                    setQuickAddLevel('child');
                    setQuickAddParentId(activeCategory?.subcategories?.[0]?.id || null);
                    setIsQuickAddOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <FiPlus size={13} /> Add Custom Niche to {activeCategory?.name || 'Category'}
                </button>

                <span className="text-[10px] text-slate-400 font-medium">
                  Auto-syncs checklists
                </span>
              </div>
            ) : (
              <form onSubmit={handleQuickAddSubmit} className="space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <FiTag size={12} className="text-blue-500" />
                    Add New Niche Type:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsQuickAddOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <FiX size={13} />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={quickAddIcon}
                    onChange={(e) => setQuickAddIcon(e.target.value)}
                    placeholder="🏷️"
                    className="w-9 h-7 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-blue-500"
                    title="Emoji Icon"
                  />
                  <input
                    type="text"
                    autoFocus
                    required
                    value={quickAddName}
                    onChange={(e) => setQuickAddName(e.target.value)}
                    placeholder="e.g. Real Estate Brochure or TikTok Ad"
                    className="flex-1 h-7 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={savingQuickAdd}
                    className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                  >
                    {savingQuickAdd ? 'Saving...' : 'Add'}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default CategorySelect;

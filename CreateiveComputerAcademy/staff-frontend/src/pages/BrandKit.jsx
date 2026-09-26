import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiCopy, FiCheck, FiDownload, FiExternalLink, FiSearch,
  FiDroplet, FiLayers, FiType, FiFolder, FiShield, FiRefreshCw,
  FiAlertCircle, FiGrid
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { toast } from 'sonner';

const BrandKit = () => {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'palettes' | 'colors' | 'logos' | 'fonts' | 'templates' | 'guidelines'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedColorGroup, setSelectedColorGroup] = useState('all');
  const [resources, setResources] = useState({
    colors: [],
    palettes: [],
    logos: [],
    fonts: [],
    templates: [],
    guidelines: []
  });

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // Fetch Resources from Backend
  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/brand/get_brand_resources.php`);
      if (res.data.status === 'success') {
        const allItems = (res.data.data || [])
          .filter(item => (item.approval_status || 'approved') === 'approved')
          .map(item => {
            if ((!item.category || item.category === '') && item.value?.includes(',')) {
              return { ...item, category: 'palette' };
            }
            return item;
          });

        const grp = res.data.grouped || {};
        const palettes = (grp.palettes && grp.palettes.length > 0)
          ? grp.palettes
          : allItems.filter(x => x.category === 'palette');

        setResources({
          colors: grp.colors || [],
          palettes: palettes,
          logos: grp.logos || [],
          fonts: grp.fonts || [],
          templates: grp.templates || [],
          guidelines: grp.guidelines || []
        });
      } else {
        setResources({ colors: [], palettes: [], logos: [], fonts: [], templates: [], guidelines: [] });
      }
    } catch (err) {
      console.error('Failed to load brand resources:', err);
      setResources({ colors: [], palettes: [], logos: [], fonts: [], templates: [], guidelines: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // Copy HEX code
  const handleCopyHex = (hex, label) => {
    navigator.clipboard.writeText(hex);
    setCopiedCode(hex);
    toast.success(`Copied: ${hex} (${label})`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Download asset helper
  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'cca-brand-asset';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.info(`Downloading ${filename || 'asset'}...`);
  };

  const totalCount =
    (resources.colors?.length || 0) +
    (resources.palettes?.length || 0) +
    (resources.logos?.length || 0) +
    (resources.fonts?.length || 0) +
    (resources.templates?.length || 0) +
    (resources.guidelines?.length || 0);

  const tabDefs = [
    { key: 'all', label: 'All Assets', count: totalCount },
    { key: 'palettes', label: 'Color Palettes (Color Hunt)', icon: <FiGrid size={15} />, count: resources.palettes?.length || 0 },
    { key: 'colors', label: 'Brand Colors', icon: <FiDroplet size={15} />, count: resources.colors?.length || 0 },
    { key: 'logos', label: 'Official Logos', icon: <FiLayers size={15} />, count: resources.logos?.length || 0 },
    { key: 'fonts', label: 'Typography & Fonts', icon: <FiType size={15} />, count: resources.fonts?.length || 0 },
    { key: 'templates', label: 'Master Templates', icon: <FiFolder size={15} />, count: resources.templates?.length || 0 },
    { key: 'guidelines', label: 'Design Guidelines', icon: <FiShield size={15} />, count: resources.guidelines?.length || 0 }
  ];

  // Helper filter function
  const filterItems = (list = []) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item =>
      item.title?.toLowerCase().includes(q) ||
      item.value?.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.format_tag?.toLowerCase().includes(q)
    );
  };

  // Extract pure font name (e.g. "Roboto (Google Fonts)" -> "Roboto", or from URL "specimen/Roboto")
  const extractFontFamilyName = (font) => {
    if (!font) return '';
    if (font.value && font.value.includes('fonts.google.com/specimen/')) {
      const match = font.value.match(/specimen\/([^/?#]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]).replace(/\+/g, ' ');
      }
    }
    return (font.title || '').replace(/\s*\(.*?\)\s*/g, '').trim();
  };

  // Dynamically inject Google Font into <head> at runtime (Zero index.html edits needed!)
  const dynamicallyLoadFont = (fontFamily) => {
    if (!fontFamily || fontFamily === 'inherit') return;
    const cleanId = `gfont-${fontFamily.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    if (document.getElementById(cleanId)) return;

    const link = document.createElement('link');
    link.id = cleanId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:ital,wght@0,400;0,600;0,700;1,400&display=swap`;
    document.head.appendChild(link);
  };

  // Resolve authentic typography preview styling per font
  const getFontDetails = (font) => {
    const t = (font?.title || '').toLowerCase();
    const tag = (font?.format_tag || '').toLowerCase();
    const cleanName = extractFontFamilyName(font);

    // Auto-load font from Google Fonts dynamically if external
    if (cleanName) {
      dynamicallyLoadFont(cleanName);
    }

    if (t.includes('hind siliguri') || tag.includes('siliguri')) {
      return {
        family: "'Hind Siliguri', sans-serif",
        sample: 'সবার উপরে মানুষ সত্য, তাহার উপরে নাই • ক্রিয়েটিভ কম্পিউটার একাডেমি',
        sub: 'Modern Bengali Sans-Serif • Aa Bb Cc 1 2 3',
        weight: '600'
      };
    }
    if (t.includes('tiro bangla') || tag.includes('tiro')) {
      return {
        family: "'Tiro Bangla', serif",
        sample: 'জ্ঞানই শক্তি, দক্ষতাই ভবিষ্যৎ • অফিশিয়াল প্রশংসাপত্র ও স্মারক',
        sub: 'Formal Bengali Serif • ১ ২ ৩ ৪ ৫ ৬ ৭ ৮ ৯ ০',
        weight: '400'
      };
    }
    if (t.includes('kalpurush') || tag.includes('kalpurush')) {
      return {
        family: "'Kalpurush', 'Hind Siliguri', sans-serif",
        sample: 'আমার সোনার বাংলা, আমি তোমায় ভালোবাসি • গণপ্রজাতন্ত্রী বাংলাদেশ',
        sub: 'Classic Bengali Standard • অ আ ক খ গ ঘ ঙ',
        weight: '500'
      };
    }
    if (t.includes('montserrat')) {
      return {
        family: "'Montserrat', sans-serif",
        sample: 'CREATIVE COMPUTER ACADEMY • EXCELLENCE IN IT',
        sub: 'Bold Geometric Display • ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        weight: '800'
      };
    }
    if (t.includes('poppins')) {
      return {
        family: "'Poppins', sans-serif",
        sample: 'Empowering Next-Generation Tech Leaders & Designers',
        sub: 'Friendly Modern Geometric • 0123456789',
        weight: '600'
      };
    }
    if (t.includes('inter')) {
      return {
        family: "'Inter', sans-serif",
        sample: 'The quick brown fox jumps over the lazy dog • Clean UI Architecture',
        sub: 'Standard Interface Typography • Regular & Medium',
        weight: '500'
      };
    }
    if (t.includes('roboto')) {
      return {
        family: "'Roboto', sans-serif",
        sample: 'The quick brown fox jumps over the lazy dog • Google Android Standard',
        sub: 'Modern Grotesque Sans-Serif • Aa Bb 1 2 3',
        weight: '500'
      };
    }
    return {
      family: cleanName ? `'${cleanName}', sans-serif` : 'inherit',
      sample: 'The quick brown fox jumps over the lazy dog • Creativity is intelligence',
      sub: `${cleanName || 'Custom'} Typography • Aa Bb 1 2 3`,
      weight: '500'
    };
  };

  const filteredColors = filterItems(resources.colors);
  const colorGroups = ['all', ...Array.from(new Set(resources.colors?.map(c => c.format_tag).filter(Boolean)))];
  const visibleColors = filteredColors.filter(c => selectedColorGroup === 'all' || c.format_tag === selectedColorGroup);
  const filteredPalettes = filterItems(resources.palettes);
  const filteredLogos = filterItems(resources.logos);
  const filteredFonts = filterItems(resources.fonts);
  const filteredTemplates = filterItems(resources.templates);
  const filteredGuidelines = filterItems(resources.guidelines);

  const hasAnyItems =
    filteredColors.length > 0 ||
    filteredPalettes.length > 0 ||
    filteredLogos.length > 0 ||
    filteredFonts.length > 0 ||
    filteredTemplates.length > 0 ||
    filteredGuidelines.length > 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ──────── Hero Banner ──────── */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/20 shadow-inner">
              <HiSparkles size={20} className="animate-pulse" />
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-blue-200">
              CCA Creative Asset Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Official Brand Kit & Resources
          </h1>
          <p className="text-sm sm:text-base text-blue-100/80 font-medium max-w-2xl leading-relaxed">
            Official academy logos, color palettes, typography, master Google Drive templates, and quality guidelines for designers and staff.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-center justify-center px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
            <span className="text-2xl font-black text-amber-300">{totalCount}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100/70">Total Assets</span>
          </div>
          <button
            type="button"
            onClick={fetchResources}
            disabled={loading}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Refresh assets"
          >
            <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ──────── Filter & Search Bar ──────── */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
          {tabDefs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80 shrink-0">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search assets (name, hex code, or tag)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* ──────── Content Sections ──────── */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading resources...</p>
        </div>
      ) : !hasAnyItems ? (
        <div className="py-24 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 p-8 space-y-3">
          <FiAlertCircle className="mx-auto text-slate-400" size={40} />
          <h3 className="text-base font-black text-slate-700 dark:text-slate-300">No resources found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No resources match your search or filter. Resources added from the admin panel will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. Color Hunt Style Multi-Color Palettes Section */}
          {(activeTab === 'all' || activeTab === 'palettes') && filteredPalettes.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <FiGrid size={16} />
                    </span>
                    <span>Color Palettes & Harmonies (Color Hunt Style)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Harmonious color combinations for banners, posters, and digital design. Click any color strip to copy HEX code.
                  </p>
                </div>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-3 py-1 rounded-xl border border-purple-200 dark:border-purple-800 self-start sm:self-auto">
                  {filteredPalettes.length} Palettes
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredPalettes.map((palette) => {
                  const colors = palette.value?.split(',').map(s => s.trim()).filter(Boolean) || [];
                  const heights = ['h-20', 'h-14', 'h-11', 'h-10', 'h-9'];

                  return (
                    <div
                      key={palette.id}
                      className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/90 dark:border-slate-700 shadow-xs hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
                    >
                      {/* Stacked Horizontal Stripes (Color Hunt Style) */}
                      <div className="w-full flex flex-col cursor-pointer overflow-hidden rounded-t-3xl border-b border-slate-100 dark:border-slate-700/60">
                        {colors.map((hex, i) => {
                          const isCopied = copiedCode === hex;
                          const isLight = hex.toLowerCase() === '#ffffff' || hex.toLowerCase() === '#fff';
                          const hClass = heights[i] || 'h-11';

                          return (
                            <div
                              key={i}
                              onClick={() => handleCopyHex(hex, `${palette.title} (Shade ${i + 1})`)}
                              className={`w-full ${hClass} transition-all relative flex items-center justify-between px-3 group/band hover:brightness-105 active:scale-[0.99]`}
                              style={{ backgroundColor: hex }}
                              title={`Click to copy: ${hex}`}
                            >
                              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-md opacity-0 group-hover/band:opacity-100 transition-opacity shadow-xs ${
                                isLight ? 'bg-black/25 text-slate-900' : 'bg-white/30 text-white'
                              }`}>
                                {isCopied ? 'Copied!' : hex}
                              </span>
                              <span className={`text-[10px] font-bold opacity-0 group-hover/band:opacity-100 transition-opacity ${
                                isLight ? 'text-slate-900' : 'text-white'
                              }`}>
                                {isCopied ? <FiCheck size={12} /> : <FiCopy size={12} />}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Card Details & Actions */}
                      <div className="p-4 flex flex-col justify-between gap-3 flex-1 bg-white dark:bg-slate-800">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                              {palette.title}
                            </h4>
                            {palette.format_tag && (
                              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                {palette.format_tag}
                              </span>
                            )}
                          </div>
                          {palette.subtitle && (
                            <p className="text-xs text-slate-400 mt-1 truncate">
                              {palette.subtitle}
                            </p>
                          )}
                        </div>

                        {/* Bottom Actions Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                          <span className="text-[11px] text-slate-400 font-medium">
                            {colors.length} Color Shades
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(colors.join(', '));
                              toast.success(`Palette copied: ${colors.join(', ')}`);
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-900/40 text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Copy all color codes together"
                          >
                            <FiCopy size={12} />
                            <span>Copy All</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Single Colors Section */}
          {(activeTab === 'all' || activeTab === 'colors') && filteredColors.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <FiDroplet size={15} />
                  </span>
                  <span>Brand Colors & Swatches</span>
                </h3>

                {/* Sub-palette Filter Pills */}
                {colorGroups.length > 2 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                    {colorGroups.map(grp => (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => setSelectedColorGroup(grp)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                          selectedColorGroup === grp
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {grp === 'all' ? 'All Groups' : grp}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleColors.map((color) => {
                  const isCopied = copiedCode === color.value;
                  const isGradient = color.value?.toLowerCase().includes('gradient');
                  const isLight = !isGradient && (color.value.toLowerCase() === '#ffffff' || color.value.toLowerCase() === '#fff');
                  const bgStyle = isGradient ? { background: color.value } : { backgroundColor: color.value };

                  return (
                    <div
                      key={color.id}
                      onClick={() => handleCopyHex(color.value, color.title)}
                      className="group p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500/50 transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden"
                    >
                      {/* Top Swatch */}
                      <div
                        className={`w-full h-24 rounded-xl shadow-inner transition-transform group-hover:scale-[1.02] ${
                          isLight ? 'border border-slate-300 dark:border-slate-600' : ''
                        }`}
                        style={bgStyle}
                      />

                      {/* Details */}
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                            {color.title}
                          </h4>
                          {color.format_tag && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                              {color.format_tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 truncate">
                          {color.subtitle || 'CCA Official Palette'}
                        </p>
                      </div>

                      {/* Bottom Button Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 truncate max-w-[150px]">
                          {color.value}
                        </span>
                        <span className={`text-xs font-bold flex items-center gap-1 shrink-0 transition-all ${
                          isCopied ? 'text-emerald-500' : 'text-slate-400 group-hover:text-blue-600'
                        }`}>
                          {isCopied ? <FiCheck size={14} /> : <FiCopy size={13} />}
                          <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Logos Section */}
          {(activeTab === 'all' || activeTab === 'logos') && filteredLogos.length > 0 && (
            <div className="space-y-3.5">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FiLayers size={15} />
                </span>
                <span>Official Logos & Stamps</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredLogos.map((logo) => {
                  const logoUrl = logo.value?.startsWith('http') || logo.value?.startsWith('/')
                    ? logo.value
                    : `${API_BASE}${logo.value}`;

                  return (
                    <div
                      key={logo.id}
                      className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between gap-4"
                    >
                      {/* Logo Preview Frame */}
                      <div className="w-full h-44 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-6 relative overflow-hidden group">
                        <img
                          src={logoUrl}
                          alt={logo.title}
                          className="max-h-full max-w-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
                          onError={(e) => { e.target.src = '/logo.png'; }}
                        />
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                            {logo.title}
                          </h4>
                          {logo.format_tag && (
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                              {logo.format_tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {logo.subtitle || 'High-resolution official asset'}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <button
                          onClick={() => handleDownload(logoUrl, `${logo.title.replace(/\s+/g, '_')}.png`)}
                          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <FiDownload size={14} />
                          <span>Download Asset</span>
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(logoUrl);
                            toast.success('Asset URL Copied!');
                          }}
                          className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Copy Link"
                        >
                          <FiCopy size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Fonts Section */}
          {(activeTab === 'all' || activeTab === 'fonts') && filteredFonts.length > 0 && (
            <div className="space-y-3.5">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <FiType size={15} />
                </span>
                <span>Typography & Fonts Library</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFonts.map((font) => {
                  const fontDetails = getFontDetails(font);
                  return (
                    <div
                      key={font.id}
                      className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-base font-black text-slate-800 dark:text-slate-100">
                            {font.title}
                          </h4>
                          {font.format_tag && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              {font.format_tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {font.subtitle}
                        </p>
                      </div>

                      {/* Live Typography Preview in its real font */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 space-y-2 overflow-hidden transition-all group-hover:border-amber-400/40">
                        <p
                          className="text-base text-slate-800 dark:text-slate-100 leading-relaxed"
                          style={{ fontFamily: fontDetails.family, fontWeight: fontDetails.weight }}
                        >
                          "{fontDetails.sample}"
                        </p>
                        <p
                          className="text-xs text-slate-400 dark:text-slate-500 font-mono tracking-wide"
                          style={{ fontFamily: fontDetails.family }}
                        >
                          {fontDetails.sub}
                        </p>
                      </div>

                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-400">
                          {font.value?.startsWith('http') ? 'Google / Web Font' : 'Local Resource'}
                        </span>
                        <a
                          href={font.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                        >
                          <span>Get Font</span>
                          <FiExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Templates Section */}
          {(activeTab === 'all' || activeTab === 'templates') && filteredTemplates.length > 0 && (
            <div className="space-y-3.5">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <FiFolder size={15} />
                </span>
                <span>Master Templates & Drive Kits</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                          <FiFolder size={20} />
                        </span>
                        {template.format_tag && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {template.format_tag}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 pt-1">
                        {template.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {template.subtitle}
                      </p>
                    </div>

                    <a
                      href={template.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Open Template Link</span>
                      <FiExternalLink size={13} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Guidelines Section */}
          {(activeTab === 'all' || activeTab === 'guidelines') && filteredGuidelines.length > 0 && (
            <div className="space-y-3.5">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <FiShield size={15} />
                </span>
                <span>Design Guidelines & Standards</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGuidelines.map((rule, idx) => (
                  <div
                    key={rule.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-xs">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                        {rule.title}
                      </h4>
                      {rule.format_tag && (
                        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                          {rule.format_tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-8">
                      {rule.value}
                    </p>
                    {rule.subtitle && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 pl-8 pt-1">
                        Category: {rule.subtitle}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandKit;

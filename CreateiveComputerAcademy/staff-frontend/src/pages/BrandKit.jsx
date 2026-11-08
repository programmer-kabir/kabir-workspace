import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiSearch, FiDroplet, FiLayers, FiType, FiFolder, FiShield,
  FiRefreshCw, FiAlertCircle, FiGrid
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { toast } from 'sonner';
import BrandPalettesSection from '../components/BrandKit/BrandPalettesSection';
import BrandColorsSection from '../components/BrandKit/BrandColorsSection';
import BrandLogosSection from '../components/BrandKit/BrandLogosSection';
import BrandFontsSection from '../components/BrandKit/BrandFontsSection';
import BrandTemplatesGuidelines from '../components/BrandKit/BrandTemplatesGuidelines';

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
          {(activeTab === 'all' || activeTab === 'palettes') && (
            <BrandPalettesSection
              filteredPalettes={filteredPalettes}
              copiedCode={copiedCode}
              handleCopyHex={handleCopyHex}
            />
          )}

          {/* 2. Single Colors Section */}
          {(activeTab === 'all' || activeTab === 'colors') && (
            <BrandColorsSection
              visibleColors={visibleColors}
              colorGroups={colorGroups}
              selectedColorGroup={selectedColorGroup}
              setSelectedColorGroup={setSelectedColorGroup}
              copiedCode={copiedCode}
              handleCopyHex={handleCopyHex}
            />
          )}

          {/* 3. Logos Section */}
          {(activeTab === 'all' || activeTab === 'logos') && (
            <BrandLogosSection
              filteredLogos={filteredLogos}
              handleDownload={handleDownload}
              API_BASE={API_BASE}
            />
          )}

          {/* 4. Fonts Section */}
          {(activeTab === 'all' || activeTab === 'fonts') && (
            <BrandFontsSection
              filteredFonts={filteredFonts}
            />
          )}

          {/* 5. Templates & Guidelines Section */}
          <BrandTemplatesGuidelines
            activeTab={activeTab}
            filteredTemplates={filteredTemplates}
            filteredGuidelines={filteredGuidelines}
          />
        </div>
      )}
    </div>
  );
};

export default BrandKit;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FiPlus, FiSearch, FiRefreshCw, FiExternalLink, FiUploadCloud,
  FiDroplet, FiLayers, FiType, FiFolder, FiShield, FiX,
  FiAlertCircle, FiGrid, FiShuffle, FiCheck, FiClock, FiXCircle,
  FiCopy, FiDownload, FiUser
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { toast } from 'sonner';

const BrandResources = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'palettes' | 'colors' | 'logos' | 'fonts' | 'templates' | 'guidelines'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'approved' | 'pending' | 'rejected'
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  // Submit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    category: 'palette',
    title: '',
    value: '#14532D,#16A34A,#86EFAC,#FEF08A',
    subtitle: '',
    preview_url: '',
    format_tag: 'Palette',
    sort_order: 0,
    is_active: 1
  });

  // Multi-color Palette Builder State
  const [paletteColors, setPaletteColors] = useState(['#14532D', '#16A34A', '#86EFAC', '#FEF08A']);

  const harmonyTemplates = [
    { name: 'Eco Nature Green', colors: ['#14532D', '#16A34A', '#86EFAC', '#FEF08A'], tag: 'Nature / Organic' },
    { name: 'Sunset Warmth', colors: ['#7C2D12', '#EA580C', '#FB923C', '#FEF3C7'], tag: 'Marketing / Warm' },
    { name: 'Midnight Cyber Neon', colors: ['#09090B', '#3B0764', '#7C3AED', '#22D3EE'], tag: 'Social Media / Dark' },
    { name: 'Corporate Trust Navy', colors: ['#0F172A', '#1E40AF', '#38BDF8', '#F1F5F9'], tag: 'Corporate / UI' },
    { name: 'Pastel Dream', colors: ['#F472B6', '#FBBF24', '#A7F3D0', '#EFF6FF'], tag: 'Soft / Creative' },
    { name: 'Vintage Earth & Clay', colors: ['#44403C', '#78716C', '#D97706', '#FEF3C7'], tag: 'Vintage / Minimal' }
  ];

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // Helper: HSL to HEX converter
  const hslToHex = (h, s, l) => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
  };

  const getHueName = (h) => {
    if (h >= 345 || h < 15) return 'Crimson Rose';
    if (h >= 15 && h < 45) return 'Sunset Orange';
    if (h >= 45 && h < 70) return 'Amber Gold';
    if (h >= 70 && h < 150) return 'Emerald Forest';
    if (h >= 150 && h < 195) return 'Teal Ocean';
    if (h >= 195 && h < 255) return 'Royal Navy';
    if (h >= 255 && h < 290) return 'Cyber Violet';
    if (h >= 290 && h < 345) return 'Neon Magenta';
    return 'Chromatic';
  };

  // Algorithmic Harmony Generator
  const generateRandomHarmony = () => {
    const styles = ['analogous', 'complementary', 'triadic', 'monochromatic', 'warm_sunset', 'cyber_neon'];
    const chosenStyle = styles[Math.floor(Math.random() * styles.length)];
    const baseHue = Math.floor(Math.random() * 360);
    let newColors = [];
    let themeName = '';
    let tag = 'Harmony';

    if (chosenStyle === 'analogous') {
      newColors = [
        hslToHex(baseHue, 75, 18),
        hslToHex((baseHue + 25) % 360, 70, 42),
        hslToHex((baseHue + 50) % 360, 85, 62),
        hslToHex((baseHue + 15) % 360, 30, 96)
      ];
      themeName = `${getHueName(baseHue)} Analogous`;
      tag = 'Analogous';
    } else if (chosenStyle === 'complementary') {
      const compHue = (baseHue + 180) % 360;
      newColors = [
        hslToHex(baseHue, 75, 18),
        hslToHex(baseHue, 60, 45),
        hslToHex(compHue, 85, 55),
        hslToHex(compHue, 35, 96)
      ];
      themeName = `${getHueName(baseHue)} & ${getHueName(compHue)}`;
      tag = 'Complementary';
    } else if (chosenStyle === 'triadic') {
      newColors = [
        hslToHex(baseHue, 70, 20),
        hslToHex((baseHue + 120) % 360, 65, 48),
        hslToHex((baseHue + 240) % 360, 80, 62),
        hslToHex(baseHue, 25, 96)
      ];
      themeName = `${getHueName(baseHue)} Triadic`;
      tag = 'Triadic';
    } else if (chosenStyle === 'monochromatic') {
      newColors = [
        hslToHex(baseHue, 80, 16),
        hslToHex(baseHue, 70, 38),
        hslToHex(baseHue, 75, 64),
        hslToHex(baseHue, 40, 94)
      ];
      themeName = `${getHueName(baseHue)} Monochrome`;
      tag = 'Monochrome';
    } else if (chosenStyle === 'cyber_neon') {
      newColors = [
        '#0F172A',
        hslToHex(baseHue, 90, 48),
        hslToHex((baseHue + 60) % 360, 95, 60),
        '#F8FAFC'
      ];
      themeName = `${getHueName(baseHue)} Cyber Neon`;
      tag = 'Cyber / UI';
    } else {
      newColors = [
        hslToHex(baseHue, 65, 24),
        hslToHex((baseHue + 30) % 360, 75, 52),
        hslToHex((baseHue + 60) % 360, 85, 70),
        hslToHex(baseHue, 45, 96)
      ];
      themeName = `${getHueName(baseHue)} Sunset Glow`;
      tag = 'Warm / Sunset';
    }

    setPaletteColors(newColors);
    setFormData(prev => ({
      ...prev,
      title: themeName,
      format_tag: tag,
      subtitle: `${tag} 4-color palette proposed for creative graphics`
    }));
    toast.success(`Generated: ${themeName}`);
  };

  // Determine light/dark color contrast
  const isLightColor = (hex) => {
    if (!hex || !hex.startsWith('#')) return false;
    const c = hex.replace('#', '');
    if (c.length < 6) return false;
    const r = parseInt(c.substr(0, 2), 16) || 0;
    const g = parseInt(c.substr(2, 2), 16) || 0;
    const b = parseInt(c.substr(4, 2), 16) || 0;
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  };

  // Dynamic Google Font Loader
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

  const getFontDetails = (font) => {
    const t = (font?.title || '').toLowerCase();
    const tag = (font?.format_tag || '').toLowerCase();
    const cleanName = extractFontFamilyName(font);

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
    return {
      family: cleanName ? `'${cleanName}', sans-serif` : 'inherit',
      sample: 'The quick brown fox jumps over the lazy dog • Creativity is intelligence',
      sub: `${cleanName || 'Custom'} Typography • Aa Bb 1 2 3`,
      weight: '500'
    };
  };

  // Fetch Resources directly from API
  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/brand/get_brand_resources.php?all=1`);
      if (res.data.status === 'success') {
        const normalized = (res.data.data || []).map(item => {
          if ((!item.category || item.category === '') && item.value?.includes(',')) {
            return { ...item, category: 'palette' };
          }
          return item;
        });
        setResources(normalized);
      }
    } catch (err) {
      console.error('Error fetching brand resources:', err);
      toast.error('Failed to load brand resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // Screen EyeDropper
  const handlePickColorFromScreen = async () => {
    if (!window.EyeDropper) {
      toast.info('EyeDropper is not supported on this browser. Please use the color picker.');
      return;
    }
    try {
      const dropper = new window.EyeDropper();
      const res = await dropper.open();
      if (res?.sRGBHex) {
        setFormData(prev => ({ ...prev, value: res.sRGBHex.toUpperCase() }));
        toast.success(`Color: ${res.sRGBHex.toUpperCase()}`);
      }
    } catch {
      // User cancelled picker
    }
  };

  // Copy Hex
  const handleCopyHex = (hex, label) => {
    navigator.clipboard.writeText(hex);
    setCopiedCode(hex);
    toast.success(`Copied: ${hex} (${label})`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Open Submit Modal
  const handleOpenSubmit = (defaultCategory = 'palette') => {
    const cat = defaultCategory === 'all' ? 'palette' : defaultCategory;
    if (cat === 'palette') {
      setPaletteColors(['#14532D', '#16A34A', '#86EFAC', '#FEF08A']);
    }
    setFormData({
      category: cat,
      title: '',
      value: cat === 'color' ? '#3B82F6' : cat === 'palette' ? '#14532D,#16A34A,#86EFAC,#FEF08A' : '',
      subtitle: '',
      preview_url: '',
      format_tag: cat === 'color' ? 'Primary' : cat === 'palette' ? 'Poster / Social Media' : cat === 'logo' ? 'PNG' : '',
      sort_order: resources.length + 1,
      is_active: 1
    });
    setModalOpen(true);
  };

  // File Upload for Logos / Assets
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);
    data.append('action', 'upload_asset');

    setUploading(true);
    try {
      const res = await axios.post(`${API_BASE}api/brand/manage_brand_resource.php`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status === 'success') {
        setFormData(prev => ({
          ...prev,
          value: res.data.url,
          format_tag: res.data.format || prev.format_tag
        }));
        toast.success('File uploaded successfully!');
      } else {
        toast.error(res.data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('File upload error:', err);
      toast.error('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Submit Resource (Pending Admin Approval!)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalValue = formData.category === 'palette' ? paletteColors.join(',') : formData.value;
    if (!formData.title.trim() || !finalValue.trim()) {
      toast.error('Title and Value are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        action: 'create',
        ...formData,
        value: finalValue,
        created_by: currentUser?.name || 'Reviewer',
        created_by_role: 'reviewer',
        approval_status: 'pending'
      };

      const res = await axios.post(`${API_BASE}api/brand/manage_brand_resource.php`, payload);
      if (res.data.status === 'success') {
        toast.success('Resource submitted successfully! It is now pending Admin approval.');
        setModalOpen(false);
        fetchResources();
      } else {
        toast.error(res.data.message || 'Submission failed');
      }
    } catch (err) {
      console.error('Error submitting resource:', err);
      toast.error('Failed to submit resource');
    } finally {
      setSaving(false);
    }
  };

  // Counts for status
  const pendingCount = resources.filter(r => r.approval_status === 'pending').length;
  const approvedCount = resources.filter(r => (r.approval_status || 'approved') === 'approved').length;
  const rejectedCount = resources.filter(r => r.approval_status === 'rejected').length;

  // Filter Items
  const filterList = (items = []) => {
    return items.filter(item => {
      const itemStatus = item.approval_status || 'approved';
      const matchesStatus = statusFilter === 'all' || itemStatus === statusFilter;
      if (!matchesStatus) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title?.toLowerCase().includes(q) ||
        item.value?.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.format_tag?.toLowerCase().includes(q) ||
        item.created_by?.toLowerCase().includes(q)
      );
    });
  };

  const allFiltered = filterList(resources);
  const filteredPalettes = allFiltered.filter(r => r.category === 'palette');
  const filteredColors = allFiltered.filter(r => r.category === 'color');
  const filteredLogos = allFiltered.filter(r => r.category === 'logo');
  const filteredFonts = allFiltered.filter(r => r.category === 'font');
  const filteredTemplates = allFiltered.filter(r => r.category === 'template');
  const filteredGuidelines = allFiltered.filter(r => r.category === 'guideline');

  const tabDefs = [
    { key: 'all', label: 'All Assets', count: allFiltered.length },
    { key: 'palettes', label: 'Color Palettes', icon: <FiGrid size={15} />, count: filteredPalettes.length },
    { key: 'colors', label: 'Brand Colors', icon: <FiDroplet size={15} />, count: filteredColors.length },
    { key: 'logos', label: 'Official Logos', icon: <FiLayers size={15} />, count: filteredLogos.length },
    { key: 'fonts', label: 'Typography & Fonts', icon: <FiType size={15} />, count: filteredFonts.length },
    { key: 'templates', label: 'Master Templates', icon: <FiFolder size={15} />, count: filteredTemplates.length },
    { key: 'guidelines', label: 'Design Guidelines', icon: <FiShield size={15} />, count: filteredGuidelines.length }
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ──────── Hero Banner (Always crisp & bright in both Light & Dark modes) ──────── */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[#ffffff]/15">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#ffffff]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#ffffff]/20 backdrop-blur-md flex items-center justify-center text-amber-300 border border-[#ffffff]/30 shadow-inner">
              <HiSparkles size={20} className="animate-pulse" />
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-blue-100">
              CCA Reviewer Asset Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#ffffff] drop-shadow-sm">
            Brand Kit & Resource Hub
          </h1>
          <p className="text-sm sm:text-base text-blue-100 font-medium max-w-2xl leading-relaxed">
            View approved brand assets, color palettes, typography, and templates. Reviewers can propose new color harmonies and creative resources for Admin approval.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={fetchResources}
            disabled={loading}
            className="p-3 bg-[#ffffff]/15 hover:bg-[#ffffff]/25 text-[#ffffff] rounded-2xl border border-[#ffffff]/30 transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Refresh assets"
          >
            <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={() => handleOpenSubmit(activeTab === 'all' ? 'palette' : activeTab === 'palettes' ? 'palette' : activeTab.slice(0, -1))}
            className="px-5 py-3 bg-[#ffffff] hover:bg-slate-100 text-indigo-700 hover:text-indigo-900 font-black text-sm rounded-2xl transition-all shadow-xl flex items-center gap-2 active:scale-95 cursor-pointer border border-[#ffffff]/60"
          >
            <FiPlus size={18} className="text-indigo-600" />
            <span>Submit New Resource</span>
          </button>
        </div>
      </div>

      {/* ──────── Filter & Search Bar ──────── */}
      <div className="space-y-3">
        <div className="glass rounded-2xl p-3 border border-dark-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
            {tabDefs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-brand-600 text-[#ffffff] shadow-sm'
                    : 'bg-dark-700 hover:bg-dark-600 text-white/70 hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === tab.key ? 'bg-white/25 text-[#ffffff]' : 'bg-dark-800 text-white/60'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72 shrink-0">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={15} />
            <input
              type="text"
              placeholder="Search assets or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-dark-700 border border-dark-800 rounded-xl text-xs font-medium text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {/* Status Filter Sub-bar */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
            Approval Filter:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-brand-600 text-[#ffffff] shadow-2xs'
                  : 'glass text-white/70 border border-dark-800 hover:bg-dark-700'
              }`}
            >
              All Assets ({resources.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-[#ffffff] shadow-2xs'
                  : 'glass text-emerald-600 dark:text-emerald-400 border border-dark-800 hover:bg-emerald-500/10'
              }`}
            >
              <FiCheck size={12} />
              <span>Approved ({approvedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-[#ffffff] shadow-2xs'
                  : 'glass text-amber-600 dark:text-amber-400 border border-dark-800 hover:bg-amber-500/10'
              } ${pendingCount > 0 ? 'ring-2 ring-amber-400/40' : ''}`}
            >
              <FiClock size={12} className={pendingCount > 0 ? 'animate-spin-slow' : ''} />
              <span>Pending Admin Review ({pendingCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'rejected'
                  ? 'bg-rose-600 text-[#ffffff] shadow-2xs'
                  : 'glass text-rose-600 dark:text-rose-400 border border-dark-800 hover:bg-rose-500/10'
              }`}
            >
              <FiXCircle size={12} />
              <span>Rejected ({rejectedCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ──────── Content Sections ──────── */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-brand-500 border-t-transparent" />
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Loading resources...</p>
        </div>
      ) : allFiltered.length === 0 ? (
        <div className="py-24 text-center glass rounded-3xl border border-dark-800 p-8 space-y-3">
          <FiAlertCircle className="mx-auto text-white/40" size={40} />
          <h3 className="text-base font-black text-white">No resources found</h3>
          <p className="text-xs text-white/50 max-w-md mx-auto">
            No brand resources match your filter. Click "Submit New Resource" to propose an asset!
          </p>
          <button
            type="button"
            onClick={() => handleOpenSubmit('palette')}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-[#ffffff] font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FiPlus size={14} /> Submit Resource
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. Color Palettes Section */}
          {(activeTab === 'all' || activeTab === 'palettes') && filteredPalettes.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <FiGrid size={16} />
                    </span>
                    <span>Color Palettes & Harmonies (Color Hunt Style)</span>
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Harmonious color combinations for digital banners & UI. Click any stripe to copy HEX code.
                  </p>
                </div>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-3 py-1 rounded-xl border border-purple-500/20 self-start sm:self-auto">
                  {filteredPalettes.length} Palettes
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredPalettes.map((palette) => {
                  const colors = palette.value?.split(',').map(s => s.trim()).filter(Boolean) || [];
                  const heights = ['h-20', 'h-14', 'h-11', 'h-10', 'h-9'];
                  const isPending = palette.approval_status === 'pending';
                  const isRejected = palette.approval_status === 'rejected';

                  return (
                    <div
                      key={palette.id}
                      className="glass rounded-3xl border border-dark-800 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
                    >
                      {/* Stacked Horizontal Stripes */}
                      <div className="w-full flex flex-col cursor-pointer overflow-hidden rounded-t-3xl border-b border-dark-800 relative">
                        {/* Approval Status Badge overlay */}
                        {isPending && (
                          <span className="absolute top-2 right-2 z-10 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-md flex items-center gap-1 animate-pulse">
                            <FiClock size={10} /> Pending Approval
                          </span>
                        )}
                        {isRejected && (
                          <span className="absolute top-2 right-2 z-10 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-md flex items-center gap-1">
                            <FiXCircle size={10} /> Rejected
                          </span>
                        )}

                        {colors.map((hex, i) => {
                          const isCopied = copiedCode === hex;
                          const isLight = isLightColor(hex);
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
                      <div className="p-4 flex flex-col justify-between gap-3 flex-1 bg-transparent">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-black text-white truncate">
                              {palette.title}
                            </h4>
                            {palette.format_tag && (
                              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                {palette.format_tag}
                              </span>
                            )}
                          </div>
                          {palette.subtitle && (
                            <p className="text-xs text-white/60 mt-1 truncate">
                              {palette.subtitle}
                            </p>
                          )}
                          <p className="text-[10px] text-white/40 mt-1 flex items-center gap-1">
                            <FiUser size={10} />
                            <span>Submitted by: {palette.created_by || 'Admin'}</span>
                          </p>
                        </div>

                        {/* Bottom Actions Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-dark-800">
                          <span className="text-[11px] text-white/50 font-medium">
                            {colors.length} Color Shades
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(colors.join(', '));
                              toast.success(`Palette copied: ${colors.join(', ')}`);
                            }}
                            className="px-2.5 py-1.5 bg-dark-700 hover:bg-dark-600 text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-dark-800"
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
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FiDroplet size={15} />
                </span>
                <span>Brand Colors & Swatches</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredColors.map((color) => {
                  const isCopied = copiedCode === color.value;
                  const isPending = color.approval_status === 'pending';
                  const isLight = isLightColor(color.value);

                  return (
                    <div
                      key={color.id}
                      onClick={() => handleCopyHex(color.value, color.title)}
                      className="p-4 rounded-3xl glass border border-dark-800 shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between gap-3 relative overflow-hidden"
                    >
                      {isPending && (
                        <span className="absolute top-3 right-3 z-10 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-sm">
                          <FiClock size={10} /> Pending
                        </span>
                      )}

                      <div
                        className="w-full h-24 rounded-2xl shadow-inner border border-dark-800 flex items-center justify-center relative overflow-hidden transition-transform group-hover:scale-[1.02]"
                        style={{ backgroundColor: color.value }}
                      >
                        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg backdrop-blur-md transition-opacity shadow-xs ${
                          isLight ? 'bg-black/20 text-slate-900' : 'bg-white/30 text-white'
                        } ${isCopied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          {isCopied ? 'Copied!' : color.value}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-black text-white truncate">
                            {color.title}
                          </h4>
                          {color.format_tag && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-dark-700 text-white/70 border border-dark-800">
                              {color.format_tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/60 truncate">
                          {color.subtitle || color.value}
                        </p>
                        <p className="text-[10px] text-white/40 flex items-center gap-1">
                          <FiUser size={10} />
                          <span>{color.created_by || 'Admin'}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Logos Section */}
          {(activeTab === 'all' || activeTab === 'logos') && filteredLogos.length > 0 && (
            <div className="space-y-3.5">
              <h3 className="text-base font-black text-white flex items-center gap-2">
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
                  const isPending = logo.approval_status === 'pending';

                  return (
                    <div
                      key={logo.id}
                      className="p-5 rounded-3xl glass border border-dark-800 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between gap-4 relative"
                    >
                      {isPending && (
                        <span className="absolute top-4 right-4 z-10 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-sm">
                          <FiClock size={10} /> Pending
                        </span>
                      )}

                      <div className="w-full h-40 rounded-2xl bg-dark-700 border border-dark-800 flex items-center justify-center p-6 relative overflow-hidden group">
                        <img
                          src={logoUrl}
                          alt={logo.title}
                          className="max-h-full max-w-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
                          onError={(e) => { e.target.src = '/logo.png'; }}
                        />
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-white">
                          {logo.title}
                        </h4>
                        <p className="text-xs text-white/60">
                          {logo.subtitle || 'High-resolution official asset'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-dark-800">
                        <a
                          href={logoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-[#ffffff] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <FiDownload size={13} />
                          <span>Download Asset</span>
                        </a>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(logoUrl);
                            toast.success('Asset URL Copied!');
                          }}
                          className="px-3.5 py-2 bg-dark-700 hover:bg-dark-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer border border-dark-800"
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

          {/* 4. Fonts Section */}
          {(activeTab === 'all' || activeTab === 'fonts') && filteredFonts.length > 0 && (
            <div className="space-y-3.5">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <FiType size={15} />
                </span>
                <span>Typography & Fonts Library</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFonts.map((font) => {
                  const fontDetails = getFontDetails(font);
                  const isPending = font.approval_status === 'pending';

                  return (
                    <div
                      key={font.id}
                      className="p-5 rounded-3xl glass border border-dark-800 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between gap-3 group relative"
                    >
                      {isPending && (
                        <span className="absolute top-4 right-4 z-10 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-sm">
                          <FiClock size={10} /> Pending
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-base font-black text-white">
                            {font.title}
                          </h4>
                          {font.format_tag && (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              {font.format_tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/60 mt-1">
                          {font.subtitle}
                        </p>
                      </div>

                      {/* Live Typography Preview */}
                      <div className="p-4 rounded-2xl bg-dark-700 border border-dark-800 space-y-2 overflow-hidden transition-all group-hover:border-amber-400/40">
                        <p
                          className="text-base text-white leading-relaxed"
                          style={{ fontFamily: fontDetails.family, fontWeight: fontDetails.weight }}
                        >
                          "{fontDetails.sample}"
                        </p>
                        <p
                          className="text-xs text-white/50 font-mono tracking-wide"
                          style={{ fontFamily: fontDetails.family }}
                        >
                          {fontDetails.sub}
                        </p>
                      </div>

                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-white/40">
                          {font.value?.startsWith('http') ? 'Google / Web Font' : 'Local Resource'}
                        </span>
                        <a
                          href={font.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-[#ffffff] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
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

          {/* 5. Master Templates Section (Fixed for Light & Dark mode) */}
          {(activeTab === 'all' || activeTab === 'templates') && filteredTemplates.length > 0 && (
            <div className="space-y-3.5">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <FiFolder size={15} />
                </span>
                <span>Master Templates & Drive Kits</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-5 rounded-3xl glass border border-dark-800 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
                          <FiFolder size={20} />
                        </span>
                        {template.format_tag && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-dark-700 text-white/70 border border-dark-800">
                            {template.format_tag}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-white pt-1">
                        {template.title}
                      </h4>
                      <p className="text-xs text-white/60 leading-relaxed">
                        {template.subtitle}
                      </p>
                    </div>

                    <a
                      href={template.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-dark-700 hover:bg-dark-600 border border-dark-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:text-brand-400"
                    >
                      <span>Open Template Link</span>
                      <FiExternalLink size={13} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Guidelines Section */}
          {(activeTab === 'all' || activeTab === 'guidelines') && filteredGuidelines.length > 0 && (
            <div className="space-y-3.5">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <FiShield size={15} />
                </span>
                <span>Design Guidelines & Standards</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGuidelines.map((rule, idx) => (
                  <div
                    key={rule.id}
                    className="p-5 rounded-3xl glass border border-dark-800 shadow-sm space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-xs border border-rose-500/20">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-black text-white">
                        {rule.title}
                      </h4>
                      {rule.format_tag && (
                        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          {rule.format_tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed pl-8">
                      {rule.value}
                    </p>
                    {rule.subtitle && (
                      <p className="text-[11px] text-white/40 pl-8 pt-1">
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

      {/* ──────── Submit Resource Modal ──────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-dark-900 rounded-3xl border border-dark-800 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-dark-800 flex items-center justify-between bg-dark-900 shrink-0">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <FiPlus className="text-brand-400" />
                  <span>Propose Brand Resource (Reviewer Submission)</span>
                </h3>
                <p className="text-[11px] text-white/50 font-medium">
                  This resource will be submitted to the Admin for approval.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-dark-700 cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                {/* Category & Title */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-white mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        const c = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          category: c,
                          value: c === 'color' ? '#3B82F6' : c === 'palette' ? paletteColors.join(',') : '',
                          format_tag: c === 'color' ? 'Primary' : c === 'palette' ? 'Palette' : c === 'logo' ? 'PNG' : ''
                        }));
                      }}
                      className="w-full bg-dark-700 border border-dark-800 rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                    >
                      <option value="palette">4-Color Palette</option>
                      <option value="color">Single Color</option>
                      <option value="logo">Official Logo</option>
                      <option value="font">Typography & Font</option>
                      <option value="template">Master Template</option>
                      <option value="guideline">Design Guideline</option>
                    </select>
                  </div>

                  <div className="sm:col-span-8">
                    <label className="block text-xs font-bold text-white mb-1">
                      Resource Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Neon Cyber Glow, Hind Siliguri, CCA Primary Navy"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-dark-700 border border-dark-800 rounded-xl px-3.5 py-2 text-xs font-medium text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                {/* Palette Builder */}
                {formData.category === 'palette' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
                    <div className="lg:col-span-7 space-y-3.5">
                      {/* Random Harmony Generator Button */}
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20">
                        <div>
                          <p className="text-xs font-black text-white flex items-center gap-1.5">
                            <FiShuffle className="text-brand-400" />
                            <span>Algorithmic Harmony Generator</span>
                          </p>
                          <p className="text-[10px] text-white/50">
                            Auto-mix complementary & trending palettes
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={generateRandomHarmony}
                          className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-[#ffffff] font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
                        >
                          <FiShuffle size={13} />
                          <span>Roll Random</span>
                        </button>
                      </div>

                      {/* Presets */}
                      <div>
                        <span className="block text-[11px] font-bold text-white/50 mb-1.5">
                          Preset Harmonies:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {harmonyTemplates.map((t, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setPaletteColors([...t.colors]);
                                setFormData(p => ({ ...p, title: t.name, format_tag: t.tag }));
                              }}
                              className="px-2.5 py-1 rounded-xl bg-dark-700 text-white/80 hover:text-white text-[11px] font-bold border border-dark-800 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <span className="flex items-center -space-x-1">
                                {t.colors.map((c, ci) => (
                                  <span key={ci} className="w-2.5 h-2.5 rounded-full border border-dark-800" style={{ backgroundColor: c }} />
                                ))}
                              </span>
                              <span>{t.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color list slots */}
                      <div className="space-y-2">
                        <span className="block text-xs font-bold text-white">
                          Color Shades:
                        </span>
                        <div className="space-y-2">
                          {paletteColors.map((col, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-dark-700 border border-dark-800">
                              <span className="w-6 h-6 rounded-lg bg-dark-800 text-white/80 font-mono text-[11px] flex items-center justify-center font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <input
                                type="color"
                                value={col.startsWith('#') ? col : '#3B82F6'}
                                onChange={(e) => {
                                  const newCols = [...paletteColors];
                                  newCols[idx] = e.target.value.toUpperCase();
                                  setPaletteColors(newCols);
                                }}
                                className="w-9 h-8 rounded-lg border border-dark-800 cursor-pointer p-0 bg-transparent shrink-0"
                              />
                              <input
                                type="text"
                                required
                                value={col}
                                onChange={(e) => {
                                  const newCols = [...paletteColors];
                                  newCols[idx] = e.target.value.toUpperCase();
                                  setPaletteColors(newCols);
                                }}
                                className="flex-1 bg-dark-900 border border-dark-800 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-white outline-none"
                              />
                              <span className="text-[10px] font-bold text-white/50 hidden sm:inline px-1">
                                {idx === 0 ? 'Dominant (60%)' : idx === 1 ? 'Secondary (30%)' : idx === 2 ? 'Accent (10%)' : 'Base/Bg'}
                              </span>
                              {paletteColors.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => setPaletteColors(paletteColors.filter((_, i) => i !== idx))}
                                  className="p-1 text-white/40 hover:text-rose-500 rounded cursor-pointer shrink-0"
                                  title="Remove"
                                >
                                  <FiX size={15} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Live Preview Card */}
                    <div className="lg:col-span-5 flex flex-col justify-between space-y-3 bg-dark-700/50 p-4 rounded-2xl border border-dark-800">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-white flex items-center gap-1.5">
                            <HiSparkles className="text-amber-500" /> Color Hunt Preview
                          </span>
                          <span className="text-[10px] font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                            Live Preview
                          </span>
                        </div>

                        <div className="w-full h-56 rounded-2xl overflow-hidden shadow-lg border border-dark-800 flex flex-col">
                          {paletteColors.map((hex, i) => {
                            const isLight = isLightColor(hex);
                            return (
                              <div
                                key={i}
                                className="w-full flex-1 flex items-center justify-between px-3 text-[11px] font-mono font-bold transition-all"
                                style={{ backgroundColor: hex }}
                              >
                                <span className={`px-2 py-0.5 rounded-md backdrop-blur-md shadow-2xs ${
                                  isLight ? 'bg-black/20 text-slate-900' : 'bg-white/30 text-white'
                                }`}>
                                  {hex}
                                </span>
                                <span className={`text-[10px] font-bold opacity-80 ${
                                  isLight ? 'text-slate-900' : 'text-white'
                                }`}>
                                  {i === 0 ? '60%' : i === 1 ? '30%' : i === 2 ? '10%' : 'Base'}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={generateRandomHarmony}
                          className="w-full mt-3 py-2 px-3 bg-dark-900 hover:bg-dark-800 text-white font-bold text-xs rounded-xl border border-dark-800 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer shadow-2xs"
                        >
                          <FiShuffle size={13} className="text-brand-400" />
                          <span>Generate Another Harmony</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-white mb-1.5">
                      {formData.category === 'color' ? 'HEX Color Code *' :
                       formData.category === 'guideline' ? 'Guideline Description *' : 'Value / Asset URL / Drive Link *'}
                    </label>

                    {formData.category === 'color' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.value.startsWith('#') ? formData.value : '#3B82F6'}
                          onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value.toUpperCase() }))}
                          className="w-10 h-10 rounded-xl border border-dark-800 cursor-pointer p-0 bg-transparent shrink-0"
                        />
                        <input
                          type="text"
                          required
                          value={formData.value}
                          onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value.toUpperCase() }))}
                          className="flex-1 bg-dark-700 border border-dark-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={handlePickColorFromScreen}
                          className="px-3.5 py-2 bg-dark-700 hover:bg-dark-600 text-white font-bold text-xs rounded-xl border border-dark-800 flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <FiDroplet size={14} className="text-brand-400" />
                          <span>Pick</span>
                        </button>
                      </div>
                    ) : formData.category === 'guideline' ? (
                      <textarea
                        required
                        rows={3}
                        value={formData.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                        className="w-full bg-dark-700 border border-dark-800 rounded-xl p-3 text-xs font-medium text-white outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          required
                          placeholder="https://drive.google.com/... or paste asset link"
                          value={formData.value}
                          onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                          className="w-full bg-dark-700 border border-dark-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                        {(formData.category === 'logo' || formData.category === 'template') && (
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-700 hover:bg-dark-600 rounded-xl text-xs font-bold text-white cursor-pointer border border-dark-800">
                            <FiUploadCloud size={14} className="text-brand-400" />
                            <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
                            <input type="file" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Subtitle & Format Tag */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-white mb-1">
                      Subtitle / Usage Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Posters, Social Media, Certificates"
                      value={formData.subtitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                      className="w-full bg-dark-700 border border-dark-800 rounded-xl px-3.5 py-2 text-xs font-medium text-white placeholder-white/40 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white mb-1">
                      Category Tag
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Social Media, UI, Marketing"
                      value={formData.format_tag}
                      onChange={(e) => setFormData(prev => ({ ...prev, format_tag: e.target.value }))}
                      className="w-full bg-dark-700 border border-dark-800 rounded-xl px-3.5 py-2 text-xs font-medium text-white placeholder-white/40 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-6 py-3.5 border-t border-dark-800 bg-dark-900 flex items-center justify-between shrink-0">
                <span className="text-xs text-white/50 font-medium">
                  Submitting as: <strong className="text-brand-400">{currentUser?.name || 'Reviewer'}</strong>
                </span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white font-bold text-xs rounded-xl cursor-pointer border border-dark-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-[#ffffff] font-black text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? 'Submitting...' : 'Submit for Admin Approval'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandResources;

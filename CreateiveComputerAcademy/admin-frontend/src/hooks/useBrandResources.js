import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

/**
 * useBrandResources Hook
 * Pure JavaScript custom hook managing state, CRUD operations,
 * algorithmic harmony generator, runtime font injector, and bulk color parser.
 * (Contains ZERO JSX elements).
 */
export const useBrandResources = () => {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'color' | 'palette' | 'logo' | 'font' | 'template' | 'guideline'
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    category: 'color',
    title: '',
    value: '#4338CA',
    subtitle: '',
    preview_url: '',
    format_tag: '',
    sort_order: 0,
    is_active: 1,
    created_by: 'Admin',
    created_by_role: 'admin',
    approval_status: 'approved'
  });

  // Multi-color Palette Builder State (Color Hunt Style)
  const [paletteColors, setPaletteColors] = useState(['#14532D', '#16A34A', '#86EFAC', '#FEF08A']);

  const harmonyTemplates = [
    { name: 'Eco Nature Green', colors: ['#14532D', '#16A34A', '#86EFAC', '#FEF08A'], tag: 'Nature / Organic' },
    { name: 'Sunset Warmth', colors: ['#7C2D12', '#EA580C', '#FB923C', '#FEF3C7'], tag: 'Marketing / Warm' },
    { name: 'Midnight Cyber Neon', colors: ['#09090B', '#3B0764', '#7C3AED', '#22D3EE'], tag: 'Social Media / Dark' },
    { name: 'Corporate Trust Navy', colors: ['#0F172A', '#1E40AF', '#38BDF8', '#F1F5F9'], tag: 'Corporate / UI' },
    { name: 'Pastel Dream', colors: ['#F472B6', '#FBBF24', '#A7F3D0', '#EFF6FF'], tag: 'Soft / Creative' },
    { name: 'Vintage Earth & Clay', colors: ['#44403C', '#78716C', '#D97706', '#FEF3C7'], tag: 'Vintage / Minimal' }
  ];

  // Bulk Palette Modal State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkGroupName, setBulkGroupName] = useState('Primary Brand');
  const [bulkColorText, setBulkColorText] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // Format BD Date & Time (Asia/Dhaka)
  const formatBDDateTime = (dateStr) => {
    if (!dateStr) return null;
    try {
      const [dPart, tPart] = dateStr.split(' ');
      if (!dPart) return dateStr;
      const [year, month, day] = dPart.split('-');
      const dateObj = new Date(year, month - 1, day);
      const dateFormatted = dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      if (tPart) {
        const [hh, mm] = tPart.split(':');
        let hour = parseInt(hh, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return `${dateFormatted}, ${hour}:${mm} ${ampm}`;
      }
      return dateFormatted;
    } catch {
      return dateStr;
    }
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

  // Helper: Name hue angle for aesthetic titles
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

  // Dynamically inject Google Font into <head> at runtime
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

  // Helper: Resolve font-family CSS from title & auto-inject link
  const getFontFamily = (title = '', value = '') => {
    const t = (title || '').toLowerCase();
    let cleanName = '';

    if (value && value.includes('fonts.google.com/specimen/')) {
      const match = value.match(/specimen\/([^/?#]+)/);
      if (match && match[1]) {
        cleanName = decodeURIComponent(match[1]).replace(/\+/g, ' ');
      }
    }
    if (!cleanName) {
      cleanName = (title || '').replace(/\s*\(.*?\)\s*/g, '').trim();
    }

    if (cleanName) {
      dynamicallyLoadFont(cleanName);
    }

    if (t.includes('hind siliguri')) return "'Hind Siliguri', sans-serif";
    if (t.includes('tiro bangla')) return "'Tiro Bangla', serif";
    if (t.includes('kalpurush')) return "'Kalpurush', 'Hind Siliguri', sans-serif";
    if (t.includes('inter')) return "'Inter', sans-serif";
    if (t.includes('montserrat')) return "'Montserrat', sans-serif";
    if (t.includes('poppins')) return "'Poppins', sans-serif";
    if (t.includes('roboto')) return "'Roboto', sans-serif";
    return cleanName ? `'${cleanName}', sans-serif` : 'inherit';
  };

  // Algorithmic Harmony Generator (Coolors & Color Hunt Style)
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
      // Warm Sunset
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
      subtitle: `${tag} 4-color palette generated for creative graphics`
    }));
    toast.success(`Generated: ${themeName}`);
  };

  // Fetch Resources
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

  // Fast 1-click Approval Status Handler
  const handleUpdateApproval = async (item, status) => {
    try {
      const res = await axios.post(`${API_BASE}api/brand/manage_brand_resource.php`, {
        action: 'update_approval',
        id: item.id,
        approval_status: status
      });
      if (res.data.status === 'success') {
        toast.success(res.data.message || `Resource status set to ${status}`);
        fetchResources();
      } else {
        toast.error(res.data.message || 'Failed to update approval status');
      }
    } catch (err) {
      console.error('Error updating approval:', err);
      toast.error('Failed to update approval status');
    }
  };

  // Parse multi-line / comma-separated HEX colors
  const parseBulkColors = (text, groupName) => {
    if (!text) return [];
    const lines = text.split('\n');
    const results = [];
    const hexRegex = /#([0-9A-Fa-f]{3,8})\b/;

    lines.forEach((line) => {
      const parts = line.includes(',') ? line.split(',') : [line];
      parts.forEach((part) => {
        const match = part.match(hexRegex);
        if (match) {
          const hex = '#' + match[1].toUpperCase();
          let name = part.replace(match[0], '').split('-').join('').split(':').join('').split('|').join('').trim();
          if (!name) {
            name = `${groupName || 'Color'} ${results.length + 1}`;
          }
          results.push({
            category: 'color',
            title: name,
            value: hex,
            format_tag: groupName || 'Palette',
            subtitle: groupName ? `${groupName} Official Color` : 'Brand Swatch',
            sort_order: resources.length + results.length + 1,
            is_active: 1
          });
        }
      });
    });
    return results;
  };

  const parsedBulkList = parseBulkColors(bulkColorText, bulkGroupName);

  const colorPresets = [
    {
      name: 'CCA Official Navy & Blue',
      tag: 'Primary Brand',
      text: `#0F172A - Deep Slate Navy\n#1E3A8A - Royal Brand Navy\n#2563EB - CCA Vibrant Blue\n#60A5FA - Sky Blue Accent\n#F8FAFC - Snow White Background`
    },
    {
      name: 'Sunset Glow (Marketing)',
      tag: 'Marketing & Promo',
      text: `#7C2D12 - Deep Earth Brown\n#C2410C - Rust Orange\n#EA580C - Sunset Primary\n#F97316 - Warm Glow Accent\n#FEF3C7 - Pale Warm Amber`
    },
    {
      name: 'Emerald Tech (Certificates)',
      tag: 'Course & Cert',
      text: `#064E3B - Deep Forest Green\n#047857 - Pine Academy Green\n#10B981 - Emerald Accent\n#34D399 - Mint Green\n#ECFDF5 - Light Mint Background`
    },
    {
      name: 'Cyber Purple (Social Media)',
      tag: 'Social Media',
      text: `#2E1065 - Midnight Dark\n#581C87 - Royal Violet\n#7C3AED - Electric Purple\n#A855F7 - Neon Lavender\n#FAF5FF - Soft Lilac Background`
    }
  ];

  const handleSaveBulk = async () => {
    if (parsedBulkList.length === 0) {
      toast.error('Please enter at least one valid HEX color code (e.g. #1E40AF)');
      return;
    }

    setBulkSaving(true);
    try {
      const res = await axios.post(`${API_BASE}api/brand/manage_brand_resource.php`, {
        action: 'bulk_create',
        items: parsedBulkList
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message || `Successfully imported ${parsedBulkList.length} colors!`);
        setBulkModalOpen(false);
        setBulkColorText('');
        fetchResources();
      } else {
        toast.error(res.data.message || 'Bulk creation failed');
      }
    } catch (err) {
      console.error('Bulk save error:', err);
      toast.error('Error saving colors');
    } finally {
      setBulkSaving(false);
    }
  };

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

  // Open Create Modal
  const handleOpenCreate = (defaultCategory = 'color') => {
    const cat = defaultCategory === 'all' ? 'color' : defaultCategory;
    setEditingItem(null);
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
      is_active: 1,
      created_by: 'Admin',
      created_by_role: 'admin',
      approval_status: 'approved'
    });
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    if (item.category === 'palette' && item.value) {
      const parts = item.value.split(',').map(s => s.trim()).filter(Boolean);
      setPaletteColors(parts.length >= 2 ? parts : ['#14532D', '#16A34A', '#86EFAC', '#FEF08A']);
    }
    setFormData({
      category: item.category,
      title: item.title,
      value: item.value,
      subtitle: item.subtitle || '',
      preview_url: item.preview_url || '',
      format_tag: item.format_tag || '',
      sort_order: item.sort_order || 0,
      is_active: Number(item.is_active),
      created_by: item.created_by || 'Admin',
      created_by_role: item.created_by_role || 'admin',
      approval_status: item.approval_status || 'approved'
    });
    setModalOpen(true);
  };

  // Handle File Upload for Logos / Assets
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

      if (res.data.status === 'success' && res.data.url) {
        setFormData(prev => ({
          ...prev,
          value: res.data.url,
          preview_url: res.data.url,
          format_tag: res.data.format || prev.format_tag
        }));
        toast.success('Asset uploaded successfully!');
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

  // Submit Save
  const handleSave = async (e) => {
    e.preventDefault();
    const finalValue = formData.category === 'palette' ? paletteColors.join(',') : formData.value;
    if (!formData.title.trim() || !finalValue.trim()) {
      toast.error('Title and Value are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        action: editingItem ? 'update' : 'create',
        ...(editingItem && { id: editingItem.id }),
        ...formData,
        value: finalValue
      };

      const res = await axios.post(`${API_BASE}api/brand/manage_brand_resource.php`, payload);
      if (res.data.status === 'success') {
        toast.success(editingItem ? 'Resource updated successfully' : 'New resource created successfully');
        setModalOpen(false);
        fetchResources();
      } else {
        toast.error(res.data.message || 'Saving failed');
      }
    } catch (err) {
      console.error('Error saving resource:', err);
      toast.error('Failed to save resource');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (item) => {
    try {
      const res = await axios.post(`${API_BASE}api/brand/manage_brand_resource.php`, {
        action: 'toggle_status',
        id: item.id
      });
      if (res.data.status === 'success') {
        setResources(prev => prev.map(r => r.id === item.id ? { ...r, is_active: r.is_active ? 0 : 1 } : r));
        toast.success(`${item.title} status updated`);
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Delete Resource
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await axios.post(`${API_BASE}api/brand/manage_brand_resource.php`, {
        action: 'delete',
        id
      });
      if (res.data.status === 'success') {
        toast.success('Resource deleted successfully');
        setResources(prev => prev.filter(r => r.id !== id));
      } else {
        toast.error(res.data.message || 'Delete failed');
      }
    } catch (err) {
      toast.error('Failed to delete resource');
    }
  };

  // Counts for approval status
  const pendingCount = resources.filter(r => r.approval_status === 'pending').length;
  const approvedCount = resources.filter(r => (r.approval_status || 'approved') === 'approved').length;
  const rejectedCount = resources.filter(r => r.approval_status === 'rejected').length;

  // Filtered list
  const filteredList = resources.filter(item => {
    const matchesCategory = activeTab === 'all' || item.category === activeTab;
    if (!matchesCategory) return false;

    const itemApproval = item.approval_status || 'approved';
    const matchesApproval = approvalFilter === 'all' || itemApproval === approvalFilter;
    if (!matchesApproval) return false;

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

  return {
    API_BASE,
    activeTab,
    setActiveTab,
    resources,
    setResources,
    loading,
    setLoading,
    searchQuery,
    setSearchQuery,
    approvalFilter,
    setApprovalFilter,
    modalOpen,
    setModalOpen,
    editingItem,
    setEditingItem,
    saving,
    setSaving,
    uploading,
    setUploading,
    formData,
    setFormData,
    paletteColors,
    setPaletteColors,
    harmonyTemplates,
    bulkModalOpen,
    setBulkModalOpen,
    bulkGroupName,
    setBulkGroupName,
    bulkColorText,
    setBulkColorText,
    bulkSaving,
    setBulkSaving,
    colorPresets,
    parsedBulkList,
    pendingCount,
    approvedCount,
    rejectedCount,
    filteredList,
    formatBDDateTime,
    isLightColor,
    hslToHex,
    getHueName,
    dynamicallyLoadFont,
    getFontFamily,
    generateRandomHarmony,
    fetchResources,
    handleUpdateApproval,
    parseBulkColors,
    handleSaveBulk,
    handlePickColorFromScreen,
    handleOpenCreate,
    handleOpenEdit,
    handleFileUpload,
    handleSave,
    handleToggleStatus,
    handleDelete
  };
};

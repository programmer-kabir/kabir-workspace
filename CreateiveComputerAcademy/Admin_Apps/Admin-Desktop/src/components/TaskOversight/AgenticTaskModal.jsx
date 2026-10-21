import React, { useState, useEffect, useRef } from 'react';
import {
  FiX,
  FiUploadCloud,
  FiCpu,
  FiEdit3,
  FiCode,
  FiLink,
  FiLayers,
  FiCopy,
  FiCheck,
  FiFolder,
  FiType,
  FiImage,
  FiZap,
  FiFileText,
  FiBox,
  FiSliders,
  FiGrid,
  FiExternalLink,
  FiSmile,
  FiTarget,
  FiPlus,
  FiTrash2,
  FiTag,
  FiUsers,
  FiFlag,
  FiCalendar,
  FiRefreshCw,
  FiChevronDown,
  FiCheckCircle
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { toast } from 'sonner';
import axios from 'axios';
import { createPortal } from 'react-dom';
import { CategorySelect } from './CategorySelect';
import { StaffSelect } from './StaffSelect';

const AI_MODELS = [
  { 
    id: 'meta-llama/llama-3.3-70b-instruct:free', 
    name: 'Meta Llama 3.3 70B', 
    badge: 'Recommended', 
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    desc: 'Deep design understanding, accurate colors & PSD layer trees', 
    icon: '🦙' 
  },
  { 
    id: 'deepseek/deepseek-r1:free', 
    name: 'DeepSeek R1 (Reasoning)', 
    badge: 'Deep Logic', 
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    desc: 'Advanced spatial reasoning & complex layout breakdown', 
    icon: '🐋' 
  },
  { 
    id: 'qwen/qwen-2.5-coder-32b-instruct:free', 
    name: 'Qwen 2.5 Coder 32B', 
    badge: 'Fast & Clean', 
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    desc: 'High-precision structured JSON & spec parsing', 
    icon: '⚡' 
  },
  { 
    id: 'mistralai/mistral-7b-instruct:free', 
    name: 'Mistral 7B Instruct', 
    badge: 'Lightweight', 
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    desc: 'Fast, responsive generation for quick design iterations', 
    icon: '🌪️' 
  },
  { 
    id: 'meta-llama/llama-3.1-8b-instruct:free', 
    name: 'Meta Llama 3.1 8B', 
    badge: 'Fast & Stable', 
    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    desc: 'Quick generation and consistent formatting', 
    icon: '🦙' 
  },
  { 
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', 
    name: 'Nvidia Nemotron Nano', 
    badge: 'Omni Reasoning', 
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    desc: 'Nvidia specialized omni-reasoning model', 
    icon: '🟢' 
  },
  { 
    id: 'openrouter/auto', 
    name: 'OpenRouter Auto (Smart)', 
    badge: 'Auto Router', 
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    desc: 'Automatically chooses the fastest available free model', 
    icon: '🤖' 
  },
];

export const AgenticTaskModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  staff = [],
  workloads = {},
  departments = [],
  apiBase = '',
  onSubmit,
  actionLoading = false,
  onSwitchToManual,
  isEdit = false,
  onDelete
}) => {
  if (!isOpen) return null;

  const resolvedApiBase = (apiBase || import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '') + '/';

  // Active Tab: 'json_spec' | 'assets_links' | 'layer_tree'
  const [activeTab, setActiveTab] = useState('json_spec');
  const [selectedAiModel, setSelectedAiModel] = useState('meta-llama/llama-3.3-70b-instruct:free');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isArchitecting, setIsArchitecting] = useState(false);
  const [copiedColor, setCopiedColor] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [rawJsonText, setRawJsonText] = useState('');

  // Close AI Model dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Multi-Variant state initialization
  const [variants, setVariants] = useState(() => {
    if (Array.isArray(formData.blueprint_variants) && formData.blueprint_variants.length > 0) {
      return formData.blueprint_variants.map((v, i) => {
        let bData = v.blueprint_data || v.blueprint_json;
        if (typeof bData === 'string') {
          try { bData = JSON.parse(bData); } catch (e) { bData = null; }
        }
        return {
          id: v.id || `var_${Date.now()}_${i}`,
          variant_name: v.variant_name || `Variant ${i + 1}`,
          ai_model_used: v.ai_model_used || bData?.model_used || 'meta-llama/llama-3.3-70b-instruct:free',
          is_active: Boolean(v.is_active || i === 0),
          blueprint_data: bData
        };
      });
    }
    if (formData.blueprint_data) {
      try {
        const parsed = typeof formData.blueprint_data === 'string'
          ? JSON.parse(formData.blueprint_data)
          : formData.blueprint_data;
        return [
          {
            id: `var_${Date.now()}`,
            variant_name: 'Variant 1',
            ai_model_used: parsed?.model_used || 'meta-llama/llama-3.3-70b-instruct:free',
            is_active: true,
            blueprint_data: parsed
          }
        ];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [activeVariantIndex, setActiveVariantIndex] = useState(0);

  // Derived current blueprint
  const currentVariant = variants[activeVariantIndex] || null;
  const blueprint = currentVariant?.blueprint_data || null;

  const setBlueprint = (updaterOrValue) => {
    setVariants(prev => {
      const copy = [...prev];
      if (!copy[activeVariantIndex]) {
        copy[activeVariantIndex] = {
          id: `var_${Date.now()}`,
          variant_name: `Variant ${activeVariantIndex + 1}`,
          ai_model_used: selectedAiModel,
          is_active: copy.length === 0,
          blueprint_data: null
        };
      }
      const prevB = copy[activeVariantIndex].blueprint_data;
      const nextB = typeof updaterOrValue === 'function' ? updaterOrValue(prevB) : updaterOrValue;
      copy[activeVariantIndex] = {
        ...copy[activeVariantIndex],
        blueprint_data: nextB,
        ai_model_used: nextB?.model_used || copy[activeVariantIndex].ai_model_used || selectedAiModel
      };
      return copy;
    });
  };

  const handleAddVariant = () => {
    const newIdx = variants.length;
    const newVariant = {
      id: `var_${Date.now()}`,
      variant_name: `Variant ${newIdx + 1}`,
      ai_model_used: selectedAiModel,
      is_active: variants.length === 0,
      blueprint_data: null
    };
    setVariants(prev => [...prev, newVariant]);
    setActiveVariantIndex(newIdx);
    toast.success(`Created Variant ${newIdx + 1}. You can now generate or configure its blueprint.`);
  };

  const handleDuplicateVariant = (index, e) => {
    if (e) e.stopPropagation();
    const source = variants[index];
    if (!source) return;
    const clone = {
      ...source,
      id: `var_${Date.now()}`,
      variant_name: `${source.variant_name} (Copy)`,
      is_active: false,
      blueprint_data: source.blueprint_data ? JSON.parse(JSON.stringify(source.blueprint_data)) : null
    };
    setVariants(prev => [...prev, clone]);
    setActiveVariantIndex(variants.length);
    toast.success(`Duplicated "${source.variant_name}"`);
  };

  const handleDeleteVariant = (index, e) => {
    if (e) e.stopPropagation();
    if (variants.length <= 1) {
      toast.error('Cannot delete the only remaining variant.');
      return;
    }
    const target = variants[index];
    const isDeletedActive = Boolean(target?.is_active);
    const updated = variants.filter((_, i) => i !== index);

    if (isDeletedActive && updated.length > 0) {
      updated[0].is_active = true;
    }

    setVariants(updated);
    setActiveVariantIndex(prev => Math.min(prev, updated.length - 1));
    toast.success(`Deleted variant`);
  };

  const handleSetActiveTarget = (index, e) => {
    if (e) e.stopPropagation();
    setVariants(prev => prev.map((v, i) => ({
      ...v,
      is_active: i === index
    })));
    toast.success(`Set "${variants[index]?.variant_name}" as Primary Target!`);
  };

  const handleRenameVariant = (index, newName) => {
    setVariants(prev => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], variant_name: newName };
      }
      return copy;
    });
  };

  const [visualPreview, setVisualPreview] = useState(null);

  // Sync initial images and blueprint if editing an existing task
  useEffect(() => {
    if (formData) {
      if (Array.isArray(formData.blueprint_variants) && formData.blueprint_variants.length > 0) {
        const parsedVars = formData.blueprint_variants.map((v, i) => {
          let bData = v.blueprint_data || v.blueprint_json;
          if (typeof bData === 'string') {
            try { bData = JSON.parse(bData); } catch (e) { bData = null; }
          }
          return {
            id: v.id || `var_${Date.now()}_${i}`,
            variant_name: v.variant_name || `Variant ${i + 1}`,
            ai_model_used: v.ai_model_used || bData?.model_used || 'meta-llama/llama-3.3-70b-instruct:free',
            is_active: Boolean(v.is_active || i === 0),
            blueprint_data: bData
          };
        });
        setVariants(parsedVars);
      } else if (formData.blueprint_data) {
        try {
          const parsed = typeof formData.blueprint_data === 'string'
            ? JSON.parse(formData.blueprint_data)
            : formData.blueprint_data;
          setVariants([
            {
              id: `var_${Date.now()}`,
              variant_name: 'Variant 1',
              ai_model_used: parsed?.model_used || 'meta-llama/llama-3.3-70b-instruct:free',
              is_active: true,
              blueprint_data: parsed
            }
          ]);
        } catch (e) {
          console.error(e);
        }
      }

      // Initialize ref_image preview if available
      if (formData.ref_image) {
        try {
          const imgs = typeof formData.ref_image === 'string'
            ? JSON.parse(formData.ref_image)
            : (Array.isArray(formData.ref_image) ? formData.ref_image : [formData.ref_image]);
          if (Array.isArray(imgs) && imgs.length > 0 && imgs[0]) {
            setPreviewImage(imgs[0].startsWith('http') || imgs[0].startsWith('blob:') ? imgs[0] : `${resolvedApiBase}${imgs[0]}`);
          }
        } catch {
          if (typeof formData.ref_image === 'string' && formData.ref_image.trim()) {
            setPreviewImage(formData.ref_image.startsWith('http') ? formData.ref_image : `${resolvedApiBase}${formData.ref_image}`);
          }
        }
      }

      // Initialize visual_image preview if available
      if (formData.visual_image) {
        try {
          const vimgs = typeof formData.visual_image === 'string'
            ? JSON.parse(formData.visual_image)
            : (Array.isArray(formData.visual_image) ? formData.visual_image : [formData.visual_image]);
          if (Array.isArray(vimgs) && vimgs.length > 0 && vimgs[0]) {
            setVisualPreview(vimgs[0].startsWith('http') || vimgs[0].startsWith('blob:') ? vimgs[0] : `${resolvedApiBase}${vimgs[0]}`);
          }
        } catch {
          if (typeof formData.visual_image === 'string' && formData.visual_image.trim()) {
            setVisualPreview(formData.visual_image.startsWith('http') ? formData.visual_image : `${resolvedApiBase}${formData.visual_image}`);
          }
        }
      }
    }
  }, [isOpen, formData?.task_id, formData?.id]);

  // Keep raw JSON text synced when blueprint changes
  useEffect(() => {
    if (blueprint) {
      setRawJsonText(JSON.stringify(blueprint, null, 2));
    }
  }, [blueprint]);

  const compressImageForVision = (fileOrBlob, maxDimension = 1024, quality = 0.82) => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = typeof fileOrBlob === 'string' ? fileOrBlob : URL.createObjectURL(fileOrBlob);
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        if (typeof fileOrBlob !== 'string') URL.revokeObjectURL(url);
        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        if (typeof fileOrBlob !== 'string') URL.revokeObjectURL(url);
        // Fallback to basic file reader if canvas fails
        if (typeof fileOrBlob !== 'string') {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(fileOrBlob);
        } else {
          resolve(null);
        }
      };
      img.src = url;
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));

      // Compress to lightweight Base64 for Vision AI (~80KB)
      try {
        const compressed = await compressImageForVision(file);
        setImageBase64(compressed);
      } catch (err) {
        console.error('Image compression error:', err);
      }

      // Upload file to server so it is stored as ref_image
      const uploadFormData = new FormData();
      uploadFormData.append('files[]', file);
      try {
        const res = await axios.post(`${resolvedApiBase}api/admin/tasks/task_image_upload.php`, uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data && res.data.files && res.data.files.length > 0) {
          let currentImgs = [];
          if (formData.ref_image) {
            try {
              currentImgs = Array.isArray(formData.ref_image) ? formData.ref_image : JSON.parse(formData.ref_image);
            } catch {
              currentImgs = formData.ref_image ? [formData.ref_image] : [];
            }
          }
          if (!Array.isArray(currentImgs)) currentImgs = [];

          setFormData(prev => ({
            ...prev,
            ref_image: [...currentImgs, ...res.data.files]
          }));
        }
      } catch (err) {
        console.error('Failed to upload reference image to server:', err);
      }
    }
  };

  const handleMultipleRefImagesUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Set first image for Vision AI if none currently set
    if (!imageBase64 && files[0]) {
      try {
        const compressed = await compressImageForVision(files[0]);
        setImageBase64(compressed);
        setPreviewImage(URL.createObjectURL(files[0]));
      } catch (err) {
        console.error('Vision compress error:', err);
      }
    }

    const uploadFormData = new FormData();
    files.forEach(file => {
      uploadFormData.append('files[]', file);
    });

    try {
      const res = await axios.post(`${resolvedApiBase}api/admin/tasks/task_image_upload.php`, uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.files && res.data.files.length > 0) {
        let currentImgs = [];
        if (formData.ref_image) {
          try {
            currentImgs = Array.isArray(formData.ref_image) ? formData.ref_image : JSON.parse(formData.ref_image);
          } catch {
            currentImgs = formData.ref_image ? [formData.ref_image] : [];
          }
        }
        if (!Array.isArray(currentImgs)) currentImgs = [];

        setFormData(prev => ({
          ...prev,
          ref_image: [...currentImgs, ...res.data.files]
        }));
        toast.success(`${res.data.files.length} Reference image(s) uploaded!`);
      }
    } catch (err) {
      console.error('Failed to upload reference images:', err);
      toast.error('Failed to upload reference images');
    }
  };

  const handleRemoveRefImage = (index) => {
    let currentImgs = [];
    if (formData.ref_image) {
      try {
        currentImgs = Array.isArray(formData.ref_image) ? formData.ref_image : JSON.parse(formData.ref_image);
      } catch {
        currentImgs = formData.ref_image ? [formData.ref_image] : [];
      }
    }
    if (!Array.isArray(currentImgs)) currentImgs = [];
    const updated = currentImgs.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      ref_image: updated
    }));
  };

  const handleSetRefAsVisionTarget = async (imgUrl) => {
    const fullUrl = imgUrl.startsWith('http') || imgUrl.startsWith('blob:') ? imgUrl : `${resolvedApiBase}${imgUrl}`;
    setPreviewImage(fullUrl);
    try {
      const compressed = await compressImageForVision(fullUrl);
      if (compressed) {
        setImageBase64(compressed);
        toast.success('Set as active flyer for AI Blueprint analysis!');
      }
    } catch (e) {
      console.error('Failed to set vision target', e);
    }
  };

  const handleRefLinkChange = (index, value) => {
    const current = Array.isArray(formData.ref_links) ? [...formData.ref_links] : [formData.ref_links || ''];
    current[index] = value;
    setFormData(prev => ({ ...prev, ref_links: current }));
  };

  const handleAddRefLink = () => {
    const current = Array.isArray(formData.ref_links) ? [...formData.ref_links] : [formData.ref_links || ''];
    setFormData(prev => ({ ...prev, ref_links: [...current, ''] }));
  };

  const handleRemoveRefLink = (index) => {
    const current = Array.isArray(formData.ref_links) ? [...formData.ref_links] : [''];
    const updated = current.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, ref_links: updated.length ? updated : [''] }));
  };

  const handleVisualImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setVisualPreview(URL.createObjectURL(file));
      const uploadFormData = new FormData();
      uploadFormData.append('files[]', file);
      try {
        const res = await axios.post(`${resolvedApiBase}api/admin/tasks/task_image_upload.php`, uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data && res.data.files && res.data.files.length > 0) {
          setFormData(prev => ({
            ...prev,
            visual_image: res.data.files
          }));
        }
      } catch (err) {
        console.error('Failed to upload visual image to server:', err);
      }
    }
  };

  const handleRemoveVisualImage = () => {
    setVisualPreview(null);
    setFormData(prev => ({
      ...prev,
      visual_image: []
    }));
  };

  const handleCopyHex = (hex) => {
    if (!hex) return;
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    toast.success(`Copied ${hex} to clipboard!`);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const handleArchitectBlueprint = async (overrideInstructions = null) => {
    setIsArchitecting(true);
    try {
      const promptText = (typeof overrideInstructions === 'string' && overrideInstructions.trim())
        ? overrideInstructions
        : (customInstructions || 'Extract full design specifications, color palette, typography and PSD layer tree for this flyer/design.');

      const res = await axios.post(`${resolvedApiBase}api/tasks/architect_blueprint.php`, {
        instructions: promptText,
        image_base64: imageBase64,
        ai_model: selectedAiModel
      });

      if (res.data.status === 'success' && res.data.blueprint) {
        const modelUsed = res.data.model_used || selectedAiModel;
        const generatedBlueprint = {
          ...res.data.blueprint,
          model_used: modelUsed
        };
        setBlueprint(generatedBlueprint);
        const modelInfo = AI_MODELS.find(m => m.id === modelUsed);
        toast.success(`AI Blueprint Generated using ${modelInfo ? modelInfo.name : modelUsed}!`);

        // Directly set title and category if creating or empty
        const professionalTitle = generatedBlueprint.task_title || generatedBlueprint.title || `${generatedBlueprint.doc_format || 'Design'} PSD Template`;
        setFormData(prev => ({
          ...prev,
          blueprint_data: generatedBlueprint,
          title: prev.title ? prev.title : professionalTitle,
          category: prev.category || 'Graphic Design'
        }));
      } else {
        toast.error(res.data.message || 'Failed to generate blueprint from AI');
      }
    } catch (err) {
      console.error('Architect AI Error:', err);
      toast.error('AI Blueprint জেনারেট করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsArchitecting(false);
    }
  };

  /* ──────────────────────────────────────────────────────────
     INTERACTIVE BLUEPRINT EDITING HANDLERS
  ────────────────────────────────────────────────────────── */

  // 1. Document Specs
  const handleDocSpecChange = (field, value) => {
    setBlueprint(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 2. Color Palette
  const handleColorChange = (index, field, value) => {
    setBlueprint(prev => {
      const palette = [...(prev.color_palette || [])];
      palette[index] = { ...palette[index], [field]: value };
      return { ...prev, color_palette: palette };
    });
  };

  const handleAddColor = () => {
    setBlueprint(prev => ({
      ...prev,
      color_palette: [
        ...(prev.color_palette || []),
        { name: 'Accent Color', hex: '#2563EB' }
      ]
    }));
  };

  const handleRemoveColor = (index) => {
    setBlueprint(prev => ({
      ...prev,
      color_palette: (prev.color_palette || []).filter((_, i) => i !== index)
    }));
  };

  // 3. Typography
  const handleTypographyChange = (index, field, value) => {
    setBlueprint(prev => {
      const typography = [...(prev.typography || [])];
      typography[index] = { ...typography[index], [field]: value };
      return { ...prev, typography };
    });
  };

  const handleAddTypography = () => {
    setBlueprint(prev => ({
      ...prev,
      typography: [
        ...(prev.typography || []),
        { font: 'Poppins', weights: 'Regular, Bold', usage: 'Headings & Body' }
      ]
    }));
  };

  const handleRemoveTypography = (index) => {
    setBlueprint(prev => ({
      ...prev,
      typography: (prev.typography || []).filter((_, i) => i !== index)
    }));
  };

  // 4. Structural Layout Breakdown
  const handleLayoutChange = (index, field, value) => {
    setBlueprint(prev => {
      const layout = [...(prev.layout_breakdown || [])];
      layout[index] = { ...layout[index], [field]: value };
      return { ...prev, layout_breakdown: layout };
    });
  };

  const handleAddLayoutSection = () => {
    setBlueprint(prev => ({
      ...prev,
      layout_breakdown: [
        ...(prev.layout_breakdown || []),
        { section: 'New Section', description: 'Describe section placement and design elements.' }
      ]
    }));
  };

  const handleRemoveLayoutSection = (index) => {
    setBlueprint(prev => ({
      ...prev,
      layout_breakdown: (prev.layout_breakdown || []).filter((_, i) => i !== index)
    }));
  };

  // 5. Assets & Links
  const handleAssetChange = (index, field, value) => {
    setBlueprint(prev => {
      const assets = [...(prev.assets_links || [])];
      assets[index] = { ...assets[index], [field]: value };
      return { ...prev, assets_links: assets };
    });
  };

  const handleAddAsset = (type = 'font') => {
    setBlueprint(prev => ({
      ...prev,
      assets_links: [
        ...(prev.assets_links || []),
        {
          type,
          name: type === 'font' ? 'Plus Jakarta Sans' : type === 'glyph' ? 'Service Icon' : 'Header Stock Photo',
          url: type === 'font' ? 'https://fonts.google.com' : '',
          glyph: type === 'glyph' ? '\\f005' : undefined,
          license: 'Free Commercial License'
        }
      ]
    }));
  };

  const handleRemoveAsset = (index) => {
    setBlueprint(prev => ({
      ...prev,
      assets_links: (prev.assets_links || []).filter((_, i) => i !== index)
    }));
  };

  // 6. PSD Layer Tree
  const handleGroupFolderChange = (groupIndex, value) => {
    setBlueprint(prev => {
      const layerTree = [...(prev.layer_tree || [])];
      layerTree[groupIndex] = { ...layerTree[groupIndex], folder: value };
      return { ...prev, layer_tree: layerTree };
    });
  };

  const handleLayerChange = (groupIndex, layerIndex, field, value) => {
    setBlueprint(prev => {
      const layerTree = [...(prev.layer_tree || [])];
      const layers = [...(layerTree[groupIndex].layers || [])];
      layers[layerIndex] = { ...layers[layerIndex], [field]: value };
      layerTree[groupIndex] = { ...layerTree[groupIndex], layers };
      return { ...prev, layer_tree: layerTree };
    });
  };

  const handleAddLayer = (groupIndex) => {
    setBlueprint(prev => {
      const layerTree = [...(prev.layer_tree || [])];
      const layers = [...(layerTree[groupIndex].layers || [])];
      layers.push({ name: 'New Design Layer', type: 'shape', color: '#2563EB' });
      layerTree[groupIndex] = { ...layerTree[groupIndex], layers };
      return { ...prev, layer_tree: layerTree };
    });
  };

  const handleRemoveLayer = (groupIndex, layerIndex) => {
    setBlueprint(prev => {
      const layerTree = [...(prev.layer_tree || [])];
      const layers = (layerTree[groupIndex].layers || []).filter((_, li) => li !== layerIndex);
      layerTree[groupIndex] = { ...layerTree[groupIndex], layers };
      return { ...prev, layer_tree: layerTree };
    });
  };

  const handleAddGroup = () => {
    setBlueprint(prev => ({
      ...prev,
      layer_tree: [
        ...(prev.layer_tree || []),
        { folder: 'New Folder Group', layers: [{ name: 'Layer 1', type: 'shape' }] }
      ]
    }));
  };

  const handleRemoveGroup = (groupIndex) => {
    setBlueprint(prev => ({
      ...prev,
      layer_tree: (prev.layer_tree || []).filter((_, gi) => gi !== groupIndex)
    }));
  };

  // 7. Apply Raw JSON
  const handleApplyRawJson = () => {
    try {
      const parsed = JSON.parse(rawJsonText);
      setBlueprint(parsed);
      toast.success('Raw JSON applied to visual specifications!');
    } catch (err) {
      toast.error('Invalid JSON syntax: ' + err.message);
    }
  };

  // Submit Handler
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast.error('Task Title is required!');
      return;
    }
    const activeVar = variants.find(v => v.is_active) || variants[0] || null;
    const updatedFormData = {
      ...formData,
      creation_mode: 'agentic',
      blueprint_data: activeVar?.blueprint_data || blueprint,
      blueprint_variants: variants
    };
    onSubmit(e, updatedFormData);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white dark:bg-[#0b1120] text-slate-800 dark:text-slate-100 rounded-3xl shadow-2xl w-full max-w-[1580px] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] border border-transparent dark:border-slate-800">
        
        {/* ── Top Header Bar ── */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 flex justify-between items-center bg-slate-50 dark:bg-[#0e172a] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
              <FiCpu size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-wide text-slate-900 dark:text-white">
                  {isEdit ? 'Edit AI Blueprint Task' : 'AI Blueprint Architect'}{' '}
                  <span className="text-blue-600 dark:text-blue-500 font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                    {isEdit ? 'EDIT MODE' : 'AGENTIC MODE'}
                  </span>
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                {isEdit
                  ? 'Modify specifications, color palette, typography, and PSD layers for this task.'
                  : 'Generate and customize design specifications, color palettes, typography and PSD layer trees.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onSwitchToManual && (
              <button
                type="button"
                onClick={onSwitchToManual}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <FiEdit3 size={13} /> Switch to Manual Mode
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* ── Task Meta Inputs (Conditional: Full fields on Edit, Title-only on Create) ── */}
        {isEdit ? (
          <div className="px-6 py-3 bg-slate-100/60 dark:bg-[#0a0f1d] border-b border-slate-200 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 flex-shrink-0 relative z-30">
            {/* Title */}
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Modern Business Flyer Design"
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full h-[42px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 shadow-sm"
                required
              />
            </div>

            {/* Category */}
            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <CategorySelect
                value={formData.category || 'Design'}
                onChange={val => setFormData(prev => ({ ...prev, category: val }))}
                departments={departments}
              />
            </div>

            {/* Assign To */}
            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Assign To
              </label>
              <StaffSelect
                value={formData.assigned_to || ''}
                onChange={val => setFormData(prev => ({ ...prev, assigned_to: val }))}
                staff={staff}
                apiBase={apiBase || ''}
                workloads={workloads}
              />
            </div>

            {/* Priority & Deadline */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority || 'Medium'}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full h-[42px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-sm cursor-pointer"
                >
                  <option value="Low">🟢 Low</option>
                  <option value="Medium">⚡ Med</option>
                  <option value="High">🔥 High</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full h-[42px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 shadow-sm cursor-pointer"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-3 bg-slate-100/60 dark:bg-[#0a0f1d] border-b border-slate-200 dark:border-slate-800/60 flex-shrink-0">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Modern Business Flyer Design (or auto-generated by AI)"
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-white dark:bg-[#131d31] border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 shadow-sm"
                required
              />
            </div>
          </div>
        )}

        {/* ── Studio Content Grid ── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* ── LEFT PANEL: Visual Input & Generator (4 Cols) ── */}
          <div className="lg:col-span-4 p-5 border-r border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0d1527] overflow-y-auto space-y-5 flex flex-col custom-scrollbar">
            {/* 1. Vision AI Input Flyer Dropzone */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FiImage className="text-blue-500 dark:text-blue-400" /> AI Vision Input / Flyer Preview
                </h4>
                {previewImage && (
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                    Active AI Target
                  </span>
                )}
              </div>

              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-[#111c33] rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[140px] relative overflow-hidden group shadow-sm">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {previewImage ? (
                  <div className="w-full h-36 relative rounded-xl overflow-hidden">
                    <img src={previewImage} alt="Input" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white">
                      Click to Change AI Analysis Image
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                      <FiUploadCloud size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Upload Flyer / Design Preview</p>
                    <p className="text-[10px] text-slate-500 font-semibold">Used by Vision AI for Blueprint Generation</p>
                  </div>
                )}
              </label>
            </div>

            {/* 2. Reference Images (Multi-Image Upload & Gallery) */}
            <div className="p-4 bg-white dark:bg-[#111c33]/70 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FiImage className="text-blue-500 dark:text-blue-400" size={13} /> Reference Images
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {(() => {
                    let count = 0;
                    if (formData.ref_image) {
                      try {
                        const imgs = Array.isArray(formData.ref_image) ? formData.ref_image : JSON.parse(formData.ref_image);
                        count = Array.isArray(imgs) ? imgs.length : 1;
                      } catch { count = 1; }
                    }
                    return `${count} Attached`;
                  })()}
                </span>
              </div>

              {/* Gallery Grid */}
              {(() => {
                let imgs = [];
                if (formData.ref_image) {
                  try {
                    imgs = Array.isArray(formData.ref_image) ? formData.ref_image : JSON.parse(formData.ref_image);
                  } catch {
                    imgs = formData.ref_image ? [formData.ref_image] : [];
                  }
                }
                if (!Array.isArray(imgs)) imgs = [];
                imgs = imgs.filter(img => typeof img === 'string' && img.trim());

                if (imgs.length === 0) return null;

                return (
                  <div className="grid grid-cols-3 gap-2">
                    {imgs.map((imgUrl, idx) => {
                      const fullUrl = imgUrl.startsWith('http') || imgUrl.startsWith('blob:') ? imgUrl : `${apiBase}${imgUrl}`;
                      const isCurrentVisionTarget = previewImage === fullUrl;

                      return (
                        <div
                          key={idx}
                          className={`relative aspect-square rounded-xl overflow-hidden border group bg-slate-50 dark:bg-slate-800 ${
                            isCurrentVisionTarget ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <img src={fullUrl} alt={`Ref ${idx + 1}`} className="w-full h-full object-cover" />
                          
                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                            <button
                              type="button"
                              onClick={() => handleSetRefAsVisionTarget(imgUrl)}
                              className="text-[9px] px-1.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-all w-full text-center truncate"
                              title="Use this image for Vision AI Analysis"
                            >
                              {isCurrentVisionTarget ? 'Active' : 'Use for AI'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveRefImage(idx)}
                              className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center justify-center p-1"
                              title="Delete this reference image"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Upload Multi-Reference Images Button */}
              <label className="flex items-center justify-center gap-2 w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-xl cursor-pointer transition-all text-[11px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                <FiPlus size={13} className="text-blue-500" />
                <span>Add Reference Images</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleMultipleRefImagesUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* 3. Reference Links (Optional Attachments / Drive / URLs) */}
            <div className="p-4 bg-white dark:bg-[#111c33]/70 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FiLink className="text-blue-500 dark:text-blue-400" size={13} /> Reference Links
                </span>
                <button
                  type="button"
                  onClick={handleAddRefLink}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1"
                >
                  <FiPlus size={11} /> Add Link
                </button>
              </div>

              <div className="space-y-1.5">
                {(Array.isArray(formData.ref_links) ? formData.ref_links : [formData.ref_links || '']).map((link, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="url"
                      value={link || ''}
                      onChange={(e) => handleRefLinkChange(idx, e.target.value)}
                      placeholder={`https://... (Link ${idx + 1})`}
                      className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                    />
                    {(Array.isArray(formData.ref_links) ? formData.ref_links : ['']).length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRefLink(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Target Visual Image (Optional Exact Replica) */}
            <div className="p-3 bg-white dark:bg-[#111c33]/70 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FiTarget className="text-emerald-500 dark:text-emerald-400" size={13} /> Target Visual Image (Optional)
                </span>
                {visualPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveVisualImage}
                    className="text-[10px] text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 font-bold flex items-center gap-1"
                  >
                    <FiTrash2 size={11} /> Remove
                  </button>
                )}
              </div>

              {visualPreview ? (
                <div className="relative h-28 rounded-xl overflow-hidden border border-emerald-500/30">
                  <img src={visualPreview} alt="Visual Target" className="w-full h-full object-contain bg-slate-100 dark:bg-black/40" />
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-xl cursor-pointer transition-all text-[11px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  <FiPlus size={13} className="text-emerald-500 dark:text-emerald-400" />
                  <span>Attach Visual Image (Optional)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleVisualImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* ── AI Model Selection (Temporarily Commented Out) ── */}
            {/*
            <div className="relative" ref={modelDropdownRef}>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FiCpu className="text-blue-500 dark:text-blue-400" size={14} /> AI Reasoning Engine
                </label>
                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <HiSparkles className="text-amber-500" size={11} /> OpenRouter Free Tier
                </span>
              </div>

              {(() => {
                const currentModel = AI_MODELS.find(m => m.id === selectedAiModel) || AI_MODELS[0];
                return (
                  <button
                    type="button"
                    onClick={() => setIsModelDropdownOpen(prev => !prev)}
                    className={`w-full p-2.5 rounded-2xl border transition-all text-left flex items-center justify-between gap-2 shadow-sm ${
                      isModelDropdownOpen
                        ? 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white hover:bg-slate-50/80 dark:bg-[#111c33] dark:hover:bg-[#15233f] border-slate-200 dark:border-slate-700/70 hover:border-blue-400 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg flex-shrink-0 shadow-inner">
                        {currentModel.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {currentModel.name}
                          </span>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${currentModel.badgeColor}`}>
                            {currentModel.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                          {currentModel.desc}
                        </p>
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-400 transition-transform duration-200 flex-shrink-0 ${isModelDropdownOpen ? 'rotate-180 text-blue-500' : ''}`}>
                      <FiChevronDown size={16} />
                    </div>
                  </button>
                );
              })()}

              {isModelDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl p-2 space-y-1.5 max-h-[310px] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Choose AI Engine for Blueprint
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Zero Cost
                    </span>
                  </div>

                  {AI_MODELS.map((model) => {
                    const isSelected = model.id === selectedAiModel;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          setSelectedAiModel(model.id);
                          setIsModelDropdownOpen(false);
                          toast.success(`Active AI Model: ${model.name}`);
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all group ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500/80 shadow-sm ring-1 ring-blue-500/30'
                            : 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-transform group-hover:scale-110 ${
                            isSelected ? 'bg-blue-500/20 shadow-sm' : 'bg-slate-100 dark:bg-slate-800'
                          }`}>
                            {model.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-bold ${
                                isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'
                              }`}>
                                {model.name}
                              </span>
                              <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded border ${model.badgeColor}`}>
                                {model.badge}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                              {model.desc}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="text-blue-600 dark:text-blue-400 flex-shrink-0 animate-in zoom-in duration-150">
                            <FiCheckCircle size={16} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            */}

            {/* Blueprint Instructions Prompt */}
            <div className="flex-1 flex flex-col">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                AI Architect Instructions (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Extract CMYK colors, generate Plus Jakarta Sans typography, build 5-folder PSD layer tree for Freepik print standard..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="w-full bg-white dark:bg-[#111c33] border border-slate-300 dark:border-slate-700/80 rounded-2xl p-3 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 resize-none flex-1 shadow-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleArchitectBlueprint()}
                disabled={isArchitecting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isArchitecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Architecting PSD Blueprint...</span>
                  </>
                ) : (
                  <>
                    <FiCpu size={16} />
                    <span>{blueprint ? 'Re-Architect with AI' : 'Architect PSD Blueprint'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  const newInst = (customInstructions ? customInstructions + ' • ' : '') + 'Make a better creative, restructured and modern variant with distinct layout structure and catchy professional title.';
                  setCustomInstructions(newInst);
                  handleArchitectBlueprint(newInst);
                }}
                disabled={isArchitecting}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FiZap size={14} /> Make Better Variant (Restructure)
              </button>
            </div>
          </div>

          {/* ── RIGHT PANEL: Tabbed Interactive Studio (8 Cols) ── */}
          <div className="lg:col-span-8 p-6 bg-white dark:bg-[#0b1120] overflow-y-auto space-y-5 flex flex-col custom-scrollbar">
            
            {/* ── Multi-Variant Navigation Bar ── */}
            <div className="p-3 bg-slate-50 dark:bg-[#0e172a] rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5 max-w-full">
                {variants.length === 0 ? (
                  <div className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 px-2">
                    <FiLayers size={14} className="text-blue-500" />
                    <span>No variants created yet</span>
                  </div>
                ) : (
                  variants.map((v, idx) => {
                    const isSelected = activeVariantIndex === idx;
                    const isActiveTarget = Boolean(v.is_active);
                    return (
                      <div
                        key={v.id || idx}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 ring-2 ring-blue-500/20'
                            : 'bg-white dark:bg-[#131d31] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-slate-600'
                        }`}
                        onClick={() => {
                          setActiveVariantIndex(idx);
                          setRawJsonText(JSON.stringify(v.blueprint_data || {}, null, 2));
                        }}
                      >
                        <span className="flex items-center gap-1">
                          {isActiveTarget && <span className="text-amber-300" title="Primary Target Variant">⭐</span>}
                          {v.variant_name || `Variant ${idx + 1}`}
                        </span>

                        {/* Actions within badge */}
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            type="button"
                            onClick={(e) => handleDuplicateVariant(idx, e)}
                            title="Duplicate this Variant"
                            className={`p-1 rounded transition-colors ${isSelected ? 'hover:bg-blue-700 text-blue-100' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
                          >
                            <FiCopy size={11} />
                          </button>
                          {variants.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteVariant(idx, e)}
                              title="Delete Variant"
                              className={`p-1 rounded transition-colors ${isSelected ? 'hover:bg-rose-600 text-blue-100 hover:text-white' : 'text-slate-400 hover:text-rose-500'}`}
                            >
                              <FiTrash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold transition-all flex items-center gap-1.5 bg-white/50 dark:bg-slate-900/50 hover:shadow-sm"
                >
                  <FiPlus size={13} className="text-blue-500" />
                  <span>New Variant</span>
                </button>
              </div>

              {/* Active Variant Controls & Info */}
              {currentVariant && (
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Name:</span>
                    <input
                      type="text"
                      value={currentVariant.variant_name || ''}
                      onChange={(e) => handleRenameVariant(activeVariantIndex, e.target.value)}
                      placeholder="Variant Name"
                      className="bg-white dark:bg-[#131d31] border border-slate-200 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 w-36 shadow-inner"
                    />
                  </div>

                  {currentVariant.is_active ? (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-black flex items-center gap-1">
                      ⭐ Primary Target
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleSetActiveTarget(activeVariantIndex, e)}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-all flex items-center gap-1"
                    >
                      <FiCheck size={12} /> Set as Primary
                    </button>
                  )}
                </div>
              )}
            </div>

            {!blueprint ? (
              /* EMPTY STATE */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-[#0e172a]/40 min-h-[420px] space-y-5 animate-in fade-in duration-300">
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                    <FiGrid size={36} />
                  </div>
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-md">
                    <FiCpu size={12} />
                  </span>
                </div>

                <div className="max-w-md space-y-1.5">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">No Design Blueprint Generated Yet</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    Upload a reference flyer preview on the left or enter instructions, then click <strong className="text-blue-600 dark:text-blue-400">"Architect PSD Blueprint"</strong> to auto-extract structured specifications, color palette, typography, and PSD layers.
                  </p>
                </div>
              </div>
            ) : (
              /* ACTIVE INTERACTIVE BLUEPRINT TABS */
              <>
                {/* Tab Selector & Export Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800/80 flex-shrink-0">
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#111c33] p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab('json_spec')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'json_spec'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <FiCode size={14} /> Blueprint Specs
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('assets_links')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'assets_links'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <FiLink size={14} /> Assets & Links
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('layer_tree')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        activeTab === 'layer_tree'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <FiLayers size={14} /> PSD Layer Tree
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRawJson(prev => !prev)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                        showRawJson
                          ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <FiCode size={12} /> {showRawJson ? 'Hide Raw JSON' : 'Direct JSON Editor'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(blueprint, null, 2));
                        toast.success('Blueprint JSON copied to clipboard!');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      <FiCopy size={12} /> Export JSON
                    </button>
                  </div>
                </div>

                {/* ── OPTIONAL RAW JSON DIRECT EDITOR ── */}
                {showRawJson && (
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-mono font-bold text-slate-300">Live JSON Blueprint Editor</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyRawJson}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                      >
                        <FiCheck size={13} /> Apply JSON Changes
                      </button>
                    </div>

                    <textarea
                      rows={10}
                      value={rawJsonText}
                      onChange={(e) => setRawJsonText(e.target.value)}
                      className="w-full bg-[#070b14] border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 focus:outline-none focus:border-blue-500 leading-relaxed custom-scrollbar resize-y"
                    />
                  </div>
                )}

                {/* ── TAB 1: BLUEPRINT SPECS (INTERACTIVE) ── */}
                {activeTab === 'json_spec' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Format & Dimensions Editable Spec Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 dark:bg-[#111c33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                          Document Format
                        </p>
                        <input
                          type="text"
                          value={blueprint.doc_format || ''}
                          onChange={(e) => handleDocSpecChange('doc_format', e.target.value)}
                          placeholder="e.g. A4 Flyer"
                          className="w-full bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-1 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="bg-slate-50 dark:bg-[#111c33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                          Resolution & Mode
                        </p>
                        <input
                          type="text"
                          value={blueprint.resolution_mode || ''}
                          onChange={(e) => handleDocSpecChange('resolution_mode', e.target.value)}
                          placeholder="e.g. 300 DPI CMYK"
                          className="w-full bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-1 text-xs font-black text-amber-600 dark:text-amber-400 outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="bg-slate-50 dark:bg-[#111c33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                          Dimensions
                        </p>
                        <input
                          type="text"
                          value={blueprint.dimensions || ''}
                          onChange={(e) => handleDocSpecChange('dimensions', e.target.value)}
                          placeholder="e.g. 210 x 297 mm"
                          className="w-full bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-1 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="bg-slate-50 dark:bg-[#111c33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                          Bleed Margin
                        </p>
                        <input
                          type="text"
                          value={blueprint.bleed_margin || ''}
                          onChange={(e) => handleDocSpecChange('bleed_margin', e.target.value)}
                          placeholder="e.g. 3 mm"
                          className="w-full bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-700/80 rounded-xl px-2.5 py-1 text-xs font-black text-emerald-600 dark:text-emerald-400 outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* 🎨 Interactive Color Palette Editor */}
                    <div className="bg-slate-50 dark:bg-[#111c33] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          🎨 Color Palette (Interactive Visual & Hex Editor)
                        </h4>
                        <button
                          type="button"
                          onClick={handleAddColor}
                          className="px-3 py-1 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 border border-blue-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <FiPlus size={12} /> Add Color
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {(blueprint.color_palette || []).map((c, i) => (
                          <div
                            key={i}
                            className="bg-white dark:bg-[#0b1120] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 transition-all flex flex-col justify-between gap-2.5 shadow-sm group"
                          >
                            <div className="flex items-center gap-2.5">
                              {/* Native Color Picker Swatch */}
                              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-white/15 flex-shrink-0 shadow-inner">
                                <input
                                  type="color"
                                  value={c.hex && c.hex.startsWith('#') ? c.hex : '#2563EB'}
                                  onChange={(e) => handleColorChange(i, 'hex', e.target.value.toUpperCase())}
                                  className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer border-none"
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <input
                                  type="text"
                                  value={c.name || ''}
                                  onChange={(e) => handleColorChange(i, 'name', e.target.value)}
                                  placeholder="Color Name"
                                  className="w-full text-xs font-bold text-slate-800 dark:text-slate-200 bg-transparent outline-none border-b border-transparent focus:border-blue-500 pb-0.5"
                                />
                                <input
                                  type="text"
                                  value={c.hex || ''}
                                  onChange={(e) => handleColorChange(i, 'hex', e.target.value)}
                                  placeholder="#HEX"
                                  className="w-full font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-transparent outline-none border-b border-transparent focus:border-blue-500"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2 text-xs">
                              <button
                                type="button"
                                onClick={() => handleCopyHex(c.hex)}
                                className="text-[11px] text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 font-bold flex items-center gap-1"
                              >
                                {copiedColor === c.hex ? <FiCheck className="text-emerald-500" /> : <FiCopy size={11} />}
                                <span>{copiedColor === c.hex ? 'Copied' : 'Copy'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveColor(i)}
                                className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-1 rounded-md"
                                title="Remove Color"
                              >
                                <FiTrash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ✍️ Interactive Typography Specifications */}
                    <div className="bg-slate-50 dark:bg-[#111c33] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <FiType className="text-blue-500 dark:text-blue-400" /> Typography Specifications
                        </h4>
                        <button
                          type="button"
                          onClick={handleAddTypography}
                          className="px-3 py-1 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 border border-blue-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <FiPlus size={12} /> Add Font
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(blueprint.typography || []).map((t, i) => (
                          <div key={i} className="bg-white dark:bg-[#0b1120] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <input
                                type="text"
                                value={t.font || ''}
                                onChange={(e) => handleTypographyChange(i, 'font', e.target.value)}
                                placeholder="Font Family Name (e.g. Montserrat)"
                                className="text-sm font-black text-slate-900 dark:text-white bg-transparent outline-none border-b border-transparent focus:border-blue-500 flex-1 pb-0.5"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveTypography(i)}
                                className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-1"
                                title="Remove Font"
                              >
                                <FiTrash2 size={13} />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase">Weights</label>
                                <input
                                  type="text"
                                  value={t.weights || ''}
                                  onChange={(e) => handleTypographyChange(i, 'weights', e.target.value)}
                                  placeholder="e.g. Regular, Bold"
                                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-lg px-2 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase">Usage</label>
                                <input
                                  type="text"
                                  value={t.usage || ''}
                                  onChange={(e) => handleTypographyChange(i, 'usage', e.target.value)}
                                  placeholder="e.g. Main Headlines"
                                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 📐 Structural Layout Breakdown */}
                    <div className="bg-slate-50 dark:bg-[#111c33] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <FiFileText className="text-blue-500 dark:text-blue-400" /> Structural Layout Breakdown
                        </h4>
                        <button
                          type="button"
                          onClick={handleAddLayoutSection}
                          className="px-3 py-1 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 border border-blue-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <FiPlus size={12} /> Add Section
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {(blueprint.layout_breakdown || []).map((l, i) => (
                          <div key={i} className="bg-white dark:bg-[#0b1120] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-start gap-3 text-xs shadow-sm">
                            <input
                              type="text"
                              value={l.section || ''}
                              onChange={(e) => handleLayoutChange(i, 'section', e.target.value)}
                              placeholder="Section Name"
                              className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono font-bold shrink-0 outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <textarea
                              rows={2}
                              value={l.description || ''}
                              onChange={(e) => handleLayoutChange(i, 'description', e.target.value)}
                              placeholder="Section description & placement details..."
                              className="flex-1 w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-lg p-2 text-slate-700 dark:text-slate-300 font-medium outline-none resize-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveLayoutSection(i)}
                              className="text-slate-400 hover:text-rose-500 p-1 self-center"
                              title="Remove Section"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: ASSETS & LINKS (INTERACTIVE) ── */}
                {activeTab === 'assets_links' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* 1. Verified Free Google Fonts */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <FiType className="text-blue-500 dark:text-blue-400" /> Verified Free Google Fonts
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleAddAsset('font')}
                          className="px-3 py-1 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 border border-blue-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <FiPlus size={12} /> Add Font Link
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(blueprint.assets_links?.filter(a => a.type === 'font') || blueprint.typography || []).map((f, i) => {
                          const fontName = f.name || f.font || 'Font';
                          const fontUrl = f.url || `https://fonts.google.com/specimen/${encodeURIComponent(fontName.replace(/\s*\(.*\)/, ''))}`;
                          return (
                            <div
                              key={i}
                              className="bg-slate-50 dark:bg-[#111c33] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                                  {fontName.replace(/\s*\(Google Fonts\)/i, '')}
                                </p>
                                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                                  {f.license || 'Free Commercial License'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={fontUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-8 h-8 rounded-xl bg-white dark:bg-[#0b1120] text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 flex items-center justify-center border border-slate-200 dark:border-slate-800 transition-all shadow-sm"
                                  title="Open Font Specimen"
                                >
                                  <FiExternalLink size={14} />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Icon Glyphs & Vector Links */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <FiSmile className="text-blue-500 dark:text-blue-400" /> Icon Glyphs & Vector Links (Photoshop / Illustrator)
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleAddAsset('glyph')}
                          className="px-3 py-1 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 border border-blue-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <FiPlus size={12} /> Add Glyph
                        </button>
                      </div>

                      <div className="space-y-2">
                        {/* FontAwesome Official Download Item */}
                        <div className="bg-slate-50 dark:bg-[#111c33] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm">
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">FontAwesome Official Vector Font</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Required for Photoshop glyph text tools</p>
                          </div>
                          <a
                            href="https://fontawesome.com/download"
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-sm"
                          >
                            <span>Download</span>
                            <FiExternalLink size={12} />
                          </a>
                        </div>

                        {/* Glyph Items */}
                        {(blueprint.assets_links?.filter(a => a.type === 'glyph' || a.type === 'icon') || [
                          { name: 'Feature / Chart Icon', query: 'Flaticon SVG query: chart', glyph: '\\f080' },
                          { name: 'Marketing / Bullhorn Icon', query: 'Flaticon SVG query: bullhorn', glyph: '\\f0a1' },
                          { name: 'Users / Team Icon', query: 'Flaticon SVG query: users', glyph: '\\f0c0' },
                          { name: 'Contact Phone & Globe Icons', query: 'Flaticon SVG query: phone', glyph: '\\f095' }
                        ]).map((g, i) => {
                          const glyphVal = g.glyph || (g.note?.match(/\\f[0-9a-f]+/i)?.[0]) || `\\f0${80 + i}`;
                          const queryText = g.query || g.note || `Flaticon SVG query: ${g.name?.toLowerCase()}`;
                          return (
                            <div key={i} className="bg-slate-50 dark:bg-[#111c33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm">
                              <div className="flex items-center gap-3">
                                <p className="text-xs font-black text-slate-900 dark:text-white">{g.name}</p>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">{queryText}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(glyphVal);
                                  toast.success(`Copied Glyph ${glyphVal} to clipboard!`);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 dark:bg-[#0b1120] dark:hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-sm"
                              >
                                <span>Glyph: {glyphVal}</span>
                                <FiCopy size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Unsplash / Stock Placeholders */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <FiImage className="text-blue-500 dark:text-blue-400" /> Commercial-Use Stock Photo Placeholders
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleAddAsset('stock')}
                          className="px-3 py-1 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 border border-blue-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <FiPlus size={12} /> Add Stock Search
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(blueprint.assets_links?.filter(a => a.type === 'stock' || a.type === 'image' || a.type === 'placeholder') || [
                          { name: 'Topic Hero Photo Placeholder', url: 'https://unsplash.com/s/photos/business-meeting' },
                          { name: 'Secondary Subject Placeholder', url: 'https://unsplash.com/s/photos/modern-office' },
                          { name: 'Background Texture / Vectors', url: 'https://www.freepik.com/search?query=abstract+background' }
                        ]).map((p, i) => {
                          const itemName = p.name || 'Stock Photo Placeholder';
                          const targetUrl = (p.url && p.url.startsWith('http'))
                            ? p.url
                            : `https://unsplash.com/s/photos/${encodeURIComponent(itemName.toLowerCase().replace(/[^a-z0-9 ]/g, ''))}`;

                          return (
                            <a
                              key={i}
                              href={targetUrl}
                              target="_blank"
                              rel="noreferrer"
                              title={itemName}
                              className="bg-slate-50 dark:bg-[#111c33] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/60 hover:bg-slate-100/80 dark:hover:bg-[#13203c] transition-all flex items-center justify-between gap-2 group shadow-sm"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                                  {itemName}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                  Direct Search ↗
                                </p>
                              </div>
                              <div className="w-7 h-7 rounded-xl bg-white dark:bg-[#0b1120] text-slate-500 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <FiExternalLink size={13} />
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 3: PSD LAYER TREE (INTERACTIVE IN-PLACE EDITING) ── */}
                {activeTab === 'layer_tree' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="bg-slate-50 dark:bg-[#111c33] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <FiLayers className="text-blue-500 dark:text-blue-400" /> Photoshop Layer Structure Editor
                        </h4>
                        
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleAddGroup}
                            className="px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <FiPlus size={12} /> Add Folder Group
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              let textTree = `📁 [Template] - ${blueprint.doc_format || 'Design Flyer'}\n`;
                              (blueprint.layer_tree || []).forEach((group, gi) => {
                                const isLastGroup = gi === blueprint.layer_tree.length - 1;
                                textTree += `${isLastGroup ? '└──' : '├──'} 📁 ${group.folder}\n`;
                                group.layers?.forEach((layer, li) => {
                                  const isLastLayer = li === group.layers.length - 1;
                                  const icon = layer.icon || (layer.type === 'smart_object' ? '🖼️' : layer.type === 'shape' || layer.type === 'solid_color' ? '🎨' : layer.type === 'guide' ? '🔲' : '📁');
                                  textTree += `${isLastGroup ? '    ' : '│   '}${isLastLayer ? '└──' : '├──'} ${icon} ${layer.name}\n`;
                                });
                              });
                              navigator.clipboard.writeText(textTree);
                              toast.success('PSD Layer Tree copied to clipboard!');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <FiCopy size={12} /> Copy ASCII Tree
                          </button>
                        </div>
                      </div>

                      {/* Interactive Visual Layer Groups */}
                      <div className="space-y-4">
                        {(blueprint.layer_tree || []).map((group, gi) => (
                          <div
                            key={gi}
                            className="p-4 rounded-2xl bg-white dark:bg-[#070b14] border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm"
                          >
                            {/* Group Folder Header */}
                            <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-amber-500">📁</span>
                                <input
                                  type="text"
                                  value={group.folder || ''}
                                  onChange={(e) => handleGroupFolderChange(gi, e.target.value)}
                                  placeholder="Folder Group Name (e.g. 01_HEADER)"
                                  className="text-xs font-bold text-blue-600 dark:text-cyan-400 bg-transparent outline-none border-b border-transparent focus:border-blue-500 flex-1"
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleAddLayer(gi)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-600 dark:text-blue-400 text-[11px] font-bold transition-all flex items-center gap-1"
                                  title="Add Layer inside this group"
                                >
                                  <FiPlus size={11} /> Layer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGroup(gi)}
                                  className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400"
                                  title="Delete Group"
                                >
                                  <FiTrash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {/* Children Layers */}
                            <div className="space-y-1.5 pl-4">
                              {(group.layers || []).map((layer, li) => (
                                <div
                                  key={li}
                                  className="flex items-center gap-2.5 text-xs p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                                >
                                  <span className="text-slate-400 font-mono text-[10px]">└─</span>
                                  
                                  {/* Type Select */}
                                  <select
                                    value={layer.type || 'shape'}
                                    onChange={(e) => handleLayerChange(gi, li, 'type', e.target.value)}
                                    className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none"
                                  >
                                    <option value="shape">🎨 Shape</option>
                                    <option value="smart_object">🖼️ Smart Object</option>
                                    <option value="solid_color">🖌️ Solid Color</option>
                                    <option value="text">✍️ Text</option>
                                    <option value="guide">🔲 Guide / Frame</option>
                                  </select>

                                  {/* Layer Name Input */}
                                  <input
                                    type="text"
                                    value={layer.name || ''}
                                    onChange={(e) => handleLayerChange(gi, li, 'name', e.target.value)}
                                    placeholder="Layer Name"
                                    className="flex-1 bg-transparent font-medium text-slate-800 dark:text-slate-200 text-xs outline-none border-b border-transparent focus:border-blue-500"
                                  />

                                  {/* Optional Color */}
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="color"
                                      value={layer.color && layer.color.startsWith('#') ? layer.color : '#2563EB'}
                                      onChange={(e) => handleLayerChange(gi, li, 'color', e.target.value.toUpperCase())}
                                      className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                                      title="Layer Identification Color"
                                    />
                                    <input
                                      type="text"
                                      value={layer.color || ''}
                                      onChange={(e) => handleLayerChange(gi, li, 'color', e.target.value)}
                                      placeholder="#HEX"
                                      className="w-16 font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-transparent outline-none"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLayer(gi, li)}
                                    className="text-slate-400 hover:text-rose-500 p-1"
                                    title="Delete Layer"
                                  >
                                    <FiTrash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Bottom Actions Footer ── */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0e172a] flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
            {blueprint
              ? isEdit
                ? 'Ready to save updated AI Blueprint task.'
                : 'Ready to assign task with customized AI Blueprint specifications.'
              : 'Upload reference image or click Architect PSD Blueprint to generate.'}
          </p>

          <div className="flex items-center gap-3">
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors border border-rose-200 dark:border-rose-800 shadow-sm flex items-center gap-1.5"
              >
                <FiTrash2 size={13} /> Delete Task
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors border border-slate-300 dark:border-slate-700 shadow-sm"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={actionLoading || !formData.title?.trim()}
              className="px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {actionLoading
                ? isEdit
                  ? 'Saving Changes...'
                  : 'Assigning...'
                : isEdit
                  ? 'Save Changes'
                  : 'Assign Agentic Task'}{' '}
              <FiCheck />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AgenticTaskModal;

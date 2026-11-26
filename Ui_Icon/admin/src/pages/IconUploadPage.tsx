// admin/src/pages/IconUploadPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getAdminCategories,
  getAdminSettings,
  uploadAdminIcon,
  batchUploadAdminIcons,
  BatchIconUploadItem,
  generateAdminAiTags,
  inspectAdminAiIcons,
  AiIconInspectionResult
} from '@/lib/api';
import { AdminCategoryItem } from '@/types/admin';
import {
  UploadCloud,
  Layers,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Search,
  Crown,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileCheck,
  Link2,
  Unlink,
  CheckSquare,
  Square,
  Filter,
  Check,
  X,
  ChevronRight,
  Tag,
  Wand2,
  Eye,
  AlertTriangle
} from 'lucide-react';

interface QueuedIcon {
  id: string; // client temporary ID
  name: string;
  category_id: number;
  tags: string;
  status: 'published' | 'draft';
  is_premium: boolean;
  svg_outlined?: string;
  svg_filled?: string;
  detectedVariants: 'both' | 'outlined' | 'filled';
  originalFiles: string[];
  pairKey?: string;
}

export default function IconUploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mode: 'single' or 'bulk'
  const [mode, setMode] = useState<'single' | 'bulk'>('bulk');

  // Categories
  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);

  // -------------------------------------------------------------
  // Single Upload State
  // -------------------------------------------------------------
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [svgOutlined, setSvgOutlined] = useState('');
  const [svgFilled, setSvgFilled] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [previewBg, setPreviewBg] = useState<'dark' | 'light' | 'grid'>('dark');

  // -------------------------------------------------------------
  // Bulk Upload State
  // -------------------------------------------------------------
  const [queue, setQueue] = useState<QueuedIcon[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [globalCategory, setGlobalCategory] = useState<number | ''>('');
  const [globalStatus, setGlobalStatus] = useState<'published' | 'draft'>('published');
  const [globalIsPremium, setGlobalIsPremium] = useState<boolean>(false);
  const [globalTags, setGlobalTags] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedBatchCategory, setSelectedBatchCategory] = useState<number | ''>('');
  const [selectedBatchTags, setSelectedBatchTags] = useState('');

  // AI Tagging & Visual Inspection State (Powered by Gemini 2.5 Flash)
  const [aiTagLimit, setAiTagLimit] = useState<number>(6);
  const [generatingAiTags, setGeneratingAiTags] = useState(false);
  const [generatingSingleAi, setGeneratingSingleAi] = useState(false);
  const [inspections, setInspections] = useState<Record<string, AiIconInspectionResult>>({});
  const [inspectingAiVisuals, setInspectingAiVisuals] = useState<boolean>(false);
  const [inspectingSingleVisual, setInspectingSingleVisual] = useState<boolean>(false);

  // Quick Filter: 'all' | 'paired' | 'unpaired'
  const [variantFilter, setVariantFilter] = useState<'all' | 'paired' | 'unpaired'>('all');

  // Link Variant Modal State
  const [linkModalItem, setLinkModalItem] = useState<QueuedIcon | null>(null);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');

  // Smart Merge Suggestion State (when admin renames an icon)
  const [mergeSuggestion, setMergeSuggestion] = useState<{
    sourceId: string;
    targetId: string;
    name: string;
    sourceVariant: 'outlined' | 'filled';
    targetVariant: 'outlined' | 'filled';
  } | null>(null);

  // Bulk Progress state
  const [uploadProgress, setUploadProgress] = useState<{
    uploading: boolean;
    currentBatch: number;
    totalBatches: number;
    uploadedCount: number;
    totalCount: number;
  }>({
    uploading: false,
    currentBatch: 0,
    totalBatches: 0,
    uploadedCount: 0,
    totalCount: 0,
  });

  // Feedback states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [catsRes, settingsRes] = await Promise.allSettled([
          getAdminCategories(),
          getAdminSettings(),
        ]);

        if (catsRes.status === 'fulfilled' && catsRes.value.success && catsRes.value.data) {
          setCategories(catsRes.value.data);
          if (catsRes.value.data.length > 0) {
            setCategoryId(catsRes.value.data[0].id);
            setGlobalCategory(catsRes.value.data[0].id);
          }
        }

        // Initial data loaded cleanly
      } catch (err) {
        console.error('Failed to load initial upload data', err);
      }
    }
    loadInitialData();
  }, []);

  // =============================================================
  // SVG Normalizer: ensures all icons use currentColor
  // and render crisp white on dark admin UI and adapt to user colors
  // =============================================================
  function normalizeSvgToCurrentColor(svgStr: string): string {
    if (!svgStr) return '';
    let svg = svgStr.trim();

    // 1. Remove XML declaration or DOCTYPE to keep raw SVG clean
    svg = svg.replace(/<\?xml[\s\S]*?\?>/gi, '').replace(/<!DOCTYPE[\s\S]*?>/gi, '').trim();

    // 2. Remove any white background artboards (e.g. <rect width="100%" height="100%" fill="white"/>)
    svg = svg.replace(/<rect\b[^>]*(width=["']100%["']|height=["']100%["'])[^>]*fill=["'](white|#fff|#ffffff)["'][^>]*\/?>/gi, '');

    // 3. Process <style> blocks if present
    if (svg.includes('<style')) {
      svg = svg.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_, css) => {
        const updatedCss = css
          .replace(/fill\s*:\s*(?!none\b|transparent\b)[^;}"']+/gi, 'fill: currentColor')
          .replace(/stroke\s*:\s*(?!none\b|transparent\b)[^;}"']+/gi, 'stroke: currentColor');
        return `<style>${updatedCss}</style>`;
      });
    }

    // 4. Replace hardcoded dark/black/colored fills (except fill="none" and fill="transparent")
    svg = svg.replace(/(?<![a-zA-Z-])fill=(["'])(?!none\b|transparent\b)[^"']*["']/gi, 'fill="currentColor"');

    // 5. Replace hardcoded strokes (except stroke="none" and stroke="transparent")
    svg = svg.replace(/(?<![a-zA-Z-])stroke=(["'])(?!none\b|transparent\b)[^"']*["']/gi, 'stroke="currentColor"');

    // 6. Replace inline styles
    svg = svg.replace(/fill\s*:\s*(?!none\b|transparent\b)[^;}"']+/gi, 'fill: currentColor');
    svg = svg.replace(/stroke\s*:\s*(?!none\b|transparent\b)[^;}"']+/gi, 'stroke: currentColor');

    return svg;
  }

  // =============================================================
  // Filename Parser Helper
  // Extracts clean name (ignoring leading numbers like (26)_ or 12_)
  // and detects filled vs outlined variant suffixes
  // =============================================================
  function parseIconFilename(filename: string) {
    const lowerName = filename.toLowerCase().replace(/\.svg$/i, '').trim();

    // Check variant indicators: _filled, -filled, _outlined, -outlined, _outline, -outline, etc.
    const isFilled = /[-_](filled|fill|solid)$/i.test(lowerName);
    const isOutlined = /[-_](outlined|outline|line|stroke)$/i.test(lowerName);

    // Clean base name without variant suffix
    const withoutVariant = lowerName
      .replace(/[-_](filled|fill|solid|outlined|outline|line|stroke)$/i, '')
      .trim();

    // Extract leading number prefix if present, e.g. "(26)_" -> "26", "12_" -> "12"
    const prefixMatch = withoutVariant.match(/^[\(\[\{]?\s*(\d+)\s*[\)\]\}]?\s*[-_.\s]*/i);
    const numberPrefix = prefixMatch ? prefixMatch[1] : '';

    // Clean base name without leading numbers/indexes
    // Removes (26)_, [1]-, 12_, (12) , etc.
    const baseName = withoutVariant
      .replace(/^([\(\[\{]?\s*\d+\s*[\)\]\}]?\s*[-_.\s]*)+/i, '')
      .trim();

    // Pair key ensures icons with the same index and name pair together (e.g. (26) filled & (26) outline)
    // while keeping them distinct from other icons (e.g. (27) or (29) with the same descriptive name)
    const pairKey = (numberPrefix ? `${numberPrefix}_` : '') + (baseName || withoutVariant).replace(/[^a-z0-9]/g, '');

    // Formatted display name (e.g. abstract-structure -> Abstract Structure)
    const cleanTitle = (baseName || withoutVariant)
      .split(/[-_]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    // Auto-generated tags (excluding pure numeric tokens)
    const autoTags = (baseName || withoutVariant)
      .split(/[-_]+/)
      .filter((w) => w.length > 2 && !/^\d+$/.test(w))
      .join(', ');

    return {
      isFilled,
      isOutlined,
      numberPrefix,
      pairKey,
      cleanTitle: cleanTitle || 'Untitled Icon',
      autoTags,
    };
  }

  // =============================================================
  // Single Upload Handlers
  // =============================================================
  function handleSingleFileUpload(e: React.ChangeEvent<HTMLInputElement>, variant: 'outlined' | 'filled') {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      setErrorMsg('Please select a valid .svg file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawContent = (event.target?.result as string) || '';
      const content = normalizeSvgToCurrentColor(rawContent);
      const parsed = parseIconFilename(file.name);
      if (variant === 'outlined') {
        setSvgOutlined(content);
        if (!name) {
          setName(parsed.cleanTitle);
          if (!tags && parsed.autoTags) setTags(parsed.autoTags);
        }
      } else {
        setSvgFilled(content);
        if (!name) {
          setName(parsed.cleanTitle);
          if (!tags && parsed.autoTags) setTags(parsed.autoTags);
        }
      }
      setErrorMsg(null);
    };
    reader.readAsText(file);
  }

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please provide an icon name.');
      return;
    }

    if (!categoryId) {
      setErrorMsg('Please select a category.');
      return;
    }

    if (!svgOutlined.trim() && !svgFilled.trim()) {
      setErrorMsg('Please upload or paste at least one SVG variant (outlined or filled).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await uploadAdminIcon({
        name: name.trim(),
        category_id: Number(categoryId),
        tags: tags.trim(),
        status,
        svg_outlined: svgOutlined.trim() || undefined,
        svg_filled: svgFilled.trim() || undefined,
      });

      if (res.success && res.data) {
        setSuccessMsg(`Icon "${res.data.name}" uploaded successfully!`);
        setTimeout(() => {
          navigate('/icons');
        }, 1200);
      } else {
        setErrorMsg(res.message || 'Failed to upload icon.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Upload error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  // =============================================================
  // Smart Bulk Upload Parser & Engine
  // =============================================================
  async function processFiles(files: FileList | File[]) {
    setErrorMsg(null);
    const svgFiles = Array.from(files).filter(
      (f) => f.name.toLowerCase().endsWith('.svg') || f.type === 'image/svg+xml'
    );

    if (svgFiles.length === 0) {
      setErrorMsg('No valid .svg files detected. Please drop or select SVG files.');
      return;
    }

    // Read all SVG contents asynchronously
    const readPromises = svgFiles.map((file) => {
      return new Promise<{ filename: string; content: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const raw = (e.target?.result as string) || '';
          resolve({
            filename: file.name,
            content: normalizeSvgToCurrentColor(raw),
          });
        };
        reader.onerror = () => resolve({ filename: file.name, content: '' });
        reader.readAsText(file);
      });
    });

    const results = await Promise.all(readPromises);

    // Grouping map: pairKey -> QueuedIcon
    const map = new Map<string, QueuedIcon>();

    // Start with existing queue items
    queue.forEach((item) => {
      const key = item.pairKey || item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      map.set(key, { ...item });
    });

    const defaultCatId = typeof globalCategory === 'number' ? globalCategory : (categories[0]?.id || 1);

    results.forEach(({ filename, content }) => {
      if (!content || !content.includes('<svg')) return;

      const { isFilled, isOutlined, pairKey, cleanTitle, autoTags } = parseIconFilename(filename);

      const existing = map.get(pairKey);

      if (existing) {
        if (isFilled) {
          existing.svg_filled = content;
          existing.detectedVariants = existing.svg_outlined ? 'both' : 'filled';
        } else if (isOutlined) {
          existing.svg_outlined = content;
          existing.detectedVariants = existing.svg_filled ? 'both' : 'outlined';
        } else {
          // If already has outline, fill the filled, or vice versa
          if (!existing.svg_outlined) {
            existing.svg_outlined = content;
          } else if (!existing.svg_filled) {
            existing.svg_filled = content;
          }
          existing.detectedVariants =
            existing.svg_outlined && existing.svg_filled ? 'both' : existing.svg_outlined ? 'outlined' : 'filled';
        }
        if (!existing.originalFiles.includes(filename)) {
          existing.originalFiles.push(filename);
        }
      } else {
        const item: QueuedIcon = {
          id: `qi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: cleanTitle,
          category_id: defaultCatId,
          tags: autoTags,
          status: globalStatus,
          is_premium: globalIsPremium,
          originalFiles: [filename],
          detectedVariants: isFilled ? 'filled' : 'outlined',
          pairKey,
        };

        if (isFilled) {
          item.svg_filled = content;
        } else {
          item.svg_outlined = content;
        }

        map.set(pairKey, item);
      }
    });

    const updatedQueue = Array.from(map.values());
    setQueue(updatedQueue);
    setSuccessMsg(`Loaded ${svgFiles.length} SVG files (${updatedQueue.length} unique icons queued).`);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }

  function applyGlobalSettingsToAll() {
    if (queue.length === 0) return;
    setQueue((prev) =>
      prev.map((item) => {
        let newTags = item.tags;
        if (globalTags.trim()) {
          const existing = item.tags ? item.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
          const incoming = globalTags.split(',').map(t => t.trim()).filter(Boolean);
          newTags = Array.from(new Set([...existing, ...incoming])).join(', ');
        }
        return {
          ...item,
          category_id: typeof globalCategory === 'number' ? globalCategory : item.category_id,
          status: globalStatus,
          is_premium: globalIsPremium,
          tags: newTags,
        };
      })
    );
    setSuccessMsg('Global settings and tags applied to all icons in queue.');
  }

  function removeFromQueue(id: string) {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (mergeSuggestion && (mergeSuggestion.sourceId === id || mergeSuggestion.targetId === id)) {
      setMergeSuggestion(null);
    }
  }

  function clearQueue() {
    setQueue([]);
    setSelectedIds(new Set());
    setMergeSuggestion(null);
    setLinkModalItem(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  }

  // Multi-Selection Handlers
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(itemsToSelect: QueuedIcon[]) {
    if (selectedIds.size === itemsToSelect.length && itemsToSelect.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(itemsToSelect.map((item) => item.id)));
    }
  }

  function applyCategoryToSelected(catId: number) {
    if (selectedIds.size === 0) return;
    setQueue((prev) =>
      prev.map((item) =>
        selectedIds.has(item.id) ? { ...item, category_id: catId } : item
      )
    );
    setSuccessMsg(`Updated category for ${selectedIds.size} selected icons.`);
  }

  function applyPricingToSelected(isPrem: boolean) {
    if (selectedIds.size === 0) return;
    setQueue((prev) =>
      prev.map((item) =>
        selectedIds.has(item.id) ? { ...item, is_premium: isPrem } : item
      )
    );
    setSuccessMsg(`Set ${selectedIds.size} selected icons to ${isPrem ? 'Pro' : 'Free'}.`);
  }

  function applyStatusToSelected(newStatus: 'published' | 'draft') {
    if (selectedIds.size === 0) return;
    setQueue((prev) =>
      prev.map((item) =>
        selectedIds.has(item.id) ? { ...item, status: newStatus } : item
      )
    );
    setSuccessMsg(`Set ${selectedIds.size} selected icons to ${newStatus}.`);
  }

  function applyTagsToSelected(newTags: string) {
    if (selectedIds.size === 0 || !newTags.trim()) return;
    const incoming = newTags.split(',').map((t) => t.trim()).filter(Boolean);
    setQueue((prev) =>
      prev.map((item) => {
        if (!selectedIds.has(item.id)) return item;
        const existing = item.tags ? item.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
        const merged = Array.from(new Set([...existing, ...incoming])).join(', ');
        return { ...item, tags: merged };
      })
    );
    setSelectedBatchTags('');
    setSuccessMsg(`Tags added to ${selectedIds.size} selected icons.`);
  }

  // =============================================================
  // Gemini AI Tag Generator Handlers
  // =============================================================
  async function handleGenerateAiTagsForQueue() {
    if (queue.length === 0) return;
    setGeneratingAiTags(true);
    setErrorMsg(null);
    try {
      const payload = queue.map((q) => {
        const cat = categories.find((c) => c.id === q.category_id);
        return {
          id: q.id,
          name: q.name,
          category: cat ? cat.name : 'General',
        };
      });
      const res = await generateAdminAiTags({ icons: payload, limit: aiTagLimit });
      if (res.success && res.data?.tags) {
        const tagMap = res.data.tags;
        const catMap = res.data.categories || {};
        const catIdMap = res.data.category_ids || {};
        const newCats = res.data.created_categories || [];

        // Dynamically add any newly created categories to local state & dropdowns
        if (newCats.length > 0) {
          setCategories((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const toAdd: AdminCategoryItem[] = newCats
              .filter((c) => !existingIds.has(c.id))
              .map((c) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
                icon_count: 0,
                total_icons: 0,
                published_icons: 0,
                draft_icons: 0,
                display_order: 99,
                status: 'active' as const,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }));
            return [...prev, ...toAdd];
          });
        }

        setQueue((prev) =>
          prev.map((item) => {
            const newAiTags = tagMap[item.id];
            const suggestedCatName = catMap[item.id];
            let newCatId = catIdMap[item.id] || item.category_id;

            if (!newCatId || newCatId === item.category_id) {
              if (suggestedCatName) {
                const matched = categories.find(
                  (c) => c.name.toLowerCase() === suggestedCatName.toLowerCase()
                );
                if (matched) {
                  newCatId = matched.id;
                }
              }
            }

            if (!newAiTags && newCatId === item.category_id) return item;
            return {
              ...item,
              tags: newAiTags || item.tags,
              category_id: newCatId,
            };
          })
        );

        const newCatsCount = newCats.length;
        const newCatsText = newCatsCount > 0 
          ? ` & auto-created ${newCatsCount} new categor${newCatsCount > 1 ? 'ies' : 'y'} (${newCats.map(c => c.name).join(', ')})`
          : '';
        setSuccessMsg(`✨ Generated AI SEO tags (${aiTagLimit} tags/icon) and auto-categorized ${res.data.total_generated} icons${newCatsText}!`);
      } else {
        setErrorMsg(res.message || 'Failed to generate AI tags.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error generating AI tags.');
    } finally {
      setGeneratingAiTags(false);
    }
  }

  async function handleGenerateAiTagsForSelected() {
    if (selectedIds.size === 0) return;
    const selectedItems = queue.filter((q) => selectedIds.has(q.id));
    setGeneratingAiTags(true);
    setErrorMsg(null);
    try {
      const payload = selectedItems.map((q) => {
        const cat = categories.find((c) => c.id === q.category_id);
        return {
          id: q.id,
          name: q.name,
          category: cat ? cat.name : 'General',
        };
      });
      const res = await generateAdminAiTags({ icons: payload, limit: aiTagLimit });
      if (res.success && res.data?.tags) {
        const tagMap = res.data.tags;
        const catMap = res.data.categories || {};
        const catIdMap = res.data.category_ids || {};
        const newCats = res.data.created_categories || [];

        if (newCats.length > 0) {
          setCategories((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const toAdd: AdminCategoryItem[] = newCats
              .filter((c) => !existingIds.has(c.id))
              .map((c) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
                icon_count: 0,
                total_icons: 0,
                published_icons: 0,
                draft_icons: 0,
                display_order: 99,
                status: 'active' as const,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }));
            return [...prev, ...toAdd];
          });
        }

        setQueue((prev) =>
          prev.map((item) => {
            if (!selectedIds.has(item.id)) return item;
            const newAiTags = tagMap[item.id];
            const suggestedCatName = catMap[item.id];
            let newCatId = catIdMap[item.id] || item.category_id;

            if (!newCatId || newCatId === item.category_id) {
              if (suggestedCatName) {
                const matched = categories.find(
                  (c) => c.name.toLowerCase() === suggestedCatName.toLowerCase()
                );
                if (matched) {
                  newCatId = matched.id;
                }
              }
            }

            if (!newAiTags && newCatId === item.category_id) return item;
            return {
              ...item,
              tags: newAiTags || item.tags,
              category_id: newCatId,
            };
          })
        );
        setSuccessMsg(`✨ Generated AI SEO tags & auto-categorized ${selectedItems.length} selected icons!`);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error generating AI tags.');
    } finally {
      setGeneratingAiTags(false);
    }
  }

  async function handleGenerateSingleAiTag() {
    if (!name.trim()) {
      setErrorMsg('Please enter an icon name first before generating AI tags.');
      return;
    }
    setGeneratingSingleAi(true);
    setErrorMsg(null);
    try {
      const cat = categories.find((c) => c.id === Number(categoryId));
      const res = await generateAdminAiTags({
        icons: [{ id: 'single', name: name.trim(), category: cat ? cat.name : 'General' }],
        limit: aiTagLimit,
      });
      if (res.success && res.data?.tags?.['single']) {
        setTags(res.data.tags['single']);
        const newCats = res.data.created_categories || [];
        if (newCats.length > 0) {
          setCategories((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const toAdd: AdminCategoryItem[] = newCats
              .filter((c) => !existingIds.has(c.id))
              .map((c) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
                icon_count: 0,
                total_icons: 0,
                published_icons: 0,
                draft_icons: 0,
                display_order: 99,
                status: 'active' as const,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }));
            return [...prev, ...toAdd];
          });
        }
        if (res.data.category_ids?.['single']) {
          setCategoryId(res.data.category_ids['single']);
        } else if (res.data.categories?.['single']) {
          const matched = categories.find(
            (c) => c.name.toLowerCase() === res.data.categories!['single'].toLowerCase()
          );
          if (matched) {
            setCategoryId(matched.id);
          }
        }
        setSuccessMsg('✨ AI SEO tags & category suggested successfully!');
      } else {
        setErrorMsg(res.message || 'Failed to suggest tags.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error generating AI tags.');
    } finally {
      setGeneratingSingleAi(false);
    }
  }

  // =============================================================
  // Gemini AI Visual Inspection & Mismatch Auditor
  // =============================================================
  async function handleInspectAiVisualsForQueue() {
    if (queue.length === 0) return;
    setInspectingAiVisuals(true);
    setErrorMsg(null);
    try {
      const payload = queue.map((q) => {
        const cat = categories.find((c) => c.id === q.category_id);
        return {
          id: q.id,
          name: q.name,
          category: cat ? cat.name : 'General',
          svg: q.svg_outlined || q.svg_filled || '',
        };
      });
      const res = await inspectAdminAiIcons({ icons: payload, limit: aiTagLimit });
      if (res.success && res.data?.inspections) {
        setInspections(res.data.inspections);
        const mismatches = res.data.mismatch_count;
        if (mismatches > 0) {
          setSuccessMsg(`👁️ Visual Audit complete: Found ${mismatches} icons with name mismatches! Click "Auto-Fix" to apply accurate names.`);
        } else {
          setSuccessMsg(`✅ Visual Audit complete: All ${res.data.total_inspected} icons visually match their names!`);
        }
      } else {
        setErrorMsg(res.message || 'Failed to inspect icons.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error inspecting icon visuals.');
    } finally {
      setInspectingAiVisuals(false);
    }
  }

  function handleApplySuggestedName(id: string) {
    const inspection = inspections[id];
    if (!inspection) return;

    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        let targetCatId = item.category_id;
        if (inspection.suggested_category) {
          const matchedCat = categories.find(
            (c) => c.name.toLowerCase() === inspection.suggested_category.toLowerCase()
          );
          if (matchedCat) targetCatId = matchedCat.id;
        }

        return {
          ...item,
          name: inspection.suggested_name || item.name,
          category_id: targetCatId,
          tags: inspection.tags || item.tags,
        };
      })
    );

    // Mark as fixed
    setInspections((prev) => {
      const next = { ...prev };
      if (next[id]) {
        next[id] = { ...next[id], is_mismatch: false };
      }
      return next;
    });

    setSuccessMsg(`✨ Auto-fixed "${inspection.suggested_name}"!`);
  }

  function handleApplyAllSuggestedNames() {
    const mismatchIds = Object.keys(inspections).filter((id) => inspections[id]?.is_mismatch);
    if (mismatchIds.length === 0) return;

    setQueue((prev) =>
      prev.map((item) => {
        const insp = inspections[item.id];
        if (!insp || !insp.is_mismatch) return item;

        let targetCatId = item.category_id;
        if (insp.suggested_category) {
          const matchedCat = categories.find(
            (c) => c.name.toLowerCase() === insp.suggested_category.toLowerCase()
          );
          if (matchedCat) targetCatId = matchedCat.id;
        }

        return {
          ...item,
          name: insp.suggested_name || item.name,
          category_id: targetCatId,
          tags: insp.tags || item.tags,
        };
      })
    );

    // Clear mismatches in inspections
    setInspections((prev) => {
      const next = { ...prev };
      for (const id of mismatchIds) {
        if (next[id]) {
          next[id] = { ...next[id], is_mismatch: false };
        }
      }
      return next;
    });

    setSuccessMsg(`🎉 Successfully auto-fixed all ${mismatchIds.length} icon names based on actual SVG visuals!`);
  }

  function handleDismissInspection(id: string) {
    setInspections((prev) => {
      const next = { ...prev };
      if (next[id]) {
        next[id] = { ...next[id], is_mismatch: false };
      }
      return next;
    });
  }

  async function handleSingleInspectVisual() {
    const activeSvg = svgOutlined || svgFilled;
    if (!activeSvg.trim()) {
      setErrorMsg('Please upload or paste an SVG first before running visual inspection.');
      return;
    }
    setInspectingSingleVisual(true);
    setErrorMsg(null);
    try {
      const cat = categories.find((c) => c.id === Number(categoryId));
      const res = await inspectAdminAiIcons({
        icons: [{ id: 'single', name: name.trim() || 'Untitled', category: cat ? cat.name : 'General', svg: activeSvg }],
        limit: aiTagLimit,
      });
      if (res.success && res.data?.inspections?.['single']) {
        const insp = res.data.inspections['single'];
        setName(insp.suggested_name);
        if (insp.tags) setTags(insp.tags);
        if (insp.suggested_category) {
          const matchedCat = categories.find((c) => c.name.toLowerCase() === insp.suggested_category.toLowerCase());
          if (matchedCat) setCategoryId(matchedCat.id);
        }
        setSuccessMsg(`✨ Identified as "${insp.detected_visual}" -> Auto-filled name and tags!`);
      } else {
        setErrorMsg(res.message || 'Visual inspection failed.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error during visual inspection.');
    } finally {
      setInspectingSingleVisual(false);
    }
  }


  function deleteSelected() {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    setQueue((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
    setMergeSuggestion(null);
    setSuccessMsg(`Removed ${count} selected icons from queue.`);
  }

  // Realtime Merge Detection upon Name Edit
  function handleNameChange(id: string, newName: string) {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
    );

    const currentItem = queue.find((q) => q.id === id);
    if (!currentItem || !newName.trim()) {
      setMergeSuggestion(null);
      return;
    }

    const trimmed = newName.trim().toLowerCase();
    const otherMatch = queue.find(
      (q) =>
        q.id !== id &&
        q.name.trim().toLowerCase() === trimmed &&
        ((currentItem.svg_outlined && !currentItem.svg_filled && q.svg_filled && !q.svg_outlined) ||
          (currentItem.svg_filled && !currentItem.svg_outlined && q.svg_outlined && !q.svg_filled))
    );

    if (otherMatch) {
      setMergeSuggestion({
        sourceId: id,
        targetId: otherMatch.id,
        name: newName.trim(),
        sourceVariant: currentItem.svg_outlined ? 'outlined' : 'filled',
        targetVariant: otherMatch.svg_outlined ? 'outlined' : 'filled',
      });
    } else if (mergeSuggestion && (mergeSuggestion.sourceId === id || mergeSuggestion.targetId === id)) {
      setMergeSuggestion(null);
    }
  }

  // Merge Two Icons into 1 Combo
  function executeMerge(sourceId: string, targetId: string) {
    const source = queue.find((q) => q.id === sourceId);
    const target = queue.find((q) => q.id === targetId);
    if (!source || !target) return;

    const mergedOutlined = source.svg_outlined || target.svg_outlined;
    const mergedFilled = source.svg_filled || target.svg_filled;
    const mergedFiles = Array.from(new Set([...source.originalFiles, ...target.originalFiles]));

    setQueue((prev) =>
      prev
        .filter((q) => q.id !== targetId)
        .map((q) => {
          if (q.id === sourceId) {
            return {
              ...q,
              name: source.name || target.name,
              svg_outlined: mergedOutlined,
              svg_filled: mergedFilled,
              detectedVariants: 'both' as const,
              originalFiles: mergedFiles,
            };
          }
          return q;
        })
    );

    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(targetId);
      return next;
    });

    setMergeSuggestion(null);
    setLinkModalItem(null);
    setSuccessMsg(`🎉 Successfully merged into "${source.name}" combo icon (Outlined & Filled)!`);
  }

  // Unlink a Combo Icon back into 2 Separate Icons
  function unlinkIcon(id: string) {
    const item = queue.find((q) => q.id === id);
    if (!item || item.detectedVariants !== 'both') return;

    const filledFile =
      item.originalFiles.find((f) => /[-_](filled|fill|solid)/i.test(f)) ||
      item.originalFiles[1] ||
      `${item.name}-filled.svg`;
    const outlinedFile =
      item.originalFiles.find((f) => /[-_](outlined|outline|line|stroke)/i.test(f)) ||
      item.originalFiles[0] ||
      `${item.name}-outlined.svg`;

    const newItem: QueuedIcon = {
      id: `qi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${item.name} (Filled)`,
      category_id: item.category_id,
      tags: item.tags,
      status: item.status,
      is_premium: item.is_premium,
      svg_filled: item.svg_filled,
      detectedVariants: 'filled',
      originalFiles: [filledFile],
    };

    setQueue((prev) =>
      prev
        .map((q) => {
          if (q.id === id) {
            return {
              ...q,
              svg_filled: undefined,
              detectedVariants: 'outlined' as const,
              originalFiles: [outlinedFile],
            };
          }
          return q;
        })
        .concat(newItem)
    );

    setSuccessMsg(`Unlinked: "${item.name}" split into separate Outlined and Filled icons.`);
  }

  // =============================================================
  // Chunked Bulk Upload Execution
  // =============================================================
  async function handleBulkUpload() {
    if (queue.length === 0) {
      setErrorMsg('No icons in queue to upload.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    // Chunk size: 30 icons per HTTP request for 100% stability
    const CHUNK_SIZE = 30;
    const totalBatches = Math.ceil(queue.length / CHUNK_SIZE);

    setUploadProgress({
      uploading: true,
      currentBatch: 0,
      totalBatches,
      uploadedCount: 0,
      totalCount: queue.length,
    });

    let successfullyUploaded = 0;
    const allErrors: string[] = [];

    for (let b = 0; b < totalBatches; b++) {
      const chunk = queue.slice(b * CHUNK_SIZE, (b + 1) * CHUNK_SIZE);
      setUploadProgress((prev) => ({
        ...prev,
        currentBatch: b + 1,
      }));

      const payload: BatchIconUploadItem[] = chunk.map((item) => ({
        name: item.name,
        category_id: item.category_id,
        tags: item.tags,
        status: item.status,
        is_premium: item.is_premium ? 1 : 0,
        svg_outlined: item.svg_outlined,
        svg_filled: item.svg_filled,
      }));

      try {
        const res = await batchUploadAdminIcons({
          category_id: typeof globalCategory === 'number' ? globalCategory : undefined,
          status: globalStatus,
          is_premium: globalIsPremium ? 1 : 0,
          icons: payload,
        });

        if (res.success && res.data) {
          successfullyUploaded += res.data.uploaded_count;
          if (res.data.errors && res.data.errors.length > 0) {
            res.data.errors.forEach((err) => {
              allErrors.push(`${err.name}: ${err.error}`);
            });
          }
        } else {
          allErrors.push(`Batch ${b + 1} failed: ${res.message || 'Unknown server error'}`);
        }
      } catch (err: any) {
        allErrors.push(`Batch ${b + 1} network error: ${err.message || 'Failed to connect'}`);
      }

      setUploadProgress((prev) => ({
        ...prev,
        uploadedCount: successfullyUploaded,
      }));
    }

    setUploadProgress({
      uploading: false,
      currentBatch: totalBatches,
      totalBatches,
      uploadedCount: successfullyUploaded,
      totalCount: queue.length,
    });

    if (allErrors.length === 0) {
      setSuccessMsg(`🎉 All ${successfullyUploaded} icons uploaded and published successfully!`);
      setQueue([]);
    } else if (successfullyUploaded > 0) {
      setSuccessMsg(`Uploaded ${successfullyUploaded} icons with ${allErrors.length} notices.`);
      setErrorMsg(allErrors.slice(0, 3).join(' | '));
    } else {
      setErrorMsg(`Upload failed: ${allErrors.join(' | ')}`);
    }
  }

  // Filtered queue items with search + variant tabs
  const filteredQueue = queue.filter((item) => {
    const matchesQuery =
      item.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      item.tags.toLowerCase().includes(filterQuery.toLowerCase());
    if (!matchesQuery) return false;

    if (variantFilter === 'paired') return item.detectedVariants === 'both';
    if (variantFilter === 'unpaired') return item.detectedVariants !== 'both';
    return true;
  });

  const pairedCount = queue.filter((q) => q.detectedVariants === 'both').length;
  const unpairedCount = queue.filter((q) => q.detectedVariants !== 'both').length;
  const activeMismatchCount = queue.filter((q) => inspections[q.id]?.is_mismatch).length;

  return (
    <div className=" mx-auto space-y-6">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/icons" className="hover:text-white transition-colors">
              Icons
            </Link>
            <span>/</span>
            <span className="text-slate-200">Upload Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {mode === 'bulk' ? 'Bulk SVG Icon Studio' : 'Upload Single Icon'}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {mode === 'bulk'
              ? 'Drag and drop multiple SVG files or folders to batch process and publish icons instantly.'
              : 'Add individual vector icons with live SVG code editing, dual variants, and preview.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${mode === 'bulk'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Bulk Upload</span>
            <span className="px-1.5 py-0.2 text-[10px] uppercase font-bold tracking-wider rounded bg-white/20 text-white">
              Batch
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${mode === 'single'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <span>Single Icon</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <div className="flex-1">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <Link
            to="/icons"
            className="text-xs font-semibold text-emerald-300 underline hover:text-white flex items-center gap-1"
          >
            View in Icons List <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* ========================================================= */}
      {/* BULK UPLOAD STUDIO MODE                                   */}
      {/* ========================================================= */}
      {mode === 'bulk' && (
        <div className="space-y-6">
          {/* 1. Drag & Drop Multi-File Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center group flex flex-col items-center justify-center ${isDragging
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.005]'
              : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 hover:border-slate-700'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".svg"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg shadow-indigo-600/10">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">
              Drag & Drop Multiple SVG Files Here
            </h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Select dozens or hundreds of <code className="text-indigo-400 font-mono text-xs">.svg</code> icons at once.
              Smart parser automatically pairs <code className="text-slate-300 text-xs">name.svg</code> with <code className="text-slate-300 text-xs">name-filled.svg</code>!
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
              >
                Browse Files
              </button>
              <span className="text-xs text-slate-500">Supports multi-file selection</span>
            </div>
          </div>

          {/* 2. Global Batch Controls */}
          {queue.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Global Batch Settings
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure default properties for all queued icons in one click.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={applyGlobalSettingsToAll}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    Apply to All
                  </button>
                  <button
                    type="button"
                    onClick={clearQueue}
                    className="px-3.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Global Category */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Batch Category
                  </label>
                  <select
                    value={globalCategory}
                    onChange={(e) => setGlobalCategory(Number(e.target.value))}
                    style={{ colorScheme: 'dark' }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} style={{ backgroundColor: '#0f172a', color: '#f8fafc' }} className="bg-slate-900 text-white">
                        {c.name} ({c.total_icons} icons)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Global Status */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Publication Status
                  </label>
                  <select
                    value={globalStatus}
                    onChange={(e) => setGlobalStatus(e.target.value as 'published' | 'draft')}
                    style={{ colorScheme: 'dark' }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="published" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }} className="bg-slate-900 text-white">🟢 Published (Live)</option>
                    <option value="draft" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }} className="bg-slate-900 text-white">🟡 Draft (Hidden)</option>
                  </select>
                </div>

                {/* Global Tier */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Pricing Tier
                  </label>
                  <select
                    value={globalIsPremium ? 'pro' : 'free'}
                    onChange={(e) => setGlobalIsPremium(e.target.value === 'pro')}
                    style={{ colorScheme: 'dark' }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="free" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }} className="bg-slate-900 text-white">Free Icons (Open Access)</option>
                    <option value="pro" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }} className="bg-slate-900 text-white">👑 Pro Icons (Premium Tier)</option>
                  </select>
                </div>

                {/* Search Queue */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Search in Queue ({filteredQueue.length}/{queue.length})
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter icons..."
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Batch Default Tags Input + Gemini AI Button */}
                <div className="sm:col-span-2 lg:col-span-4 mt-1 pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Manual Default Tags (Applied across all queued icons)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. interface, modern, ui, navigation, web"
                        value={globalTags}
                        onChange={(e) => setGlobalTags(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={applyGlobalSettingsToAll}
                      className="self-end sm:mt-5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>Apply Tags to All</span>
                    </button>
                  </div>

                  {/* Gemini AI Suite Action Bar */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/30 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-200">
                            Gemini 2.5 Flash AI Studio Suite
                          </span>
                          <span className="px-1.5 py-0.2 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] rounded font-mono font-bold">
                            Live AI
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Audit SVG vector drawings vs filenames, detect wrong names/icons, and generate Google-rankable SEO tags.
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
                        <span className="text-[11px] text-slate-400 font-medium">Keywords/icon:</span>
                        <select
                          value={aiTagLimit}
                          onChange={(e) => setAiTagLimit(Number(e.target.value))}
                          style={{ colorScheme: 'dark', backgroundColor: '#020617', color: '#f8fafc' }}
                          className="bg-transparent text-purple-400 font-bold text-xs focus:outline-none cursor-pointer"
                        >
                          <option value="4" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>4 Tags</option>
                          <option value="6" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>6 Tags (Recommended)</option>
                          <option value="8" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>8 Tags</option>
                          <option value="10" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>10 Tags</option>
                          <option value="12" style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>12 Tags</option>
                        </select>
                      </div>

                      {/* Visual Mismatch Auditor Button */}
                      <button
                        type="button"
                        disabled={inspectingAiVisuals || queue.length === 0}
                        onClick={handleInspectAiVisualsForQueue}
                        className="px-3.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 disabled:opacity-50 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0"
                        title="Inspects what is actually drawn inside each SVG vs its filename to catch mistakes"
                      >
                        {inspectingAiVisuals ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                            <span>Auditing Visuals...</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                            <span>👁️ Visual & Name Audit ({queue.length})</span>
                          </>
                        )}
                      </button>

                      {/* AI Tags Generator Button */}
                      <button
                        type="button"
                        disabled={generatingAiTags || queue.length === 0}
                        onClick={handleGenerateAiTagsForQueue}
                        className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5 shrink-0"
                      >
                        {generatingAiTags ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Generating Tags...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-3.5 h-3.5" />
                            <span>✨ Generate AI Tags ({queue.length})</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Progress Bar (During Upload) */}
          {uploadProgress.uploading && (
            <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 space-y-3 animate-pulse">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-300 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  Uploading Batch {uploadProgress.currentBatch} of {uploadProgress.totalBatches}...
                </span>
                <span className="font-bold text-white">
                  {Math.round((uploadProgress.uploadedCount / uploadProgress.totalCount) * 100)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.round((uploadProgress.uploadedCount / uploadProgress.totalCount) * 100)}%`,
                  }}
                />
              </div>
              <div className="text-[11px] text-slate-400 text-right">
                {uploadProgress.uploadedCount} of {uploadProgress.totalCount} icons committed to database.
              </div>
            </div>
          )}

          {/* 4. Queue Preview Grid */}
          {queue.length > 0 && (
            <div className="space-y-4">
              {/* Active Visual Mismatch Banner */}
              {activeMismatchCount > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/50 via-rose-950/30 to-slate-900 border border-amber-500/50 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                        <span>⚠️ Gemini AI Detected {activeMismatchCount} Icon Name/Visual Mismatch{activeMismatchCount > 1 ? 'es' : ''}!</span>
                        <span className="px-1.5 py-0.2 bg-amber-500/20 border border-amber-500/30 text-amber-200 text-[10px] rounded font-mono font-bold">
                          Action Required
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5 max-w-xl leading-relaxed">
                        The filename or title doesn't match what is actually drawn in the SVG path. You can click <b>"Auto-Fix All"</b> to instantly rename all icons to their real visual symbols and categories!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleApplyAllSuggestedNames}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>✨ Auto-Fix All {activeMismatchCount} Names</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Queue Controls Bar: Select All, Variant Filter Tabs, Search */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Select All Checkbox */}
                  <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 cursor-pointer hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedIds.size > 0 && selectedIds.size === filteredQueue.length}
                      onChange={() => toggleSelectAll(filteredQueue)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>
                      {selectedIds.size > 0 && selectedIds.size === filteredQueue.length
                        ? 'Deselect All'
                        : `Select All (${filteredQueue.length})`}
                    </span>
                  </label>

                  {selectedIds.size > 0 && (
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">
                      {selectedIds.size} Selected
                    </span>
                  )}

                  <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

                  {/* Filter Tabs */}
                  <div className="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setVariantFilter('all')}
                      className={`px-3 py-1 rounded-lg transition-colors ${variantFilter === 'all'
                        ? 'bg-slate-800 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      All ({queue.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setVariantFilter('paired')}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${variantFilter === 'paired'
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                        : 'text-slate-400 hover:text-emerald-400'
                        }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Paired Both ({pairedCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVariantFilter('unpaired')}
                      className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${variantFilter === 'unpaired'
                        ? 'bg-amber-500/20 text-amber-300 font-bold'
                        : 'text-slate-400 hover:text-amber-400'
                        }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>Single Unpaired ({unpairedCount})</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search queue..."
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={uploadProgress.uploading}
                    onClick={handleBulkUpload}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all flex-shrink-0"
                  >
                    <UploadCloud className="w-4 h-4" />
                    {uploadProgress.uploading
                      ? 'Uploading...'
                      : `Upload All (${queue.length})`}
                  </button>
                </div>
              </div>

              {/* Batch Selection Action Bar (Placed at Top) */}
              {selectedIds.size > 0 && (
                <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/50 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow">
                      <CheckSquare className="w-4 h-4" />
                      <span>{selectedIds.size} Icons Selected</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedIds(new Set())}
                      className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Batch Category */}
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-slate-300 font-medium">Category:</span>
                      <select
                        value={selectedBatchCategory}
                        onChange={(e) => setSelectedBatchCategory(Number(e.target.value))}
                        style={{ colorScheme: 'dark', backgroundColor: '#0f172a', color: '#f8fafc' }}
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="" style={{ backgroundColor: '#0f172a', color: '#94a3b8' }} className="bg-slate-900 text-slate-400">
                          Select Category...
                        </option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id} style={{ backgroundColor: '#0f172a', color: '#f8fafc' }} className="bg-slate-900 text-white">
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!selectedBatchCategory}
                        onClick={() =>
                          selectedBatchCategory &&
                          applyCategoryToSelected(Number(selectedBatchCategory))
                        }
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
                      >
                        Apply
                      </button>
                    </div>

                    {/* Batch Pricing */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => applyPricingToSelected(true)}
                        className="px-2.5 py-1 rounded-lg hover:bg-amber-500/20 text-amber-400 font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>Make Pro</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPricingToSelected(false)}
                        className="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-300 font-semibold transition-colors"
                      >
                        Make Free
                      </button>
                    </div>

                    {/* Batch Status */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => applyStatusToSelected('published')}
                        className="px-2.5 py-1 rounded-lg hover:bg-emerald-500/20 text-emerald-400 font-semibold transition-colors"
                      >
                        Publish
                      </button>
                      <button
                        type="button"
                        onClick={() => applyStatusToSelected('draft')}
                        className="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-300 font-semibold transition-colors"
                      >
                        Draft
                      </button>
                    </div>

                    {/* Batch Add Tags */}
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                      <Tag className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Add tags to selected..."
                        value={selectedBatchTags}
                        onChange={(e) => setSelectedBatchTags(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            applyTagsToSelected(selectedBatchTags);
                          }
                        }}
                        className="bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-36 sm:w-44"
                      />
                      <button
                        type="button"
                        disabled={!selectedBatchTags.trim()}
                        onClick={() => applyTagsToSelected(selectedBatchTags)}
                        className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[11px] font-bold transition-all shrink-0"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        disabled={generatingAiTags}
                        onClick={handleGenerateAiTagsForSelected}
                        className="ml-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 shadow-sm"
                        title="Generate AI Tags for selected icons"
                      >
                        <Wand2 className="w-3 h-3" />
                        <span>AI Tags</span>
                      </button>
                    </div>

                    {/* Batch Delete */}
                    <button
                      type="button"
                      onClick={deleteSelected}
                      className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete ({selectedIds.size})</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Grid of Queued Icons */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredQueue.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const isPaired = item.detectedVariants === 'both';
                  const isSuggested = mergeSuggestion && mergeSuggestion.sourceId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between relative group ${isSelected
                        ? 'bg-indigo-950/20 border-indigo-500/80 ring-2 ring-indigo-500/40 shadow-lg'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(item.id)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>

                        {/* SVG Thumbnail */}
                        <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-2.5 flex-shrink-0 text-white shadow-inner group-hover:border-slate-700 transition-colors">
                          <div
                            className="w-full h-full svg-preview-white flex items-center justify-center text-white"
                            dangerouslySetInnerHTML={{
                              __html: normalizeSvgToCurrentColor(item.svg_outlined || item.svg_filled || ''),
                            }}
                          />
                        </div>

                        {/* Details Fields */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleNameChange(item.id, e.target.value)}
                            className="w-full px-2 py-1 bg-slate-950/60 border border-slate-800 focus:border-indigo-500 rounded text-xs font-semibold text-white focus:outline-none"
                            placeholder="Icon name"
                          />

                          <div className="flex items-center gap-2">
                            <select
                              value={item.category_id}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setQueue((prev) =>
                                  prev.map((q) => (q.id === item.id ? { ...q, category_id: val } : q))
                                );
                              }}
                              style={{ colorScheme: 'dark', backgroundColor: '#020617', color: '#cbd5e1' }}
                              className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-300 focus:outline-none"
                            >
                              {categories.map((c) => (
                                <option key={c.id} value={c.id} style={{ backgroundColor: '#0f172a', color: '#f8fafc' }} className="bg-slate-900 text-white">
                                  {c.name}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => {
                                setQueue((prev) =>
                                  prev.map((q) =>
                                    q.id === item.id ? { ...q, is_premium: !q.is_premium } : q
                                  )
                                );
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 transition-colors ${item.is_premium
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-slate-950 text-slate-500 border-slate-800'
                                }`}
                            >
                              <Crown className="w-2.5 h-2.5" />
                              {item.is_premium ? 'Pro' : 'Free'}
                            </button>
                          </div>

                          {/* Inline Tags Input */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                            <input
                              type="text"
                              value={item.tags || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setQueue((prev) =>
                                  prev.map((q) => (q.id === item.id ? { ...q, tags: val } : q))
                                );
                              }}
                              placeholder="Tags (comma-separated)..."
                              className="w-full px-2 py-0.5 bg-slate-950/70 border border-slate-800/80 focus:border-indigo-500 rounded text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none"
                            />
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-0.5">
                            <span
                              className={`px-1.5 py-0.5 rounded font-medium ${isPaired
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : item.detectedVariants === 'filled'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                                }`}
                            >
                              {isPaired
                                ? 'Outlined & Filled'
                                : item.detectedVariants === 'filled'
                                  ? 'Filled Only'
                                  : 'Outlined Only'}
                            </span>

                            <span
                              className="text-slate-500 truncate max-w-[110px]"
                              title={item.originalFiles.join(' + ')}
                            >
                              {item.originalFiles.length > 1
                                ? `${item.originalFiles.length} files linked`
                                : item.originalFiles[0]}
                            </span>
                          </div>
                        </div>

                        {/* Top-Right Card Actions */}
                        <div className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            onClick={() => removeFromQueue(item.id)}
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Remove from queue"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Link Variant Button (for single-variant icons) */}
                          {!isPaired && (
                            <button
                              type="button"
                              onClick={() => setLinkModalItem(item)}
                              className="p-1 rounded text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/15 border border-indigo-500/30 transition-colors"
                              title="Link complementary variant"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Unlink Button (for combo icons) */}
                          {isPaired && (
                            <button
                              type="button"
                              onClick={() => unlinkIcon(item.id)}
                              className="p-1 rounded text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                              title="Unlink into separate Outlined and Filled icons"
                            >
                              <Unlink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Realtime Smart Merge Prompt Banner */}
                      {isSuggested && (
                        <div className="mt-2.5 p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-between gap-2 text-xs animate-in fade-in">
                          <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse flex-shrink-0" />
                            <span>Matching {mergeSuggestion.targetVariant} variant exists!</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                executeMerge(mergeSuggestion.sourceId, mergeSuggestion.targetId)
                              }
                              className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shadow-sm transition-all"
                            >
                              Merge Combo
                            </button>
                            <button
                              type="button"
                              onClick={() => setMergeSuggestion(null)}
                              className="p-0.5 text-slate-400 hover:text-slate-200"
                              title="Dismiss"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* AI Visual Inspection Feedback */}
                      {inspections[item.id] && (
                        <div className="mt-2.5 text-xs animate-in fade-in">
                          {inspections[item.id].is_mismatch ? (
                            <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-950/60 to-rose-950/40 border border-amber-500/40 space-y-1.5 shadow-sm">
                              <div className="flex items-start justify-between gap-2">
                                <div className="text-[11px] text-amber-300 font-bold flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span>Visual Mismatch Detected</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDismissInspection(item.id)}
                                  className="text-slate-400 hover:text-white p-0.5"
                                  title="Dismiss notice"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="text-[11px] text-slate-200">
                                <span className="text-slate-400">Actual Drawing: </span>
                                <b className="text-amber-200 underline decoration-amber-500/50">{inspections[item.id].detected_visual}</b>
                              </div>

                              {inspections[item.id].reason && (
                                <div className="text-[10px] text-slate-400 leading-tight">
                                  {inspections[item.id].reason}
                                </div>
                              )}

                              <div className="pt-1 flex items-center justify-between gap-2 border-t border-amber-500/20">
                                <span className="text-[10px] text-slate-300 truncate">
                                  Suggested: <b className="text-white">{inspections[item.id].suggested_name}</b>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleApplySuggestedName(item.id)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] shadow transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                                >
                                  <Sparkles className="w-3 h-3 text-slate-950" />
                                  <span>Apply Real Name</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="truncate">Visual match: <b>{inspections[item.id].detected_visual || item.name}</b></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Info Bar */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
                <span className="text-xs text-slate-400">
                  Ready to batch upload <b className="text-white">{queue.length} icons</b> ({pairedCount} paired, {unpairedCount} single).
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={clearQueue}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Discard All
                  </button>
                  <button
                    type="button"
                    disabled={uploadProgress.uploading}
                    onClick={handleBulkUpload}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
                  >
                    <UploadCloud className="w-4 h-4" />
                    {uploadProgress.uploading ? 'Uploading...' : `Upload All ${queue.length} Icons`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Link Variant Modal */}
          {linkModalItem && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-indigo-400" />
                      Link Complementary Variant
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pairing with: <b className="text-white">"{linkModalItem.name}"</b> (
                      {linkModalItem.detectedVariants === 'outlined' ? 'Needs Filled' : 'Needs Outlined'})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLinkModalItem(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Candidate Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search matching icon..."
                    value={linkSearchQuery}
                    onChange={(e) => setLinkSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Candidate List */}
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/40">
                  {(() => {
                    const needsFilled = linkModalItem.detectedVariants === 'outlined';
                    const candidates = queue.filter((q) => {
                      if (q.id === linkModalItem.id) return false;
                      // Must have the opposite variant and NOT both
                      if (needsFilled && !q.svg_filled) return false;
                      if (!needsFilled && !q.svg_outlined) return false;
                      if (q.detectedVariants === 'both') return false;

                      if (!linkSearchQuery.trim()) return true;
                      return (
                        q.name.toLowerCase().includes(linkSearchQuery.toLowerCase()) ||
                        q.originalFiles.some((f) => f.toLowerCase().includes(linkSearchQuery.toLowerCase()))
                      );
                    });

                    if (candidates.length === 0) {
                      return (
                        <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                          <p className="font-semibold text-slate-400">No matching unpaired icons found</p>
                          <p>
                            All other icons either already have both variants or don't match the search.
                          </p>
                        </div>
                      );
                    }

                    return candidates.map((cand) => (
                      <div
                        key={cand.id}
                        className="pt-2 flex items-center justify-between gap-3 hover:bg-slate-800/40 p-2 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5 flex-shrink-0 text-white">
                            <div
                              className="w-full h-full svg-preview-white flex items-center justify-center text-white"
                              dangerouslySetInnerHTML={{
                                __html: normalizeSvgToCurrentColor(cand.svg_filled || cand.svg_outlined || ''),
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">
                              {cand.name}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {cand.originalFiles[0]}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => executeMerge(linkModalItem.id, cand.id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow flex items-center gap-1.5 flex-shrink-0 transition-all"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span>Link Combo</span>
                        </button>
                      </div>
                    ));
                  })()}
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setLinkModalItem(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SINGLE ICON UPLOAD MODE                                   */}
      {/* ========================================================= */}
      {mode === 'single' && (
        <form onSubmit={handleSingleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
              <h2 className="text-base font-bold text-white mb-2">Icon Details</h2>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Icon Name <span className="text-red-400">*</span>
                  </label>
                  {(svgOutlined || svgFilled) && (
                    <button
                      type="button"
                      disabled={inspectingSingleVisual}
                      onClick={handleSingleInspectVisual}
                      className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-500/30 transition-all disabled:opacity-40 cursor-pointer"
                      title="AI scans the uploaded SVG drawing and auto-fills name, category, and tags"
                    >
                      {inspectingSingleVisual ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                          <span>Auditing Visual...</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 text-amber-400" />
                          <span>👁️ AI Detect Name from SVG</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Draw Outline, Cloud Sync, Heart"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    style={{ colorScheme: 'dark', backgroundColor: '#020617', color: '#f1f5f9' }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} style={{ backgroundColor: '#0f172a', color: '#f8fafc' }} className="bg-slate-900 text-white">
                        {c.name} ({c.total_icons} icons)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Pricing Tier
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPremium(false)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${!isPremium
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                    >
                      Free Tier
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPremium(true)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${isPremium
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                    >
                      <Crown className="w-3 h-3 text-amber-400" />
                      Pro Tier
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Tags</label>
                  <button
                    type="button"
                    disabled={generatingSingleAi || !name.trim()}
                    onClick={handleGenerateSingleAiTag}
                    className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-0.5 rounded-lg border border-purple-500/20 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {generatingSingleAi ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Suggesting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>✨ AI Suggest Tags (Gemini)</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. pen, sketch, vector, creative, art, draw"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Publication Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('published')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${status === 'published'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Published (Live)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('draft')}
                    className={`py-2.5 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${status === 'draft'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Draft (Hidden)</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white">SVG Vector Code</h2>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${activeTab === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                  >
                    File Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('paste')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${activeTab === 'paste' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                  >
                    Paste Code
                  </button>
                </div>
              </div>

              {activeTab === 'upload' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/70 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-semibold text-slate-200">Outlined Variant (.svg)</span>
                    <label className="mt-3 cursor-pointer px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-xs font-semibold border border-indigo-500/30 transition-colors">
                      <span>Browse File</span>
                      <input
                        type="file"
                        accept=".svg"
                        onChange={(e) => handleSingleFileUpload(e, 'outlined')}
                        className="hidden"
                      />
                    </label>
                    {svgOutlined && (
                      <span className="text-[11px] text-emerald-400 font-medium mt-2">
                        Loaded ({svgOutlined.length} bytes)
                      </span>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-semibold text-slate-200">Filled Variant (.svg)</span>
                    <label className="mt-3 cursor-pointer px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 text-xs font-semibold border border-purple-500/30 transition-colors">
                      <span>Browse File</span>
                      <input
                        type="file"
                        accept=".svg"
                        onChange={(e) => handleSingleFileUpload(e, 'filled')}
                        className="hidden"
                      />
                    </label>
                    {svgFilled && (
                      <span className="text-[11px] text-emerald-400 font-medium mt-2">
                        Loaded ({svgFilled.length} bytes)
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Outlined SVG Code
                    </label>
                    <textarea
                      rows={4}
                      placeholder="<svg viewBox='0 0 24 24'>...</svg>"
                      value={svgOutlined}
                      onChange={(e) => setSvgOutlined(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Filled SVG Code (Optional)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="<svg viewBox='0 0 24 24'>...</svg>"
                      value={svgFilled}
                      onChange={(e) => setSvgFilled(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                to="/icons"
                className="px-5 py-2.5 rounded-xl border border-slate-800 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all"
              >
                {submitting ? 'Uploading...' : 'Upload & Publish'}
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 sm:p-6 sticky top-20 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white">Live Preview</h2>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPreviewBg('dark')}
                    className={`px-2 py-0.5 rounded ${previewBg === 'dark' ? 'bg-slate-800 text-white' : 'text-slate-400'
                      }`}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewBg('light')}
                    className={`px-2 py-0.5 rounded ${previewBg === 'light'
                      ? 'bg-slate-200 text-slate-900 font-bold'
                      : 'text-slate-400'
                      }`}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewBg('grid')}
                    className={`px-2 py-0.5 rounded ${previewBg === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                  >
                    Grid
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2">Outlined Variant</div>
                <div
                  className={`h-40 rounded-xl border flex items-center justify-center p-4 transition-colors ${previewBg === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : previewBg === 'light'
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-800 text-white bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px]'
                    }`}
                >
                  {svgOutlined ? (
                    <div
                      className={`w-16 h-16 [&>svg]:w-full [&>svg]:h-full ${previewBg !== 'light' ? 'svg-preview-white text-white' : ''}`}
                      dangerouslySetInnerHTML={{ __html: normalizeSvgToCurrentColor(svgOutlined) }}
                    />
                  ) : (
                    <div className="text-xs text-slate-500">No outlined SVG uploaded</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2">Filled Variant</div>
                <div
                  className={`h-40 rounded-xl border flex items-center justify-center p-4 transition-colors ${previewBg === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : previewBg === 'light'
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-800 text-white bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px]'
                    }`}
                >
                  {svgFilled ? (
                    <div
                      className={`w-16 h-16 [&>svg]:w-full [&>svg]:h-full ${previewBg !== 'light' ? 'svg-preview-white text-white' : ''}`}
                      dangerouslySetInnerHTML={{ __html: normalizeSvgToCurrentColor(svgFilled) }}
                    />
                  ) : (
                    <div className="text-xs text-slate-500">
                      {svgOutlined ? 'Auto-fallbacks to outlined' : 'No filled SVG uploaded'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

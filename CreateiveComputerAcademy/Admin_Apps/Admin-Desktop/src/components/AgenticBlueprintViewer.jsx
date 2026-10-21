import React, { useState } from 'react';
import { 
  FiCopy, FiCheck, FiLayers, FiType, FiFolder, FiExternalLink,
  FiGrid, FiLayout, FiImage, FiPackage, FiZap, FiDownload, FiCode,
  FiFileText, FiSmile, FiBox, FiLink
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { toast } from 'sonner';

export default function AgenticBlueprintViewer({ blueprint: initialBlueprint, variants = [] }) {
  const [copiedColor, setCopiedColor] = useState(null);
  const [activeTab, setActiveTab] = useState('json_spec'); // 'json_spec' | 'assets_links' | 'layer_tree'
  const [showRawJson, setShowRawJson] = useState(false);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(() => {
    if (Array.isArray(variants) && variants.length > 0) {
      const activeI = variants.findIndex(v => v.is_active);
      return activeI >= 0 ? activeI : 0;
    }
    return 0;
  });

  const activeVariant = Array.isArray(variants) && variants.length > 0
    ? variants[selectedVariantIdx]
    : null;

  const blueprint = activeVariant?.blueprint_data || (activeVariant?.blueprint_json ? (typeof activeVariant.blueprint_json === 'string' ? JSON.parse(activeVariant.blueprint_json) : activeVariant.blueprint_json) : initialBlueprint);

  if (!blueprint) return null;

  const handleCopyHex = (hex) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    toast.success(`Copied ${hex} to clipboard!`);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const colorPalette = blueprint.color_palette || [];
  const typography = blueprint.typography || [];
  const layerTree = blueprint.layer_tree || [];
  const layoutBreakdown = blueprint.layout_breakdown || [];
  const assetsLinks = blueprint.assets_links || [];

  return (
    <div className="space-y-6 select-text bg-white dark:bg-[#0b1120] text-slate-800 dark:text-slate-100 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-2xl">
      {/* ── Multi-Variant Selector (if multiple variants exist) ── */}
      {Array.isArray(variants) && variants.length > 1 && (
        <div className="p-2.5 bg-slate-50 dark:bg-[#0e172a] rounded-2xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-500 dark:text-slate-400 px-2">
            <FiLayers size={14} className="text-blue-500" />
            <span>Blueprint Variants:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {variants.map((v, idx) => {
              const isSelected = selectedVariantIdx === idx;
              return (
                <button
                  key={v.id || idx}
                  type="button"
                  onClick={() => setSelectedVariantIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white dark:bg-[#131d31] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  {v.is_active && <span>⭐</span>}
                  <span>{v.variant_name || `Variant ${idx + 1}`}</span>
                  {v.ai_model_used && (
                    <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {v.ai_model_used.includes('llama') ? 'Llama' : (v.ai_model_used.includes('deepseek') ? 'DeepSeek' : (v.ai_model_used.includes('qwen') ? 'Qwen' : 'AI'))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Blueprint Header Specs Bar ── */}
      <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-gradient-to-r dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-purple-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-between flex-wrap gap-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-600/30 shrink-0">
            <HiSparkles size={20} className="text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-wide truncate">
                {blueprint.task_title || blueprint.title || 'AI Design Blueprint Specifications'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30 font-mono">
                {activeVariant?.is_active ? '⭐ PRIMARY TARGET' : 'AGENTIC SPEC'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Production guidelines generated for pixel-perfect commercial stock standards.
            </p>
          </div>
        </div>

        {/* 1-Click Export JSON */}
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(blueprint, null, 2));
            toast.success('Blueprint JSON copied to clipboard!');
          }}
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <FiCopy size={13} /> Export JSON
        </button>
      </div>

      {/* ── Studio Navigation Tabs ── */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#111c33] p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('json_spec')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'json_spec'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FiCode size={14} /> JSON Spec
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
          <FiLink size={14} /> Assets & Links ({assetsLinks.length})
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
          <FiLayers size={14} /> PSD Layer Tree ({layerTree.length})
        </button>
      </div>

      {/* ── TAB 1: JSON SPEC (Specifications, Palette, Typography & Breakdown) ── */}
      {activeTab === 'json_spec' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Format & Dimensions Spec Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-[#111c33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Document Format</p>
              <p className="text-sm font-black text-slate-900 dark:text-white mt-1">{blueprint.doc_format || 'A4 Print Flyer'}</p>
            </div>

            <div className="bg-slate-50 dark:bg-[#111c33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Resolution & Mode</p>
              <p className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1">{blueprint.resolution_mode || '300 DPI • CMYK'}</p>
            </div>

            <div className="bg-slate-50 dark:bg-[#111c33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Dimensions</p>
              <p className="text-sm font-black text-slate-900 dark:text-white mt-1">{blueprint.dimensions || '210 x 297 mm'}</p>
            </div>

            <div className="bg-slate-50 dark:bg-[#111c33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Bleed Margin</p>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">{blueprint.bleed_margin || '3 mm All Margins'}</p>
            </div>
          </div>

          {/* Color Palette */}
          {colorPalette.length > 0 && (
            <div className="bg-slate-50 dark:bg-[#111c33] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                🎨 Color Palette (Click to Copy Hex)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {colorPalette.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => handleCopyHex(c.hex)}
                    className="bg-white dark:bg-[#0b1120] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 cursor-pointer transition-all group flex flex-col justify-between shadow-sm"
                  >
                    <div className="h-10 rounded-lg mb-2 shadow-inner border border-slate-200 dark:border-white/10" style={{ backgroundColor: c.hex }} />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">{c.name}</p>
                        <p className="text-xs font-mono font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{c.hex}</p>
                      </div>
                      <span className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {copiedColor === c.hex ? <FiCheck className="text-emerald-500 dark:text-emerald-400" /> : <FiCopy size={12} />}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Typography Specifications */}
          {typography.length > 0 && (
            <div className="bg-slate-50 dark:bg-[#111c33] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FiType className="text-blue-500 dark:text-blue-400" /> Typography Specifications
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {typography.map((t, i) => (
                  <div key={i} className="bg-white dark:bg-[#0b1120] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-sm font-black text-slate-900 dark:text-white">{t.font}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">Weights: {t.weights}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">Usage: {t.usage}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Structural Layout Breakdown */}
          {layoutBreakdown.length > 0 && (
            <div className="bg-slate-50 dark:bg-[#111c33] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FiFileText className="text-blue-500 dark:text-blue-400" /> Structural Layout Breakdown
              </h4>
              <div className="space-y-2">
                {layoutBreakdown.map((l, i) => (
                  <div key={i} className="bg-white dark:bg-[#0b1120] p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-start gap-3 text-xs shadow-sm">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono font-bold shrink-0">
                      {l.section}
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{l.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw JSON Specification Toggle */}
          <div className="bg-slate-50 dark:bg-[#111c33] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowRawJson(prev => !prev)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#0b1120] dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-sm"
              >
                <FiCode size={14} />
                <span>{showRawJson ? 'Hide Raw JSON Specification' : '</> Show Raw JSON Specification'}</span>
              </button>

              {showRawJson && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(blueprint, null, 2));
                    toast.success('Raw JSON copied to clipboard!');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 border border-blue-500/30 text-[11px] font-bold transition-all flex items-center gap-1.5"
                >
                  <FiCopy size={12} /> Copy JSON
                </button>
              )}
            </div>

            {showRawJson && (
              <div className="relative animate-in fade-in zoom-in-95 duration-200">
                <pre className="p-4 rounded-xl bg-white dark:bg-[#070b14] border border-slate-200 dark:border-slate-800/90 text-[11px] font-mono text-slate-800 dark:text-emerald-400 overflow-x-auto max-h-80 custom-scrollbar leading-relaxed shadow-inner">
                  <code>{JSON.stringify(blueprint, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: ASSETS & LINKS ── */}
      {activeTab === 'assets_links' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 1. Verified Free Google Fonts */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FiType className="text-blue-500 dark:text-blue-400" /> Verified Free Google Fonts
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(assetsLinks.filter(a => a.type === 'font') || typography || []).map((f, i) => {
                const fontName = f.name || f.font || 'Font';
                const fontUrl = f.url || `https://fonts.google.com/specimen/${encodeURIComponent(fontName.replace(/\s*\(.*\)/, ''))}`;
                return (
                  <a
                    key={i}
                    href={fontUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-50 dark:bg-[#111c33] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all flex items-center justify-between group shadow-sm"
                  >
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{fontName.replace(/\s*\(Google Fonts\)/i, '')}</p>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">{f.license || 'Free Commercial License'}</p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#0b1120] text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-center border border-slate-200 dark:border-slate-800 group-hover:border-blue-500/50 transition-all shadow-sm">
                      <FiExternalLink size={14} />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* 2. Icon Glyphs & Vector Links (Photoshop / Illustrator) */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FiSmile className="text-blue-500 dark:text-blue-400" /> Icon Glyphs & Vector Links (Photoshop / Illustrator)
            </h4>

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
              {(assetsLinks.filter(a => a.type === 'glyph' || a.type === 'icon') || [
                { name: 'Feature / Chart Icon', query: 'Flaticon SVG query: chart', glyph: '\\f080' },
                { name: 'Marketing / Bullhorn Icon', query: 'Flaticon SVG query: bullhorn', glyph: '\\f0a1' },
                { name: 'Users / Team Icon', query: 'Flaticon SVG query: users', glyph: '\\f0c0' },
                { name: 'Contact Phone & Globe Icons', query: 'Flaticon SVG query: phone', glyph: '\\f095' }
              ]).map((g, i) => {
                const glyphVal = g.glyph || (g.note?.match(/\\f[0-9a-f]+/i)?.[0]) || `\\f0${80 + i}`;
                const queryText = g.query || g.note || `Flaticon SVG query: ${g.name?.toLowerCase()}`;
                return (
                  <div key={i} className="bg-slate-50 dark:bg-[#111c33] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm">
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

          {/* 3. Unsplash / Freepik Commercial-Use Placeholders */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FiImage className="text-blue-500 dark:text-blue-400" /> Unsplash Commercial-Use Placeholders
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(assetsLinks.filter(a => a.type === 'stock' || a.type === 'image' || a.type === 'placeholder') || [
                { name: 'Topic Hero Photo Placeholder', url: 'https://unsplash.com/s/photos/traveler-beach' },
                { name: 'Secondary Subject Placeholder', url: 'https://unsplash.com/s/photos/ocean-vacation' },
                { name: 'Background Texture / Vectors', url: 'https://www.freepik.com/search?query=travel+background' }
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
                        Direct Stock Search ↗
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

      {/* ── TAB 3: PSD LAYER TREE (Dual Theme Light & Dark) ── */}
      {activeTab === 'layer_tree' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-slate-50 dark:bg-[#111c33] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FiLayers className="text-blue-500 dark:text-blue-400" /> Structured Photoshop Layer Tree
              </h4>
              <button
                type="button"
                onClick={() => {
                  let textTree = `📁 [Template] - ${blueprint.doc_format || 'Design Flyer'}\n`;
                  layerTree.forEach((group, gi) => {
                    const isLastGroup = gi === layerTree.length - 1;
                    textTree += `${isLastGroup ? '└──' : '├──'} 📁 ${group.folder}\n`;
                    group.layers?.forEach((layer, li) => {
                      const isLastLayer = li === group.layers.length - 1;
                      const icon = layer.icon || (layer.type === 'smart_object' ? '🖼️' : layer.type === 'shape' || layer.type === 'solid_color' ? '🎨' : layer.type === 'guide' ? '🔲' : '📁');
                      textTree += `${isLastGroup ? '    ' : '│   '}${isLastLayer ? '└──' : '├──'} ${icon} ${layer.name}\n`;
                    });
                  });
                  navigator.clipboard.writeText(textTree);
                  toast.success('Layer Tree copied to clipboard!');
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 border border-blue-500/30 text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <FiCopy size={12} /> Copy Layer Tree
              </button>
            </div>

            {/* Visual Tree Box (Adapts to Light / Dark Mode) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#070b14] border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 overflow-x-auto leading-relaxed custom-scrollbar shadow-inner">
              {/* Root Header */}
              <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400 mb-3">
                <span>📁</span>
                <span>[Template] - {blueprint.doc_format || 'Design Flyer Blueprint'}</span>
              </div>

              <div className="space-y-1">
                {layerTree.map((group, gi) => {
                  const isLastGroup = gi === layerTree.length - 1;
                  return (
                    <div key={gi} className="space-y-0.5">
                      {/* Group Line */}
                      <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-slate-900/60 py-0.5 px-1 rounded transition-colors">
                        <span className="text-slate-400 dark:text-blue-500 font-normal">{isLastGroup ? '└──' : '├──'}</span>
                        <span>📁</span>
                        <span>{group.folder}</span>
                      </div>

                      {/* Children Layers */}
                      {group.layers?.map((layer, li) => {
                        const isLastLayer = li === group.layers.length - 1;
                        const icon = layer.icon || (layer.type === 'smart_object' ? '🖼️' : layer.type === 'shape' || layer.type === 'solid_color' ? '🎨' : layer.type === 'guide' ? '🔲' : '📁');
                        return (
                          <div key={li} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/40 py-0.5 px-1 rounded transition-colors text-[11px]">
                            <span className="text-slate-400 dark:text-blue-500 font-normal">{isLastGroup ? '\u00A0\u00A0\u00A0\u00A0' : '│\u00A0\u00A0\u00A0'}</span>
                            <span className="text-slate-400 dark:text-blue-400 font-normal">{isLastLayer ? '└──' : '├──'}</span>
                            <span>{icon}</span>
                            <span className="text-slate-800 dark:text-slate-200 font-medium">{layer.name}</span>
                            {layer.color && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                <span className="w-2.5 h-2.5 rounded-full border border-slate-300 dark:border-white/20 inline-block" style={{ backgroundColor: layer.color }}></span>
                                ({layer.color})
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

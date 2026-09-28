// frontend/src/pages/IconPage.tsx
// High-ranking Google SEO landing page for individual icons.
// Features Schema.org JSON-LD, instant SVG/PNG downloads, JSX copying, and related icons for internal SEO linking.

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Download,
  Copy,
  Check,
  Zap,
  Lock,
  ChevronRight,
  Sparkles,
  Layers,
  Code2,
  ShieldCheck,
  Share2,
  Sliders,
  ArrowLeft,
} from 'lucide-react';
import SiteHeader from '@/components/header/SiteHeader';
import { getIcon, getIcons, trackExport } from '@/lib/api';
import { IconItem, IconCustomization, IconStyle } from '@/types/icon';
import { useAuth } from '@/context/AuthContext';
import { updatePageSeo } from '@/lib/seo';
import { applyCustomizationToSvg, downloadSvg, downloadPng, copyToClipboard, svgToJsx } from '@/lib/svg-utils';

export default function IconPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, setShowAuthModal, setAuthMode } = useAuth();

  const [icon, setIcon] = useState<(IconItem & { variants?: Record<string, string> }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [style, setStyle] = useState<IconStyle>('outlined');
  const [custom, setCustom] = useState<IconCustomization>({
    size: 64,
    strokeWidth: 2,
    color: '#ffffff',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  });

  const [copiedType, setCopiedType] = useState<'svg' | 'jsx' | null>(null);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [relatedIcons, setRelatedIcons] = useState<IconItem[]>([]);

  // Fetch icon data
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(false);

    getIcon(slug)
      .then((res) => {
        if (res.success && res.data) {
          setIcon(res.data);
          const iconData = res.data;

          // Determine initial style
          if (iconData.variants?.['outlined']) setStyle('outlined');
          else if (iconData.variants?.['filled']) setStyle('filled');

          // Inject High-Ranking SEO Metadata & Structured Data
          const formattedName = iconData.name
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

          const pageTitle = `${formattedName} Icon - Free SVG, PNG & React JSX Download | IconBaba`;
          const pageDesc = `Download free ${formattedName} vector icon in SVG and PNG formats. Includes 1-click React JSX component code, customizable stroke width, and commercial license for web & mobile apps.`;
          const currentUrl = window.location.href;

          updatePageSeo({
            title: pageTitle,
            description: pageDesc,
            keywords: [
              `${iconData.name} icon`,
              `${iconData.name} svg`,
              `free ${iconData.name} vector`,
              `download ${iconData.name} icon`,
              `${iconData.name} react icon`,
              `${iconData.category} icons`,
              'free svg icons',
              'react svg icons',
            ],
            canonical: currentUrl,
            structuredData: {
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'BreadcrumbList',
                  'itemListElement': [
                    {
                      '@type': 'ListItem',
                      'position': 1,
                      'name': 'Home',
                      'item': 'https://iconbaba.com',
                    },
                    {
                      '@type': 'ListItem',
                      'position': 2,
                      'name': iconData.category || 'Icons',
                      'item': `https://iconbaba.com/?category=${encodeURIComponent(iconData.category || '')}`,
                    },
                    {
                      '@type': 'ListItem',
                      'position': 3,
                      'name': formattedName,
                      'item': currentUrl,
                    },
                  ],
                },
                {
                  '@type': 'ImageObject',
                  'name': `${formattedName} Vector Icon`,
                  'description': pageDesc,
                  'contentUrl': currentUrl,
                  'fileFormat': 'image/svg+xml',
                  'license': 'https://iconbaba.com/licenses/free',
                  'acquireLicensePage': 'https://iconbaba.com/pricing',
                },
              ],
            },
          });

          // Fetch Related Icons
          getIcons({ category: iconData.category, limit: 12 }).then((r) => {
            if (r.success && r.data?.icons) {
              setRelatedIcons(r.data.icons.filter((i) => i.id !== iconData.id));
            }
          });
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Current active SVG string
  const activeRawSvg = useMemo(() => {
    if (!icon) return '';
    if (style === 'filled' && icon.variants?.filled) {
      return icon.variants.filled;
    }
    return icon.variants?.outlined || icon.svg || '';
  }, [icon, style]);

  const customizedSvg = useMemo(() => {
    return applyCustomizationToSvg(activeRawSvg, custom, style);
  }, [activeRawSvg, custom, style]);

  const displayName = useMemo(() => {
    if (!icon) return '';
    return icon.name
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }, [icon]);

  // Export handlers
  const handleCopySvg = async () => {
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    if (icon) {
      trackExport({ iconId: icon.id, action: 'copy', format: 'svg', size: custom.size });
    }
    const ok = await copyToClipboard(customizedSvg);
    if (ok) {
      setCopiedType('svg');
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const handleCopyJsx = async () => {
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    if (icon) {
      trackExport({ iconId: icon.id, action: 'copy', format: 'jsx', size: custom.size });
    }
    const compName = displayName.replace(/\s+/g, '');
    const jsx = svgToJsx(customizedSvg, `Icon${compName}`);
    const ok = await copyToClipboard(jsx);
    if (ok) {
      setCopiedType('jsx');
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const handleDownloadSvg = () => {
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    if (icon) {
      trackExport({ iconId: icon.id, action: 'download', format: 'svg', size: custom.size });
      downloadSvg(customizedSvg, `${icon.name}-${style}-${custom.size}px`);
    }
  };

  const handleDownloadPng = async () => {
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    if (icon) {
      setDownloadingPng(true);
      trackExport({ iconId: icon.id, action: 'download', format: 'png', size: custom.size });
      await downloadPng(customizedSvg, `${icon.name}-${style}-${custom.size}px`, custom.size);
      setDownloadingPng(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0e15] text-white">
        <SiteHeader />
        <div className="max-w-6xl mx-auto px-4 py-24 text-center">
          <div className="inline-block size-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-slate-400">Loading vector icon...</p>
        </div>
      </div>
    );
  }

  if (error || !icon) {
    return (
      <div className="min-h-screen bg-[#0d0e15] text-white">
        <SiteHeader />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-2xl">
            🔍
          </div>
          <h1 className="text-xl font-bold">Icon Not Found</h1>
          <p className="text-sm text-slate-400 mt-2">
            The requested icon might have been renamed or moved.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold"
          >
            <ArrowLeft className="size-3.5" />
            <span>Browse All Icons</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e15] text-white">
      <SiteHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb Navigation (Crucial for Google SEO Hierarchy) */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Link to="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="size-3 text-slate-600" />
          <Link
            to={`/?category=${encodeURIComponent(icon.category)}`}
            className="hover:text-white transition-colors"
          >
            {icon.category}
          </Link>
          <ChevronRight className="size-3 text-slate-600" />
          <span className="text-slate-200 font-medium truncate">{displayName}</span>
        </nav>

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {icon.category}
              </span>
              {icon.is_premium && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  👑 PRO
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              {displayName} Icon
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Free {displayName} SVG vector & PNG download with instant React JSX code.
            </p>
          </div>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: document.title, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <Share2 className="size-3.5" />
            <span>Share Icon</span>
          </button>
        </div>

        {/* Main Grid: Left Preview & Controls | Right Export Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Big Interactive Preview & Customizers */}
          <div className="lg:col-span-7 space-y-6">
            {/* Big Vector Canvas */}
            <div className="relative rounded-3xl bg-gradient-to-b from-[#151624] to-[#10111a] border border-white/10 p-8 flex items-center justify-center min-h-[320px] shadow-2xl overflow-hidden group">
              {/* Subtle background grid pattern */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Rendered SVG */}
              <div
                className="relative z-10 transition-transform duration-200 group-hover:scale-105"
                style={{ width: `${Math.max(64, custom.size)}px`, height: `${Math.max(64, custom.size)}px` }}
                dangerouslySetInnerHTML={{ __html: customizedSvg }}
              />
            </div>

            {/* Customization Sliders & Color */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Sliders className="size-4 text-purple-400" />
                <span>Customize Icon</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Size */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Size</span>
                    <span className="font-mono text-purple-400">{custom.size}px</span>
                  </div>
                  <input
                    type="range"
                    min="24"
                    max="160"
                    value={custom.size}
                    onChange={(e) => setCustom({ ...custom, size: Number(e.target.value) })}
                    className="w-full accent-purple-500 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Stroke Width (Outlined only) */}
                {style === 'outlined' && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Stroke</span>
                      <span className="font-mono text-purple-400">{custom.strokeWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3.5"
                      step="0.25"
                      value={custom.strokeWidth}
                      onChange={(e) => setCustom({ ...custom, strokeWidth: Number(e.target.value) })}
                      className="w-full accent-purple-500 bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}

                {/* Color */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Color</span>
                    <span className="font-mono text-purple-400 text-[11px]">{custom.color}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={custom.color}
                      onChange={(e) => setCustom({ ...custom, color: e.target.value })}
                      className="size-7 rounded-lg border-0 bg-transparent cursor-pointer"
                    />
                    <div className="flex gap-1.5">
                      {['#ffffff', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map((c) => (
                        <button
                          key={c}
                          onClick={() => setCustom({ ...custom, color: c })}
                          className={`size-5 rounded-full border ${custom.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                          aria-label={`Select color ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Style Switcher, Action Buttons & Metadata Specs */}
          <div className="lg:col-span-5 space-y-6">
            {/* Style Switcher (Outlined vs Filled) */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                Icon Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStyle('outlined')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    style === 'outlined'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  <Layers className="size-3.5" />
                  <span>Outlined</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStyle('filled')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    style === 'filled'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  <Sparkles className="size-3.5" />
                  <span>Filled</span>
                </button>
              </div>
            </div>

            {/* 4 Action Buttons */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                {/* Download SVG */}
                <button
                  onClick={handleDownloadSvg}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
                >
                  <Download className="size-4" />
                  <span>Download SVG</span>
                </button>

                {/* Download PNG */}
                <button
                  onClick={handleDownloadPng}
                  disabled={downloadingPng}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                >
                  <Download className="size-4" />
                  <span>{downloadingPng ? 'Generating...' : 'Download PNG'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Copy SVG */}
                <button
                  onClick={handleCopySvg}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                >
                  {copiedType === 'svg' ? (
                    <Check className="size-4 text-emerald-400" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  <span>{copiedType === 'svg' ? 'Copied SVG!' : 'Copy SVG'}</span>
                </button>

                {/* Copy React JSX */}
                <button
                  onClick={handleCopyJsx}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                >
                  {copiedType === 'jsx' ? (
                    <Check className="size-4 text-emerald-400" />
                  ) : (
                    <Code2 className="size-4 text-purple-400" />
                  )}
                  <span>{copiedType === 'jsx' ? 'Copied JSX!' : 'Copy React JSX'}</span>
                </button>
              </div>
            </div>

            {/* Specifications & License Table (High Trust & Google Quality Signal) */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs space-y-2.5">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Category</span>
                <span className="text-white font-medium">{icon.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Available Formats</span>
                <span className="text-white font-mono">SVG, PNG, JSX</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Vector Scalability</span>
                <span className="text-emerald-400 font-medium">Infinite / Lossless</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">License</span>
                <Link to="/licenses" className="text-purple-400 hover:underline">
                  Free Commercial & Personal
                </Link>
              </div>
            </div>

            {/* Tag Cloud */}
            {icon.tags && icon.tags.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Keywords & Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {icon.tags.map((t) => (
                    <Link
                      key={t}
                      to={`/?search=${encodeURIComponent(t)}`}
                      className="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-purple-600/20 hover:text-purple-300 border border-white/5 transition-colors"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Icons Section (Crucial for Search Engine Internal Linking Juice) */}
        {relatedIcons.length > 0 && (
          <section className="mt-16 pt-12 border-t border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Related {icon.category} Icons
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Explore matching icons in the same design family
                </p>
              </div>
              <Link
                to={`/?category=${encodeURIComponent(icon.category)}`}
                className="text-xs font-bold text-purple-400 hover:text-purple-300"
              >
                View all in {icon.category} →
              </Link>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {relatedIcons.map((rel) => {
                const relSlug = rel.slug || rel.name;
                return (
                  <Link
                    key={rel.id}
                    to={`/icon/${relSlug}`}
                    className="group p-4 rounded-2xl bg-[#13141f] hover:bg-[#181a28] border border-white/5 hover:border-purple-500/40 flex flex-col items-center justify-center gap-2.5 transition-all hover:scale-105 shadow-md"
                  >
                    <div
                      className="size-8 text-slate-300 group-hover:text-purple-400 transition-colors"
                      dangerouslySetInnerHTML={{ __html: rel.svg }}
                    />
                    <span className="text-[11px] font-medium text-slate-400 group-hover:text-white truncate max-w-full text-center">
                      {rel.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

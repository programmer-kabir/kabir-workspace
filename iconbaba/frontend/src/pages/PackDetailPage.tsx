// frontend/src/pages/PackDetailPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Download,
  Sparkles,
  Layers,
  ChevronRight,
  Copy,
  Check,
  Search,
  Share2,
  FolderPlus,
  ArrowLeft,
  FileArchive,
  Info
} from 'lucide-react';
import SiteHeader from '@/components/header/SiteHeader';
import SiteFooter from '@/components/footer/SiteFooter';
import IconDetailDrawer from '@/components/drawer/IconDetailDrawer';
import AddToCollectionModal from '@/components/collections/AddToCollectionModal';
import { getPack, getPackZipDownloadUrl } from '@/lib/api';
import { PackDetail, IconItem, IconStyleMeta } from '@/types/icon';

export default function PackDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const [pack, setPack] = useState<PackDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active style chosen by user (Flaticon Style Switcher)
  const [activeStyle, setActiveStyle] = useState<string>('outlined');

  // Search within this pack
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Selected icon for Drawer
  const [selectedIcon, setSelectedIcon] = useState<IconItem | null>(null);
  const [collectionModalIcon, setCollectionModalIcon] = useState<IconItem | null>(null);

  // Quick feedback states
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;
    async function loadPack() {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getPack(slug);
        if (!isCancelled) {
          if (res.success && res.data) {
            setPack(res.data);
            // Default active style to primary_style or first available style
            const defaultSt = res.data.primary_style || (res.data.available_styles?.[0]?.slug as string) || 'outlined';
            setActiveStyle(defaultSt);
          } else {
            setError(res.message || 'Pack not found.');
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err?.message || 'Failed to load pack.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadPack();
    return () => {
      isCancelled = true;
    };
  }, [slug]);

  // Filter icons by search within pack
  const displayedIcons = useMemo(() => {
    if (!pack || !pack.icons) return [];
    if (!searchFilter.trim()) return pack.icons;
    const q = searchFilter.toLowerCase().trim();
    return pack.icons.filter(
      (ico) => ico.name.toLowerCase().includes(q) || ico.slug.toLowerCase().includes(q) || (ico.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [pack, searchFilter]);

  const handleCopySvg = (e: React.MouseEvent, iconId: number, svgContent: string) => {
    e.stopPropagation();
    if (!svgContent) return;
    navigator.clipboard.writeText(svgContent);
    setCopiedId(iconId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickDownload = (e: React.MouseEvent, iconName: string, svgContent: string) => {
    e.stopPropagation();
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${iconName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = (styleParam: string = 'all') => {
    if (!pack) return;
    setIsDownloadingZip(true);
    setDownloadMenuOpen(false);

    const downloadUrl = getPackZipDownloadUrl(pack.id, styleParam);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `${pack.slug}-${styleParam}-icons.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloadingZip(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0d0e15] text-slate-800 dark:text-slate-100 transition-colors">
      <SiteHeader />

      <main className="flex-1">
        {loading ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
            <div className="size-12 rounded-full border-2 border-purple-600 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading icon pack...</p>
          </div>
        ) : error || !pack ? (
          <div className="max-w-md mx-auto px-4 py-20 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Pack Not Found</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{error || 'This icon pack could not be located.'}</p>
            <Link
              to="/packs"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all"
            >
              <ArrowLeft className="size-4" />
              <span>Browse All Packs</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Breadcrumbs */}
            <div className="border-b border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#10111d]/70 backdrop-blur-md px-4 sm:px-6 py-3">
              <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Link to="/" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  Home
                </Link>
                <ChevronRight className="size-3 text-slate-400" />
                <Link to="/packs" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  Packs
                </Link>
                <ChevronRight className="size-3 text-slate-400" />
                <Link
                  to={`/packs?category=${pack.category_slug}`}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  {pack.category_name}
                </Link>
                <ChevronRight className="size-3 text-slate-400" />
                <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                  {pack.name}
                </span>
              </div>
            </div>

            {/* Pack Hero Banner */}
            <div className="border-b border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#11121d] py-10 px-4 sm:px-6">
              <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300">
                      {pack.category_name}
                    </span>
                    {pack.is_premium ? (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">
                        <Sparkles className="size-3.5" />
                        <span>Premium Pack</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        Free Pack
                      </span>
                    )}
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      by <strong className="text-slate-700 dark:text-slate-300">{pack.author_name}</strong>
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    {pack.name}
                  </h1>

                  {pack.description && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                      {pack.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Layers className="size-4 text-purple-500" />
                      <strong className="text-slate-900 dark:text-white">{pack.icon_count}</strong> icons in this pack
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-900 dark:text-white">{pack.downloads_count}</strong> downloads
                    </span>
                  </div>
                </div>

                {/* Primary Action: Download Pack ZIP */}
                <div className="relative shrink-0 flex items-center gap-3">
                  <div className="relative">
                    <button
                      onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                      disabled={isDownloadingZip}
                      className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Download className={`size-4.5 ${isDownloadingZip ? 'animate-bounce' : ''}`} />
                      <span>{isDownloadingZip ? 'Preparing ZIP...' : 'Download Pack (ZIP)'}</span>
                    </button>

                    {/* Download options dropdown */}
                    {downloadMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setDownloadMenuOpen(false)} />
                        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#141522] border border-slate-200 dark:border-white/10 shadow-2xl p-2 z-50 text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                          <button
                            onClick={() => handleDownloadZip(activeStyle)}
                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                          >
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              Download {activeStyle.replace('-', ' ')} only (.zip)
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Fast download for currently selected style
                            </p>
                          </button>
                          <button
                            onClick={() => handleDownloadZip('all')}
                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border-t border-slate-100 dark:border-white/5 mt-1"
                          >
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              Download All Styles (.zip)
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Includes outlined, filled & color variants + license
                            </p>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Flaticon Style Switcher Bar & Search */}
            <div className="sticky top-16 z-30 bg-white/95 dark:bg-[#0d0e15]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 py-3.5 px-4 sm:px-6">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Dynamic Style Switcher Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
                    Style:
                  </span>
                  {(pack.available_styles || []).map((st) => {
                    const isSelected = activeStyle === st.slug;
                    return (
                      <button
                        key={st.slug}
                        onClick={() => setActiveStyle(st.slug as string)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                        }`}
                      >
                        <span>{st.name}</span>
                        {st.is_multicolor && (
                          <span className="size-2 rounded-full bg-amber-400" title="Multi-color icon" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Filter icons within pack */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search in this pack..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Pack Icons Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Showing {displayedIcons.length} of {pack.icons.length} Icons in &quot;{activeStyle.replace('-', ' ')}&quot;
                </span>
              </div>

              {displayedIcons.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                  {displayedIcons.map((icon) => {
                    const rawVariants = icon.variants || {};
                    // Pick SVG for activeStyle, fallback to outlined, fallback to any
                    const currentSvg =
                      rawVariants[activeStyle] ||
                      rawVariants['outlined'] ||
                      Object.values(rawVariants)[0] ||
                      '';

                    return (
                      <div
                        key={icon.id}
                        onClick={() => {
                          setSelectedIcon({
                            id: icon.id,
                            name: icon.name,
                            slug: icon.slug,
                            category: pack.category_name,
                            category_slug: pack.category_slug,
                            pack_id: pack.id,
                            pack_name: pack.name,
                            pack_slug: pack.slug,
                            tags: icon.tags || [],
                            downloads_count: icon.downloads_count,
                            favorites_count: icon.favorites_count,
                            style: activeStyle as any,
                            is_premium: icon.is_premium,
                            svg: currentSvg,
                          });
                        }}
                        className="group relative flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-[#121322] border border-slate-200/90 dark:border-white/10 hover:border-purple-400 dark:hover:border-purple-500/50 shadow-sm hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200 cursor-pointer"
                      >
                        {/* SVG Preview */}
                        <div
                          className="size-12 flex items-center justify-center text-slate-800 dark:text-slate-100 group-hover:scale-110 transition-transform [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-full [&_svg]:max-h-full [&_svg:not([data-multicolor])]:fill-current [&_path:not([fill])]:fill-current"
                          dangerouslySetInnerHTML={{ __html: currentSvg || '' }}
                        />

                        {/* Icon Title */}
                        <span className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors text-center truncate max-w-full px-1">
                          {icon.name}
                        </span>

                        {/* Hover Action Overlay */}
                        <div className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 bg-white/95 dark:bg-[#18192a]/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-slate-200 dark:border-white/10">
                          <button
                            title="Copy SVG"
                            onClick={(e) => handleCopySvg(e, icon.id, currentSvg)}
                            className="size-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/20 transition-colors"
                          >
                            {copiedId === icon.id ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                          </button>
                          <button
                            title="Download SVG"
                            onClick={(e) => handleQuickDownload(e, icon.name, currentSvg)}
                            className="size-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/20 transition-colors"
                          >
                            <Download className="size-3.5" />
                          </button>
                          <button
                            title="Add to Collection"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCollectionModalIcon({
                                id: icon.id,
                                name: icon.name,
                                slug: icon.slug,
                                category: pack.category_name,
                                category_slug: pack.category_slug,
                                tags: icon.tags || [],
                                downloads_count: icon.downloads_count,
                                favorites_count: icon.favorites_count,
                                style: activeStyle as any,
                                is_premium: icon.is_premium,
                                svg: currentSvg,
                              });
                            }}
                            className="size-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/20 transition-colors"
                          >
                            <FolderPlus className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No icons in this pack match &quot;{searchFilter}&quot;.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Icon Detail Customization Drawer */}
      {selectedIcon && (
        <IconDetailDrawer
          icon={selectedIcon}
          onClose={() => setSelectedIcon(null)}
          onOpenAddToCollection={(ico) => setCollectionModalIcon(ico)}
        />
      )}

      {/* Add to Collection Modal */}
      {collectionModalIcon && (
        <AddToCollectionModal
          icon={collectionModalIcon}
          onClose={() => setCollectionModalIcon(null)}
        />
      )}

      <SiteFooter />
    </div>
  );
}

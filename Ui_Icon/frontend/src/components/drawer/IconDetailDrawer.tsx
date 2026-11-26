// frontend/components/drawer/IconDetailDrawer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Download,
  Copy,
  Check,
  Share2,
  Heart,
  FolderPlus,
  Sliders,
  Sparkles,
  Zap,
  Lock,
} from 'lucide-react';
import { IconItem, StrokeLinecap, StrokeLinejoin, QuotaStatus, IconCustomization } from '@/types/icon';
import { useIconCustomization } from '@/context/IconCustomizationContext';
import { useAuth } from '@/context/AuthContext';
import {
  applyCustomizationToSvg,
  svgToJsx,
  downloadSvg,
  downloadPng,
  copyToClipboard,
} from '@/lib/svg-utils';
import {
  checkFavorite,
  addFavorite,
  removeFavorite,
  logDownload,
  getIcon,
  getIcons,
  getQuotaStatus,
  trackExport,
} from '@/lib/api';
import PricingModal from '@/components/pricing/PricingModal';

interface IconDetailDrawerProps {
  icon: IconItem | null;
  onClose: () => void;
  onOpenAddToCollection: (icon: IconItem) => void;
  onSelectIcon?: (icon: IconItem) => void;
}

export default function IconDetailDrawer({
  icon,
  onClose,
  onOpenAddToCollection,
  onSelectIcon,
}: IconDetailDrawerProps) {
  const { customization: globalCustomization, style: globalStyle } = useIconCustomization();
  const { user, setShowAuthModal, setAuthMode } = useAuth();

  const isProUser = Boolean(
    user && (
      user.is_pro ||
      user.subscription?.status === 'active' ||
      user.role === 'admin' ||
      (user.roles && user.roles.includes('admin'))
    )
  );

  // Active icon inside modal
  const [currentIcon, setCurrentIcon] = useState<IconItem | null>(icon);
  const isPremiumIcon = Boolean(
    currentIcon?.is_premium === true ||
    Number((currentIcon as any)?.is_premium) === 1 ||
    (currentIcon as any)?.is_premium === '1' ||
    icon?.is_premium === true ||
    Number((icon as any)?.is_premium) === 1 ||
    (currentIcon as any)?.tier === 'pro'
  );
  const isIconLocked = Boolean(isPremiumIcon && !isProUser);
  const [localStyle, setLocalStyle] = useState<'outlined' | 'filled'>(globalStyle);
  const [variantsMap, setVariantsMap] = useState<{ outlined?: string; filled?: string }>({});
  const [relatedVariants, setRelatedVariants] = useState<IconItem[]>([]);

  // Local customization state for the modal only (defaults to 330px size, 5px stroke width, black color)
  const [localCustom, setLocalCustom] = useState<IconCustomization>(() => ({
    ...globalCustomization,
    color: '#0f172a',
    size: 330,
    strokeWidth: 5,
  }));

  const [canvasBg, setCanvasBg] = useState<string>('#ffffff');

  const [copiedType, setCopiedType] = useState<'svg' | 'jsx' | 'name' | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);

  // Pricing Modal state
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingReason, setPricingReason] = useState<'pro_icon' | 'quota_reached' | 'general'>('pro_icon');

  const isDailyLimitReached = Boolean(user && quota && !quota.is_unlimited && quota.remaining <= 0);
  const isActionLocked = Boolean(!user || isIconLocked || isDailyLimitReached);

  // Sync currentIcon and immediately seed its SVG when icon prop changes
  useEffect(() => {
    if (icon) {
      setCurrentIcon(icon);
      // Immediately seed variantsMap with the newly clicked icon's own SVG so there is 0 delay
      const initialVariants: { outlined?: string; filled?: string } = (icon as any).variants
        ? { ...(icon as any).variants }
        : icon.svg
          ? { [globalStyle]: icon.svg, outlined: icon.svg }
          : {};
      setVariantsMap(initialVariants);
      setRelatedVariants([]);
      setLocalStyle(globalStyle);
      setLocalCustom({
        ...globalCustomization,
        color: globalCustomization.color || '#0f172a',
        size: 330,
        strokeWidth: 5,
      });
      setCanvasBg('#ffffff');
    } else {
      setCurrentIcon(null);
      setVariantsMap({});
      setRelatedVariants([]);
    }
  }, [icon]);

  // Fetch daily export quota status
  useEffect(() => {
    if (icon) {
      getQuotaStatus().then((res) => {
        if (res.success && res.data) {
          setQuota(res.data);
        }
      });
    }
  }, [icon, user]);

  // Handle clean close
  const handleClose = () => {
    setCurrentIcon(null);
    setVariantsMap({});
    setRelatedVariants([]);
    onClose();
  };

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch icon style variants and related sister icons in background
  useEffect(() => {
    if (!currentIcon) return;

    let isMounted = true;
    const currentId = currentIcon.id;

    // 1. Fetch single icon variants (both outlined and filled)
    getIcon(currentId).then((res) => {
      if (isMounted && res.success && res.data) {
        if (res.data.variants) {
          setVariantsMap((prev) => ({
            ...prev,
            ...res.data!.variants,
          }));
        }
        if (res.data.is_premium !== undefined) {
          setCurrentIcon((prev) => (prev && prev.id === currentId ? { ...prev, is_premium: Boolean(res.data!.is_premium) } : prev));
        }
      }
    });

    // 2. Fetch related family variants
    const basePrefix = currentIcon.name.split('-')[0];
    if (basePrefix && basePrefix.length >= 2) {
      getIcons({ search: basePrefix, limit: 16, style: localStyle }).then((res) => {
        if (isMounted && res.success && res.data?.icons) {
          setRelatedVariants(res.data.icons.filter((i) => i.id !== currentId));
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [currentIcon?.id, localStyle]);

  // Check if current icon is favorited by user
  useEffect(() => {
    if (!currentIcon || !user) {
      setIsFavorited(false);
      return;
    }

    let isMounted = true;
    checkFavorite(currentIcon.id).then((res) => {
      if (isMounted && res.success && res.data) {
        setIsFavorited(res.data.is_favorited);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentIcon, user]);

  if (!icon || !currentIcon) return null;

  // Choose the SVG based on selected localStyle variant
  const rawSvg =
    (localStyle === 'filled' && variantsMap.filled)
      ? variantsMap.filled
      : (variantsMap.outlined || currentIcon.svg);

  const customizedSvg = applyCustomizationToSvg(rawSvg, localCustom, localStyle);

  // Layer 4 Security: Validates quota before allowing copy or download
  const verifyAndConsumeQuota = async (action: 'copy' | 'download', format: 'svg' | 'png' | 'jsx'): Promise<boolean> => {
    if (isIconLocked) {
      setPricingReason('pro_icon');
      setShowPricingModal(true);
      return false;
    }
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return false;
    }
    if (isDailyLimitReached) {
      setPricingReason('quota_reached');
      setShowPricingModal(true);
      return false;
    }
    if (!currentIcon) return false;
    const res = await trackExport({
      iconId: currentIcon.id,
      action,
      format,
      size: localCustom.size,
    });

    if (!res.success) {
      if (res.data?.require_login || res.message?.toLowerCase().includes('guest limit') || res.message?.toLowerCase().includes('sign in')) {
        setAuthMode('login');
        setShowAuthModal(true);
        return false;
      }
      if (res.data?.require_pro || res.message?.toLowerCase().includes('free limit') || res.message?.toLowerCase().includes('pro')) {
        setPricingReason(isPremiumIcon ? 'pro_icon' : 'quota_reached');
        setShowPricingModal(true);
        return false;
      }
      return false;
    }

    if (res.data?.quota) {
      setQuota(res.data.quota);
    }
    return true;
  };

  // Copy SVG
  const handleCopySvg = async () => {
    if (isIconLocked) {
      setPricingReason('pro_icon');
      setShowPricingModal(true);
      return;
    }
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    if (isDailyLimitReached) {
      setPricingReason('quota_reached');
      setShowPricingModal(true);
      return;
    }
    const ok = await verifyAndConsumeQuota('copy', 'svg');
    if (!ok) return;

    const copied = await copyToClipboard(customizedSvg);
    if (copied) {
      setCopiedType('svg');
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  // Copy JSX
  const handleCopyJsx = async () => {
    if (isIconLocked) {
      setPricingReason('pro_icon');
      setShowPricingModal(true);
      return;
    }
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    if (isDailyLimitReached) {
      setPricingReason('quota_reached');
      setShowPricingModal(true);
      return;
    }
    const ok = await verifyAndConsumeQuota('copy', 'jsx');
    if (!ok) return;

    const compName = currentIcon.name
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');
    const jsx = svgToJsx(customizedSvg, `Icon${compName}`);
    const copied = await copyToClipboard(jsx);
    if (copied) {
      setCopiedType('jsx');
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  // Download SVG
  const handleDownloadSvg = async () => {
    if (isIconLocked) {
      setPricingReason('pro_icon');
      setShowPricingModal(true);
      return;
    }
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    if (isDailyLimitReached) {
      setPricingReason('quota_reached');
      setShowPricingModal(true);
      return;
    }
    const ok = await verifyAndConsumeQuota('download', 'svg');
    if (!ok) return;

    downloadSvg(customizedSvg, `${currentIcon.name}-${localStyle}-${localCustom.size}px`);
  };

  // Download PNG
  const handleDownloadPng = async () => {
    if (isIconLocked) {
      setPricingReason('pro_icon');
      setShowPricingModal(true);
      return;
    }
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    if (isDailyLimitReached) {
      setPricingReason('quota_reached');
      setShowPricingModal(true);
      return;
    }
    const ok = await verifyAndConsumeQuota('download', 'png');
    if (!ok) return;

    setDownloadingPng(true);
    try {
      await downloadPng(customizedSvg, `${currentIcon.name}-${localStyle}-${localCustom.size}px`, localCustom.size * 2);
    } catch (err) {
      console.error('PNG download failed:', err);
    } finally {
      setDownloadingPng(false);
    }
  };

  // Share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${currentIcon.name} - IconBaba`,
          text: `Check out the ${currentIcon.name} icon on IconBaba!`,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to copying URL below
      }
    }
    await copyToClipboard(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // Toggle Favorite
  const handleToggleFavorite = async () => {
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }

    setFavLoading(true);
    try {
      if (isFavorited) {
        await removeFavorite(currentIcon.id);
        setIsFavorited(false);
      } else {
        await addFavorite(currentIcon.id);
        setIsFavorited(true);
      }
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-xl md:max-w-2xl bg-white dark:bg-[#12131d] border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white animate-in slide-in-from-right duration-250">

        {/* Sticky Top Section: Header + Live Preview Canvas (Always in View) */}
        <div className="shrink-0 z-20 bg-white dark:bg-[#12131d] border-b border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#12131d]/95 backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{currentIcon.name}</h3>
                {currentIcon.is_premium && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[10px] font-black tracking-wider uppercase flex items-center gap-1 shadow-sm">
                    <span>👑</span>
                    <span>PRO</span>
                  </span>
                )}
              </div>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">{currentIcon.category}</span>
            </div>

            <div className="flex items-center gap-1">
              {/* Favorite Button */}
              <button
                onClick={handleToggleFavorite}
                disabled={favLoading}
                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${isFavorited
                  ? 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-white/10'
                  }`}
              >
                <Heart className={`size-4 ${isFavorited ? 'fill-pink-500 dark:fill-pink-400' : ''}`} />
              </button>

              {/* Add to Collection Button */}
              <button
                onClick={() => {
                  if (!user) {
                    setAuthMode('login');
                    setShowAuthModal(true);
                    return;
                  }
                  onOpenAddToCollection(currentIcon);
                }}
                title="Add to Collection"
                aria-label="Add to Collection"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
              >
                <FolderPlus className="size-4" />
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                title={copiedShare ? 'Link copied!' : 'Share Icon'}
                aria-label="Share Icon"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
              >
                {copiedShare ? <Check className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}
              </button>

              {/* Close */}
              <button
                onClick={handleClose}
                aria-label="Close detail drawer"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-colors ml-1 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Sticky Big Preview Canvas (Dynamic Background Color or Pattern) */}
          {(() => {
            const isPatternLight = canvasBg === 'pattern' || canvasBg === 'pattern-light';
            const isPatternDark = canvasBg === 'pattern-dark';
            const isPattern = isPatternLight || isPatternDark;
            const patternClass = isPatternLight ? 'bg-checkerboard-light' : isPatternDark ? 'bg-checkerboard-dark' : '';

            return (
              <div 
                className={`relative overflow-hidden border-b border-slate-200 dark:border-white/10 transition-colors ${patternClass}`} 
                style={{ backgroundColor: isPattern ? undefined : canvasBg }}
              >
                <div
                  className={`w-full h-48 sm:h-96 flex items-center justify-center p-4 transition-colors relative ${patternClass}`}
                  style={{ backgroundColor: isPattern ? undefined : canvasBg }}
                >
                  <div
                    style={{
                      width: `${Math.min(localCustom.size, 512)}px`,
                      height: `${Math.min(localCustom.size, 512)}px`,
                      maxWidth: '100%',
                      maxHeight: '100%',
                    }}
                    className="flex items-center justify-center transition-all drop-shadow-sm shrink-0 [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: customizedSvg }}
                  />

                  {/* Live Info Pill (Size, Icon Color, BG Color/Pattern, Stroke) */}
                  <div className="absolute top-2.5 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-[10px] sm:text-[11px] font-mono text-white shadow-sm pointer-events-none">
                    <span className="font-semibold text-purple-300">{localCustom.size}px</span>
                    <span className="text-slate-500">•</span>
                    <span className="size-2.5 rounded-full inline-block border border-white/30" style={{ backgroundColor: localCustom.color }} title="Icon Color" />
                    <span className="font-semibold">{localCustom.color}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">BG:</span>
                    {isPatternLight ? (
                      <>
                        <span className="size-2.5 rounded-full inline-block bg-checkerboard-light border border-white/30" title="Light Pattern" />
                        <span className="font-semibold text-purple-300">White Pattern</span>
                      </>
                    ) : isPatternDark ? (
                      <>
                        <span className="size-2.5 rounded-full inline-block bg-checkerboard-dark border border-white/30" title="Dark Pattern" />
                        <span className="font-semibold text-purple-300">Dark Pattern</span>
                      </>
                    ) : (
                      <>
                        <span className="size-2.5 rounded-full inline-block border border-white/30" style={{ backgroundColor: canvasBg }} title="Canvas BG" />
                        <span className="font-semibold">{canvasBg}</span>
                      </>
                    )}
                    {localStyle === 'outlined' && (
                      <>
                        <span className="text-slate-500">•</span>
                        <span>{localCustom.strokeWidth}w</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Scrollable Controls Panel */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-white dark:bg-[#12131d]">

          {/* Style Variants Selector (Outlined vs Filled) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Style Variants
              </span>
              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold capitalize">
                {localStyle} Selected
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Outlined variant button */}
              <button
                type="button"
                onClick={() => setLocalStyle('outlined')}
                className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${localStyle === 'outlined'
                  ? 'bg-purple-50 dark:bg-purple-600/20 border-purple-500 text-purple-950 dark:text-white shadow-sm ring-1 ring-purple-500/30'
                  : 'bg-white dark:bg-black/30 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
              >
                <div
                  className="size-7 flex items-center justify-center shrink-0"
                  dangerouslySetInnerHTML={{
                    __html: applyCustomizationToSvg(
                      variantsMap.outlined || currentIcon.svg,
                      { ...localCustom, size: 22 },
                      'outlined'
                    ),
                  }}
                />
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Outlined</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Stroke vector</div>
                </div>
              </button>

              {/* Filled variant button */}
              <button
                type="button"
                disabled={!Boolean(variantsMap.filled)}
                onClick={() => setLocalStyle('filled')}
                className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${!variantsMap.filled
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-black/20 border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500'
                  : localStyle === 'filled'
                    ? 'bg-purple-50 dark:bg-purple-600/20 border-purple-500 text-purple-950 dark:text-white shadow-sm ring-1 ring-purple-500/30'
                    : 'bg-white dark:bg-black/30 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                title={!variantsMap.filled ? 'Filled variant is not available for this stroke icon' : 'Switch to filled'}
              >
                <div
                  className="size-7 flex items-center justify-center shrink-0"
                  dangerouslySetInnerHTML={{
                    __html: applyCustomizationToSvg(
                      variantsMap.filled || currentIcon.svg,
                      { ...localCustom, size: 22 },
                      variantsMap.filled ? 'filled' : 'outlined'
                    ),
                  }}
                />
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Filled</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {variantsMap.filled ? 'Solid vector' : 'Outline only'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Daily Quota Indicator Badge */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-xs shadow-sm">
            <div className="flex items-center gap-2">
              {!user ? (
                <div
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors"
                >
                  <Lock className="size-3.5 text-amber-500" />
                  <span className="text-[11px] font-medium">
                    Downloads & vector copying locked • <strong className="text-purple-600 dark:text-purple-400 hover:underline">Sign in to unlock</strong>
                  </span>
                </div>
              ) : quota?.is_unlimited ? (
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                  <Zap className="size-3.5 fill-amber-500" /> Pro Member • Unlimited Access
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${quota?.remaining && quota.remaining > 5 ? 'bg-emerald-500' : (quota?.remaining ?? 0) > 0 ? 'bg-amber-500' : 'bg-red-500'} animate-pulse`} />
                  <span className="text-slate-700 dark:text-slate-300 text-[11px]">
                    Daily Free Quota: <strong className="text-slate-900 dark:text-white font-mono font-bold">{quota?.remaining ?? 20}/{quota?.limit ?? 20}</strong> icons left
                  </span>
                </div>
              )}
            </div>
            {!user ? (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                Sign In ↗
              </button>
            ) : !quota?.is_unlimited ? (
              <button
                type="button"
                onClick={() => {
                  setPricingReason('general');
                  setShowPricingModal(true);
                }}
                className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                Upgrade to Pro ↗
              </button>
            ) : null}
          </div>

          {/* Pro Icon Banner if icon is locked */}
          {isIconLocked && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-[#1a1710] border border-amber-300 dark:border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="size-10 rounded-xl bg-amber-200 dark:bg-amber-500/20 border border-amber-400 dark:border-amber-500/40 flex items-center justify-center text-amber-800 dark:text-amber-300 text-lg shrink-0">
                  👑
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950 dark:text-amber-300">Exclusive Pro Icon</h4>
                  <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                    {user ? 'This vector icon is exclusive to Pro members. Upgrade to Pro to download and copy with unlimited commercial license.' : 'Sign in to your Pro account or upgrade to unlock this vector icon.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPricingReason('pro_icon');
                  setShowPricingModal(true);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/25 transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>👑</span>
                <span>Upgrade to Pro</span>
              </button>
            </div>
          )}

          {/* Daily Limit Reached Banner */}
          {!isIconLocked && isDailyLimitReached && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-[#1a1116] border border-rose-300 dark:border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="size-10 rounded-xl bg-rose-200 dark:bg-rose-500/20 border border-rose-400 dark:border-rose-500/40 flex items-center justify-center text-rose-800 dark:text-rose-300 text-lg shrink-0">
                  ⚡
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-950 dark:text-rose-300">Daily Free Limit Reached (20/20)</h4>
                  <p className="text-[11px] text-rose-900/80 dark:text-rose-200/80 leading-relaxed">
                    You have used your 20 free vector icon downloads for today. Upgrade to Pro for unlimited downloads & copies!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPricingReason('quota_reached');
                  setShowPricingModal(true);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-purple-500/25 transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <span>Upgrade to Pro ↗</span>
              </button>
            </div>
          )}

          {/* Action Buttons: Download SVG, Download PNG, Copy SVG, Copy JSX */}
          <div className="space-y-2.5">
            {!user && (
              <div
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                className="p-3 rounded-2xl bg-purple-50 dark:bg-[#161426] border border-purple-200 dark:border-purple-500/30 hover:border-purple-300 dark:hover:border-purple-500/50 flex items-center justify-between gap-2 cursor-pointer transition-all group shadow-sm"
              >
                <div className="flex items-center gap-2.5 text-xs text-purple-900 dark:text-purple-200">
                  <div className="size-7 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                    <Lock className="size-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block text-[11px]">Actions Locked</span>
                    <span className="text-[10px] text-slate-600 dark:text-purple-200/80">Sign in to unlock free SVG & PNG downloads and JSX copies</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 group-hover:text-purple-800 dark:group-hover:text-purple-200 flex items-center gap-1 shrink-0 bg-white dark:bg-purple-500/20 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-500/30 shadow-xs">
                  Sign In →
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              {/* Download SVG */}
              <button
                onClick={handleDownloadSvg}
                aria-label="Download SVG file"
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold transition-all relative group cursor-pointer ${isIconLocked
                  ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 hover:bg-amber-200 dark:hover:bg-amber-500/25 shadow-sm'
                  : isActionLocked
                    ? 'bg-purple-100 dark:bg-purple-600/30 text-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-500/40 hover:bg-purple-200 dark:hover:bg-purple-600/50 shadow-sm'
                    : 'text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/25'
                  }`}
              >
                {isActionLocked ? (
                  <Lock className="size-3.5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                ) : (
                  <Download className="size-4" />
                )}
                <span>Download SVG</span>
                {isIconLocked && (
                  <Lock className="size-3 text-amber-600 dark:text-amber-400/90 ml-1 shrink-0" />
                )}
              </button>

              {/* Download PNG */}
              <button
                onClick={handleDownloadPng}
                disabled={downloadingPng}
                aria-label="Download PNG file"
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold transition-all relative group cursor-pointer ${isIconLocked
                  ? 'text-amber-950 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                  : isActionLocked
                    ? 'text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 hover:border-purple-400 dark:hover:border-purple-500/40'
                    : 'text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10'
                  }`}
              >
                {isActionLocked ? (
                  <Lock className="size-3.5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                ) : (
                  <Download className="size-4" />
                )}
                <span>{downloadingPng ? 'Exporting...' : 'Download PNG'}</span>
                {isIconLocked && (
                  <Lock className="size-3 text-amber-600 dark:text-amber-400/90 ml-1 shrink-0" />
                )}
              </button>

              {/* Copy SVG */}
              <button
                onClick={handleCopySvg}
                aria-label="Copy SVG code to clipboard"
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold transition-all relative group cursor-pointer ${isIconLocked
                  ? 'text-amber-950 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                  : isActionLocked
                    ? 'text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 hover:border-purple-400 dark:hover:border-purple-500/40'
                    : 'text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10'
                  }`}
              >
                {isActionLocked ? (
                  <Lock className="size-3.5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                ) : copiedType === 'svg' ? (
                  <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="size-4" />
                )}
                <span>{copiedType === 'svg' ? 'Copied SVG!' : 'Copy SVG'}</span>
                {isIconLocked && (
                  <Lock className="size-3 text-amber-600 dark:text-amber-400/90 ml-1 shrink-0" />
                )}
              </button>

              {/* Copy React JSX */}
              <button
                onClick={handleCopyJsx}
                aria-label="Copy React JSX component code to clipboard"
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold transition-all relative group cursor-pointer ${isIconLocked
                  ? 'text-amber-950 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                  : isActionLocked
                    ? 'text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 hover:border-purple-400 dark:hover:border-purple-500/40'
                    : 'text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10'
                  }`}
              >
                {isActionLocked ? (
                  <Lock className="size-3.5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                ) : copiedType === 'jsx' ? (
                  <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="size-4" />
                )}
                <span>{copiedType === 'jsx' ? 'Copied JSX!' : 'Copy React JSX'}</span>
                {isIconLocked && (
                  <Lock className="size-3 text-amber-600 dark:text-amber-400/90 ml-1 shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* Customization Details Controls (LOCAL TO THIS ICON ONLY) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                <Sliders className="size-3.5 text-purple-600 dark:text-purple-400" />
                Customize This Icon
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Modal only</span>
            </div>

            {/* Size Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <span>Icon Size</span>
                <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{localCustom.size}px</span>
              </div>
              <input
                type="range"
                min="16"
                max="512"
                step="8"
                value={localCustom.size}
                onChange={(e) => setLocalCustom((prev) => ({ ...prev, size: Number(e.target.value) }))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex items-center justify-between gap-1 mt-2">
                {[48, 128, 256, 330, 512].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setLocalCustom((prev) => ({ ...prev, size: sz }))}
                    className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${localCustom.size === sz
                      ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                      : 'bg-white dark:bg-black/30 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                  >
                    {sz}px
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector (Local to this icon) */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <span>Icon Color</span>
                <span className="font-mono text-purple-600 dark:text-purple-400 font-bold text-[11px]">{localCustom.color}</span>
              </div>
              <div className="flex items-center gap-2">
                {['#0f172a', '#8b5cf6', '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#ffffff'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setLocalCustom((prev) => ({ ...prev, color: c }))}
                    className={`size-6 rounded-lg border transition-transform cursor-pointer ${localCustom.color.toLowerCase() === c.toLowerCase() ? 'border-purple-600 ring-2 ring-purple-500/40 scale-110 shadow-sm' : 'border-slate-300 dark:border-white/20 hover:scale-105'
                      }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
                <input
                  type="color"
                  value={localCustom.color}
                  onChange={(e) => setLocalCustom((prev) => ({ ...prev, color: e.target.value }))}
                  className="size-6 rounded cursor-pointer border-0 bg-transparent ml-auto"
                  title="Custom color picker"
                  aria-label="Custom color picker"
                />
              </div>
            </div>

            {/* Canvas Background Color Selector */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <span>Canvas Background</span>
                <span className="font-mono text-purple-600 dark:text-purple-400 font-bold text-[11px] capitalize">
                  {canvasBg === 'pattern' || canvasBg === 'pattern-light'
                    ? 'White Pattern'
                    : canvasBg === 'pattern-dark'
                      ? 'Dark Pattern'
                      : canvasBg}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* 1. White Pattern (Checkerboard) Swatch */}
                <button
                  type="button"
                  onClick={() => setCanvasBg('pattern-light')}
                  className={`size-6 rounded-lg border transition-transform cursor-pointer bg-checkerboard-light shrink-0 ${
                    canvasBg === 'pattern-light' || canvasBg === 'pattern'
                      ? 'border-purple-600 ring-2 ring-purple-500/40 scale-110 shadow-sm'
                      : 'border-slate-300 dark:border-white/20 hover:scale-105'
                  }`}
                  title="White Pattern (Checkerboard)"
                  aria-label="Select White Pattern background"
                />

                {/* 2. Dark Pattern (Checkerboard) Swatch */}
                <button
                  type="button"
                  onClick={() => setCanvasBg('pattern-dark')}
                  className={`size-6 rounded-lg border transition-transform cursor-pointer bg-checkerboard-dark shrink-0 ${
                    canvasBg === 'pattern-dark'
                      ? 'border-purple-600 ring-2 ring-purple-500/40 scale-110 shadow-sm'
                      : 'border-slate-300 dark:border-white/20 hover:scale-105'
                  }`}
                  title="Dark Pattern (Checkerboard)"
                  aria-label="Select Dark Pattern background"
                />

                {/* Preset Solid Colors */}
                {[
                  { label: 'White', color: '#ffffff' },
                  { label: 'Slate Dark', color: '#0f172a' },
                  { label: 'Light Gray', color: '#f8fafc' },
                  { label: 'Purple Mist', color: '#f3e8ff' },
                  { label: 'Soft Sky', color: '#e0f2fe' },
                  { label: 'Soft Mint', color: '#dcfce7' },
                  { label: 'Soft Amber', color: '#fef3c7' },
                  { label: 'Soft Rose', color: '#ffe4e6' },
                ].map((bgItem) => (
                  <button
                    key={bgItem.color}
                    type="button"
                    onClick={() => setCanvasBg(bgItem.color)}
                    className={`size-6 rounded-lg border transition-transform cursor-pointer ${canvasBg.toLowerCase() === bgItem.color.toLowerCase() ? 'border-purple-600 ring-2 ring-purple-500/40 scale-110 shadow-sm' : 'border-slate-300 dark:border-white/20 hover:scale-105'
                      }`}
                    style={{ backgroundColor: bgItem.color }}
                    title={bgItem.label}
                    aria-label={`Select background ${bgItem.label}`}
                  />
                ))}

                {/* Custom Hex Color Picker */}
                <input
                  type="color"
                  value={canvasBg.startsWith('pattern') ? '#ffffff' : canvasBg}
                  onChange={(e) => setCanvasBg(e.target.value)}
                  className="size-6 rounded cursor-pointer border-0 bg-transparent ml-auto"
                  title="Custom background color picker"
                  aria-label="Custom background color picker"
                />
              </div>
            </div>

            {/* Stroke Width Slider (Outlined: 1px - 15px, Default 5px) */}
            {localStyle === 'outlined' && (
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Stroke Width</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">{localCustom.strokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="0.5"
                  value={localCustom.strokeWidth}
                  onChange={(e) => setLocalCustom((prev) => ({ ...prev, strokeWidth: Number(e.target.value) }))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <div className="flex items-center justify-between gap-1 mt-2">
                  {[1, 2.5, 5, 8, 12, 15].map((sw) => (
                    <button
                      key={sw}
                      type="button"
                      onClick={() => setLocalCustom((prev) => ({ ...prev, strokeWidth: sw }))}
                      className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${localCustom.strokeWidth === sw
                        ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                        : 'bg-white dark:bg-black/30 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                    >
                      {sw}px
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Line Cap & Line Join (Outlined) */}
            {localStyle === 'outlined' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">Line Cap</span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-200/70 dark:bg-black/40 p-1 rounded-xl border border-slate-300 dark:border-white/10 text-center">
                    {(['round', 'butt', 'square'] as StrokeLinecap[]).map((cap) => (
                      <button
                        key={cap}
                        onClick={() => setLocalCustom((prev) => ({ ...prev, strokeLinecap: cap }))}
                        className={`py-1 text-[11px] font-semibold capitalize rounded-lg transition-colors cursor-pointer ${localCustom.strokeLinecap === cap
                          ? 'bg-purple-600 text-white font-bold shadow-sm'
                          : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                          }`}
                      >
                        {cap}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">Line Join</span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-200/70 dark:bg-black/40 p-1 rounded-xl border border-slate-300 dark:border-white/10 text-center">
                    {(['round', 'bevel', 'miter'] as StrokeLinejoin[]).map((join) => (
                      <button
                        key={join}
                        onClick={() => setLocalCustom((prev) => ({ ...prev, strokeLinejoin: join }))}
                        className={`py-1 text-[11px] font-semibold capitalize rounded-lg transition-colors cursor-pointer ${localCustom.strokeLinejoin === join
                          ? 'bg-purple-600 text-white font-bold shadow-sm'
                          : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                          }`}
                      >
                        {join}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Related Icon Variants (Sister Icons) */}
          {relatedVariants.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 flex items-center gap-2">
                  <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" />
                  Related Icon Variants ({relatedVariants.length})
                </h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Click to switch</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
                {relatedVariants.map((relIcon) => (
                  <button
                    key={relIcon.id}
                    type="button"
                    onClick={() => {
                      const initialVariants: { outlined?: string; filled?: string } = (relIcon as any).variants
                        ? { ...(relIcon as any).variants }
                        : relIcon.svg
                          ? { [localStyle]: relIcon.svg, outlined: relIcon.svg }
                          : {};
                      setVariantsMap(initialVariants);
                      setCurrentIcon(relIcon);
                      onSelectIcon?.(relIcon);
                    }}
                    title={relIcon.name}
                    className="group aspect-square rounded-xl p-2 bg-white dark:bg-black/40 hover:bg-purple-50 dark:hover:bg-purple-600/20 border border-slate-200 dark:border-white/10 hover:border-purple-400 dark:hover:border-purple-500/40 flex flex-col items-center justify-center transition-all hover:scale-105 shadow-xs cursor-pointer"
                  >
                    <div
                      className="size-6 flex items-center justify-center mb-1 transition-transform group-hover:scale-110"
                      dangerouslySetInnerHTML={{
                        __html: applyCustomizationToSvg(relIcon.svg, { ...localCustom, size: 20 }, localStyle),
                      }}
                    />
                    <span className="text-[9px] font-medium text-slate-700 dark:text-slate-400 group-hover:text-purple-700 dark:group-hover:text-white truncate w-full text-center">
                      {relIcon.name.replace(currentIcon.name.split('-')[0] + '-', '') || relIcon.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* UI Examples Preview */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-3 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 flex items-center gap-2">
              <Sparkles className="size-3.5 text-pink-500 dark:text-pink-400" />
              UI Component Examples
            </h4>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* Badge with icon */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-xs font-semibold text-purple-800 dark:text-purple-300">
                <div
                  className="size-4 flex items-center justify-center"
                  dangerouslySetInnerHTML={{
                    __html: applyCustomizationToSvg(rawSvg, { ...localCustom, size: 14 }, localStyle),
                  }}
                />
                Verified
              </div>

              {/* Link with icon */}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <div
                  className="size-4 flex items-center justify-center"
                  dangerouslySetInnerHTML={{
                    __html: applyCustomizationToSvg(rawSvg, { ...localCustom, size: 14 }, localStyle),
                  }}
                />
                Explore More
              </a>

              {/* Action Button with icon */}
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-sm transition-colors cursor-pointer">
                <div
                  className="size-4 flex items-center justify-center"
                  dangerouslySetInnerHTML={{
                    __html: applyCustomizationToSvg(rawSvg, { ...localCustom, size: 14, color: '#ffffff' }, localStyle),
                  }}
                />
                Action
              </button>

              {/* Secondary Icon Button */}
              <button className="size-8 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors shadow-xs cursor-pointer">
                <div
                  className="size-4 flex items-center justify-center"
                  dangerouslySetInnerHTML={{
                    __html: applyCustomizationToSvg(rawSvg, { ...localCustom, size: 16 }, localStyle),
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        reason={pricingReason}
        iconName={currentIcon?.name}
      />
    </>
  );
}

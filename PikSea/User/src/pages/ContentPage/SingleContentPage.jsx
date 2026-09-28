import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import NotFound from "../../components/NotFound";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  Grid2X2Plus,
  Images,
  Share2,
  Sparkles,
  CheckCircle2,
  Tag,
  Crown,
  X,
  Maximize2,
  ShieldCheck,
  Copy,
  Layers,
  Check,
  Sparkle
} from "lucide-react";
import useContents from "../../utlis/Hooks/useContents";
import { getContentBySlug } from "../../api/api";
import { useQuery } from "@tanstack/react-query";
import useAuth from "../../utlis/Hooks/useAuth";
import DayalLoader from "../../components/Common/DayalLoader";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import SaveToCollectionModal from "../../components/Modals/SaveToCollectionModal";
import Masonry from "react-masonry-css";
import DynamicSEO from "../../components/CMS/DynamicSEO";
import { saveToRecentlyViewed } from "../../utlis/recentActivity";
import DownloadCelebration from "../../components/Common/DownloadCelebration";

const BASE_URL = import.meta.env.VITE_IMG_KEY || "https://api.dayalstock.com";

const breakpointColumnsObj = {
  default: 5,
  1536: 5,
  1280: 4,
  1024: 3,
  768: 2,
  640: 2,
};

const getPreviewImage = (item) => {
  const src =
    item?.preview_1200_url || item?.preview_600_url || item?.watermarked_preview_image || item?.preview_image || item?.image_url;
  if (!src) return "/placeholder.jpg";
  if (src.startsWith("http")) return src;
  return `${BASE_URL}/${src}`;
};

const SingleContentPage = ({ categorySlug, contentSlug }) => {
  const { user } = useAuth();
  const params = useParams();
  const slug = contentSlug || params.slug;
  const category = categorySlug || params.category;
  const navigate = useNavigate();
  const location = useLocation();
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load Lemon Squeezy Script
  useEffect(() => {
    if (window.createLemonSqueezy) {
      window.createLemonSqueezy();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://app.lemonsqueezy.com/js/lemonsqueezy.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.createLemonSqueezy) {
        window.createLemonSqueezy();
      }
    };
  }, []);

  const { data: infiniteData, isLoading: isContentsLoading, error: contentsError } = useContents({ limit: 500 });
  const contents = infiniteData?.pages?.flatMap((page) => page.data) ?? [];

  // Fetch full content details (including the `files` array) which is omitted in useContents
  const {
    data: singleContentData,
    isLoading: isSingleLoading,
    error: singleError
  } = useQuery({
    queryKey: ["content", slug],
    queryFn: () => getContentBySlug(slug),
    enabled: !!slug
  });

  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isBuyoutModalOpen, setIsBuyoutModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const currentData = singleContentData || contents?.find((content) => content?.slug === slug);

  // Fetch buyout status
  const { data: buyoutData } = useQuery({
    queryKey: ["buyoutStatus", currentData?.id],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/contents_download/check_buyout_status.php?content_id=${currentData.id}&api_key=${import.meta.env.VITE_APP_SECRET}`);
      const data = await res.json();
      return data?.success ? data.data : null;
    },
    enabled: !!currentData?.id
  });

  const allFiles = currentData?.files || [];
  const hasPreviewInFiles = allFiles.some(f => ['jpg', 'jpeg', 'png'].includes(f.file_type?.toLowerCase()));
  const previewFullUrl = getPreviewImage(currentData);

  const filesToShow = (previewFullUrl && previewFullUrl !== '/placeholder.jpg' && !hasPreviewInFiles) ? [
    ...allFiles,
    {
      id: 'preview-file',
      file_name: `${currentData?.slug || 'preview'}-preview.jpg`,
      file_type: 'JPG (Preview)',
      file_url: previewFullUrl,
      width: currentData?.width,
      height: currentData?.height
    }
  ] : allFiles;

  const relatedContents = contents?.filter(
    item => item.id !== currentData?.id && (item.content_type === currentData?.content_type || item.category_id === currentData?.category_id)
  ).slice(0, 15) || [];

  useEffect(() => {
    if (currentData?.id) {
      // Retrieve the list of previously viewed content IDs from sessionStorage
      const viewedContents = JSON.parse(sessionStorage.getItem("viewed_contents") || "[]");

      // Only call the API if this content has not been viewed in the current session
      if (!viewedContents.includes(currentData.id)) {
        saveToRecentlyViewed(currentData);

        const updateViewCount = async () => {
          try {
            await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/contents/update_views.php`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": import.meta.env.VITE_APP_SECRET
              },
              body: JSON.stringify({ content_id: currentData.id }),
            });

            // Save the ID in sessionStorage if successful
            viewedContents.push(currentData.id);
            sessionStorage.setItem("viewed_contents", JSON.stringify(viewedContents));

          } catch (error) {
            console.error("Failed to update view count:", error);
          }
        };

        updateViewCount();
      }
    }
  }, [currentData?.id]);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: currentData?.title || "DayalStock Asset",
        url: url
      }).catch(() => { });
    } else {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success("Asset link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success("Asset link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Shows a toast with an optional 'Upgrade' link when download limit is hit
  const showDownloadError = (data) => {
    if (data.upgrade_required) {
      toast.error(
        <span>
          {data.message}{" "}
          <a
            href="/join-pro"
            style={{ color: "#f97316", fontWeight: 700, textDecoration: "underline" }}
          >
            Upgrade now →
          </a>
        </span>,
        { autoClose: 5000 }
      );
    } else {
      toast.error(data.message);
    }
  };

  const handleDownloadZip = async () => {
    let token = "";
    if (user) {
      token = await user.getIdToken();
    }

    if (!token) {
      toast.error("Please login to download.");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/contents/check_download_limit.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-api-key": import.meta.env.VITE_APP_SECRET
        },
        body: JSON.stringify({
          email: user?.email || "",
          content_id: currentData.id
        }),
      });
      const data = await res.json();

      if (!data.success) {
        showDownloadError(data);
        return;
      }

      toast.info("Preparing your download...");

      const downloadUrl = `${import.meta.env.VITE_LOCALHOST_KEY}/contents_download/downloadContentZip.php?content_id=${currentData.id}&token=${token}&api_key=${import.meta.env.VITE_APP_SECRET}`;
      window.open(downloadUrl, "_blank");
      setShowCelebration(true);

    } catch (error) {
      console.error("Download failed:", error);
      toast.error("An error occurred while downloading.");
    }
  };

  const fetchAndDownload = async (url, fileName) => {
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "Download failed. Please try again.");
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    setShowCelebration(true);
  };

  const handleSingleFileDownload = async (e, file) => {
    e.preventDefault();
    setShowDownloadOptions(false);

    let token = "";
    if (user) {
      token = await user.getIdToken();
    }

    if (!token) {
      toast.error("Please login to download.");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/contents/check_download_limit.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-api-key": import.meta.env.VITE_APP_SECRET
        },
        body: JSON.stringify({
          email: user?.email || "",
          content_id: currentData.id
        }),
      });
      const data = await res.json();

      if (!data.success) {
        showDownloadError(data);
        return;
      }

      if (file.id === "preview-file") {
        toast.info("Starting preview download...");
        const downloadUrl = `${import.meta.env.VITE_LOCALHOST_KEY}/contents_download/downloadPreview.php?content_id=${currentData.id}&token=${token}&api_key=${import.meta.env.VITE_APP_SECRET}`;
        await fetchAndDownload(downloadUrl, file.file_name);
      } else {
        toast.info(`Starting download for ${file.file_name}...`);
        const downloadUrl = `${import.meta.env.VITE_LOCALHOST_KEY}/contents_download/downloadSingleFile.php?content_id=${currentData.id}&file_id=${file.id}&file_name=${encodeURIComponent(file.file_name)}&token=${token}&api_key=${import.meta.env.VITE_APP_SECRET}`;
        await fetchAndDownload(downloadUrl, file.file_name);
      }

    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error(error.message || "Download failed. Please try again.");
    }
  };

  if (isSingleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#050505]">
        <DayalLoader text="Loading asset details..." />
      </div>
    );
  }

  if (singleError || !currentData) {
    if (singleError) console.error("SingleContentPage API error:", singleError);
    return <NotFound />;
  }

  const pageTitle = `${currentData.title} - ${currentData.is_premium ? 'Premium' : 'Free'} ${currentData.content_type || 'Asset'} | DayalStock`;
  const seoDescription = currentData.tags ? `Download ${currentData.title}. Related to: ${currentData.tags.map(t => t.name).join(', ')}` : `Download ${currentData.title} on DayalStock.`;
  const canonicalUrl = `https://dayalstock.com/${category || currentData.content_type || 'images'}/${currentData.slug}`;

  const seoData = {
    title: pageTitle,
    meta_description: seoDescription,
    meta_keywords: currentData.tags ? currentData.tags.map(t => t.name).join(', ') : '',
    canonical_url: canonicalUrl,
    og_title: pageTitle,
    og_description: seoDescription,
    og_image: getPreviewImage(currentData),
    og_url: canonicalUrl,
    og_type: 'article',
    is_indexable: true
  };

  const jsonLdData = {
    "@context": "https://schema.org/",
    "@type": "ImageObject",
    "contentUrl": getPreviewImage(currentData),
    "license": currentData.license_type === "free" ? "https://dayalstock.com/licensing" : "https://dayalstock.com/licensing#premium",
    "acquireLicensePage": canonicalUrl,
    "creator": {
      "@type": "Organization",
      "name": "DayalStock"
    },
    "creditText": "DayalStock",
    "copyrightNotice": "DayalStock",
    "name": currentData.title,
    "description": seoDescription
  };

  const formatList = [...new Set(
    (currentData?.files || [])
      .map(f => f.file_type?.toLowerCase())
      .filter(Boolean)
      .filter(type => type !== 'webp' && !type.includes('preview'))
      .map(type => type.toUpperCase())
  )].join(', ') || currentData?.file_type?.toUpperCase() || "JPG";

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50/50 dark:bg-[#050505] transition-colors">
      <DynamicSEO pageData={seoData} />
      <script type="application/ld+json">
        {JSON.stringify(jsonLdData)}
      </script>

      {/* Main Content Area */}
      <div className="w-fullmx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4">

        {/* Navigation Breadcrumb bar */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <button
            onClick={() => window.history.back()}
            className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#111] border border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#00D4FF]/50 hover:text-[#0088b3] dark:hover:text-[#00D4FF] transition-all text-xs font-semibold shadow-xs"
          >
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-inter">
            <Link to="/" className="hover:text-gray-900 dark:hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link to={`/${category || 'explore'}`} className="hover:text-gray-900 dark:hover:text-white transition-colors capitalize">{category || 'Explore'}</Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-medium truncate max-w-[260px]">{currentData?.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#111] border border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-[#0088b3] dark:hover:text-[#00D4FF] hover:border-[#00D4FF]/40 transition-all text-xs font-medium shadow-xs"
              title="Copy Link"
            >
              {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span className="hidden md:inline">{copiedLink ? "Copied" : "Copy Link"}</span>
            </button>
            <button
              onClick={handleShare}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-white dark:bg-[#111] border border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-[#0088b3] dark:hover:text-[#00D4FF] hover:border-[#00D4FF]/40 transition-all text-xs font-medium shadow-xs flex items-center gap-1.5"
              title="Share"
            >
              <Share2 size={14} />
              <span className="hidden md:inline">Share</span>
            </button>
          </div>
        </div>

        {/* Two-Column 7:5 Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* Left Column: Visual Stage (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">

            {/* The Visual Stage Canvas */}
            <div className="relative rounded-3xl bg-gradient-to-b from-slate-100/90 via-slate-50 to-slate-100/60 dark:from-[#121212] dark:via-[#090909] dark:to-[#0e0e0e] border border-gray-200/80 dark:border-white/10 p-4 sm:p-6 lg:p-8 flex items-center justify-center overflow-hidden shadow-xs group min-h-[420px] sm:min-h-[500px] lg:min-h-[560px]">

              {/* Floating Pro / Free Badge */}
              <div className="absolute top-4 left-4 z-20">
                {currentData?.is_premium ? (
                  <span className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                    <Crown size={13} /> PRO ASSET
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                    <Sparkles size={13} /> FREE ASSET
                  </span>
                )}
              </div>

              {/* Floating Format Pill */}
              <div className="absolute top-4 right-4 z-20">
                <span className="px-3 py-1.5 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-md border border-gray-200/80 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 shadow-xs uppercase tracking-wide">
                  {formatList}
                </span>
              </div>

              {/* Main Media Preview */}
              <div className="relative z-10 flex items-center justify-center w-full h-full py-4">
                {currentData?.content_type === "video" ? (
                  <video
                    src={currentData?.watermarked_preview_video ? `${BASE_URL}/${currentData.watermarked_preview_video}` : `${BASE_URL}/${currentData?.watermarked_preview_video}`}
                    controls
                    autoPlay
                    loop
                    muted
                    className="w-full max-h-[60vh] object-contain rounded-2xl shadow-2xl bg-black"
                  />
                ) : (
                  <div
                    onClick={() => setIsFullscreenOpen(true)}
                    className="relative cursor-zoom-in flex items-center justify-center"
                    title="Click to view full preview"
                  >
                    <img
                      src={getPreviewImage(currentData)}
                      alt={currentData?.title}
                      className="max-h-[62vh] sm:max-h-[68vh] w-auto max-w-full object-contain rounded-2xl drop-shadow-[0_15px_30px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:scale-[1.01]"
                    />
                  </div>
                )}
              </div>

              {/* Floating Fullscreen Trigger */}
              <button
                onClick={() => setIsFullscreenOpen(true)}
                className="absolute bottom-4 right-4 z-20 p-2.5 rounded-full bg-white/90 dark:bg-black/70 hover:bg-white dark:hover:bg-black backdrop-blur-md border border-gray-200 dark:border-white/20 text-gray-700 dark:text-white shadow-md transition-all hover:scale-105"
                title="Expand Fullscreen"
              >
                <Maximize2 size={16} />
              </button>
            </div>

            {/* Quick Available File Formats Bar (if multiple files exist) */}
            {filesToShow.length > 1 && (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#0c0c0c] border border-gray-200/80 dark:border-white/10 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Included Formats ({filesToShow.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {filesToShow.map((file) => (
                    <button
                      key={file.id}
                      onClick={(e) => handleSingleFileDownload(e, file)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-[#00D4FF]/10 text-gray-700 dark:text-gray-300 hover:text-[#0088b3] dark:hover:text-[#00D4FF] border border-gray-200 dark:border-white/10 hover:border-[#00D4FF]/40 text-xs font-semibold transition-colors group"
                    >
                      <Download size={13} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                      <span>{file.file_type?.toUpperCase() || file.file_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tags Cloud Card */}
            {currentData?.tags?.length > 0 && (
              <div className="rounded-2xl bg-white dark:bg-[#0c0c0c] border border-gray-200/80 dark:border-white/10 p-5 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                  <Tag size={13} className="text-[#0088b3] dark:text-[#00D4FF]" />
                  Related Keywords
                </h4>
                <div className="flex flex-wrap gap-2">
                  {currentData.tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => navigate(`/search?q=${encodeURIComponent(tag.name)}`)}
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-50 dark:bg-white/5 hover:bg-[#00D4FF]/10 text-gray-700 dark:text-gray-300 hover:text-[#0088b3] dark:hover:text-[#00D4FF] border border-gray-200/80 dark:border-white/10 hover:border-[#00D4FF]/40 transition-all"
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Title, CTA, License & Specifications (5 Cols) */}
          <aside className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">

            {/* Asset Header Info Card */}
            <div className="rounded-3xl bg-white dark:bg-[#0c0c0c] border border-gray-200/80 dark:border-white/10 p-6 shadow-xs space-y-4">

              {/* Verified Badge & Category */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center text-[#0088b3] dark:text-[#00D4FF] font-bold text-xs font-outfit">
                    DS
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-900 dark:text-white font-outfit flex items-center gap-1.5">
                      DayalStock Original
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </h5>
                    <p className="text-[11px] text-gray-400">Verified Quality Asset</p>
                  </div>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 capitalize">
                  {currentData?.content_type || 'Template'}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold font-outfit text-gray-900 dark:text-white leading-snug">
                {currentData?.title}
              </h1>

              {/* Primary CTA Button */}
              <div className="relative pt-2">
                <div className={`w-full h-15 rounded-2xl text-white font-bold text-base flex items-center shadow-lg transition-transform active:scale-[0.99] ${currentData?.is_premium
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/20"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/20"
                  }`}>
                  <button
                    onClick={handleDownloadZip}
                    className="flex-1 flex items-center justify-center gap-3 h-full px-5 hover:bg-black/10 transition-colors rounded-l-2xl font-outfit"
                  >
                    <Download size={20} className="shrink-0" />
                    <div className="text-left leading-tight">
                      <p className="text-base font-bold">{currentData?.is_premium ? "Pro Download" : "Free Download"}</p>
                      <span className="text-[11px] font-normal opacity-90 block">
                        {currentData?.is_premium ? "Full Source Package • Commercial" : "Instant High Quality Download"}
                      </span>
                    </div>
                  </button>

                  <div className="w-px h-8 bg-white/20"></div>

                  <button
                    onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                    className="h-full px-4 flex items-center justify-center hover:bg-black/10 transition-colors rounded-r-2xl"
                    title="Select format"
                  >
                    <ChevronDown
                      size={18}
                      className={`shrink-0 transition-transform duration-200 ${showDownloadOptions ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>

                {/* Download Options Dropdown Menu */}
                {showDownloadOptions && (
                  <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141414] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-2">
                      <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Choose Format</p>
                      {filesToShow.length > 0 ? (
                        filesToShow.map((file) => (
                          <a
                            key={file.id}
                            href={`${import.meta.env.VITE_IMG_KEY}/${file.file_url}`}
                            download={file.file_name}
                            onClick={(e) => handleSingleFileDownload(e, file)}
                            className="flex items-center justify-between rounded-xl px-3.5 py-2.5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="truncate text-xs font-semibold text-gray-900 dark:text-white group-hover:text-[#0088b3] dark:group-hover:text-[#00D4FF]">
                                {file.file_name}
                              </p>
                              <p className="text-[10px] uppercase text-gray-500 dark:text-gray-400">
                                {file.file_type} {file.width && file.height ? `• ${file.width}×${file.height}` : ''}
                              </p>
                            </div>
                            <Download size={16} className="shrink-0 text-emerald-500 group-hover:scale-110 transition-transform" />
                          </a>
                        ))
                      ) : (
                        <p className="px-3 py-3 text-xs text-gray-500">No individual files listed.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Exclusive Buyout Option */}
              {buyoutData?.exclusive_price ? (
                <button
                  onClick={() => setIsBuyoutModalOpen(true)}
                  disabled={buyoutData?.is_exclusive_sold}
                  className={`w-full h-12 border-2 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-2 font-outfit shadow-xs
                    ${buyoutData?.is_exclusive_sold
                      ? "border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-[#111] cursor-not-allowed"
                      : "border-orange-500/40 text-orange-600 dark:text-orange-500 hover:bg-orange-500/10 hover:border-orange-500"}`}
                >
                  <Crown size={16} className={buyoutData?.is_exclusive_sold ? "text-gray-400" : "text-orange-500"} />
                  <span>{buyoutData?.is_exclusive_sold ? "Already Sold (Exclusive)" : `Buy Exclusive Rights • $${buyoutData.exclusive_price}`}</span>
                </button>
              ) : null}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => {
                    if (!user) {
                      toast.error("Please login to save to collections.");
                      return;
                    }
                    setIsCollectionModalOpen(true);
                  }}
                  className="bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200/80 dark:border-white/10 rounded-xl h-11 flex items-center justify-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-all active:scale-95"
                >
                  <Grid2X2Plus size={16} className="text-[#0088b3] dark:text-[#00D4FF]" />
                  <span>Collection</span>
                </button>

                <button
                  onClick={handleShare}
                  className="bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200/80 dark:border-white/10 rounded-xl h-11 flex items-center justify-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-all active:scale-95"
                >
                  <Share2 size={16} className="text-purple-500" />
                  <span>Share</span>
                </button>
              </div>

              {/* License Row */}
              <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                  <span>{currentData?.is_premium ? "Commercial License Included" : "Standard Free License"}</span>
                </div>
                <button
                  onClick={() => setShowLicenseModal(true)}
                  className="text-orange-500 dark:text-orange-400 font-semibold hover:underline"
                >
                  What&apos;s This?
                </button>
              </div>

            </div>

            {/* Asset Technical Specifications Card */}
            <div className="rounded-3xl bg-white dark:bg-[#0c0c0c] border border-gray-200/80 dark:border-white/10 p-6 shadow-xs">
              <h3 className="text-xs font-bold font-outfit uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                <Layers size={14} className="text-[#0088b3] dark:text-[#00D4FF]" />
                Asset Information
              </h3>

              <div className="space-y-2.5 text-xs font-inter">
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-white/5">
                  <span className="text-gray-500 dark:text-gray-400">Content Type</span>
                  <span className="font-semibold text-gray-900 dark:text-white capitalize">{currentData?.content_type || 'Template'}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-white/5">
                  <span className="text-gray-500 dark:text-gray-400">Included Formats</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatList}</span>
                </div>

                {currentData?.width && currentData?.height && (
                  <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-white/5">
                    <span className="text-gray-500 dark:text-gray-400">Dimensions</span>                    <span className="font-semibold text-gray-900 dark:text-white">{currentData.width} × {currentData.height} px</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-white/5">
                  <span className="text-gray-500 dark:text-gray-400">Orientation</span>
                  <span className="font-semibold text-gray-900 dark:text-white capitalize">{currentData?.orientation || 'Vertical'}</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-500 dark:text-gray-400">Attribution</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{currentData?.is_premium ? "Not Required" : "Required for Free"}</span>
                </div>
              </div>
            </div>

          </aside>

        </div>

      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreenOpen && (
        <div
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsFullscreenOpen(false)}
        >
          <button
            onClick={() => setIsFullscreenOpen(false)}
            className="absolute top-6 right-6 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={24} />
          </button>
          <img
            src={getPreviewImage(currentData)}
            alt={currentData?.title}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Related Resources Section */}
      {relatedContents.length > 0 && (
        <div className="w-full  mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#0088b3] dark:text-[#00D4FF] font-outfit">Explore More</span>
              <h3 className="text-2xl font-bold font-outfit text-gray-900 dark:text-white mt-1">Similar Resources Across DayalStock</h3>
            </div>
            <Link
              to={`/${category || 'explore'}`}
              className="text-xs font-bold font-outfit text-[#0088b3] dark:text-[#00D4FF] hover:underline"
            >
              Browse All →
            </Link>
          </div>
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {relatedContents.map((item) => (
              <Link
                to={`/${category || item.content_type || 'images'}/${item.slug}`}
                key={item.id}
                className="group relative mb-4 block w-full overflow-hidden rounded-2xl bg-gray-100 dark:bg-[#111] border border-gray-200/80 dark:border-white/10 hover:shadow-lg transition-all duration-300"
              >
                <img
                  src={getPreviewImage(item)}
                  alt={item.title}
                  className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
                {item.is_premium ? (
                  <span className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow z-10">
                    PRO
                  </span>
                ) : (
                  <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow z-10">
                    FREE
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0 z-10">
                  <p className="text-xs font-semibold text-white truncate">
                    {item.title}
                  </p>
                </div>
              </Link>
            ))}
          </Masonry>
        </div>
      )}

      {currentData && (
        <SaveToCollectionModal
          isOpen={isCollectionModalOpen}
          onClose={() => setIsCollectionModalOpen(false)}
          contentId={currentData.id}
        />
      )}

      {/* Buyout Modal */}
      {isBuyoutModalOpen && buyoutData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Crown className="text-orange-500" size={24} />
                Exclusive Buyout
              </h3>
              <button
                onClick={() => setIsBuyoutModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-500 mb-6">
                You are about to purchase full exclusive rights for this asset. Once purchased, it will be removed from the platform.
              </p>

              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden mb-6">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-4 text-gray-500 font-medium">Content Name</td>
                      <td className="py-3 px-4 text-gray-800 font-bold truncate max-w-[200px]">{currentData?.title}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-4 text-gray-500 font-medium">License Type</td>
                      <td className="py-3 px-4 text-gray-800 font-semibold text-orange-500">100% Exclusive Ownership</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-4 text-gray-500 font-medium">Included Files</td>
                      <td className="py-3 px-4 text-gray-800">All Source Files</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4 text-gray-800 font-bold text-lg">Total Price</td>
                      <td className="py-4 px-4 text-gray-900 font-black text-xl">${buyoutData.exclusive_price}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <button
                disabled={isProcessingPayment}
                onClick={async () => {
                  if (!user) {
                    toast.error("Please login to purchase exclusive rights.");
                    return;
                  }

                  setIsProcessingPayment(true);
                  try {
                    const token = await user.getIdToken();
                    const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/subscriptions/create_checkout.php`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({ content_id: currentData.id })
                    });

                    const data = await res.json();

                    if (data.success && data.checkout_url) {
                      // Open Lemon Squeezy overlay programmatically
                      if (window.LemonSqueezy && window.LemonSqueezy.Url) {
                        window.LemonSqueezy.Url.Open(data.checkout_url);
                        setIsBuyoutModalOpen(false);
                      } else {
                        // Fallback to normal redirect
                        window.location.href = data.checkout_url;
                      }
                    } else {
                      toast.error(data.message || "Failed to create secure checkout session");
                    }
                  } catch (error) {
                    console.error(error);
                    toast.error("An error occurred during payment initialization.");
                  } finally {
                    setIsProcessingPayment(false);
                  }
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
              >
                {isProcessingPayment ? "Processing..." : "Proceed to Checkout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mock payment modal removed - using Lemon Squeezy directly */}

      {/* License Info Modal */}
      {showLicenseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col relative shadow-2xl animate-in zoom-in-95 duration-200 text-gray-900 dark:text-white">
            <div className="p-6 border-b border-gray-200 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-[#1a1a1a]">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-outfit">
                {currentData?.license_type === 'free' ? 'Free License Info' :
                  currentData?.license_type === 'editorial' ? 'Editorial License Info' :
                    'Pro Standard License Info'}
              </h2>
              <button onClick={() => setShowLicenseModal(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer">
                <X size={22} />
              </button>
            </div>
            <div className="p-6 space-y-6 text-sm">
              {currentData?.license_type === 'free' && (
                <>
                  <div>
                    <h3 className="text-[#0088b3] dark:text-[#00D4FF] font-bold mb-2">What you CAN do:</h3>
                    <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-sm list-disc pl-5">
                      <li>Use it for personal and commercial projects.</li>
                      <li>Modify or create derivative works.</li>
                      <li>Use it on websites, apps, print media, and social media.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-orange-500 dark:text-orange-400 font-bold mb-2">What you MUST do:</h3>
                    <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-sm list-disc pl-5">
                      <li><strong>Attribution Required:</strong> You must provide a link back to DayalStock or credit the author.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-red-500 dark:text-red-400 font-bold mb-2">What you CANNOT do:</h3>
                    <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-sm list-disc pl-5">
                      <li>Sell, resell, or distribute the original file as your own.</li>
                    </ul>
                  </div>
                </>
              )}

              {currentData?.license_type === 'premium' && (
                <>
                  <div>
                    <h3 className="text-[#0088b3] dark:text-[#00D4FF] font-bold mb-2">What you CAN do:</h3>
                    <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-sm list-disc pl-5">
                      <li>Use it for personal and commercial projects (unlimited uses).</li>
                      <li>Modify or create derivative works.</li>
                      <li>Use it on websites, apps, print media, and social media.</li>
                      <li className="text-emerald-600 dark:text-green-400 font-semibold list-none -ml-5 mt-2">✅ No Attribution Required.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-red-500 dark:text-red-400 font-bold mb-2">What you CANNOT do:</h3>
                    <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-sm list-disc pl-5">
                      <li>Sell, resell, or distribute the original file as a stock asset.</li>
                      <li>Share your Pro account or downloaded files with others.</li>
                    </ul>
                  </div>
                </>
              )}

              {currentData?.license_type === 'editorial' && (
                <>
                  <div>
                    <h3 className="text-[#0088b3] dark:text-[#00D4FF] font-bold mb-2">What you CAN do:</h3>
                    <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-sm list-disc pl-5">
                      <li>Use it for news articles, blogs, documentaries, and non-commercial publications.</li>
                      <li>Use it for educational purposes.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-red-500 dark:text-red-400 font-bold mb-2">What you CANNOT do:</h3>
                    <ul className="text-gray-600 dark:text-gray-300 space-y-1 text-sm list-disc pl-5">
                      <li><strong>No Commercial Use:</strong> You cannot use this for advertising, promotions, marketing, or selling products.</li>
                      <li>You cannot use this to endorse a brand or product.</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-white/5 flex justify-end">
              <button
                onClick={() => setShowLicenseModal(false)}
                className="px-6 py-2 bg-gray-900 dark:bg-white/10 hover:bg-gray-800 dark:hover:bg-white/20 text-white rounded-lg font-medium transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Download Feedback Toast & Particles */}
      <DownloadCelebration
        isVisible={showCelebration}
        assetTitle={currentData?.title}
        assetType={currentData?.content_type}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  );
};

export default SingleContentPage;
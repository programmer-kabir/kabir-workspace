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
  UserPlus,
  CheckCircle2,
  Tag,
  Crown,
  X,
} from "lucide-react";
import useContents from "../../utlis/Hooks/useContents";
import { getContentBySlug } from "../../api/api";
import { useQuery } from "@tanstack/react-query";
import useAuthor from "../../utlis/Hooks/useAuthor";
import useAuth from "../../utlis/Hooks/useAuth";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import SaveToCollectionModal from "../../components/Modals/SaveToCollectionModal";
import FollowButton from "../../components/FollowButton";
import Masonry from "react-masonry-css";
import DynamicSEO from "../../components/CMS/DynamicSEO";
import { saveToRecentlyViewed } from "../../utlis/recentActivity";

const BASE_URL = import.meta.env.VITE_IMG_KEY || "https://api.dayalstock.com";

const breakpointColumnsObj = {
  default: 6,
  1536: 5,
  1024: 4,
  768: 3,
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
  const { data: author = [] } = useAuthor();

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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const currentData = singleContentData || contents?.find((content) => content?.slug === slug);

  // Fetch buyout status
  const { data: buyoutData } = useQuery({
    queryKey: ["buyoutStatus", currentData?.id],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/contents_download/check_buyout_status.php?content_id=${currentData.id}`);
      const data = await res.json();
      return data?.success ? data.data : null;
    },
    enabled: !!currentData?.id
  });

  const currentAuthor = author.find(data => Number(data.id) === Number(currentData?.author_id));
  const authorResource = contents?.filter((content) => Number(content?.author_id) === Number(currentAuthor?.id))

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

  const moreFromAuthor = authorResource?.filter(item => item.id !== currentData?.id).slice(0, 12) || [];
  const relatedContents = contents?.filter(
    item => item.id !== currentData?.id && item.content_type === currentData?.content_type
  ).slice(0, 18) || [];



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
                "Content-Type": "application/json"
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

  const downloadFiles = allFiles.filter((file) => !file.is_main_file);

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
    //  else if (token) {
    //   toast.info("The download feature is currently under development. Please check back soon.")
    // }


    // 1. Check Download Limit API First
    try {
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/contents/check_download_limit.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
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
      };

      toast.info("Preparing your download...");

      const downloadUrl = `${import.meta.env.VITE_LOCALHOST_KEY}/contents_download/downloadContentZip.php?content_id=${currentData.id}&token=${token}&api_key=${import.meta.env.VITE_APP_SECRET}`;
      window.open(downloadUrl, "_blank");

    } catch (error) {
      console.error("Download failed:", error);
      toast.error("An error occurred while downloading.");
    }
  };

  // Helper: fetch a download endpoint and trigger browser download via blob.
  // If the backend returns an error, shows a toast instead of navigating away.
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
      // 1. Preflight limit check — shows toast on failure, stays on page
      const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/contents/check_download_limit.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
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

      // 2. Download — use fetch+blob so any backend error shows as a toast
      if (file.id === "preview-file") {
        toast.info("Starting preview download...");
        // Route through API server (has CORS) instead of fetching CDN URL directly
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
      <div className="min-h-screen flex items-center justify-center">
        Loading...
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
      "@type": "Person",
      "name": currentAuthor?.name || "DayalStock Contributor"
    },
    "creditText": currentAuthor?.name || "DayalStock Contributor",
    "copyrightNotice": currentAuthor?.name || "DayalStock",
    "name": currentData.title,
    "description": seoDescription
  };

  return (
    <div className="min-h-screen pt-24 bg-gray-50 dark:bg-[#050505] transition-colors">
      <DynamicSEO pageData={seoData} />
      <script type="application/ld+json">
        {JSON.stringify(jsonLdData)}
      </script>
      <div className="border-t border-gray-200 dark:border-white/10">
        <div className="w-full max-w-[1920px] mx-auto px-5 lg:px-10 py-10">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-10">
            {/* Left Side */}
            <div>
              <button
                onClick={() => window.history.back()}
                className="w-11 h-11 rounded-full bg-white dark:bg-white/10 shadow-sm border border-gray-200 dark:border-white/20 flex items-center justify-center text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/20 transition-colors mb-6"
              >
                <ArrowLeft size={20} />
              </button>

              <div className="flex justify-center">
                <div className="relative inline-block">
                  {currentData?.is_premium && (
                    <div className="absolute top-0 left-0 z-10 overflow-hidden w-20 h-20">
                      <div className="absolute top-[18px] -left-[26px] w-[110px] rotate-[-45deg] bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-bold text-center py-1">
                        Pro
                      </div>
                    </div>
                  )}

                  {currentData?.content_type === "video" ? (
                    <video
                      src={currentData?.watermarked_preview_video ? `${BASE_URL}/${currentData.watermarked_preview_video}` : `${BASE_URL}/${currentData?.watermarked_preview_video}`}
                      controls
                      autoPlay
                      loop
                      muted
                      className="w-full max-w-[890px] max-h-[650px] object-contain bg-[#f4f6f8]"
                    />
                  ) : (
                    <img
                      src={getPreviewImage(currentData)}
                      alt={currentData?.title}
                      className="w-full max-w-[890px] max-h-[650px] object-contain bg-gray-100 dark:bg-black rounded-lg"
                    />
                  )}
                </div>
              </div>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                {currentData?.title}
              </p>

              {/* Tags */}
              {currentData?.tags?.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Tag size={14} className="text-[#0088b3] dark:text-[#00D4FF]" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentData.tags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => navigate(`/search?q=${encodeURIComponent(tag.name)}`)}
                        className="text-xs font-medium px-3 py-1.5 rounded-full bg-white dark:bg-[#111] text-gray-700 dark:text-gray-300 hover:bg-[#00D4FF]/10 hover:text-[#0088b3] dark:hover:text-[#00D4FF] border border-gray-200 dark:border-white/10 hover:border-[#00D4FF]/30 transition-all duration-200 shadow-sm"
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Side */}
            <aside className="xl:pt-10">
              {/* Author */}
              <div className="flex items-center justify-between mb-6">
                <Link to={`/author/${currentAuthor?.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10">
                    <img
                      src={`${import.meta.env.VITE_IMG_KEY}/${currentAuthor?.avatar}`}
                      alt="author"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {currentAuthor?.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {authorResource?.length || 0} Resources
                    </p>
                  </div>
                </Link>

                <FollowButton authorId={currentAuthor?.id} variant="primary" className="!px-3 !py-1.5 !text-xs !flex-col !gap-1" />
              </div>

              {/* Download Button */}
              <div className="relative">
                <div className={`w-full h-[72px] rounded-lg text-white font-bold text-lg flex items-center ${currentData?.is_premium
                  ? "bg-gradient-to-r from-orange-500 to-orange-600"
                  : "bg-gradient-to-r from-emerald-500 to-green-600"
                  }`}>
                  <button
                    onClick={handleDownloadZip}
                    className="flex-1 flex items-center gap-3 h-full px-5 hover:bg-black/10 transition-colors rounded-l-lg"
                  >
                    <Download size={21} className="shrink-0" />
                    <div className="text-left leading-tight">
                      <p>{currentData?.is_premium ? "Pro Download" : "Free Download"}</p>
                      <span className="text-xs font-normal opacity-90">
                        {currentData?.is_premium ? "No Attribution Required" : "Free For Personal Use"}
                      </span>
                    </div>
                  </button>
                  <div className="w-px h-[60%] bg-white/30"></div>
                  <button
                    onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                    className="h-full px-4 flex items-center justify-center hover:bg-black/10 transition-colors rounded-r-lg"
                  >
                    <ChevronDown
                      size={18}
                      className={`shrink-0 transition-transform ${showDownloadOptions ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>

                {showDownloadOptions && (
                  <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                    {filesToShow.length > 0 ? (
                      filesToShow.map((file) => (
                        <a
                          key={file.id}
                          href={`${import.meta.env.VITE_IMG_KEY}/${file.file_url}`}
                          download={file.file_name}
                          onClick={(e) => handleSingleFileDownload(e, file)}
                          className="flex items-center justify-between border-b border-gray-200 dark:border-white/5 px-4 py-3 last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {file.file_name}
                            </p>

                            <p className="mt-0.5 text-xs uppercase text-gray-500 dark:text-gray-400">
                              {file.file_type}
                              {file.width && file.height
                                ? ` • ${file.width} × ${file.height}`
                                : ""}
                            </p>
                          </div>

                          <Download size={18} className="shrink-0 text-emerald-600" />
                        </a>
                      ))
                    ) : (
                      <p className="px-4 py-4 text-sm text-gray-500">
                        No downloadable file available.
                      </p>
                    )}
                  </div>
                )}
              </div>
              {buyoutData?.exclusive_price ? (
                <button
                  onClick={() => setIsBuyoutModalOpen(true)}
                  disabled={buyoutData?.is_exclusive_sold}
                  className={`w-full mt-4 h-14 border-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2
                    ${buyoutData?.is_exclusive_sold
                      ? "border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-[#111] cursor-not-allowed"
                      : "border-orange-500/50 text-orange-600 dark:text-orange-500 hover:bg-orange-500/10 hover:border-orange-500"}`}
                >
                  <Crown size={20} className={buyoutData?.is_exclusive_sold ? "text-gray-400" : "text-orange-500"} />
                  {buyoutData?.is_exclusive_sold ? "Already Sold" : "Exclusive Buyout"}
                </button>
              ) : null}

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button
                  onClick={() => {
                    if (!user) {
                      toast.error("Please login to save to collections.");
                      return;
                    }
                    setIsCollectionModalOpen(true);
                  }}
                  className="bg-white dark:bg-[#111] hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-200 dark:border-white/5 rounded-lg h-16 flex flex-col justify-center items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors shadow-sm"
                >
                  <Grid2X2Plus size={20} className="text-[#0088b3] dark:text-[#00D4FF]" />
                  Collection
                </button>

                <button className="bg-white dark:bg-[#111] hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-200 dark:border-white/5 rounded-lg h-16 flex flex-col justify-center items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors shadow-sm">
                  <Images size={20} className="text-purple-600 dark:text-purple-500" />
                  Similar
                </button>

                <button className="bg-white dark:bg-[#111] hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-200 dark:border-white/5 rounded-lg h-16 flex flex-col justify-center items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors shadow-sm">
                  <Share2 size={20} className="text-emerald-600 dark:text-emerald-500" />
                  Share
                </button>
              </div>

              <div className="border-t border-gray-200 dark:border-white/10 mt-4 pt-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle2 size={19} className="text-green-500" />
                  <span>
                    {currentData?.license_type === "free"
                      ? "Free License"
                      : "Pro Standard License"}
                  </span>
                  <button onClick={() => setShowLicenseModal(true)} className="text-orange-500 font-medium hover:underline">
                    What's This?
                  </button>
                </div>
              </div>

              {/* More Info */}
              <div className="mt-4 border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-[#111] shadow-sm">
                <button className="w-full px-4 py-4 flex justify-between items-center text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  More Info
                  <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
                </button>

                <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400 space-y-2 border-t border-gray-200 dark:border-white/5 pt-3">
                  <p>
                    <span className="font-semibold text-gray-900 dark:text-white">Type:</span>{" "}
                    {currentData?.content_type}
                  </p>

                  <p>
                    <span className="font-semibold text-gray-900 dark:text-white">Format:</span>{" "}
                    {[...new Set(
                      (currentData?.files || [])
                        .map(f => f.file_type?.toLowerCase())
                        .filter(Boolean)
                        .filter(type => type !== 'webp' && !type.includes('preview'))
                        .map(type => type.toUpperCase())
                    )].join(', ') || currentData?.file_type?.toUpperCase()}
                  </p>

                  <p>
                    <span className="font-semibold text-gray-900 dark:text-white">Size:</span>{" "}
                    {currentData?.width} × {currentData?.height}
                  </p>

                  <p>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Orientation:
                    </span>{" "}
                    {currentData?.orientation}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* More from Author Section */}
      {moreFromAuthor.length > 0 && (
        <div className="w-full max-w-[1920px] mx-auto px-5 lg:px-10 py-10 border-t border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">More Like This from the Same Contributor</h3>
            <Link to={`/author/${currentAuthor?.username}`} className="text-sm font-semibold text-[#0088b3] dark:text-[#00D4FF] hover:text-gray-900 dark:hover:text-white transition-colors">
              View all
            </Link>
          </div>
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {moreFromAuthor.map((item) => (
              <Link
                to={`/${category || item.content_type || 'images'}/${item.slug}`}
                key={item.id}
                className="group relative mb-4 block w-full overflow-hidden rounded-xl bg-gray-200 dark:bg-[#111] border border-gray-200 dark:border-white/10"
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
                  <p className="text-sm font-semibold text-white truncate">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-white/80 mt-1 uppercase">
                    {item.content_type}
                  </p>
                </div>
              </Link>
            ))}
          </Masonry>
        </div>
      )}

      {/* Related Resources Section */}
      {relatedContents.length > 0 && (
        <div className="w-full max-w-[1920px] mx-auto px-5 lg:px-10 py-10 border-t border-gray-200 dark:border-white/10">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Similar Images Across DayalStock</h3>
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
                className="group relative mb-4 block w-full overflow-hidden rounded-xl bg-gray-200 dark:bg-[#111] border border-gray-200 dark:border-white/10"
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
                  <p className="text-sm font-semibold text-white truncate">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-white/80 mt-1 uppercase">
                    {item.content_type}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]">
              <h2 className="text-xl font-bold text-white font-outfit">
                {currentData?.license_type === 'free' ? 'Free License Info' :
                  currentData?.license_type === 'editorial' ? 'Editorial License Info' :
                    'Pro Standard License Info'}
              </h2>
              <button onClick={() => setShowLicenseModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {currentData?.license_type === 'free' && (
                <>
                  <div>
                    <h3 className="text-[#00D4FF] font-bold mb-2">What you CAN do:</h3>
                    <ul className="text-gray-300 space-y-1 text-sm list-disc pl-5">
                      <li>Use it for personal and commercial projects.</li>
                      <li>Modify or create derivative works.</li>
                      <li>Use it on websites, apps, print media, and social media.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-orange-400 font-bold mb-2">What you MUST do:</h3>
                    <ul className="text-gray-300 space-y-1 text-sm list-disc pl-5">
                      <li><strong>Attribution Required:</strong> You must provide a link back to DayalStock or credit the author.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-red-400 font-bold mb-2">What you CANNOT do:</h3>
                    <ul className="text-gray-300 space-y-1 text-sm list-disc pl-5">
                      <li>Sell, resell, or distribute the original file as your own.</li>
                    </ul>
                  </div>
                </>
              )}

              {currentData?.license_type === 'premium' && (
                <>
                  <div>
                    <h3 className="text-[#00D4FF] font-bold mb-2">What you CAN do:</h3>
                    <ul className="text-gray-300 space-y-1 text-sm list-disc pl-5">
                      <li>Use it for personal and commercial projects (unlimited uses).</li>
                      <li>Modify or create derivative works.</li>
                      <li>Use it on websites, apps, print media, and social media.</li>
                      <li className="text-green-400 font-semibold list-none -ml-5 mt-2">✅ No Attribution Required.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-red-400 font-bold mb-2">What you CANNOT do:</h3>
                    <ul className="text-gray-300 space-y-1 text-sm list-disc pl-5">
                      <li>Sell, resell, or distribute the original file as a stock asset.</li>
                      <li>Share your Pro account or downloaded files with others.</li>
                    </ul>
                  </div>
                </>
              )}

              {currentData?.license_type === 'editorial' && (
                <>
                  <div>
                    <h3 className="text-[#00D4FF] font-bold mb-2">What you CAN do:</h3>
                    <ul className="text-gray-300 space-y-1 text-sm list-disc pl-5">
                      <li>Use it for news articles, blogs, documentaries, and non-commercial publications.</li>
                      <li>Use it for educational purposes.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-red-400 font-bold mb-2">What you CANNOT do:</h3>
                    <ul className="text-gray-300 space-y-1 text-sm list-disc pl-5">
                      <li><strong>No Commercial Use:</strong> You cannot use this for advertising, promotions, marketing, or selling products.</li>
                      <li>You cannot use this to endorse a brand or product.</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
            <div className="p-4 bg-[#1a1a1a] border-t border-white/5 flex justify-end">
              <button
                onClick={() => setShowLicenseModal(false)}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleContentPage;
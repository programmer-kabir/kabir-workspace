import { useParams, Link, Navigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-toastify";
import Masonry from "react-masonry-css";
import useAuthor from "../../utlis/Hooks/useAuthor";
import useContents from "../../utlis/Hooks/useContents";
import {
  Download,
  Eye,
  LayoutGrid,
  MapPin,
  Share2,
  Upload,
  UserCheck,
  Users,
  Search,
  ChevronDown,
  Globe
} from "lucide-react";
import FollowButton from "../../components/FollowButton";
import { useFollowStatus, useAuthorFollowers } from "../../utlis/Hooks/useFollow";

const getPreviewImage = (item) => {
  const src =
    item?.preview_600_url || item?.preview_1200_url || item?.watermarked_preview_image || item?.preview_image || item?.image_url;
  if (!src) return "/placeholder.jpg";
  if (src.startsWith("http")) return src;
  return `${import.meta.env.VITE_IMG_KEY}/${src}`;
};

const breakpointColumnsObj = {
  default: 6,
  1536: 5,
  1024: 4,
  768: 3,
  640: 2,
};

export default function AuthorPage() {
  const { username } = useParams();
  const { data: authors = [], isLoading: isAuthorLoading } = useAuthor();
  const { data: infiniteData, isLoading: isContentLoading } = useContents({ limit: 500 });
  const allContents = infiniteData?.pages?.flatMap((page) => page.data) ?? [];

  const currentAuthor = authors.find((a) => a.username === username);
  console.log(authors)
  const { data: followStatus } = useFollowStatus(currentAuthor?.id);
  const { data: followersData, isLoading: isFollowersLoading } = useAuthorFollowers(currentAuthor?.id);

  const [activeTab, setActiveTab] = useState("uploads");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("Most Popular");
  const [contentType, setContentType] = useState("All");
  const [licenseType, setLicenseType] = useState("All");

  const isLoading = isAuthorLoading || isContentLoading;

  const authorContents = allContents.filter(
    (c) => Number(c.author_id) === Number(currentAuthor?.id)
  );

  const filteredContents = (() => {
    let result = authorContents;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) => c.title?.toLowerCase().includes(q) || c.tags?.some(t => t.name.toLowerCase().includes(q))
      );
    }

    if (contentType !== "All") {
      result = result.filter(
        (c) => c.content_type?.toLowerCase() === contentType.toLowerCase()
      );
    }
    if (licenseType !== "All") {
      const isPrem = licenseType === "Premium";
      result = result.filter((c) => (c.is_premium ? true : false) === isPrem);
    }
    if (sortOrder === "Most Popular") {
      result.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    } else {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return result;
  })();

  const handleShare = () => {
    const shareUrl = `https://dayalstock.com/author/${currentAuthor?.username}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Author profile link copied!");
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-[#111] flex items-center justify-center text-gray-900 dark:text-white font-semibold">Loading author profile...</div>;
  }

  if (!currentAuthor) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111] pt-16 transition-colors duration-300">
      {/* Cover Photo Banner */}
      <div className="w-full h-52 sm:h-64 lg:h-72 relative overflow-hidden bg-gray-200 dark:bg-gray-900 border-b border-gray-200 dark:border-white/5">
        <img
          src={
            currentAuthor?.cover_photo || currentAuthor?.cover
              ? (currentAuthor.cover_photo || currentAuthor.cover).startsWith('http')
                ? (currentAuthor.cover_photo || currentAuthor.cover)
                : `${import.meta.env.VITE_IMG_KEY}/${currentAuthor.cover_photo || currentAuthor.cover}`
              : "https://images.unsplash.com/photo-1557683316-973673baf926?w=1600"
          }
          alt={`${currentAuthor?.name} cover`}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
      </div>

      {/* Header Profile Section */}
      <div className="max-w-[1500px] mx-auto px-5 lg:px-10 relative z-10 pb-8">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 -mt-16 md:-mt-20 mb-2">
          {/* Avatar */}
          <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-[6px] border-gray-50 dark:border-[#111] shadow-2xl shrink-0 bg-gray-200 dark:bg-gray-800 relative z-20">
            <img
              src={`${import.meta.env.VITE_IMG_KEY}/${currentAuthor?.photo}`}
              alt={currentAuthor?.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left pt-2 md:pt-14">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl md:text-4xl font-outfit font-bold text-gray-900 dark:text-white">{currentAuthor?.name}</h1>
                {currentAuthor?.website && (
                  <a
                    href={currentAuthor.website.startsWith('http') ? currentAuthor.website : `https://${currentAuthor.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-500 transition-colors mt-1"
                    title="Visit Website"
                  >
                    <Globe size={22} />
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <FollowButton authorId={currentAuthor?.id} className="rounded-lg" />
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-semibold transition-colors shadow-sm"
                >
                  <Share2 size={16} /> Share
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-gray-600 dark:text-gray-400 font-medium">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                <span>{currentAuthor?.country || "N/A"}</span> {/* Mock location */}
              </div>
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gray-400" />
                <span>{followStatus?.followers_count || 0} Followers</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-gray-400" />
                <span>15M</span> {/* Mock views */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1500px] mx-auto px-5 lg:px-10">
          <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("uploads")}
              className={`flex shrink-0 items-center gap-2 py-4 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'uploads' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <Upload size={18} />
              Uploads ({authorContents.length.toLocaleString()})
            </button>
            <button
              onClick={() => setActiveTab("collections")}
              className={`flex shrink-0 items-center gap-2 py-4 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'collections' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <LayoutGrid size={18} />
              Collections (0)
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className={`flex shrink-0 items-center gap-2 py-4 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'following' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <UserCheck size={18} />
              Following (0)
            </button>
            <button
              onClick={() => setActiveTab("followers")}
              className={`flex shrink-0 items-center gap-2 py-4 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'followers' ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <Users size={18} />
              Followers ({followStatus?.followers_count || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 py-4 transition-colors">
        <div className="max-w-[1500px] mx-auto px-5 lg:px-10">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="flex-1 min-w-[250px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search this contributor..."
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>

            {/* Sort Select */}
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="h-11 min-w-[150px] appearance-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 pr-10 text-sm font-medium text-gray-900 dark:text-white outline-none hover:border-gray-400 dark:hover:border-gray-600 cursor-pointer"
              >
                <option>Most Popular</option>
                <option>Newest</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
            </div>

            {/* Content Type Select */}
            <div className="relative">
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="h-11 min-w-[150px] appearance-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 pr-10 text-sm font-medium text-gray-900 dark:text-white outline-none hover:border-gray-400 dark:hover:border-gray-600 cursor-pointer"
              >
                <option value="All">Content Type: All</option>
                <option value="vector">Vector</option>
                <option value="photo">Photo</option>
                <option value="video">Video</option>
                <option value="png">PNG</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
            </div>

            {/* License Type Select */}
            <div className="relative">
              <select
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value)}
                className="h-11 min-w-[150px] appearance-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 pr-10 text-sm font-medium text-gray-900 dark:text-white outline-none hover:border-gray-400 dark:hover:border-gray-600 cursor-pointer"
              >
                <option value="All">License Type: All</option>
                <option value="Free">Free</option>
                <option value="Premium">Premium</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-[1500px] mx-auto px-5 lg:px-10 py-10">
        {activeTab === 'uploads' && (
          <>
            {filteredContents.length > 0 ? (
              <Masonry
                breakpointCols={breakpointColumnsObj}
                className="my-masonry-grid"
                columnClassName="my-masonry-grid_column"
              >
                {filteredContents.map((item) => (
                  <Link
                    to={`/${item.content_type || 'images'}/${item.slug}`}
                    key={item.id}
                    className="group relative mb-4 block w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"                  >
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
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Search size={32} className="text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No content found</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1 max-w-sm">
                  We couldn't find any resources matching your current filters. Try clearing them to see more.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'collections' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <LayoutGrid size={48} className="text-gray-500 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No collections yet</h3>
          </div>
        )}

        {activeTab === 'following' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <UserCheck size={48} className="text-gray-500 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Not following anyone</h3>
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="py-8">
            {isFollowersLoading ? (
              <div className="flex justify-center"><span className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></span></div>
            ) : followersData?.followers?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {followersData.followers.map(follower => (
                  <div key={follower.user_id} className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    {follower.photo ? (
                      <img 
                        src={follower.photo.startsWith('http') ? follower.photo : `${import.meta.env.VITE_IMG_KEY}/${follower.photo}`} 
                        alt={follower.name} 
                        className="w-12 h-12 rounded-full object-cover bg-gray-100 dark:bg-gray-700 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-orange-900/50 text-orange-500 flex items-center justify-center font-bold text-lg shrink-0">
                        {follower.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{follower.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Since {new Date(follower.followed_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Users size={48} className="text-gray-500 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No followers yet</h3>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

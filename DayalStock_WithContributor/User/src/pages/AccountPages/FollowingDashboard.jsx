import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, UserCheck } from "lucide-react";
import { useFollowingList } from "../../utlis/Hooks/useFollow";
import FollowButton from "../../components/FollowButton";

const BASE_URL = import.meta.env.VITE_IMG_KEY || "https://api.dayalstock.com";

export default function FollowingDashboard() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useFollowingList(page, search);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const authors = data?.data || [];
console.log(authors)
  return (
    <div className="bg-transparent py-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-outfit">Following</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage creators you follow</p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search authors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-xl focus:outline-none focus:border-[#0088b3]/50 dark:focus:border-[#00D4FF]/50 transition-all text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
        </form>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl p-5 h-48"></div>
          ))}
        </div>
      ) : authors.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-2xl">
          <UserCheck className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 font-outfit">
            {search ? "No creators found" : "You aren't following any creators yet"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto mb-6">
            {search
              ? "Try adjusting your search terms."
              : "Discover amazing creators and follow them to see their latest resources."}
          </p>
          {!search && (
            <Link to="/authors" className="px-6 py-2.5 bg-[#00D4FF] text-[#050505] rounded-full font-semibold hover:bg-[#33DEFF] transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)] inline-block">
              Explore Creators
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {authors.map((author) => (
            <div key={author.id} className="group relative bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 hover:border-[#0088b3]/30 dark:hover:border-[#00D4FF]/30 hover:shadow-[0_0_20px_rgba(0,136,179,0.1)] dark:hover:shadow-[0_0_20px_rgba(0,212,255,0.1)] rounded-2xl p-5 flex flex-col items-center text-center transition-all shadow-sm">
              <Link to={`/author/${author.username}`} className="mb-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-white/10 mx-auto group-hover:scale-105 transition-transform">
                  <img
                    src={`${BASE_URL}/${author?.photo}`}
                    alt={author.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>

              <Link to={`/author/${author.username}`} className="font-bold text-gray-900 dark:text-white font-outfit text-[16px] hover:text-[#0088b3] dark:hover:text-[#00D4FF] truncate w-full mb-1 transition-colors">
                {author.name}
              </Link>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                @{author.username}
              </p>

              <div className="flex gap-4 mb-5 text-sm font-medium text-gray-600 dark:text-gray-400">
                <div>
                  <span className="block text-gray-900 dark:text-gray-200 font-bold">{author.followers_count}</span>
                  <span className="text-[12px] text-gray-500">Followers</span>
                </div>
                <div>
                  <span className="block text-gray-900 dark:text-gray-200 font-bold">{author.content_count}</span>
                  <span className="text-[12px] text-gray-500">Resources</span>
                </div>
              </div>

              <FollowButton authorId={author.id} variant="outline" className="w-full mt-auto" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

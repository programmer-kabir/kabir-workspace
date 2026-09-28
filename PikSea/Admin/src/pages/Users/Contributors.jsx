import { useState } from "react";
import { Link } from "react-router-dom";
import useAuthors from "../../utils/Hooks/useAuthors";
import DayalLoader from "../../components/Common/DayalLoader";
import {
  Search,
  Download,
  Image as ImageIcon,
  Clock,
  ExternalLink,
  Mail,
  Award,
} from "lucide-react";

const IMG_BASE = import.meta.env.VITE_IMG_KEY || "https://api.dayalstock.com";

const getInitials = (name) => {
  if (!name) return "C";
  return name.charAt(0).toUpperCase();
};

const Contributors = () => {
  const { data: authors, isLoading, isError } = useAuthors();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAuthors = authors?.filter((author) =>
    (author.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (author.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (author.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8 pb-10">
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 bg-[#12121E] border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 blur-[120px] pointer-events-none" />
        
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 tracking-wide">
              Contributors Hub
            </h1>
            <p className="mt-2 text-base text-gray-400 max-w-lg">
              Manage and discover the creative minds behind DayalStock's amazing assets. 
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white/5 border border-white/10 px-6 py-3 min-w-[120px]">
              <span className="text-2xl font-bold text-white">{authors?.length || 0}</span>
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider mt-1">Creators</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white/5 border border-white/10 px-6 py-3 min-w-[120px]">
              <span className="text-2xl font-bold text-white">
                {authors?.reduce((sum, a) => sum + (a.published_files || 0), 0) || 0}
              </span>
              <span className="text-xs font-medium text-blue-400 uppercase tracking-wider mt-1">Assets</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative w-full max-w-2xl mx-auto">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search creators by name, username, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-base text-white placeholder-gray-500 outline-none transition-all focus:border-emerald-500/50 focus:bg-white/10 focus:ring-4 focus:ring-emerald-500/10 shadow-lg"
        />
      </div>

      {/* STATES */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <DayalLoader text="Loading amazing creators..." />
        </div>
      )}
      
      {isError && (
        <div className="text-center py-20 text-red-400 bg-red-500/5 rounded-2xl border border-red-500/10">
          Failed to load contributors. Please try again.
        </div>
      )}

      {!isLoading && !isError && filteredAuthors.length === 0 && (
        <div className="text-center py-20">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-gray-500 mb-6">
            <Search size={32} />
          </div>
          <p className="text-xl font-bold text-white">No creators found</p>
          <p className="text-gray-500 mt-2">Try adjusting your search terms.</p>
        </div>
      )}

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {!isLoading && !isError && filteredAuthors.map((author) => (
          <div 
            key={author.id} 
            className="group relative flex flex-col rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6 hover:border-emerald-500/30 transition-all duration-300 overflow-hidden"
          >
            {/* Glow on Hover */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Level Badge */}
            {author.level && (
              <div 
                className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg"
                style={{ 
                  backgroundColor: `${author.level.badge_color}15`, 
                  color: author.level.badge_color,
                  border: `1px solid ${author.level.badge_color}30`
                }}
              >
                <Award size={14} />
                {author.level.name}
              </div>
            )}

            <Link to={`/dashboard/author/${author.username || author.id}`} className="relative flex flex-col items-center mt-6 group/author">
              <div className="relative h-24 w-24 rounded-full p-1 bg-gradient-to-br from-emerald-400 to-cyan-400 shadow-xl shadow-emerald-500/20">
                <div className="h-full w-full rounded-full overflow-hidden bg-[#12121E] border-[3px] border-[#12121E]">
                  {author.avatar ? (
                    <>
                      <img
                        src={author.avatar.startsWith('http') ? author.avatar : `${IMG_BASE}${author.avatar.startsWith('/') ? '' : '/'}${author.avatar}`}
                        alt={author.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          if (e.target.nextElementSibling) {
                            e.target.nextElementSibling.style.display = 'flex';
                          }
                        }}
                      />
                      <div className="h-full w-full items-center justify-center text-emerald-400 text-2xl font-black bg-[#1a1a2e]" style={{ display: 'none' }}>
                        {getInitials(author.name)}
                      </div>
                    </>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-emerald-400 text-2xl font-black bg-[#1a1a2e]">
                      {getInitials(author.name)}
                    </div>
                  )}
                </div>
              </div>
              
              <h3 className="mt-4 text-xl font-bold text-white group-hover/author:text-emerald-300 transition-colors text-center">{author.name}</h3>
              <p className="text-sm font-medium text-emerald-400/80">@{author.username}</p>
            </Link>

            <div className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-3 relative">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-500"><ImageIcon size={16}/> Assets</span>
                <span className="font-bold text-white">{author.published_files}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-500"><Download size={16}/> Downloads</span>
                <span className="font-bold text-white">{author.total_downloads}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-500"><Clock size={16}/> Pending</span>
                <span className="font-bold text-amber-400">{author.pending_files}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 relative">
              <a 
                href={`mailto:${author.email}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-sm font-semibold border border-white/5"
              >
                <Mail size={16} /> Contact
              </a>
              {author.website && (
                <a 
                  href={author.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-500/20"
                >
                  <ExternalLink size={18} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Contributors;

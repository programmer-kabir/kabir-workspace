import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecentSearches } from "../../utlis/recentActivity";
import { Search, Clock, Trash2, ArrowUpRight } from "lucide-react";

const RecentSearches = () => {
  const [searches, setSearches] = useState([]);

  useEffect(() => {
    setSearches(getRecentSearches());
  }, []);

  const handleClear = () => {
    localStorage.removeItem("piksea_recent_searches");
    localStorage.removeItem("recent_searches");
    setSearches([]);
  };

  if (searches.length === 0) return null;

  return (
    <section className="w-full bg-white dark:bg-[#05070D] py-6 border-b border-gray-100 dark:border-white/5 transition-colors duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Left Title & Chips */}
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0 mr-1">
              <Clock size={14} className="text-[#00D4FF]" />
              <span>Recent Searches:</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {searches.map((query, idx) => (
                <Link
                  key={idx}
                  to={`/search?q=${encodeURIComponent(query)}`}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-[#00D4FF] hover:text-[#00D4FF] hover:bg-white dark:hover:bg-[#0D111C] shadow-xs transition-all group"
                >
                  <Search size={11} className="text-gray-400 group-hover:text-[#00D4FF] transition-colors" />
                  <span>{query}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Clear Action */}
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-red-400 transition-colors shrink-0 cursor-pointer self-end sm:self-auto"
          >
            <Trash2 size={12} />
            <span>Clear History</span>
          </button>

        </div>
      </div>
    </section>
  );
};

export default RecentSearches;

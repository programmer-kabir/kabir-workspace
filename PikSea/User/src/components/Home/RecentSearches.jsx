import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecentSearches } from "../../utlis/recentActivity";
import { Search } from "lucide-react";

const RecentSearches = () => {
  const [searches, setSearches] = useState([]);

  useEffect(() => {
    setSearches(getRecentSearches());
  }, []);

  if (searches.length === 0) return null;

  return (
    <section className="bg-white dark:bg-[#050505] py-8 relative overflow-hidden border-t border-gray-200 dark:border-white/5 transition-colors duration-300">
      <div className="mx-auto  px-4 lg:px-8 relative z-10">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl md:text-2xl font-outfit font-bold text-gray-900 dark:text-white tracking-tight">
            Your Recent Searches
          </h2>
          <div className="flex flex-wrap gap-3 mt-2">
            {searches.map((query, idx) => (
              <Link
                key={idx}
                to={`/search?q=${encodeURIComponent(query)}`}
                className="flex items-center justify-center rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111] px-5 py-2 text-sm font-inter text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-100 dark:hover:bg-white/10 hover:border-[#00D4FF]/40 hover:text-gray-900 dark:hover:text-white shadow-sm"
              >
                {query}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecentSearches;

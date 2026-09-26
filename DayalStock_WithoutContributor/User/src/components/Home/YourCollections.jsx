import { Link } from "react-router-dom";
import useAuth from "../../utlis/Hooks/useAuth";
import { useUserCollections } from "../../utlis/Hooks/useCollections";
import { Folder } from "lucide-react";

const YourCollections = () => {
  const { user } = useAuth();

  const { data: rawCollections = [], isLoading } = useUserCollections();

  if (!user) return null;

  const collections = Array.isArray(rawCollections)
    ? rawCollections
    : (rawCollections?.data || []);

  if (collections.length === 0 && !isLoading) return null;

  return (
    <section className="bg-white dark:bg-[#0A0A0A] py-12 relative overflow-hidden border-t border-gray-200 dark:border-white/5 transition-colors duration-300">
      <div className="mx-auto  px-4 lg:px-8 relative z-10">
        <div className="mb-12 text-center relative">
          <span className="inline-block rounded-full border border-[#00D4FF]/30 bg-[#00D4FF]/10 px-4 py-1.5 text-xs font-outfit font-bold text-[#00D4FF] mb-4 uppercase tracking-widest">
            Organize & Create
          </span>
          <h2 className="text-3xl md:text-4xl font-outfit font-bold text-gray-900 dark:text-white tracking-tight">
            Your Collections
          </h2>
          <p className="mt-4 text-sm md:text-base font-inter text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Quickly access the assets you've gathered for your current and upcoming projects.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              to={`/accounts?tab=collections`}
              className="inline-flex items-center gap-2 text-sm font-inter text-[#00D4FF] hover:text-[#33DEFF] hover:underline transition-colors"
            >
              View all collections →
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse border border-gray-200 dark:border-white/10" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {collections.slice(0, 8).map((collection) => (
              <Link
                key={collection.id}
                to={`/collection/${collection.id}`}
                className="group flex items-center gap-4 rounded-xl bg-gray-50 dark:bg-[#111] p-4 border border-gray-200 dark:border-white/5 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:border-[#00D4FF]/30 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-200 dark:bg-white/5 text-gray-600 dark:text-gray-400 group-hover:text-[#00D4FF] group-hover:bg-[#00D4FF]/10 transition-colors">
                  <Folder size={24} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-gray-900 dark:text-white font-outfit font-semibold truncate">
                    {collection.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-500 font-inter mt-1">
                    {collection.item_count || 0} items
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default YourCollections;

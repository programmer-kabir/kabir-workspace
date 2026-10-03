import { useParams, Navigate, Link } from "react-router-dom";
import useCategories from "../../utlis/Hooks/useCategories";
import SkeletonGrid from "../Skeleton/SkeletonGrid";
import { FolderTree, Sparkles } from "lucide-react";

export default function CategoryContent() {
  const { category } = useParams();

  // Fetch only categories where parent_id is NULL from API
  const {
    data: categories = [],
    isLoading: isMainLoading,
  } = useCategories();

  const currentCategory = categories.find(
    (item) => item.slug === category && (item.parent_id === null || item.parent_id === 0 || item.parent_id === "0")
  );

  // Fetch subcategories when current category id is available
  const {
    data: subCategories = [],
    isLoading: isSubLoading,
  } = useCategories(currentCategory?.id);

  // If main category is still loading
  if (isMainLoading) {
    return <SkeletonGrid count={12} />;
  }

  // If slug is invalid, redirect to 404
  if (!currentCategory) {
    return <Navigate to="/404" replace />;
  }

  const BASE_URL = import.meta.env.VITE_IMG_KEY || "https://api.piksea.com";

  return (
    <section className="max-w-[1400px] mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4FF]/10 text-[#00D4FF] text-xs font-bold mb-3 border border-[#00D4FF]/20">
          <Sparkles size={14} />
          <span>Curated Photo Collection</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Explore {currentCategory.name}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl text-sm md:text-base">
          Discover thousands of royalty-free, high-resolution stock photos curated under {currentCategory.name}.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {isSubLoading ? (
          <SkeletonGrid count={10} />
        ) : subCategories.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-500 bg-gray-50 dark:bg-white/[0.02] rounded-2xl border border-gray-200 dark:border-white/5">
            <FolderTree size={36} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold">No subcategories found</p>
            <p className="text-xs text-gray-400 mt-1">Browse all {currentCategory.name} photos in search</p>
          </div>
        ) : (
          subCategories.map((item) => {
            const imgSrc = item.image
              ? (item.image.startsWith("http") ? item.image : `${BASE_URL}/${item.image}`)
              : null;

            return (
              <Link
                key={item.id}
                to={`/${currentCategory.slug}/${item.slug}`}
                className="group relative h-48 md:h-56 overflow-hidden rounded-2xl bg-gradient-to-br from-[#12121e] to-[#1a1a2e] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-[#00D4FF]/50 transition-all duration-300"
              >
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-cyan-950/40 to-blue-950/40 group-hover:scale-105 transition-transform duration-500" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity" />

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="font-bold text-base md:text-lg group-hover:text-[#00D4FF] transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-[11px] text-gray-300 font-medium mt-0.5">
                    View Photos →
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
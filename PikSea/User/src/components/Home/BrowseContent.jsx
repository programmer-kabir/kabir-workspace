import { Link } from "react-router-dom";
import { Sparkles, ArrowUpRight, Compass } from "lucide-react";
import ScrollReveal from "../FramerMotion/ScrollReveal";
import useCategories from "../../utlis/Hooks/useCategories";
import SkeletonGrid from "../Skeleton/SkeletonGrid";

// High-end curated representative photos for parent categories
const categoryPhotos = {
  people: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
  nature: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
  architecture: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
  travel: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
  "food-drink": "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80",
  "business-tech": "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80",
  wallpapers: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
};

const BrowseContent = () => {
  const { data: categories = [], isLoading } = useCategories();

  // Only parent categories (parent_id is null or 0)
  const mainCategories = categories.filter(
    (item) => item.parent_id === null || item.parent_id === "NULL" || item.parent_id === 0 || item.parent_id === "0"
  );

  return (
    <ScrollReveal>
      <section className="bg-gray-50 dark:bg-[#06080F] py-24 relative overflow-hidden transition-colors duration-300">
        
        {/* Ambient Subtle Backlighting */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-[#00D4FF]/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-12 z-10">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-14 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/20 text-[#00D4FF] text-xs font-bold uppercase tracking-widest mb-3">
                <Compass size={14} />
                <span>Editorial Curations</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                Explore Photographic Realms
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mt-2 max-w-xl">
                Dive into carefully curated visual themes, from high-fashion studio portraits to untouched alpine wilderness.
              </p>
            </div>

            <Link
              to="/search"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-[#00D4FF] dark:hover:text-[#00D4FF] transition-colors shrink-0 group"
            >
              <span>Explore All 40+ Topics</span>
              <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              <SkeletonGrid count={8} />
            ) : (
              mainCategories.map((item, index) => {
                const imgSource =
                  categoryPhotos[item.slug] ||
                  (item.image ? `${import.meta.env.VITE_IMG_KEY}/${item.image}` : "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80");

                // Get subcategories count
                const subCount = categories.filter(c => String(c.parent_id) === String(item.id)).length;

                return (
                  <Link
                    key={item.id}
                    to={`/${item.slug}`}
                    className="group relative block rounded-3xl overflow-hidden bg-white dark:bg-[#0D111C] border border-gray-200 dark:border-white/10 hover:border-[#00D4FF]/50 shadow-sm hover:shadow-2xl hover:shadow-cyan-950/20 transition-all duration-500 hover:-translate-y-1.5"
                  >
                    {/* Visual Photo Box */}
                    <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-gray-900">
                      <img
                        loading="lazy"
                        src={imgSource}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-0.5 opacity-90 group-hover:opacity-100"
                      />
                      
                      {/* Gradient Vignette */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

                      {/* Top Index & Topics Pill */}
                      <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
                        <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-[10px] font-bold uppercase tracking-wider">
                          0{index + 1}
                        </span>
                        {subCount > 0 && (
                          <span className="px-2.5 py-1 rounded-full bg-[#00D4FF]/20 backdrop-blur-md border border-[#00D4FF]/30 text-[#00D4FF] text-[10px] font-bold">
                            {subCount} Topics
                          </span>
                        )}
                      </div>

                      {/* Bottom Title & Action */}
                      <div className="absolute inset-x-0 bottom-0 p-6 flex items-end justify-between z-10">
                        <div>
                          <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest block mb-1">
                            Collection
                          </span>
                          <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-[#00D4FF] transition-colors leading-tight">
                            {item.name}
                          </h3>
                        </div>

                        {/* Floating Arrow Badge */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white group-hover:bg-[#00D4FF] group-hover:text-black group-hover:border-transparent transition-all duration-300">
                          <ArrowUpRight size={18} />
                        </div>
                      </div>

                    </div>
                  </Link>
                );
              })
            )}
          </div>

        </div>
      </section>
    </ScrollReveal>
  );
};

export default BrowseContent;
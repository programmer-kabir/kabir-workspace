import ScrollReveal from "../FramerMotion/ScrollReveal";
import { Link, useLocation } from "react-router-dom";
import useCategories from "../../utlis/Hooks/useCategories";
import SkeletonGrid from "../Skeleton/SkeletonGrid";

const BrowseContent = () => {
  const location = useLocation();

  const {
    data: categories = [],
    isLoading,
  } = useCategories();

  // Only those with parent_id NULL
  const mainCategories = categories.filter(
    (item) => item.parent_id === null || item.parent_id === "NULL"
  );

  return (
    <ScrollReveal>
    <section className="bg-white dark:bg-[#0A0A0A] py-20 relative overflow-hidden transition-colors duration-300">
      {/* Decorative Glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#00D4FF]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-[1600px] px-4 lg:px-8 z-10">
        <div className="flex flex-col items-center mb-12">
          <h2 className="text-3xl md:text-5xl font-outfit font-bold text-gray-900 dark:text-white tracking-tight text-center">
            Explore by Category
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-[#00D4FF] to-transparent mt-4 rounded-full" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {isLoading ? (
            <SkeletonGrid count={12} />
          ) : (
            mainCategories.map((item) => {
              const isActive = location.pathname === `/${item?.slug}`;

              return (
                <Link
                  key={item?.id}
                  to={`/${item?.slug}`}
                  className="group cursor-pointer magnetic-hover block"
                >
                  <div
                    className={`relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-white/5 transition-all duration-300 ${
                      isActive
                        ? "border-[#00D4FF] shadow-[0_0_20px_rgba(0,212,255,0.2)]"
                        : "group-hover:border-[#00D4FF]/30 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                    }`}
                  >
                    <img
                      src={`${import.meta.env.VITE_IMG_KEY}/${item.image}`}
                      alt={item?.name}
                      className="h-44 w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 dark:from-[#050505] via-black/20 dark:via-[#050505]/40 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
                    
                    <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col items-center justify-end">
                      <h3 className="text-center font-outfit font-semibold tracking-wide text-white md:text-lg group-hover:text-[#00D4FF] transition-colors drop-shadow-md">
                        {item?.name}
                      </h3>
                      <span className="text-[11px] uppercase tracking-widest text-gray-200 dark:text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Explore
                      </span>
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
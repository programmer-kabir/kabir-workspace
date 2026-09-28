import { useParams, Navigate, Link } from "react-router-dom";
import useCategories from "../../utlis/Hooks/useCategories";
import SkeletonGrid from "../Skeleton/SkeletonGrid";


const categoryData = {
  "free-vectors": {
    title: "Popular Vector Categories",
    description: "Discover millions of vector graphics",
  },

  "free-photos": {
    title: "Popular Photos Categories",
    description: "Discover high quality photos",
  },

  "free-videos": {
    title: "Popular Videos Categories",
    description: "Discover stock videos",
  },

  "free-png": {
    title: "Popular PNGs Categories",
    description: "Discover transparent PNG assets",
  },
  "motion-graphics": {
    title: "Popular Motion Graphics Categories",
    description: "Discover motion graphics assets",
  },
};

export default function CategoryContent() {
  const { category } = useParams();

  // Fetch only categories where parent_id is NULL from API
  const {
    data: categories = [],
    isLoading: isMainLoading,
  } = useCategories();

  const currentCategory = categories.find(
    (item) => item.slug === category && item.parent_id === null
  );

  // Fetch subcategories when current category id is available
  const {
    data: subCategories = [],
    isLoading: isSubLoading,
  } = useCategories(currentCategory?.id);

  const data = categoryData[category];

  // If main category is still loading
  if (isMainLoading) {
    return <SkeletonGrid count={12} />;
  }

  // If slug is invalid, redirect to 404
  if (!currentCategory) {
    return <Navigate to="/404" replace />;
  }

  return (
    <section className="max-w-[1400px] mx-auto px-4 py-12">
      <h2 className="text-4xl font-bold mb-3">
        {data?.title || `Popular ${currentCategory.name} Categories`}
      </h2>

      <p className="text-gray-600 mb-8">
        {data?.description || `Discover ${currentCategory.name} assets`}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {isSubLoading ? (
          <SkeletonGrid count={12} />
        ) : (
          subCategories.map((item, index) => {
            const largeCards = [0, 10, 20, 29];

            return (
              <Link
                key={item.id}
                to={`/${currentCategory.slug}/${item.slug}`}
                className={`relative overflow-hidden rounded-xl group ${largeCards.includes(index)
                    ? "col-span-2 row-span-2"
                    : "col-span-1 row-span-1"
                  }`}
              >
                <img
                  src={`${import.meta.env.VITE_IMG_KEY}/${item.image}`}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                <div className="absolute bottom-3 left-3 text-white">
                  <h3 className="font-semibold text-sm">{item.name}</h3>

                  <p className="text-xs opacity-90">
                    120,000+ {currentCategory.name}
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
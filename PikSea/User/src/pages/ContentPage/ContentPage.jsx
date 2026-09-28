import { useParams, Navigate } from "react-router-dom";
import SidebarFilters from "../../components/ContentPage/SidebarFilters";
import ContentArea from "../../components/ContentPage/ContentArea";
import { useState, useMemo, useEffect } from "react";
import useContents from "../../utlis/Hooks/useContents";
import useCategories from "../../utlis/Hooks/useCategories";
import DynamicSEO from "../../components/CMS/DynamicSEO";

export default function ContentPage({ categorySlug, subcategorySlug }) {
  const params = useParams();
  const category = categorySlug || params.category;
  const subcategory = subcategorySlug || params.subcategory;

  const [licenseType, setLicenseType] = useState("all");
  const [aiGenerated, setAiGenerated] = useState("all");
  const [orientation, setOrientation] = useState("");
  const [hexColor, setHexColor] = useState("");
  const [baseColor, setBaseColor] = useState("#FFFFFF");
  const [colorIntensity, setColorIntensity] = useState(100);
  const [colorPosition, setColorPosition] = useState({ x: 50, y: 50 });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: categories = [], isLoading: isCategoryLoading, isError: isCategoryError } = useCategories();

  // Find current subcategory and parent category
  const currentSubCategory = categories?.find((cat) => cat.slug === subcategory && cat.parent_id !== null);
  const currentCategory = categories?.find(
    (cat) => Number(cat.id) === Number(currentSubCategory?.parent_id)
  );

  const filters = useMemo(() => ({
    subcategory_id: currentSubCategory?.id,
    license_type: licenseType,
    ai_generated: aiGenerated,
    orientation: orientation,
    search: debouncedSearchQuery,
  }), [currentSubCategory?.id, licenseType, aiGenerated, orientation, debouncedSearchQuery]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isContentLoading,
  } = useContents(filters);

  // Validate category and subcategory (only if categories were successfully loaded)
  if (!isCategoryError && categories.length > 0) {
    if (!currentSubCategory || currentCategory?.slug !== category) {
      return <Navigate to="/404" replace />;
    }
  }

  const contents = data?.pages.flatMap(page => page.data) || [];
  const totalCount = data?.pages[0]?.total || 0;
  const isLoading = isContentLoading || isCategoryLoading;

  const seoData = {
    title: currentSubCategory ? `${currentSubCategory.name} | DayalStock` : 'Download Resources | DayalStock',
    meta_description: `Download premium and free ${currentSubCategory?.name || 'resources'} from DayalStock. High quality royalty-free assets.`,
    canonical_url: `https://dayalstock.com/${category}/${subcategory}`,
    is_indexable: true
  };

  return (
    <div className="min-h-screen pt-16 bg-gray-50 dark:bg-[#050505] transition-colors duration-300">
      <DynamicSEO pageData={seoData} />
      <div className="flex items-start w-full">
        <SidebarFilters
          licenseType={licenseType}
          setLicenseType={setLicenseType}
          aiGenerated={aiGenerated}
          setAiGenerated={setAiGenerated}
          hexColor={hexColor}
          setHexColor={setHexColor}
          setOrientation={setOrientation}
          orientation={orientation}
          baseColor={baseColor}
          setBaseColor={setBaseColor}
          colorIntensity={colorIntensity}
          setColorIntensity={setColorIntensity}
          colorPosition={colorPosition}
          setColorPosition={setColorPosition}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
        <ContentArea
          contents={contents}
          totalCount={totalCount}
          category={category}
          subcategory={subcategory}
          currentSubCategory={currentSubCategory}
          currentCategory={currentCategory}
          isLoading={isLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      </div>
    </div>
  );
}

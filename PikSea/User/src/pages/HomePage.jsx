import BrowseContent from "../components/Home/BrowseContent";
import Hero from "../components/Home/Hero";
import JoinProSection from "../components/Home/JoinProSection";
import PopularImages from "../components/Home/PopularImages";
import TrendingPhotos from "../components/Home/TrendingPhotos";
import JustForYou from "../components/Home/JustForYou";
import WhyPikSea from "../components/Home/WhyPikSea";
import CTASection from "../components/Home/CTASection";
import TestimonialSection from "../components/Home/TestimonialSection";
import { useParams } from "react-router-dom";
import CategoryContent from "../components/BrowseContent/CategoryContent";
import DynamicSEO from "../components/CMS/DynamicSEO";
import RecentlyViewed from "../components/Home/RecentlyViewed";
import RecentSearches from "../components/Home/RecentSearches";
import YourCollections from "../components/Home/YourCollections";
import useSiteSettings from "../utlis/Hooks/useSiteSettings";

const HomePage = () => {
    const { category } = useParams();
    const { data: settings = {} } = useSiteSettings();

    const seoData = {
        title: category ? `${category.charAt(0).toUpperCase() + category.slice(1)} | PikSea` : (settings.hero_title || 'PikSea — Pure Stock Photography'),
        meta_description: settings.hero_highlight_text || 'Explore and download curated high-resolution stock photos from PikSea.',
        canonical_url: `https://piksea.com${category ? '/' + category : ''}`,
        is_indexable: true
    };



  return (
    <div>
      <DynamicSEO pageData={seoData} />
      <div>
        <Hero />
        <RecentSearches />
        <YourCollections />
        <RecentlyViewed />
        <JustForYou />
        <BrowseContent />
      {category ? (
        <CategoryContent />
      ) : (
        <>
          <PopularImages />
          <TrendingPhotos />
          
          <WhyPikSea />
          <TestimonialSection />
          <JoinProSection />
          <CTASection />
        </>
      )}
    </div>
    </div>
  );
};

export default HomePage;

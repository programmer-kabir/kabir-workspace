import BrowseContent from "../components/Home/BrowseContent";
import Hero from "../components/Home/Hero";
import JoinProSection from "../components/Home/JoinProSection";
import PopularImages from "../components/Home/PopularImages";
import PopularVectors from "../components/Home/PopularVectors";
import JustForYou from "../components/Home/JustForYou";
import WhyDayalStock from "../components/Home/WhyDayalStock";
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
        title: category ? `${category.charAt(0).toUpperCase() + category.slice(1)} | DayalStock` : (settings.hero_title || 'DayalStock - Premium Quality Assets'),
        meta_description: settings.hero_highlight_text || 'Download high-quality photos, vectors, and videos from DayalStock.',
        canonical_url: `https://dayalstock.com${category ? '/' + category : ''}`,
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
          <PopularVectors />
          
          <WhyDayalStock />
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

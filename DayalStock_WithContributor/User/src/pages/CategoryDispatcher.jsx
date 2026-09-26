import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import ContentPage from './ContentPage/ContentPage';
import SingleContentPage from './ContentPage/SingleContentPage';

const CategoryDispatcher = () => {
  const { category, slugOrSub } = useParams();
  const [routeType, setRouteType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvedSlug, setResolvedSlug] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const resolveRoute = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY || 'https://api.dayalstock.com/api_v1'}/route_resolver.php?category=${encodeURIComponent(category)}&slug=${encodeURIComponent(slugOrSub)}&api_key=${import.meta.env.VITE_APP_SECRET}`);
        const data = await res.json();
        
        if (isMounted) {
          if (data.success && data.type) {
            setRouteType(data.type);
            setResolvedSlug(slugOrSub);
          } else {
            setRouteType('not_found');
            setResolvedSlug(slugOrSub);
          }
        }
      } catch (error) {
        console.error("Route resolution failed:", error);
        if (isMounted) {
          setRouteType('not_found');
          setResolvedSlug(slugOrSub);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (category && slugOrSub) {
      resolveRoute();
    } else {
      setRouteType('not_found');
      setResolvedSlug(slugOrSub);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [category, slugOrSub]);

  if (isLoading || slugOrSub !== resolvedSlug) {
    return (
      <div className="min-h-screen pt-24 bg-gray-50 dark:bg-[#050505] flex items-center justify-center text-gray-900 dark:text-white transition-colors duration-300">
        Loading...
      </div>
    );
  }

  if (routeType === 'subcategory') {
    return <ContentPage categorySlug={category} subcategorySlug={slugOrSub} />;
  }
  
  if (routeType === 'content') {
    return <SingleContentPage categorySlug={category} contentSlug={slugOrSub} />;
  }

  return <Navigate to="/404" replace />;
};

export default CategoryDispatcher;

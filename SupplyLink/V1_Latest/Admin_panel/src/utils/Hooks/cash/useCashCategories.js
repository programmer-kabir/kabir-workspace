import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";

/**
 * useCashCategories - Hook to load dynamic cash in & out categories from DB
 */
let memoryCache = null;
let fetchPromise = null;

export const useCashCategories = () => {
  const [categories, setCategories] = useState(memoryCache || []);
  const [isLoading, setIsLoading] = useState(!memoryCache);
  const [isError, setIsError] = useState(false);

  const fetchCategories = useCallback(async (force = false) => {
    if (memoryCache && !force) {
      setCategories(memoryCache);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setIsError(false);

      if (!fetchPromise || force) {
        fetchPromise = axios.get(
          `${import.meta.env.VITE_LOCALHOST_KEY}/cash/get_cash_categories.php`
        );
      }

      const res = await fetchPromise;
      if (res.data?.success && Array.isArray(res.data?.data)) {
        memoryCache = res.data.data;
        setCategories(res.data.data);
      } else {
        setIsError(true);
      }
    } catch (err) {
      console.error("Failed to fetch cash categories:", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
      fetchPromise = null;
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Map slug -> Category object for O(1) instant lookup
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      map.set(cat.slug.toLowerCase().trim(), cat);
    });
    return map;
  }, [categories]);

  // Cash In categories
  const cashInCategories = useMemo(() => {
    return categories.filter((c) => c.type === "in" || c.type === "both");
  }, [categories]);

  // Cash Out categories
  const cashOutCategories = useMemo(() => {
    return categories.filter((c) => c.type === "out" || c.type === "both");
  }, [categories]);

  // Helper: Get category Bangla name
  const getCategoryName = useCallback(
    (slug) => {
      if (!slug) return "অন্যান্য";
      const clean = String(slug).toLowerCase().trim();
      const found = categoryMap.get(clean);
      if (found?.name_bn) return found.name_bn;

      // Fallback aliases
      if (clean === "investment") return "বিনিয়োগ";
      if (clean === "loan") return "লোন";
      if (clean === "other") return "অন্যান্য";

      return slug;
    },
    [categoryMap]
  );

  // Helper: Get Tailwind badge classes (bg, text, border)
  const getCategoryStyle = useCallback(
    (slug) => {
      if (!slug) return "bg-slate-500/15 text-slate-300 border border-slate-500/30";
      const clean = String(slug).toLowerCase().trim();
      const found = categoryMap.get(clean);
      if (found) {
        return `${found.color_bg} ${found.color_text} ${found.color_border}`;
      }

      // Fallback aliases
      if (clean === "investment") return "bg-blue-500/15 text-blue-400 border border-blue-500/30";

      return "bg-slate-500/15 text-slate-300 border border-slate-500/30";
    },
    [categoryMap]
  );

  const getCategory = useCallback(
    (slug) => {
      if (!slug) return null;
      return categoryMap.get(String(slug).toLowerCase().trim()) || null;
    },
    [categoryMap]
  );

  return {
    categories,
    cashInCategories,
    cashOutCategories,
    getCategoryName,
    getCategoryStyle,
    getCategory,
    isLoading,
    isError,
    refetch: () => fetchCategories(true),
  };
};

export default useCashCategories;

const RECENTLY_VIEWED_KEY = "recently_viewed_assets";
const RECENT_SEARCHES_KEY = "recent_searches";
const MAX_VIEWED = 12;
const MAX_SEARCHES = 10;

export const saveToRecentlyViewed = (contentItem) => {
  if (!contentItem || !contentItem.id) return;
  
  try {
    const existing = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
    
    // Check if it already exists, remove it if so we can push it to the top
    const filtered = existing.filter(item => Number(item.id) !== Number(contentItem.id));
    
    // Save only essential data to keep local storage light
    const itemToSave = {
      id: contentItem.id,
      title: contentItem.title,
      slug: contentItem.slug,
      content_type: contentItem.content_type,
      is_premium: contentItem.is_premium,
      image_url: contentItem.image_url,
      preview_image: contentItem.preview_image,
      preview_1200_url: contentItem.preview_1200_url,
      preview_600_url: contentItem.preview_600_url,
      watermarked_preview_image: contentItem.watermarked_preview_image,
      main_category_id: contentItem.main_category_id
    };

    filtered.unshift(itemToSave);
    
    const limited = filtered.slice(0, MAX_VIEWED);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error("Error saving to recently viewed:", error);
  }
};

export const getRecentlyViewed = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
  } catch {
    return [];
  }
};

export const saveToRecentSearches = (query) => {
  if (!query || typeof query !== "string") return;
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return;

  try {
    const existing = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
    
    // Remove if exists to put it at the top
    const filtered = existing.filter(q => q.toLowerCase() !== normalizedQuery);
    
    // Add the original cased query to the front
    filtered.unshift(query.trim());
    
    const limited = filtered.slice(0, MAX_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error("Error saving recent search:", error);
  }
};

export const getRecentSearches = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
  } catch {
    return [];
  }
};

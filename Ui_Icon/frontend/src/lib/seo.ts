// frontend/src/lib/seo.ts
// Utility to dynamically inject Google SEO tags, OpenGraph, Canonical URLs, and JSON-LD Structured Data

export interface SeoProps {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  structuredData?: Record<string, any>;
}

export function updatePageSeo({
  title,
  description,
  keywords = [],
  canonical,
  ogImage = 'https://iconbaba.com/og-image.png',
  structuredData,
}: SeoProps) {
  if (typeof document === 'undefined') return;

  // 1. Title
  document.title = title.includes('IconBaba') ? title : `${title} | IconBaba`;

  // 2. Meta Helper
  const setMeta = (nameAttr: string, nameVal: string, contentVal: string) => {
    let el = document.querySelector(`meta[${nameAttr}="${nameVal}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(nameAttr, nameVal);
      document.head.appendChild(el);
    }
    el.setAttribute('content', contentVal);
  };

  // 3. Standard Metas
  setMeta('name', 'description', description);
  if (keywords.length > 0) {
    setMeta('name', 'keywords', keywords.join(', '));
  }
  setMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

  // 4. OpenGraph
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:image', ogImage);
  if (canonical || typeof window !== 'undefined') {
    setMeta('property', 'og:url', canonical || window.location.href);
  }

  // 5. Twitter Card
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', ogImage);

  // 6. Canonical Link
  const canonicalUrl = canonical || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '');
  if (canonicalUrl) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalUrl);
  }

  // 7. JSON-LD Structured Data
  if (structuredData) {
    let script = document.querySelector('script[data-seo="json-ld"]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-seo', 'json-ld');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
  }
}

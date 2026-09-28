import React from 'react';
import { Helmet } from 'react-helmet-async';

const DynamicSEO = ({ pageData }) => {
    if (!pageData) return null;

    const title = pageData.meta_title || pageData.title || 'DayalStock';
    const description = pageData.meta_description || '';
    const keywords = pageData.meta_keywords || '';
    const canonical = pageData.canonical_url || '';
    
    // Open Graph
    const ogTitle = pageData.og_title || title;
    const ogDescription = pageData.og_description || description;
    const ogImage = pageData.og_image || '';
    const ogUrl = pageData.og_url || canonical;
    const ogType = pageData.og_type || 'website';
    
    // Convert 1/0 or boolean to true/false
    const isIndexable = (pageData.is_indexable === 1 || pageData.is_indexable === true || pageData.is_indexable === '1');

    return (
        <Helmet>
                {/* Standard Metadata */}
                <title>{title}</title>
                {description && <meta name="description" content={description} />}
                {keywords && <meta name="keywords" content={keywords} />}
                
                {/* Robots */}
                <meta name="robots" content={isIndexable ? "index, follow" : "noindex, nofollow"} />
                
                {/* Canonical */}
                {canonical && <link rel="canonical" href={canonical} />}
                
                {/* Open Graph */}
                <meta property="og:title" content={ogTitle} />
                {ogDescription && <meta property="og:description" content={ogDescription} />}
                {ogImage && <meta property="og:image" content={ogImage} />}
                {ogUrl && <meta property="og:url" content={ogUrl} />}
                <meta property="og:type" content={ogType} />
                
                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={ogTitle} />
                {ogDescription && <meta name="twitter:description" content={ogDescription} />}
                {ogImage && <meta name="twitter:image" content={ogImage} />}
        </Helmet>
    );
};

export default DynamicSEO;

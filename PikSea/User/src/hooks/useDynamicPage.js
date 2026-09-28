import { useState, useEffect } from 'react';
import axios from 'axios';

export const useDynamicPage = (slug) => {
    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPage = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${import.meta.env.VITE_LOCALHOST_KEY}/cms/pages/get.php?slug=${slug}`);
                if (response.data.success) {
                    let content = response.data.data.content;
                    // If content is JSON format, parse it
                    if (response.data.data.content_format === 'json') {
                        try {
                            content = JSON.parse(content);
                        } catch(e) {
                            console.error("Failed to parse JSON content for", slug);
                        }
                    }
                    
                    setPageData({
                        ...response.data.data,
                        content: content
                    });
                } else {
                    setError('Page not found');
                }
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setError('Page not found');
                } else {
                    setError(err.message || 'Error fetching page data');
                }
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchPage();
        }
    }, [slug]);

    return { pageData, loading, error };
};

import { useState, useEffect } from 'react';
import axios from 'axios';

export const useFaqs = () => {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${import.meta.env.VITE_LOCALHOST_KEY}/cms/faqs/get.php`, {
                    headers: {
                        'x-api-key': import.meta.env.VITE_APP_SECRET
                    }
                });
                if (response.data.success) {
                    setFaqs(response.data.data);
                } else {
                    setError('Failed to fetch FAQs');
                }
            } catch (err) {
                setError(err.message || 'Error fetching FAQ data');
            } finally {
                setLoading(false);
            }
        };

        fetchFaqs();
    }, []);

    return { faqs, loading, error };
};

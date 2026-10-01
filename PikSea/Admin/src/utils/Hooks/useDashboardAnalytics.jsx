import { useState, useEffect } from 'react';
import { authFetch } from '../../api/authFetch';
import { toast } from 'react-hot-toast';

const useDashboardAnalytics = () => {
    const [analytics, setAnalytics] = useState({
        today: { downloads: 0, revenue: 0, new_users: 0, sales: 0, subscriptions: 0 },
        chart_data: [],
        top_contents: []
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await authFetch(`${import.meta.env.VITE_LOCALHOST_KEY}/dashboard/get_analytics_dashboard.php`);
                const data = await res.json();
                if (data.success) {
                    setAnalytics(data);
                } else {
                    console.error("Failed to fetch analytics:", data);
                }
            } catch (error) {
                console.error("Error fetching dashboard analytics:", error);
                toast.error("Failed to load dashboard analytics");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    return { analytics, isLoading };
};

export default useDashboardAnalytics;

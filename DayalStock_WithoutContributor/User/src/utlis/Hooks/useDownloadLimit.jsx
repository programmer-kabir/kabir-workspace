import { useQuery } from '@tanstack/react-query';
import useAuth from './useAuth';

const useDownloadLimit = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['download-limit', user?.email],
        queryFn: async () => {
            const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/contents/check_download_limit.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: user?.email })
            });
            return res.json();
        },
        enabled: !!user?.email,
        retry: false, // Do not retry on network or 404 errors to avoid infinite loading
    });
};

export default useDownloadLimit;

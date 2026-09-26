import { useQuery } from '@tanstack/react-query';
import useAuth from './useAuth';
import { getUserDownloads } from '../../api/api';

const useUserDownloads = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['user-downloads', user?.email],
        queryFn: () => getUserDownloads(user?.email),
        enabled: !!user?.email, // Only run the query if user email exists
    });
};

export default useUserDownloads;

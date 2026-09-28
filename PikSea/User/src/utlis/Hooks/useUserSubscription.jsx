import { useQuery } from '@tanstack/react-query';
import { getUserSubscription } from '../../api/api';
import useAuth from './useAuth';

const useUserSubscription = () => {
    const { user } = useAuth();
    const email = user?.email;

    return useQuery({
        queryKey: ['userSubscription', email],
        queryFn: () => getUserSubscription(email),
        enabled: !!email,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export default useUserSubscription;

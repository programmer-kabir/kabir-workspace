import { useQuery } from "@tanstack/react-query";
import { getSubscriptions } from "../../api/api";

const useSubscriptions = () => {
  return useQuery({
    queryKey: ["subscriptions"],
    queryFn: getSubscriptions,
    staleTime: 1000 * 60 * 5,
  });
};

export default useSubscriptions;

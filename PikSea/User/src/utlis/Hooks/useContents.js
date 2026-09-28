import { useInfiniteQuery } from "@tanstack/react-query";
import { getAllContents } from "../../api/api";

const useContents = (filters = {}) => {
  return useInfiniteQuery({
    queryKey: ["contents", filters],

    queryFn: ({ pageParam = 1 }) =>
      getAllContents({
        page: pageParam,
        limit: 48,
        ...filters,
      }),

    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }

      return undefined;
    },

    initialPageParam: 1,
  });
};

export default useContents;
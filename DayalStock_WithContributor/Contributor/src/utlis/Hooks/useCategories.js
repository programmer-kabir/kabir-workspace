import { useQuery } from "@tanstack/react-query";
import { getCategories } from "../../api/api";


const useCategories = (parentId = null) => {
  return useQuery({
    queryKey: ["categories", parentId],
    queryFn: () => getCategories(parentId),
    staleTime: 1000 * 60 * 5,
  });
};

export default useCategories;
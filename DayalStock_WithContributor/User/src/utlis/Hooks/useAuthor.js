import { useQuery } from "@tanstack/react-query";
import { getAllAuthor } from "../../api/api";


const useAuthor = () => {
  return useQuery({
    queryKey: ["authors", ],
    queryFn: () => getAllAuthor(),
    staleTime: 1000 * 60 * 5,
  });
};

export default useAuthor;
import { useQuery } from "@tanstack/react-query";
import { getAllAuthor } from "../../api/api";



const useAuthors = () => {
  return useQuery({
    queryKey: ["authors"],
    queryFn: () => getAllAuthor(),
    staleTime: 1000 * 60 * 5,
  });
};

export default useAuthors;
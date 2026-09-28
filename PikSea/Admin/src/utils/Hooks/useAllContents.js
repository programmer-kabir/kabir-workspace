import { useQuery } from "@tanstack/react-query";
import { getAllContents } from "../../api/contentApi";;


const useAllContents = ({ status = "all", page = 1, limit = 48 } = {}) => {
  return useQuery({
    queryKey: ["contents", status, page, limit],
    queryFn: () => getAllContents({ status, page, limit }),
    staleTime: 1000 * 60 * 5,
  });
};

export default useAllContents;

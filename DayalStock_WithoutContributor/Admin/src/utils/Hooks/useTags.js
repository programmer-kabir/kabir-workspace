import { useQuery } from "@tanstack/react-query";
import { getTags } from "../../api/tagApi";;

const useTags = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: getTags,
    staleTime: 1000 * 60 * 5,
  });
};

export default useTags;

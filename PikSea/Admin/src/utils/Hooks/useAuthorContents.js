
import { useQuery } from "@tanstack/react-query";
import { getAuthorContents } from "../../api/authorFunciton";

const useAuthorContents = (authorId, status = "", page = 1, limit = 50) => {
    console.log(status)
  return useQuery({
    queryKey: ["authorContents", authorId, status, page, limit],

    queryFn: () =>
      getAuthorContents(authorId, status, page, limit),

    enabled: Boolean(authorId),

    staleTime: 1000 * 60 * 5,
  });
};

export default useAuthorContents;
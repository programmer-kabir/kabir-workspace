import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "../../api/api";


const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => getAllUsers(),
    staleTime: 1000 * 60 * 5,
  });
};

export default useUsers;
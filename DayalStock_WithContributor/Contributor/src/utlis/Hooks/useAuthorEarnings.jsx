import { useQuery } from "@tanstack/react-query";
import useAuth from "./useAuth";

const getAuthorEarnings = async (user) => {
  if (!user) return null;
  const token = await user.getIdToken();
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/earnings/get_author_earnings.php`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to load earnings");
  }

  return data;
};

const useAuthorEarnings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["authorEarnings", user?.uid],
    queryFn: () => getAuthorEarnings(user),
    enabled: Boolean(user),
    staleTime: 1000 * 60 * 5,
  });
};

export default useAuthorEarnings;

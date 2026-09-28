import { useQuery } from "@tanstack/react-query";
import useAuth from "./useAuth";

const getUploadLimitByEmail = async (email, token) => {
  if (!email?.trim()) {
    throw new Error("Author email is required");
  }

  const url = `${
    import.meta.env.VITE_LOCALHOST_KEY
  }/upload_limits/get_limit_by_email.php?email=${encodeURIComponent(email.trim())}`;

  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Upload limit load failed");
  }

  return data.data || null;
};

const useUploadLimit = (email) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["uploadLimit", email],
    queryFn: async () => {
      const token = user ? await user.getIdToken() : null;
      return getUploadLimitByEmail(email, token);
    },
    enabled: Boolean(email?.trim()) && Boolean(user),
    staleTime: 1000 * 60 * 5,
  });
};

export default useUploadLimit;

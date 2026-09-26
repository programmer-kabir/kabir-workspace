import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAuth from "./useAuth";
import { toast } from "react-toastify";

const BASE_URL = import.meta.env.VITE_LOCALHOST_KEY || "https://api.dayalstock.com/api_v1";

export const useFollowStatus = (authorId) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["followStatus", authorId, user?.uid],
    queryFn: async () => {
      if (!authorId) return null;
      
      const headers = { "Content-Type": "application/json" };
      if (user) {
        const token = await user.getIdToken();
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const res = await fetch(`${BASE_URL}/author/get_follow_status.php?author_id=${authorId}`, {
        headers
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch follow status");
      }
      return data;
    },
    enabled: !!authorId, // We should allow this to run even if not logged in to get followers count! Wait, but the backend requires auth.
  });
};

export const useToggleFollow = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (authorId) => {
      if (!user) throw new Error("Must be logged in");
      const token = await user.getIdToken();
      const res = await fetch(`${BASE_URL}/author/toggle_follow.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ author_id: authorId })
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to toggle follow");
      }
      return { ...data, authorId };
    },
    onSuccess: (data) => {
      // Update follow status cache for this author
      queryClient.setQueryData(["followStatus", data.authorId], (old) => {
        if (!old) return old;
        return {
          ...old,
          is_following: data.is_following,
          followers_count: data.followers_count
        };
      });
      
      // Invalidate following list
      queryClient.invalidateQueries(["followingList"]);
      
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
};

export const useFollowingList = (page = 1, search = "") => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["followingList", page, search],
    queryFn: async () => {
      if (!user) throw new Error("Must be logged in");
      const token = await user.getIdToken();
      const res = await fetch(`${BASE_URL}/author/get_following.php?page=${page}&search=${search}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch following list");
      }
      return data;
    },
    enabled: !!user,
  });
};

export const useAuthorFollowers = (authorId) => {
  return useQuery({
    queryKey: ["authorFollowers", authorId],
    queryFn: async () => {
      if (!authorId) return null;
      const res = await fetch(`${BASE_URL}/author/get_author_followers.php?author_id=${authorId}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch followers list");
      }
      return data;
    },
    enabled: !!authorId,
  });
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAuth from "./useAuth";

const fetchNotifications = async (token) => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/notifications/get_notifications.php`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
     body: JSON.stringify({ target_role: "author" }), 
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch notifications");
  }

  return data;
};

const markAsRead = async ({ token, notificationId = null }) => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/notifications/mark_as_read.php`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(notificationId ? { notification_id: notificationId } : {}),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to mark as read");
  }
  return data;
};

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", user?.uid],
    queryFn: async () => {
      const token = await user.getIdToken();
      return fetchNotifications(token);
    },
    enabled: !!user,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId = null) => {
      const token = await user.getIdToken();
      return markAsRead({ token, notificationId });
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.uid] });
    },
  });

  return {
    ...query,
    markAsRead: markReadMutation.mutate,
    isMarkingRead: markReadMutation.isPending,
  };
};

export default useNotifications;

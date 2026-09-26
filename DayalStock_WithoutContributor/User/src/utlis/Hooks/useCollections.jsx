import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAuth from "./useAuth";
import {
  getUserCollections,
  getCollectionContents,
  createCollection,
  toggleCollectionItem,
  renameCollection,
  deleteCollection,
  toggleCollectionPrivacy,
  getPublicCollections
} from "../../api/api";

export const usePublicCollections = (username) => {
  return useQuery({
    queryKey: ["publicCollections", username],
    queryFn: () => getPublicCollections(username),
    enabled: !!username
  });
};

export const useUserCollections = (contentId = 0) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["userCollections", user?.uid, contentId],
    queryFn: () => getUserCollections(contentId),
    enabled: !!user
  });
};

export const useCollectionContents = (collectionId) => {
  return useQuery({
    queryKey: ["collectionContents", collectionId],
    queryFn: () => getCollectionContents(collectionId),
    enabled: !!collectionId
  });
};

export const useCreateCollection = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ name, contentId }) => createCollection(name, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userCollections", user?.uid] });
    }
  });
};

export const useToggleCollectionItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ collectionId, contentId }) => toggleCollectionItem(collectionId, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userCollections", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["collectionContents"] });
    }
  });
};

export const useRenameCollection = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ collectionId, newName }) => renameCollection(collectionId, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userCollections", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["collectionContents"] });
    }
  });
};

export const useDeleteCollection = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (collectionId) => deleteCollection(collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userCollections", user?.uid] });
    }
  });
};

export const useToggleCollectionPrivacy = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ collectionId, isPublic }) => toggleCollectionPrivacy(collectionId, isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userCollections", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["collectionContents"] });
    }
  });
};

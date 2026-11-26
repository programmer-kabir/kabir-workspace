import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  deleteRemoteFavorite,
  fetchRemoteFavorites,
  getStoredAuthToken,
  saveRemoteFavorite,
} from '../services/api';
import type { SavedContributor, StockAsset } from '../types/stock';

const IMAGES_KEY = 'sat_saved_images_v1';
const CONTRIBUTORS_KEY = 'sat_saved_contributors_v1';
const SYNC_EVENT = 'sat:saved-changed';

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useSavedItems() {
  const [savedImages, setSavedImages] = useState<StockAsset[]>(() => readStorage(IMAGES_KEY, []));
  const [savedContributors, setSavedContributors] = useState<SavedContributor[]>(() =>
    readStorage(CONTRIBUTORS_KEY, [])
  );

  useEffect(() => {
    const sync = () => {
      setSavedImages(readStorage(IMAGES_KEY, []));
      setSavedContributors(readStorage(CONTRIBUTORS_KEY, []));
    };
    window.addEventListener(SYNC_EVENT, sync);
    window.addEventListener('storage', sync);

    if (getStoredAuthToken()) {
      fetchRemoteFavorites()
        .then((res) => {
          if (res.images.length > 0) {
            localStorage.setItem(IMAGES_KEY, JSON.stringify(res.images));
            setSavedImages(res.images);
          }
          if (res.contributors.length > 0) {
            localStorage.setItem(CONTRIBUTORS_KEY, JSON.stringify(res.contributors));
            setSavedContributors(res.contributors);
          }
        })
        .catch(() => undefined);
    }

    return () => {
      window.removeEventListener(SYNC_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggleImage = useCallback((asset: StockAsset) => {
    const current = readStorage<StockAsset[]>(IMAGES_KEY, []);
    const exists = current.some((item) => item.id === asset.id);
    const next = exists ? current.filter((item) => item.id !== asset.id) : [asset, ...current];
    localStorage.setItem(IMAGES_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(SYNC_EVENT));
    toast.success(exists ? 'Removed from saved assets' : 'Saved asset to favorites');

    if (getStoredAuthToken()) {
      const remoteOp = exists
        ? deleteRemoteFavorite('image', asset.id)
        : saveRemoteFavorite('image', asset.id, asset as unknown as Record<string, unknown>);
      remoteOp.catch(() => undefined);
    }
  }, []);

  const toggleContributor = useCallback((contributor: SavedContributor) => {
    const current = readStorage<SavedContributor[]>(CONTRIBUTORS_KEY, []);
    const exists = current.some((item) => item.id === contributor.id);
    const next = exists
      ? current.filter((item) => item.id !== contributor.id)
      : [contributor, ...current];
    localStorage.setItem(CONTRIBUTORS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(SYNC_EVENT));
    toast.success(exists ? 'Removed contributor from favorites' : 'Saved contributor');

    if (getStoredAuthToken()) {
      const remoteOp = exists
        ? deleteRemoteFavorite('contributor', contributor.id)
        : saveRemoteFavorite('contributor', contributor.id, contributor as unknown as Record<string, unknown>);
      remoteOp.catch(() => undefined);
    }
  }, []);

  const isImageSaved = useCallback(
    (id: string) => savedImages.some((item) => item.id === id),
    [savedImages]
  );

  const isContributorSaved = useCallback(
    (id: string) => savedContributors.some((item) => item.id === id),
    [savedContributors]
  );

  return {
    savedImages,
    savedContributors,
    toggleImage,
    toggleContributor,
    isImageSaved,
    isContributorSaved,
  };
}

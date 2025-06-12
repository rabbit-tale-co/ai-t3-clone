import { useCallback } from 'react';
import type { Chat } from '@/lib/db/schema';
import {
  clearLocalStorageByPrefix,
  setCachedDataWithExpiry,
} from '@/lib/utils';

export function useSidebarCache() {
  const addChatToCache = useCallback((newChat: Chat) => {
    // Sprawdź czy funkcja jest dostępna w window
    if (
      typeof window !== 'undefined' &&
      (window as any).addChatToSidebarCache
    ) {
      (window as any).addChatToSidebarCache(newChat);
    }
  }, []);

  const clearFoldersAndTagsCache = useCallback((userId: string) => {
    clearLocalStorageByPrefix(`folders_${userId}`);
    clearLocalStorageByPrefix(`tags_${userId}`);
    clearLocalStorageByPrefix(`cache_timestamp_${userId}`);
  }, []);

  const updateCacheTimestamp = useCallback((userId: string) => {
    setCachedDataWithExpiry(`cache_timestamp_${userId}`, Date.now());
  }, []);

  return {
    addChatToCache,
    clearFoldersAndTagsCache,
    updateCacheTimestamp,
  };
}

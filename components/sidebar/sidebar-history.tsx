// components/SidebarHistory.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useOptimistic,
  startTransition,
} from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { LoaderIcon } from 'lucide-react';
import useSWRInfinite from 'swr/infinite';
import { useSWRConfig } from 'swr';
import { useSession } from 'next-auth/react'; // For NextAuth session data

// Dialog components przeniesione do app-sidebar.tsx

// Import Drizzle schema types
import type { Chat, Folder, Tag as TagType } from '@/lib/db/schema';

// Import Server Actions
import { deleteChatAction } from '@/app/(chat)/actions';

// Import the new sub-components
import { FolderItem } from './folder-item';
import { UnfiledChatsList } from './unfilled-chats';
import { ChatItem } from './chat-item';
import {
  clearLocalStorageByPrefix,
  setSidebarCache,
  getSidebarCache,
  cn,
} from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import { Skeleton } from '../ui/skeleton';

// --- CONSTANTS ---
const PAGE_SIZE = 20;

interface InitialData {
  threads: SidebarThread[];
  folders: Folder[];
  tags: TagType[];
  hasMore: boolean;
}

interface SidebarThread extends Chat {
  folder: {
    name: string;
    color: string;
  } | null;
  tags: Array<{
    id: string;
    label: string;
    color: string;
    userId: string;
  }>;
}

const colorAccents = {
  pink: {
    light: '#FDF2F8',
    dark: '#831843',
    border: '#FBCFE8',
    accent: '#EC4899',
  },
  purple: {
    light: '#F5F3FF',
    dark: '#5B21B6',
    border: '#DDD6FE',
    accent: '#8B5CF6',
  },
  blue: {
    light: '#EFF6FF',
    dark: '#1E40AF',
    border: '#BFDBFE',
    accent: '#3B82F6',
  },
  green: {
    light: '#ECFDF5',
    dark: '#065F46',
    border: '#A7F3D0',
    accent: '#10B981',
  },
  orange: {
    light: '#FFF7ED',
    dark: '#9A3412',
    border: '#FFEDD5',
    accent: '#F97316',
  },
  red: {
    light: '#FEF2F2',
    dark: '#991B1B',
    border: '#FECACA',
    accent: '#EF4444',
  },
  indigo: {
    light: '#EEF2FF',
    dark: '#3730A3',
    border: '#C7D2FE',
    accent: '#6366F1',
  },
  teal: {
    light: '#F0FDFA',
    dark: '#115E59',
    border: '#99F6E4',
    accent: '#14B8A6',
  },
  amber: {
    light: '#FFFBEB',
    dark: '#92400E',
    border: '#FDE68A',
    accent: '#F59E0B',
  },
  gray: {
    light: '#F9FAFB',
    dark: '#1F2937',
    border: '#E5E7EB',
    accent: '#6B7280',
  },
};

export function SidebarHistory({
  user, // User from NextAuth session (passed as prop, assumed from layout.tsx)
  searchTerm = '',
  renderActions,
  showCreateFolderDialog,
  setShowCreateFolderDialog,
  showCreateTagDialog,
  setShowCreateTagDialog,
  initialData,
}: {
  user: User | undefined;
  searchTerm?: string;
  renderActions?: (chatId: string) => React.ReactNode;
  showCreateFolderDialog?: boolean;
  setShowCreateFolderDialog?: (show: boolean) => void;
  showCreateTagDialog?: boolean;
  setShowCreateTagDialog?: (show: boolean) => void;
  initialData?: InitialData;
}) {
  const router = useRouter();
  const params = useParams();
  const { setOpenMobile } = useSidebar();
  const { mutate } = useSWRConfig();
  const { data: session, status: sessionStatus } = useSession(); // Access NextAuth session

  // IMPORTANT: Use session.user.id directly as `userFromDatabase` hook is removed.
  // The `user` prop should ideally be `session.user` for consistency if coming from NextAuth.
  const userId = session?.user?.id;

  // Najpierw sprawdzamy cache, potem initialData
  // Cache functions przeniesione do app-sidebar.tsx

  // Używamy dane z props - już zarządzane w app-sidebar.tsx
  const folders = useMemo(() => initialData?.folders || [], [initialData]);
  const tags = useMemo(() => initialData?.tags || [], [initialData]);

  // UI States
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const hasDataInCache = initialData?.threads && initialData.threads.length > 0;

  const {
    data: allThreadsPages,
    size,
    setSize,
    isLoading: isLoadingThreads,
    mutate: mutateThreads,
  } = useSWRInfinite(
    (pageIndex, previousData) => {
      if (!userId) return null;
      if (previousData && !previousData.hasMore) return null;

      const lastId = previousData?.threads.slice(-1)[0]?.id || '';
      return pageIndex === 0 && !lastId
        ? `/api/threads?limit=${PAGE_SIZE}`
        : `/api/threads?limit=${PAGE_SIZE}&ending_before=${lastId}`;
    },
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch threads');
      return await res.json();
    },
    {
      fallbackData: hasDataInCache
        ? [
            {
              threads: initialData?.threads || [],
              folders: initialData?.folders || [],
              tags: initialData?.tags || [],
              hasMore: initialData?.hasMore || false,
            },
          ]
        : undefined,
      revalidateOnMount: !hasDataInCache,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      revalidateIfStale: false,
      refreshInterval: 0,
    },
  );

  // Flatten all threads from SWR pages into a single array
  const baseThreads = useMemo(() => {
    try {
      const threads = allThreadsPages
        ? allThreadsPages.flatMap((page) => page.threads || [])
        : [];
      return threads.filter((thread) => thread?.id);
    } catch (error) {
      console.error('Error flattening threads:', error);
      return [];
    }
  }, [allThreadsPages]);

  // Stable state for useOptimistic - only update when threads actually change
  const [stableThreads, setStableThreads] = useState<SidebarThread[]>([]);

  // Pure reducer function for optimistic updates
  const optimisticReducer = useCallback(
    (
      state: SidebarThread[],
      action: {
        type:
          | 'moveToFolder'
          | 'removeFromFolder'
          | 'delete'
          | 'addTag'
          | 'removeTag'
          | 'addNewChat';
        chatId: string;
        folderId?: string | null;
        folder?: { name: string; color: string } | null;
        tagId?: string;
        tag?: { id: string; label: string; color: string; userId: string };
        newChat?: SidebarThread;
      },
    ): SidebarThread[] => {
      // Ensure state is always an array
      const currentState = Array.isArray(state) ? state : [];

      // Only log for addNewChat and delete actions
      if (action.type === 'addNewChat' || action.type === 'delete') {
        console.log('Optimistic reducer called:', action.type, action.chatId);
        console.log('Current state length:', currentState.length);
      }

      switch (action.type) {
        case 'moveToFolder':
          return currentState.map((thread) =>
            thread.id === action.chatId
              ? {
                  ...thread,
                  folderId: action.folderId || null,
                  folder: action.folder || null,
                }
              : thread,
          );

        case 'removeFromFolder':
          return currentState.map((thread) =>
            thread.id === action.chatId
              ? { ...thread, folderId: null, folder: null }
              : thread,
          );

        case 'delete': {
          const filteredState = currentState.filter(
            (thread) => thread.id !== action.chatId,
          );
          console.log('Delete result length:', filteredState.length);
          return filteredState;
        }

        case 'addTag': {
          const tag = action.tag;
          if (!tag) return currentState;
          return currentState.map((thread) =>
            thread.id === action.chatId
              ? {
                  ...thread,
                  tags: [...(thread.tags || []), tag],
                }
              : thread,
          );
        }

        case 'removeTag': {
          const tagId = action.tagId;
          if (!tagId) return currentState;
          return currentState.map((thread) =>
            thread.id === action.chatId
              ? {
                  ...thread,
                  tags: (thread.tags || []).filter((tag) => tag.id !== tagId),
                }
              : thread,
          );
        }

        case 'addNewChat': {
          const newChat = action.newChat;
          if (!newChat) {
            console.log('No newChat provided');
            return currentState;
          }
          // Check if chat already exists to prevent duplicates
          const exists = currentState.some(
            (thread) => thread.id === newChat.id,
          );
          console.log('Chat exists:', exists);
          if (exists) {
            console.log('Chat already exists, returning current state');
            return currentState;
          }
          const newState = [newChat, ...currentState];
          console.log('Adding new chat, new state length:', newState.length);
          return newState;
        }

        default:
          console.log('Unknown action type:', action.type);
          return currentState;
      }
    },
    [],
  );

  // Optimistic updates dla threads (chats) - use stable threads as base
  const [allThreadsOptimistic, optimisticThreads] = useOptimistic(
    stableThreads,
    optimisticReducer,
  );

  // Update stableThreads only when baseThreads actually change and no optimistic updates are pending
  useEffect(() => {
    // Only update stable threads if the actual data changed (not just reference)
    // AND if we're not in the middle of an optimistic update
    const hasOptimisticChanges =
      allThreadsOptimistic.length > baseThreads.length;

    if (hasOptimisticChanges) {
      console.log(
        'Skipping stableThreads update - optimistic changes in progress',
      );
      return;
    }

    if (
      baseThreads.length !== stableThreads.length ||
      baseThreads.some(
        (thread, index) => thread.id !== stableThreads[index]?.id,
      )
    ) {
      console.log(
        'Updating stable threads from',
        stableThreads.length,
        'to',
        baseThreads.length,
      );
      setStableThreads(baseThreads);
    }
  }, [baseThreads, stableThreads, allThreadsOptimistic.length]);

  // Debug logs
  useEffect(() => {
    console.log('stableThreads changed:', stableThreads.length);
    console.log('allThreadsOptimistic changed:', allThreadsOptimistic.length);
  }, [stableThreads, allThreadsOptimistic]);

  // Convert threads to simple chats for backward compatibility
  const allChats = useMemo(() => {
    return allThreadsOptimistic.map((thread) => ({
      id: thread.id,
      title: thread.title,
      createdAt: thread.createdAt,
      userId: thread.userId,
      visibility: thread.visibility,
      folderId: thread.folderId,
    }));
  }, [allThreadsOptimistic]);

  // Unfiled chats: derived from allChats for the dedicated "Unfiled Chats" section
  const unfiledChats = useMemo(() => {
    if (searchTerm.trim()) return [];
    return allChats.filter((chat) => chat.folderId === null);
  }, [allChats, searchTerm]);

  // Filtered chats by search term (applies globally across all chats)
  const filteredSearchChats = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return allChats.filter((chat) =>
      chat.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [allChats, searchTerm]);

  // Effect to clear cache when user changes
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        Reflect.deleteProperty(window as any, 'addChatToSidebarCache');
      }
    };
  }, [userId]);

  // Effect to save data to cache when they change
  useEffect(() => {
    if (!userId) {
      clearLocalStorageByPrefix('sidebar_data_');
      clearLocalStorageByPrefix('cache_timestamp_');
      return;
    }

    if (folders.length > 0 || tags.length > 0) {
      const cacheData = {
        threads: allThreadsOptimistic,
        folders: folders,
        tags: tags,
        hasMore: false,
      };
      setSidebarCache(userId, cacheData);
    }
  }, [userId, folders, tags, allThreadsOptimistic]);

  const handleAddNewChatOptimistic = useCallback(
    (chatId: string, title: string) => {
      console.log('handleAddNewChatOptimistic called with:', chatId, title);

      if (!userId) {
        console.log('No userId, skipping optimistic update');
        return;
      }

      const newChat: SidebarThread = {
        id: chatId,
        title: title || 'New Chat',
        createdAt: new Date(),
        userId: userId,
        visibility: 'private',
        folderId: null,
        folder: null,
        tags: [],
      };

      console.log('Adding optimistic chat:', newChat);

      try {
        startTransition(() => {
          optimisticThreads({
            type: 'addNewChat',
            chatId,
            newChat,
          });
        });
        console.log('Optimistic update completed');
      } catch (error) {
        console.error('handleAddNewChatOptimistic error:', error);
      }
    },
    [optimisticThreads, userId],
  );

  const addChatToCache = useCallback(
    (newChat: Chat) => {
      console.log('addChatToCache called with:', newChat.id, newChat.title);

      // Check if chat already exists in optimistic state
      const existsInOptimistic = allThreadsOptimistic.some(
        (thread) => thread.id === newChat.id,
      );
      console.log('existsInOptimistic:', existsInOptimistic);

      const newThread: SidebarThread = {
        ...newChat,
        folder: null,
        tags: [],
      };

      mutateThreads((pages) => {
        if (!pages || pages.length === 0) {
          console.log('No pages, creating new page with thread');
          return [
            {
              threads: [newThread],
              folders: folders,
              tags: tags,
              hasMore: false,
            },
          ];
        }

        const newPages = [...pages];

        // Check if chat already exists in the first page
        const existsInFirstPage = newPages[0].threads.some(
          (thread: SidebarThread) => thread.id === newChat.id,
        );
        console.log('existsInFirstPage:', existsInFirstPage);

        if (!existsInFirstPage) {
          console.log('Adding new thread to first page');
          newPages[0] = {
            ...newPages[0],
            threads: [newThread, ...newPages[0].threads],
          };
        } else {
          console.log('Updating existing thread in first page');
          // Update existing chat
          newPages[0] = {
            ...newPages[0],
            threads: newPages[0].threads.map((thread: SidebarThread) =>
              thread.id === newChat.id ? newThread : thread,
            ),
          };
        }

        return newPages;
      }, false);

      if (userId && !existsInOptimistic) {
        console.log('Updating cache with new thread');
        const updatedThreads = [newThread, ...allThreadsOptimistic];
        const cacheData = {
          threads: updatedThreads,
          folders: folders,
          tags: tags,
          hasMore: false,
        };
        setSidebarCache(userId, cacheData);
      } else {
        console.log(
          'Skipping cache update - exists in optimistic or no userId',
        );
      }
    },
    [mutateThreads, folders, tags, allThreadsOptimistic, userId],
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).addChatToSidebarCache = addChatToCache;
      (window as any).addNewChatOptimistic = handleAddNewChatOptimistic;
    }
  }, [addChatToCache, handleAddNewChatOptimistic]);

  // Handle infinite scroll for global chat history/search
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const isAtBottom =
      e.currentTarget.scrollHeight - e.currentTarget.scrollTop ===
      e.currentTarget.clientHeight;

    if (
      isAtBottom &&
      allThreadsPages &&
      allThreadsPages[allThreadsPages.length - 1]?.hasMore &&
      !searchTerm
    ) {
      setSize(size + 1);
    }
  };

  const isActiveChatId = (id: string) => {
    return params?.id === id;
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const onDeleteChatClick = (chatId: string) => {
    setDeleteId(chatId);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    // Optimistic update - usuń chat natychmiast z UI
    try {
      startTransition(() => {
        optimisticThreads({
          type: 'delete',
          chatId: deleteId,
        });
      });
    } catch (error) {
      console.error('Optimistic delete error:', error);
    }

    const deletePromise = deleteChatAction(deleteId);

    toast.promise(deletePromise, {
      // TODO: add translation
      loading: 'Deleting chat...',
      success: () => {
        mutateThreads(
          (threadHistories: any) => {
            if (!threadHistories) return threadHistories;

            return threadHistories.map((threadHistoryPage: any) => ({
              ...threadHistoryPage,
              threads: threadHistoryPage.threads.filter(
                (thread: SidebarThread) => thread.id !== deleteId,
              ),
            }));
          },
          { revalidate: false },
        );
        // TODO: add translation
        return 'Chat deleted successfully';
      },
      // TODO: add translation
      error: (error) => {
        // Jeśli usuwanie się nie powiodło, przywróć chat (rollback optimistic update)
        // Tutaj moglibyśmy dodać logikę przywracania, ale na razie zostawiamy
        console.error('Delete failed:', error);
        return 'Failed to delete chat';
      },
    });

    setShowDeleteDialog(false);
    if (deleteId === params?.id) {
      router.push('/');
    }
    setDeleteId(null);
  };

  // Optimistic update functions for passing to ChatItem
  const handleMoveToFolder = useCallback(
    (
      chatId: string,
      folderId: string,
      folderName: string,
      folderColor: string,
    ) => {
      try {
        startTransition(() => {
          optimisticThreads({
            type: 'moveToFolder',
            chatId,
            folderId,
            folder: { name: folderName, color: folderColor },
          });
        });
      } catch (error) {
        console.error('handleMoveToFolder error:', error);
        console.error(
          'Error stack:',
          error instanceof Error ? error.stack : 'Unknown error',
        );
      }
    },
    [optimisticThreads],
  );

  const handleRemoveFromFolder = useCallback(
    (chatId: string) => {
      try {
        startTransition(() => {
          optimisticThreads({
            type: 'removeFromFolder',
            chatId,
          });
        });
      } catch (error) {
        console.error('handleRemoveFromFolder error:', error);
      }
    },
    [optimisticThreads],
  );

  const handleAddTagToChat = useCallback(
    (
      chatId: string,
      tag: { id: string; label: string; color: string; userId: string },
    ) => {
      try {
        startTransition(() => {
          optimisticThreads({
            type: 'addTag',
            chatId,
            tag,
          });
        });
      } catch (error) {
        console.error('handleAddTagToChat error:', error);
      }
    },
    [optimisticThreads],
  );

  const handleRemoveTagFromChat = useCallback(
    (chatId: string, tagId: string) => {
      try {
        startTransition(() => {
          optimisticThreads({
            type: 'removeTag',
            chatId,
            tagId,
          });
        });
      } catch (error) {
        console.error('handleRemoveTagFromChat error:', error);
      }
    },
    [optimisticThreads],
  );

  const isLoadingMore = allChats.length > 0 && isLoadingThreads && !searchTerm;

  const isInitialLoading =
    sessionStatus === 'loading' ||
    (!initialData && isLoadingThreads && stableThreads.length === 0);

  const { t } = useLanguage();

  if (!user && sessionStatus !== 'loading') {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            {/* TODO: add translation */}
            Login to save and revisit previous chats!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isInitialLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 py-4 flex flex-col gap-2 justify-center">
            {/* TODO: change to skeletons */}
            <Skeleton className="size-4 w-full h-8 opacity-12" />
            <Skeleton className="size-4 w-full h-8 opacity-12" />
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const hasEmptyContent =
    !isLoadingThreads && allChats.length === 0 && folders.length === 0;

  if (hasEmptyContent) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-pink-700 dark:text-pink-300">
              {/* TODO: add translation */}
              {t('navigation.messages.noChats')}
            </p>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <div
      className="flex flex-col gap-2 overflow-y-auto pr-1"
      onScroll={handleScroll}
    >
      {/* Folders Section - only render if there are folders */}
      {folders.length > 0 && (
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="py-1 text-pink-700 dark:text-pink-300/80 font-medium text-xs sm:text-sm">
            {/* TODO: add translation */}
            {t('navigation.history.folders')} ({folders.length})
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {folders.map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  isExpanded={!!expandedFolders[folder.id]}
                  onToggle={() => toggleFolder(folder.id)}
                  onDelete={() => {
                    /* Handle folder delete */
                  }}
                  colorAccents={colorAccents}
                  allThreads={allThreadsOptimistic}
                  onMoveToFolder={handleMoveToFolder}
                  onRemoveFromFolder={handleRemoveFromFolder}
                  onAddTagToChat={handleAddTagToChat}
                  onRemoveTagFromChat={handleRemoveTagFromChat}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Unfiled Chats Section */}
      {unfiledChats.length > 0 && !searchTerm && (
        <UnfiledChatsList
          allChats={unfiledChats}
          allThreads={allThreadsOptimistic}
          onDeleteChat={onDeleteChatClick}
          colorAccents={colorAccents}
          onMoveToFolder={handleMoveToFolder}
          onRemoveFromFolder={handleRemoveFromFolder}
          onAddTagToChat={handleAddTagToChat}
          onRemoveTagFromChat={handleRemoveTagFromChat}
        />
      )}

      {/* Search Results Section */}
      {searchTerm && filteredSearchChats.length > 0 && (
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="py-1 text-pink-700 dark:text-pink-300/80 font-medium text-xs sm:text-sm">
            {/* TODO: add translation */}
            {t('navigation.history.searchResults')} (
            {filteredSearchChats.length})
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {filteredSearchChats.map((chat) => {
                // Find the corresponding thread to get tags
                const thread = allThreadsOptimistic.find(
                  (t) => t.id === chat.id,
                );
                return (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={isActiveChatId(chat.id)}
                    onDelete={onDeleteChatClick}
                    setOpenMobile={setOpenMobile}
                    tags={thread?.tags || []}
                    colorAccents={colorAccents}
                    onMoveToFolder={handleMoveToFolder}
                    onRemoveFromFolder={handleRemoveFromFolder}
                    onAddTagToChat={handleAddTagToChat}
                    onRemoveTagFromChat={handleRemoveTagFromChat}
                  />
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Loading więcej danych (infinite scroll) */}
      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <LoaderIcon className="size-4 animate-spin text-pink-500" />
        </div>
      )}

      {/* Empty States - tylko gdy nie mamy danych */}
      {!isLoadingThreads && allChats.length === 0 && !searchTerm && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-pink-700 dark:text-pink-300">
            No chats yet. Start a new conversation!
          </p>
        </div>
      )}

      {searchTerm && filteredSearchChats.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-pink-700 dark:text-pink-300">
            No chats matching &quot;{searchTerm}&quot;
          </p>
        </div>
      )}

      {/* Dialogs przeniesione do app-sidebar.tsx */}

      {/* Delete Chat Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialogs przeniesione do app-sidebar.tsx */}
    </div>
  );
}

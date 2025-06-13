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
  const folders = initialData?.folders || [];
  const tags = initialData?.tags || [];

  // UI States
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});
  const [deleteId, setDeleteId] = useState<string | null>(null); // State to hold chat ID to delete
  const [showDeleteDialog, setShowDeleteDialog] = useState(false); // State to control delete dialog visibility

  // Use external state from props (zarządzane w app-sidebar.tsx)
  const actualShowCreateFolderDialog = showCreateFolderDialog ?? false;
  const actualSetShowCreateFolderDialog =
    setShowCreateFolderDialog ?? (() => {});
  const actualShowCreateTagDialog = showCreateTagDialog ?? false;
  const actualSetShowCreateTagDialog = setShowCreateTagDialog ?? (() => {});

  // Sprawdź czy mamy dane z initialData
  const hasDataInCache = initialData?.threads && initialData.threads.length > 0;

  // SWR for all threads (includes chats with tags and folder data)
  const {
    data: allThreadsPages,
    size,
    setSize,
    isLoading: isLoadingThreads,
    mutate: mutateThreads,
  } = useSWRInfinite(
    (pageIndex, previousData) => {
      // Only fetch if user is logged in
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
      // Użyj dane z initialData jako fallbackData
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
      revalidateOnMount: !hasDataInCache, // Nie rewaliduj jeśli mamy dane w cache
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      revalidateIfStale: false,
      refreshInterval: 0,
    },
  );

  // Flatten all threads from SWR pages into a single array
  const allThreads = useMemo(() => {
    try {
      const threads = allThreadsPages
        ? allThreadsPages.flatMap((page) => page.threads || [])
        : [];
      return threads.filter((thread) => thread?.id); // Filter out invalid threads
    } catch (error) {
      console.error('Error flattening threads:', error);
      return [];
    }
  }, [allThreadsPages]);

  // Optimistic updates dla threads (chats)
  const [allThreadsOptimistic, optimisticThreads] = useOptimistic(
    allThreads || [],
    (
      state: SidebarThread[],
      action: {
        type:
          | 'moveToFolder'
          | 'removeFromFolder'
          | 'delete'
          | 'addTag'
          | 'removeTag';
        chatId: string;
        folderId?: string | null;
        folder?: { name: string; color: string } | null;
        tagId?: string;
        tag?: { id: string; label: string; color: string; userId: string };
      },
    ) => {
      if (!Array.isArray(state)) {
        console.warn('OptimisticThreads: state is not an array', state);
        return [];
      }

      try {
        switch (action.type) {
          case 'moveToFolder':
            return state.map((thread) =>
              thread.id === action.chatId
                ? {
                    ...thread,
                    folderId: action.folderId,
                    folder: action.folder,
                  }
                : thread,
            );
          case 'removeFromFolder':
            return state.map((thread) =>
              thread.id === action.chatId
                ? { ...thread, folderId: null, folder: null }
                : thread,
            );
          case 'delete':
            return state.filter((thread) => thread.id !== action.chatId);
          case 'addTag':
            return state.map((thread) =>
              thread.id === action.chatId && action.tag
                ? { ...thread, tags: [...(thread.tags || []), action.tag] }
                : thread,
            );
          case 'removeTag':
            return state.map((thread) =>
              thread.id === action.chatId
                ? {
                    ...thread,
                    tags: (thread.tags || []).filter(
                      (tag) => tag.id !== action.tagId,
                    ),
                  }
                : thread,
            );
          default:
            return state;
        }
      } catch (error) {
        console.error('OptimisticThreads reducer error:', error, {
          state,
          action,
        });
        return state;
      }
    },
  );

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
      // Wyczyść cache poprzedniego użytkownika
      clearLocalStorageByPrefix('sidebar_data_');
      clearLocalStorageByPrefix('cache_timestamp_');
      return;
    }

    // Zapisz dane do cache gdy się zmienią
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

  // Funkcja do dodawania nowego czatu do cache
  const addChatToCache = useCallback(
    (newChat: Chat) => {
      // Convert Chat to SidebarThread format
      const newThread: SidebarThread = {
        ...newChat,
        folder: null,
        tags: [],
      };

      mutateThreads((pages) => {
        if (!pages || pages.length === 0) {
          return [
            {
              threads: [newThread],
              folders: folders,
              tags: tags,
              hasMore: false,
            },
          ];
        }

        // Dodaj nowy thread na początek pierwszej strony
        const newPages = [...pages];
        newPages[0] = {
          ...newPages[0],
          threads: [newThread, ...newPages[0].threads],
        };

        return newPages;
      }, false); // false = nie rewaliduj

      // Zaktualizuj unified cache
      if (userId) {
        const updatedThreads = [newThread, ...allThreadsOptimistic];
        const cacheData = {
          threads: updatedThreads,
          folders: folders,
          tags: tags,
          hasMore: false,
        };
        setSidebarCache(userId, cacheData);
      }
    },
    [mutateThreads, folders, tags, allThreadsOptimistic, userId],
  );

  // Wyeksportuj funkcję poprzez ref callback (możemy to użyć później)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).addChatToSidebarCache = addChatToCache;
    }
  }, [addChatToCache]);

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

  const handleCreateFolder = async () => {
    // Placeholder - funkcjonalność przeniesiona do app-sidebar.tsx
    console.log(
      'handleCreateFolder called - should be handled by app-sidebar.tsx',
    );
  };

  const handleCreateTag = async () => {
    // Placeholder - funkcjonalność przeniesiona do app-sidebar.tsx
    console.log(
      'handleCreateTag called - should be handled by app-sidebar.tsx',
    );
  };

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    // Placeholder - funkcjonalność przeniesiona do app-sidebar.tsx
    console.log(
      'handleDeleteFolder called - should be handled by app-sidebar.tsx',
    );
  };

  const confirmDeleteFolder = async () => {
    // Placeholder - funkcjonalność przeniesiona do app-sidebar.tsx
    console.log(
      'confirmDeleteFolder called - should be handled by app-sidebar.tsx',
    );
  };

  const handleDeleteTag = (tagId: string, tagLabel: string) => {
    // Placeholder - funkcjonalność przeniesiona do app-sidebar.tsx
    console.log(
      'handleDeleteTag called - should be handled by app-sidebar.tsx',
    );
  };

  const confirmDeleteTag = async () => {
    // Placeholder - funkcjonalność przeniesiona do app-sidebar.tsx
    console.log(
      'confirmDeleteTag called - should be handled by app-sidebar.tsx',
    );
  };

  // This handler is passed down to ChatItem to trigger the delete dialog
  const onDeleteChatClick = (chatId: string) => {
    setDeleteId(chatId);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    // This function executes the actual deletion after confirmation
    if (!deleteId) return;

    // Call Server Action:
    const deletePromise = deleteChatAction(deleteId); // --- CHANGED TO SERVER ACTION

    toast.promise(deletePromise, {
      loading: 'Deleting chat...',
      success: () => {
        // Optimistically update SWR cache for all threads (used by search and unfiled)
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

        // Nie pobieraj ponownie - dane folderów i tagów pozostają bez zmian
        // Usuwanie czatu nie wpływa na foldery ani tagi, więc cache pozostaje aktualny

        return 'Chat deleted successfully';
      },
      error: 'Failed to delete chat',
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
      console.log('handleMoveToFolder called:', {
        chatId,
        folderId,
        folderName,
        folderColor,
      });
      console.log('allThreads length:', allThreads?.length || 0);
      console.log('optimisticThreads type:', typeof optimisticThreads);

      try {
        // Optimistic update UI natychmiast
        startTransition(() => {
          optimisticThreads({
            type: 'moveToFolder',
            chatId,
            folderId,
            folder: { name: folderName, color: folderColor },
          });
        });
        console.log('optimisticThreads call succeeded');
      } catch (error) {
        console.error('handleMoveToFolder error:', error);
        console.error(
          'Error stack:',
          error instanceof Error ? error.stack : 'Unknown error',
        );
      }
    },
    [optimisticThreads, allThreads],
  );

  const handleRemoveFromFolder = useCallback(
    (chatId: string) => {
      try {
        // Optimistic update UI natychmiast
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
        // Optimistic update UI natychmiast
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
        // Optimistic update UI natychmiast
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

  // Sprawdź czy ładujemy dodatkowe dane (infinite scroll)
  const isLoadingMore = allChats.length > 0 && isLoadingThreads && !searchTerm;

  // Sprawdź czy mamy jeszcze stan ładowania (bez danych z SSR lub cache)
  const isInitialLoading =
    sessionStatus === 'loading' ||
    (!initialData && isLoadingThreads && allThreads.length === 0);

  if (!user && sessionStatus !== 'loading') {
    // Use the `user` prop from NextAuth session - tylko gdy session nie ładuje się
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Login to save and revisit previous chats!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // Pokaż loading podczas ładowania sesji lub początkowych danych
  if (isInitialLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 py-4 flex justify-center">
            <LoaderIcon className="size-4 animate-spin text-pink-500" />
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // If no content, show prompt to create - tylko gdy na pewno załadowane
  const hasEmptyContent =
    !isLoadingThreads && allChats.length === 0 && folders.length === 0;

  if (hasEmptyContent) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-pink-700 dark:text-pink-300">
              No chats yet. Start a new conversation!
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
            Folders ({folders.length})
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
            Search Results ({filteredSearchChats.length})
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

// components/SidebarHistory.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  SidebarGroupLabel,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { LoaderIcon } from 'lucide-react';
import useSWRInfinite from 'swr/infinite';
import { useSWRConfig } from 'swr';
import { useSession } from 'next-auth/react';

import type { Chat, Folder, Tag as TagType } from '@/lib/db/schema';
import {
  deleteChatAction,
  addChatToFolderAction,
  removeChatFromFolderAction,
  addTagToChatAction,
  removeTagFromChatAction,
} from '@/app/(chat)/actions';
import { FolderItem } from './folder-item';
import { UnfiledChatsList } from './unfilled-chats';
import { ChatItem } from './chat-item';
import { useLanguage } from '@/hooks/use-language';
import { Skeleton } from '@/components/ui/skeleton';

/* ───────────────────────── CONSTANTS ───────────────────────── */

const PAGE_SIZE = 20;

interface SidebarThread extends Chat {
  folder: { name: string; color: string } | null;
  tags: Array<{ id: string; label: string; color: string; userId: string }>;
}

interface InitialData {
  threads: SidebarThread[];
  folders: Folder[];
  tags: TagType[];
  hasMore: boolean;
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

/* ───── SWR-based simple state management ───── */

function useSidebarThreads(userId?: string, initialData?: InitialData) {
  const hasCached = initialData?.threads?.length;

  const {
    data: pages,
    size,
    setSize,
    isLoading,
    mutate,
  } = useSWRInfinite(
    (index, prev) => {
      if (!userId) return null;
      if (prev && !prev.hasMore) return null;
      const last = prev?.threads.at(-1)?.id || '';
      return index === 0 && !last
        ? `/api/threads?limit=${PAGE_SIZE}`
        : `/api/threads?limit=${PAGE_SIZE}&ending_before=${last}`;
    },
    (url) => fetch(url).then((r) => r.json()),
    {
      fallbackData: hasCached
        ? [
            {
              threads: initialData?.threads || [],
              folders: initialData?.folders || [],
              tags: initialData?.tags || [],
              hasMore: initialData?.hasMore || false,
            },
          ]
        : undefined,
      revalidateOnMount: !hasCached,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  );

  const threads: SidebarThread[] = useMemo(
    () => (pages ? pages.flatMap((p) => p.threads) : []),
    [pages],
  );

  return { threads, isLoading, mutate, setSize, size };
}

/* ====================================================================== */
/*                                COMPONENT                               */
/* ====================================================================== */

export function SidebarHistory({
  user,
  searchTerm = '',
  initialData,
}: {
  user: User | undefined;
  searchTerm?: string;
  initialData?: InitialData;
}) {
  const router = useRouter();
  const params = useParams();
  const { setOpenMobile } = useSidebar();
  const { mutate: mutateGlobal } = useSWRConfig();
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id;

  /* ---------- SWR: paginated threads ---------- */
  const { threads, isLoading, mutate, setSize, size } = useSidebarThreads(
    userId,
    initialData,
  );

  /* ---------- simple helper functions ---------- */
  const addNewChatOptimistic = useCallback(
    (chatId: string, title: string) => {
      // Just revalidate, no optimistic updates
      mutate();
    },
    [mutate],
  );

  const addChatToCache = useCallback(
    async (chat: Chat) => {
      // Just revalidate to get fresh data from server
      await mutate();
    },
    [mutate],
  );

  // Folder management functions
  const moveChatToFolder = useCallback(
    async (chatId: string, folderId: string | null) => {
      console.log('Moving chat to folder:', { chatId, folderId });

      try {
        if (folderId) {
          // Add to folder
          await addChatToFolderAction({ chatId, folderId });
        } else {
          // Remove from folder
          await removeChatFromFolderAction(chatId);
        }

        console.log('Chat moved successfully, revalidating...');

        // Force revalidate all SWR data - multiple approaches to ensure it works
        await mutate();

        // Invalidate all thread-related cache keys
        await mutateGlobal(
          (key) => typeof key === 'string' && key.includes('/api/threads'),
          undefined,
          { revalidate: true },
        );

        // Also try direct cache invalidation
        await mutateGlobal('/api/threads');

        // Small delay to ensure server state is updated
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Force one more revalidation after delay
        await mutate();

        console.log('Revalidation complete');

        toast.success(
          folderId ? 'Chat moved to folder' : 'Chat removed from folder',
        );
      } catch (error) {
        console.error('Failed to move chat:', error);
        toast.error('Failed to move chat');
      }
    },
    [mutate, mutateGlobal],
  );

  const removeChatFromFolder = useCallback(
    async (chatId: string) => {
      return moveChatToFolder(chatId, null);
    },
    [moveChatToFolder],
  );

  // Tag management functions
  const addTagToChat = useCallback(
    async (chatId: string, tagId: string) => {
      console.log('Adding tag to chat:', { chatId, tagId });

      try {
        await addTagToChatAction({ chatId, tagId });

        // Aggressive revalidation
        await mutate();
        await mutateGlobal(
          (key) => typeof key === 'string' && key.includes('/api/threads'),
          undefined,
          { revalidate: true },
        );

        toast.success('Tag added to chat');
      } catch (error) {
        console.error('Failed to add tag:', error);
        toast.error('Failed to add tag');
      }
    },
    [mutate, mutateGlobal],
  );

  const removeTagFromChat = useCallback(
    async (chatId: string, tagId: string) => {
      console.log('Removing tag from chat:', { chatId, tagId });

      try {
        await removeTagFromChatAction({ chatId, tagId });

        // Aggressive revalidation
        await mutate();
        await mutateGlobal(
          (key) => typeof key === 'string' && key.includes('/api/threads'),
          undefined,
          { revalidate: true },
        );

        toast.success('Tag removed from chat');
      } catch (error) {
        console.error('Failed to remove tag:', error);
        toast.error('Failed to remove tag');
      }
    },
    [mutate, mutateGlobal],
  );

  // Generic refresh function for any sidebar updates
  const refreshSidebar = useCallback(async () => {
    console.log('Refreshing sidebar...');

    try {
      // Multiple revalidation strategies
      await mutate();

      // Invalidate all thread-related cache
      await mutateGlobal(
        (key) => typeof key === 'string' && key.includes('/api/threads'),
        undefined,
        { revalidate: true },
      );

      // Force refresh specific endpoints
      await mutateGlobal('/api/threads');
      await mutateGlobal('/api/folders');
      await mutateGlobal('/api/tags');

      console.log('Sidebar refresh complete');
    } catch (error) {
      console.error('Failed to refresh sidebar:', error);
    }
  }, [mutate, mutateGlobal]);

  /* ---------- expose helpers to window for Chat component ---------- */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Chat management
      (window as any).addNewChatOptimistic = addNewChatOptimistic;
      (window as any).addChatToSidebarCache = addChatToCache;

      // Folder management
      (window as any).moveChatToFolder = moveChatToFolder;
      (window as any).removeChatFromFolder = removeChatFromFolder;

      // Tag management
      (window as any).addTagToChat = addTagToChat;
      (window as any).removeTagFromChat = removeTagFromChat;

      // Generic refresh
      (window as any).refreshSidebar = refreshSidebar;
    }

    // Cleanup on unmount to prevent memory leaks
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).addNewChatOptimistic = undefined;
        (window as any).addChatToSidebarCache = undefined;
        (window as any).moveChatToFolder = undefined;
        (window as any).removeChatFromFolder = undefined;
        (window as any).addTagToChat = undefined;
        (window as any).removeTagFromChat = undefined;
        (window as any).refreshSidebar = undefined;
      }
    };
  }, [
    addNewChatOptimistic,
    addChatToCache,
    moveChatToFolder,
    removeChatFromFolder,
    addTagToChat,
    removeTagFromChat,
    refreshSidebar,
  ]);

  /* ---------- derived lists ---------- */
  const allChats: Chat[] = useMemo(
    () => threads.map(({ folder, tags, ...rest }) => rest),
    [threads],
  );

  const unfiledChats = useMemo(
    () =>
      !searchTerm.trim()
        ? allChats.filter((c) => c.folderId === null)
        : ([] as Chat[]),
    [allChats, searchTerm],
  );

  const filteredSearchChats = useMemo(
    () =>
      searchTerm.trim()
        ? allChats.filter((c) =>
            c.title.toLowerCase().includes(searchTerm.toLowerCase()),
          )
        : ([] as Chat[]),
    [allChats, searchTerm],
  );

  /* ---------- UI state ---------- */
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  /* ---------- delete chat ---------- */
  const handleDelete = async () => {
    if (!deleteId) return;

    const chatIdToDelete = deleteId;

    try {
      // Server action
      await deleteChatAction(chatIdToDelete);

      // Revalidate to get fresh data
      await mutate();

      toast.success('Chat deleted');
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast.error('Failed to delete chat');
    }

    setShowDeleteDialog(false);
    if (chatIdToDelete === params?.id) router.push('/');
    setDeleteId(null);
  };

  /* ---------- render guards ---------- */
  const { t } = useLanguage();
  const isInitial =
    sessionStatus === 'loading' ||
    (!initialData && isLoading && threads.length === 0);

  if (!user && sessionStatus !== 'loading') {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 py-4 text-center text-sm text-zinc-500">
            Login to save and revisit previous chats!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isInitial) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 py-4 flex flex-col gap-2">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-full" />
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  /* ---------- RENDER ---------- */
  return (
    <div className="flex flex-col gap-2 overflow-y-auto pr-1">
      {/* Folders */}
      {initialData?.folders.length ? (
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="py-1 text-xs font-medium text-pink-700 dark:text-pink-300/80">
            {t('navigation.history.folders')} ({initialData.folders.length})
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {initialData.folders.map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  isExpanded={!!expandedFolders[folder.id]}
                  onToggle={() =>
                    setExpandedFolders((p) => ({
                      ...p,
                      [folder.id]: !p[folder.id],
                    }))
                  }
                  onDelete={(chatId) => {
                    setDeleteId(chatId);
                    setShowDeleteDialog(true);
                  }}
                  colorAccents={colorAccents}
                  allThreads={threads}
                  onMoveToFolder={async (
                    chatId,
                    folderId,
                    folderName,
                    folderColor,
                  ) => {
                    try {
                      await moveChatToFolder(chatId, folderId);
                    } catch (error) {
                      console.error(
                        'Error in FolderItem onMoveToFolder:',
                        error,
                      );
                    }
                  }}
                  onRemoveFromFolder={removeChatFromFolder}
                  onAddTagToChat={async (chatId, tag) => {
                    try {
                      await addTagToChat(chatId, tag.id);
                    } catch (error) {
                      console.error(
                        'Error in FolderItem onAddTagToChat:',
                        error,
                      );
                    }
                  }}
                  onRemoveTagFromChat={removeTagFromChat}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ) : null}

      {/* Unfiled */}
      {unfiledChats.length && !searchTerm ? (
        <UnfiledChatsList
          allChats={unfiledChats}
          allThreads={threads}
          colorAccents={colorAccents}
          onDeleteChat={(chatId) => {
            setDeleteId(chatId);
            setShowDeleteDialog(true);
          }}
          onMoveToFolder={async (chatId, folderId, folderName, folderColor) => {
            try {
              await moveChatToFolder(chatId, folderId);
            } catch (error) {
              console.error('Error in UnfiledChatsList onMoveToFolder:', error);
            }
          }}
          onRemoveFromFolder={removeChatFromFolder}
          onAddTagToChat={async (chatId, tag) => {
            try {
              await addTagToChat(chatId, tag.id);
            } catch (error) {
              console.error('Error in UnfiledChatsList onAddTagToChat:', error);
            }
          }}
          onRemoveTagFromChat={removeTagFromChat}
        />
      ) : null}

      {/* Search results */}
      {searchTerm && filteredSearchChats.length ? (
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="py-1 text-xs font-medium text-pink-700 dark:text-pink-300/80">
            {t('navigation.history.searchResults')} (
            {filteredSearchChats.length})
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {filteredSearchChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={params?.id === chat.id}
                  setOpenMobile={setOpenMobile}
                  colorAccents={colorAccents}
                  onDelete={(chatId) => {
                    setDeleteId(chatId);
                    setShowDeleteDialog(true);
                  }}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ) : null}

      {/* Load more button / infinite scroll */}
      {allChats.length > 0 && !searchTerm && (
        <div className="flex justify-center py-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <LoaderIcon className="size-4 animate-spin text-pink-500" />
              Loading more chats...
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSize(size + 1)}
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 px-2 py-1"
            >
              Load more chats
            </button>
          )}
        </div>
      )}

      {/* Delete dialog */}
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
    </div>
  );
}

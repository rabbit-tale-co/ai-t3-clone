'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
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
import type { Chat } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { ChatItem } from './sidebar-history-item';
import useSWRInfinite from 'swr/infinite';
import { LoaderIcon } from './icons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';
import { useSWRConfig } from 'swr';

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

export interface ChatHistory {
  chats: Array<Chat>;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats,
  );
};

export const getChatHistoryPaginationKey = (
  pageIndex: number,
  previousData: { chats: Array<Chat>; hasMore: boolean } | null,
) => {
  if (previousData && !previousData.hasMore) return null;

  // Define correct url based on pagination params
  if (pageIndex === 0) {
    return `/api/history?limit=20`;
  }

  const lastId = previousData?.chats.slice(-1)[0]?.id || '';
  return `/api/history?ending_before=${lastId}&limit=20`;
};

export function SidebarHistory({
  user,
  searchTerm = '',
  renderActions,
}: {
  user: User | undefined;
  searchTerm?: string;
  renderActions?: (chatId: string) => React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams();
  const { setOpenMobile } = useSidebar();
  const { mutate } = useSWRConfig();
  const { data, size, setSize, error, isLoading } = useSWRInfinite(
    (pageIndex, previousData) => {
      // Check if user is not defined
      if (!user) return null;
      return getChatHistoryPaginationKey(pageIndex, previousData);
    },
    async (url) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch chat history');
        return response.json();
      } catch {
        // Just log the error and return empty result
        console.error('Failed to fetch chat history');
        return { chats: [], hasMore: false };
      }
    },
    {
      revalidateOnFocus: false,
      revalidateFirstPage: true,
    },
  );

  const chatHistory = useMemo(() => {
    if (!data) return [];
    return data.flatMap((page) => page.chats);
  }, [data]);

  // Filter chats based on searchTerm
  const filteredChats = useMemo(() => {
    if (!searchTerm.trim()) return chatHistory;
    return chatHistory.filter((chat) =>
      chat.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [chatHistory, searchTerm]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const isAtBottom =
      e.currentTarget.scrollHeight - e.currentTarget.scrollTop ===
      e.currentTarget.clientHeight;

    if (isAtBottom && data && data[data.length - 1]?.hasMore) {
      setSize(size + 1);
    }
  };

  const isActiveChatId = (id: string) => {
    return params?.id === id;
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const hasReachedEnd = data
    ? data.some((page) => page.hasMore === false)
    : false;

  const hasEmptyChatHistory = data
    ? data.every((page) => page.chats.length === 0)
    : false;

  const handleDelete = async () => {
    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Deleting chat...',
      success: () => {
        // Update the local cache to remove the deleted chat
        if (data) {
          mutate(
            (key) => typeof key === 'string' && key.startsWith('/api/history'),
            (chatHistories: any) => {
              if (!chatHistories) return chatHistories;

              return chatHistories.map((chatHistory: any) => ({
                ...chatHistory,
                chats: chatHistory.chats.filter(
                  (chat: Chat) => chat.id !== deleteId,
                ),
              }));
            },
            { revalidate: false },
          );
        }

        return 'Chat deleted successfully';
      },
      error: 'Failed to delete chat',
    });

    setShowDeleteDialog(false);

    if (deleteId === params?.id) {
      router.push('/');
    }
  };

  if (!user) {
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

  if (isLoading) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Today
        </div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                key={item}
                className="rounded-md h-8 flex gap-2 px-2 items-center"
              >
                <div
                  className="h-4 rounded-md flex-1 max-w-(--skeleton-width) bg-sidebar-accent-foreground/10"
                  style={
                    {
                      '--skeleton-width': `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (hasEmptyChatHistory) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Your conversations will appear here once you start chatting!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      {/* TODO: Add favorites */}
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarGroupLabel>Favorites</SidebarGroupLabel>
        </SidebarGroupContent>
      </SidebarGroup>
      {/* TODO: Add folders and tags  */}
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarGroupLabel>Chats ({filteredChats.length})</SidebarGroupLabel>
          <SidebarMenu>
            {filteredChats.length > 0 && (
              <div
                onScroll={handleScroll}
                className="flex flex-col gap-1 p-2 overflow-auto"
              >
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      'group relative rounded-md transition-colors border border-transparent',
                      isActiveChatId(chat.id)
                        ? 'bg-pink-500/20 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700'
                        : 'hover:bg-pink-100 dark:hover:bg-black/40 hover:border-pink-200 dark:hover:border-transparent',
                    )}
                  >
                    <Link
                      href={`/chat/${chat.id}`}
                      onClick={() => setOpenMobile(false)}
                      className="flex items-start p-2 gap-2"
                    >
                      <MessageSquare className="mt-0.5 size-4 text-pink-500 dark:text-pink-400" />
                      <div className="flex-1 min-w-0 pr-8">
                        <p className="text-sm font-medium truncate text-pink-900 dark:text-gray-100">
                          {chat.title}
                        </p>
                        <p className="text-xs text-pink-600 dark:text-pink-300/70 mt-0.5">
                          {new Date(chat.createdAt).toLocaleDateString() ===
                          new Date().toLocaleDateString()
                            ? new Date(chat.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : new Date(chat.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>

                    {renderActions?.(chat.id)}
                  </div>
                ))}
              </div>
            )}
          </SidebarMenu>

          {!hasReachedEnd && (
            <div className="p-2 text-zinc-500 dark:text-zinc-400 flex flex-row gap-2 items-center mt-8">
              <div className="animate-spin">
                <LoaderIcon />
              </div>
              <div>Loading Chats...</div>
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

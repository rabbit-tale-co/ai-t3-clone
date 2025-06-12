'use client';

import { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { MessageSquare, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Chat, Tag } from '@/lib/db/schema';
import { getTagsByChatIdAction } from '@/app/(chat)/actions';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
} from '@/components/icons';
import { useChatVisibility } from '@/hooks/use-chat-visibility';

const tagColors = {
  blue: 'bg-blue-500/20 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  purple:
    'bg-purple-500/20 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  green:
    'bg-green-500/20 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  orange:
    'bg-orange-500/20 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  pink: 'bg-pink-500/20 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  gray: 'bg-gray-500/20 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}

export const ChatItem = memo(
  function ChatItem({
    chat,
    isActive,
    onDelete,
    setOpenMobile,
  }: ChatItemProps) {
    const [chatTags, setChatTags] = useState<Tag[]>([]);
    const [loadingTags, setLoadingTags] = useState(false);
    const { visibilityType, setVisibilityType } = useChatVisibility({
      chatId: chat.id,
      initialVisibilityType: chat.visibility,
    });

    useEffect(() => {
      let mounted = true;
      const fetchTags = async () => {
        setLoadingTags(true);
        try {
          const tags = await getTagsByChatIdAction(chat.id);
          if (mounted) setChatTags(tags as Tag[]);
        } catch (error) {
          console.error(`Failed to fetch tags for chat ${chat.title}:`, error);
        } finally {
          if (mounted) setLoadingTags(false);
        }
      };
      fetchTags();
      return () => {
        mounted = false;
      };
    }, [chat.id]);

    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive}>
          <Link
            href={`/chat/${chat.id}`}
            onClick={() => setOpenMobile(false)}
            className="flex items-start p-2 gap-2 w-full"
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

              <div className="flex flex-wrap gap-1 mt-1">
                {loadingTags ? (
                  <span className="text-xs text-gray-500">Loading tags...</span>
                ) : chatTags.length > 0 ? (
                  chatTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className={cn(
                        'text-xs rounded-md border-transparent',
                        tagColors[tag.color as keyof typeof tagColors] ||
                          tagColors.gray,
                      )}
                    >
                      <Hash className="size-2.5 mr-1" />
                      {tag.label}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">No tags</span>
                )}
              </div>
            </div>
          </Link>
        </SidebarMenuButton>

        <DropdownMenu modal={true}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
              showOnHover={!isActive}
            >
              <MoreHorizontalIcon />
              <span className="sr-only">More</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                <ShareIcon />
                <span>Share</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    className="cursor-pointer flex-row justify-between"
                    onClick={() => setVisibilityType('private')}
                  >
                    <div className="flex flex-row gap-2 items-center">
                      <LockIcon size={12} />
                      <span>Private</span>
                    </div>
                    {visibilityType === 'private' ? (
                      <CheckCircleFillIcon />
                    ) : null}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer flex-row justify-between"
                    onClick={() => setVisibilityType('public')}
                  >
                    <div className="flex flex-row gap-2 items-center">
                      <GlobeIcon />
                      <span>Public</span>
                    </div>
                    {visibilityType === 'public' ? (
                      <CheckCircleFillIcon />
                    ) : null}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
              onSelect={() => onDelete(chat.id)}
            >
              <TrashIcon />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  },
  (prev, next) =>
    prev.chat.id === next.chat.id &&
    prev.isActive === next.isActive &&
    prev.onDelete === next.onDelete,
);

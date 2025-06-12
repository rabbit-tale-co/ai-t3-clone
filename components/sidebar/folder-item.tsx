import useSWRInfinite from 'swr/infinite';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChatItem } from './chat-item';
import { Button } from '../ui/button';
import { ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import type { Chat, Folder as FolderType } from '@/lib/db/schema';
import { getChatHistoryPaginationKey } from '@/lib/constants';

const folderColors = {
  blue: 'text-blue-600 dark:text-blue-400',
  purple: 'text-purple-600 dark:text-purple-400',
  green: 'text-green-600 dark:text-green-400',
  orange: 'text-orange-600 dark:text-orange-400',
  pink: 'text-pink-600 dark:text-pink-400',
  red: 'text-red-600 dark:text-red-400',
};

export function FolderItem({
  folder,
  isExpanded,
  onToggle,
  onDelete,
}: {
  folder: FolderType;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const params = useParams();
  const { setOpenMobile } = useSidebar();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);

  const currentChatId = params?.id as string | undefined;

  useEffect(() => {
    if (isExpanded && folder.id) {
      const fetchFolderChats = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/folder/${folder.id}/chats`);
          if (response.ok) {
            const data = await response.json();
            setChats(data.chats || []);
          }
        } catch (error) {
          console.error('Failed to fetch folder chats:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchFolderChats();
    }
  }, [isExpanded, folder.id]);

  return (
    <div className="mb-1">
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={onToggle}
          className="w-full flex items-center justify-between p-2 hover:bg-pink-100 dark:hover:bg-black/40 rounded-md"
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="size-4 text-pink-500 dark:text-pink-400" />
            ) : (
              <ChevronRight className="size-4 text-pink-500 dark:text-pink-400" />
            )}
            <Folder className={cn('size-4', folderColors.pink)} />
            <span className="text-sm font-medium text-pink-900 dark:text-gray-100">
              {folder.name}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {isExpanded && (
        <div className="pl-6 space-y-1 mt-1">
          {loading ? (
            <div className="flex justify-center py-2">
              <span className="text-xs text-pink-600 dark:text-pink-400">
                Loading...
              </span>
            </div>
          ) : chats.length > 0 ? (
            <div className="space-y-1">
              {chats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={currentChatId === chat.id}
                  onDelete={onDelete}
                  setOpenMobile={setOpenMobile}
                />
              ))}
            </div>
          ) : (
            <div className="py-2 px-2">
              <p className="text-xs text-pink-600/70 dark:text-pink-400/70 italic">
                No chats in this folder
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useParams } from 'next/navigation';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { ChatItem } from './chat-item';
import type { Chat } from '@/lib/db/schema';
import { useLanguage } from '@/hooks/use-language';

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

export function UnfiledChatsList({
  allChats,
  allThreads,
  onDeleteChat,
  onMoveToFolder,
  onRemoveFromFolder,
  onAddTagToChat,
  onRemoveTagFromChat,
  colorAccents,
}: {
  allChats: Chat[];
  allThreads?: SidebarThread[];
  onDeleteChat?: (chatId: string) => void;
  onMoveToFolder?: (
    chatId: string,
    folderId: string,
    folderName: string,
    folderColor: string,
  ) => void | Promise<void>;
  onRemoveFromFolder?: (chatId: string) => void;
  onAddTagToChat?: (
    chatId: string,
    tag: { id: string; label: string; color: string; userId: string },
  ) => void | Promise<void>;
  onRemoveTagFromChat?: (chatId: string, tagId: string) => void;
  colorAccents?: Record<
    string,
    {
      light: string;
      dark: string;
      border: string;
      accent: string;
    }
  >;
}) {
  const chats = allChats;
  const params = useParams();
  const { setOpenMobile } = useSidebar();

  const currentChatId = params?.id as string | undefined;

  const { t } = useLanguage();

  return (
    <SidebarGroup className="px-2">
      <SidebarGroupLabel className="py-1 text-pink-700 dark:text-pink-300/80 font-medium text-xs sm:text-sm">
        {t('navigation.history.chats')} ({chats.length})
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {chats.map((chat) => {
            // Find the corresponding thread to get tags
            const thread = allThreads?.find((t) => t.id === chat.id);
            return (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={currentChatId === chat.id}
                onDelete={onDeleteChat || (() => {})}
                setOpenMobile={setOpenMobile}
                tags={thread?.tags || []}
                colorAccents={colorAccents}
                onMoveToFolder={onMoveToFolder}
                onRemoveFromFolder={onRemoveFromFolder}
                onAddTagToChat={onAddTagToChat}
                onRemoveTagFromChat={onRemoveTagFromChat}
              />
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

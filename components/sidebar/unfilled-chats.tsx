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
export function UnfiledChatsList({
  allChats,
  onDeleteChat,
}: {
  allChats: Chat[];
  onDeleteChat?: (chatId: string) => void;
}) {
  const chats = allChats;
  const params = useParams();
  const { setOpenMobile } = useSidebar();

  const currentChatId = params?.id as string | undefined;

  return (
    <SidebarGroup className="px-2">
      <SidebarGroupLabel className="py-1 text-pink-700 dark:text-pink-300/80 font-medium text-xs sm:text-sm">
        Chats ({chats.length})
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {chats.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isActive={currentChatId === chat.id}
              onDelete={onDeleteChat || (() => {})}
              setOpenMobile={setOpenMobile}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

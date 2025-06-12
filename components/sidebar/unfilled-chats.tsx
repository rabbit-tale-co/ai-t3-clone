import useSWRInfinite from 'swr/infinite';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { ChatItem } from './chat-item';
import type { Chat } from '@/lib/db/schema';

export function UnfiledChatsList({ allChats }: { allChats: Chat[] }) {
  const chats = allChats;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Chats ({chats.length})</SidebarGroupLabel>
      <SidebarGroupContent>
        {chats.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
            isActive={false}
            onDelete={() => {}}
            setOpenMobile={() => {}}
          />
        ))}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

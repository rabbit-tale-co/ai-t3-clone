import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ChatItem } from './chat-item';
import { ChevronRight, FolderIcon } from 'lucide-react';
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { Chat, Folder as FolderType } from '@/lib/db/schema';

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

export function FolderItem({
  folder,
  isExpanded,
  onToggle,
  onDelete,
  colorAccents,
  allThreads = [],
  onMoveToFolder,
  onRemoveFromFolder,
  onAddTagToChat,
  onRemoveTagFromChat,
}: {
  folder: FolderType;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  colorAccents: Record<
    string,
    {
      light: string;
      dark: string;
      border: string;
      accent: string;
    }
  >;
  allThreads?: SidebarThread[];
  onMoveToFolder?: (
    chatId: string,
    folderId: string,
    folderName: string,
    folderColor: string,
  ) => void;
  onRemoveFromFolder?: (chatId: string) => void;
  onAddTagToChat?: (
    chatId: string,
    tag: { id: string; label: string; color: string; userId: string },
  ) => void;
  onRemoveTagFromChat?: (chatId: string, tagId: string) => void;
}) {
  const params = useParams();
  const { setOpenMobile } = useSidebar();

  const currentChatId = params?.id as string | undefined;

  const folderColor = folder.color || 'blue';
  const accentColor =
    colorAccents[folderColor as keyof typeof colorAccents] || colorAccents.blue;

  // Filtruj chaty lokalnie z allThreads zamiast robić API call
  const folderChats = useMemo(() => {
    return allThreads.filter((thread) => thread.folderId === folder.id);
  }, [allThreads, folder.id]);

  return (
    <SidebarMenuItem>
      <Collapsible
        open={isExpanded}
        onOpenChange={onToggle}
        className="group/collapsible [&[data-state=open]>button>div>svg:first-child]:rotate-90"
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="w-full flex items-center justify-between p-2 hover:bg-pink-100 dark:hover:bg-black/40 rounded-md">
            <div className="flex items-center gap-2">
              <ChevronRight className="size-4 text-pink-500 dark:text-pink-400 transition-transform " />
              <FolderIcon
                size={16}
                style={{
                  color: accentColor.accent,
                  fill: accentColor.accent,
                  fillOpacity: isExpanded ? 0.2 : 1,
                  stroke: accentColor.accent,
                  strokeOpacity: 1,
                }}
              />
              <span className="text-sm font-medium text-pink-900 dark:text-gray-100">
                {folder.name}
              </span>
            </div>
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub className="space-y-1 mt-1 mr-0">
            {folderChats.length > 0 ? (
              <div className="space-y-1">
                {folderChats.map((thread) => (
                  <ChatItem
                    key={thread.id}
                    chat={thread}
                    isActive={currentChatId === thread.id}
                    onDelete={onDelete}
                    setOpenMobile={setOpenMobile}
                    tags={thread.tags}
                    colorAccents={colorAccents}
                    onMoveToFolder={onMoveToFolder}
                    onRemoveFromFolder={onRemoveFromFolder}
                    onAddTagToChat={onAddTagToChat}
                    onRemoveTagFromChat={onRemoveTagFromChat}
                  />
                ))}
              </div>
            ) : (
              <div className="p-2">
                <p className="text-xs text-pink-600/70 dark:text-pink-400/70 italic">
                  No chats in this folder
                </p>
              </div>
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}

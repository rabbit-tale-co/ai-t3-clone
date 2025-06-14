'use client';

import { useState, useEffect, memo, } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Chat, Tag, Folder } from '@/lib/db/schema';
import {
  getTagsByChatIdAction,
  addChatToFolderAction,
  removeChatFromFolderAction,
  addTagToChatAction,
  removeTagFromChatAction,
  getFoldersByUserIdAction,
  getTagsByUserIdAction,
} from '@/app/(chat)/actions';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
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
  CheckCircleIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
  TagIcon,
  Hash,
  FolderIcon,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';

// Default color accents if not provided
const defaultColorAccents = {
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

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
  tags?: Tag[]; // Optional tags prop - if provided, won't fetch tags
  colorAccents?: Record<
    string,
    {
      light: string;
      dark: string;
      border: string;
      accent: string;
    }
  >;
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
}

export const ChatItem = memo(
  function ChatItem({
    chat,
    isActive,
    onDelete,
    setOpenMobile,
    tags: providedTags,
    colorAccents,
    onMoveToFolder,
    onRemoveFromFolder,
    onAddTagToChat,
    onRemoveTagFromChat,
  }: ChatItemProps) {
    const [chatTags, setChatTags] = useState<Tag[]>(providedTags || []);
    const [availableFolders, setAvailableFolders] = useState<Folder[]>([]);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const { visibilityType, setVisibilityType } = useChatVisibility({
      chatId: chat.id,
      initialVisibilityType: chat.visibility,
    });
    const { data: session } = useSession();
    const userId = session?.user?.id;

    // Use provided colorAccents or fallback to defaults
    const activeColorAccents = colorAccents || defaultColorAccents;

    // Function to get tag styles based on color with better contrast
    const getTagStyles = (tagColor: string) => {
      const colorInfo =
        activeColorAccents[tagColor as keyof typeof activeColorAccents] ||
        activeColorAccents.gray;

      // FIXME: use colorjs
      // Convert hex to rgba with opacity
      const hexToRgba = (hex: string, opacity: number) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return hex;
        const r = Number.parseInt(result[1], 16);
        const g = Number.parseInt(result[2], 16);
        const b = Number.parseInt(result[3], 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      };

      return {
        backgroundColor: hexToRgba(colorInfo.accent, 0.15),
        color: colorInfo.accent,
        borderColor: hexToRgba(colorInfo.accent, 0.3),
        fontWeight: '500',
      };
    };

    // Only fetch tags if not provided as props
    useEffect(() => {
      if (providedTags) {
        setChatTags(providedTags);
        return;
      }

      let mounted = true;
      const fetchTags = async () => {
        try {
          const tags = await getTagsByChatIdAction(chat.id);
          if (mounted) {
            setChatTags(tags as Tag[]);
          }
        } catch (error) {
          console.error(`Failed to fetch tags for chat ${chat.title}:`, error);
        }
      };
      fetchTags();
      return () => {
        mounted = false;
      };
    }, [chat.id, chat.title, providedTags]);

    const loadFoldersAndTags = async () => {
      if (!userId) return;

      setLoadingFolders(true);
      try {
        const folders = await getFoldersByUserIdAction(userId);
        const tags = await getTagsByUserIdAction(userId);
        setAvailableFolders(folders);
        setAvailableTags(tags);
      } catch (error) {
        console.error('Failed to load folders and tags:', error);
      } finally {
        setLoadingFolders(false);
      }
    };

    const handleAddToFolder = async (folderId: string) => {
      if (isProcessing) return;

      setIsProcessing(true);

      try {
        await addChatToFolderAction({ chatId: chat.id, folderId });

        // Revalidate sidebar after successful operation
        if (typeof window !== 'undefined' && (window as any).refreshSidebar) {
          await (window as any).refreshSidebar();
        }

        toast.success('Chat added to folder');
      } catch (error) {
        console.error('Failed to add chat to folder:', error);
        toast.error('Failed to add chat to folder');
      } finally {
        setIsProcessing(false);
      }
    };

    const handleRemoveFromFolder = async () => {
      if (isProcessing) return;

      console.log('Starting handleRemoveFromFolder for chat:', chat.id);
      setIsProcessing(true);

      try {
        console.log('Calling removeChatFromFolderAction...');
        await removeChatFromFolderAction(chat.id);
        console.log('removeChatFromFolderAction completed successfully');

        // Revalidate sidebar after successful operation
        console.log('Revalidating sidebar after removing from folder...');
        if (typeof window !== 'undefined' && (window as any).refreshSidebar) {
          console.log('Calling window.refreshSidebar...');
          await (window as any).refreshSidebar();
          console.log('window.refreshSidebar completed');
        } else {
          console.warn('refreshSidebar function not found on window');
        }

        toast.success('Chat removed from folder');
      } catch (error) {
        console.error('Failed to remove chat from folder:', error);
        toast.error('Failed to remove chat from folder');
      } finally {
        setIsProcessing(false);
      }
    };

    const handleAddTag = async (tagId: string) => {
      if (isProcessing) return;

      setIsProcessing(true);
      const tag = availableTags.find((t) => t.id === tagId);

      try {
        await addTagToChatAction({ chatId: chat.id, tagId });

        // Revalidate sidebar after successful operation
        if (typeof window !== 'undefined' && (window as any).refreshSidebar) {
          await (window as any).refreshSidebar();
        }

        // Update local state with fresh data from server
        const updatedTags = await getTagsByChatIdAction(chat.id);
        setChatTags(updatedTags as Tag[]);

        toast.success('Tag added to chat');
      } catch (error) {
        console.error('Failed to add tag to chat:', error);
        toast.error('Failed to add tag to chat');
      } finally {
        setIsProcessing(false);
      }
    };

    const handleRemoveTag = async (tagId: string) => {
      if (isProcessing) return;

      setIsProcessing(true);

      try {
        await removeTagFromChatAction({ chatId: chat.id, tagId });

        // Revalidate sidebar after successful operation
        if (typeof window !== 'undefined' && (window as any).refreshSidebar) {
          await (window as any).refreshSidebar();
        }

        // Update local state with fresh data from server
        const updatedTags = await getTagsByChatIdAction(chat.id);
        setChatTags(updatedTags as Tag[]);

        toast.success('Tag removed from chat');
      } catch (error) {
        console.error('Failed to remove tag from chat:', error);
        toast.error('Failed to remove tag from chat');
      } finally {
        setIsProcessing(false);
      }
    };

    const { t } = useLanguage();

    return (
      <>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={isActive}
            className={cn(
              'relative p-2 h-auto rounded-md transition-colors border border-transparent',
              isActive
                ? 'bg-pink-500/20 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700'
                : 'hover:bg-pink-100 dark:hover:bg-black/40 hover:border-pink-200 dark:hover:border-transparent',
            )}
          >
            <Link
              href={`/chat/${chat.id}`}
              onClick={() => setOpenMobile(false)}
              className="peer flex items-start space-x-1 flex-1 min-w-0"
            >
              {/* <MessageSquare className="size-3 sm:size-4 mt-1 text-pink-500 dark:text-pink-400" /> */}
              <div className="flex-1 min-w-0 pr-2">
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

                {chatTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {chatTags.map((tag) => (
                      <Badge
                        key={`chat-${chat.id}-tag-${tag.id}`}
                        variant="outline"
                        className="text-xs rounded-md border-transparent"
                        style={getTagStyles(tag.color)}
                      >
                        <Hash className="size-2.5 mr-1" />
                        {tag.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </SidebarMenuButton>

          <DropdownMenu
            modal={true}
            onOpenChange={(open) => {
              if (
                open &&
                availableFolders.length === 0 &&
                availableTags.length === 0
              ) {
                loadFoldersAndTags();
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction
                showOnHover={!isActive}
                // FIXME: remove outline and move to top
                className="size-7 p-0 text-pink-500 hover:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30"
              >
                <MoreHorizontalIcon size={16} />
                <span className="sr-only">{t('navigation.dropdown.more')}</span>
              </SidebarMenuAction>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="bottom" align="end" className="w-64 p-2">
              {/* Organization Section */}
              <div className="mb-3">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-2">
                  {t('navigation.dropdown.organization')}
                </div>

                {/* Current Status Display */}
                <div className="px-2 mb-2 space-y-1">
                  {chat.folderId && (
                    <div className="text-xs text-muted-foreground">
                      📁 {t('navigation.dropdown.currentlyInFolder')}
                    </div>
                  )}
                  {chatTags.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {/* FIXME: 's in english only */}
                      🏷️ {chatTags.length} {t('navigation.dropdown.tags')}{' '}
                      {chatTags.length > 1 ? 's' : ''}{' '}
                      {t('navigation.dropdown.assigned')}
                    </div>
                  )}
                </div>

                {/* Folder Management */}
                <div className="space-y-1">
                  {chat.folderId ? (
                    <DropdownMenuItem
                      className="cursor-pointer bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-md"
                      onClick={handleRemoveFromFolder}
                    >
                      <FolderIcon
                        size={16}
                        className="mr-2 text-amber-600 dark:text-amber-400"
                      />
                      <span className="text-amber-800 dark:text-amber-200">
                        {t('navigation.dropdown.removeFromFolder')}
                      </span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="cursor-pointer">
                        <FolderIcon
                          size={16}
                          className="mr-2 text-blue-600 dark:text-blue-400"
                        />
                        <span>{t('navigation.dropdown.moveToFolder')}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="w-56">
                          {loadingFolders ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              {t('navigation.dropdown.loadingFolders')}
                            </div>
                          ) : availableFolders.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              {t('navigation.dropdown.noFoldersAvailable')}
                            </div>
                          ) : (
                            availableFolders.map((folder) => (
                              <DropdownMenuItem
                                key={folder.id}
                                className="cursor-pointer"
                                onClick={() => handleAddToFolder(folder.id)}
                              >
                                <FolderIcon
                                  size={16}
                                  className="mr-2"
                                  style={{
                                    color: (
                                      activeColorAccents[
                                        folder.color as keyof typeof activeColorAccents
                                      ] || activeColorAccents.gray
                                    ).accent,
                                  }}
                                />
                                <span>{folder.name}</span>
                              </DropdownMenuItem>
                            ))
                          )}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  )}

                  {/* Tag Management */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer">
                      <TagIcon
                        size={16}
                        className="mr-2 text-purple-600 dark:text-purple-400"
                      />
                      <span>{t('navigation.dropdown.manageTags')}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="w-56 max-h-64 overflow-y-auto">
                        {loadingFolders ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            {t('navigation.dropdown.loadingTags')}
                          </div>
                        ) : availableTags.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            {t('navigation.dropdown.noTagsAvailable')}
                          </div>
                        ) : (
                          availableTags.map((tag) => {
                            const isAlreadyAdded = chatTags.some(
                              (t) => t.id === tag.id,
                            );
                            return (
                              <DropdownMenuItem
                                key={tag.id}
                                className={cn(
                                  'cursor-pointer flex items-center justify-between',
                                )}
                                onClick={() => {
                                  if (isAlreadyAdded) {
                                    handleRemoveTag(tag.id);
                                  } else {
                                    handleAddTag(tag.id);
                                  }
                                }}
                              >
                                <div className="flex items-center">
                                  <div className="mr-2 flex items-center">
                                    <Hash
                                      size={14}
                                      style={{
                                        color: (
                                          activeColorAccents[
                                            tag.color as keyof typeof activeColorAccents
                                          ] || activeColorAccents.gray
                                        ).accent,
                                      }}
                                    />
                                  </div>
                                  <span>{tag.label}</span>
                                </div>
                                {isAlreadyAdded && (
                                  <CheckCircleIcon
                                    size={14}
                                    className="text-green-500"
                                  />
                                )}
                              </DropdownMenuItem>
                            );
                          })
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </div>
              </div>

              {/* Sharing Section */}
              <div className="border-t pt-3 mb-3">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-2">
                  {t('navigation.dropdown.sharing')}
                </div>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer">
                    <ShareIcon
                      size={16}
                      className="mr-2 text-green-600 dark:text-green-400"
                    />
                    <span>{t('navigation.dropdown.visibility')}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {visibilityType === 'private'
                        ? t('navigation.dropdown.private')
                        : t('navigation.dropdown.public')}
                    </span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => setVisibilityType('private')}
                      >
                        <LockIcon size={16} className="mr-2 text-inherit" />
                        <span>{t('navigation.dropdown.private')}</span>
                        {visibilityType === 'private' && (
                          <CheckCircleIcon
                            size={16}
                            className="ml-auto text-green-500"
                          />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => setVisibilityType('public')}
                      >
                        <GlobeIcon size={16} className="mr-2 text-inherit" />
                        <span>{t('navigation.dropdown.public')}</span>
                        {visibilityType === 'public' && (
                          <CheckCircleIcon
                            size={16}
                            className="ml-auto text-green-500"
                          />
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </div>

              {/* Danger Zone */}
              <div className="border-t pt-2">
                <div className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide mb-2 px-2">
                  {t('navigation.dropdown.dangerZone')}
                </div>
                <DropdownMenuItem
                  className="cursor-pointer focus:bg-red-50 dark:focus:bg-red-900/20"
                  onSelect={() => onDelete(chat.id)}
                >
                  <TrashIcon size={16} className="mr-2 text-red-500" />
                  <span className="text-red-600 dark:text-red-400">
                    {t('navigation.dropdown.deleteChat')}
                  </span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </>
    );
  },
  (prev, next) =>
    prev.chat.id === next.chat.id &&
    prev.isActive === next.isActive &&
    prev.onDelete === next.onDelete,
);

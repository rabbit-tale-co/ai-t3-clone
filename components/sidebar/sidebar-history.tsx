// components/SidebarHistory.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import { useState, useMemo, useEffect } from 'react';
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
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { LoaderIcon, Hash, Folder as FolderIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useSWRInfinite from 'swr/infinite';
import { useSWRConfig } from 'swr';
import { useSession } from 'next-auth/react'; // For NextAuth session data

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// Import Drizzle schema types
import type { Chat, Folder, Tag as TagType } from '@/lib/db/schema';

// Import NEW Server Actions
import {
  createFolderAction, // Renamed from createFolder
  createTagAction, // Renamed from createTag
  getFoldersByUserIdAction, // Renamed from getFoldersByUserId
  getTagsByUserIdAction, // Renamed from getTagsByUserId
  deleteChatAction, // Renamed from deleteChatById
} from '@/app/(chat)/actions'; // --- CHANGED IMPORT PATH

// Import the new sub-components
import { FolderItem } from './folder-item';
import { UnfiledChatsList } from './unfilled-chats';
import { ChatItem } from './chat-item'; // Used for search results
import { getChatHistoryPaginationKey } from '@/lib/constants';

// --- CONSTANTS ---
const PAGE_SIZE = 20;

// --- COLOR MAPS (Moved outside to avoid re-renders) ---
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

const folderColors = {
  blue: 'text-blue-600 dark:text-blue-400',
  purple: 'text-purple-600 dark:text-purple-400',
  green: 'text-green-600 dark:text-green-400',
  orange: 'text-orange-600 dark:text-orange-400',
  pink: 'text-pink-600 dark:text-pink-400',
  red: 'text-red-600 dark:text-red-400',
};

export function SidebarHistory({
  user, // User from NextAuth session (passed as prop, assumed from layout.tsx)
  searchTerm = '',
  renderActions,
  showCreateFolderDialog,
  setShowCreateFolderDialog,
  showCreateTagDialog,
  setShowCreateTagDialog,
}: {
  user: User | undefined;
  searchTerm?: string;
  renderActions?: (chatId: string) => React.ReactNode;
  showCreateFolderDialog?: boolean;
  setShowCreateFolderDialog?: (show: boolean) => void;
  showCreateTagDialog?: boolean;
  setShowCreateTagDialog?: (show: boolean) => void;
}) {
  const router = useRouter();
  const params = useParams();
  const { setOpenMobile } = useSidebar();
  const { mutate } = useSWRConfig();
  const { data: session, status: sessionStatus } = useSession(); // Access NextAuth session

  // IMPORTANT: Use session.user.id directly as `userFromDatabase` hook is removed.
  // The `user` prop should ideally be `session.user` for consistency if coming from NextAuth.
  const userId = session?.user?.id;

  // States for fetched data
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [tags, setTags] = useState<TagType[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  // UI States
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});
  const [internalShowCreateFolderDialog, setInternalShowCreateFolderDialog] =
    useState(false);
  const [internalShowCreateTagDialog, setInternalShowCreateTagDialog] =
    useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('blue');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('gray');
  const [deleteId, setDeleteId] = useState<string | null>(null); // State to hold chat ID to delete
  const [showDeleteDialog, setShowDeleteDialog] = useState(false); // State to control delete dialog visibility

  // Use either external state or internal state for dialogs
  const actualShowCreateFolderDialog =
    showCreateFolderDialog ?? internalShowCreateFolderDialog;
  const actualSetShowCreateFolderDialog =
    setShowCreateFolderDialog ?? setInternalShowCreateFolderDialog;
  const actualShowCreateTagDialog =
    showCreateTagDialog ?? internalShowCreateTagDialog;
  const actualSetShowCreateTagDialog =
    setShowCreateTagDialog ?? setInternalShowCreateTagDialog;

  // SWR for all chats (primarily for global search and unfiled chats display)
  const {
    data: allChatsPages,
    size,
    setSize,
    isLoading: isLoadingChats,
  } = useSWRInfinite(getChatHistoryPaginationKey, async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch unfiled chats');
    return res.json();
  });

  const { isValidating: isValidatingChats } = useSWRInfinite(
    (pageIndex, previousData) => {
      // Only fetch if user is logged in
      if (!userId) return null;
      if (previousData && !previousData.hasMore) return null;

      const lastId = previousData?.chats.slice(-1)[0]?.id || '';
      return `/api/history?limit=${PAGE_SIZE}&ending_before=${lastId}`;
    },
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch chat history');
      return response.json();
    },
    {
      revalidateOnFocus: false,
      revalidateFirstPage: true,
    },
  );

  // Flatten all chats from SWR pages into a single array
  const allChats = useMemo(() => {
    return allChatsPages ? allChatsPages.flatMap((page) => page.chats) : [];
  }, [allChatsPages]);

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

  // Effect to fetch folders and tags on component mount or user ID change
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!userId) {
        // If user is not logged in, clear existing data and stop loading
        setFolders([]);
        setTags([]);
        return;
      }

      setLoadingFolders(true);
      try {
        // Call Server Action:
        const fetchedFolders = await getFoldersByUserIdAction(userId);
        setFolders(fetchedFolders);
      } catch (error) {
        console.error('Failed to fetch folders:', error);
        toast.error('Failed to load folders');
      } finally {
        setLoadingFolders(false);
      }

      setLoadingTags(true);
      try {
        // Call Server Action:
        const fetchedTags = await getTagsByUserIdAction(userId);
        setTags(fetchedTags as TagType[]);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
        toast.error('Failed to load tags');
      } finally {
        setLoadingTags(false);
      }
    };

    fetchInitialData();
  }, [userId]); // Re-fetch when userId (from session) changes

  // Handle infinite scroll for global chat history/search
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const isAtBottom =
      e.currentTarget.scrollHeight - e.currentTarget.scrollTop ===
      e.currentTarget.clientHeight;

    if (
      isAtBottom &&
      allChatsPages &&
      allChatsPages[allChatsPages.length - 1]?.hasMore &&
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
    if (!newFolderName.trim()) {
      toast.error('Folder name cannot be empty');
      return;
    }
    if (!userId) {
      toast.error('User not logged in');
      return;
    }

    try {
      // Call Server Action:
      const createdFolder = await createFolderAction({
        // Returns single Folder object
        name: newFolderName,
        userId: userId,
        color: newFolderColor,
      });
      if (createdFolder) {
        setFolders((prev) => [...prev, createdFolder]); // Add new folder to state
        setNewFolderName('');
        setNewFolderColor('blue');
        actualSetShowCreateFolderDialog(false);
        setExpandedFolders((prev) => ({
          ...prev,
          [createdFolder.id]: true, // Expand the newly created folder
        }));
        toast.success('Folder created successfully!');
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
      toast.error('Failed to create folder');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Tag name cannot be empty');
      return;
    }
    if (!userId) {
      toast.error('User not logged in');
      return;
    }

    try {
      // Call Server Action:
      const createdTag = await createTagAction({
        // Returns single Tag object
        label: newTagName,
        color: newTagColor,
        userId: userId,
      });
      if (createdTag) {
        setTags((prev) => [...prev, createdTag]); // Add new tag to state
        setNewTagName('');
        setNewTagColor('gray');
        actualSetShowCreateTagDialog(false);
        toast.success('Tag created successfully!');
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
      toast.error('Failed to create tag');
    }
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
        // Optimistically update SWR cache for all chats (used by search and unfiled)
        mutate(
          (key) => typeof key === 'string' && key.startsWith('/api/history'),
          (chatHistories: any) => {
            if (!chatHistories) return chatHistories;

            return chatHistories.map((chatHistoryPage: any) => ({
              ...chatHistoryPage,
              chats: chatHistoryPage.chats.filter(
                (chat: Chat) => chat.id !== deleteId,
              ),
            }));
          },
          { revalidate: false },
        );

        // Also, re-fetch folders and tags to ensure counts/associations are correct
        // Call Server Actions:
        if (userId) {
          getFoldersByUserIdAction(userId).then(setFolders);
          getTagsByUserIdAction(userId).then((t) => setTags(t as TagType[]));
        }

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

  // Adjusted logic for empty states: check if there are any chats OR folders OR tags
  const hasEmptyContent =
    allChats.length === 0 && folders.length === 0 && tags.length === 0;

  if (!user) {
    // Use the `user` prop from NextAuth session
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

  // Combined loading state for initial load
  // `userLoading` (from useUser) is removed since we're using session.user.id
  if (
    sessionStatus === 'loading' ||
    isLoadingChats ||
    loadingFolders ||
    loadingTags
  ) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          Loading...
        </div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                key={item}
                className="rounded-md h-8 flex gap-2 px-2 items-center"
              >
                <div
                  className="h-4 rounded-md flex-1 max-w-[var(--skeleton-width)] bg-sidebar-accent-foreground/10"
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

  // If no content, show prompt to create
  if (hasEmptyContent) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Create folders, tags, and start chatting to organize your
            conversations!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      {/* Search results, if any */}
      {searchTerm && filteredSearchChats.length > 0 && (
        <SidebarGroup>
          <SidebarGroupContent>
            <h3 className="text-xs font-semibold px-2 pb-1 text-pink-700 dark:text-pink-300">
              Search Results
            </h3>
            <div className="flex flex-col gap-1 overflow-auto max-h-96">
              {filteredSearchChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isActive={false}
                  onDelete={() => {}}
                  setOpenMobile={() => {}}
                />
              ))}
              {isLoadingChats && !isValidatingChats && (
                <div className="flex justify-center py-2">
                  <LoaderIcon className="animate-spin" />
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Tags section - display all tags */}
      {tags.length > 0 && !searchTerm && (
        <SidebarGroup>
          <SidebarGroupContent>
            <h3 className="text-xs font-semibold px-2 pb-1 text-pink-700 dark:text-pink-300">
              Tags
            </h3>
            <div className="flex flex-wrap gap-1 px-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className={cn(
                    'text-xs rounded-md border-transparent cursor-pointer',
                    tagColors[tag.color as keyof typeof tagColors] ||
                      tagColors.gray,
                  )}
                  onClick={() => {
                    // Implement tag filtering logic here
                    // e.g., router.push(`/chats?tag=${tag.id}`);
                    toast.info(`Filtering by tag: ${tag.label}`);
                  }}
                >
                  <Hash className="size-2.5 mr-1" />
                  {tag.label}
                </Badge>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Folders with Chats */}
      {folders.length > 0 &&
        !searchTerm &&
        folders.map((folder) => (
          <SidebarGroup key={folder.id}>
            <SidebarGroupContent>
              <FolderItem expanded={expandedFolders[folder.id]} />
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

      {/* Unfiled Chats as a separate section */}
      {allChats.length > 0 && !searchTerm && (
        <SidebarGroup>
          <SidebarGroupContent>
            <UnfiledChatsList allChats={allChats} />
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Delete Confirmation Dialog */}
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
            <AlertDialogAction
              onClick={() => {
                handleDelete();
                setShowDeleteDialog(false);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Folder Dialog */}
      <Dialog
        open={actualShowCreateFolderDialog}
        onOpenChange={actualSetShowCreateFolderDialog}
      >
        <DialogContent className="bg-gradient-to-br from-pink-50 to-pink-100/80 dark:from-pink-950/90 dark:to-pink-900/60 border border-pink-200 dark:border-pink-800/50 backdrop-blur-md shadow-lg sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pink-900 dark:text-pink-100">
              Create new folder
            </DialogTitle>
            <DialogDescription className="text-pink-700 dark:text-pink-300">
              Add a new folder to organize your chats
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="folder-name"
                className="text-pink-800 dark:text-pink-200"
              >
                Folder Name
              </Label>
              <Input
                id="folder-name"
                placeholder="Work, Research, etc."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="bg-pink-50 dark:bg-black/40 border-pink-300 dark:border-pink-800/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-pink-800 dark:text-pink-200">
                Folder Color
              </Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(folderColors).map(([color]) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewFolderColor(color)}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2',
                      `bg-${color}-100 dark:bg-${color}-900/30`,
                      newFolderColor === color
                        ? `border-${color}-500 dark:border-${color}-400`
                        : 'border-transparent',
                    )}
                  >
                    <FolderIcon
                      className={`size-4 ${folderColors[color as keyof typeof folderColors]}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => actualSetShowCreateFolderDialog(false)}
              className="border border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Tag Dialog */}
      <Dialog
        open={actualShowCreateTagDialog}
        onOpenChange={actualSetShowCreateTagDialog}
      >
        <DialogContent className="bg-gradient-to-br from-pink-50 to-pink-100/80 dark:from-pink-950/90 dark:to-pink-900/60 border border-pink-200 dark:border-pink-800/50 backdrop-blur-md shadow-lg sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pink-900 dark:text-pink-100">
              Create new tag
            </DialogTitle>
            <DialogDescription className="text-pink-700 dark:text-pink-300">
              Add a new tag to categorize your chats
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="tag-name"
                className="text-pink-800 dark:text-pink-200"
              >
                Tag Name
              </Label>
              <Input
                id="tag-name"
                placeholder="ai, research, coding, etc."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="bg-pink-50 dark:bg-black/40 border-pink-300 dark:border-pink-800/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-pink-800 dark:text-pink-200">
                Tag Color
              </Label>
              <div className="flex gap-2">
                {Object.entries(tagColors).map(([color]) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2',
                      `bg-${color}-100 dark:bg-${color}-900/30`,
                      newTagColor === color
                        ? `border-${color}-500 dark:border-${color}-400`
                        : 'border-transparent',
                    )}
                  >
                    <Hash
                      className={`size-4 ${folderColors[color as keyof typeof folderColors]}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => actualSetShowCreateTagDialog(false)}
              className="border border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTag}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              Create Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogIn, X, Hash, Folder as FolderIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';

import { SidebarHistory } from '@/components/sidebar/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar/sidebar-user-nav';
import { ManageFoldersDialog } from '@/components/sidebar/manage-folders-dialog';
import { ManageTagsDialog } from '@/components/sidebar/manage-tags-dialog';
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
  createFolderAction,
  createTagAction,
  deleteFolderAction,
  deleteTagAction,
} from '@/app/(chat)/actions';
import { toast } from 'sonner';
import {
  getUserEntitlements,
  canCreateFolder,
  canCreateTag,
} from '@/lib/ai/entitlements';

import type { Session } from 'next-auth';
import type { Folder, Tag } from '@/lib/db/schema';
import Link from 'next/link';
import { useLanguage } from '@/hooks/use-language';

interface InitialData {
  threads: any[];
  folders: Folder[];
  tags: Tag[];
  hasMore: boolean;
}

interface AppSidebarProps {
  session?: Session | null;
  onNewChat?: () => void;
  onModalStateChange?: (isOpen: boolean) => void;
  currentChatId?: string;
  initialData?: InitialData;
}

export function AppSidebar({
  session,
  onNewChat,
  onModalStateChange,
  currentChatId,
  initialData,
  ...props
}: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const { data: sessionFromHook, status } = useSession();
  const userSession = session ?? sessionFromHook;
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { toggleSidebar, setOpenMobile } = useSidebar();
  const router = useRouter();

  const [showCreateFolderDialog, setShowCreateFolderDialog] =
    React.useState(false);
  const [showCreateTagDialog, setShowCreateTagDialog] = React.useState(false);

  // States for dialog content
  const [newFolderName, setNewFolderName] = React.useState('');
  const [newFolderColor, setNewFolderColor] = React.useState('blue');
  const [newTagName, setNewTagName] = React.useState('');
  const [newTagColor, setNewTagColor] = React.useState('gray');

  // States for folder and tag deletion
  const [deleteFolderId, setDeleteFolderId] = React.useState<string | null>(
    null,
  );
  const [deleteFolderName, setDeleteFolderName] = React.useState('');
  const [showDeleteFolderDialog, setShowDeleteFolderDialog] =
    React.useState(false);
  const [deleteTagId, setDeleteTagId] = React.useState<string | null>(null);
  const [deleteTagLabel, setDeleteTagLabel] = React.useState('');
  const [showDeleteTagDialog, setShowDeleteTagDialog] = React.useState(false);

  const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);
  const [isCreatingTag, setIsCreatingTag] = React.useState(false);

  const [folders, setFolders] = React.useState<Folder[]>(
    initialData?.folders || [],
  );
  const [tags, setTags] = React.useState<Tag[]>(initialData?.tags || []);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Folder name cannot be empty');
      return;
    }
    if (!userSession?.user?.id) {
      toast.error('User not logged in');
      return;
    }
    if (isCreatingFolder) {
      return;
    }

    const userType = userSession.user.type || 'guest';
    if (!canCreateFolder(userType, folders.length)) {
      const entitlements = getUserEntitlements(userType);
      // TODO: add translation
      toast.error(
        `You've reached your folder limit (${entitlements.maxFolders}). ${
          userType === 'guest'
            ? 'Sign up for more folders!'
            : 'Upgrade for more folders!'
        }`,
      );
      return;
    }

    setIsCreatingFolder(true);

    const tempFolder = {
      id: `temp-folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newFolderName,
      userId: userSession.user.id,
      color: newFolderColor || 'blue',
      createdAt: new Date(),
    } as Folder;

    setFolders((prev) => [...prev, tempFolder]);

    try {
      const createdFolder = await createFolderAction({
        name: tempFolder.name,
        userId: userSession.user.id,
        color: tempFolder.color || 'blue',
      });

      if (createdFolder) {
        setFolders((prev) =>
          prev.map((f) => (f.id === tempFolder.id ? createdFolder : f)),
        );

        setNewFolderName('');
        setNewFolderColor('blue');

        toast.success('Folder created successfully!');
      }
    } catch (error) {
      setFolders((prev) => prev.filter((f) => f.id !== tempFolder.id));
      console.error('Failed to create folder:', error);
      toast.error('Failed to create folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Tag name cannot be empty');
      return;
    }
    if (!userSession?.user?.id) {
      toast.error('User not logged in');
      return;
    }
    if (isCreatingTag) {
      return;
    }

    const userType = userSession.user.type || 'guest';
    if (!canCreateTag(userType, tags.length)) {
      const entitlements = getUserEntitlements(userType);
      // TODO: add translation
      toast.error(
        `You've reached your tag limit (${entitlements.maxTags}). ${
          userType === 'guest'
            ? 'Sign up for more tags!'
            : 'Upgrade for more tags!'
        }`,
      );
      return;
    }

    setIsCreatingTag(true);

    const tempTag = {
      id: `temp-tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: newTagName,
      color: newTagColor,
      userId: userSession.user.id,
    } as Tag;

    setTags((prev) => [...prev, tempTag]);

    try {
      const createdTag = await createTagAction({
        label: tempTag.label,
        color: tempTag.color,
        userId: userSession.user.id,
      });

      if (createdTag) {
        setTags((prev) =>
          prev.map((t) => (t.id === tempTag.id ? createdTag : t)),
        );

        setNewTagName('');
        setNewTagColor('gray');

        // TODO: add translation
        toast.success('Tag created successfully!');
      }
    } catch (error) {
      setTags((prev) => prev.filter((t) => t.id !== tempTag.id));
      console.error('Failed to create tag:', error);
      // TODO: add translation
      toast.error('Failed to create tag');
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleDeleteFolder = (folderId: string, folderName: string) => {
    setShowCreateFolderDialog(false);
    setDeleteFolderId(folderId);
    setDeleteFolderName(folderName);
    setShowDeleteFolderDialog(true);
  };

  const confirmDeleteFolder = async () => {
    if (!deleteFolderId) return;

    const folderToDelete = folders.find((f) => f.id === deleteFolderId);
    if (!folderToDelete) return;

    setFolders((prev) => prev.filter((f) => f.id !== deleteFolderId));

    setShowDeleteFolderDialog(false);
    setDeleteFolderId(null);
    setDeleteFolderName('');

    try {
      await deleteFolderAction(deleteFolderId);
      // TODO: add translation
      toast.success('Folder deleted successfully!');
    } catch (error) {
      setFolders((prev) => [...prev, folderToDelete]);
      console.error('Failed to delete folder:', error);
      // TODO: add translation
      toast.error('Failed to delete folder');
    }
  };

  const handleDeleteTag = (tagId: string, tagLabel: string) => {
    setShowCreateTagDialog(false);
    setDeleteTagId(tagId);
    setDeleteTagLabel(tagLabel);
    setShowDeleteTagDialog(true);
  };

  const confirmDeleteTag = async () => {
    if (!deleteTagId) return;

    const tagToDelete = tags.find((t) => t.id === deleteTagId);
    if (!tagToDelete) return;

    setTags((prev) => prev.filter((t) => t.id !== deleteTagId));

    setShowDeleteTagDialog(false);
    setDeleteTagId(null);
    setDeleteTagLabel('');

    try {
      await deleteTagAction(deleteTagId);
      // TODO: add translation
      toast.success('Tag deleted successfully!');
    } catch (error) {
      setTags((prev) => [...prev, tagToDelete]);
      console.error('Failed to delete tag:', error);
      // TODO: add translation
      toast.error('Failed to delete tag');
    }
  };

  const handleNewChat = async () => {
    router.push('/');
    if (onNewChat) {
      onNewChat();
    }
  };

  const { t } = useLanguage();

  return (
    <>
      <Sidebar
        {...props}
        className="bg-gradient-to-b from-pink-50 to-pink-100/60 dark:from-black/90 dark:via-pink-950/20 dark:to-black/95 border-pink-200 dark:border-pink-900/30 shadow-lg lg:backdrop-blur-0 backdrop-blur-md"
      >
        <SidebarHeader className="border-b border-pink-200 dark:border-pink-900/30 bg-white/80 dark:bg-black/40 backdrop-blur-sm shadow-sm">
          {/* Mobile & Tablet Header */}
          <div className="flex items-center justify-between lg:hidden p-0 pl-2">
            <Button
              onClick={toggleSidebar}
              variant="ghost"
              size="icon"
              className="text-pink-700 dark:text-pink-300 hover:text-pink-800 dark:hover:text-pink-200 hover:bg-pink-100 dark:hover:bg-black/40"
            >
              <X className="size-5" />
            </Button>
            <Button
              variant="ghost"
              className="rounded-full hover:!bg-transparent"
            >
              <h1 className="text-lg font-bold text-pink-900 dark:text-gray-100">
                {/* TODO: add translation */}
                {t('navigation.header.appName')}
              </h1>
            </Button>
            {/* <ThemeToggle /> */}
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between p-0 pl-2">
            <Button
              variant="ghost"
              className="rounded-full hover:!bg-transparent"
            >
              <h1 className="text-xl leading-none font-bold text-pink-900 dark:text-gray-100">
                {/* TODO: add translation */}
                {t('navigation.header.appName')}
              </h1>
            </Button>
            {/*
            <ThemeToggle /> */}
          </div>

          {/* New Chat Button */}
          <div className="p-2 sm:px-2">
            <Button onClick={handleNewChat} className="w-full">
              <span className="inline">{t('navigation.header.newChat')}</span>
            </Button>
          </div>

          {/* Search */}
          <div className="px-2 sm:px-2 pb-2">
            <Input
              placeholder={t('chat.input.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Organization Manager */}
          {userSession?.user && (
            <div className="px-2 pb-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateFolderDialog(true)}
                      >
                        <FolderIcon className="size-3 mr-1.5" />
                        <span className="text-xs">
                          {t('navigation.management.folders')}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-pink-50 dark:bg-black/90 border-pink-200 dark:border-pink-800/50 text-pink-700 dark:text-pink-300">
                      {t('navigation.management.manageFolders')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateTagDialog(true)}
                      >
                        <Hash className="size-3 mr-1.5" />
                        <span className="text-xs">
                          {t('navigation.management.tags')}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-pink-50 dark:bg-black/90 border-pink-200 dark:border-pink-800/50 text-pink-700 dark:text-pink-300">
                      {t('navigation.management.manageTags')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </SidebarHeader>

        <SidebarContent className="bg-gradient-to-b from-transparent to-pink-50/50 dark:from-transparent dark:to-black/20 overflow-y-auto lg:backdrop-blur-0 backdrop-blur-md">
          {userSession?.user ? (
            <SidebarHistory
              user={userSession.user}
              searchTerm={searchTerm}
              setShowCreateFolderDialog={setShowCreateFolderDialog}
              setShowCreateTagDialog={setShowCreateTagDialog}
              showCreateFolderDialog={showCreateFolderDialog}
              showCreateTagDialog={showCreateTagDialog}
              initialData={{
                threads: initialData?.threads || [],
                hasMore: initialData?.hasMore || false,
                folders: folders,
                tags: tags,
              }}
            />
          ) : (
            <SidebarGroup>
              <SidebarGroupLabel>
                {t('navigation.header.yourChats')}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-pink-700 dark:text-pink-300">
                    {t('navigation.messages.signInToSeeYourChatHistory')}
                  </p>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t border-pink-200 dark:border-pink-900/30 bg-white/80 dark:bg-black/40 backdrop-blur-md shadow-sm space-y-2 p-2 sm:p-4">
          {userSession?.user && userSession?.user?.type !== 'guest' ? (
            <SidebarUserNav user={userSession?.user} />
          ) : (
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/login">
                <LogIn size={16} />
                {t('auth.actions.login')}
              </Link>
            </Button>
          )}
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Dialogs rendered outside sidebar to avoid z-index issues */}
      {userSession?.user && (
        <>
          <ManageFoldersDialog
            open={showCreateFolderDialog}
            onOpenChange={setShowCreateFolderDialog}
            folders={folders}
            allThreads={[]} // Will be populated from SidebarHistory via props if needed
            newFolderName={newFolderName}
            setNewFolderName={setNewFolderName}
            newFolderColor={newFolderColor}
            setNewFolderColor={setNewFolderColor}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
            isCreating={isCreatingFolder}
            userType={userSession?.user?.type || 'guest'}
            colorAccents={{
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
            }}
          />

          <ManageTagsDialog
            open={showCreateTagDialog}
            onOpenChange={setShowCreateTagDialog}
            tags={tags}
            allThreads={[]} // Will be populated from SidebarHistory via props if needed
            newTagName={newTagName}
            setNewTagName={setNewTagName}
            newTagColor={newTagColor}
            setNewTagColor={setNewTagColor}
            onCreateTag={handleCreateTag}
            onDeleteTag={handleDeleteTag}
            isCreating={isCreatingTag}
            userType={userSession?.user?.type || 'guest'}
            colorAccents={{
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
            }}
          />

          {/* Delete Folder Confirmation Dialog */}
          <AlertDialog
            open={showDeleteFolderDialog}
            onOpenChange={setShowDeleteFolderDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('common.deleteFolder')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('common.areYouSureYouWantToDeleteFolder', {
                    folderName: deleteFolderName,
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteFolder}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t('common.deleteFolder')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Tag Confirmation Dialog */}
          <AlertDialog
            open={showDeleteTagDialog}
            onOpenChange={setShowDeleteTagDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('common.deleteTag')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('common.areYouSureYouWantToDeleteTag', {
                    tagName: deleteTagLabel,
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteTag}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t('common.deleteTag')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}

// Export the sidebar component for backward compatibility
export { AppSidebar as Sidebar };

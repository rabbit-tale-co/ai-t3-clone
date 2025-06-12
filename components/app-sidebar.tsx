'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Search, LogIn, X, Hash, PlusIcon } from 'lucide-react';
import { Folder as FolderIcon } from 'lucide-react';

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

import type { Session } from 'next-auth';
import type { Chat, Folder, Tag } from '@/lib/db/schema';
import Link from 'next/link';

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

  const handleNewChat = async () => {
    router.push('/');
    if (onNewChat) {
      onNewChat();
    }
  };

  const handleLoginModalToggle = (open: boolean) => {
    setShowLoginModal(open);
    if (onModalStateChange) {
      onModalStateChange(open);
    }
  };

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
            <h1 className="text-lg font-bold text-pink-900 dark:text-gray-100">
              T3 AI Chat
            </h1>
            <ThemeToggle />
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between p-0 pl-2">
            <h1 className="text-xl leading-none font-bold text-pink-900 dark:text-gray-100">
              T3 AI Chat
            </h1>

            <ThemeToggle />
          </div>

          {/* New Chat Button */}
          <div className="p-2 sm:px-2">
            <Button onClick={handleNewChat} className="w-full">
              <span className="inline">New Chat</span>
            </Button>
          </div>

          {/* Search */}
          <div className="px-2 sm:px-2 pb-2">
            <Input
              placeholder="Search..."
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
                        <span className="text-xs">Folders</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-pink-50 dark:bg-black/90 border-pink-200 dark:border-pink-800/50 text-pink-700 dark:text-pink-300">
                      Manage your folders
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
                        <span className="text-xs">Tags</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-pink-50 dark:bg-black/90 border-pink-200 dark:border-pink-800/50 text-pink-700 dark:text-pink-300">
                      Manage your tags
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
              initialData={initialData}
            />
          ) : (
            <SidebarGroup>
              <SidebarGroupLabel>Your Chats</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-pink-700 dark:text-pink-300">
                    Sign in to see your chat history
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
                Login
              </Link>
            </Button>
          )}
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>
    </>
  );
}

// Export the sidebar component for backward compatibility
export { AppSidebar as Sidebar };

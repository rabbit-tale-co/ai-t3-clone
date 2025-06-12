'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Search, LogIn, X, Folder, Hash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';

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
import { PlusIcon } from '@/components/icons';
import { User } from '@/lib/db/schema';

interface AppSidebarProps {
  session?: Session | null;
  onNewChat?: () => void;
  onModalStateChange?: (isOpen: boolean) => void;
  currentChatId?: string;
}

export function AppSidebar({
  session,
  onNewChat,
  onModalStateChange,
  currentChatId,
  ...props
}: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const { data: sessionFromHook, status } = useSession();
  const userSession = session ?? sessionFromHook;
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { toggleSidebar, setOpenMobile } = useSidebar();
  const router = useRouter();

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
          <div className="flex items-center justify-between px-3 py-2 lg:hidden">
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
          <div className="hidden lg:flex items-center justify-between px-2 py-1">
            <h1 className="text-xl leading-none font-bold text-pink-900 dark:text-gray-100">
              T3 AI Chat
            </h1>

            <ThemeToggle />
          </div>

          {/* New Chat Button */}
          <div className="p-2 sm:px-2">
            <Button
              onClick={handleNewChat}
              className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 dark:from-pink-600 dark:to-pink-700 dark:hover:from-pink-700 dark:hover:to-pink-800 text-white rounded-lg font-medium shadow-sm h-10 sm:h-auto"
            >
              <PlusIcon size={16} />
              <span className="inline">New Chat</span>
            </Button>
          </div>

          {/* Search */}
          <div className="px-2 sm:px-2 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-pink-500 dark:text-pink-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-pink-50 dark:bg-black/40 border-pink-300 dark:border-pink-800/50 text-pink-900 dark:text-gray-100 placeholder:text-pink-600/70 dark:placeholder:text-pink-400/70 focus:border-pink-500 dark:focus:border-pink-600 shadow-sm h-9 sm:h-auto text-sm"
              />
            </div>
          </div>

          {/* Folders and tags */}
          <div className="flex gap-2 px-2 pb-2">
            <Button variant="outline" className="w-full flex-1">
              <Folder className="size-4 mr-2" />
              <span>Folders</span>
            </Button>
            <Button variant="outline" className="w-full flex-1">
              <Hash className="size-4 mr-2" />
              <span>Tags</span>
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent className="bg-gradient-to-b from-transparent to-pink-50/50 dark:from-transparent dark:to-black/20 overflow-y-auto lg:backdrop-blur-0 backdrop-blur-md">
          {userSession?.user ? (
            <SidebarHistory
              user={userSession.user}
              searchTerm={searchTerm}
              setShowCreateFolderDialog={() => {}}
              setShowCreateTagDialog={() => {}}
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
          {status === 'loading' ? (
            // Loading state
            <div className="w-full h-10 bg-pink-100 dark:bg-black/20 rounded-md animate-pulse flex items-center justify-center">
              <span className="text-sm text-pink-600 dark:text-pink-400">
                Loading...
              </span>
            </div>
          ) : userSession?.user && userSession?.user?.type !== 'guest' ? (
            // Logged in user
            <SidebarUserNav user={userSession?.user} />
          ) : (
            // Not logged in
            <Button
              variant="ghost"
              onClick={() => handleLoginModalToggle(true)}
              className="w-full rounded-md text-pink-600 dark:text-pink-300 hover:text-pink-700 dark:hover:text-pink-200 hover:bg-pink-100 dark:hover:bg-black/40 justify-start border border-pink-200 dark:border-transparent h-10 sm:h-auto text-sm"
            >
              <LogIn className="size-4 mr-2" />
              <span>Login</span>
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

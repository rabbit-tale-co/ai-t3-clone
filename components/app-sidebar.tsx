'use client';

import * as React from 'react';
import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Search, X, MoreHorizontal, Trash, LogIn } from 'lucide-react';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { signIn, useSession } from 'next-auth/react';
import { UserType } from '@/app/(auth)/auth';
import { useMessageCount } from '@/hooks/use-message-count';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile, toggleSidebar } = useSidebar();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const { data: session } = useSession();
  const { messagesLeft } = useMessageCount(session);

  const handleNewChat = () => {
    setOpenMobile(false);
    router.push('/');
    router.refresh();
  };

  // This function would be connected to the real delete functionality
  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat?id=${chatId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Chat deleted successfully');

        // If we're on this chat's page, redirect to home
        const params = new URLSearchParams(window.location.search);
        const currentChatId = window.location.pathname.split('/').pop();

        if (currentChatId === chatId) {
          router.push('/');
        }

        // Force refresh the chat list
        window.location.reload();
      } else {
        toast.error('Failed to delete chat');
      }

      setChatToDelete(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const openDeleteDialog = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setChatToDelete(chatId);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Sidebar className="bg-gradient-to-b from-pink-50 to-pink-100/60 dark:from-black/90 dark:via-pink-950/20 dark:to-black/95 border-pink-200 dark:border-pink-900/30 shadow-lg lg:backdrop-blur-0 backdrop-blur-md">
        <SidebarHeader className="border-b border-pink-200 dark:border-pink-900/30 bg-white/80 dark:bg-black/40 backdrop-blur-sm shadow-sm">
          {/* Mobile & Tablet Header */}
          <div className="flex items-center justify-between px-3 py-2 lg:hidden">
            <Button
              onClick={toggleSidebar}
              variant="ghost"
              size="icon"
              className="text-pink-700 dark:text-pink-300 hover:text-pink-800 dark:hover:text-pink-200 hover:bg-pink-100 dark:hover:bg-black/40"
            >
              <X className="szie-5" />
            </Button>
            <h1 className="text-lg font-bold text-pink-900 dark:text-gray-100">
              AI Chat
            </h1>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between px-2 py-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl leading-none font-bold text-pink-900 dark:text-gray-100">
                AI Chat
              </h1>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-2">
            <Button
              onClick={handleNewChat}
              className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 dark:from-pink-600 dark:to-pink-700 dark:hover:from-pink-700 dark:hover:to-pink-800 text-white rounded-lg font-medium shadow-sm h-10 sm:h-auto"
            >
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
                className="pl-10 bg-pink-50 dark:bg-black/40 border-pink-300 dark:border-pink-800/50 text-pink-900 dark:text-gray-100 placeholder:text-pink-600/70 dark:placeholder:text-pink-400/70 focus:border-pink-500 dark:focus:border-pink-600 shadow-sm h-12 sm:h-auto text-sm"
              />
            </div>
            {/* Messages left counter */}
            {messagesLeft !== null && (
              <div className="mt-2 text-sm text-pink-700 dark:text-pink-300 px-3 text-center">
                <span className="font-medium">{messagesLeft}</span> messages
                left today
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="bg-gradient-to-b from-transparent to-pink-50/50 dark:from-transparent dark:to-black/20 overflow-y-auto lg:backdrop-blur-0 backdrop-blur-md">
          <SidebarHistory
            user={user}
            searchTerm={searchTerm}
            renderActions={(chatId) => (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity duration-200">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-6 p-0 hover:bg-pink-200 dark:hover:bg-pink-900/50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="size-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-40 bg-gradient-to-br from-pink-50 to-pink-100/80 dark:from-pink-950/90 dark:to-pink-900/60 border border-pink-200 dark:border-pink-800/50 backdrop-blur-md shadow-lg"
                  >
                    <DropdownMenuItem
                      className="text-xs text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/50 focus:bg-red-100 dark:focus:bg-red-900/50 rounded-md cursor-pointer"
                      onClick={(e) => openDeleteDialog(chatId, e)}
                    >
                      <Trash className="size-3 mr-2 text-red-600 dark:text-red-400" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          />
        </SidebarContent>

        <SidebarFooter className="border-t border-pink-200 dark:border-pink-900/30 bg-white/80 dark:bg-black/40 backdrop-blur-md shadow-sm p-2">
          {user && user.type !== 'guest' && <SidebarUserNav user={user} />}
          {user && user.type === 'guest' && (
            <Button
              variant="ghost"
              size="lg"
              className="w-full justify-start"
              onClick={() => router.push('/login')}
            >
              <LogIn className="size-4" />
              Login
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gradient-to-br from-pink-50 to-pink-100/80 dark:from-pink-950/90 dark:to-pink-900/60 border border-pink-200 dark:border-pink-800/50 backdrop-blur-md shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-pink-900 dark:text-pink-100">
              Delete Chat
            </AlertDialogTitle>
            <AlertDialogDescription className="text-pink-700 dark:text-pink-300">
              Are you sure you want to delete this chat? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => chatToDelete && handleDeleteChat(chatToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { entitlementsByUserType } from '@/lib/ai/entitlements';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [messagesLeft, setMessagesLeft] = useState<number | null>(null);

  useEffect(() => {
    const fetchMessagesCount = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/users/messages-count');
        if (response.ok) {
          const data = await response.json();
          const userType = user.type as 'guest' | 'regular';
          const maxMessages =
            entitlementsByUserType[userType].maxMessagesPerDay;
          setMessagesLeft(Math.max(0, maxMessages - data.count));
        }
      } catch (error) {
        console.error('Failed to fetch messages count', error);
      }
    };

    fetchMessagesCount();
  }, [user]);

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                Chatbot
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push('/');
                    router.refresh();
                  }}
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">New Chat</TooltipContent>
            </Tooltip>
          </div>
          {messagesLeft !== null && (
            <div className="mt-2 text-sm text-muted-foreground px-2">
              Left: <span className="font-medium">{messagesLeft}</span> messages
              today
            </div>
          )}
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}

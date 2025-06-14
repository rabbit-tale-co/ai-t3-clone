'use client';

import type { User } from 'next-auth';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LoaderIcon } from 'lucide-react';
import { guestRegex } from '@/lib/constants';
import { SettingsDialog } from '@/components/settings';

export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter();
  const { data, status } = useSession();

  const isGuest = guestRegex.test(data?.user?.email ?? '');

  // Loading state
  if (status === 'loading') {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent/30 data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg bg-zinc-500/30 animate-pulse">
                <LoaderIcon className="size-4 animate-spin" />
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium bg-zinc-500/30 text-transparent rounded animate-pulse">
                Loading user...
              </span>
              <span className="truncate text-xs bg-zinc-500/20 text-transparent rounded animate-pulse">
                Loading status...
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Guest user - redirect to login instead of opening settings
  if (isGuest) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent/30 data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            onClick={() => router.push('/login')}
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-300">
                G
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Guest User</span>
              <span className="truncate text-xs text-muted-foreground">
                Click to sign in
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Authenticated user - wrap in SettingsDialog
  return (
    <SettingsDialog
      user={{
        id: user.id || '',
        email: user.email || '',
        full_name: user.name || user.email?.split('@')[0] || 'User',
        avatar_url: user.image || `https://avatar.vercel.sh/${user.email}`,
        is_premium: user.type === 'pro',
        type: user.type,
      }}
    />
  );
}

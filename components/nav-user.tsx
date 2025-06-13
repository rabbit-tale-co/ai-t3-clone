'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface UserType {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  is_premium: boolean;
}

export function NavUser({
  user,
  ...props
}: {
  user: UserType | null;
} & React.ComponentProps<typeof SidebarMenu>) {
  // For guest users, show guest interface
  if (!user) {
    return (
      <SidebarMenu {...props}>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent/30 data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-300">
                G
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Guest User</span>
              <span className="truncate text-xs">5 requests/day</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu {...props}>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent/30 data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="size-8 rounded-lg">
            <AvatarImage src={user.avatar_url} alt={user.full_name} />
            <AvatarFallback className="rounded-lg">
              {user.full_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">
              {user.full_name || 'User'}
            </span>
            <span className="truncate text-xs">
              {user.is_premium ? 'Premium' : 'Free'}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

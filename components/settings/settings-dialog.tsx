'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useLanguage } from '@/hooks/use-language';
import { useMessageCount } from '@/hooks/use-message-count';
import { getUserEntitlements } from '@/lib/ai/entitlements';
import type { UserType as AuthUserType } from '@/app/(auth)/auth';
import { NavUser } from '../nav-user';
import { SettingsContent } from './settings-content';
import { useIsMobile } from '@/hooks/use-mobile';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  is_premium: boolean;
  type: AuthUserType;
}

export function SettingsDialog({ user }: { user: UserData }) {
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('account');
  const { t } = useLanguage();
  const { data: session } = useSession();
  const isMobile = useIsMobile();

  const {
    messagesLeft,
    messagesUsed,
    maxMessages,
    resetTime,
    status: messageCountStatus,
    refetch: refetchMessageCount,
  } = useMessageCount(session);

  // Refetch data when dialog opens or when switching to account tab
  React.useEffect(() => {
    if (open && refetchMessageCount) {
      refetchMessageCount();
    }
  }, [open, refetchMessageCount]);

  // Also refetch when switching to account tab (where token info is displayed)
  React.useEffect(() => {
    if (open && activeTab === 'account' && refetchMessageCount) {
      refetchMessageCount();
    }
  }, [activeTab, open, refetchMessageCount]);

  // Get user entitlements
  const entitlements = getUserEntitlements(user.type);
  const actualMessagesUsed = messagesUsed || 0;
  const actualMaxMessages = maxMessages || entitlements.maxMessagesPerDay;
  const usagePercentage =
    actualMaxMessages > 0 ? (actualMessagesUsed / actualMaxMessages) * 100 : 0;

  // Format reset time
  const formatResetTime = (resetTime: Date | null) => {
    if (!resetTime) return t('api.messages.resetsAt');

    const now = new Date();
    const isToday = resetTime.toDateString() === now.toDateString();
    const isTomorrow =
      resetTime.toDateString() ===
      new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

    const timeString = resetTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) {
      return `${t('api.messages.restartToday')} ${t('api.messages.at')} ${timeString}`;
    } else if (isTomorrow) {
      return `${t('api.messages.restartTomorrow')} ${t('api.messages.at')} ${timeString}`;
    } else {
      const dateString = resetTime.toLocaleDateString();
      return `${t('api.messages.restartOn')} ${dateString} ${t('api.messages.at')} ${timeString}`;
    }
  };

  const settingsProps = {
    user,
    activeTab,
    setActiveTab,
    setOpen,
    actualMessagesUsed,
    actualMaxMessages,
    usagePercentage,
    messagesLeft,
    messageCountStatus,
    formatResetTime,
    resetTime,
    entitlements,
  };

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <NavUser user={user} />
        </DialogTrigger>
        <DialogContent
          showCloseButton={false}
          className="w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-hidden
            bg-gradient-to-br from-pink-50/70 to-pink-100/60 dark:from-black/95 dark:to-pink-950/10
            border-pink-200/20 dark:border-pink-900/20
            backdrop-blur-2xl rounded-2xl p-0"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <SettingsContent {...settingsProps} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <NavUser user={user} />
      </DrawerTrigger>
      <DrawerContent className="h-[95vh]">
        <DrawerHeader className="p-4 border-b border-pink-200/30 dark:border-pink-900/20 shrink-0">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-semibold">
              Settings
            </DrawerTitle>
          </div>
        </DrawerHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          <SettingsContent {...settingsProps} isMobile />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

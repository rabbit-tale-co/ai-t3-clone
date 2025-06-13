'use client';

import * as React from 'react';
import {
  FileText,
  History,
  Key,
  MessageCircle,
  Paperclip,
  Settings,
  User,
  Users,
  X,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarProvider,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/hooks/use-language';
import type { UserType as AuthUserType } from '@/app/(auth)/auth';

// Import tab components
import { AccountTab } from '@/components/settings/tabs/account-tab';
import { CustomizationTab } from '@/components/settings/tabs/customization-tab';
import { HistoryTab } from '@/components/settings/tabs/history-tab';
import { ModelsTab } from '@/components/settings/tabs/models-tab';
import { ApiKeysTab } from '@/components/settings/tabs/api-keys-tab';
import { AttachmentsTab } from '@/components/settings/tabs/attachments-tab';
import { ContactTab } from '@/components/settings/tabs/contact-tab';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  is_premium: boolean;
  type: AuthUserType;
}

interface SettingsContentProps {
  user: UserData;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setOpen: (open: boolean) => void;
  actualMessagesUsed: number;
  actualMaxMessages: number;
  usagePercentage: number;
  messagesLeft: number | null;
  messageCountStatus: string;
  formatResetTime: (resetTime: Date | null) => string;
  resetTime: Date | null;
  entitlements: any;
  isMobile?: boolean;
}

export function SettingsContent({
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
  isMobile = false,
}: SettingsContentProps) {
  const { t } = useLanguage();

  const keyboardShortcuts = [
    { action: t('navigation.header.search'), keys: ['Ctrl', 'K'] },
    { action: t('navigation.header.newChat'), keys: ['Ctrl', 'Shift', 'O'] },
    { action: t('navigation.header.toggleSidebar'), keys: ['Ctrl', 'B'] },
  ];

  const navigationTabs = [
    { id: 'account', label: t('settings.sections.account'), icon: User },
    {
      id: 'customization',
      label: t('settings.sections.customization'),
      icon: Settings,
    },
    {
      id: 'history',
      label: t('settings.sections.history'),
      icon: History,
    },
    {
      id: 'models',
      label: t('settings.sections.models'),
      icon: MessageCircle,
    },
    { id: 'api-keys', label: t('settings.sections.apiKeys'), icon: Key },
    {
      id: 'attachments',
      label: t('settings.sections.attachments'),
      icon: Paperclip,
    },
    { id: 'contact', label: t('settings.sections.contact'), icon: Users },
  ];

  const getUserTypeLabel = (userType: AuthUserType) => {
    switch (userType) {
      case 'guest':
        return t('subscription.plans.free');
      case 'regular':
        return t('subscription.plans.free');
      case 'pro':
        return t('subscription.plans.pro');
      case 'admin':
        return t('subscription.plans.pro');
      default:
        return t('subscription.plans.free');
    }
  };

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {/* Mobile Navigation */}
        <div className="border-b border-pink-200/30 dark:border-pink-900/20 p-4">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {navigationTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'bg-pink-600 text-white'
                        : 'text-pink-600 dark:text-pink-400'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Mobile Content */}
        <ScrollArea className="flex-1 p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="account" className="space-y-6 mt-0">
              <AccountTab user={user} />
            </TabsContent>
            <TabsContent value="customization" className="space-y-6 mt-0">
              <CustomizationTab user={user} />
            </TabsContent>
            <TabsContent value="history" className="space-y-6 mt-0">
              <HistoryTab />
            </TabsContent>
            <TabsContent value="models" className="space-y-6 mt-0">
              <ModelsTab user={user} entitlements={entitlements} />
            </TabsContent>
            <TabsContent value="api-keys" className="space-y-6 mt-0">
              <ApiKeysTab user={user} />
            </TabsContent>
            <TabsContent value="attachments" className="space-y-6 mt-0">
              <AttachmentsTab />
            </TabsContent>
            <TabsContent value="contact" className="space-y-6 mt-0">
              <ContactTab />
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </div>
    );
  }

  return (
    <SidebarProvider
      isInDialog
      className="items-start flex h-full min-h-[calc(100vh-10rem)] max-h-[60vh]"
    >
      <Sidebar
        collapsible="none"
        className="w-72 border-r border-pink-200/30 dark:border-pink-900/20 bg-gradient-to-b from-pink-50/40 to-transparent dark:from-pink-950/20 dark:to-transparent backdrop-blur-xl"
      >
        <div className="relative">
          <SidebarHeader className="p-2 flex z-10 relative grow bg-gradient-to-b from-black/70 via-black/40 to-transparent">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </SidebarHeader>
          {/* User Profile Overlay */}
          <div className="absolute w-full inset-x-0 top-0 aspect-square overflow-hidden z-0">
            <div className="aspect-square overflow-hidden z-0">
              <Avatar className="size-full rounded-none">
                <AvatarImage
                  src={user?.avatar_url}
                  alt={user?.full_name}
                  className="size-full object-cover"
                />
                <AvatarFallback className="size-full text-4xl select-none">
                  {user?.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute inset-x-0 h-16 flex items-end justify-between bottom-0 z-10 px-4 pb-4 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
              <h3 className="text-sm font-semibold text-white truncate">
                {user?.full_name}
              </h3>
              <Badge
                variant="outline"
                className="mt-1 text-pink-800 dark:text-pink-200 bg-pink-100/70 dark:bg-pink-900/40 border-none shadow-none"
              >
                {messageCountStatus === 'loading'
                  ? t('api.messages.checking')
                  : getUserTypeLabel(user.type)}
              </Badge>
            </div>
          </div>
        </div>
        <SidebarContent className="p-6 pt-64">
          {/* Message Usage */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-pink-700 dark:text-pink-300">
              {t('api.messages.messageUsage')}
            </SidebarGroupLabel>
            <SidebarGroupContent className="pl-2">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>{getUserTypeLabel(user.type)}</span>
                  <span>
                    {messageCountStatus === 'loading'
                      ? '...'
                      : `${actualMessagesUsed}/${actualMaxMessages}`}
                  </span>
                </div>
                <Progress
                  value={messageCountStatus === 'loading' ? 0 : usagePercentage}
                  className="h-2 bg-pink-100/80 dark:bg-pink-900/20"
                />
                <p className="text-xs text-pink-600 dark:text-pink-400">
                  {messageCountStatus === 'loading'
                    ? t('api.messages.checking')
                    : `${messagesLeft || 0} ${t('api.messages.messagesRemaining')}`}
                </p>
                <p className="text-xs text-pink-600 dark:text-pink-400">
                  {/*
                   FIXME: make sure this takes time since last message - limit
                   (to not add time when user writes a message)
                   */}
                  {messageCountStatus === 'loading'
                    ? t('api.messages.checking')
                    : formatResetTime(resetTime)}
                </p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
          <Separator className="my-6 bg-pink-200/50 dark:bg-pink-800/30" />
          {/* Keyboard Shortcuts */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-pink-700 dark:text-pink-300">
              {t('shortcuts.title')}
            </SidebarGroupLabel>
            <SidebarGroupContent className="pl-2">
              <div className="space-y-3">
                {keyboardShortcuts.map((shortcut) => (
                  <div
                    key={shortcut.action}
                    className="flex justify-between items-center text-sm"
                  >
                    <span>{shortcut.action}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key) => (
                        <Badge
                          key={key}
                          variant="outline"
                          className="text-xs px-2 py-0 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300"
                        >
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Button
            variant="ghost"
            size="lg"
            className="text-pink-700 dark:text-pink-300"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            {t('auth.actions.signOut')}
          </Button>
        </SidebarFooter>
      </Sidebar>
      <main className="flex h-full flex-1 flex-col overflow-hidden max-h-[95vh]">
        {/* Navigation Tabs */}
        <div className="border-b border-pink-200/30 dark:border-pink-900/20 px-2 flex-shrink-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList
              className="grid w-full h-12 bg-transparent border-0 rounded-none p-0"
              style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
            >
              {navigationTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="
                    text-xs px-2 py-2 rounded-none whitespace-nowrap overflow-hidden text-ellipsis transition-colors
                    text-pink-400 hover:text-pink-600 dark:hover:text-pink-300
                    data-[state=active]:text-pink-900 dark:data-[state=active]:text-pink-50
                    data-[state=active]:bg-pink-100/50 dark:data-[state=active]:bg-pink-900/20
                    data-[state=active]:border-b-2
                    data-[state=active]:border-pink-400
                    "
                >
                  <span className="truncate">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="account" className="space-y-6 mt-0">
              <AccountTab user={user} />
            </TabsContent>
            <TabsContent value="customization" className="space-y-6 mt-0">
              <CustomizationTab user={user} />
            </TabsContent>
            <TabsContent value="history" className="space-y-6 mt-0">
              <HistoryTab />
            </TabsContent>
            <TabsContent value="models" className="space-y-6 mt-0">
              <ModelsTab user={user} entitlements={entitlements} />
            </TabsContent>
            <TabsContent value="api-keys" className="space-y-6 mt-0">
              <ApiKeysTab user={user} />
            </TabsContent>
            <TabsContent value="attachments" className="space-y-6 mt-0">
              <AttachmentsTab />
            </TabsContent>
            <TabsContent value="contact" className="space-y-6 mt-0">
              <ContactTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </SidebarProvider>
  );
}

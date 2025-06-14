'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlusIcon } from 'lucide-react';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { memo } from 'react';
import {
  type VisibilityType,
  VisibilitySelector,
} from '@/components/visibility-selector';
import { LanguageSelector } from '@/components/language-selector';
import { useLanguage } from '@/hooks/use-language';
import type { Session } from 'next-auth';
import { ThemeToggle } from '@/components/theme-toggle';

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  session,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const { open: sidebarOpen, isMobile } = useSidebar();

  return (
    <header className="flex sticky top-0 bg-gradient-to-r from-pink-50/80 to-pink-100/60 dark:from-black/90 dark:to-pink-950/30 backdrop-blur-md py-3 items-center px-4 gap-3 border-b border-pink-200/50 dark:border-pink-800/30 rounded-t-3xl z-10">
      {/* Left side - Sidebar toggle and buttons */}
      <div className="flex items-center gap-3">
        {/* Sidebar Toggle */}
        <SidebarTrigger />

        {/* New Chat Button - only show when sidebar is hidden */}
        {(!sidebarOpen || isMobile) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                // variant="outline"
                size={isMobile ? 'icon' : 'default'}
                onClick={() => {
                  router.push('/');
                  router.refresh();
                }}
                className="rounded-full"
              >
                <PlusIcon className="size-4" />
                <span className="hidden sm:inline">
                  {t('navigation.header.newChat')}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('navigation.header.startNewChat')}
            </TooltipContent>
          </Tooltip>
        )}

        {/* Visibility Selector */}
        {!isReadonly && (
          <VisibilitySelector
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
            className="hidden sm:flex"
          />
        )}
      </div>

      {/* Center - Empty space for future content */}
      <div className="flex-1" />

      {/* Right side - Language and Settings */}
      <div className="flex items-center gap-2">
        <LanguageSelector variant="compact" />
        <ThemeToggle />
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.selectedModelId === nextProps.selectedModelId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly
  );
});

'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';

import { Switch } from '@/components/ui/switch';
import { LanguageSelector } from '@/components/language-selector';
import { useLanguage } from '@/hooks/use-language';
import type { UserType as AuthUserType } from '@/app/(auth)/auth';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  is_premium: boolean;
  type: AuthUserType;
}
interface CustomizationTabProps {
  user: UserData;
}

export function CustomizationTab({ user }: CustomizationTabProps) {
  const { t } = useLanguage();
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <div className="space-y-8">
      {/* Theme & Appearance Section */}
      <div>
        <h2 className="text-xl font-semibold text-pink-900 dark:text-pink-100 mb-2">
          {t('settings.customization.title')}
        </h2>
        <p className="text-pink-600 dark:text-pink-400 mb-6">
          {t('settings.customization.description')}
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-4 border-b border-pink-200/50 dark:border-pink-800/30">
            <div>
              <h4 className="text-sm font-medium text-pink-900 dark:text-pink-100">
                {t('settings.customization.darkMode')}
              </h4>
              <p className="text-sm text-pink-600 dark:text-pink-400">
                {t('settings.customization.darkModeDescription') ||
                  'Switch between light and dark themes'}
              </p>
            </div>
            <Switch
              checked={resolvedTheme === 'dark'}
              onCheckedChange={() =>
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
              }
            />
          </div>
          <div className="flex items-center justify-between py-4 border-b border-pink-200/50 dark:border-pink-800/30">
            <div>
              <h4 className="text-sm font-medium text-pink-900 dark:text-pink-100">
                {t('languages.select') || 'Language'}
              </h4>
              <p className="text-sm text-pink-600 dark:text-pink-400">
                {t('settings.customization.languageDescription') ||
                  'Choose your preferred language'}
              </p>
            </div>
            <LanguageSelector variant="compact" />
          </div>
        </div>
      </div>
    </div>
  );
}

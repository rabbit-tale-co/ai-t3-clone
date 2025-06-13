'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Languages, Check } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import type { Language } from '@/lib/i18n';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function LanguageSelector({
  variant = 'default',
  className,
}: LanguageSelectorProps) {
  const {
    currentLanguage,
    changeLanguage,
    availableLanguages,
    getDisplayName,
    t,
  } = useLanguage();

  const handleLanguageChange = (language: Language) => {
    changeLanguage(language);
  };

  if (variant === 'compact') {
    return (
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`text-pink-600 dark:text-pink-300 hover:text-pink-800 dark:hover:text-pink-200 hover:bg-pink-100/50 dark:hover:bg-pink-900/30 ${className}`}
              >
                <Languages className="size-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-gradient-to-br from-pink-50 to-pink-100/60 dark:from-black/95 dark:to-pink-950/20 border-pink-200 dark:border-pink-900/50 backdrop-blur-md rounded-xl"
          >
            <div className="px-3 py-2 text-xs font-medium text-pink-900 dark:text-gray-100 border-b border-pink-200 dark:border-pink-900/30">
              {t('languages.select')}
            </div>
            {availableLanguages.map((language) => (
              <DropdownMenuItem
                key={language}
                onClick={() => handleLanguageChange(language)}
                className="flex items-center justify-between px-3 py-2 text-sm text-pink-800 dark:text-pink-200 hover:bg-pink-100 dark:hover:bg-pink-900/50 focus:bg-pink-100 dark:focus:bg-pink-900/50 rounded-md cursor-pointer"
              >
                <span>{getDisplayName(language)}</span>
                {currentLanguage === language && (
                  <Check className="size-4 text-pink-600 dark:text-pink-400" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent>{t('languages.select')}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`flex items-center gap-2 bg-gradient-to-br from-pink-50 to-pink-100/60 dark:from-black/95 dark:to-pink-950/20 border-pink-200 dark:border-pink-900/50 text-pink-800 dark:text-pink-200 hover:bg-pink-100 dark:hover:bg-pink-900/50 ${className}`}
        >
          <Languages className="size-4" />
          <span>{getDisplayName(currentLanguage)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 bg-gradient-to-br from-pink-50 to-pink-100/60 dark:from-black/95 dark:to-pink-950/20 border-pink-200 dark:border-pink-900/50 backdrop-blur-md rounded-xl"
      >
        <div className="px-3 py-2 text-xs font-medium text-pink-900 dark:text-gray-100 border-b border-pink-200 dark:border-pink-900/30">
          {t('languages.select')}
        </div>
        {availableLanguages.map((language) => (
          <DropdownMenuItem
            key={language}
            onClick={() => handleLanguageChange(language)}
            className="flex items-center justify-between px-3 py-2 text-sm text-pink-800 dark:text-pink-200 hover:bg-pink-100 dark:hover:bg-pink-900/50 focus:bg-pink-100 dark:focus:bg-pink-900/50 rounded-md cursor-pointer"
          >
            <span>{getDisplayName(language)}</span>
            {currentLanguage === language && (
              <Check className="size-4 text-pink-600 dark:text-pink-400" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

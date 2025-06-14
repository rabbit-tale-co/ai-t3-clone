'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentLanguageClient,
  setLanguage as setLanguageCookie,
  getTranslation,
  getAvailableLanguages,
  getLanguageDisplayName,
} from '@/lib/i18n';
import type { Language, TranslationKey } from '@/lib/i18n';

export function useLanguage() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize language from cookies
  useEffect(() => {
    const savedLanguage = getCurrentLanguageClient();
    setCurrentLanguage(savedLanguage);
    setIsLoading(false);
  }, []);

  // Translation function
  const t = useCallback(
    (key: TranslationKey, variables?: Record<string, any>) => {
      return getTranslation(key, currentLanguage, variables);
    },
    [currentLanguage],
  );

  // Change language function
  const changeLanguage = useCallback((newLanguage: Language) => {
    setCurrentLanguage(newLanguage);
    setLanguageCookie(newLanguage);

    // Trigger page reload to update server-side translations
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  // Get available languages
  const availableLanguages = getAvailableLanguages();

  // Get language display name
  const getDisplayName = useCallback(
    (language: Language) => {
      return getLanguageDisplayName(language, currentLanguage);
    },
    [currentLanguage],
  );

  return {
    currentLanguage,
    t,
    changeLanguage,
    availableLanguages,
    getDisplayName,
    isLoading,
  };
}

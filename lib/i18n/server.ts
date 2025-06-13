import { cookies } from 'next/headers';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  getTranslation,
} from './index';
import type { Language, TranslationKey } from './index';

/**
 * Get current language from cookies (server-side)
 */
export async function getCurrentLanguage(): Promise<Language> {
  try {
    const cookieStore = await cookies();
    const languageCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);

    if (languageCookie && isValidLanguage(languageCookie.value)) {
      return languageCookie.value as Language;
    }
  } catch (error) {
    console.warn('Failed to get language from cookies:', error);
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Check if language code is valid
 */
function isValidLanguage(lang: string): boolean {
  return ['pl', 'en'].includes(lang);
}

/**
 * Server-side translator function
 */
export async function createServerTranslator() {
  const language = await getCurrentLanguage();

  return {
    t: (key: TranslationKey, variables?: Record<string, any>) =>
      getTranslation(key, language, variables),
    language,
  };
}

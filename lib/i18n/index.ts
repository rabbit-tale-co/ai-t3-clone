import plTranslations from './languages/pl.json';
import enTranslations from './languages/en.json';

export type Language = 'pl' | 'en';

// Utility type to extract all possible dot-notation paths from nested object
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? ObjectType[Key] extends readonly any[]
      ? never
      : `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

// Generate translation key type from the English translations (as reference)
export type TranslationKey = NestedKeyOf<typeof enTranslations>;

const translations = {
  pl: plTranslations,
  en: enTranslations,
} as const;

const DEFAULT_LANGUAGE: Language = 'en';
const LANGUAGE_COOKIE_NAME = 'preferred_language';
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Get nested value from object using dot notation
 * e.g., getNestedValue(obj, 'chat.greetings.hello')
 */
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Interpolate variables in translation string with pluralization support
 * e.g., interpolate('{{count}} item{{count, plural, one {} other {s}}}', { count: 2 }) => '2 items'
 */
function interpolate(
  template: string,
  variables: Record<string, any> = {},
): string {
  // First handle pluralization patterns
  let result = template.replace(
    /\{\{(\w+),\s*plural,\s*one\s*\{([^}]*)\}\s*(?:few\s*\{([^}]*)\}\s*)?other\s*\{([^}]*)\}\}\}/g,
    (match, key, oneForm, fewForm, otherForm) => {
      const count = variables[key];
      if (count === undefined) return match;

      const num = Number(count);
      if (num === 1) {
        return oneForm || '';
      } else if (fewForm && num >= 2 && num <= 4) {
        return fewForm;
      } else {
        return otherForm || '';
      }
    },
  );

  // Then handle simple variable interpolation
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });

  return result;
}

/**
 * Get translation for a key in specified language with full TypeScript autocomplete support
 */
export function getTranslation(
  key: TranslationKey,
  language: Language = DEFAULT_LANGUAGE,
  variables?: Record<string, any>,
): string {
  const translation = getNestedValue(translations[language], key);

  if (translation === undefined) {
    // Fallback to default language
    const fallbackTranslation = getNestedValue(
      translations[DEFAULT_LANGUAGE],
      key,
    );

    if (fallbackTranslation === undefined) {
      console.warn(
        `Translation missing for key: ${key} in language: ${language}`,
      );
      return key; // Return the key instead of 'unknown' for better debugging
    }

    return variables
      ? interpolate(fallbackTranslation, variables)
      : fallbackTranslation;
  }

  return variables ? interpolate(translation, variables) : translation;
}

/**
 * Get current language from cookies (client-side)
 */
export function getCurrentLanguageClient(): Language {
  if (typeof document === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const cookies = document.cookie.split(';');
  const languageCookie = cookies.find((cookie) =>
    cookie.trim().startsWith(`${LANGUAGE_COOKIE_NAME}=`),
  );

  if (languageCookie) {
    const value = languageCookie.split('=')[1];
    if (isValidLanguage(value)) {
      return value as Language;
    }
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Set language preference in cookies (client-side)
 */
export function setLanguage(language: Language): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${LANGUAGE_COOKIE_NAME}=${language}; path=/; max-age=${LANGUAGE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * Check if language code is valid
 */
function isValidLanguage(lang: string): boolean {
  return Object.keys(translations).includes(lang);
}

/**
 * Get available languages
 */
export function getAvailableLanguages(): Language[] {
  return Object.keys(translations) as Language[];
}

/**
 * Get language display name
 */
export function getLanguageDisplayName(
  language: Language,
  currentLanguage: Language = DEFAULT_LANGUAGE,
): string {
  return getTranslation(
    `languages.${language === 'pl' ? 'polish' : 'english'}`,
    currentLanguage,
  );
}

/**
 * Hook-like function for translations with full TypeScript support
 */
export function createTranslator(language: Language) {
  return {
    t: (key: TranslationKey, variables?: Record<string, any>) =>
      getTranslation(key, language, variables),
    language,
  };
}

// Export constants for server-side usage
export { DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME };

// Export type for components that need to reference translation keys
export type { NestedKeyOf };

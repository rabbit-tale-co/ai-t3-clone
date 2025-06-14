import type { CoreAssistantMessage, CoreToolMessage, UIMessage } from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Document } from '@/lib/db/schema';
import { ChatSDKError, type ErrorCode } from './errors';
import type { NextRequest } from 'next/server';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new ChatSDKError(code as ErrorCode, cause);
  }

  return response.json();
};

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const { code, cause } = await response.json();
      throw new ChatSDKError(code as ErrorCode, cause);
    }

    return response;
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat');
    }

    throw error;
  }
}

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function setLocalStorage(key: string, value: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export function removeLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
}

export function getLocalStorageWithDefault<T>(key: string, defaultValue: T): T {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error parsing localStorage key "${key}":`, error);
      return defaultValue;
    }
  }
  return defaultValue;
}

export function clearLocalStorageByPrefix(prefix: string) {
  if (typeof window !== 'undefined') {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

export function getCachedDataWithExpiry<T>(
  key: string,
  defaultValue: T,
  maxAgeMs: number,
): T | null {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key);
      const timestamp = localStorage.getItem(`${key}_timestamp`);

      if (item && timestamp) {
        const age = Date.now() - Number.parseInt(timestamp);
        if (age < maxAgeMs) {
          return JSON.parse(item);
        }
        // Cache expired, remove it
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_timestamp`);
      }
    } catch (error) {
      console.error(`Error reading cached data for "${key}":`, error);
    }
  }
  return null;
}

export function setCachedDataWithExpiry<T>(key: string, value: T) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem(`${key}_timestamp`, Date.now().toString());
  }
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: Array<UIMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

export function getTrailingMessageId({
  messages,
}: {
  messages: Array<ResponseMessage>;
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) return null;

  return trailingMessage.id;
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

// Unified cache functions for sidebar data
export function getSidebarCache(userId: string) {
  const cacheKey = `sidebar_data_${userId}`;
  const maxAge = 5 * 60 * 1000; // 5 minutes
  return getCachedDataWithExpiry(cacheKey, null, maxAge);
}

export function setSidebarCache(userId: string, data: any) {
  const cacheKey = `sidebar_data_${userId}`;
  setCachedDataWithExpiry(cacheKey, data);
}

export function clearSidebarCache(userId: string) {
  const cacheKey = `sidebar_data_${userId}`;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}_timestamp`);
  }
}

// === ADVANCED COLOR CONTRAST SYSTEM BASED ON APCA/WCAG 3 PRINCIPLES ===

/**
 * Color accessibility utilities using OKLCH + APCA (WCAG 3 draft).
 *
 * 👉 `generateAccessibleTextColor(bg)` – returns a text colour that reaches
 *    **Lc ≥ 60** against *each individual* background swatch by:
 *      1. Trying pure **white** and **black** first (fast path).
 *      2. If neither passes, it walks the OKLCH lightness axis outward from the
 *         background until the target contrast is met, automatically choosing
 *         the brighter or darker direction that succeeds first.
 *
 * 👉 `getReadableBorderColor(bg)` – darker, in‑family border (e.g. Tailwind
 *    500 → 950).
 */

// ─────────────────────────────────────────────────────────────
// Low‑level colour‑space helpers
// ─────────────────────────────────────────────────────────────

function sRGBtoLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSRGB(c: number): number {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, v)) * 255);
}

interface OKLCH {
  L: number;
  C: number;
  H: number;
}
interface RGB {
  r: number;
  g: number;
  b: number;
}

function rgbToOklch(r: number, g: number, b: number): OKLCH {
  const rl = sRGBtoLinear(r);
  const gl = sRGBtoLinear(g);
  const bl = sRGBtoLinear(b);
  const l = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
  const m = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
  const s = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;
  const l3 = Math.cbrt(l);
  const m3 = Math.cbrt(m);
  const s3 = Math.cbrt(s);
  const L_ = 0.2104542553 * l3 + 0.793617785 * m3 - 0.0040720468 * s3;
  const a_ = 1.9779984951 * l3 - 2.428592205 * m3 + 0.4505937099 * s3;
  const b_ = 0.0259040371 * l3 + 0.7827717662 * m3 - 0.808675766 * s3;
  const C = Math.hypot(a_, b_);
  let H = (Math.atan2(b_, a_) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L: L_ * 100, C, H };
}

function oklchToRgb(L: number, C: number, H: number): RGB {
  const hRad = (H * Math.PI) / 180;
  const a_ = C * Math.cos(hRad);
  const b_ = C * Math.sin(hRad);
  const L_ = L / 100;
  const l = L_ + 0.3963377774 * a_ + 0.2158037573 * b_;
  const m = L_ - 0.1055613458 * a_ - 0.0638541728 * b_;
  const s = L_ - 0.0894841775 * a_ - 1.291485548 * b_;
  const rl =
    l ** 3 * 4.0767416621 - m ** 3 * 3.3077115913 + s ** 3 * 0.2309699292;
  const gl =
    -(l ** 3) * 1.2684380046 + m ** 3 * 2.6097574011 - s ** 3 * 0.3413193965;
  const bl =
    -(l ** 3) * 0.0041960863 - m ** 3 * 0.7034186147 + s ** 3 * 1.707614701;
  return { r: linearToSRGB(rl), g: linearToSRGB(gl), b: linearToSRGB(bl) };
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/** Darker in‑family border colour. */
export function getReadableBorderColor(
  backgroundColor: string,
  borderWeight = 0.4,
): string {
  const hex = backgroundColor.replace('#', '');
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const { L, C, H } = rgbToOklch(r, g, b);
  const dl = Math.max(5, L * borderWeight);
  const col = oklchToRgb(dl, C * borderWeight, H);
  return `#${col.r.toString(16).padStart(2, '0')}${col.g.toString(16).padStart(2, '0')}${col.b.toString(16).padStart(2, '0')}`;
}

export function isLocalRequest(req: NextRequest | Request) {
  const host = (req.headers.get('host') || '').toLowerCase();
  return host.startsWith('localhost') || host.startsWith('127.0.0.1');
}

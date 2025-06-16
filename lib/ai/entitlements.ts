import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
  maxFolders: number;
  maxTags: number;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 10,
    maxFolders: 2,
    maxTags: 3,
    availableChatModelIds: [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
    ],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 20,
    maxFolders: 5,
    maxTags: 10,
    availableChatModelIds: [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'claude-3-5-haiku-20241022',
      'gpt-4o-mini',
      'gpt-3.5-turbo',
    ],
  },

  pro: {
    maxMessagesPerDay: 50,
    maxFolders: 15,
    maxTags: 25,
    availableChatModelIds: [
      // All premium models
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      'grok-beta',
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'command-r-plus',
      'command-r',
      'mistral-large-latest',
      'mistral-medium-latest',
      'mistral-small-latest',
    ],
  },

  admin: {
    maxMessagesPerDay: 100,
    maxFolders: -1, // Unlimited
    maxTags: -1, // Unlimited
    availableChatModelIds: [
      // All models available for admin
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      'grok-beta',
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'command-r-plus',
      'command-r',
      'mistral-large-latest',
      'mistral-medium-latest',
      'mistral-small-latest',
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};

export function getUserEntitlements(userType: UserType): Entitlements {
  return entitlementsByUserType[userType] || entitlementsByUserType.guest;
}

// Note: getUserEntitlementsWithModels was removed - use getAvailableModelsAction from server actions instead

export function canCreateFolder(
  userType: UserType,
  currentFolderCount: number,
): boolean {
  const entitlements = getUserEntitlements(userType);
  return (
    entitlements.maxFolders === -1 ||
    currentFolderCount < entitlements.maxFolders
  );
}

export function canCreateTag(
  userType: UserType,
  currentTagCount: number,
): boolean {
  const entitlements = getUserEntitlements(userType);
  return entitlements.maxTags === -1 || currentTagCount < entitlements.maxTags;
}

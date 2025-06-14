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
    maxMessagesPerDay: 5,
    maxFolders: 2,
    maxTags: 3,
    availableChatModelIds: [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      // 'gemini-2.5-flash',
      // 'gpt-4.0-mini',
      // 'gpt-4.1-mini',
      // 'gpt-4.1-nano',
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
      // 'chat-model',
      // 'title-model',
      // 'artifact-model',
      // 'claude-3-5-sonnet',
      // 'claude-3-5-haiku',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      // 'gemini-2.5-flash',
    ],
  },

  pro: {
    maxMessagesPerDay: 50,
    maxFolders: 15,
    maxTags: 25,
    availableChatModelIds: ['gemini-2.0-flash', 'gemini-2.0-flash-lite'],
  },

  admin: {
    maxMessagesPerDay: 100,
    maxFolders: -1, // Unlimited
    maxTags: -1, // Unlimited
    availableChatModelIds: ['gemini-2.0-flash', 'gemini-2.0-flash-lite'],
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

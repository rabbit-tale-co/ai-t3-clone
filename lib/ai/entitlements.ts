import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 5,
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
    availableChatModelIds: ['gemini-2.0-flash', 'gemini-2.0-flash-lite'],
  },

  admin: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ['gemini-2.0-flash', 'gemini-2.0-flash-lite'],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};

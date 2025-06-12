import { generateDummyPassword } from './db/utils';

export const isProductionEnvironment = process.env.NODE_ENV === 'production';
export const isDevelopmentEnvironment = process.env.NODE_ENV === 'development';
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT,
);

export const guestRegex = /^guest-\d+$/;

export const DUMMY_PASSWORD = generateDummyPassword();

// lib/constants/chat.ts
import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import type { Chat } from '@/lib/db/schema'; // Assuming Chat type is from your schema

export type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

export interface ChatHistory {
  chats: Array<Chat>;
  hasMore: boolean;
}

export const PAGE_SIZE = 20;

// This function is useful for client-side grouping if you ever display flat chat lists
export const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats,
  );
};

// This key function is also general enough to be here
export const getChatHistoryPaginationKey = (
  pageIndex: number,
  previousData: { chats: Array<Chat>; hasMore: boolean } | null,
) => {
  if (previousData && !previousData.hasMore) return null;

  // Define correct url based on pagination params
  if (pageIndex === 0) {
    return `/api/history?limit=${PAGE_SIZE}`; // Use PAGE_SIZE constant
  }

  const lastId = previousData?.chats.slice(-1)[0]?.id || '';
  return `/api/history?ending_before=${lastId}&limit=${PAGE_SIZE}`; // Use PAGE_SIZE constant
};

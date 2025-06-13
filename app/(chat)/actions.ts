'use server';

import { generateText, type UIMessage } from 'ai';
import { cookies } from 'next/headers';
import {
  createFolder,
  createTag,
  deleteChatById,
  deleteMessagesByChatIdAfterTimestamp,
  getChatsByFolderId,
  getFoldersByUserId,
  getMessageById,
  getMessageCountByUserId,
  getLastUserMessageTimestamp,
  getTagsByChatId,
  getTagsByUserId,
  updateChatVisiblityById,
  getChatById,
  addTagToChat,
  removeTagFromChat,
  removeChatFromFolder,
  updateChatFolderId,
  getSidebarThreadsByUserId,
  deleteFolderById,
  deleteTagById,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';
import {
  type ChatModel,
  chatModels,
  DEFAULT_CHAT_MODEL,
} from '@/lib/ai/models';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import type { UserType } from '@/app/(auth)/auth';
import type { Chat, Folder, Tag } from '@/lib/db/schema';

export async function saveChatModelAsCookie(modelId: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', modelId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function getModel(
  modelId: string,
): Promise<ChatModel | undefined> {
  const model = chatModels.find((model) => model.id === modelId);
  return model;
}

export const hasTextCapability = async (modelId: string): Promise<boolean> => {
  const model = await getModel(modelId);
  return !!model?.capabilities?.includes('text');
};

export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const modelId = DEFAULT_CHAT_MODEL;
  const hasText = await hasTextCapability(modelId);

  if (!hasText) {
    console.warn(
      `Model ${modelId} does not have text capability. Returning a default title.`,
    );
    return 'Default Title'; // or handle it however you want
  }

  const { text: title } = await generateText({
    model: myProvider.languageModel(modelId),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}

export async function getUserMessageCount(userId: string, userType: UserType) {
  'use server';

  try {
    const messageCount = await getMessageCountByUserId({
      id: userId,
      differenceInHours: 24,
    });

    const lastMessageTimestamp = await getLastUserMessageTimestamp({
      id: userId,
    });

    const maxMessages =
      entitlementsByUserType[userType]?.maxMessagesPerDay || 0;

    const messagesLeft = Math.max(0, maxMessages - messageCount);

    // Calculate reset time: 24 hours after the last message, or tomorrow at 2 AM if no messages
    let resetTime: Date;
    if (lastMessageTimestamp) {
      resetTime = new Date(
        lastMessageTimestamp.getTime() + 24 * 60 * 60 * 1000,
      );
    } else {
      // If no messages, reset at 2 AM tomorrow
      resetTime = new Date();
      resetTime.setDate(resetTime.getDate() + 1);
      resetTime.setHours(2, 0, 0, 0);
    }
    return {
      messagesLeft,
      messagesUsed: messageCount,
      maxMessages,
      resetTime,
      success: true,
    };
  } catch (error) {
    console.error('Failed to fetch message count', error);
    return {
      messagesLeft: null,
      messagesUsed: null,
      maxMessages: null,
      resetTime: null,
      success: false,
    };
  }
}

export async function createFolderAction({
  name,
  userId,
  color,
}: { name: string; userId: string; color: string }): Promise<
  Folder | undefined
> {
  try {
    const newFolders = await createFolder({ name, userId, color });
    return newFolders[0]; // Assuming createFolder returns an array and you want the first one
  } catch (error) {
    console.error('Server Action: Failed to create folder:', error);
    throw error; // Re-throw or return an error object
  }
}

export async function getFoldersByUserIdAction(
  userId: string,
): Promise<Folder[]> {
  try {
    return await getFoldersByUserId({ userId });
  } catch (error) {
    console.error('Server Action: Failed to get folders by user ID:', error);
    throw error;
  }
}

export async function createTagAction({
  label,
  color,
  userId,
}: { label: string; color: string; userId: string }): Promise<Tag | undefined> {
  try {
    const newTags = await createTag({ label, color, userId });
    return newTags[0]; // Assuming createTag returns an array and you want the first one
  } catch (error) {
    console.error('Server Action: Failed to create tag:', error);
    throw error;
  }
}

export async function getTagsByUserIdAction(userId: string): Promise<Tag[]> {
  try {
    return await getTagsByUserId({ userId });
  } catch (error) {
    console.error('Server Action: Failed to get tags by user ID:', error);
    throw error;
  }
}

export async function getChatsByFolderIdAction({
  folderId,
  limit,
  startingAfter,
  endingBefore,
}: {
  folderId: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}): Promise<{ chats: Chat[]; hasMore: boolean }> {
  try {
    return await getChatsByFolderId({
      folderId,
      limit,
      startingAfter,
      endingBefore,
    });
  } catch (error) {
    console.error('Server Action: Failed to get chats by folder ID:', error);
    throw error;
  }
}

export async function getTagsByChatIdAction(chatId: string): Promise<Tag[]> {
  try {
    return await getTagsByChatId({ chatId });
  } catch (error) {
    console.error('Server Action: Failed to get tags by chat ID:', error);
    throw error;
  }
}

// You already have your /api/history route, so `getChatsByUserId` is exposed via that.
// If you need to call `deleteChatById` from client side, you might need a Server Action for it too.
export async function deleteChatAction(chatId: string) {
  try {
    await deleteChatById({ id: chatId });
    return { success: true };
  } catch (error) {
    console.error('Server Action: Failed to delete chat:', error);
    throw error;
  }
}

// Akcja do dodawania czatu do folderu
export async function addChatToFolderAction({
  chatId,
  folderId,
}: {
  chatId: string;
  folderId: string;
}) {
  try {
    await updateChatFolderId({ chatId, folderId });
    return { success: true };
  } catch (error) {
    console.error('Server Action: Failed to add chat to folder:', error);
    throw error;
  }
}

// Akcja do usuwania czatu z folderu
export async function removeChatFromFolderAction(chatId: string) {
  try {
    await removeChatFromFolder({ chatId });
    return { success: true };
  } catch (error) {
    console.error('Server Action: Failed to remove chat from folder:', error);
    throw error;
  }
}

// Akcja do dodawania tagu do czatu
export async function addTagToChatAction({
  chatId,
  tagId,
}: {
  chatId: string;
  tagId: string;
}) {
  try {
    await addTagToChat({ chatId, tagId });
    return { success: true };
  } catch (error) {
    console.error('Server Action: Failed to add tag to chat:', error);
    throw error;
  }
}

// Akcja do usuwania tagu z czatu
export async function removeTagFromChatAction({
  chatId,
  tagId,
}: {
  chatId: string;
  tagId: string;
}) {
  try {
    await removeTagFromChat({ chatId, tagId });
    return { success: true };
  } catch (error) {
    console.error('Server Action: Failed to remove tag from chat:', error);
    throw error;
  }
}

// Akcja do usuwania folderu
export async function deleteFolderAction(folderId: string) {
  'use server';

  try {
    await deleteFolderById({ folderId });
    return { success: true };
  } catch (error) {
    console.error('Server Action: Failed to delete folder:', error);
    throw error;
  }
}

// Akcja do usuwania tagu
export async function deleteTagAction(tagId: string) {
  'use server';

  try {
    await deleteTagById({ tagId });
    return { success: true };
  } catch (error) {
    console.error('Server Action: Failed to delete tag:', error);
    throw error;
  }
}

// Akcja do pobierania kompletnych danych sidebar - "threads" z wszystkimi danymi
export async function getSidebarThreadsAction({
  userId,
  limit = 50,
  startingAfter,
  endingBefore,
}: {
  userId: string;
  limit?: number;
  startingAfter?: string | null;
  endingBefore?: string | null;
}) {
  try {
    return await getSidebarThreadsByUserId({
      userId,
      limit,
      startingAfter,
      endingBefore,
    });
  } catch (error) {
    console.error('Server Action: Failed to get sidebar threads:', error);
    throw error;
  }
}

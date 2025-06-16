import 'server-only';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  not,
  sql,
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  stream,
  folder,
  tag,
  chatTag,
  userApiKey,
  type UserApiKey,
  type TokenRequestMonitor,
  tokenRequestMonitor,
} from './schema';
import type { ArtifactKind } from '@/components/chat/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';
import { encryptApiKey } from '@/lib/crypto';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    );
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const [u] = await db.select().from(user).where(eq(user.id, id)).limit(1);

    return u ?? null;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get user by id');
  }
}

export async function getFullUserData(id: string) {
  try {
    const userData = await getUserById(id);

    if (!userData) {
      return null;
    }

    // Determine user type based on subscription status
    const isGuest = userData.email?.includes('guest-');
    const hasPremium =
      userData.subscriptionStatus === 'active' &&
      userData.subscriptionCurrentPeriodEnd &&
      new Date(userData.subscriptionCurrentPeriodEnd) > new Date();

    let userType: 'guest' | 'regular' | 'pro' | 'admin' = 'regular';
    if (isGuest) {
      userType = 'guest';
    } else if (hasPremium) {
      userType = 'pro';
    }

    return {
      id: userData.id,
      email: userData.email || '',
      full_name: userData.fullName || userData.email?.split('@')[0] || 'User',
      avatar_url:
        userData.avatarUrl || `https://avatar.vercel.sh/${userData.email}`,
      is_premium: hasPremium,
      type: userType,
    };
  } catch (error) {
    console.error('Failed to get full user data:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get full user data',
    );
  }
}

export async function updateUserById({
  id,
  fullName,
  email,
  avatarUrl,
}: {
  id: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
}) {
  try {
    const updateData: Partial<User> = {
      updatedAt: new Date(),
    };

    if (fullName !== undefined) {
      updateData.fullName = fullName;
    }
    if (email !== undefined) {
      updateData.email = email;
    }
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
    }

    const [updatedUser] = await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, id))
      .returning();

    return updatedUser;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to update user');
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    console.log('Creating user:', { email, password: hashedPassword });
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  } finally {
    console.log('User created:', { email, password: hashedPassword });
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    console.log('Creating guest user:', { email, password });
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create guest user',
    );
  } finally {
    console.log('Guest user created:', { email, password });
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
  folderId,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
  folderId?: string | null;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
      folderId,
    });
  } catch (error) {
    console.error('Failed to save chat:', error);
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
  folderId,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
  folderId?: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) => {
      // Start with the base query
      let baseQuery = db
        .select()
        .from(chat)
        .where(eq(chat.userId, id))
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

      // Add where parameters
      if (whereCondition) {
        baseQuery = db
          .select()
          .from(chat)
          .where(and(eq(chat.userId, id), whereCondition))
          .orderBy(desc(chat.createdAt))
          .limit(extendedLimit);
      }
      return baseQuery;
    };

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      //Start with basic where
      let whereClause: SQL<any> | undefined = undefined;

      //If there is a folder to select, add folder
      if (folderId) {
        whereClause = eq(chat.folderId, folderId);
      }

      //Now run the query
      filteredChats = await query(whereClause);
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    );
  }
}

export async function getLastUserMessageTimestamp({
  id,
}: { id: string }): Promise<Date | null> {
  try {
    const [lastMessage] = await db
      .select({ createdAt: message.createdAt })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(and(eq(chat.userId, id), eq(message.role, 'user')))
      .orderBy(desc(message.createdAt))
      .limit(1)
      .execute();

    return lastMessage?.createdAt ?? null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get last user message timestamp',
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    );
  }
}

// ------------------------------
// Folder and Tag Queries
// ------------------------------

// Create Folder
export async function createFolder({
  name,
  userId,
  color,
}: {
  name: string;
  userId: string;
  color: string;
}) {
  try {
    return await db
      .insert(folder)
      .values({ name, userId, color, createdAt: new Date() })
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create folder');
  }
}

// Get Folders by User ID
export async function getFoldersByUserId({ userId }: { userId: string }) {
  try {
    return await db.select().from(folder).where(eq(folder.userId, userId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get folders by user id',
    );
  }
}

// Get Folders by Chat ID
export async function getFoldersByChatId({ chatId }: { chatId: string }) {
  try {
    // Assuming you want to get folders that contain the chat with chatId
    const folders = await db
      .select({
        id: folder.id,
        name: folder.name,
        createdAt: folder.createdAt,
        userId: folder.userId,
      })
      .from(folder)
      .innerJoin(chat, eq(folder.id, chat.folderId))
      .where(eq(chat.id, chatId));
    return folders;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get folders by chat id',
    );
  }
}

// Add Chat to Folder - (Not needed, since this is a part of saveChat)
// Remove Chat from Folder (Set Folder ID to Null) - rename because original name wrong
export async function removeChatFromFolder({ chatId }: { chatId: string }) {
  try {
    await db.update(chat).set({ folderId: null }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to remove chat from folder',
    );
  }
}

// Delete Folder by ID
export async function deleteFolderById({
  folderId,
}: {
  folderId: string;
}) {
  try {
    // Update chats in the deleted folder to have folderId = null
    await db
      .update(chat)
      .set({ folderId: null })
      .where(eq(chat.folderId, folderId));

    // Delete the folder
    await db.delete(folder).where(eq(folder.id, folderId));

    return { success: true };
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to delete folder');
  }
}

// Create Tag
export async function createTag({
  label,
  color,
  userId,
}: {
  label: string;
  color: string;
  userId: string;
}) {
  try {
    return await db.insert(tag).values({ label, color, userId }).returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create tag');
  }
}

// Get Tags by User ID
export async function getTagsByUserId({ userId }: { userId: string }) {
  try {
    return await db.select().from(tag).where(eq(tag.userId, userId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get tags by user id',
    );
  }
}

// Get Tags by Chat ID
export async function getTagsByChatId({ chatId }: { chatId: string }) {
  try {
    // The query fetches the tag data and returns all the Tag data
    const tags = await db
      .select({
        id: tag.id,
        label: tag.label,
        color: tag.color,
        userId: tag.userId,
      })
      .from(chatTag)
      .innerJoin(tag, eq(chatTag.tagId, tag.id))
      .where(eq(chatTag.chatId, chatId));
    return tags;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get tags by chat id',
    );
  }
}

// Add Tag to Chat
export async function addTagToChat({
  chatId,
  tagId,
}: {
  chatId: string;
  tagId: string;
}) {
  try {
    // The query fetches the tag data and returns all the Tag data
    await db.insert(chatTag).values({ chatId: chatId, tagId: tagId }).execute();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to add tag to chat');
  }
}

// Remove Tag from Chat
export async function removeTagFromChat({
  chatId,
  tagId,
}: {
  chatId: string;
  tagId: string;
}) {
  try {
    // The query fetches the tag data and returns all the Tag data
    await db
      .delete(chatTag)
      .where(and(eq(chatTag.chatId, chatId), eq(chatTag.tagId, tagId)))
      .execute();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to remove tag from chat',
    );
  }
}

// Delete Tag by ID
export async function deleteTagById({ tagId }: { tagId: string }) {
  try {
    // First remove all associations to this tag
    await db.delete(chatTag).where(eq(chatTag.tagId, tagId));

    // Then delete the tag
    await db.delete(tag).where(eq(tag.id, tagId));
    return { success: true };
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to delete tag');
  }
}

//Get chats by folder id - the function was missing!

export async function getChatsByFolderId({
  folderId,
  limit,
  startingAfter,
  endingBefore,
}: {
  folderId: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(eq(chat.folderId, folderId))
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(and(eq(chat.id, startingAfter), eq(chat.folderId, folderId)))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found in folder ${folderId}`,
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(and(eq(chat.id, endingBefore), eq(chat.folderId, folderId)))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found in folder ${folderId}`,
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by folder id',
    );
  }
}

// Aktualizuj folderId dla czatu
export async function updateChatFolderId({
  chatId,
  folderId,
}: {
  chatId: string;
  folderId: string;
}) {
  try {
    return await db.update(chat).set({ folderId }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat folder id',
    );
  }
}

// Get complete sidebar data - "threads" with all related data
export async function getSidebarThreadsByUserId({
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
    const extendedLimit = limit + 1;

    // Get chats with folder and tag information in one query
    let chatsQuery = db
      .select({
        // Chat data
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        userId: chat.userId,
        visibility: chat.visibility,
        folderId: chat.folderId,
        // Folder data (if exists)
        folderName: folder.name,
        folderColor: folder.color,
        // Tag data (if exists)
        tagId: tag.id,
        tagLabel: tag.label,
        tagColor: tag.color,
        tagUserId: tag.userId,
      })
      .from(chat)
      .leftJoin(folder, eq(chat.folderId, folder.id))
      .leftJoin(chatTag, eq(chat.id, chatTag.chatId))
      .leftJoin(tag, eq(chatTag.tagId, tag.id))
      .where(eq(chat.userId, userId))
      .orderBy(desc(chat.createdAt))
      .limit(extendedLimit * 10); // Multiply by 10 because each chat might have multiple tag rows

    // Handle pagination
    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      chatsQuery = db
        .select({
          id: chat.id,
          title: chat.title,
          createdAt: chat.createdAt,
          userId: chat.userId,
          visibility: chat.visibility,
          folderId: chat.folderId,
          folderName: folder.name,
          folderColor: folder.color,
          tagId: tag.id,
          tagLabel: tag.label,
          tagColor: tag.color,
          tagUserId: tag.userId,
        })
        .from(chat)
        .leftJoin(folder, eq(chat.folderId, folder.id))
        .leftJoin(chatTag, eq(chat.id, chatTag.chatId))
        .leftJoin(tag, eq(chatTag.tagId, tag.id))
        .where(
          and(
            eq(chat.userId, userId),
            gt(chat.createdAt, selectedChat.createdAt),
          ),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit * 10);
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      chatsQuery = db
        .select({
          id: chat.id,
          title: chat.title,
          createdAt: chat.createdAt,
          userId: chat.userId,
          visibility: chat.visibility,
          folderId: chat.folderId,
          folderName: folder.name,
          folderColor: folder.color,
          tagId: tag.id,
          tagLabel: tag.label,
          tagColor: tag.color,
          tagUserId: tag.userId,
        })
        .from(chat)
        .leftJoin(folder, eq(chat.folderId, folder.id))
        .leftJoin(chatTag, eq(chat.id, chatTag.chatId))
        .leftJoin(tag, eq(chatTag.tagId, tag.id))
        .where(
          and(
            eq(chat.userId, userId),
            lt(chat.createdAt, selectedChat.createdAt),
          ),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit * 10);
    }

    const results = await chatsQuery.execute();

    // Group results by chat ID and aggregate tags
    const chatMap = new Map();

    for (const row of results) {
      if (!chatMap.has(row.id)) {
        chatMap.set(row.id, {
          id: row.id,
          title: row.title,
          createdAt: row.createdAt,
          userId: row.userId,
          visibility: row.visibility,
          folderId: row.folderId,
          folder: row.folderName
            ? {
                name: row.folderName,
                color: row.folderColor,
              }
            : null,
          tags: [],
        });
      }

      // Add tag if it exists
      if (row.tagId) {
        const chatData = chatMap.get(row.id);
        chatData.tags.push({
          id: row.tagId,
          label: row.tagLabel,
          color: row.tagColor,
          userId: row.tagUserId,
        });
      }
    }

    const threads = Array.from(chatMap.values())
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);

    const hasMore = Array.from(chatMap.values()).length > limit;

    // Get all unique folders and tags for this user
    const [folders, tags] = await Promise.all([
      getFoldersByUserId({ userId }),
      getTagsByUserId({ userId }),
    ]);

    return {
      threads,
      folders,
      tags,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get sidebar threads by user id',
    );
  }
}

// API Keys functions
export async function getUserApiKeys(userId: string): Promise<UserApiKey[]> {
  try {
    return await db
      .select()
      .from(userApiKey)
      .where(and(eq(userApiKey.userId, userId), eq(userApiKey.isActive, true)));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user API keys',
    );
  }
}

export async function getUserApiKeyByProvider(
  userId: string,
  provider: string,
): Promise<UserApiKey | null> {
  try {
    const [apiKey] = await db
      .select()
      .from(userApiKey)
      .where(
        and(
          eq(userApiKey.userId, userId),
          eq(userApiKey.provider, provider as any),
          eq(userApiKey.isActive, true),
        ),
      )
      .limit(1);

    return apiKey ?? null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user API key by provider',
    );
  }
}

export async function saveUserApiKey({
  userId,
  provider,
  keyName,
  encryptedKey,
}: {
  userId: string;
  provider: string;
  keyName: string;
  encryptedKey: string;
}): Promise<UserApiKey> {
  try {
    // First, check if there's an existing key (active or inactive) for this provider
    const [existingKey] = await db
      .select()
      .from(userApiKey)
      .where(
        and(
          eq(userApiKey.userId, userId),
          eq(userApiKey.provider, provider as any),
        ),
      )
      .limit(1);

    if (existingKey) {
      // Update existing key with new data and set as active
      const [updatedKey] = await db
        .update(userApiKey)
        .set({
          keyName,
          encryptedKey,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(userApiKey.id, existingKey.id))
        .returning();

      return updatedKey;
    } else {
      // Insert new key if none exists
      const [newApiKey] = await db
        .insert(userApiKey)
        .values({
          userId,
          provider: provider as any,
          keyName,
          encryptedKey,
          isActive: true,
        })
        .returning();

      return newApiKey;
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save user API key',
    );
  }
}

export async function deleteUserApiKey(
  userId: string,
  provider: string,
): Promise<void> {
  try {
    // Use soft delete by setting isActive to false
    await db
      .update(userApiKey)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(userApiKey.userId, userId),
          eq(userApiKey.provider, provider as any),
        ),
      );
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete user API key',
    );
  }
}

// Token Request Monitor Functions
export async function incrementUserTokenRequest(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const now = new Date();

  try {
    // Try to find existing record for today
    const existingRecord = await db
      .select()
      .from(tokenRequestMonitor)
      .where(
        and(
          eq(tokenRequestMonitor.userId, userId),
          eq(tokenRequestMonitor.date, today)
        )
      )
      .limit(1);

    if (existingRecord.length > 0) {
      // Update existing record - increment counter and update lastRequestAt
      const currentCount = existingRecord[0].requestCount || 0;
      await db
        .update(tokenRequestMonitor)
        .set({
          requestCount: currentCount + 1,
          lastRequestAt: now,
          updatedAt: now,
        })
        .where(eq(tokenRequestMonitor.id, existingRecord[0].id));
    } else {
      // Create new record for today
      await db.insert(tokenRequestMonitor).values({
        userId,
        date: today,
        requestCount: 1,
        firstRequestAt: now,
        lastRequestAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }
  } catch (error) {
    console.error('Error incrementing token request:', error);
    throw error;
  }
}

export async function getUserTokenRequestCount(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  try {
    const record = await db
      .select()
      .from(tokenRequestMonitor)
      .where(
        and(
          eq(tokenRequestMonitor.userId, userId),
          eq(tokenRequestMonitor.date, today)
        )
      )
      .limit(1);

    if (record.length > 0) {
      // Check if reset time has passed
      const resetTime = new Date(record[0].firstRequestAt);
      resetTime.setHours(resetTime.getHours() + 24);

      const now = new Date();
      if (now >= resetTime) {
        // Reset time has passed, delete the old record so count starts fresh
        await db
          .delete(tokenRequestMonitor)
          .where(eq(tokenRequestMonitor.id, record[0].id));

        return 0; // Fresh start
      }

      return record[0].requestCount || 0;
    }

    return 0;
  } catch (error) {
    console.error('Error getting token request count:', error);
    return 0;
  }
}

export async function getUserTokenRequestResetTime(userId: string): Promise<Date | null> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  try {
    const record = await db
      .select()
      .from(tokenRequestMonitor)
      .where(
        and(
          eq(tokenRequestMonitor.userId, userId),
          eq(tokenRequestMonitor.date, today)
        )
      )
      .limit(1);

    if (record.length > 0 && record[0].firstRequestAt) {
      // Reset time is 24 hours after first request
      const resetTime = new Date(record[0].firstRequestAt);
      resetTime.setHours(resetTime.getHours() + 24);

      const now = new Date();
      if (now >= resetTime) {
        // Reset time has passed, return null to indicate fresh start
        return null;
      }

      return resetTime;
    }

    return null;
  } catch (error) {
    console.error('Error getting token request reset time:', error);
    return null;
  }
}

// Fallback function for backward compatibility
export async function getUserMessageCountFallback(userId: string): Promise<number> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const messageCount = await db
      .select()
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, userId),
          eq(message.role, 'user'),
          gte(message.createdAt, twentyFourHoursAgo)
        )
      );

    return messageCount.length;
  } catch (error) {
    console.error('Error getting fallback message count:', error);
    return 0;
  }
}

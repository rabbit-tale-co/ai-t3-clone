'use server';

import { generateText, type UIMessage } from 'ai';
import { cookies } from 'next/headers';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';
import {
  type ChatModel,
  chatModels,
  DEFAULT_CHAT_MODEL,
} from '@/lib/ai/models';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
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

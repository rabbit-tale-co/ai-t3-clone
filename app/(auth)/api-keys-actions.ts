'use server';

import { z } from 'zod/v4';
import { auth } from '@/app/(auth)/auth';
import {
  getUserApiKeys,
  saveUserApiKey,
  deleteUserApiKey,
} from '@/lib/db/queries';
import { encryptApiKey } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';

const saveApiKeySchema = z.object({
  provider: z.enum([
    'openai',
    'anthropic',
    'google',
    'xai',
    'openrouter',
    'groq',
    'perplexity',
    'cohere',
    'mistral',
  ]),
  keyName: z.string().min(1),
  apiKey: z.string().min(1),
});

const deleteApiKeySchema = z.object({
  provider: z.enum([
    'openai',
    'anthropic',
    'google',
    'xai',
    'openrouter',
    'groq',
    'perplexity',
    'cohere',
    'mistral',
  ]),
});

export async function getUserApiKeysAction() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const apiKeys = await getUserApiKeys(session.user.id);

    // Return keys without the encrypted values for security
    return apiKeys.map((key) => ({
      id: key.id,
      provider: key.provider,
      keyName: key.keyName,
      isActive: key.isActive,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
    }));
  } catch (error) {
    console.error('Error fetching API keys:', error);
    throw new Error('Failed to fetch API keys');
  }
}

export async function saveApiKeyAction(data: z.infer<typeof saveApiKeySchema>) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const { provider, keyName, apiKey } = saveApiKeySchema.parse(data);

    // Encrypt the API key
    const encryptedKey = encryptApiKey(apiKey);

    // Save to database
    const savedKey = await saveUserApiKey({
      userId: session.user.id,
      provider,
      keyName,
      encryptedKey,
    });

    // Revalidate to update available models
    revalidatePath('/', 'layout');

    // Return without the encrypted key
    return {
      id: savedKey.id,
      provider: savedKey.provider,
      keyName: savedKey.keyName,
      isActive: savedKey.isActive,
      createdAt: savedKey.createdAt,
    };
  } catch (error) {
    console.error('Error saving API key:', error);

    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid request data: ${error.issues.map((e) => e.message).join(', ')}`,
      );
    }

    throw new Error('Failed to save API key');
  }
}

export async function deleteApiKeyAction(
  data: z.infer<typeof deleteApiKeySchema>,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const { provider } = deleteApiKeySchema.parse(data);

    await deleteUserApiKey(session.user.id, provider);

    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error) {
    console.error('Error deleting API key:', error);

    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid request data: ${error.issues.map((e) => e.message).join(', ')}`,
      );
    }

    throw new Error('Failed to delete API key');
  }
}

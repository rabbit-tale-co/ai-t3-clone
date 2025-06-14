'use server';

import { auth } from '@/app/(auth)/auth';
import { getUserApiKeys } from '@/lib/db/queries';
import { providers, type ChatModel } from '@/lib/ai/models';

interface ProviderConfig {
  hasEnvKey: boolean;
  hasUserKey: boolean;
  models: ChatModel[];
}

interface AvailableProviders {
  [providerId: string]: ProviderConfig;
}

// Check environment variables for API keys
function hasEnvironmentKey(provider: string): boolean {
  switch (provider) {
    case 'google':
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY;
    case 'xai':
      return !!process.env.XAI_API_KEY;
    case 'groq':
      return !!process.env.GROQ_API_KEY;
    case 'cohere':
      return !!process.env.COHERE_API_KEY;
    case 'mistral':
      return !!process.env.MISTRAL_API_KEY;
    default:
      return false;
  }
}

export async function getAvailableModelsAction() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const availableProviders: AvailableProviders = {};

    for (const provider of providers) {
      const hasEnvKey = hasEnvironmentKey(provider.id);
      let hasUserKey = false;

      // Check user's API keys if userId is provided
      if (userId) {
        try {
          const userApiKeys = await getUserApiKeys(userId);
          hasUserKey = userApiKeys.some(
            (key) => key.provider === provider.id && key.isActive,
          );
        } catch (error) {
          console.error(
            `Error checking user API key for ${provider.id}:`,
            error,
          );
        }
      }

      // Only include provider if it has at least one key
      if (hasEnvKey || hasUserKey) {
        availableProviders[provider.id] = {
          hasEnvKey,
          hasUserKey,
          models: provider.models,
        };
      }
    }

    // Get available models
    const models: ChatModel[] = [];
    for (const providerConfig of Object.values(availableProviders)) {
      models.push(...providerConfig.models);
    }

    return {
      models,
      providers: availableProviders,
      hasUserKeys: userId ? Object.keys(availableProviders).length > 0 : false,
    };
  } catch (error) {
    console.error('Error fetching available models:', error);
    throw new Error('Failed to fetch available models');
  }
}

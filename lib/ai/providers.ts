import { customProvider } from 'ai';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { xai } from '@ai-sdk/xai';

import { isTestEnvironment } from '../constants';
import { gemini20Flash, gemini20FlashLite } from './models.test';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'gemini-2.0-flash': gemini20Flash,
        'gemini-2.0-flash-lite': gemini20FlashLite,
      },
      imageModels: {},
    })
  : customProvider({
      languageModels: {
        // Google models (only if env key exists)
        ...(process.env.GOOGLE_GENERATIVE_AI_API_KEY && {
          'gemini-2.0-flash': google('gemini-2.0-flash'),
          'gemini-2.0-flash-lite': google('gemini-2.0-flash-lite'),
          'gemini-1.5-pro': google('gemini-1.5-pro'),
          'gemini-1.5-flash': google('gemini-1.5-flash'),
        }),

        // OpenAI models (only if env key exists)
        ...(process.env.OPENAI_API_KEY && {
          'gpt-4o': openai('gpt-4o'),
          'gpt-4o-mini': openai('gpt-4o-mini'),
          'gpt-4-turbo': openai('gpt-4-turbo'),
          'gpt-3.5-turbo': openai('gpt-3.5-turbo'),
        }),

        // Anthropic models (only if env key exists)
        ...(process.env.ANTHROPIC_API_KEY && {
          'claude-3-5-sonnet-20241022': anthropic('claude-3-5-sonnet-20241022'),
          'claude-3-5-haiku-20241022': anthropic('claude-3-5-haiku-20241022'),
          'claude-3-opus-20240229': anthropic('claude-3-opus-20240229'),
        }),

        // xAI models (only if env key exists)
        ...(process.env.XAI_API_KEY && {
          'grok-beta': xai('grok-beta'),
        }),
      },
      imageModels: {
        // OpenAI image models
        ...(process.env.OPENAI_API_KEY && {
          'dall-e-3': openai.image('dall-e-3'),
          'dall-e-2': openai.image('dall-e-2'),
          'small-model': openai.image('dall-e-3'), // alias for compatibility
        }),
      },
    });

import { customProvider } from 'ai';
import { google } from '@ai-sdk/google';

import { isTestEnvironment } from '../constants';
import { gemini20Flash, gemini20FlashLite } from './models.test';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'gemini-2.0-flash': gemini20Flash, // Placeholder
        'gemini-2.0-flash-lite': gemini20FlashLite, // Placeholder - Consider using chatModel for simplicity or removing
        // 'gemini-2.5-flash': chatModel, // Placeholder
      },
      imageModels: {
        // ...
      },
    })
  : customProvider({
      languageModels: {
        // --- CORRECTED GOOGLE MODEL IDs ---
        // 'gemini-1.5-flash': google('gemini-1.5-flash'),
        // 'chat-model-reasoning': wrapLanguageModel({
        //   model: google('gemini-1.5-pro'),
        //   middleware: extractReasoningMiddleware({ tagName: 'think' }),
        // }),
        // 'title-model': google('gemini-1.5-flash'),
        // 'artifact-model': google('gemini-1.5-pro'),

        'gemini-2.0-flash': google('gemini-2.0-flash'),
        'gemini-2.0-flash-lite': google('gemini-2.0-flash-lite'),
        'gemini-2.5-flash': google('gemini-2.5-flash'),

        // 'gpt-4.0-mini': openai('gpt-4o-mini'),
        // 'gpt-4.1-mini': openai('gpt-4.1-mini'),
        // 'gpt-4.1-nano': openai('gpt-4.1-nano'),
      },
      imageModels: {},
    });

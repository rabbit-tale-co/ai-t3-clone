export const DEFAULT_CHAT_MODEL: string = 'gemini-2.0-flash';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
}

export const chatModels: Array<ChatModel> = [
  // --- Google Gemini Models ---
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Fast and efficient Gemini model.',
    capabilities: ['text', 'image', 'audio', 'video'],
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite',
    description: 'Lighter and even faster version of Gemini Flash.',
    capabilities: ['text', 'image', 'audio', 'video'],
  },
  // {
  //   id: 'gemini-2.5-flash',
  //   name: 'Gemini 2.5 Flash',
  //   description: 'The latest and fastest Gemini Flash model.',
  // },
  // --- OpenAI GPT Models ---
  // {
  //   id: 'gpt-4.0-mini',
  //   name: 'GPT-4o Mini',
  //   description: 'Cost-effective and capable GPT-4o variant.',
  // },
  // {
  //   id: 'gpt-4.1-mini',
  //   name: 'GPT-4.1 Mini',
  //   description: 'A miniature version of GPT-4.1 for quick tasks.',
  // },
  // {
  //   id: 'gpt-4.1-nano',
  //   name: 'GPT-4.1 Nano',
  //   description: 'Extremely compact and fast GPT-4.1 for simple interactions.',
  // },
];

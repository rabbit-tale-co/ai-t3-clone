export const DEFAULT_CHAT_MODEL: string = 'gemini-2.0-flash';

// Helper functions to get the best available model for specific tasks
function isModelAvailable(modelId: string): boolean {
  // Check if the required API key exists for the model
  if (modelId.startsWith('gemini')) {
    return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  }
  if (modelId.startsWith('gpt')) {
    return !!process.env.OPENAI_API_KEY;
  }
  if (modelId.startsWith('claude')) {
    return !!process.env.ANTHROPIC_API_KEY;
  }
  if (modelId.startsWith('grok')) {
    return !!process.env.XAI_API_KEY;
  }
  return false;
}

export function getBestModelForCapability(capability: string): string {
  // Get all models that support the required capability
  const capableModels = chatModels.filter(
    (model) =>
      model.capabilities.includes(capability) && isModelAvailable(model.id),
  );

  if (capableModels.length === 0) {
    return DEFAULT_CHAT_MODEL;
  }

  // Priority order based on general quality/preference
  const preferredOrder = [
    'gpt-4o',
    'claude-3-5-sonnet-20241022',
    'gemini-2.0-flash',
    'gpt-4o-mini',
    'gemini-1.5-pro',
    'claude-3-5-haiku-20241022',
    'gpt-4-turbo',
    'gemini-1.5-flash',
    'gpt-3.5-turbo',
  ];

  // Return first available model from preferred list that has the capability
  for (const modelId of preferredOrder) {
    const model = capableModels.find((m) => m.id === modelId);
    if (model) {
      return model.id;
    }
  }

  // If no preferred model found, return first capable model
  return capableModels[0].id;
}

export function getBestTextModel(): string {
  return getBestModelForCapability('text');
}

export function getBestCodeModel(): string {
  // For code, we prefer text capability (all models have it)
  return getBestModelForCapability('text');
}

export function getBestDataModel(): string {
  // For data/spreadsheet, we prefer text capability
  return getBestModelForCapability('text');
}

export function getBestImageModel(): string {
  // For image generation, we need actual image models, not language models with image capability
  // Check what image models are available
  if (process.env.OPENAI_API_KEY) {
    return 'dall-e-3'; // Best OpenAI image model
  }

  // Fallback to language model with image capability for multimodal output
  return getBestModelForCapability('image');
}

// Favorite models - most popular and recommended
export const FAVORITE_MODELS: string[] = [
  'gemini-2.0-flash',
  'gpt-4o',
  'claude-3-5-sonnet-20241022',
  'gpt-4o-mini',
  'gemini-1.5-pro',
  'claude-3-5-haiku-20241022',
];

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
}

export interface Provider {
  id: string;
  name: string;
  description: string;
  models: ChatModel[];
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
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Advanced Gemini model with enhanced capabilities.',
    capabilities: ['text', 'image', 'audio', 'video'],
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Fast and efficient Gemini 1.5 model.',
    capabilities: ['text', 'image', 'audio', 'video'],
  },

  // --- OpenAI GPT Models ---
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most advanced OpenAI model with multimodal capabilities.',
    capabilities: ['text', 'image'],
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Cost-effective and capable GPT-4o variant.',
    capabilities: ['text', 'image'],
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Enhanced GPT-4 with improved performance.',
    capabilities: ['text', 'image'],
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and efficient GPT-3.5 model.',
    capabilities: ['text'],
  },

  // --- Anthropic Claude Models ---
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Most intelligent Claude model with enhanced capabilities.',
    capabilities: ['text', 'image'],
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    description: 'Fast and efficient Claude model.',
    capabilities: ['text', 'image'],
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    description: 'Most powerful Claude 3 model.',
    capabilities: ['text', 'image'],
  },

  // --- xAI Grok Models ---
  {
    id: 'grok-beta',
    name: 'Grok Beta',
    description: "xAI's conversational AI model.",
    capabilities: ['text'],
  },

  // --- Groq Models ---
  {
    id: 'llama-3.1-70b-versatile',
    name: 'Llama 3.1 70B',
    description: "Meta's Llama 3.1 70B model on Groq.",
    capabilities: ['text'],
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    description: "Meta's Llama 3.1 8B model on Groq.",
    capabilities: ['text'],
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    description: "Mistral's Mixtral 8x7B model on Groq.",
    capabilities: ['text'],
  },

  // --- Cohere Models ---
  {
    id: 'command-r-plus',
    name: 'Command R+',
    description: "Cohere's most advanced model.",
    capabilities: ['text'],
  },
  {
    id: 'command-r',
    name: 'Command R',
    description: "Cohere's efficient command model.",
    capabilities: ['text'],
  },

  // --- Mistral Models ---
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large',
    description: "Mistral's most advanced model.",
    capabilities: ['text'],
  },
  {
    id: 'mistral-medium-latest',
    name: 'Mistral Medium',
    description: 'Balanced Mistral model.',
    capabilities: ['text'],
  },
  {
    id: 'mistral-small-latest',
    name: 'Mistral Small',
    description: 'Fast and efficient Mistral model.',
    capabilities: ['text'],
  },
];

export const providers: Array<Provider> = [
  {
    id: 'google',
    name: 'Google',
    description: 'Google Gemini models',
    models: chatModels.filter((model) => model.id.startsWith('gemini')),
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'OpenAI GPT models',
    models: chatModels.filter((model) => model.id.startsWith('gpt')),
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Anthropic Claude models',
    models: chatModels.filter((model) => model.id.startsWith('claude')),
  },
  {
    id: 'xai',
    name: 'xAI',
    description: 'xAI Grok models',
    models: chatModels.filter((model) => model.id.startsWith('grok')),
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Fast inference with various models',
    models: chatModels.filter(
      (model) => model.id.startsWith('llama') || model.id.startsWith('mixtral'),
    ),
  },
  {
    id: 'cohere',
    name: 'Cohere',
    description: 'Cohere Command models',
    models: chatModels.filter((model) => model.id.startsWith('command')),
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    description: 'Mistral AI models',
    models: chatModels.filter((model) => model.id.startsWith('mistral')),
  },
];

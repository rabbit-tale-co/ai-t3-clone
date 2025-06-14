'use client';

import * as React from 'react';
import { FileText, Settings, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/hooks/use-language';
import { z } from 'zod/v4';

// API Key validation schemas for different providers
const apiKeyValidationSchemas = {
  openai: z
    .string()
    .min(1, 'API key is required')
    .regex(
      /^sk-[A-Za-z0-9]{48}$/,
      'OpenAI API key must start with "sk-" and be 51 characters long',
    ),

  anthropic: z
    .string()
    .min(1, 'API key is required')
    .regex(
      /^sk-ant-api03-[A-Za-z0-9_-]{95}$/,
      'Anthropic API key must start with "sk-ant-api03-" and be 108 characters long',
    ),

  google: z
    .string()
    .min(1, 'API key is required')
    .regex(
      /^AIza[A-Za-z0-9_-]{35}$/,
      'Google API key must start with "AIza" and be 39 characters long',
    ),

  xai: z
    .string()
    .min(1, 'API key is required')
    .regex(
      /^xai-[A-Za-z0-9]{64}$/,
      'xAI API key must start with "xai-" and be 68 characters long',
    ),

  groq: z
    .string()
    .min(1, 'API key is required')
    .regex(
      /^gsk_[A-Za-z0-9]{52}$/,
      'Groq API key must start with "gsk_" and be 56 characters long',
    ),

  cohere: z
    .string()
    .min(1, 'API key is required')
    .regex(/^[A-Za-z0-9]{40}$/, 'Cohere API key must be 40 characters long'),

  mistral: z
    .string()
    .min(1, 'API key is required')
    .regex(/^[A-Za-z0-9]{32}$/, 'Mistral API key must be 32 characters long'),

  openrouter: z
    .string()
    .min(1, 'API key is required')
    .regex(
      /^sk-or-v1-[A-Za-z0-9]{64}$/,
      'OpenRouter API key must start with "sk-or-v1-" and be 74 characters long',
    ),

  perplexity: z
    .string()
    .min(1, 'API key is required')
    .regex(
      /^pplx-[A-Za-z0-9]{64}$/,
      'Perplexity API key must start with "pplx-" and be 69 characters long',
    ),
};

// Function to validate API key for specific provider
export const validateApiKey = (provider: string, apiKey: string) => {
  const schema =
    apiKeyValidationSchemas[provider as keyof typeof apiKeyValidationSchemas];
  if (!schema) {
    return { success: false, error: 'Unknown provider' };
  }

  try {
    schema.parse(apiKey);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Invalid API key format' };
  }
};

export function AttachmentsTab() {
  const { t } = useLanguage();
  const [testApiKey, setTestApiKey] = React.useState('');
  const [testProvider, setTestProvider] = React.useState('openai');
  const [validationResult, setValidationResult] = React.useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  const handleValidateKey = () => {
    const result = validateApiKey(testProvider, testApiKey);
    setValidationResult(result);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-pink-900 dark:text-pink-100 mb-2">
          API Key Validation Test
        </h2>
        <p className="text-pink-600 dark:text-pink-400">
          Test API key validation for different providers
        </p>
      </div>

      {/* API Key Validation Test Section */}
      <div className="bg-pink-50/50 dark:bg-pink-900/20 border border-pink-200/50 dark:border-pink-800/30 rounded-lg p-4">
        <h3 className="font-semibold text-pink-900 dark:text-pink-100 mb-4">
          Test API Key Validation
        </h3>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="provider-select"
              className="block text-sm font-medium text-pink-900 dark:text-pink-100 mb-2"
            >
              Provider
            </label>
            <select
              id="provider-select"
              value={testProvider}
              onChange={(e) => setTestProvider(e.target.value)}
              className="w-full px-3 py-2 border border-pink-200 dark:border-pink-800/50 rounded-md bg-white dark:bg-black/50 text-pink-900 dark:text-pink-100"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="xai">xAI</option>
              <option value="groq">Groq</option>
              <option value="cohere">Cohere</option>
              <option value="mistral">Mistral</option>
              <option value="openrouter">OpenRouter</option>
              <option value="perplexity">Perplexity</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="api-key-input"
              className="block text-sm font-medium text-pink-900 dark:text-pink-100 mb-2"
            >
              API Key
            </label>
            <Input
              id="api-key-input"
              value={testApiKey}
              onChange={(e) => setTestApiKey(e.target.value)}
              placeholder="Enter API key to validate..."
              className="border-pink-200 dark:border-pink-800/50 bg-white/80 dark:bg-black/50"
            />
          </div>

          <Button
            onClick={handleValidateKey}
            className="bg-pink-600 hover:bg-pink-700 text-white"
          >
            Validate Key
          </Button>

          {validationResult && (
            <div
              className={`p-3 rounded-md ${
                validationResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50'
              }`}
            >
              <p
                className={`text-sm ${
                  validationResult.success
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }`}
              >
                {validationResult.success
                  ? '✅ API key format is valid!'
                  : `❌ ${validationResult.error}`}
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-pink-900 dark:text-pink-100 mb-2">
          {t('settings.attachments.title')}
        </h2>
        <p className="text-pink-600 dark:text-pink-400">
          {t('settings.attachments.description')}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-pink-50/50 dark:bg-pink-900/20 border border-pink-200/50 dark:border-pink-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-pink-600 dark:text-pink-400" />
            <h3 className="font-semibold text-pink-900 dark:text-pink-100">
              {t('settings.attachments.sent')}
            </h3>
          </div>
          <p className="text-2xl font-bold text-pink-900 dark:text-pink-100">
            24
          </p>
        </div>
        <div className="bg-pink-50/50 dark:bg-pink-900/20 border border-pink-200/50 dark:border-pink-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings size={16} className="text-pink-600 dark:text-pink-400" />
            <h3 className="font-semibold text-pink-900 dark:text-pink-100">
              {t('settings.attachments.totalSize')}
            </h3>
          </div>
          <p className="text-2xl font-bold text-pink-900 dark:text-pink-100">
            156 MB
          </p>
        </div>
        <div className="bg-pink-50/50 dark:bg-pink-900/20 border border-pink-200/50 dark:border-pink-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <History size={16} className="text-pink-600 dark:text-pink-400" />
            <h3 className="font-semibold text-pink-900 dark:text-pink-100">
              {t('settings.attachments.lastUpload')}
            </h3>
          </div>
          <p className="text-2xl font-bold text-pink-900 dark:text-pink-100">
            7 days
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder={t('settings.attachments.searchFiles')}
            className="border-pink-200 dark:border-pink-800/50 bg-white/80 dark:bg-black/50 text-pink-900 dark:text-pink-100 placeholder:text-pink-500 dark:placeholder:text-pink-400 focus:border-pink-400 dark:focus:border-pink-600"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
          >
            {t('settings.attachments.allTypes')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
          >
            {t('settings.attachments.images')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
          >
            {t('settings.attachments.documents')}
          </Button>
        </div>
      </div>

      {/* Files List */}
      <div className="space-y-3">
        {[
          {
            name: 'project-proposal.pdf',
            size: '2.4 MB',
            type: 'PDF',
            date: '2 days ago',
            chat: 'Business Planning Chat',
          },
          {
            name: 'screenshot.png',
            size: '1.2 MB',
            type: 'PNG',
            date: '5 days ago',
            chat: 'Design Review Chat',
          },
          {
            name: 'code-snippet.py',
            size: '15 KB',
            type: 'Python',
            date: '1 week ago',
            chat: 'Programming Help Chat',
          },
        ].map((file) => (
          <div
            key={`${file.name}-${new Date().getTime()}`}
            className="border border-pink-200/50 dark:border-pink-800/30 rounded-lg p-4 bg-white/50 dark:bg-black/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                  <FileText
                    size={20}
                    className="text-pink-600 dark:text-pink-400"
                  />
                </div>
                <div>
                  <h4 className="font-medium text-pink-900 dark:text-pink-100">
                    {file.name}
                  </h4>
                  <p className="text-sm text-pink-600 dark:text-pink-400">
                    {file.size} • {file.type} • {file.date}
                  </p>
                  <p className="text-xs text-pink-500 dark:text-pink-400">
                    {t('settings.attachments.from')}: {file.chat}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                >
                  {t('ui.buttons.download')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {t('ui.buttons.delete')}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center pt-4">
        <Button
          variant="outline"
          className="border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
        >
          {t('ui.buttons.loadMore')}
        </Button>
      </div>
    </div>
  );
}

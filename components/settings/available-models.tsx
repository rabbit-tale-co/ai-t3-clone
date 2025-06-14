'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Zap,
  FileText,
  Image as ImageIcon,
  Mic,
  Video,
  Globe,
  Bot,
  Database,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { getAvailableModelsAction } from '@/app/(auth)/models-actions';
import type { ChatModel } from '@/lib/ai/models';
import { useLanguage } from '@/hooks/use-language';

interface AvailableModelsProps {
  userId?: string;
}

const capabilityIcons = {
  text: <FileText className="size-3" />,
  image: <ImageIcon className="size-3" />,
  audio: <Mic className="size-3" />,
  video: <Video className="size-3" />,
  code: <Bot className="size-3" />,
  web: <Globe className="size-3" />,
};

const capabilityLabels = {
  text: 'Text',
  image: 'Images',
  audio: 'Audio',
  video: 'Video',
  code: 'Code',
  web: 'Web',
};

const providerColors = {
  Google: 'bg-blue-500',
  OpenAI: 'bg-green-500',
  Anthropic: 'bg-orange-500',
  xAI: 'bg-purple-500',
  Groq: 'bg-red-500',
  Cohere: 'bg-indigo-500',
  'Mistral AI': 'bg-yellow-500',
};

// Enhanced loading skeleton component
function ModelLoadingSkeleton() {
  return (
    <Card className="border-pink-200/30 dark:border-pink-800/20 bg-white/70 dark:bg-black/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Model Icon Skeleton */}
          <Skeleton className="size-10 rounded-xl" />

          {/* Model Info Skeleton */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />

            {/* Capabilities Skeleton */}
            <div className="flex items-center gap-2 pt-2">
              <Skeleton className="size-6 rounded" />
              <Skeleton className="size-6 rounded" />
              <Skeleton className="size-6 rounded" />
              <Skeleton className="size-6 rounded" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProviderLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Provider Header Skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-3 rounded-full" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      {/* Models Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ModelLoadingSkeleton />
        <ModelLoadingSkeleton />
      </div>
    </div>
  );
}

export function AvailableModels({ userId }: AvailableModelsProps) {
  const { t } = useLanguage();
  const [models, setModels] = React.useState<ChatModel[]>([]);
  const [providers, setProviders] = React.useState<Record<string, any>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadModels() {
      try {
        const data = await getAvailableModelsAction();
        setModels(data.models);
        setProviders(data.providers);
      } catch (error) {
        console.error('Error loading models:', error);
      } finally {
        setLoading(false);
      }
    }

    loadModels();
  }, []);

  if (loading) {
    return (
      <Card className="border-pink-200/50 dark:border-pink-800/30 bg-gradient-to-br from-white/50 to-pink-50/30 dark:from-black/30 dark:to-pink-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-pink-900 dark:text-pink-100">
            <div className="size-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
              <Database className="size-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-bold">Available Models</span>
              <div className="text-sm font-normal text-pink-600 dark:text-pink-400 mt-0.5">
                Loading your available models...
              </div>
            </div>
          </CardTitle>
          <CardDescription className="text-pink-600 dark:text-pink-400">
            Fetching models based on your API keys and environment configuration
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <ProviderLoadingSkeleton />
          <ProviderLoadingSkeleton />
          <ProviderLoadingSkeleton />
        </CardContent>
      </Card>
    );
  }

  const groupedModels = models.reduce(
    (acc, model) => {
      // Determine provider from model ID since provider property doesn't exist
      let provider = 'Unknown';
      if (model.id.startsWith('gemini')) provider = 'Google';
      else if (model.id.startsWith('gpt')) provider = 'OpenAI';
      else if (model.id.startsWith('claude')) provider = 'Anthropic';
      else if (model.id.startsWith('grok')) provider = 'xAI';
      else if (model.id.includes('llama') || model.id.includes('mixtral'))
        provider = 'Groq';
      else if (model.id.startsWith('command')) provider = 'Cohere';
      else if (model.id.startsWith('mistral')) provider = 'Mistral AI';
      if (!acc[provider]) acc[provider] = [];
      acc[provider].push(model);
      return acc;
    },
    {} as Record<string, ChatModel[]>,
  );

  return (
    <Card className="border-pink-200/50 dark:border-pink-800/30 bg-gradient-to-br from-white/50 to-pink-50/30 dark:from-black/30 dark:to-pink-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-pink-900 dark:text-pink-100">
          <div className="size-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
            <Database className="size-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold">Available Models</span>
            <div className="text-sm font-normal text-pink-600 dark:text-pink-400 mt-0.5">
              {models.length} models from {Object.keys(groupedModels).length}{' '}
              providers
            </div>
          </div>
        </CardTitle>
        <CardDescription className="text-pink-600 dark:text-pink-400">
          Models available based on your API keys and environment configuration
        </CardDescription>
      </CardHeader>

      <CardContent>
        {Object.keys(groupedModels).length === 0 ? (
          <div className="text-center py-12">
            <div className="size-16 mx-auto mb-4 rounded-2xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              <AlertCircle className="size-8 text-pink-500 dark:text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold text-pink-900 dark:text-pink-100 mb-2">
              No models available
            </h3>
            <p className="text-pink-600 dark:text-pink-400 mb-4 max-w-md mx-auto">
              Add API keys in the &quot;API Keys&quot; tab to access AI models
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedModels).map(([provider, providerModels]) => (
              <div key={provider}>
                {/* Provider Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`size-3 rounded-full ${providerColors[provider as keyof typeof providerColors] || 'bg-gray-500'}`}
                  />
                  <h3 className="text-lg font-semibold text-pink-900 dark:text-pink-100">
                    {provider}
                  </h3>
                  <Badge className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-0">
                    {providerModels.length} models
                  </Badge>
                  {providers[provider.toLowerCase()]?.hasUserKey && (
                    <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-0">
                      <CheckCircle className="size-3 mr-1" />
                      API Key
                    </Badge>
                  )}
                </div>

                {/* Models Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {providerModels.map((model) => (
                    <Card
                      key={model.id}
                      className="border-pink-200/30 dark:border-pink-800/20 bg-white/70 dark:bg-black/20 hover:bg-white/90 dark:hover:bg-black/30 transition-all duration-200 hover:shadow-md group"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Model Icon */}
                          <div className="size-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Zap className="size-5 text-white" />
                          </div>

                          {/* Model Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm text-pink-900 dark:text-pink-100 truncate">
                                {model.name}
                              </h4>
                              <Badge className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs border-0">
                                {provider}
                              </Badge>
                            </div>

                            <p className="text-xs text-pink-600 dark:text-pink-400 mb-3 line-clamp-2">
                              {model.description ||
                                'Advanced AI model for various tasks'}
                            </p>

                            {/* Capabilities */}
                            <div className="flex items-center gap-1.5">
                              {model.capabilities
                                .slice(0, 4)
                                .map((capability) => {
                                  const icon =
                                    capabilityIcons[
                                      capability as keyof typeof capabilityIcons
                                    ];
                                  const label =
                                    capabilityLabels[
                                      capability as keyof typeof capabilityLabels
                                    ];

                                  return icon ? (
                                    <div
                                      key={capability}
                                      className="size-6 rounded bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 group-hover:bg-pink-200 dark:group-hover:bg-pink-900/50 transition-colors"
                                      title={label}
                                    >
                                      {icon}
                                    </div>
                                  ) : null;
                                })}

                              {model.capabilities.length > 4 && (
                                <div
                                  className="size-6 rounded bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 text-xs font-medium group-hover:bg-pink-200 dark:group-hover:bg-pink-900/50 transition-colors"
                                  title={`${model.capabilities.length - 4} more capabilities`}
                                >
                                  +{model.capabilities.length - 4}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

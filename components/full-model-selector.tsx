'use client';

import React, { useState, useEffect, useMemo, cloneElement } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  Zap,
  Globe,
  FileText,
  X,
  CheckCircle,
  Sparkles,
  Image as ImageIcon,
  Video,
  Mic,
  Bot,
  Database,
  Lock,
  Key,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatModels, type ChatModel } from '@/lib/ai/models';
import { useSession } from 'next-auth/react';
import { getAvailableModelsAction } from '@/app/(auth)/models-actions';
import { useIsMobile } from '@/hooks/use-mobile';

interface FullModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

interface ModelWithAccess extends ChatModel {
  isAvailable: boolean;
  requiresApiKey: boolean;
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
  text: 'Text processing',
  image: 'Image analysis',
  audio: 'Audio processing',
  video: 'Video analysis',
  code: 'Code generation',
  web: 'Web search',
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

// Helper function to get provider from model ID
const getProviderFromModelId = (modelId: string): string => {
  if (modelId.startsWith('gemini')) return 'Google';
  if (modelId.startsWith('gpt')) return 'OpenAI';
  if (modelId.startsWith('claude')) return 'Anthropic';
  if (modelId.startsWith('grok')) return 'xAI';
  if (modelId.includes('llama') || modelId.includes('mixtral')) return 'Groq';
  if (modelId.startsWith('command')) return 'Cohere';
  if (modelId.startsWith('mistral')) return 'Mistral AI';
  return 'Unknown';
};

// Helper function to get provider ID from model ID
const getProviderIdFromModelId = (modelId: string): string => {
  if (modelId.startsWith('gemini')) return 'google';
  if (modelId.startsWith('gpt')) return 'openai';
  if (modelId.startsWith('claude')) return 'anthropic';
  if (modelId.startsWith('grok')) return 'xai';
  if (modelId.includes('llama') || modelId.includes('mixtral')) return 'groq';
  if (modelId.startsWith('command')) return 'cohere';
  if (modelId.startsWith('mistral')) return 'mistral';
  return 'unknown';
};

export function FullModelSelector({
  selectedModel,
  onModelChange,
  isOpen = false,
  setIsOpen,
}: FullModelSelectorProps) {
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>(
    [],
  );
  const [showFilters, setShowFilters] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [availableModels, setAvailableModels] = useState<ChatModel[]>([]);
  const [availableProviders, setAvailableProviders] = useState<
    Record<string, any>
  >({});
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const isMobile = useIsMobile();

  const effectiveIsOpen = isOpen !== undefined ? isOpen : localIsOpen;
  const effectiveSetIsOpen = setIsOpen || setLocalIsOpen;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch available models when dialog opens
  useEffect(() => {
    if (effectiveIsOpen && isClient) {
      const fetchAvailableModels = async () => {
        try {
          setLoading(true);
          const data = await getAvailableModelsAction();
          setAvailableModels(data.models);
          setAvailableProviders(data.providers);
        } catch (error) {
          console.error('Error fetching available models:', error);
          setAvailableModels([]);
          setAvailableProviders({});
        } finally {
          setLoading(false);
        }
      };

      fetchAvailableModels();
    }
  }, [effectiveIsOpen, isClient]);

  const modelsWithAccess = useMemo((): ModelWithAccess[] => {
    if (!isClient) return [];

    return chatModels.map((model) => {
      const providerId = getProviderIdFromModelId(model.id);
      const isAvailable = availableModels.some((m) => m.id === model.id);
      const requiresApiKey = !availableProviders[providerId]?.hasEnvKey;

      return {
        ...model,
        isAvailable,
        requiresApiKey,
      };
    });
  }, [isClient, availableModels, availableProviders]);

  const providers = useMemo(() => {
    const uniqueProviders = [
      ...new Set(
        modelsWithAccess.map((model) => getProviderFromModelId(model.id)),
      ),
    ];
    return uniqueProviders.sort();
  }, [modelsWithAccess]);

  const filteredModels = modelsWithAccess.filter((model: ModelWithAccess) => {
    const modelProvider = getProviderFromModelId(model.id);

    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      modelProvider.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvider =
      selectedProvider === 'all' || modelProvider === selectedProvider;

    const matchesCapabilities =
      selectedCapabilities.length === 0 ||
      selectedCapabilities.every((cap) => model.capabilities.includes(cap));

    return matchesSearch && matchesProvider && matchesCapabilities;
  });

  const handleModelSelect = (modelId: string, isAvailable: boolean) => {
    if (!isAvailable) return; // Don't allow selection of unavailable models

    effectiveSetIsOpen(false);
    setTimeout(() => {
      onModelChange(modelId);
    }, 100);
  };

  const toggleCapability = (capability: string) => {
    setSelectedCapabilities((prev) =>
      prev.includes(capability)
        ? prev.filter((c) => c !== capability)
        : [...prev, capability],
    );
  };

  const clearFilters = () => {
    setSelectedProvider('all');
    setSelectedCapabilities([]);
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedProvider !== 'all' ||
    selectedCapabilities.length > 0 ||
    searchQuery;

  // Group models by provider
  const groupedModels = useMemo(() => {
    const groups: Record<string, ModelWithAccess[]> = {};
    filteredModels.forEach((model) => {
      const provider = getProviderFromModelId(model.id);
      if (!groups[provider]) groups[provider] = [];
      groups[provider].push(model);
    });
    return groups;
  }, [filteredModels]);

  const mainContent = (
    <div
      className={cn(
        'flex gap-6 min-h-0 pt-4',
        isMobile ? 'flex-col' : 'flex-1',
      )}
    >
      {/* Sidebar Filters */}
      <div
        className={cn(
          'space-y-4 overflow-y-auto px-px',
          isMobile ? 'w-full' : 'w-64',
        )}
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-pink-500 dark:text-pink-400" />
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-lg border-pink-200 dark:border-pink-800/50 bg-white/80 dark:bg-black/50 text-pink-900 dark:text-pink-100 placeholder:text-pink-500 dark:placeholder:text-pink-400 focus:border-pink-400 dark:focus:border-pink-600"
          />
        </div>

        {!isMobile && (
          <>
            {/* Provider Filter */}
            <div>
              <h3 className="text-sm font-medium text-pink-900 dark:text-pink-100 mb-2">
                Provider
              </h3>
              <div className="space-y-1">
                <Button
                  variant={selectedProvider === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedProvider('all')}
                  className={cn(
                    'w-full justify-start h-8 text-xs',
                    selectedProvider === 'all'
                      ? 'bg-pink-500 text-white hover:bg-pink-600'
                      : 'text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20',
                  )}
                >
                  All Providers ({modelsWithAccess.length})
                </Button>
                {providers.map((provider) => {
                  const count = modelsWithAccess.filter(
                    (m) => getProviderFromModelId(m.id) === provider,
                  ).length;
                  const availableCount = modelsWithAccess.filter(
                    (m) =>
                      getProviderFromModelId(m.id) === provider &&
                      m.isAvailable,
                  ).length;
                  return (
                    <Button
                      key={provider}
                      variant={
                        selectedProvider === provider ? 'default' : 'ghost'
                      }
                      size="sm"
                      onClick={() => setSelectedProvider(provider)}
                      className={cn(
                        'w-full justify-start h-8 text-xs',
                        selectedProvider === provider
                          ? 'bg-pink-500 text-white hover:bg-pink-600'
                          : 'text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20',
                      )}
                    >
                      <div
                        className={cn(
                          'size-2 rounded-full mr-2',
                          providerColors[
                            provider as keyof typeof providerColors
                          ] || 'bg-gray-500',
                        )}
                      />
                      {provider} ({availableCount}/{count})
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Capabilities Filter */}
            <div>
              <h3 className="text-sm font-medium text-pink-900 dark:text-pink-100 mb-2">
                Capabilities
              </h3>
              <div className="space-y-1">
                {Object.entries(capabilityIcons).map(([capability, icon]) => (
                  <Button
                    key={capability}
                    variant={
                      selectedCapabilities.includes(capability)
                        ? 'default'
                        : 'ghost'
                    }
                    size="sm"
                    onClick={() => toggleCapability(capability)}
                    className={cn(
                      'w-full justify-start h-8 text-xs',
                      selectedCapabilities.includes(capability)
                        ? 'bg-pink-500 text-white hover:bg-pink-600'
                        : 'text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {icon}
                      <span>
                        {
                          capabilityLabels[
                            capability as keyof typeof capabilityLabels
                          ]
                        }
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800"
              >
                <X className="size-3 mr-1" />
                Clear filters
              </Button>
            )}
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="size-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4">
              <Sparkles className="size-6 text-pink-500 dark:text-pink-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-medium text-pink-900 dark:text-pink-100 mb-2">
              Loading models...
            </h3>
            <p className="text-sm text-pink-600 dark:text-pink-400">
              Checking your available models and API keys
            </p>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Database className="size-12 text-pink-400 dark:text-pink-600 mb-4" />
            <h3 className="text-lg font-medium text-pink-900 dark:text-pink-100 mb-2">
              No models found
            </h3>
            <p className="text-sm text-pink-600 dark:text-pink-400 mb-4">
              No models match your search criteria
            </p>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              'h-full overflow-y-auto space-y-6',
              isMobile ? 'pr-0' : 'pr-2',
            )}
          >
            {Object.entries(groupedModels).map(([provider, providerModels]) => (
              <div key={provider} className="space-y-3">
                <div className="flex items-center gap-3 sticky top-0 bg-gradient-to-r from-pink-50/95 to-pink-100/80 dark:from-black/95 dark:to-pink-950/30 backdrop-blur-sm py-2 z-10 rounded-lg">
                  <div
                    className={cn(
                      'size-3 rounded-full',
                      providerColors[provider as keyof typeof providerColors] ||
                        'bg-gray-500',
                    )}
                  />
                  <h3 className="text-lg font-semibold text-pink-900 dark:text-gray-100">
                    {provider}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs"
                  >
                    {providerModels.length} models
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {providerModels.map((model) => (
                    <ModelCard
                      key={model.id}
                      model={model}
                      isSelected={selectedModel === model.id}
                      onSelect={() =>
                        handleModelSelect(model.id, model.isAvailable)
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Mobile version with Drawer
  if (isMobile) {
    return (
      <TooltipProvider>
        <Drawer open={effectiveIsOpen} onOpenChange={effectiveSetIsOpen}>
          <DrawerContent className="bg-gradient-to-br from-pink-50/95 to-pink-100/80 dark:from-black/98 dark:to-pink-950/30 border-pink-200/60 dark:border-pink-900/40 backdrop-blur-xl h-[95vh] overflow-hidden flex flex-col">
            <DrawerHeader className="pb-4 border-b border-pink-200/50 dark:border-pink-900/30 shrink-0">
              <DrawerTitle className="text-pink-900 dark:text-gray-100">
                AI Model Library
              </DrawerTitle>
              <p className="text-sm text-pink-600 dark:text-pink-400">
                Choose the perfect model for your task
              </p>
              <div className="text-sm text-pink-600 dark:text-pink-400 bg-pink-100/50 dark:bg-pink-900/20 px-3 py-1 rounded-full w-fit">
                {loading ? 'Loading...' : `${filteredModels.length} available`}
              </div>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto p-4">{mainContent}</div>
          </DrawerContent>
        </Drawer>
      </TooltipProvider>
    );
  }

  // Desktop version with Dialog
  return (
    <TooltipProvider>
      <Dialog open={effectiveIsOpen} onOpenChange={effectiveSetIsOpen}>
        <DialogContent className="w-[95vw] min-w-6xl h-[95vh] overflow-hidden bg-gradient-to-br from-pink-50/95 to-pink-100/80 dark:from-black/98 dark:to-pink-950/30 border-pink-200/60 dark:border-pink-900/40 backdrop-blur-xl rounded-2xl flex flex-col">
          {/* Header */}
          <DialogHeader className="pb-4 border-b border-pink-200/50 dark:border-pink-900/30">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
                  <Sparkles className="size-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-pink-900 dark:text-gray-100">
                    AI Model Library
                  </h2>
                  <p className="text-sm text-pink-600 dark:text-pink-400 mt-0.5">
                    Choose the perfect model for your task
                  </p>
                </div>
              </div>
              <div className="text-sm text-pink-600 dark:text-pink-400 bg-pink-100/50 dark:bg-pink-900/20 px-3 py-1 rounded-full">
                {loading ? 'Loading...' : `${filteredModels.length} available`}
              </div>
            </DialogTitle>
          </DialogHeader>

          {mainContent}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

function ModelCard({
  model,
  isSelected,
  onSelect,
}: {
  model: ModelWithAccess;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const modelProvider = getProviderFromModelId(model.id);
  const isDisabled = !model.isAvailable;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md group h-full py-0',
        isSelected
          ? 'ring-2 ring-pink-500 bg-gradient-to-br from-pink-100 to-pink-200/80 dark:from-pink-900/40 dark:to-pink-800/30 border-pink-300 dark:border-pink-600 shadow-lg'
          : isDisabled
            ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
            : 'hover:bg-pink-50/50 dark:hover:bg-pink-950/20 border-pink-200/50 dark:border-pink-800/50 hover:border-pink-300 dark:hover:border-pink-700',
      )}
      onClick={isDisabled ? undefined : onSelect}
    >
      <CardContent className="p-3 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className={cn(
              'size-8 rounded-lg flex items-center justify-center transition-all',
              isSelected
                ? 'bg-pink-500 text-white shadow-md'
                : isDisabled
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                  : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 group-hover:bg-pink-200 dark:group-hover:bg-pink-900/50',
            )}
          >
            {isDisabled ? (
              <Lock className="size-4" />
            ) : (
              <Zap className="size-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <h3
                className={cn(
                  'font-semibold text-sm truncate',
                  isDisabled
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-pink-900 dark:text-pink-100',
                )}
              >
                {model.name}
              </h3>
              {isSelected && !isDisabled && (
                <CheckCircle className="size-3 text-pink-500" />
              )}
              {model.requiresApiKey && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Key className="size-3 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Requires API key
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  'size-1.5 rounded-full',
                  isDisabled
                    ? 'bg-gray-400'
                    : providerColors[
                        modelProvider as keyof typeof providerColors
                      ] || 'bg-gray-500',
                )}
              />
              <span
                className={cn(
                  'text-xs',
                  isDisabled
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-pink-600 dark:text-pink-400',
                )}
              >
                {modelProvider}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p
          className={cn(
            'text-xs mb-3 line-clamp-2 flex-1',
            isDisabled
              ? 'text-gray-400 dark:text-gray-500'
              : 'text-pink-700 dark:text-pink-300',
          )}
        >
          {isDisabled
            ? 'This model requires an API key to access'
            : model.description || 'Advanced AI model for various tasks'}
        </p>

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1 mb-3">
          {model.capabilities.slice(0, 4).map((capability) => {
            const icon =
              capabilityIcons[capability as keyof typeof capabilityIcons];
            const label =
              capabilityLabels[capability as keyof typeof capabilityLabels];

            return icon ? (
              <Tooltip key={capability}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'size-6 rounded flex items-center justify-center transition-all',
                      isSelected && !isDisabled
                        ? 'bg-pink-400/30 text-pink-700 dark:text-pink-200'
                        : isDisabled
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                          : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 group-hover:bg-pink-200 dark:group-hover:bg-pink-900/50',
                    )}
                  >
                    {cloneElement(icon, { className: 'size-3' })}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {label}
                </TooltipContent>
              </Tooltip>
            ) : null;
          })}

          {model.capabilities.length > 4 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  // TODO: make better disabled theme
                  className={cn(
                    'size-6 rounded flex items-center justify-center text-xs font-medium transition-all',
                    isSelected && !isDisabled
                      ? 'bg-pink-400/30 text-pink-700 dark:text-pink-200'
                      : isDisabled
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                        : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 group-hover:bg-pink-200 dark:group-hover:bg-pink-900/50',
                  )}
                >
                  +{model.capabilities.length - 4}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {model.capabilities.length - 4} more capabilities
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Action Button */}
        <Button
          variant={isSelected ? 'default' : 'outline'}
          size="sm"
          disabled={isDisabled}
          // TODO: make better disabled theme
          className={cn(
            'w-full transition-all h-8 text-xs',
            isSelected && !isDisabled
              ? 'bg-pink-500 hover:bg-pink-600 text-white shadow-md'
              : isDisabled
                ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700'
                : 'border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20',
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (!isDisabled) onSelect();
          }}
        >
          {isDisabled ? (
            <>
              <Lock className="size-3 mr-1" />
              Requires API Key
            </>
          ) : isSelected ? (
            <>
              <CheckCircle className="size-3 mr-1" />
              Selected
            </>
          ) : (
            'Select model'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

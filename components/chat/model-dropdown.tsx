'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  FileText,
  Sparkles,
  Zap,
  Bot,
  Globe,
  Image as ImageIcon,
  Video,
  Mic,
  Filter,
} from 'lucide-react';
import { chatModels, FAVORITE_MODELS, type ChatModel } from '@/lib/ai/models';
import { useLanguage } from '@/hooks/use-language';

interface ModelDropdownProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  onOpenFullSelector: () => void;
  availableModels?: ChatModel[];
}

const getCapabilityIcon = (capability: string) => {
  switch (capability) {
    case 'text':
      return <FileText className="size-3" />;
    case 'image':
      return <ImageIcon className="size-3" />;
    case 'audio':
      return <Mic className="size-3" />;
    case 'video':
      return <Video className="size-3" />;
    case 'code':
      return <Bot className="size-3" />;
    case 'web':
      return <Globe className="size-3" />;
    default:
      return null;
  }
};

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

export function ModelDropdown({
  selectedModel,
  onModelChange,
  onOpenFullSelector,
  availableModels = chatModels,
}: ModelDropdownProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentModel = availableModels.find(
    (model) => model.id === selectedModel,
  );

  // Get favorite models that are available
  const favoriteModels = availableModels.filter((model) =>
    FAVORITE_MODELS.includes(model.id),
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-pink-300 hover:text-gray-900 dark:hover:text-pink-200 bg-pink-300/30 dark:bg-black/50 hover:bg-pink-300/40 dark:hover:bg-black/70 rounded-xl px-3 py-1.5 backdrop-blur-sm"
        >
          <Zap className="size-4" />
          <span className="text-sm font-medium">
            {currentModel?.name || t('chat.input.selectModel')}
          </span>
          <ChevronDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-96 p-3 bg-gradient-to-br from-pink-50 to-pink-100/60 dark:from-black/95 dark:to-pink-950/20 border-pink-200 dark:border-pink-900/50 backdrop-blur-md overflow-visible"
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-pink-200 dark:border-pink-900/30">
          <Sparkles className="size-4 text-pink-600 dark:text-pink-400" />
          <span className="font-medium text-pink-900 dark:text-gray-100">
            Favorite Models
          </span>
        </div>

        {/* Favorite Models Grid */}
        <div className="space-y-1">
          {favoriteModels.map((model) => (
            <Button
              key={model.id}
              variant="ghost"
              onClick={() => {
                onModelChange(model.id);
                setIsOpen(false);
              }}
              className={`w-full justify-start p-2 h-auto transition-all rounded-xl ${
                selectedModel === model.id
                  ? 'bg-pink-200 dark:bg-pink-900/50 text-pink-900 dark:text-pink-100 border border-pink-300 dark:border-pink-700'
                  : 'hover:bg-pink-100 dark:hover:bg-pink-900/20 text-pink-800 dark:text-pink-200'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <div className="size-6 flex items-center justify-center text-pink-600 dark:text-pink-400">
                  <Zap className="size-4" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium truncate">
                    {model.name}
                  </div>
                  <div className="text-xs opacity-70 truncate">
                    {getProviderFromModelId(model.id)}
                  </div>
                </div>

                {/* Capability icons */}
                <div className="flex items-center gap-1 mr-2">
                  {model.capabilities.slice(0, 3).map((capability) => {
                    const capabilityIcon = getCapabilityIcon(capability);

                    return capabilityIcon ? (
                      <Tooltip key={capability}>
                        <TooltipTrigger asChild>
                          <div className="size-5 rounded bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors cursor-help">
                            {capabilityIcon}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          sideOffset={10}
                          avoidCollisions={false}
                        >
                          <p className="text-sm font-medium">
                            {capability === 'text' && 'Text processing'}
                            {capability === 'image' && 'Image analysis'}
                            {capability === 'audio' && 'Audio processing'}
                            {capability === 'video' && 'Video analysis'}
                            {capability === 'code' && 'Code generation'}
                            {capability === 'web' && 'Web search'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ) : null;
                  })}
                  {model.capabilities.length > 3 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="size-5 rounded bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 text-xs font-medium hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors cursor-help">
                          +{model.capabilities.length - 3}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        sideOffset={10}
                        avoidCollisions={false}
                      >
                        <p className="text-sm font-medium">
                          {model.capabilities.length - 3} more capabilities
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>

        {/* Footer with Browse All Models */}
        <div className="mt-3 pt-2 border-t border-pink-200 dark:border-pink-900/30">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                setTimeout(() => onOpenFullSelector(), 100);
              }}
              className="flex-1 text-xs text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded-md"
            >
              <Sparkles className="size-3 mr-1" />
              {t('chat.input.allModels')}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                setTimeout(() => onOpenFullSelector(), 100);
              }}
              className="px-2 text-xs text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded-md"
            >
              <Filter className="size-3" />
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

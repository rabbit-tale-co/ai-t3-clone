'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Send,
  Paperclip,
  Globe,
  ChevronDown,
  FileText,
  Sparkles,
  Database,
  Zap,
  Bot,
  Settings,
  X,
  User,
} from 'lucide-react';
import { FullModelSelector } from '../full-model-selector';
import { chatModels } from '@/lib/ai/models';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';

interface ChatInputProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  attachments: File[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (index: number) => void;
  onClearAttachments: () => void;
  onShowFileUpload: () => void;
  uploadProgress: number;
  selectedModel: string;
  onModelChange: (model: string) => void;
  searchEnabled: boolean;
  onToggleSearch: () => void;
  isStreaming: boolean;
  disabled: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  hasRemainingUsage?: boolean;
  usage?: { remaining: number; limit: number } | null;
  userType?: 'guest' | 'regular' | 'pro' | 'admin';
}

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  attachments,
  onFileUpload,
  onRemoveAttachment,
  onClearAttachments,
  onShowFileUpload,
  uploadProgress,
  selectedModel,
  onModelChange,
  searchEnabled,
  onToggleSearch,
  isStreaming,
  disabled,
  fileInputRef,
  hasRemainingUsage = true,
  usage,
  userType = 'guest',
}: ChatInputProps) {
  const { t } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200); // Max height 200px
      textarea.style.height = `${newHeight}px`;
    }
  };

  React.useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('Enter pressed in ChatInput, calling onSubmit');
      onSubmit(e as unknown as React.FormEvent);
    }
  };

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted in ChatInput, calling onSubmit');
    onSubmit(e);
  };

  const availableModels = chatModels.filter((model) => model.id);
  const currentModel = availableModels.find(
    (model) => model.id === selectedModel,
  );

  const isPro = userType === 'pro';

  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed inset-x-0 bottom-0 z-[100] p-4 pb-safe">
        <div className="mx-auto max-w-4xl space-y-3">
          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <Card className="border-pink-300 dark:border-pink-800/50 bg-pink-300/20 dark:bg-black/60 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                    <span>Przesylanie plików...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Display Selected Attachments */}
          {attachments.length > 0 && (
            <Card className="border-pink-300/50 dark:border-pink-800/50 bg-pink-50/80 dark:bg-pink-950/20 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-pink-900 dark:text-pink-100">
                      Zalaczniki
                    </h3>
                    <Badge
                      variant="secondary"
                      className="bg-pink-200 dark:bg-pink-800 text-pink-800 dark:text-pink-200"
                    >
                      {attachments.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAttachments}
                    className="text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/50"
                  >
                    Usun wszystkie
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {attachments.map((file, index) => (
                    <Card
                      key={file.name}
                      className="relative group border-pink-200 dark:border-pink-800/50"
                    >
                      <CardContent className="p-2">
                        <div className="aspect-square overflow-hidden rounded-lg">
                          {file.type.startsWith('image/') ? (
                            <Image
                              src={
                                typeof window !== 'undefined'
                                  ? URL.createObjectURL(file)
                                  : '/placeholder.svg'
                              }
                              alt={file.name}
                              className="w-full h-full object-cover"
                              width={100}
                              height={100}
                            />
                          ) : (
                            <div className="w-full h-full bg-pink-100 dark:bg-pink-900/30 flex flex-col items-center justify-center">
                              <FileText className="size-8 text-pink-600 dark:text-pink-400 mb-1" />
                              <span className="text-xs text-center truncate w-full px-1 text-pink-700 dark:text-pink-300">
                                {file.name}
                              </span>
                            </div>
                          )}
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onRemoveAttachment(index)}
                              className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600"
                            >
                              <X className="size-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Usun plik</TooltipContent>
                        </Tooltip>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Usage Warning for Guests */}
          {usage && usage.remaining <= 2 && (
            <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50 max-w-sm mx-auto animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200">
              <Alert
                variant={usage.remaining === 0 ? 'destructive' : 'default'}
                className="bg-pink-50/90 dark:bg-pink-950/90 border-pink-200 dark:border-pink-800/50 backdrop-blur-md shadow-lg"
              >
                <AlertDescription className="text-pink-800 dark:text-pink-200">
                  Pozostalo Ci {usage.remaining} z {usage.limit} darmowych
                  wiadomości.
                  {usage.remaining === 0
                    ? ' Zaloguj sie aby kontynuowac.'
                    : ' Zaloguj sie aby zwiekszyc limity.'}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Main Input Form */}
          <form
            onSubmit={onSubmitForm}
            className="p-2 border-pink-300/50 dark:border-pink-800/60 bg-gradient-to-br from-pink-50/90 to-pink-100/70 dark:from-black/80 dark:to-pink-950/40 backdrop-blur-md rounded-2xl shadow-lg border"
          >
            {/* Textarea */}
            <div className="mb-3">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={onInputChange}
                placeholder={t('chat.greetings.placeholder')}
                className="min-h-16 max-h-48 resize-none rounded-xl border-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white/80 dark:bg-black/50 backdrop-blur-sm focus:bg-white dark:focus:bg-black/70 transition-colors focus:border-pink-400 dark:focus:border-pink-600 focus:ring-pink-400/20 dark:focus:ring-pink-600/20"
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              {/* Left side - Tools */}
              <div className="flex items-center space-x-2">
                {/* Model Dropdown */}
                <DropdownMenu
                  open={isModelDropdownOpen}
                  onOpenChange={setIsModelDropdownOpen}
                >
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
                        {t('chat.input.selectModel')}
                      </span>
                    </div>

                    {/* Models Grid */}
                    <div className="space-y-1">
                      {availableModels
                        .filter(
                          (model) =>
                            selectedFilters.length === 0 ||
                            selectedFilters.some((filter) =>
                              model.capabilities.includes(filter),
                            ),
                        )
                        .slice(0, 8)
                        .map((model) => (
                          <Button
                            key={model.id}
                            variant="ghost"
                            onClick={() => {
                              onModelChange(model.id);
                              setIsModelDropdownOpen(false);
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
                                  Google
                                </div>
                              </div>

                              {/* Capability icons */}
                              <div className="flex items-center gap-1 mr-2">
                                {model.capabilities
                                  .slice(0, 3)
                                  .map((capability) => {
                                    const capabilityIcon = {
                                      image: <Bot className="size-3" />,
                                      text: <FileText className="size-3" />,
                                      audio: <Database className="size-3" />,
                                      video: <Globe className="size-3" />,
                                    }[capability];

                                    const capabilityLabel = {
                                      image: 'Image Analysis',
                                      text: 'Text Processing',
                                      audio: 'Audio Processing',
                                      video: 'Video Analysis',
                                    }[capability];

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
                                            {capabilityLabel}
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
                                        {model.capabilities.length - 3} more
                                        capabilities
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          </Button>
                        ))}
                    </div>

                    {/* View All Models */}
                    <div className="mt-3 pt-2 border-t border-pink-200 dark:border-pink-900/30">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsModelDropdownOpen(false);
                            setTimeout(() => setIsModelSelectorOpen(true), 100);
                          }}
                          className="flex-1 text-xs text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded-md"
                        >
                          {t('chat.input.allModels')}
                        </Button>
                        <DropdownMenu
                          open={showFilterPopover}
                          onOpenChange={setShowFilterPopover}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 p-0 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded-md"
                            >
                              <Database className="size-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side="right"
                            align="end"
                            sideOffset={20}
                            alignOffset={-14}
                            className="w-48 p-3 bg-gradient-to-br from-pink-50 to-pink-100/60 dark:from-black/95 dark:to-pink-950/20 border-pink-200 dark:border-pink-900/50 backdrop-blur-md rounded-xl"
                          >
                            <div className="text-xs font-medium text-pink-900 dark:text-gray-100 mb-3 pb-2 border-b border-pink-200 dark:border-pink-900/30">
                              {t('chat.input.filters')}
                            </div>
                            <div className="space-y-1">
                              {[
                                {
                                  id: 'text',
                                  label: 'Tekst',
                                  icon: <FileText className="size-3" />,
                                },
                                {
                                  id: 'image',
                                  label: 'Obrazy',
                                  icon: <Bot className="size-3" />,
                                },
                                {
                                  id: 'audio',
                                  label: 'Audio',
                                  icon: <Database className="size-3" />,
                                },
                                {
                                  id: 'video',
                                  label: 'Video',
                                  icon: <Globe className="size-3" />,
                                },
                              ].map((filter) => (
                                <Button
                                  key={filter.id}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedFilters((prev) =>
                                      prev.includes(filter.id)
                                        ? prev.filter((f) => f !== filter.id)
                                        : [...prev, filter.id],
                                    );
                                  }}
                                  className={`w-full justify-start h-8 px-2 py-1 text-xs transition-all rounded-md ${
                                    selectedFilters.includes(filter.id)
                                      ? 'bg-pink-200 dark:bg-pink-900/50 text-pink-900 dark:text-pink-100 border border-pink-300 dark:border-pink-700'
                                      : 'hover:bg-pink-100 dark:hover:bg-pink-900/20 text-pink-800 dark:text-pink-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <div className="text-pink-600 dark:text-pink-400">
                                      {filter.icon}
                                    </div>
                                    <span className="flex-1 text-left">
                                      {filter.label}
                                    </span>
                                    {selectedFilters.includes(filter.id) && (
                                      <div className="size-2 rounded-full bg-pink-500" />
                                    )}
                                  </div>
                                </Button>
                              ))}
                            </div>
                            {selectedFilters.length > 0 && (
                              <div className="mt-3 pt-2 border-t border-pink-200 dark:border-pink-900/30">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedFilters([])}
                                  className="w-full h-7 text-xs text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded-md"
                                >
                                  {t('chat.input.clearAll')}
                                </Button>
                              </div>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Web Search Toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onToggleSearch}
                      className={`p-2 backdrop-blur-sm transition-all ${
                        searchEnabled
                          ? 'bg-pink-500/80 dark:bg-pink-600/80 text-white shadow-md shadow-pink-400/30 dark:shadow-pink-600/30 hover:bg-pink-600 dark:hover:bg-pink-700 border border-pink-400 dark:border-pink-500'
                          : 'text-pink-600 dark:text-pink-300 hover:text-pink-800 dark:hover:text-pink-200 hover:bg-pink-100/50 dark:hover:bg-pink-900/30'
                      }`}
                    >
                      <Globe className="size-4" />
                      <span className="hidden sm:inline">
                        {t('chat.input.search')}
                      </span>
                      {!isPro && (
                        <Badge className="absolute -top-2.5 -right-2.5 h-4 px-1.5 text-xs bg-pink-600 dark:bg-pink-700 text-white">
                          Pro
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {searchEnabled
                      ? t('chat.input.disableSearch')
                      : t('chat.input.enableSearch')}
                  </TooltipContent>
                </Tooltip>

                {/* File Upload */}
                <input
                  ref={fileInputRef as React.RefObject<HTMLInputElement>}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.txt,.doc,.docx"
                  onChange={onFileUpload}
                  className="hidden"
                />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={onShowFileUpload}
                      className="text-pink-600 dark:text-pink-300 hover:text-pink-800 dark:hover:text-pink-200 p-2  relative hover:bg-pink-100/50 dark:hover:bg-pink-900/30 backdrop-blur-sm"
                    >
                      <Paperclip className="size-4" />
                      {!isPro ? (
                        <Badge className="absolute -top-2.5 -right-2.5 h-4 px-1.5 text-xs bg-pink-600 dark:bg-pink-700 text-white">
                          Pro
                        </Badge>
                      ) : (
                        attachments.length > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-pink-500 text-white">
                            {attachments.length}
                          </Badge>
                        )
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('chat.input.attachFiles')}</TooltipContent>
                </Tooltip>
              </div>

              {/* Right side - Send button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    disabled={disabled || isStreaming || !hasRemainingUsage}
                    className="rounded-full"
                  >
                    <Send className="size-4" />
                    <span className="hidden sm:inline">
                      {isStreaming
                        ? t('chat.input.sending')
                        : t('chat.input.send')}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {!hasRemainingUsage
                    ? t('chat.usage.noRemaining')
                    : isStreaming
                      ? t('chat.input.sending')
                      : t('chat.input.sendMessage')}
                </TooltipContent>
              </Tooltip>
            </div>
          </form>
        </div>

        {/* Full Model Selector Modal */}
        <FullModelSelector
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          isOpen={isModelSelectorOpen}
          setIsOpen={setIsModelSelectorOpen}
        />
      </div>
    </TooltipProvider>
  );
}

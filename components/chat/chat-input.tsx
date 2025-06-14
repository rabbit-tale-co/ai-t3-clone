'use client';

import React, { useEffect, useRef, useState } from 'react';
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
import { Send, Paperclip, Globe, FileText, X } from 'lucide-react';
import { FullModelSelector } from '../full-model-selector';
import { ModelDropdown } from './model-dropdown';
import { chatModels } from '@/lib/ai/models';
import Image from 'next/image';
import { useLanguage } from '@/hooks/use-language';

// Helper function to format file size
const formatFileSize = (bytes: number | undefined): string => {
  if (bytes === undefined || bytes === null) return 'Unknown size';
  if (bytes === 0) return '0 bytes';

  const k = 1024;
  const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const size = bytes / Math.pow(k, i);
  const formattedSize = i === 0 ? size.toString() : size.toFixed(1);

  return `${formattedSize} ${sizes[i]}`;
};

interface AttachmentFile {
  name: string;
  size: number;
  type?: string;
  contentType: string;
  url: string;
}

interface ChatInputProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  attachments: AttachmentFile[];
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
  isModelAvailable?: boolean;
  loadingModels?: boolean;
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
  isModelAvailable = true,
  loadingModels = false,
}: ChatInputProps) {
  const { t } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200); // Max height 200px
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
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
    onSubmit(e);
  };

  const availableModels = chatModels.filter((model) => model.id);
  const currentModel = availableModels.find(
    (model) => model.id === selectedModel,
  );

  const isPro = userType === 'pro';
  const isNotGuest = userType !== 'guest';

  const isButtonDisabled =
    disabled ||
    isStreaming ||
    !hasRemainingUsage ||
    !isModelAvailable ||
    loadingModels;

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
                    <span>Uploading files...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Display Selected Attachments - Compact Version */}
          {attachments.length > 0 && (
            <div className="bg-pink-50/60 dark:bg-pink-950/20 border border-pink-200/50 dark:border-pink-800/30 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Paperclip className="size-4 text-pink-600 dark:text-pink-400" />
                  <span className="text-sm font-medium text-pink-900 dark:text-pink-100">
                    {attachments.length} file{attachments.length > 1 ? 's' : ''}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAttachments}
                  className="h-6 px-2 text-xs text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/50"
                >
                  Clear all
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div
                    key={file.name}
                    className="group relative flex items-center gap-2 bg-white/80 dark:bg-black/40 border border-pink-200/50 dark:border-pink-800/30 rounded-lg px-3 py-2 max-w-48"
                  >
                    {/* File Icon/Preview */}
                    <div>
                      {file.type?.startsWith('image/') ? (
                        <div className="size-8 rounded overflow-hidden">
                          <Image
                            src={
                              typeof window !== 'undefined' && file.url
                                ? file.url
                                : '/placeholder.svg'
                            }
                            alt={file.name}
                            className="size-full object-cover"
                            width={32}
                            height={32}
                          />
                        </div>
                      ) : (
                        <div className="size-8 bg-pink-100 dark:bg-pink-900/30 rounded flex items-center justify-center">
                          <FileText className="size-4 text-pink-600 dark:text-pink-400" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-pink-900 dark:text-pink-100 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-pink-600 dark:text-pink-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveAttachment(index)}
                          className="size-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <X className="size-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remove file</TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Model Availability Warning */}
          {!loadingModels && !isModelAvailable && (
            <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 max-w-md mx-auto animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200">
              <Alert
                variant="destructive"
                className="bg-red-50/90 dark:bg-red-950/90 border-red-200 dark:border-red-800/50 backdrop-blur-md shadow-lg"
              >
                <AlertDescription className="text-red-800 dark:text-red-200">
                  Selected model is not available. Add API key in settings or
                  select another model.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Usage Warning for Guests */}
          {usage && usage.remaining <= 10 && (
            <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 max-w-sm mx-auto animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200">
              <Alert
                variant={usage.remaining === 0 ? 'destructive' : 'default'}
                className="bg-pink-50/90 dark:bg-pink-950/90 border-pink-200 dark:border-pink-800/50 backdrop-blur-md shadow-lg"
              >
                <AlertDescription className="text-pink-800 dark:text-pink-200">
                  You have {usage.remaining} of {usage.limit} free messages
                  remaining.
                  {usage.remaining === 0
                    ? ' Please sign in to continue.'
                    : ' Sign in to increase your limits.'}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Main Input Form */}
          <form
            onSubmit={onSubmitForm}
            className="p-2 border-pink-300/50 dark:border-pink-800/60 bg-gradient-to-br from-pink-50/90 to-pink-100/70 dark:from-black/80 dark:to-pink-950/40 backdrop-blur-md rounded-3xl shadow-lg border"
          >
            {/* Textarea */}
            <div className="mb-3">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={onInputChange}
                placeholder={t('chat.greetings.placeholder')}
                className="min-h-16 max-h-48 resize-none rounded-2xl border-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-white/80 dark:bg-black/50 backdrop-blur-sm focus:bg-white dark:focus:bg-black/70 transition-colors focus:border-pink-400 dark:focus:border-pink-600 focus:ring-pink-400/20 dark:focus:ring-pink-600/20"
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              {/* Left side - Tools */}
              <div className="flex items-center space-x-2">
                {/* Model Dropdown */}
                <ModelDropdown
                  selectedModel={selectedModel}
                  onModelChange={onModelChange}
                  onOpenFullSelector={() => setIsModelSelectorOpen(true)}
                  availableModels={availableModels}
                />

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
                      {isPro && (
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
                      {!isNotGuest ? (
                        <Badge className="absolute -top-2.5 -right-2.5 h-4 px-1.5 text-xs bg-pink-600 dark:bg-pink-700 text-white">
                          Login
                        </Badge>
                      ) : (
                        attachments.length > 0 && (
                          <Badge className="absolute -top-1 -right-1 size-5 p-0 text-xs bg-pink-500 text-white">
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
                    disabled={isButtonDisabled}
                    className="rounded-full"
                  >
                    <Send className="size-4" />
                    <span className="hidden sm:inline">
                      {loadingModels
                        ? 'Loading...'
                        : isStreaming
                          ? t('chat.input.sending')
                          : t('chat.input.send')}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {loadingModels
                    ? 'Checking available models...'
                    : !isModelAvailable
                      ? 'Model is not available - add API key'
                      : !hasRemainingUsage
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

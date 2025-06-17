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
import { useIsMobile } from '@/hooks/use-mobile';

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
  resetTime?: Date | null;
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
  resetTime,
  userType = 'guest',
  isModelAvailable = true,
  loadingModels = false,
}: ChatInputProps) {
  const { t } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevStreamingRef = useRef(isStreaming);
  const isMobile = useIsMobile();

  // Reset submitting state when streaming ends
  useEffect(() => {
    // Only reset when streaming changes from true to false
    if (prevStreamingRef.current && !isStreaming) {
      setIsSubmitting(false);
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // Update countdown timer
  useEffect(() => {
    if (!resetTime) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = resetTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilReset('');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeUntilReset(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeUntilReset(`${minutes}m ${seconds}s`);
      } else {
        setTimeUntilReset(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [resetTime]);

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

      // Block submission if bot is streaming/thinking or other conditions
      if (isButtonDisabled) {
        return;
      }

      // Set submitting state immediately when user presses Enter
      setIsSubmitting(true);
      onSubmit(e as unknown as React.FormEvent);
    }
  };

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    // Block submission if bot is streaming/thinking or other conditions
    if (isButtonDisabled) {
      return;
    }

    // Set submitting state immediately when user clicks submit

    setIsSubmitting(true);
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
    isSubmitting ||
    isStreaming ||
    !hasRemainingUsage ||
    (!input.trim() && attachments.length === 0);

  const isInputDisabled = isSubmitting || isStreaming || disabled;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative p-4">
        <div className="mx-auto max-w-4xl space-y-3 pointer-events-auto">
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
            <div className="bg-pink-50/10 dark:bg-pink-950/10 border border-pink-200/30 dark:border-pink-800/20 rounded-xl p-3 backdrop-blur-[32px] backdrop-saturate-150">
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
                className="bg-red-50/40 dark:bg-red-950/40 border-red-200/50 dark:border-red-800/30 backdrop-blur-lg shadow-lg"
              >
                <AlertDescription className="text-red-800 dark:text-red-200">
                  Selected model is not available. Add API key in settings or
                  select another model.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Token Usage Alert - Always visible when 10 or fewer tokens remaining */}
          {usage && usage.remaining <= 10 && (
            <Alert
              variant={
                usage.remaining === 0
                  ? 'destructive'
                  : usage.remaining <= 3
                    ? 'destructive'
                    : 'default'
              }
              className={`backdrop-blur-lg shadow-lg mb-3 w-fit mx-auto ${
                usage.remaining === 0
                  ? 'bg-red-50/40 dark:bg-red-950/40 border-red-200/50 dark:border-red-800/30'
                  : usage.remaining <= 3
                    ? 'bg-orange-50/40 dark:bg-orange-950/40 border-orange-200/50 dark:border-orange-800/30'
                    : 'bg-yellow-50/40 dark:bg-yellow-950/40 border-yellow-200/50 dark:border-yellow-800/30'
              }`}
            >
              <AlertDescription
                className={
                  usage.remaining === 0
                    ? 'text-red-800 dark:text-red-200'
                    : usage.remaining <= 3
                      ? 'text-orange-800 dark:text-orange-200'
                      : 'text-yellow-800 dark:text-yellow-200'
                }
              >
                {usage.remaining === 0 ? (
                  <>
                    {userType === 'guest'
                      ? 'No free messages remaining. Please sign in to continue.'
                      : 'Daily message limit reached. Try again later or upgrade to Pro.'}
                    {timeUntilReset && (
                      <div className="text-sm mt-1 opacity-80">
                        New tokens available in: {timeUntilReset}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {usage.remaining} of {usage.limit} messages remaining today.
                    {userType === 'guest' &&
                      ' Sign in to increase your limits.'}
                    {userType === 'regular' &&
                      usage.remaining <= 3 &&
                      ' Consider upgrading to Pro for unlimited messages.'}
                    {timeUntilReset && usage.remaining === 0 && (
                      <div className="text-sm mt-1 opacity-80">
                        Reset in: {timeUntilReset}
                      </div>
                    )}
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Main Input Form */}
          <form
            onSubmit={onSubmitForm}
            className="p-2 border-pink-300/40 dark:border-pink-800/40 bg-pink-50/15 dark:bg-black/15 backdrop-blur-[40px] backdrop-saturate-150 rounded-3xl shadow-xl border supports-[backdrop-filter]:bg-pink-50/10 supports-[backdrop-filter]:dark:bg-black/10"
          >
            {/* Textarea */}
            <div className="mb-3">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={onInputChange}
                placeholder={t('chat.greetings.placeholder')}
                className="min-h-16 max-h-48 resize-none rounded-2xl border-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-transparent dark:bg-transparent backdrop-blur-sm focus:bg-transparent dark:focus:bg-transparent transition-colors focus:border-pink-400 dark:focus:border-pink-600 focus:ring-pink-400/20 dark:focus:ring-pink-600/20"
                onKeyDown={handleKeyDown}
                disabled={isInputDisabled}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              {/* Left side - Tools */}
              <div className="flex items-center space-x-2">
                {/* Model Dropdown */}
                <div
                  className={
                    isStreaming ? 'opacity-50 pointer-events-none' : ''
                  }
                >
                  <ModelDropdown
                    selectedModel={selectedModel}
                    onModelChange={onModelChange}
                    onOpenFullSelector={() => setIsModelSelectorOpen(true)}
                    availableModels={availableModels}
                  />
                </div>

                {/* Web Search Toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onToggleSearch}
                      disabled={isStreaming}
                      className={`p-2 backdrop-blur-sm transition-all ${
                        searchEnabled
                          ? 'bg-pink-500/80 dark:bg-pink-600/80 text-white shadow-md shadow-pink-400/30 dark:shadow-pink-600/30 hover:bg-pink-600 dark:hover:bg-pink-700 border border-pink-400 dark:border-pink-500'
                          : 'text-pink-600 dark:text-pink-300 hover:text-pink-800 dark:hover:text-pink-200 hover:bg-pink-100/50 dark:hover:bg-pink-900/30'
                      } ${isStreaming ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      disabled={isStreaming}
                      className={`text-pink-600 dark:text-pink-300 hover:text-pink-800 dark:hover:text-pink-200 p-2 relative hover:bg-pink-100/50 dark:hover:bg-pink-900/30 backdrop-blur-sm ${isStreaming ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Paperclip className="size-4" />
                      {!isNotGuest ? (
                        <Badge className="absolute -top-2.5 -right-2.5 h-4 px-1.5 text-xs bg-pink-600 dark:bg-pink-700 text-white">
                          Pro
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
                    size={isMobile ? 'icon' : 'default'}
                    className="rounded-full"
                    onClick={(e) => {
                      if (isButtonDisabled) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                      }
                    }}
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

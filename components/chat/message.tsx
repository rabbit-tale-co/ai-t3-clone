'use client';

import type { UIMessage } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from '@/components/document';
import { PencilIcon, SparklesIcon, User, Bot } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from '@/components/preview-attachment';
import { Weather } from '@/components/weather';
import equal from 'fast-deep-equal';
import { cn, sanitizeText } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from '@/components/document-preview';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  requiresScrollPadding,
}: {
  chatId: string;
  message: UIMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-4xl px-4 py-3 group/message"
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-3 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-3xl items-start',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {/* Assistant Avatar */}
          {message.role === 'assistant' && (
            <Avatar className="size-9 border-2 border-pink-200/60 dark:border-pink-700/60 shadow-md shadow-pink-200/40 dark:shadow-pink-900/20 transition-all duration-200 hover:shadow-lg hover:shadow-pink-200/60 dark:hover:shadow-pink-900/40">
              <AvatarImage src="/ai-avatar.png" />
              <AvatarFallback className="bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-800 dark:to-pink-900">
                <Bot className="size-4 text-pink-600 dark:text-pink-300" />
              </AvatarFallback>
            </Avatar>
          )}

          <div
            className={cn('flex flex-col gap-3', {
              'w-fit': mode !== 'edit',
              'w-full': mode === 'edit',
              'min-h-96': message.role === 'assistant' && requiresScrollPadding,
            })}
          >
            {/* Attachments */}
            {message.experimental_attachments &&
              message.experimental_attachments.length > 0 && (
                <div
                  data-testid={`message-attachments`}
                  className="flex flex-row justify-end gap-2"
                >
                  {message.experimental_attachments.map((attachment) => (
                    <PreviewAttachment
                      key={attachment.url}
                      attachment={attachment}
                    />
                  ))}
                </div>
              )}

            {/* Message Parts */}
            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning') {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.reasoning}
                  />
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-col gap-2">
                      <div
                        className={cn(
                          'relative px-4 py-3 backdrop-blur-sm border group shadow-sm',
                          message.role === 'user'
                            ? 'rounded-[22px] rounded-br-md bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white border-pink-400/50 shadow-pink-500/20 ml-auto max-w-2xl transition-all duration-200'
                            : 'rounded-[22px] rounded-bl-md bg-gradient-to-br from-pink-50/90 to-pink-100/70 hover:from-pink-50 hover:to-pink-100 dark:from-pink-950/30 dark:to-pink-900/20 dark:hover:from-pink-950/40 dark:hover:to-pink-900/30 text-pink-900 dark:text-pink-100 border-pink-200/50 dark:border-pink-800/40 shadow-pink-200/30 dark:shadow-pink-900/15 transition-all duration-200',
                        )}
                      >
                        {/* Edit Button for User Messages */}
                        {message.role === 'user' && !isReadonly && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                data-testid="message-edit-button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setMode('edit')}
                                className="absolute -top-2 -right-2 size-7 p-0 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-md border border-white/20 shadow-lg"
                              >
                                <PencilIcon className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit message</TooltipContent>
                          </Tooltip>
                        )}

                        {/* Message Content */}
                        <div
                          data-testid="message-content"
                          className={cn('prose max-w-none', {
                            'prose-invert': message.role === 'user',
                            'prose-pink': message.role === 'assistant',
                          })}
                        >
                          <Markdown>{sanitizeText(part.text)}</Markdown>
                        </div>
                      </div>

                      {/* Message Actions for Assistant */}
                      {message.role === 'assistant' && !isReadonly && (
                        <div className="flex justify-start ml-1">
                          <MessageActions
                            key={`action-${message.id}`}
                            chatId={chatId}
                            message={message}
                            vote={vote}
                            isLoading={isLoading}
                            onRegenerate={() => reload()}
                          />
                        </div>
                      )}
                    </div>
                  );
                }

                if (mode === 'edit') {
                  return (
                    <MessageEditor
                      key={key}
                      message={message}
                      setMode={setMode}
                      setMessages={setMessages}
                      reload={reload}
                    />
                  );
                }
              }

              if (type === 'tool-invocation') {
                const { toolInvocation } = part;
                const { toolName, toolCallId, state } = toolInvocation;

                if (state === 'call') {
                  const { args } = toolInvocation;

                  return (
                    <div
                      key={toolCallId}
                      className={cx(
                        'bg-gradient-to-br from-pink-50/50 to-pink-100/30 dark:from-pink-950/10 dark:to-pink-900/5 border border-pink-200/50 dark:border-pink-800/30 rounded-xl p-4',
                        {
                          skeleton: ['getWeather'].includes(toolName),
                        },
                      )}
                    >
                      {toolName === 'getWeather' ? (
                        <Weather />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview isReadonly={isReadonly} args={args} />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolCall
                          type="update"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolCall
                          type="request-suggestions"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : null}
                    </div>
                  );
                }

                if (state === 'result') {
                  const { result } = toolInvocation;

                  return (
                    <div
                      key={toolCallId}
                      className="bg-gradient-to-br from-pink-50/50 to-pink-100/30 dark:from-pink-950/10 dark:to-pink-900/5 border border-pink-200/50 dark:border-pink-800/30 rounded-xl p-4"
                    >
                      {toolName === 'getWeather' ? (
                        <Weather weatherAtLocation={result} />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview
                          isReadonly={isReadonly}
                          result={result}
                        />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolResult
                          type="update"
                          result={result}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolResult
                          type="request-suggestions"
                          result={result}
                          isReadonly={isReadonly}
                        />
                      ) : (
                        <pre className="text-sm bg-pink-100 dark:bg-pink-900/20 p-3 rounded-lg overflow-auto">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      )}
                    </div>
                  );
                }
              }
            })}
          </div>

          {/* User Avatar */}
          {message.role === 'user' && (
            <Avatar className="size-9 border-2 border-pink-300/60 dark:border-pink-600/60 shadow-md shadow-pink-300/40 dark:shadow-pink-800/20 transition-all duration-200 hover:shadow-lg hover:shadow-pink-300/60 dark:hover:shadow-pink-800/40">
              <AvatarImage src="/user-avatar.png" />
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-pink-600">
                <User className="size-4 text-white" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-4xl px-4 py-3 group/message min-h-24"
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0.3, duration: 0.3, ease: "easeOut" } }}
      data-role={role}
    >
      <div className="flex gap-3 items-start">
        {/* Assistant Avatar */}
        <Avatar className="size-9 border-2 border-pink-200/60 dark:border-pink-700/60 shadow-md shadow-pink-200/40 dark:shadow-pink-900/20">
          <AvatarFallback className="bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-800 dark:to-pink-900">
            <Bot className="size-4 text-pink-600 dark:text-pink-300" />
          </AvatarFallback>
        </Avatar>

        {/* Thinking Animation */}
        <div className="flex flex-col gap-2 w-fit">
                     <div className="bg-gradient-to-br from-pink-50/90 to-pink-100/70 dark:from-pink-950/30 dark:to-pink-900/20 border border-pink-200/50 dark:border-pink-800/40 rounded-[22px] rounded-bl-md px-4 py-3 backdrop-blur-sm shadow-sm shadow-pink-200/30 dark:shadow-pink-900/15">
             <div className="flex items-center gap-2 text-pink-900 dark:text-pink-100">
              <SparklesIcon className="size-4 animate-pulse text-pink-500" />
              <span className="text-sm font-medium">Hmm...</span>
              <div className="flex gap-1 ml-2">
                <div
                  className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

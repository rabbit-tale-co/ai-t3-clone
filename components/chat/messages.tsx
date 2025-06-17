'use client';

import type { UIMessage } from 'ai';
import { PreviewMessage, ThinkingMessage } from './message';
import { Greeting } from '@/components/chat/greeting';
import { memo } from 'react';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';
import { cn } from '@/lib/utils';

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  input?: string;
  onExamplePromptClick?: (prompt: string) => void;
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
  isArtifactVisible,
  input = '',
  onExamplePromptClick,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessages({
    chatId,
    status,
  });

  return (
    <div
      ref={messagesContainerRef}
      className={cn(
        'flex flex-col min-w-0 gap-4 h-full overflow-y-auto pt-6 pb-32 sm:pb-40 relative',
        'scroll-smooth scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-pink-800 scrollbar-track-transparent',
        'overscroll-behavior-y-contain',
      )}
    >
      {/* Empty State */}
      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <Greeting input={input} onExamplePromptClick={onExamplePromptClick} />
        </div>
      )}

      {/* Messages List */}
      <div className="space-y-6">
        {messages.map((message, index) => (
          <PreviewMessage
            key={message.id}
            chatId={chatId}
            message={message}
            isLoading={status === 'streaming' && messages.length - 1 === index}
            vote={
              votes
                ? votes.find((vote) => vote.messageId === message.id)
                : undefined
            }
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
            requiresScrollPadding={
              hasSentMessage && index === messages.length - 1
            }
          />
        ))}

        {/* Thinking State */}
        {status === 'submitted' &&
          messages.length > 0 &&
          messages[messages.length - 1].role === 'user' && <ThinkingMessage />}
      </div>

      {/* Scroll Anchor */}
      <motion.div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  // Skip memo check if artifact is visible for performance
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  // Check for changes that should trigger re-render
  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (prevProps.isReadonly !== nextProps.isReadonly) return false;

  return true;
});

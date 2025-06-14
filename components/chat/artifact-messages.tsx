import { PreviewMessage, ThinkingMessage } from './message';
import type { Vote } from '@/lib/db/schema';
import type { UIMessage } from 'ai';
import { memo } from 'react';
import equal from 'fast-deep-equal';
import type { UIArtifact } from '../artifact';
import type { UseChatHelpers } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';
import { cn } from '@/lib/utils';

interface ArtifactMessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  votes: Array<Vote> | undefined;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  artifactStatus: UIArtifact['status'];
}

function PureArtifactMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
}: ArtifactMessagesProps) {
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
        'flex flex-col min-w-0 gap-4 flex-1 overflow-y-auto pt-6 pb-4 px-4 relative',
        'scroll-smooth scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-pink-800 scrollbar-track-transparent',
        'max-h-full',
      )}
    >
      {/* Messages List */}
      <div className="space-y-4">
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

function areEqual(
  prevProps: ArtifactMessagesProps,
  nextProps: ArtifactMessagesProps,
) {
  if (
    prevProps.artifactStatus === 'streaming' &&
    nextProps.artifactStatus === 'streaming'
  )
    return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
}

export const ArtifactMessages = memo(PureArtifactMessages, areEqual);

'use client';

import type { Message } from 'ai';
import { useSWRConfig } from 'swr';
import { useCopyToClipboard } from 'usehooks-ts';
import type { Vote } from '@/lib/db/schema';

import {
  CopyIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  MoreHorizontal,
  Download,
  Share,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { memo } from 'react';
import equal from 'fast-deep-equal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
  onRegenerate,
}: {
  chatId: string;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
  onRegenerate?: () => void;
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();

  if (isLoading) return null;
  if (message.role === 'user') return null;

  const handleCopy = async () => {
    const textFromParts = message.parts
      ?.filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n')
      .trim();

    if (!textFromParts) {
      toast.error('No text to copy!');
      return;
    }

    await copyToClipboard(textFromParts);
    toast.success('Copied to clipboard!', {
      description: 'Message copied',
    });
  };

  const handleVote = async (type: 'up' | 'down') => {
    const votePromise = fetch('/api/vote', {
      method: 'PATCH',
      body: JSON.stringify({
        chatId,
        messageId: message.id,
        type,
      }),
    });

    toast.promise(votePromise, {
      loading: type === 'up' ? 'Voting...' : 'Voting...',
      success: () => {
        mutate<Array<Vote>>(
          `/api/vote?chatId=${chatId}`,
          (currentVotes) => {
            if (!currentVotes) return [];

            const votesWithoutCurrent = currentVotes.filter(
              (vote) => vote.messageId !== message.id,
            );

            return [
              ...votesWithoutCurrent,
              {
                chatId,
                messageId: message.id,
                isUpvoted: type === 'up',
              },
            ];
          },
          { revalidate: false },
        );

        return type === 'up' ? 'Successfully voted!' : 'Failed to vote!';
      },
      error: 'Failed to vote for message.',
    });
  };

  const handleExport = () => {
    const textContent = message.parts
      ?.filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n')
      .trim();

    if (!textContent) {
      toast.error('No content to export!');
      return;
    }

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `message-${message.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Exported message!');
  };

  const handleShare = async () => {
    const textContent = message.parts
      ?.filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n')
      .trim();

    if (navigator.share && textContent) {
      try {
        await navigator.share({
          title: 'Message from AI',
          text: textContent,
        });
        toast.success('Shared!');
      } catch (error) {
        // Fallback to clipboard
        await copyToClipboard(textContent);
        toast.success('Copied to clipboard!');
      }
    } else if (textContent) {
      await copyToClipboard(textContent);
      toast.success('Copied to clipboard!');
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-1 opacity-60 group-hover:opacity-100 hover:opacity-100 transition-opacity duration-200">
        {/* Copy Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="size-8 p-0 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/50 hover:text-pink-800 dark:hover:text-pink-200 rounded-lg"
            >
              <CopyIcon className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>

        {/* Thumbs Up Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-upvote"
              variant="ghost"
              size="sm"
              disabled={vote?.isUpvoted}
              onClick={() => handleVote('up')}
              className={cn(
                'h-8 w-8 p-0 rounded-lg transition-colors',
                vote?.isUpvoted
                  ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
                  : 'text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/50 hover:text-pink-800 dark:hover:text-pink-200',
              )}
            >
              <ThumbsUpIcon className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Like</TooltipContent>
        </Tooltip>

        {/* Thumbs Down Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-downvote"
              variant="ghost"
              size="sm"
              disabled={vote && !vote.isUpvoted}
              onClick={() => handleVote('down')}
              className={cn(
                'h-8 w-8 p-0 rounded-lg transition-colors',
                vote && !vote.isUpvoted
                  ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
                  : 'text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/50 hover:text-pink-800 dark:hover:text-pink-200',
              )}
            >
              <ThumbsDownIcon className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Dislike</TooltipContent>
        </Tooltip>

        {/* Regenerate Button */}
        {onRegenerate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerate}
                className="size-8 p-0 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/50 hover:text-pink-800 dark:hover:text-pink-200 rounded-lg"
              >
                <RefreshCw className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Regenerate</TooltipContent>
          </Tooltip>
        )}

        {/* More Options Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="size-8 p-0 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/50 hover:text-pink-800 dark:hover:text-pink-200 rounded-lg"
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-48 bg-gradient-to-br from-pink-50 to-pink-100/80 dark:from-pink-950/90 dark:to-pink-900/60 border border-pink-200 dark:border-pink-800/50 backdrop-blur-md shadow-lg rounded-xl"
          >
            <DropdownMenuItem
              onClick={handleExport}
              className="text-sm text-pink-800 dark:text-pink-200 hover:bg-pink-100 dark:hover:bg-pink-900/50 focus:bg-pink-100 dark:focus:bg-pink-900/50 rounded-lg cursor-pointer"
            >
              <Download className="size-4 mr-2 text-pink-600 dark:text-pink-400" />
              Export
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleShare}
              className="text-sm text-pink-800 dark:text-pink-200 hover:bg-pink-100 dark:hover:bg-pink-900/50 focus:bg-pink-100 dark:focus:bg-pink-900/50 rounded-lg cursor-pointer"
            >
              <Share className="size-4 mr-2 text-pink-600 dark:text-pink-400" />
              Udostępnij
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.vote, nextProps.vote)) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;

    return true;
  },
);

'use client';

import { useState } from 'react';
import { ChevronDownIcon, LoaderIcon, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Markdown } from '@/components/markdown';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MessageReasoningProps {
  isLoading: boolean;
  reasoning: string;
}

export function MessageReasoning({
  isLoading,
  reasoning,
}: MessageReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      marginTop: '1rem',
      marginBottom: '0.5rem',
    },
  };

  return (
    <div className="flex flex-col bg-gradient-to-br from-pink-50/30 to-pink-100/20 dark:from-pink-950/10 dark:to-pink-900/5 border border-pink-200/40 dark:border-pink-800/20 rounded-xl p-4 backdrop-blur-sm">
      {/* Toggle Button */}
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={isLoading}
        className="flex items-center gap-3 justify-start p-0 h-auto hover:bg-transparent group"
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'size-8 rounded-lg flex items-center justify-center transition-colors',
              isLoading
                ? 'bg-pink-200 dark:bg-pink-800/30'
                : 'bg-pink-100 dark:bg-pink-900/30 group-hover:bg-pink-200 dark:group-hover:bg-pink-800/50',
            )}
          >
            {isLoading ? (
              <LoaderIcon className="size-4 text-pink-600 dark:text-pink-400 animate-spin" />
            ) : (
              <Brain className="size-4 text-pink-600 dark:text-pink-400" />
            )}
          </div>

          <div className="flex flex-col items-start">
            <span className="font-medium text-pink-900 dark:text-pink-100">
              {isLoading
                ? 'Rozumowanie...'
                : 'AI rozumowało przez kilka sekund'}
            </span>
            {!isLoading && (
              <span className="text-xs text-pink-600 dark:text-pink-400">
                {isExpanded
                  ? 'Kliknij aby ukryć'
                  : 'Kliknij aby wyświetlić szczegóły'}
              </span>
            )}
          </div>
        </div>

        {!isLoading && (
          <ChevronDownIcon
            className={cn(
              'size-4 text-pink-600 dark:text-pink-400 transition-transform duration-200 ml-auto',
              isExpanded && 'rotate-180',
            )}
          />
        )}
      </Button>

      {/* Reasoning Content */}
      <AnimatePresence initial={false}>
        {isExpanded && !isLoading && (
          <motion.div
            data-testid="message-reasoning"
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            className="pl-2 border-l-2 border-pink-300 dark:border-pink-700 ml-4"
          >
            <div className="bg-white/50 dark:bg-black/20 border border-pink-200/50 dark:border-pink-800/30 rounded-lg p-4 mt-3">
              <div className="prose prose-pink max-w-none">
                <div className="text-pink-800 dark:text-pink-200 text-sm leading-relaxed">
                  <Markdown>{reasoning}</Markdown>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useWindowSize } from 'usehooks-ts';

import type { UISuggestion } from '@/lib/editor/suggestions';

import { X, MessageSquareIcon, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import type { ArtifactKind } from './artifact';

export const Suggestion = ({
  suggestion,
  onApply,
  artifactKind,
}: {
  suggestion: UISuggestion;
  onApply: () => void;
  artifactKind: ArtifactKind;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { width: windowWidth } = useWindowSize();

  return (
    <AnimatePresence>
      {!isExpanded ? (
        <motion.div
          className={cn(
            'cursor-pointer text-pink-600 dark:text-pink-400 p-1.5 hover:text-pink-700 dark:hover:text-pink-300 transition-colors',
            {
              'absolute -right-8': artifactKind === 'text',
              'sticky top-0 right-4': artifactKind === 'code',
            },
          )}
          onClick={() => {
            setIsExpanded(true);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative">
            <MessageSquareIcon
              size={windowWidth && windowWidth < 768 ? 18 : 16}
            />
            <div className="absolute -top-1 -right-1 size-2 bg-pink-500 rounded-full animate-pulse" />
          </div>
        </motion.div>
      ) : (
        <motion.div
          key={suggestion.id}
          className="absolute bg-gradient-to-br from-pink-50/95 to-pink-100/90 dark:from-pink-950/95 dark:to-pink-900/90 backdrop-blur-md p-4 flex flex-col gap-3 rounded-2xl border border-pink-200/50 dark:border-pink-800/30 text-sm w-64 shadow-xl z-50 -right-12 md:-right-16 font-sans"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          initial={{ opacity: 0, y: -10, scale: 0.9 }}
          animate={{ opacity: 1, y: -20, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
        >
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-2">
              <div className="size-6 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center">
                <Sparkles size={12} className="text-white" />
              </div>
              <div className="font-medium text-pink-900 dark:text-pink-100">
                Assistant
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="size-6 p-0 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 hover:bg-pink-100/50 dark:hover:bg-pink-900/30 rounded-full"
              onClick={() => {
                setIsExpanded(false);
              }}
            >
              <X size={12} />
            </Button>
          </div>

          <div className="text-pink-800 dark:text-pink-200 leading-relaxed">
            {suggestion.description}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-fit py-1.5 px-4 rounded-full border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/30 hover:border-pink-400 dark:hover:border-pink-600 transition-all duration-200"
            onClick={onApply}
          >
            Apply suggestion
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

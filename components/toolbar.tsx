'use client';
import cx from 'classnames';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import {
  type Dispatch,
  memo,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useOnClickOutside } from 'usehooks-ts';
import { nanoid } from 'nanoid';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  ArrowUpIcon,
  StopCircleIcon,
  FileTextIcon,
  Sparkles,
} from 'lucide-react';
import { artifactDefinitions, type ArtifactKind } from './chat/artifact';
import type { ArtifactToolbarItem } from './create-artifact';
import type { UseChatHelpers } from '@ai-sdk/react';

type ToolProps = {
  description: string;
  icon: ReactNode;
  selectedTool: string | null;
  setSelectedTool: Dispatch<SetStateAction<string | null>>;
  isToolbarVisible?: boolean;
  setIsToolbarVisible?: Dispatch<SetStateAction<boolean>>;
  isAnimating: boolean;
  append: UseChatHelpers['append'];
  onClick: ({
    appendMessage,
  }: {
    appendMessage: UseChatHelpers['append'];
  }) => void;
};

const Tool = ({
  description,
  icon,
  selectedTool,
  setSelectedTool,
  isToolbarVisible,
  setIsToolbarVisible,
  isAnimating,
  append,
  onClick,
}: ToolProps) => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (selectedTool !== description) {
      setIsHovered(false);
    }
  }, [selectedTool, description]);

  const handleSelect = () => {
    if (!isToolbarVisible && setIsToolbarVisible) {
      setIsToolbarVisible(true);
      return;
    }

    if (!selectedTool) {
      setIsHovered(true);
      setSelectedTool(description);
      return;
    }

    if (selectedTool !== description) {
      setSelectedTool(description);
    } else {
      setSelectedTool(null);
      onClick({ appendMessage: append });
    }
  };

  return (
    <Tooltip open={isHovered && !isAnimating}>
      <TooltipTrigger asChild>
        <motion.div
          className={cx(
            'relative p-3 rounded-full cursor-pointer transition-all duration-300 group',
            {
              'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/25':
                selectedTool === description,
              'bg-gradient-to-r from-pink-50/80 to-pink-100/60 dark:from-pink-950/50 dark:to-pink-900/30 text-pink-700 dark:text-pink-300 hover:from-pink-100/90 hover:to-pink-200/70 dark:hover:from-pink-900/60 dark:hover:to-pink-800/40 border border-pink-200/50 dark:border-pink-800/30':
                selectedTool !== description,
            },
          )}
          onHoverStart={() => {
            setIsHovered(true);
          }}
          onHoverEnd={() => {
            if (selectedTool !== description) setIsHovered(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleSelect();
            }
          }}
          initial={{ scale: 1, opacity: 0, y: 10 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              delay: 0.1,
              type: 'spring',
              stiffness: 400,
              damping: 25,
            },
          }}
          whileHover={{
            scale: 1.1,
            transition: { type: 'spring', stiffness: 400, damping: 25 },
          }}
          whileTap={{ scale: 0.95 }}
          exit={{
            scale: 0.9,
            opacity: 0,
            y: 10,
            transition: { duration: 0.2 },
          }}
          onClick={() => {
            handleSelect();
          }}
          tabIndex={0}
        >
          {/* Glow effect for selected tool */}
          {selectedTool === description && (
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 opacity-20 blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
            />
          )}

          {/* Icon with animation */}
          <motion.div
            initial={{ rotate: 0 }}
            animate={{
              rotate: selectedTool === description ? 180 : 0,
              transition: { type: 'spring', stiffness: 300, damping: 20 },
            }}
          >
            {selectedTool === description ? (
              <ArrowUpIcon className="size-5" />
            ) : (
              <div className="size-5 flex items-center justify-center">
                {icon}
              </div>
            )}
          </motion.div>

          {/* Sparkle effect on hover */}
          <AnimatePresence>
            {isHovered && selectedTool !== description && (
              <motion.div
                className="absolute -top-1 -right-1"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
              >
                <Sparkles className="size-3 text-pink-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent
        side="left"
        sideOffset={16}
        className="bg-gradient-to-r from-pink-900 to-pink-800 text-pink-50 rounded-xl p-3 px-4 border border-pink-700/50 shadow-xl backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="size-3" />
          {description}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

const randomArr = [...Array(6)].map((x) => nanoid(5));

const ReadingLevelSelector = ({
  setSelectedTool,
  append,
  isAnimating,
}: {
  setSelectedTool: Dispatch<SetStateAction<string | null>>;
  isAnimating: boolean;
  append: UseChatHelpers['append'];
}) => {
  const LEVELS = [
    'Elementary',
    'Middle School',
    'Keep current level',
    'High School',
    'College',
    'Graduate',
  ];

  const y = useMotionValue(-40 * 2);
  const dragConstraints = 5 * 40 + 2;
  const yToLevel = useTransform(y, [0, -dragConstraints], [0, 5]);

  const [currentLevel, setCurrentLevel] = useState(2);
  const [hasUserSelectedLevel, setHasUserSelectedLevel] =
    useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = yToLevel.on('change', (latest) => {
      const level = Math.min(5, Math.max(0, Math.round(Math.abs(latest))));
      setCurrentLevel(level);
    });

    return () => unsubscribe();
  }, [yToLevel]);

  return (
    <div className="relative flex flex-col justify-end items-center">
      {randomArr.map((id, index) => (
        <motion.div
          key={id}
          className="size-[40px] flex flex-row items-center justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { delay: index * 0.05 },
          }}
          exit={{ opacity: 0, scale: 0 }}
        >
          <div className="size-2 rounded-full bg-gradient-to-r from-pink-300 to-pink-400 dark:from-pink-600 dark:to-pink-700 opacity-60" />
        </motion.div>
      ))}

      <TooltipProvider>
        <Tooltip open={!isAnimating}>
          <TooltipTrigger asChild>
            <motion.div
              className={cx(
                'absolute p-3 border rounded-full flex flex-row items-center backdrop-blur-sm transition-all duration-300 cursor-grab active:cursor-grabbing',
                {
                  'bg-gradient-to-r from-pink-500 to-pink-600 text-white border-pink-400/50 shadow-lg shadow-pink-500/25':
                    currentLevel !== 2,
                  'bg-gradient-to-r from-pink-50/90 to-pink-100/70 dark:from-pink-950/80 dark:to-pink-900/60 text-pink-700 dark:text-pink-300 border-pink-200/50 dark:border-pink-800/30':
                    currentLevel === 2,
                },
              )}
              style={{ y }}
              drag="y"
              dragElastic={0}
              dragMomentum={false}
              whileHover={{
                scale: 1.05,
                transition: { type: 'spring', stiffness: 400, damping: 25 },
              }}
              whileTap={{ scale: 0.95 }}
              dragConstraints={{
                top: -dragConstraints,
                bottom: 0,
              }}
              onDragEnd={() => {
                setHasUserSelectedLevel(true);
              }}
            >
              <FileTextIcon className="size-4" />

              {/* Glow effect */}
              {currentLevel !== 2 && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 opacity-20 blur-md -z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                />
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent
            side="left"
            sideOffset={16}
            className="bg-gradient-to-r from-pink-900 to-pink-800 text-pink-50 rounded-xl p-3 px-4 border border-pink-700/50 shadow-xl backdrop-blur-sm"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Sparkles className="size-3" />
                <span className="font-medium">Reading Level</span>
              </div>
              <span className="text-sm text-pink-200">
                {LEVELS[currentLevel]}
              </span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <motion.div
        className="p-3 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 text-white cursor-pointer shadow-lg shadow-pink-500/25 hover:from-pink-600 hover:to-pink-700 transition-all duration-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          append({
            role: 'user',
            content: `Please adjust the reading level to: ${LEVELS[currentLevel]}`,
          });
          setSelectedTool(null);
        }}
      >
        <ArrowUpIcon className="size-4" />
      </motion.div>
    </div>
  );
};

export const Tools = ({
  isToolbarVisible,
  selectedTool,
  setSelectedTool,
  append,
  isAnimating,
  setIsToolbarVisible,
  tools,
}: {
  isToolbarVisible: boolean;
  selectedTool: string | null;
  setSelectedTool: Dispatch<SetStateAction<string | null>>;
  append: UseChatHelpers['append'];
  isAnimating: boolean;
  setIsToolbarVisible: Dispatch<SetStateAction<boolean>>;
  tools: Array<ArtifactToolbarItem>;
}) => {
  if (tools.length === 0) {
    return null;
  }

  const [primaryTool, ...secondaryTools] = tools;

  return (
    <motion.div
      className="flex flex-col gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <AnimatePresence>
        {isToolbarVisible &&
          secondaryTools.map((secondaryTool, index) => (
            <motion.div
              key={secondaryTool.description}
              initial={{ opacity: 0, scale: 0, y: 20 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                transition: {
                  delay: index * 0.05,
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                },
              }}
              exit={{
                opacity: 0,
                scale: 0,
                y: 20,
                transition: {
                  delay: (secondaryTools.length - index - 1) * 0.03,
                },
              }}
            >
              <Tool
                description={secondaryTool.description}
                icon={secondaryTool.icon}
                selectedTool={selectedTool}
                setSelectedTool={setSelectedTool}
                append={append}
                isAnimating={isAnimating}
                onClick={secondaryTool.onClick}
              />
            </motion.div>
          ))}
      </AnimatePresence>

      <Tool
        description={primaryTool.description}
        icon={primaryTool.icon}
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        isToolbarVisible={isToolbarVisible}
        setIsToolbarVisible={setIsToolbarVisible}
        append={append}
        isAnimating={isAnimating}
        onClick={primaryTool.onClick}
      />
    </motion.div>
  );
};

const PureToolbar = ({
  isToolbarVisible,
  setIsToolbarVisible,
  append,
  status,
  stop,
  setMessages,
  artifactKind,
}: {
  isToolbarVisible: boolean;
  setIsToolbarVisible: Dispatch<SetStateAction<boolean>>;
  status: UseChatHelpers['status'];
  append: UseChatHelpers['append'];
  stop: UseChatHelpers['stop'];
  setMessages: UseChatHelpers['setMessages'];
  artifactKind: ArtifactKind;
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useOnClickOutside(toolbarRef as React.RefObject<HTMLElement>, () => {
    setIsToolbarVisible(false);
    setSelectedTool(null);
  });

  const startCloseTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setSelectedTool(null);
      setIsToolbarVisible(false);
    }, 2000);
  };

  const cancelCloseTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (status === 'streaming') {
      setIsToolbarVisible(false);
    }
  }, [status, setIsToolbarVisible]);

  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifactKind,
  );

  if (!artifactDefinition) {
    throw new Error('Artifact definition not found!');
  }

  const toolsByArtifactKind = artifactDefinition.toolbar;

  if (toolsByArtifactKind.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <motion.div
        className="fixed right-6 bottom-6 z-50"
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <motion.div
          className={cx(
            'relative p-2 rounded-2xl backdrop-blur-md border shadow-2xl flex flex-col justify-end gap-2 cursor-pointer transition-all duration-500',
            {
              'bg-gradient-to-br from-pink-50/95 to-pink-100/90 dark:from-pink-950/95 dark:to-pink-900/90 border-pink-200/50 dark:border-pink-800/30 shadow-pink-500/10':
                !status || status !== 'streaming',
              'bg-gradient-to-br from-red-50/95 to-red-100/90 dark:from-red-950/95 dark:to-red-900/90 border-red-200/50 dark:border-red-800/30 shadow-red-500/10':
                status === 'streaming',
            },
          )}
          animate={
            isToolbarVisible
              ? selectedTool === 'adjust-reading-level'
                ? {
                    height: 6 * 50 + 32,
                    transition: { type: 'spring', stiffness: 300, damping: 25 },
                  }
                : {
                    height: toolsByArtifactKind.length * 56 + 32,
                    transition: { type: 'spring', stiffness: 300, damping: 25 },
                  }
              : {
                  height: 70,
                  transition: { type: 'spring', stiffness: 300, damping: 25 },
                }
          }
          onHoverStart={() => {
            if (status === 'streaming') return;
            cancelCloseTimer();
            setIsToolbarVisible(true);
          }}
          onHoverEnd={() => {
            if (status === 'streaming') return;
            startCloseTimer();
          }}
          onAnimationStart={() => {
            setIsAnimating(true);
          }}
          onAnimationComplete={() => {
            setIsAnimating(false);
          }}
          ref={toolbarRef}
        >
          {/* Background glow effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-400/20 to-pink-600/20 blur-xl -z-10"
            animate={{
              opacity: isToolbarVisible ? 0.6 : 0.3,
              scale: isToolbarVisible ? 1.1 : 1,
            }}
            transition={{ duration: 0.3 }}
          />

          {status === 'streaming' ? (
            <motion.div
              key="stop-icon"
              className="p-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white cursor-pointer shadow-lg shadow-red-500/25 hover:from-red-600 hover:to-red-700 transition-all duration-300"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                stop();
                setMessages((messages) => messages);
              }}
            >
              <StopCircleIcon className="size-6" />
            </motion.div>
          ) : selectedTool === 'adjust-reading-level' ? (
            <ReadingLevelSelector
              key="reading-level-selector"
              append={append}
              setSelectedTool={setSelectedTool}
              isAnimating={isAnimating}
            />
          ) : (
            <Tools
              key="tools"
              append={append}
              isAnimating={isAnimating}
              isToolbarVisible={isToolbarVisible}
              selectedTool={selectedTool}
              setIsToolbarVisible={setIsToolbarVisible}
              setSelectedTool={setSelectedTool}
              tools={toolsByArtifactKind}
            />
          )}

          {/* Floating particles effect */}
          <AnimatePresence>
            {isToolbarVisible &&
              [...Array(3)].map((_, i) => {
                const delay = i * 0.5;
                return (
                  <motion.div
                    key={nanoid()}
                    className="absolute size-1 bg-pink-400 rounded-full opacity-60"
                    initial={{
                      opacity: 0,
                      x: Math.random() * 20 - 10,
                      y: Math.random() * 20 - 10,
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      x: Math.random() * 40 - 20,
                      y: Math.random() * 40 - 20,
                      transition: {
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        delay,
                      },
                    }}
                    style={{
                      left: '50%',
                      top: '50%',
                    }}
                  />
                );
              })}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
};

export const Toolbar = memo(PureToolbar, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.isToolbarVisible !== nextProps.isToolbarVisible) return false;
  if (prevProps.artifactKind !== nextProps.artifactKind) return false;

  return true;
});

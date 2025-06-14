'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, FileText, Code, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useState } from 'react';

type CategoryType = 'create' | 'explore' | 'code' | 'learn';

interface GreetingProps {
  input?: string;
  onExamplePromptClick?: (prompt: string) => void;
}

export const Greeting = ({
  input = '',
  onExamplePromptClick,
}: GreetingProps) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(
    null,
  );

  const categories = [
    {
      id: 'create' as CategoryType,
      icon: Sparkles,
      label: t('chat.categories.create'),
      color:
        'from-pink-500 to-purple-500 dark:from-pink-600 dark:to-purple-600',
    },
    {
      id: 'explore' as CategoryType,
      icon: FileText,
      label: t('chat.categories.explore'),
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'code' as CategoryType,
      icon: Code,
      label: t('chat.categories.code'),
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 'learn' as CategoryType,
      icon: Lightbulb,
      label: t('chat.categories.learn'),
      color: 'from-orange-500 to-yellow-500',
    },
  ];

  const getExamplePrompts = (category: CategoryType | null) => {
    if (!category) {
      return [
        t('chat.examples.general.example1'),
        t('chat.examples.general.example2'),
        t('chat.examples.general.example3'),
        t('chat.examples.general.example4'),
      ];
    }

    switch (category) {
      case 'create':
        return [
          t('chat.examples.create.writeEmail'),
          t('chat.examples.create.writeStory'),
          t('chat.examples.create.createPresentation'),
          t('chat.examples.create.designLogo'),
        ];
      case 'explore':
        return [
          t('chat.examples.explore.explainConcept'),
          t('chat.examples.explore.researchTopic'),
          t('chat.examples.explore.compareIdeas'),
          t('chat.examples.explore.analyzeData'),
        ];
      case 'code':
        return [
          t('chat.examples.code.createFunction'),
          t('chat.examples.code.debugCode'),
          t('chat.examples.code.optimizePerformance'),
          t('chat.examples.code.reviewCode'),
        ];
      case 'learn':
        return [
          t('chat.examples.learn.learnLanguage'),
          t('chat.examples.learn.explainMath'),
          t('chat.examples.learn.studyHistory'),
          t('chat.examples.learn.practiceSkill'),
        ];
      default:
        return [];
    }
  };

  const examplePrompts = getExamplePrompts(selectedCategory);

  const handleCategoryClick = (categoryId: CategoryType) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center"
      initial={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      animate={{
        opacity: input.length > 0 ? 0 : 1,
        scale: input.length > 0 ? 1.1 : 1,
        filter: input.length > 0 ? 'blur(40px)' : 'blur(0px)',
        pointerEvents: input.length > 0 ? 'none' : 'auto',
      }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Greeting Text */}
      <div className="space-y-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center"
        >
          {t('chat.greetings.hello')}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-pink-600 dark:text-pink-400 text-center"
        >
          {t('chat.greetings.subtitle')}
        </motion.div>
      </div>

      {/* Category Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
      >
        {categories.map(({ id, icon: Icon, label }, index) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <Button
              variant="secondary"
              size="lg"
              onClick={() => handleCategoryClick(id)}
              className={`w-full border-pink-300 dark:border-pink-800/60 text-pink-800 dark:text-pink-300 h-20 duration-200 rounded-3xl ${
                selectedCategory === id
                  ? 'bg-pink-400/40 hover:bg-pink-400/50 dark:bg-pink-800/40 dark:hover:bg-pink-800/50 scale-105 shadow-lg'
                  : 'bg-pink-300/30 hover:bg-pink-300/40 dark:bg-black/40 dark:hover:bg-black/60'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon className="size-5 text-pink-600 dark:text-pink-400" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Example Prompts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-3"
        key={selectedCategory} // Re-animate when category changes
      >
        {examplePrompts.map((prompt, index) => (
          <motion.div
            key={prompt}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
          >
            <Button
              variant="ghost"
              size="lg"
              className="w-full p-4 text-left justify-start hover:bg-pink-300/20 dark:hover:bg-black/40 text-gray-700 dark:text-gray-300 border border-transparent hover:border-pink-300 dark:hover:border-pink-800/60 rounded-xl h-auto"
              onClick={() => onExamplePromptClick?.(prompt)}
            >
              <span className="text-base">{prompt}</span>
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

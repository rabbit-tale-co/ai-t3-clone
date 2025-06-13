'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  Star,
  Zap,
  Eye,
  Globe,
  FileText,
  Brain,
  Settings,
  X,
  Filter,
  CheckCircleIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { chatModels, type ChatModel } from '@/lib/ai/models';
import { useSession } from 'next-auth/react';

interface FullModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

const capabilityIcons = {
  text: <FileText className="size-3 text-pink-600 dark:text-pink-400" />,
  image: <Eye className="size-3 text-pink-600 dark:text-pink-400" />,
  audio: <Brain className="size-3 text-pink-600 dark:text-pink-400" />,
  video: <Globe className="size-3 text-pink-600 dark:text-pink-400" />,
};

export function FullModelSelector({
  selectedModel,
  onModelChange,
  isOpen = false,
  setIsOpen,
}: FullModelSelectorProps) {
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>(
    [],
  );
  const [showFilters, setShowFilters] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { data: session } = useSession();

  const effectiveIsOpen = isOpen !== undefined ? isOpen : localIsOpen;
  const effectiveSetIsOpen = setIsOpen || setLocalIsOpen;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use real models from chatModels
  const models = useMemo(() => {
    if (!isClient) {
      return [];
    }
    return chatModels;
  }, [isClient]);

  const filteredModels = models.filter((model: ChatModel) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || (selectedCategory === 'favorites' && false); // TODO: implement favorites
    const matchesCapabilities =
      selectedCapabilities.length === 0 ||
      selectedCapabilities.every((cap) => model.capabilities.includes(cap));
    return matchesSearch && matchesCategory && matchesCapabilities;
  });

  const handleModelSelect = (modelId: string) => {
    // Close modal first, then change model
    effectiveSetIsOpen(false);

    // Use setTimeout to ensure modal closes before model change
    setTimeout(() => {
      onModelChange(modelId);
    }, 100);
  };

  const toggleCapability = (capability: string) => {
    setSelectedCapabilities((prev) =>
      prev.includes(capability)
        ? prev.filter((c) => c !== capability)
        : [...prev, capability],
    );
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedCapabilities([]);
    setSearchQuery('');
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedCapabilities.length > 0 ||
    searchQuery;

  return (
    <TooltipProvider>
      <Dialog open={effectiveIsOpen} onOpenChange={effectiveSetIsOpen}>
        <DialogContent className="w-[95vw] sm:min-w-4xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-pink-50/95 to-pink-100/80 dark:from-black/98 dark:to-pink-950/30 border-pink-200/60 dark:border-pink-900/40 backdrop-blur-xl rounded-2xl">
          {/* Header */}
          <DialogHeader className="pb-4 sm:pb-6 border-b border-pink-200/50 dark:border-pink-900/30">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-pink-900 dark:text-gray-100">
                    Wybierz Model AI
                  </h2>
                  <p className="text-xs sm:text-sm text-pink-600 dark:text-pink-400 mt-0.5 hidden sm:block">
                    Wybierz idealny model dla swojego zadania
                  </p>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-full max-h-[calc(95vh-120px)] overflow-hidden">
            {/* Search and Filters */}
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 size-4 text-pink-500 dark:text-pink-400" />
                <Input
                  placeholder="Wyszukaj modele..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 sm:pl-12 pr-4 h-10 sm:h-12 rounded-xl border-pink-200 dark:border-pink-800/50 bg-white/80 dark:bg-black/50 text-pink-900 dark:text-pink-100 placeholder:text-pink-500 dark:placeholder:text-pink-400 focus:border-pink-400 dark:focus:border-pink-600 focus:ring-pink-400/20 dark:focus:ring-pink-600/20 text-sm sm:text-base"
                />
              </div>

              {/* Filter Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      'rounded-md border-pink-200 dark:border-pink-800/50 transition-all flex-1 sm:flex-none text-xs sm:text-sm',
                      showFilters
                        ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-700'
                        : 'hover:bg-pink-50 dark:hover:bg-pink-900/20 text-pink-600 dark:text-pink-400',
                    )}
                  >
                    <Filter className="size-3 sm:size-4 mr-1 sm:mr-2" />
                    {showFilters ? 'Ukryj' : 'Pokaz'} Filtry
                    {hasActiveFilters && (
                      <Badge className="ml-1 sm:ml-2 bg-pink-500 text-white px-1 sm:px-1.75 py-0.5 text-xs">
                        {(selectedCategory !== 'all' ? 1 : 0) +
                          selectedCapabilities.length +
                          (searchQuery ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-md text-xs sm:text-sm"
                    >
                      <X className="size-3 sm:size-4 mr-1" />
                      <span className="hidden sm:inline">Wyczyść</span>
                      <span className="sm:hidden">Wyczyść</span>
                    </Button>
                  )}
                </div>
                <div className="text-xs sm:text-sm text-pink-600 dark:text-pink-400 text-center sm:text-right">
                  {filteredModels.length} model
                  {filteredModels.length !== 1 ? 'i' : ''}
                </div>
              </div>

              {/* Collapsible Filters */}
              {showFilters && (
                <Card className="border-pink-200/50 dark:border-pink-800/30 bg-pink-50/50 dark:bg-black/30 rounded-xl">
                  <CardContent className="p-3 sm:p-5 space-y-4 sm:space-y-5">
                    {/* Category Filters */}
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-pink-800 dark:text-pink-200 mb-2 sm:mb-3">
                        Kategorie
                      </h4>
                      <div className="grid grid-cols-2 sm:flex sm:gap-2 gap-2 sm:flex-wrap">
                        {[
                          { id: 'all', label: 'Wszystkie' },
                          { id: 'favorites', label: '⭐ Ulubione' },
                          { id: 'gemini', label: 'Gemini' },
                          { id: 'openai', label: 'OpenAI' },
                        ].map((category) => (
                          <Button
                            key={category.id}
                            variant={
                              selectedCategory === category.id
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            onClick={() => setSelectedCategory(category.id)}
                            className={cn(
                              'rounded-md transition-all text-xs sm:text-sm h-8 sm:h-auto',
                              selectedCategory === category.id
                                ? 'bg-pink-500 dark:bg-pink-600 text-white border-pink-500 shadow-sm'
                                : 'border-pink-200 dark:border-pink-700/50 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/30',
                            )}
                          >
                            {category.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-pink-200/50 dark:bg-pink-800/30" />

                    {/* Capability Filters */}
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-pink-800 dark:text-pink-200 mb-2 sm:mb-3">
                        Możliwości
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {
                            id: 'text',
                            label: 'Tekst',
                            icon: <FileText className="size-3 sm:size-4" />,
                          },
                          {
                            id: 'image',
                            label: 'Obrazy',
                            icon: <Eye className="size-3 sm:size-4" />,
                          },
                          {
                            id: 'audio',
                            label: 'Audio',
                            icon: <Brain className="size-3 sm:size-4" />,
                          },
                          {
                            id: 'video',
                            label: 'Video',
                            icon: <Globe className="size-3 sm:size-4" />,
                          },
                        ].map((capability) => (
                          <Button
                            key={capability.id}
                            variant={
                              selectedCapabilities.includes(capability.id)
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            onClick={() => toggleCapability(capability.id)}
                            className={cn(
                              'flex items-center gap-1 sm:gap-2 rounded-md transition-all justify-start text-xs sm:text-sm h-8 sm:h-auto',
                              selectedCapabilities.includes(capability.id)
                                ? 'bg-pink-500 dark:bg-pink-600 text-white border-pink-500 shadow-sm'
                                : 'border-pink-200 dark:border-pink-700/50 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/30',
                            )}
                          >
                            {capability.icon}
                            <span className="text-xs sm:text-sm">
                              {capability.label}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Models Grid */}
            <div className="flex-1 overflow-y-auto px-1 space-y-6 sm:space-y-8 mb-4 sm:mb-6">
              {filteredModels.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-fr">
                  {filteredModels.map((model) => (
                    <ModelCard
                      key={model.id}
                      model={model}
                      isSelected={selectedModel === model.id}
                      onSelect={() => handleModelSelect(model.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="size-16 mx-auto mb-4 rounded-2xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                    <Search className="size-8 text-pink-500 dark:text-pink-400" />
                  </div>
                  <h3 className="text-lg font-medium text-pink-900 dark:text-pink-100 mb-2">
                    Nie znaleziono modeli
                  </h3>
                  <p className="text-pink-600 dark:text-pink-400 mb-4">
                    Spróbuj dostosować wyszukiwanie lub filtry
                  </p>
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="rounded-lg border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400"
                  >
                    Wyczyść wszystkie filtry
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

// Model Card Component
function ModelCard({
  model,
  isSelected,
  onSelect,
}: {
  model: ChatModel;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      className={cn(
        'transition-all duration-200 rounded-xl ring-1 ring-pink-200 dark:ring-pink-800/50 group py-0 cursor-pointer hover:shadow-lg',
        isSelected
          ? 'ring-1 ring-pink-500 dark:ring-pink-600 bg-pink-50 dark:bg-pink-950/50 border-pink-300 dark:border-pink-700 shadow-md'
          : 'hover:bg-pink-50/50 dark:hover:bg-pink-950/20 border-pink-200/50 dark:border-pink-800/30 bg-white/70 dark:bg-black/40',
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4 sm:p-5 flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div
              className={cn(
                'size-8 sm:size-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0',
                isSelected
                  ? 'bg-pink-500 text-white'
                  : 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 group-hover:bg-pink-200 dark:group-hover:bg-pink-900/50',
              )}
            >
              <Zap className="size-4 sm:size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-pink-900 dark:text-pink-100 text-sm sm:text-base truncate">
                {model.name}
              </h4>
              <p className="text-xs sm:text-sm text-pink-600 dark:text-pink-400 font-medium truncate">
                Google
              </p>
            </div>
          </div>
          {isSelected && (
            <div className="text-pink-600 dark:text-pink-400">
              <CheckCircleIcon className="size-4 sm:size-5" />
            </div>
          )}
        </div>

        <p className="text-xs sm:text-sm text-pink-700 dark:text-pink-300 mb-3 sm:mb-4 leading-relaxed flex-grow line-clamp-3 sm:line-clamp-none">
          {model.description}
        </p>

        {model.capabilities.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-auto">
            {model.capabilities.map((capability: string) => (
              <Tooltip key={capability}>
                <TooltipTrigger asChild>
                  <div className="size-7 rounded-lg bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center border border-pink-200 dark:border-pink-800/50 hover:bg-pink-200 dark:hover:bg-pink-900/60 transition-colors cursor-help">
                    {capabilityIcons[
                      capability as keyof typeof capabilityIcons
                    ] || (
                      <FileText className="size-3 text-pink-600 dark:text-pink-400" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm font-medium">
                    {capability === 'text' && 'Przetwarzanie tekstu'}
                    {capability === 'image' && 'Analiza obrazów'}
                    {capability === 'audio' && 'Przetwarzanie audio'}
                    {capability === 'video' && 'Analiza video'}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

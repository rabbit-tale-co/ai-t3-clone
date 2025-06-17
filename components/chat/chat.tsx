'use client';

import type { UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState, startTransition, useCallback } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from './chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { Artifact } from '@/components/chat/artifact';
import { Messages } from './messages';
import type { VisibilityType } from '@/components/visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from '@/lib/constants';
import { toast } from '@/components/toast';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import { ChatInput } from './chat-input';
import { FileUploadCard } from './file-upload-card';
import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { chatModels } from '@/lib/ai/models';
import { getAvailableModelsAction } from '@/app/(auth)/models-actions';
import { useMessageCount } from '@/hooks/use-message-count';

// Helper function to get provider ID from model ID
const getProviderIdFromModelId = (modelId: string): string => {
  if (modelId.startsWith('gemini')) return 'google';
  if (modelId.startsWith('gpt')) return 'openai';
  if (modelId.startsWith('claude')) return 'anthropic';
  if (modelId.startsWith('grok')) return 'xai';
  if (modelId.includes('llama') || modelId.includes('mixtral')) return 'groq';
  if (modelId.startsWith('command')) return 'cohere';
  if (modelId.startsWith('mistral')) return 'mistral';
  return 'unknown';
};

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}) {
  const { mutate } = useSWRConfig();
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [attachments, setAttachments] = useState<
    Array<{
      name: string;
      size: number;
      type?: string;
      contentType: string;
      url: string;
    }>
  >([]);
  const [selectedModel, setSelectedModel] = useState(initialChatModel);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [isNewChat, setIsNewChat] = useState(initialMessages.length === 0);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);

  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  // Token reset confetti callback
  const handleTokenReset = useCallback(() => {
    // Import confetti dynamically to avoid SSR issues
    import('canvas-confetti').then((confetti) => {
      // Find the input textarea to get its position
      const inputElement = document.querySelector('textarea');
      let origin = { x: 0.5, y: 0.8 }; // Default to bottom center

      if (inputElement) {
        const rect = inputElement.getBoundingClientRect();
        origin = {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        };
      }

      // Confetti burst from input position
      confetti.default({
        particleCount: 150,
        spread: 70,
        origin,
        colors: ['#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d'],
        ticks: 300,
        gravity: 0.6,
        decay: 0.9,
        startVelocity: 45,
      });

      // Additional burst after short delay
      setTimeout(() => {
        confetti.default({
          particleCount: 100,
          spread: 60,
          origin,
          colors: ['#fbbf24', '#f59e0b', '#d97706', '#b45309'],
          ticks: 200,
          gravity: 0.8,
          decay: 0.9,
          startVelocity: 35,
        });
      }, 300);
    });
  }, []);

  // Fetch message count and usage info
  const {
    messagesLeft,
    messagesUsed,
    maxMessages,
    resetTime,
    refetch: refetchMessageCount,
  } = useMessageCount(session, handleTokenReset);

  // Fetch available models
  useEffect(() => {
    const fetchAvailableModels = async () => {
      try {
        setLoadingModels(true);
        const data = await getAvailableModelsAction();
        const modelIds = data.models.map((model) => model.id);
        setAvailableModels(modelIds);
      } catch (error) {
        console.error('Error fetching available models:', error);
        setAvailableModels([]);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchAvailableModels();
  }, []); // Remove selectedModel from dependencies to prevent infinite loop

  // Validate selected model when available models are loaded
  useEffect(() => {
    if (!loadingModels && availableModels.length > 0) {
      // console.log('Model validation:', {
      //   selectedModel,
      //   availableModels,
      //   isIncluded: availableModels.includes(selectedModel)
      // });

      if (!availableModels.includes(selectedModel)) {
        const fallbackModel = availableModels[0];
        // console.log('Switching model from', selectedModel, 'to', fallbackModel);
        setSelectedModel(fallbackModel);
        const newModel = chatModels.find((model) => model.id === fallbackModel);
        if (newModel) {
          toast({
            type: 'warning',
            description: `Selected model is not available. Switched to ${newModel.name}.`,
          });
        }
      }
    }
  }, [availableModels, loadingModels, selectedModel]);

  // Check if selected model is available
  const isModelAvailable = availableModels.includes(selectedModel);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    experimental_resume,
    data,
  } = useChat({
    id,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: fetchWithErrorHandlers,
    experimental_prepareRequestBody: (body) => ({
      id,
      message: body.messages.at(-1),
      selectedChatModel: selectedModel,
      selectedVisibilityType: visibilityType,
      attachments: attachments,
    }),
    onFinish: () => {
      console.log(
        'onFinish called - AI response completed, messages.length:',
        messages.length,
      );
      console.log('isNewChat:', isNewChat);

      // Add chat to sidebar cache if it's a new chat (first AI response)
      if (isNewChat && typeof window !== 'undefined') {
        console.log('Adding new chat to sidebar cache after AI response');
        const addChatToSidebarCache = (window as any).addChatToSidebarCache;
        if (addChatToSidebarCache) {
          // Get title from first user message or input
          const userMessage = messages[0]?.content || input.trim();
          const title =
            userMessage.slice(0, 50).trim() +
              (userMessage.length > 50 ? '...' : '') || 'New Chat';

          const chatData = {
            id,
            title,
            createdAt: new Date(),
            userId: session?.user?.id,
            visibility: visibilityType,
            folderId: null,
          };
          addChatToSidebarCache(chatData);
        }
      }

      // Refresh message count after AI response (user message was sent)
      console.log('Calling refetchMessageCount from onFinish...');
      refetchMessageCount();

      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast({
          type: 'error',
          description: error.message,
        });
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get('query');
  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      append({
        role: 'user',
        content: query,
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, append, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    experimental_resume,
    data,
    setMessages,
  });

  const handleFilesSelected = (files: File[]) => {
    if (session?.user?.type !== 'regular') {
      toast({
        type: 'warning',
        description:
          'Function to upload files is only available for Pro users.',
      });
      return;
    }

    // Sprawdź rozmiar plików (max 10MB na plik)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter((file) => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      toast({
        type: 'error',
        description: `Some files are too large (max 10MB). Files: ${oversizedFiles.map((f) => f.name).join(', ')}`,
      });
      return;
    }

    const newAttachments = files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      contentType: file.type || 'application/octet-stream',
      url: URL.createObjectURL(file),
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
    toast({
      type: 'success',
      description: `Added ${files.length} file(s)`,
    });
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAttachments = () => {
    setAttachments([]);
  };

  const handleExamplePromptClick = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      textarea?.focus();
    }, 100);
  };

  const handleModelChange = (modelId: string) => {
    const previousModel = selectedModel;
    setSelectedModel(modelId);

    // Znajdź nazwę nowego modelu
    const newModel = chatModels.find((model: any) => model.id === modelId);

    if (newModel && previousModel !== modelId) {
      toast({
        type: 'success',
        description: `Model changed to ${newModel.name}. New conversations will use this model.`,
      });
    }

    startTransition(() => {
      saveChatModelAsCookie(modelId);
    });
  };

  const handleToggleSearch = () => {
    if (session?.user?.type !== 'pro') {
      toast({
        type: 'warning',
        description:
          'Function to search the internet is only available for Pro users.',
      });
      return;
    }

    setSearchEnabled((prev) => {
      const newState = !prev;
      if (newState) {
        toast({
          type: 'info',
          description:
            'Internet search has been enabled. Your queries will be enriched with current information from the network.',
        });
      }
      return newState;
    });
  };

  const handleShowFileUpload = () => {
    if (session?.user?.type !== 'regular') {
      toast({
        type: 'warning',
        // TODO: Add translation
        description:
          'Function to upload files is only available for Pro users.',
      });
      return;
    }

    setShowFileUpload(true);
  };

  const handleSubmitWithOptimistic = useCallback(
    (event?: {
      preventDefault?: () => void;
    }) => {
      // Check if model is available before submitting
      if (!isModelAvailable) {
        const providerId = getProviderIdFromModelId(selectedModel);
        const currentModel = chatModels.find(
          (model) => model.id === selectedModel,
        );

        toast({
          type: 'error',
          description: `Cannot send message. The selected model "${currentModel?.name || selectedModel}" requires an API key for ${providerId}. Please add your API key in Settings or select a different model.`,
        });
        return;
      }

      // Prevent default form submission
      if (event?.preventDefault) {
        event.preventDefault();
      }

      // Jeśli to pierwszy submit (nowy chat)
      if (messages.length === 0) {
        if (typeof window !== 'undefined') {
          const addNewChatOptimistic = (window as any).addNewChatOptimistic;
          if (addNewChatOptimistic) {
            const userMessage = input.trim();
            const title = userMessage
              ? userMessage.slice(0, 50).trim() +
                (userMessage.length > 50 ? '...' : '')
              : attachments.length > 0
                ? `File upload (${attachments.length} file${attachments.length > 1 ? 's' : ''})`
                : 'New Chat';
            addNewChatOptimistic(id, title);
            setIsNewChat(false);
          }
        }
      }

      // Use append with attachments if we have them, otherwise use handleSubmit
      if (attachments.length > 0) {
        const message = {
          role: 'user' as const,
          content: input.trim() || '',
          experimental_attachments: attachments.map((att) => ({
            name: att.name,
            contentType: att.contentType,
            url: att.url,
          })),
        };

        append(message);
        setInput('');
        setAttachments([]);
      } else {
        handleSubmit(event);
      }

      // Note: refetchMessageCount is called in onFinish callback after AI response
    },
    [
      messages.length,
      input,
      id,
      handleSubmit,
      isModelAvailable,
      selectedModel,
      attachments,
      append,
      setInput,
    ],
  );

  return (
    <>
      <div className="relative h-dvh bg-gradient-to-br from-pink-50/30 to-pink-100/20 dark:from-black/90 dark:to-pink-950/30 backdrop-blur-sm">
        {/* Chat Header - Fixed at top */}
        <div className="absolute top-0 left-0 right-0 z-40">
          <ChatHeader
            chatId={id}
            selectedModelId={selectedModel}
            selectedVisibilityType={initialVisibilityType}
            isReadonly={isReadonly}
            session={session}
          />
        </div>

        {/* Messages Area - Full height with bottom padding for input */}
        <div className="absolute top-0 left-0 right-0 bottom-0 pt-16 pb-4 overflow-hidden">
          <Messages
            chatId={id}
            status={status}
            votes={votes}
            messages={messages}
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
            isArtifactVisible={isArtifactVisible}
            input={input}
            onExamplePromptClick={handleExamplePromptClick}
          />
        </div>

        {/* Chat Input - Fixed at bottom */}
        {!isReadonly && (
          <div className="absolute bottom-0 left-0 right-0 z-50">
            <ChatInput
              input={input}
              onInputChange={(e) => setInput(e.target.value)}
              onSubmit={handleSubmitWithOptimistic}
              attachments={attachments}
              onFileUpload={(e) => {
                const files = Array.from(e.target.files || []) as File[];
                handleFilesSelected(files);
              }}
              onRemoveAttachment={handleRemoveAttachment}
              onClearAttachments={handleClearAttachments}
              onShowFileUpload={handleShowFileUpload}
              uploadProgress={0}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              searchEnabled={searchEnabled}
              onToggleSearch={handleToggleSearch}
              isStreaming={status === 'streaming'}
              disabled={false}
              fileInputRef={{ current: null }}
              hasRemainingUsage={messagesLeft === null || messagesLeft > 0}
              usage={
                messagesLeft !== null && maxMessages !== null
                  ? { remaining: messagesLeft, limit: maxMessages }
                  : null
              }
              resetTime={resetTime}
              userType={session?.user?.type}
              isModelAvailable={isModelAvailable}
              loadingModels={loadingModels}
            />
          </div>
        )}
      </div>

      {/* File Upload Modal */}
      <FileUploadCard
        isOpen={showFileUpload}
        onClose={() => setShowFileUpload(false)}
        onUpload={handleFilesSelected}
      />

      {/* Artifact Panel */}
      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments as any}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
      />
    </>
  );
}

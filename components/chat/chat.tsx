'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState, startTransition, useCallback } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from './chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { Artifact } from '@/components/artifact';
import { MultimodalInput } from '@/components/multimodal-input';
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
import { UsageDisplay } from './usage-display';
import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { chatModels } from '@/lib/ai/models';

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
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [selectedModel, setSelectedModel] = useState(initialChatModel);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [isNewChat, setIsNewChat] = useState(initialMessages.length === 0);

  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

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
    if (session?.user?.type !== 'pro') {
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
      contentType: file.type,
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
    if (session?.user?.type !== 'pro') {
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
      console.log(
        'handleSubmitWithOptimistic called, messages.length:',
        messages.length,
      );

      // Jeśli to pierwszy submit (nowy chat)
      if (messages.length === 0) {
        console.log('First message - adding optimistic chat');
        if (typeof window !== 'undefined') {
          const addNewChatOptimistic = (window as any).addNewChatOptimistic;
          if (addNewChatOptimistic) {
            const userMessage = input.trim();
            const title =
              userMessage.slice(0, 50).trim() +
                (userMessage.length > 50 ? '...' : '') || 'New Chat';
            addNewChatOptimistic(id, title);
            setIsNewChat(false);
          }
        }
      }

      return handleSubmit(event);
    },
    [messages.length, input, id, session?.user?.id, handleSubmit],
  );

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-gradient-to-br from-pink-50/30 to-pink-100/20 dark:from-black/90 dark:to-pink-950/30 backdrop-blur-sm">
        {/* Chat Header */}
        <ChatHeader
          chatId={id}
          selectedModelId={selectedModel}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
          session={session}
        />

        {/* Messages Area */}
        <div className="flex-1 min-h-0 relative">
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

        {/* Chat Input */}
        {!isReadonly && (
          <ChatInput
            input={input}
            onInputChange={(e) => setInput(e.target.value)}
            onSubmit={handleSubmitWithOptimistic}
            attachments={attachments as unknown as File[]}
            onFileUpload={(e) => {
              const files = Array.from(e.target.files || []);
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
            disabled={!input.trim() && attachments.length === 0}
            fileInputRef={{ current: null }}
            hasRemainingUsage={true}
            userType={session?.user?.type}
          />
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
        setAttachments={setAttachments}
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

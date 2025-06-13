'use client';

import type { Message } from 'ai';
import { Button } from '@/components/ui/button';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { deleteTrailingMessages } from '@/app/(chat)/actions';
import type { UseChatHelpers } from '@ai-sdk/react';
import { Check, X, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type MessageEditorProps = {
  message: Message;
  setMode: Dispatch<SetStateAction<'view' | 'edit'>>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
};

export function MessageEditor({
  message,
  setMode,
  setMessages,
  reload,
}: MessageEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [draftContent, setDraftContent] = useState<string>(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
      // Focus and place cursor at end
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length,
      );
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftContent(event.target.value);
    adjustHeight();
  };

  const handleCancel = () => {
    setDraftContent(message.content); // Reset to original content
    setMode('view');
    toast.info('Anulowano edycję wiadomości');
  };

  const handleSave = async () => {
    if (draftContent.trim() === '') {
      toast.error('Wiadomość nie może być pusta');
      return;
    }

    if (draftContent.trim() === message.content.trim()) {
      toast.info('Brak zmian do zapisania');
      setMode('view');
      return;
    }

    setIsSubmitting(true);

    try {
      await deleteTrailingMessages({
        id: message.id,
      });

      // @ts-expect-error todo: support UIMessage in setMessages
      setMessages((messages) => {
        const index = messages.findIndex((m) => m.id === message.id);

        if (index !== -1) {
          const updatedMessage = {
            ...message,
            content: draftContent.trim(),
            parts: [{ type: 'text', text: draftContent.trim() }],
          };

          return [...messages.slice(0, index), updatedMessage];
        }

        return messages;
      });

      setMode('view');
      reload();

      toast.success('Wiadomość została zaktualizowana', {
        description: 'Generuję nową odpowiedź...',
      });
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Nie udało się zaktualizować wiadomości');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full bg-gradient-to-br from-pink-50/50 to-pink-100/30 dark:from-pink-950/20 dark:to-pink-900/10 border border-pink-200/50 dark:border-pink-800/30 rounded-xl p-4 backdrop-blur-sm">
      {/* Editor Header */}
      <div className="flex items-center gap-2 text-pink-700 dark:text-pink-300">
        <Edit3 className="size-4" />
        <span className="text-sm font-medium">Edytuj wiadomość</span>
      </div>

      {/* Textarea */}
      <Textarea
        data-testid="message-editor"
        ref={textareaRef}
        className={cn(
          'bg-white/80 dark:bg-black/50 backdrop-blur-sm border-pink-200 dark:border-pink-800/50',
          'focus:border-pink-400 dark:focus:border-pink-600 focus:ring-pink-400/20 dark:focus:ring-pink-600/20',
          'resize-none text-base rounded-xl w-full min-h-[100px]',
          'text-pink-900 dark:text-pink-100 placeholder:text-pink-500 dark:placeholder:text-pink-400',
        )}
        value={draftContent}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Wprowadź swoją wiadomość..."
        disabled={isSubmitting}
      />

      {/* Helper Text */}
      <div className="text-xs text-pink-600 dark:text-pink-400 flex items-center justify-between">
        <span>Ctrl/Cmd + Enter aby zapisać, Esc aby anulować</span>
        <span>{draftContent.length} znaków</span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-row gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="h-9 px-4 border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/50 rounded-lg"
        >
          <X className="size-4 mr-2" />
          Anuluj
        </Button>
        <Button
          data-testid="message-editor-send-button"
          size="sm"
          disabled={isSubmitting || draftContent.trim() === ''}
          onClick={handleSave}
          className="h-9 px-4 bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700 text-white rounded-lg shadow-sm"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Zapisuję...
            </>
          ) : (
            <>
              <Check className="size-4 mr-2" />
              Zapisz i wyślij
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

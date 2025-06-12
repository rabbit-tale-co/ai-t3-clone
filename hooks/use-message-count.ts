import { useEffect, useState } from 'react';
import type { Session } from 'next-auth';
import { getUserMessageCount } from '@/app/(chat)/actions';

// user swr infinite to fetch message count
export function useMessageCount(session: Session | null) {
  const [messagesLeft, setMessagesLeft] = useState<number | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchMessageCount() {
      if (!session?.user) {
        setStatus('idle');
        return;
      }

      try {
        setStatus('loading');

        const result = await getUserMessageCount(
          session.user.id,
          session.user.type,
        );

        if (result.success) {
          setMessagesLeft(result.messagesLeft);
          setStatus('success');
        } else {
          setStatus('error');
          throw new Error('Failed to fetch message count');
        }
      } catch (err) {
        console.error('Failed to fetch message count', err);
        setStatus('error');
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    }

    fetchMessageCount();
  }, [session]);

  return { messagesLeft, status, error };
}

import { useEffect, useState } from 'react';
import type { Session } from 'next-auth';
import { getUserMessageCount } from '@/app/(chat)/actions';

export function useMessageCount(session: Session | null) {
  const [messagesLeft, setMessagesLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchMessageCount() {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const result = await getUserMessageCount(
          session.user.id,
          session.user.type,
        );

        if (result.success) {
          setMessagesLeft(result.messagesLeft);
        } else {
          throw new Error('Failed to fetch message count');
        }
      } catch (err) {
        console.error('Failed to fetch message count', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchMessageCount();
  }, [session]);

  return { messagesLeft, loading, error };
}

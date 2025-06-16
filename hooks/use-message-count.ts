import { useEffect, useState, useRef, useCallback } from 'react';
import type { Session } from 'next-auth';
import { getUserMessageCount } from '@/app/(chat)/actions';
import { useSession } from 'next-auth/react';

const DEBOUNCE_DELAY = 10; // seconds

interface Usage {
  remaining: number;
  limit: number;
}

// user swr infinite to fetch message count
export function useMessageCount(session: Session | null, onTokenReset?: () => void) {
  const [messagesLeft, setMessagesLeft] = useState<number | null>(null);
  const [messagesUsed, setMessagesUsed] = useState<number | null>(null);
  const [maxMessages, setMaxMessages] = useState<number | null>(null);
  const [resetTime, setResetTime] = useState<Date | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);
  const lastUserActivityRef = useRef<number>(Date.now());
  const previousMessagesLeftRef = useRef<number | null>(null);

  const fetchMessageCount = useCallback(
    async (force = false, isTimerReset = false) => {
      if (!session?.user?.id) return;

      const now = Date.now();
      const timeSinceLastFetch = (now - lastFetchRef.current) / 1000;

      if (!force && timeSinceLastFetch < DEBOUNCE_DELAY) {
        return;
      }

      lastFetchRef.current = now;

      try {
        const response = await fetch('/api/user/usage');
        if (!response.ok) {
          throw new Error('Failed to fetch message count');
        }

        const data = await response.json();
        if (data.success) {
          const newMessagesLeft = data.messagesLeft ?? 0;

          // Check if this was a token reset (timer reached 0)
          if (isTimerReset && onTokenReset && previousMessagesLeftRef.current === 0 && newMessagesLeft > 0) {
            onTokenReset();
          }

          setMessagesLeft(newMessagesLeft);
          setMessagesUsed(data.messagesUsed ?? 0);
          setMaxMessages(data.maxMessages ?? 0);
          setResetTime(data.resetTime ? new Date(data.resetTime) : null);

          previousMessagesLeftRef.current = newMessagesLeft;
        } else {
          throw new Error(data.error || 'Failed to fetch message count');
        }
      } catch (error) {
        console.error('Error fetching message count:', error);
        setMessagesLeft(null);
        setMessagesUsed(null);
        setMaxMessages(null);
        setResetTime(null);
      }
    },
    [session?.user?.id, onTokenReset],
  );

  // Setup automatic refresh when reset time is reached
  useEffect(() => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Check if reset time has passed and refresh if needed
    if (resetTime && session?.user?.id) {
      const now = new Date();
      const diffMs = resetTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffMs <= 0) {
        // Reset time has already passed - refresh immediately but with debouncing
        fetchMessageCount(true, true);
      } else {
        // Set up timer for future reset
        const timeoutId = setTimeout(() => {
          fetchMessageCount(true, true); // Mark as timer reset
        }, diffMs);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [resetTime, session?.user?.id, fetchMessageCount]);

  useEffect(() => {
    fetchMessageCount();
  }, [session?.user?.id]); // Only fetch when user ID changes

  // Additional effect to check periodically if reset time has passed
  useEffect(() => {
    // DISABLED: Periodic checks cause too many requests
    // We rely on visibility API and manual refreshes instead
  }, [resetTime?.getTime()]); // Only depend on resetTime value

  // Check when user comes back to the tab (visibility change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && resetTime) {
        const now = new Date();
        const timeDiff = now.getTime() - resetTime.getTime();
        const hoursFromNow = timeDiff / (1000 * 60 * 60);

        // Only refresh if reset time has passed by more than 1 hour (to avoid false positives)
        // and we haven't fetched recently
        if (hoursFromNow > 1) {
          const timeSinceLastFetch = now.getTime() - lastFetchRef.current;
          if (timeSinceLastFetch > 30000) { // 30 seconds since last fetch
            fetchMessageCount(true, true); // Mark as potential timer reset
          }
        } else if (hoursFromNow > 0) {
        } else {
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resetTime?.getTime()]); // Only depend on resetTime value

  const refetch = () => {
    lastUserActivityRef.current = Date.now(); // Update user activity
    fetchMessageCount(true); // Force refresh when manually called
  };

  return {
    messagesLeft,
    messagesUsed,
    maxMessages,
    resetTime,
    status,
    error,
    refetch
  };
}

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Sparkles, MessageSquare, Crown, AlertTriangle } from 'lucide-react';

interface Usage {
  remaining: number;
  limit: number;
  used: number;
  total: number;
  is_premium?: boolean;
  claude_remaining?: number;
  claude_limit?: number;
  claude_used?: number;
  claude_credits?: number;
}

interface UsageDisplayProps {
  usage: Usage | null;
  isLoading: boolean;
  onPurchaseCredits?: () => void;
}

export function UsageDisplay({
  usage,
  isLoading,
  onPurchaseCredits,
}: UsageDisplayProps) {
  if (isLoading) {
    return (
      <Card className="w-full max-w-md border-pink-200 dark:border-pink-800/50 bg-gradient-to-br from-pink-50/50 to-pink-100/30 dark:from-pink-950/20 dark:to-pink-900/10">
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-pink-200 dark:bg-pink-800 rounded w-3/4" />
            <div className="h-3 bg-pink-200 dark:bg-pink-800 rounded w-1/2" />
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (!usage) {
    return null;
  }

  const generalProgress = (usage.used / usage.limit) * 100;
  const claudeProgress =
    usage.claude_used && usage.claude_limit
      ? (usage.claude_used /
          (usage.claude_limit + (usage.claude_credits || 0))) *
        100
      : 0;

  const isLowUsage = usage.remaining <= 3;
  const isCriticalUsage = usage.remaining <= 1;

  return (
    <Card className="w-full max-w-md bg-gradient-to-br from-pink-50/50 to-pink-100/30 dark:from-pink-950/20 dark:to-pink-900/10 border-pink-200 dark:border-pink-800/50 shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="size-4 text-pink-600 dark:text-pink-400" />
            Dzienne Limity
          </CardTitle>
          {usage.is_premium && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 shadow-sm">
              <Crown className="size-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
        <CardDescription className="text-pink-600 dark:text-pink-400">
          Twoje wykorzystanie na dzisiaj
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* General Usage */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-pink-800 dark:text-pink-200">
              Ogólne wiadomości
            </span>
            <span className="text-sm text-pink-600 dark:text-pink-400 font-mono">
              {usage.used}/{usage.limit}
            </span>
          </div>
          <Progress
            value={generalProgress}
            className={`h-2 ${
              generalProgress >= 90
                ? '[&>div]:bg-red-500'
                : generalProgress >= 75
                  ? '[&>div]:bg-yellow-500'
                  : '[&>div]:bg-pink-500'
            }`}
          />
          <div className="flex justify-between items-center text-xs">
            <span className="text-pink-600 dark:text-pink-400 flex items-center gap-1">
              {isLowUsage && <AlertTriangle className="size-3" />}
              Pozostało: {usage.remaining} wiadomości
            </span>
            <span className="text-pink-500 dark:text-pink-400">
              {generalProgress.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Claude Usage */}
        {usage.claude_limit !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-1">
                <Sparkles className="size-3" />
                Claude AI
              </span>
              <span className="text-sm text-purple-600 dark:text-purple-400 font-mono">
                {usage.claude_used}/
                {usage.claude_limit + (usage.claude_credits || 0)}
              </span>
            </div>
            <Progress
              value={claudeProgress}
              className={`h-2 ${
                claudeProgress >= 90
                  ? '[&>div]:bg-red-500'
                  : claudeProgress >= 75
                    ? '[&>div]:bg-yellow-500'
                    : '[&>div]:bg-purple-500'
              }`}
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-purple-600 dark:text-purple-400">
                Limit: {usage.claude_remaining} wiadomości
              </span>
              {usage.claude_credits && usage.claude_credits > 0 && (
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  +{usage.claude_credits} credits
                </span>
              )}
            </div>
          </div>
        )}

        {/* Warning for low usage */}
        {isCriticalUsage && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="size-4" />
              <span className="text-sm font-medium">Uwaga!</span>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Masz tylko {usage.remaining} pozostałe wiadomości. Zaloguj się aby
              zwiększyć limity.
            </p>
          </div>
        )}

        {/* Purchase Credits Button */}
        {usage.claude_remaining !== undefined &&
          usage.claude_remaining <= 2 &&
          onPurchaseCredits && (
            <Button
              onClick={onPurchaseCredits}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg rounded-lg"
              size="sm"
            >
              <Sparkles className="size-4 mr-2" />
              Kup Dodatkowe Claude Credits
            </Button>
          )}

        {/* Stats */}
        <div className="pt-2 border-t border-pink-200 dark:border-pink-800/50">
          <p className="text-xs text-pink-500 dark:text-pink-400 text-center">
            Łącznie użyto: {usage.total} wiadomości
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

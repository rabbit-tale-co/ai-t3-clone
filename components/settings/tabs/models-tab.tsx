'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Crown, Zap } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import type { UserType as AuthUserType } from '@/app/(auth)/auth';
import { AvailableModels } from '@/components/settings/available-models';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  is_premium: boolean;
  type: AuthUserType;
}

interface ModelsTabProps {
  user: UserData;
  entitlements: any;
}

export function ModelsTab({ user, entitlements }: ModelsTabProps) {
  const { t } = useLanguage();

  const getUserTypeInfo = (userType: AuthUserType) => {
    switch (userType) {
      case 'guest':
        return {
          label: t('subscription.plans.free'),
          icon: <Sparkles className="size-4" />,
          color:
            'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
          description: 'Ograniczony dostęp do podstawowych modeli',
        };
      case 'regular':
        return {
          label: t('subscription.plans.free'),
          icon: <Sparkles className="size-4" />,
          color:
            'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
          description: 'Dostęp do standardowych modeli AI',
        };
      case 'pro':
        return {
          label: t('subscription.plans.pro'),
          icon: <Crown className="size-4" />,
          color: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white',
          description: 'Pełny dostęp do wszystkich modeli premium',
        };
      case 'admin':
        return {
          label: 'Administrator',
          icon: <Zap className="size-4" />,
          color: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white',
          description: 'Nieograniczony dostęp do wszystkich funkcji',
        };
      default:
        return {
          label: t('subscription.plans.free'),
          icon: <Sparkles className="size-4" />,
          color:
            'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
          description: 'Podstawowy dostęp',
        };
    }
  };

  const userTypeInfo = getUserTypeInfo(user.type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 mb-4">
          <Sparkles className="size-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-pink-900 dark:text-pink-100 mb-2">
          {t('settings.models.title')}
        </h2>
        <p className="text-pink-600 dark:text-pink-400 max-w-2xl mx-auto">
          {t('settings.models.description')}
        </p>
      </div>

      {/* User Plan Card */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-pink-900 dark:text-pink-100">
          Your plan
        </span>
        <Badge className={`${userTypeInfo.color} border-0 shadow-sm`}>
          <div className="flex items-center gap-1.5">
            {userTypeInfo.icon}
            {userTypeInfo.label}
          </div>
        </Badge>
      </div>

      {/* Available Models Component */}
      <AvailableModels userId={user.id} />
    </div>
  );
}

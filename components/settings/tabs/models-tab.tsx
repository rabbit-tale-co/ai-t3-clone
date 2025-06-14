'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/use-language';
import type { UserType as AuthUserType } from '@/app/(auth)/auth';

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

  const getUserTypeLabel = (userType: AuthUserType) => {
    switch (userType) {
      case 'guest':
        return t('subscription.plans.free');
      case 'regular':
        return t('subscription.plans.free');
      case 'pro':
        return t('subscription.plans.pro');
      case 'admin':
        return t('subscription.plans.pro');
      default:
        return t('subscription.plans.free');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-pink-900 dark:text-pink-100 mb-2">
          {t('settings.models.title')}
        </h2>
        <p className="text-pink-600 dark:text-pink-400">
          {t('settings.models.description')}
        </p>
      </div>

      {/* Available Models for User Type */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-pink-900 dark:text-pink-100">
          {t('settings.models.available')}
        </h3>
        <p className="text-sm text-pink-600 dark:text-pink-400 mb-4">
          {t('settings.models.forPlan')}{' '}
          <Badge
            variant="outline"
            className="border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400"
          >
            {getUserTypeLabel(user.type)}
          </Badge>
        </p>

        <div className="space-y-3">
          {entitlements.availableChatModelIds.map((modelId: string) => (
            <div
              key={modelId}
              className="border border-pink-200/50 dark:border-pink-800/30 rounded-lg p-4 bg-white/50 dark:bg-black/30"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-pink-900 dark:text-pink-100">
                  {modelId}
                </h4>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                  {t('settings.models.available')}
                </Badge>
              </div>
              <p className="text-sm text-pink-600 dark:text-pink-400">
                {modelId.includes('gemini') &&
                  t('settings.models.geminiDescription')}
                {modelId.includes('gpt') && t('settings.models.gptDescription')}
                {modelId.includes('claude') &&
                  t('settings.models.claudeDescription')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

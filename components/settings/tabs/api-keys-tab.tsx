'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Key, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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

interface ApiKeysTabProps {
  user: UserData;
}

export function ApiKeysTab({ user }: ApiKeysTabProps) {
  const { t } = useLanguage();

  const apiKeysSchema = z.object({
    openaiKey: z.string().optional(),
    anthropicKey: z.string().optional(),
  });

  const apiKeysForm = useForm<z.infer<typeof apiKeysSchema>>({
    resolver: zodResolver(apiKeysSchema),
    defaultValues: {
      openaiKey: '',
      anthropicKey: '',
    },
  });

  const onApiKeysSubmit = (data: z.infer<typeof apiKeysSchema>) => {
    // Note: This would save to user's personal API keys storage
    toast.success(t('settings.apiKeys.successMessages.apiKeysSaved'));
    console.log('User API Keys (would be encrypted):', data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-pink-900 dark:text-pink-100 mb-2">
          {t('settings.apiKeys.title')}
        </h2>
        <p className="text-pink-600 dark:text-pink-400">
          {t('settings.apiKeys.description')}
        </p>
      </div>

      {user.type === 'guest' || user.type === 'pro' ? (
        <div className="text-center py-12">
          <div className="size-16 mx-auto mb-4 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
            <Key size={24} className="text-pink-600 dark:text-pink-400" />
          </div>
          <h3 className="text-lg font-semibold text-pink-900 dark:text-pink-100 mb-2">
            {t('subscription.plans.pro')}
          </h3>
          <p className="text-pink-600 dark:text-pink-400 mb-6 max-w-md mx-auto">
            {t('settings.apiKeys.upgradeToProApiKeys')}
          </p>
          <Button className="bg-pink-600 hover:bg-pink-700 text-white">
            {t('ui.buttons.upgradeToPro')}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <Alert className="border-pink-200 dark:border-pink-800 bg-pink-50/50 dark:bg-pink-950/20">
            <Key size={16} className="text-pink-600 dark:text-pink-400" />
            <AlertDescription className="text-pink-800 dark:text-pink-200">
              {t('settings.apiKeys.secure')}
            </AlertDescription>
          </Alert>

          <Form {...apiKeysForm}>
            <form
              onSubmit={apiKeysForm.handleSubmit(onApiKeysSubmit)}
              className="space-y-6"
            >
              {/* OpenAI */}
              <div className="border border-pink-200/50 dark:border-pink-800/30 rounded-lg p-4 bg-white/50 dark:bg-black/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <MessageCircle
                      size={16}
                      className="text-green-600 dark:text-green-400"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-pink-900 dark:text-pink-100">
                      OpenAI
                    </h3>
                    <p className="text-sm text-pink-600 dark:text-pink-400">
                      {t('providers.openai.description')}
                    </p>
                  </div>
                </div>
                <FormField
                  control={apiKeysForm.control}
                  name="openaiKey"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-pink-800 dark:text-pink-200">
                        {t('api.keys.title')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="sk-..."
                          className="border-pink-200 dark:border-pink-800/50 bg-white/80 dark:bg-black/50 text-pink-900 dark:text-pink-100 placeholder:text-pink-500 dark:placeholder:text-pink-400 focus:border-pink-400 dark:focus:border-pink-600"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Anthropic */}
              <div className="border border-pink-200/50 dark:border-pink-800/30 rounded-lg p-4 bg-white/50 dark:bg-black/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <MessageCircle
                      size={16}
                      className="text-orange-600 dark:text-orange-400"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-pink-900 dark:text-pink-100">
                      Anthropic
                    </h3>
                    <p className="text-sm text-pink-600 dark:text-pink-400">
                      {t('providers.anthropic.description')}
                    </p>
                  </div>
                </div>
                <FormField
                  control={apiKeysForm.control}
                  name="anthropicKey"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-pink-800 dark:text-pink-200">
                        {t('api.keys.title')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="sk-ant-..."
                          className="border-pink-200 dark:border-pink-800/50 bg-white/80 dark:bg-black/50 text-pink-900 dark:text-pink-100 placeholder:text-pink-500 dark:placeholder:text-pink-400 focus:border-pink-400 dark:focus:border-pink-600"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                {t('ui.buttons.save')}
              </Button>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}

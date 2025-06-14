'use client';

import * as React from 'react';
import { MessageCircle, Settings, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';
import type { UserType as AuthUserType } from '@/app/(auth)/auth';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  is_premium: boolean;
  type: AuthUserType;
}

interface AccountTabProps {
  user: UserData;
}

export function AccountTab({ user }: AccountTabProps) {
  const { t } = useLanguage();

  // Validation schema with i18n
  const profileSchema = z.object({
    fullName: z
      .string()
      .min(2, t('validation.errors.nameMinLength'))
      .max(50, t('validation.errors.nameTooLong')),
    email: z.string().email(t('validation.errors.invalidEmail')),
  });

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.full_name || '',
      email: user?.email || '',
    },
  });

  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    toast.success(t('toast.settings.profile.profileUpdated'), {
      description: `${t('settings.profile.name')}: ${data.fullName}, ${t('settings.profile.email')}: ${data.email}`,
    });
  };

  return (
    <div className="space-y-8">
      {/* User Information Section */}
      <div>
        <h2 className="text-xl font-semibold text-pink-900 dark:text-pink-100 mb-2">
          {t('settings.profile.title')}
        </h2>
        <p className="text-pink-600 dark:text-pink-400 mb-6">
          {t('settings.profile.description')}
        </p>

        <Form {...profileForm}>
          <form
            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={profileForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="gap-2">
                    <FormLabel className="text-pink-800 dark:text-pink-200">
                      {t('settings.profile.fullName')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-pink-200 dark:border-pink-800/50 bg-white/80 dark:bg-black/50 text-pink-900 dark:text-pink-100 placeholder:text-pink-500 dark:placeholder:text-pink-400 focus:border-pink-400 dark:focus:border-pink-600"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="gap-2">
                    <FormLabel className="text-pink-800 dark:text-pink-200">
                      {t('settings.profile.email')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        className="border-pink-200 dark:border-pink-800/50 bg-white/80 dark:bg-black/50 text-pink-900 dark:text-pink-100 placeholder:text-pink-500 dark:placeholder:text-pink-400 focus:border-pink-400 dark:focus:border-pink-600"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Avatar Upload */}
            <div className="space-y-3">
              <FormLabel className="text-pink-800 dark:text-pink-200">
                {t('settings.profile.avatar')}
              </FormLabel>
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {user?.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                  >
                    {t('settings.profile.changeAvatar')}
                  </Button>
                  <p className="text-xs text-pink-500 dark:text-pink-400">
                    {t('settings.profile.avatarDescription')}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Created */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <FormLabel className="text-pink-800 dark:text-pink-200">
                  {t('settings.profile.accountCreated')}
                </FormLabel>
                <Input
                  value={new Date().toLocaleDateString()}
                  disabled
                  className="bg-pink-50/50 dark:bg-pink-900/20 border-pink-200/50 dark:border-pink-800/30 text-pink-700 dark:text-pink-300"
                />
              </div>
              <div className="space-y-3">
                <FormLabel className="text-pink-800 dark:text-pink-200">
                  {t('settings.profile.lastUpdated')}
                </FormLabel>
                <Input
                  value={new Date().toLocaleDateString()}
                  disabled
                  className="bg-pink-50/50 dark:bg-pink-900/20 border-pink-200/50 dark:border-pink-800/30 text-pink-700 dark:text-pink-300"
                />
              </div>
            </div> */}

            <Button
              type="submit"
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              {t('ui.buttons.saveChanges')}
            </Button>
          </form>
        </Form>
      </div>

      {/* Upgrade to Pro Section */}
      {user.type !== 'pro' && user.type !== 'admin' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-pink-900 dark:text-pink-100">
              {t('settings.profile.upgradeToPro')}
            </h2>
            <div className="text-right">
              <span className="text-3xl font-bold text-pink-900 dark:text-pink-100">
                $8
              </span>
              <span className="text-pink-600 dark:text-pink-400">
                /{t('settings.profile.perMonth')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Access to All Models */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="size-8 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                  <MessageCircle className="size-4 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="font-semibold text-pink-900 dark:text-pink-100">
                  {t('settings.profile.card.accessToAllModels.title')}
                </h3>
              </div>
              <p className="text-sm text-pink-600 dark:text-pink-400">
                {t('settings.profile.card.accessToAllModels.description')}
              </p>
            </div>

            {/* Generous Limits */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="size-8 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                  <Settings className="size-4 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="font-semibold text-pink-900 dark:text-pink-100">
                  {t('settings.profile.card.generousLimits.title')}
                </h3>
              </div>
              <p className="text-sm text-pink-600 dark:text-pink-400">
                {t('settings.profile.card.generousLimits.description')}
              </p>
            </div>

            {/* Priority Support */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="size-8 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                  <Users className="size-4 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="font-semibold text-pink-900 dark:text-pink-100">
                  {t('settings.profile.card.prioritySupport.title')}
                </h3>
              </div>
              <p className="text-sm text-pink-600 dark:text-pink-400">
                {t('settings.profile.card.prioritySupport.description')}
              </p>
            </div>
          </div>

          <Button className="mb-4 bg-pink-600 hover:bg-pink-700 text-white">
            {t('ui.buttons.upgradeNow')}
          </Button>

          <p className="text-xs text-muted-foreground/50">
            {t('settings.profile.premiumCreditsNote')}
          </p>
        </div>
      )}

      {/* Danger Zone */}
      <div>
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
          {t('settings.dangerZone.title')}
        </h2>
        <p className="text-pink-600 dark:text-pink-400 mb-6">
          {t('settings.dangerZone.description')}
        </p>
        {/* TODO: make dialog confirmation */}
        <Button
          variant="destructive"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {t('settings.dangerZone.deleteAccount')}
        </Button>
      </div>
    </div>
  );
}

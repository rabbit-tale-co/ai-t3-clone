'use client';

import * as React from 'react';
import { MessageCircle, Settings, Users, LoaderIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/use-language';
import type { UserType as AuthUserType } from '@/app/(auth)/auth';

import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  updateProfile,
  type UpdateProfileActionState,
  revalidateUserData,
} from '@/app/(auth)/actions';

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

function SubmitButton({ t }: { t: any }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : t('ui.buttons.saveChanges')}
    </Button>
  );
}

export function AccountTab({ user }: AccountTabProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatar_url || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [state, formAction] = useActionState<
    UpdateProfileActionState,
    FormData
  >(updateProfile, { status: 'idle' });

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type?.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setAvatarUrl(result.avatarUrl);
        toast.success('Avatar uploaded successfully!');
        // Revalidate user data to update all components
        const revalidateResult = await revalidateUserData();
        if (!revalidateResult.success) {
          console.error('Failed to revalidate:', revalidateResult.error);
        }
      } else {
        toast.error(result.error || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);

    try {
      const response = await fetch('/api/upload/avatar', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setAvatarUrl(`https://avatar.vercel.sh/${user?.email}`);
        toast.success('Avatar removed successfully!');
        // Revalidate user data to update all components
        const revalidateResult = await revalidateUserData();
        if (!revalidateResult.success) {
          console.error('Failed to revalidate:', revalidateResult.error);
        }
      } else {
        toast.error(result.error || 'Failed to remove avatar');
      }
    } catch (error) {
      console.error('Avatar removal error:', error);
      toast.error('Failed to remove avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Show toast messages based on state
  React.useEffect(() => {
    if (state.status === 'success') {
      toast.success(t('toast.settings.profile.profileUpdated'));
      // Revalidate user data to update all components
      revalidateUserData().then((result) => {
        if (!result.success) {
          console.error('Failed to revalidate:', result.error);
        }
      });
    } else if (state.status === 'failed') {
      toast.error('Failed to update profile', {
        description: state.error || 'Unknown error',
      });
    } else if (state.status === 'unauthorized') {
      toast.error('Unauthorized - please log in again');
    } else if (state.status === 'invalid_data') {
      toast.error('Invalid form data - please check your inputs');
    }
  }, [state, t, router]);

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

        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="fullName"
                className="text-sm font-medium text-pink-800 dark:text-pink-200"
              >
                {t('settings.profile.fullName')}
              </label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={user?.full_name || ''}
                required
                minLength={2}
                maxLength={50}
                className="border-pink-200 dark:border-pink-800/50 bg-white/80 dark:bg-black/50 text-pink-900 dark:text-pink-100 placeholder:text-pink-500 dark:placeholder:text-pink-400 focus:border-pink-400 dark:focus:border-pink-600"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-pink-800 dark:text-pink-200"
              >
                {t('settings.profile.email')}
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user?.email || ''}
                required
                className="border-pink-200 dark:border-pink-800/50 bg-white/80 dark:bg-black/50 text-pink-900 dark:text-pink-100 placeholder:text-pink-500 dark:placeholder:text-pink-400 focus:border-pink-400 dark:focus:border-pink-600"
              />
            </div>
          </div>

          {/* Avatar Upload */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-pink-800 dark:text-pink-200">
              {t('settings.profile.avatar')}
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarImage src={avatarUrl || user?.avatar_url} />
                <AvatarFallback className="text-lg">
                  {user?.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2 flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                  >
                    {isUploadingAvatar ? (
                      <>
                        <LoaderIcon className="size-3 mr-1.5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Upload Avatar'
                    )}
                  </Button>
                  {user?.avatar_url &&
                    !user.avatar_url.includes('avatar.vercel.sh') && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        disabled={isUploadingAvatar}
                        className="border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                      >
                        Remove Avatar
                      </Button>
                    )}
                </div>
                <p className="text-xs text-pink-500 dark:text-pink-400">
                  Upload an image file (max 5MB). Supported formats: JPG, PNG,
                  GIF, WebP.
                </p>
              </div>
            </div>
          </div>

          <SubmitButton t={t} />
        </form>
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

          <Button className="mb-4">{t('ui.buttons.upgradeNow')}</Button>

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

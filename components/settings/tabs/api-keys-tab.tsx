'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Key,
  Plus,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Shield,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import {
  saveApiKeyAction,
  getUserApiKeysAction,
  deleteApiKeyAction,
} from '@/app/(auth)/api-keys-actions';
import { cn } from '@/lib/utils';

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

interface SavedApiKey {
  id: string;
  provider: string;
  keyName: string;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date | null;
}

const providers = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models',
    color: 'bg-green-500',
    placeholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'google',
    name: 'Google',
    description: 'Gemini models',
    color: 'bg-blue-500',
    placeholder: 'AIza...',
    docsUrl: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models',
    color: 'bg-orange-500',
    placeholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'xai',
    name: 'xAI',
    description: 'Grok models',
    color: 'bg-purple-500',
    placeholder: 'xai-...',
    docsUrl: 'https://console.x.ai/',
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Fast inference',
    color: 'bg-red-500',
    placeholder: 'gsk_...',
    docsUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'cohere',
    name: 'Cohere',
    description: 'Command models',
    color: 'bg-indigo-500',
    placeholder: 'co_...',
    docsUrl: 'https://dashboard.cohere.com/api-keys',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    description: 'Mistral models',
    color: 'bg-yellow-500',
    placeholder: '...',
    docsUrl: 'https://console.mistral.ai/api-keys/',
  },
];

export function ApiKeysTab({ user }: ApiKeysTabProps) {
  const { t } = useLanguage();
  const [savedKeys, setSavedKeys] = useState<SavedApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const apiKeySchema = z.object({
    apiKey: z.string().min(1, 'API key is required'),
  });

  const form = useForm<z.infer<typeof apiKeySchema>>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      apiKey: '',
    },
  });

  // Fetch saved API keys
  useEffect(() => {
    const fetchKeys = async () => {
      if (user.type === 'guest' || user.type === 'pro') return;

      try {
        setLoading(true);
        const keys = await getUserApiKeysAction();
        setSavedKeys(keys);
      } catch (error) {
        console.error('Error fetching API keys:', error);
        toast.error('Failed to load API keys');
      } finally {
        setLoading(false);
      }
    };

    fetchKeys();
  }, [user.type]);

  const handleSaveKey = async (data: z.infer<typeof apiKeySchema>) => {
    if (!selectedProvider) return;

    const provider = providers.find((p) => p.id === selectedProvider);
    if (!provider) return;

    try {
      setSaving(true);

      await saveApiKeyAction({
        provider: selectedProvider as any,
        keyName: `${provider.name} API Key`,
        apiKey: data.apiKey,
      });

      // Refresh keys
      const keys = await getUserApiKeysAction();
      setSavedKeys(keys);

      // Reset form and close dialog
      form.reset();
      setSelectedProvider(null);
      setShowKey(false);

      toast.success(`${provider.name} API key saved successfully`);
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error('Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKey = async (provider: string) => {
    try {
      console.log('Deleting API key for provider:', provider);

      await deleteApiKeyAction({ provider: provider as any });
      console.log('Delete action completed');

      // Force refresh by refetching from server
      const fetchKeys = async () => {
        try {
          const keys = await getUserApiKeysAction();
          console.log('Refreshed keys after delete:', keys);
          setSavedKeys(keys);
        } catch (error) {
          console.error('Error refreshing keys:', error);
        }
      };

      await fetchKeys();

      const providerName =
        providers.find((p) => p.id === provider)?.name || provider;
      toast.success(`${providerName} API key deleted`);
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  const getProviderStatus = (providerId: string) => {
    const savedKey = savedKeys.find((key) => key.provider === providerId);
    return {
      hasSavedKey: !!savedKey,
      isActive: savedKey?.isActive || false,
      lastUsed: savedKey?.lastUsedAt,
    };
  };

  if (user.type === 'guest' || user.type === 'pro') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-pink-900 dark:text-pink-100 mb-2">
            API Keys
          </h2>
          <p className="text-pink-600 dark:text-pink-400">
            Manage your AI provider API keys for enhanced access
          </p>
        </div>

        <div className="text-center py-12">
          <div className="size-16 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center">
            <Key size={24} className="text-white" />
          </div>
          <h3 className="text-lg font-semibold text-pink-900 dark:text-pink-100 mb-2">
            Premium Feature
          </h3>
          <p className="text-pink-600 dark:text-pink-400 mb-6 max-w-md mx-auto">
            Upgrade to Premium to add your own API keys and access all AI models
          </p>
          <Button className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white shadow-lg">
            <Sparkles className="size-4 mr-2" />
            Upgrade to Premium
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-pink-900 dark:text-pink-100 mb-2">
            API Keys
          </h2>
          <p className="text-pink-600 dark:text-pink-400">
            Add your API keys to access models from different providers
          </p>
        </div>

        <Alert className="border-pink-200 dark:border-pink-800 bg-pink-50/50 dark:bg-pink-950/20">
          <Shield size={16} className="text-pink-600 dark:text-pink-400" />
          <AlertDescription className="text-pink-800 dark:text-pink-200">
            Your API keys are encrypted and stored securely. They&apos;re only
            used to make requests to AI providers.
          </AlertDescription>
        </Alert>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <Card key={provider.id} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => {
              const status = getProviderStatus(provider.id);

              return (
                <Card
                  key={provider.id}
                  className={cn(
                    'py-0 transition-all duration-200 hover:shadow-md border-pink-200/50 dark:border-pink-800/30',
                    status.hasSavedKey
                      ? 'bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-950/20 dark:to-pink-900/10 border-pink-300 dark:border-pink-700'
                      : 'bg-white/50 dark:bg-black/30 hover:bg-pink-50/50 dark:hover:bg-pink-950/20',
                  )}
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={cn(
                          'size-10 rounded-lg flex items-center justify-center text-white',
                          provider.color,
                        )}
                      >
                        <Key className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-pink-900 dark:text-pink-100 truncate">
                            {provider.name}
                          </h3>
                          {status.hasSavedKey && (
                            <Badge className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-0 text-xs">
                              <Check className="size-3 mr-1" />
                              Saved
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-pink-600 dark:text-pink-400 truncate">
                          {provider.description}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    {status.hasSavedKey ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-pink-700 dark:text-pink-300">
                          <span className="flex items-center gap-1">
                            <Check className="size-3" />
                            API key configured
                          </span>
                          {status.lastUsed && (
                            <span>
                              Used{' '}
                              {new Date(status.lastUsed).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteKey(provider.id)}
                            className="flex-1 h-8 text-xs border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/20"
                          >
                            <Trash2 className="size-3 mr-1" />
                            Remove
                          </Button>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(provider.docsUrl, '_blank')
                                }
                                className="h-8 px-2 border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/20"
                              >
                                <ExternalLink className="size-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View API docs</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center text-xs text-pink-600 dark:text-pink-400">
                          <AlertCircle className="size-3 mr-1" />
                          No API key configured
                        </div>
                        <div className="flex gap-2">
                          <Dialog
                            open={selectedProvider === provider.id}
                            onOpenChange={(open) => {
                              if (!open) {
                                setSelectedProvider(null);
                                form.reset();
                                setShowKey(false);
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedProvider(provider.id)}
                                className="flex-1"
                              >
                                <Plus className="size-3 mr-1" />
                                Add Key
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      'size-8 rounded-lg flex items-center justify-center text-white',
                                      provider.color,
                                    )}
                                  >
                                    <Key className="size-4" />
                                  </div>
                                  Add {provider.name} API Key
                                </DialogTitle>
                              </DialogHeader>
                              <Form {...form}>
                                <form
                                  onSubmit={form.handleSubmit(handleSaveKey)}
                                  className="space-y-4"
                                >
                                  <FormField
                                    control={form.control}
                                    name="apiKey"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>API Key</FormLabel>
                                        <FormControl>
                                          <div className="relative">
                                            <Input
                                              {...field}
                                              type={
                                                showKey ? 'text' : 'password'
                                              }
                                              placeholder={provider.placeholder}
                                              className="pr-10"
                                            />
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                setShowKey(!showKey)
                                              }
                                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                            >
                                              {showKey ? (
                                                <EyeOff className="size-4" />
                                              ) : (
                                                <Eye className="size-4" />
                                              )}
                                            </Button>
                                          </div>
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() =>
                                        window.open(provider.docsUrl, '_blank')
                                      }
                                      className="flex-1"
                                    >
                                      <ExternalLink className="size-4 mr-2" />
                                      Get API Key
                                    </Button>
                                    <Button
                                      type="submit"
                                      className="flex-1"
                                      disabled={saving}
                                    >
                                      {saving ? (
                                        <>
                                          <div className="size-4 mr-2 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                          Saving...
                                        </>
                                      ) : (
                                        'Save Key'
                                      )}
                                    </Button>
                                  </div>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(provider.docsUrl, '_blank')
                                }
                                className="h-8 px-2 border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/20"
                              >
                                <ExternalLink className="size-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View API docs</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {!loading && (
          <div className="flex items-center justify-between p-4 bg-pink-50/50 dark:bg-pink-950/20 rounded-lg border border-pink-200/50 dark:border-pink-800/30">
            <div className="flex items-center gap-2 text-sm text-pink-700 dark:text-pink-300">
              <Key className="size-4" />
              <span>
                {savedKeys.length} of {providers.length} providers configured
              </span>
            </div>
            <Badge className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-0">
              {savedKeys.filter((key) => key.isActive).length} active
            </Badge>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

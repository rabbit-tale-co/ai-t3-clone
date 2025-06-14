'use client';

import React from 'react';
import { Hash, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, getReadableBorderColor } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import type { Tag } from '@/lib/db/schema';
import type { UserType } from '@/app/(auth)/auth';
import { getUserEntitlements } from '@/lib/ai/entitlements';
import Color from 'colorjs.io';

interface SidebarThread {
  id: string;
  title: string;
  createdAt: string;
  folderId: string | null;
  tags?: Array<{
    id: string;
    label: string;
    color: string;
    userId: string;
  }>;
}

interface ManageTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: Tag[];
  allThreads: SidebarThread[];
  newTagName: string;
  setNewTagName: (name: string) => void;
  newTagColor: string;
  setNewTagColor: (color: string) => void;
  onCreateTag: () => void;
  onDeleteTag: (tagId: string, tagLabel: string) => void;
  isCreating?: boolean;
  userType: UserType;
  colorAccents: Record<
    string,
    {
      light: string;
      dark: string;
      border: string;
      accent: string;
    }
  >;
}

function getColorjsContrastTextColor(
  backgroundColor: string,
  minContrast = 60,
): string {
  const bg = new Color(backgroundColor);
  const black = new Color('#000');
  const white = new Color('#fff');
  const blackLc = black.contrast(bg, 'APCA');
  const whiteLc = white.contrast(bg, 'APCA');
  if (
    Math.abs(blackLc) >= minContrast &&
    Math.abs(blackLc) >= Math.abs(whiteLc)
  ) {
    return '#000000';
  }
  if (Math.abs(whiteLc) >= minContrast) {
    return '#FFFFFF';
  }
  return Math.abs(blackLc) > Math.abs(whiteLc) ? '#000000' : '#FFFFFF';
}

// Przyciemnia kolor o podany procent (0-1, np. 0.2 = 20% ciemniej)
function darkenColor(hex: string, amount = 0.18) {
  try {
    const color = new Color(hex);
    color.oklch.l = Math.max(0, color.oklch.l - color.oklch.l * amount);
    return color.to('srgb').toString({ format: 'hex' });
  } catch {
    return hex;
  }
}

export function ManageTagsDialog({
  open,
  onOpenChange,
  tags,
  allThreads,
  newTagName,
  setNewTagName,
  newTagColor,
  setNewTagColor,
  onCreateTag,
  onDeleteTag,
  isCreating = false,
  userType,
  colorAccents,
}: ManageTagsDialogProps) {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:min-w-5xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-pink-50/95 to-pink-100/80 dark:from-black/98 dark:to-pink-950/30 border-pink-200/60 dark:border-pink-900/40 backdrop-blur-xl rounded-2xl">
        <DialogHeader className="pb-4 sm:pb-6 border-b border-pink-200/50 dark:border-pink-900/30">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-pink-900 dark:text-gray-100 flex items-center gap-3">
                  <Hash className="size-5" />
                  {t('tags.manageTags')}
                </h2>
                <p className="text-xs sm:text-sm text-pink-600 dark:text-pink-400 mt-0.5">
                  {t('tags.categorizeConversations')}
                </p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full max-h-[calc(95vh-120px)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-6">
            {/* Tag Cloud - Left 3/4 */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-pink-900 dark:text-pink-100">
                  {t('tags.yourTags')}
                </h3>
                <span className="text-sm text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/30 px-2 py-1 rounded-full">
                  {t('tags.tagCount', { count: tags.length })}
                </span>
              </div>

              {tags.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto">
                  <div className="flex flex-wrap gap-3 py-2 px-px">
                    {tags.map((tag) => {
                      const taggedChats = allThreads.filter((t) =>
                        t.tags?.some((chatTag: any) => chatTag.id === tag.id),
                      );
                      const recentTaggedChat = taggedChats.sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      )[0];

                      const textColor = getColorjsContrastTextColor(
                        colorAccents[tag.color as keyof typeof colorAccents]
                          ?.accent || '#6B7280',
                      );

                      return (
                        <div
                          key={tag.id}
                          className="group relative p-3 rounded-lg bg-white/80 dark:bg-black/50 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-colors min-w-[160px] border border-pink-200/30 dark:border-pink-800/30"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="size-6 rounded flex items-center justify-center"
                                style={{
                                  backgroundColor:
                                    colorAccents[
                                      tag.color as keyof typeof colorAccents
                                    ]?.accent || '#6B7280',
                                }}
                              >
                                <Hash
                                  className="size-3"
                                  style={{ color: textColor }}
                                />
                              </div>
                              <h4 className="text-sm font-medium text-pink-900 dark:text-pink-100">
                                {tag.label}
                              </h4>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteTag(tag.id, tag.label)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 size-5 p-0 rounded"
                            >
                              <X size={12} />
                            </Button>
                          </div>

                          <div className="text-xs text-pink-600 dark:text-pink-400">
                            {t('tags.chatCount', { count: taggedChats.length })}
                            {recentTaggedChat && (
                              <span className="ml-2">
                                •{' '}
                                {new Date(
                                  recentTaggedChat.createdAt,
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 px-6">
                  <div className="size-16 mx-auto mb-4 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                    <Hash className="size-8 text-pink-500 dark:text-pink-400" />
                  </div>
                  <h3 className="text-lg font-medium text-pink-900 dark:text-pink-100 mb-2">
                    {t('tags.noTagsYet')}
                  </h3>
                  <p className="text-sm text-pink-600 dark:text-pink-400">
                    {t('tags.createFirstTag')}
                  </p>
                </div>
              )}
            </div>

            {/* Create New Tag - Right 1/4 */}
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-pink-50/50 dark:bg-black/30 border border-pink-200/50 dark:border-pink-800/30">
                <h3 className="font-medium mb-4 text-pink-900 dark:text-pink-100">
                  {t('tags.createNewTag')}
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="tagName"
                      className="text-pink-800 dark:text-pink-200"
                    >
                      {t('tags.tagName')}
                    </Label>
                    <Input
                      id="tagName"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder={t('tags.tagNamePlaceholder')}
                      className="border-pink-200 dark:border-pink-800/50 bg-white/80 dark:bg-black/50 text-pink-900 dark:text-pink-100 placeholder:text-pink-500 dark:placeholder:text-pink-400 focus:border-pink-400 dark:focus:border-pink-600"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-pink-800 dark:text-pink-200">
                      {t('tags.colorTheme')}
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(colorAccents).map(([color, values]) => {
                        const textColor = getColorjsContrastTextColor(
                          values.accent,
                        );

                        return (
                          <Button
                            key={color}
                            variant="ghost"
                            size={'sm'}
                            style={{
                              backgroundColor: values.accent,
                              boxShadow:
                                color === newTagColor
                                  ? `0 0 0 2px ${darkenColor(values.accent, 0.18)}`
                                  : undefined,
                              transition: 'box-shadow 0.2s, background 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                darkenColor(values.accent, 0.18);
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                values.accent;
                            }}
                            onClick={() => setNewTagColor(color)}
                          >
                            <span
                              className="text-xs capitalize font-medium"
                              style={{ color: textColor }}
                            >
                              {color}
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    onClick={onCreateTag}
                    disabled={
                      !newTagName.trim() ||
                      isCreating ||
                      (() => {
                        const entitlements = getUserEntitlements(userType);
                        return (
                          entitlements.maxTags !== -1 &&
                          tags.length >= entitlements.maxTags
                        );
                      })()
                    }
                    className="w-full bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Hash className="size-4 mr-2" />
                    {isCreating
                      ? t('tags.saving')
                      : (() => {
                          const entitlements = getUserEntitlements(userType);
                          if (
                            entitlements.maxTags !== -1 &&
                            tags.length >= entitlements.maxTags
                          ) {
                            return t('tags.limitReached');
                          }
                          return t('tags.createTag');
                        })()}
                  </Button>
                </div>
              </div>

              {/* Tag Stats */}
              <div className="p-4 rounded-xl bg-pink-50/50 dark:bg-black/30 border border-pink-200/50 dark:border-pink-800/30">
                <h4 className="text-sm font-medium text-pink-900 dark:text-pink-100 mb-3">
                  {t('tags.tagStatistics')}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-pink-600 dark:text-pink-400">
                      {t('tags.tagsUsed')}:
                    </span>
                    <span className="font-medium text-pink-900 dark:text-pink-100">
                      {tags.length}
                      {(() => {
                        const entitlements = getUserEntitlements(userType);
                        return entitlements.maxTags === -1
                          ? ''
                          : ` / ${entitlements.maxTags}`;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pink-600 dark:text-pink-400">
                      {t('tags.taggedChats')}:
                    </span>
                    <span className="font-medium text-pink-900 dark:text-pink-100">
                      {
                        allThreads.filter((t) => t.tags && t.tags.length > 0)
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pink-600 dark:text-pink-400">
                      {t('tags.untaggedChats')}:
                    </span>
                    <span className="font-medium text-pink-900 dark:text-pink-100">
                      {
                        allThreads.filter((t) => !t.tags || t.tags.length === 0)
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pink-600 dark:text-pink-400">
                      {t('tags.avgTagsPerChat')}:
                    </span>
                    <span className="font-medium text-pink-900 dark:text-pink-100">
                      {allThreads.length > 0
                        ? (
                            allThreads.reduce(
                              (acc, t) => acc + (t.tags?.length || 0),
                              0,
                            ) / allThreads.length
                          ).toFixed(1)
                        : '0.0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-6 border-t border-pink-200/50 dark:border-pink-900/30">
          <Button
            variant="outline"
            onClick={() => {
              setNewTagName('');
              setNewTagColor('gray');
              onOpenChange(false);
            }}
            className="border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
          >
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

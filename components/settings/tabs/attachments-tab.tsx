'use client';

import * as React from 'react';
import { FileText, Settings, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/hooks/use-language';

export function AttachmentsTab() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-pink-900 dark:text-pink-100 mb-2">
          {t('settings.attachments.title')}
        </h2>
        <p className="text-pink-600 dark:text-pink-400">
          {t('settings.attachments.description')}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-pink-50/50 dark:bg-pink-900/20 border border-pink-200/50 dark:border-pink-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-pink-600 dark:text-pink-400" />
            <h3 className="font-semibold text-pink-900 dark:text-pink-100">
              {t('settings.attachments.sent')}
            </h3>
          </div>
          <p className="text-2xl font-bold text-pink-900 dark:text-pink-100">
            24
          </p>
        </div>
        <div className="bg-pink-50/50 dark:bg-pink-900/20 border border-pink-200/50 dark:border-pink-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings size={16} className="text-pink-600 dark:text-pink-400" />
            <h3 className="font-semibold text-pink-900 dark:text-pink-100">
              {t('settings.attachments.totalSize')}
            </h3>
          </div>
          <p className="text-2xl font-bold text-pink-900 dark:text-pink-100">
            156 MB
          </p>
        </div>
        <div className="bg-pink-50/50 dark:bg-pink-900/20 border border-pink-200/50 dark:border-pink-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <History size={16} className="text-pink-600 dark:text-pink-400" />
            <h3 className="font-semibold text-pink-900 dark:text-pink-100">
              {t('settings.attachments.lastUpload')}
            </h3>
          </div>
          <p className="text-2xl font-bold text-pink-900 dark:text-pink-100">
            7 days
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder={t('settings.attachments.searchFiles')}
            className="border-pink-200 dark:border-pink-800/50 bg-white/80 dark:bg-black/50 text-pink-900 dark:text-pink-100 placeholder:text-pink-500 dark:placeholder:text-pink-400 focus:border-pink-400 dark:focus:border-pink-600"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
          >
            {t('settings.attachments.allTypes')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
          >
            {t('settings.attachments.images')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
          >
            {t('settings.attachments.documents')}
          </Button>
        </div>
      </div>

      {/* Files List */}
      <div className="space-y-3">
        {[
          {
            name: 'project-proposal.pdf',
            size: '2.4 MB',
            type: 'PDF',
            date: '2 days ago',
            chat: 'Business Planning Chat',
          },
          {
            name: 'screenshot.png',
            size: '1.2 MB',
            type: 'PNG',
            date: '5 days ago',
            chat: 'Design Review Chat',
          },
          {
            name: 'code-snippet.py',
            size: '15 KB',
            type: 'Python',
            date: '1 week ago',
            chat: 'Programming Help Chat',
          },
        ].map((file) => (
          <div
            key={`${file.name}-${new Date().getTime()}`}
            className="border border-pink-200/50 dark:border-pink-800/30 rounded-lg p-4 bg-white/50 dark:bg-black/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                  <FileText
                    size={20}
                    className="text-pink-600 dark:text-pink-400"
                  />
                </div>
                <div>
                  <h4 className="font-medium text-pink-900 dark:text-pink-100">
                    {file.name}
                  </h4>
                  <p className="text-sm text-pink-600 dark:text-pink-400">
                    {file.size} • {file.type} • {file.date}
                  </p>
                  <p className="text-xs text-pink-500 dark:text-pink-400">
                    {t('settings.attachments.from')}: {file.chat}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                >
                  {t('ui.buttons.download')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {t('ui.buttons.delete')}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center pt-4">
        <Button
          variant="outline"
          className="border-pink-200 dark:border-pink-800/50 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
        >
          {t('ui.buttons.loadMore')}
        </Button>
      </div>
    </div>
  );
}

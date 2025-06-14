import type { Attachment } from 'ai';

import { LoaderIcon } from 'lucide-react';

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
}: {
  attachment: Attachment;
  isUploading?: boolean;
}) => {
  const { name, url, contentType } = attachment;
  const isImage = contentType?.startsWith('image');

  if (isImage) {
    return (
      <div
        data-testid="input-attachment-preview"
        className="flex flex-col gap-2 max-w-md"
      >
        <div className="bg-muted rounded-3xl relative border border-pink-200 dark:border-pink-800 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={url}
            src={url}
            alt={name ?? 'An image attachment'}
            className="w-full h-auto object-contain max-h-96"
            style={{ maxWidth: '100%', height: 'auto' }}
          />

          {isUploading && (
            <div
              data-testid="input-attachment-loader"
              className="animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-pink-500 bg-white/80 dark:bg-black/80 rounded-full p-2"
            >
              <LoaderIcon />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Non-image files
  return (
    <div data-testid="input-attachment-preview" className="flex flex-col gap-2">
      <div className="w-20 h-16 bg-muted rounded-lg relative flex flex-col items-center justify-center border border-pink-200 dark:border-pink-800">
        <div className="text-xs text-pink-600 dark:text-pink-400 font-medium text-center p-2">
          {name?.split('.').pop()?.toUpperCase() || 'FILE'}
        </div>

        {isUploading && (
          <div
            data-testid="input-attachment-loader"
            className="animate-spin absolute text-pink-500"
          >
            <LoaderIcon />
          </div>
        )}
      </div>
      <div className="text-xs text-pink-600 dark:text-pink-400 max-w-20 truncate text-center">
        {name}
      </div>
    </div>
  );
};

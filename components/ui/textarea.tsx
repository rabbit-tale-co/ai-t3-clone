import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-pink-300 dark:border-pink-700/50 placeholder:text-pink-500 dark:placeholder:text-pink-400 focus-visible:border-pink-500 dark:focus-visible:border-pink-600 focus-visible:ring-pink-400/20 dark:focus-visible:ring-pink-600/20 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-400/20 aria-invalid:border-red-500 dark:aria-invalid:border-red-400 bg-pink-50/50 dark:bg-pink-950/30 text-pink-900 dark:text-pink-100 flex field-sizing-content min-h-16 w-full rounded-lg border px-3 py-2 text-base shadow-sm transition-[color,box-shadow,background-color] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...(props as any)}
    />
  );
}

export { Textarea };

import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-pink-900 dark:file:text-pink-100 placeholder:text-pink-500 dark:placeholder:text-pink-400 selection:bg-pink-500 selection:text-white bg-pink-50/50 dark:bg-pink-950/30 border-pink-300 dark:border-pink-700/50 text-pink-900 dark:text-pink-100 flex h-9 w-full min-w-0 rounded-lg border px-3 py-1 text-base shadow-sm transition-[color,box-shadow,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-pink-500 dark:focus-visible:border-pink-600 focus-visible:ring-pink-400/20 dark:focus-visible:ring-pink-600/20 focus-visible:ring-[3px]',
        'aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-400/20 aria-invalid:border-red-500 dark:aria-invalid:border-red-400',
        className,
      )}
      {...props}
    />
  );
}

export { Input };

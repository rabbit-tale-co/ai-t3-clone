'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-pink-50 group-[.toaster]:to-pink-100/90 dark:group-[.toaster]:from-pink-950/95 dark:group-[.toaster]:to-pink-900/70 group-[.toaster]:text-pink-900 dark:group-[.toaster]:text-pink-100 group-[.toaster]:border-pink-200 dark:group-[.toaster]:border-pink-800/60 group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-md',
          description:
            'group-[.toast]:text-pink-800 dark:group-[.toast]:text-pink-200',
          actionButton:
            'group-[.toast]:bg-pink-500 group-[.toast]:text-white dark:group-[.toast]:bg-pink-600 dark:group-[.toast]:text-white hover:group-[.toast]:bg-pink-600 dark:hover:group-[.toast]:bg-pink-700',
          cancelButton:
            'group-[.toast]:bg-pink-100 group-[.toast]:text-pink-800 dark:group-[.toast]:bg-pink-900/50 dark:group-[.toast]:text-pink-200 hover:group-[.toast]:bg-pink-200 dark:hover:group-[.toast]:bg-pink-900/70',
          closeButton:
            'group-[.toast]:bg-pink-100 group-[.toast]:text-pink-600 dark:group-[.toast]:bg-pink-900/50 dark:group-[.toast]:text-pink-400 group-[.toast]:border-pink-200 dark:group-[.toast]:border-pink-800/50 hover:group-[.toast]:bg-pink-200 dark:hover:group-[.toast]:bg-pink-900/70',
          success:
            'group-[.toast]:bg-gradient-to-br group-[.toast]:from-emerald-50 group-[.toast]:to-green-100/90 dark:group-[.toast]:from-emerald-950/95 dark:group-[.toast]:to-green-900/70 group-[.toast]:text-emerald-900 dark:group-[.toast]:text-emerald-100 group-[.toast]:border-emerald-200 dark:group-[.toast]:border-emerald-800/60',
          error:
            'group-[.toast]:bg-gradient-to-br group-[.toast]:from-red-50 group-[.toast]:to-rose-100/90 dark:group-[.toast]:from-red-950/95 dark:group-[.toast]:to-rose-900/70 group-[.toast]:text-red-900 dark:group-[.toast]:text-red-100 group-[.toast]:border-red-200 dark:group-[.toast]:border-red-800/60',
          warning:
            'group-[.toast]:bg-gradient-to-br group-[.toast]:from-orange-50 group-[.toast]:to-yellow-100/90 dark:group-[.toast]:from-orange-950/95 dark:group-[.toast]:to-yellow-900/70 group-[.toast]:text-orange-900 dark:group-[.toast]:text-orange-100 group-[.toast]:border-orange-200 dark:group-[.toast]:border-orange-800/60',
          info: 'group-[.toast]:bg-gradient-to-br group-[.toast]:from-sky-50 group-[.toast]:to-blue-100/90 dark:group-[.toast]:from-sky-950/95 dark:group-[.toast]:to-blue-900/70 group-[.toast]:text-sky-900 dark:group-[.toast]:text-sky-100 group-[.toast]:border-sky-200 dark:group-[.toast]:border-sky-800/60',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

'use client';

import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { toast as sonnerToast } from 'sonner';
import {
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconsByType: Record<'success' | 'error' | 'info' | 'warning', ReactNode> =
  {
    success: <CheckCircleIcon className="size-5" />,
    error: <AlertCircleIcon className="size-5" />,
    info: <InfoIcon className="size-5" />,
    warning: <AlertTriangleIcon className="size-5" />,
  };

export function toast(props: Omit<ToastProps, 'id'>) {
  return sonnerToast.custom((id) => (
    <Toast id={id} type={props.type} description={props.description} />
  ));
}

function Toast(props: ToastProps) {
  const { id, type, description } = props;

  const descriptionRef = useRef<HTMLDivElement>(null);
  const [multiLine, setMultiLine] = useState(false);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;

    const update = () => {
      const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight);
      const lines = Math.round(el.scrollHeight / lineHeight);
      setMultiLine(lines > 1);
    };

    update(); // initial check
    const ro = new ResizeObserver(update); // re-check on width changes
    ro.observe(el);

    return () => ro.disconnect();
  }, [description]);

  // Rich color schemes for each type
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          background:
            'bg-gradient-to-br from-emerald-50 to-green-100/90 dark:from-emerald-950/95 dark:to-green-900/70',
          border: 'border-emerald-200 dark:border-emerald-800/60',
          text: 'text-emerald-900 dark:text-emerald-100',
          icon: 'text-emerald-600 dark:text-emerald-400',
        };
      case 'error':
        return {
          background:
            'bg-gradient-to-br from-red-50 to-rose-100/90 dark:from-red-950/95 dark:to-rose-900/70',
          border: 'border-red-200 dark:border-red-800/60',
          text: 'text-red-900 dark:text-red-100',
          icon: 'text-red-600 dark:text-red-400',
        };
      case 'warning':
        return {
          background:
            'bg-gradient-to-br from-orange-50 to-yellow-100/90 dark:from-orange-950/95 dark:to-yellow-900/70',
          border: 'border-orange-200 dark:border-orange-800/60',
          text: 'text-orange-900 dark:text-orange-100',
          icon: 'text-orange-600 dark:text-orange-400',
        };
      case 'info':
        return {
          background:
            'bg-gradient-to-br from-sky-50 to-blue-100/90 dark:from-sky-950/95 dark:to-blue-900/70',
          border: 'border-sky-200 dark:border-sky-800/60',
          text: 'text-sky-900 dark:text-sky-100',
          icon: 'text-sky-600 dark:text-sky-400',
        };
      default:
        return {
          background:
            'bg-gradient-to-br from-pink-50 to-pink-100/90 dark:from-pink-950/95 dark:to-pink-900/70',
          border: 'border-pink-200 dark:border-pink-800/60',
          text: 'text-pink-900 dark:text-pink-100',
          icon: 'text-pink-600 dark:text-pink-400',
        };
    }
  };

  const styles = getTypeStyles(type);

  return (
    <div className="flex w-full toast-mobile:w-[356px] justify-center">
      <div
        data-testid="toast"
        key={id}
        className={cn(
          // Dynamic background and border based on type
          styles.background,
          styles.border,
          'border backdrop-blur-md shadow-lg',
          'p-4 rounded-xl w-full toast-mobile:w-fit flex flex-row gap-3',
          'transition-all duration-200 ease-in-out',
          'hover:shadow-xl hover:scale-[1.02]',
          multiLine ? 'items-start' : 'items-center',
        )}
      >
        <div
          data-type={type}
          className={cn(
            // Dynamic icon color based on type
            styles.icon,
            'flex-shrink-0',
            { 'pt-1': multiLine },
          )}
        >
          {iconsByType[type]}
        </div>
        <div
          ref={descriptionRef}
          className={cn(
            // Dynamic text color based on type
            styles.text,
            'text-sm font-medium leading-relaxed',
          )}
        >
          {description}
        </div>
      </div>
    </div>
  );
}

interface ToastProps {
  id: string | number;
  type: 'success' | 'error' | 'info' | 'warning';
  description: string;
}

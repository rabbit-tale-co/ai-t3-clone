'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...(props as any)}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn('[&_tr]:border-b', className)}
      {...(props as any)}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...(props as any)}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0',
        className,
      )}
      {...(props as any)}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
        className,
      )}
      {...(props as any)}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&:has([role=checkbox])]:pl-0 [&:has([role=checkbox])]:text-center [&:has([role=checkbox])]:flex [&:has([role=checkbox])]:items-center [&:has([role=checkbox])]:justify-end [&:has([data-slot=checkbox])]:pr-0 [&:has([data-slot=checkbox])]:pl-0 [&:has([data-slot=checkbox])]:text-center [&:has([data-slot=checkbox])]:flex [&:has([data-slot=checkbox])]:items-center [&:has([data-slot=checkbox])]:justify-end [&>[role=checkbox]]:!m-0 [&>[data-slot=checkbox]]:!m-0',
        className,
      )}
      {...(props as any)}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'p-2 h-10 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&:has([role=checkbox])]:pl-0 [&:has([role=checkbox])]:text-center [&:has([role=checkbox])]:flex [&:has([role=checkbox])]:items-center [&:has([role=checkbox])]:justify-end [&:has([data-slot=checkbox])]:pr-0 [&:has([data-slot=checkbox])]:pl-0 [&:has([data-slot=checkbox])]:text-center [&:has([data-slot=checkbox])]:flex [&:has([data-slot=checkbox])]:items-center [&:has([data-slot=checkbox])]:justify-end [&>[role=checkbox]]:!m-0 [&>[data-slot=checkbox]]:!m-0',
        className,
      )}
      {...(props as any)}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('text-muted-foreground mt-4 text-sm', className)}
      {...(props as any)}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};

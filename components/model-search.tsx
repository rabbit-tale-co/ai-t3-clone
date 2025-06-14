'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import type { Session } from 'next-auth';
import { Globe } from 'lucide-react';
import { toast } from 'sonner';

export function ModelSearch({
  session,
  className,
}: {
  session: Session | null | undefined;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);

  const userType = session?.user?.type || 'guest';

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          data-testid="model-selector"
          variant="ghost"
          className="md:px-2 md:h-[34px]"
          onClick={() => {
            if (userType !== 'pro') {
              toast.warning('Upgrade to Pro', {
                classNames: {
                  toast: 'bg-red-500 text-red-50',
                  title: 'text-white',
                  description: 'text-white',
                  loader: 'text-white',
                  closeButton: 'text-white',
                  cancelButton: 'text-white',
                  actionButton: 'text-white',
                  success: 'text-white',
                  error: 'text-white',
                  info: 'text-white',
                  warning: 'text-white',
                  loading: 'text-white',
                  default: 'text-white',
                  content: 'text-white',
                  icon: 'self-start pt-1',
                },
                icon: <Globe className="size-4 text-white" />,
                description: 'Get access to all models and features',
                action: {
                  label: 'Upgrade',
                  onClick: () => {
                    window.location.href = '/pricing';
                  },
                },
              });
            }
          }}
        >
          <Globe />
          Search
        </Button>
      </DropdownMenuTrigger>
      {/* <DropdownMenuContent align="start" className="min-w-[300px]">
        <DropdownMenuItem
          data-testid={`model-search`}
          onSelect={() => {
            setOpen(false);
          }}
          asChild
        >
          <Button
            type="button"
            className="gap-4 group/item flex flex-row justify-between items-center w-full"
            asChild
          >
            <div className="flex flex-col gap-1 items-start">
              <h4>Upgrade to Pro</h4>
              <span className="text-xs text-muted-foreground">
                Get access to all models and features
              </span>
            </div>
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent> */}
    </DropdownMenu>
  );
}

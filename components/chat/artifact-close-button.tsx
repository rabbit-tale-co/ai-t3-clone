import { memo } from 'react';
import { XIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { initialArtifactData, useArtifact } from '@/hooks/use-artifact';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

function PureArtifactCloseButton() {
  const { setArtifact } = useArtifact();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-testid="artifact-close-button"
          variant="outline"
          size="icon"
          className="size-8 border-pink-200/50 dark:border-pink-800/30 text-pink-700 dark:text-pink-300 hover:bg-pink-100/50 dark:hover:bg-pink-900/30 hover:border-pink-300 dark:hover:border-pink-700 backdrop-blur-sm"
          onClick={() => {
            setArtifact((currentArtifact) =>
              currentArtifact.status === 'streaming'
                ? {
                    ...currentArtifact,
                    isVisible: false,
                  }
                : { ...initialArtifactData, status: 'idle' },
            );
          }}
        >
          <XIcon size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="bg-pink-50 dark:bg-pink-950/90 border-pink-200 dark:border-pink-800/50 text-pink-700 dark:text-pink-300">
        Close artifact
      </TooltipContent>
    </Tooltip>
  );
}

export const ArtifactCloseButton = memo(PureArtifactCloseButton, () => true);

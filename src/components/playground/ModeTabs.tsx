'use client';

import { cn } from '@/lib/utils';
import { PlaygroundMode } from '@/lib/playground/mode-mapping';

const MODES: PlaygroundMode[] = ['t2i', 'i2i', 't2v', 'i2v'];

export function ModeTabs({ value, onChange }: { value: PlaygroundMode; onChange: (m: PlaygroundMode) => void }) {
  return (
    <div role="tablist" className="grid grid-cols-4 gap-0.5 p-0.5 rounded-xl bg-background/60 border border-border">
      {MODES.map((mode) => {
        const isActive = mode === value;
        return (
          <button
            key={mode}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(mode)}
            className={cn(
              'rounded-lg py-2 text-xs font-medium transition-colors',
              isActive ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {mode}
          </button>
        );
      })}
    </div>
  );
}

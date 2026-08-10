"use client";

import { getAspectRatioPresetsForModel } from '@/config/image-aspect-ratio-presets';
import { cn } from '@/lib/utils';

export function AspectRatioPills({
  modelId,
  value,
  onChange,
}: {
  modelId: string;
  value: string | null;
  onChange: (r: string) => void;
}) {
  const presets = getAspectRatioPresetsForModel(modelId);
  const ratios = Object.keys(presets);
  if (ratios.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {ratios.map((ratio) => {
        const active = value === ratio;
        return (
          <button
            key={ratio}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(ratio)}
            className={cn(
              'rounded-full border px-3 py-1 text-[11.5px] transition-colors',
              active
                ? 'border-primary bg-primary font-semibold text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground'
            )}
          >
            {ratio}
          </button>
        );
      })}
    </div>
  );
}

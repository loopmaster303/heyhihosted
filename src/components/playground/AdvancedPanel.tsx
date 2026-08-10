"use client";

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { unifiedModelConfigs } from '@/config/unified-model-configs';
import { cn } from '@/lib/utils';

type Vals = { seed: string; negativePrompt: string; guidance: string; steps: string };
type Field = keyof Vals;

/** Maps our state field to the input name the model config advertises. */
const API_NAME: Record<Field, string> = {
  seed: 'seed',
  negativePrompt: 'negative_prompt',
  guidance: 'guidance',
  steps: 'steps',
};

const LABEL: Record<Field, string> = {
  seed: 'Seed',
  negativePrompt: 'Negativ-Prompt',
  guidance: 'Guidance',
  steps: 'Schritte',
};

const PLACEHOLDER: Record<Field, string> = {
  seed: 'zufällig',
  negativePrompt: 'was nicht im Bild sein soll',
  guidance: '7.5',
  steps: '30',
};

export function AdvancedPanel({
  modelId,
  values,
  onChange,
}: {
  modelId: string;
  values: Vals;
  onChange: (patch: Partial<Vals>) => void;
}) {
  const [open, setOpen] = useState(false);
  const accepted = new Set((unifiedModelConfigs[modelId]?.inputs ?? []).map((i) => i.name));
  const fields = (Object.keys(API_NAME) as Field[]).filter((f) => accepted.has(API_NAME[f]));
  if (fields.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between border-t border-border py-2 text-[10px] font-semibold uppercase tracking-[0.11em] text-muted-foreground/75 transition-colors hover:text-foreground"
      >
        <span>Erweitert</span>
        <ChevronRight className={cn('h-3 w-3 transition-transform', open && 'rotate-90')} />
      </button>

      {open && (
        <div className="flex flex-col gap-2.5">
          {fields.map((field) => (
            <div key={field} className="flex flex-col gap-1">
              <label htmlFor={`adv-${field}`} className="text-[10.5px] text-muted-foreground">
                {LABEL[field]}
              </label>
              {field === 'negativePrompt' ? (
                <Textarea
                  id={`adv-${field}`}
                  rows={2}
                  value={values[field]}
                  placeholder={PLACEHOLDER[field]}
                  onChange={(e) => onChange({ [field]: e.target.value } as Partial<Vals>)}
                  className="resize-y text-xs"
                />
              ) : (
                <Input
                  id={`adv-${field}`}
                  type="number"
                  step={field === 'guidance' ? '0.5' : '1'}
                  value={values[field]}
                  placeholder={PLACEHOLDER[field]}
                  onChange={(e) => onChange({ [field]: e.target.value } as Partial<Vals>)}
                  className="h-8 text-xs"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

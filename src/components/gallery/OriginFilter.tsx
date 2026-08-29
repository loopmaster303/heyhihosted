"use client";

import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import type { AssetOrigin } from '@/lib/assets/asset-origin';

/**
 * Herkunftsumschalter. `value === undefined` heisst "alles".
 *
 * Der Zustand ist bewusst FLUECHTIG und wird vom Elternteil gehalten
 * (Entscheidung E5.2): L-D.1 und L-D.3 sind Reload-Kriterien und werden
 * mehrdeutig, sobald ein gemerkter Filter den Ausgangszustand verschiebt.
 * Deshalb hier kein localStorage.
 */
export interface OriginFilterProps {
  value: readonly AssetOrigin[] | undefined;
  onChange: (next: readonly AssetOrigin[] | undefined) => void;
  className?: string;
}

const CHOICES: { key: string; origins: readonly AssetOrigin[] | undefined; labelKey: string }[] = [
  { key: 'chat', origins: ['chat', 'compose'], labelKey: 'gallery.filterChat' },
  { key: 'create', origins: ['create'], labelKey: 'gallery.filterCreate' },
  { key: 'all', origins: undefined, labelKey: 'gallery.filterAll' },
];

function keyOf(value: readonly AssetOrigin[] | undefined): string {
  if (!value) return 'all';
  return value.includes('create') ? 'create' : 'chat';
}

export function OriginFilter({ value, onChange, className }: OriginFilterProps) {
  const { t } = useLanguage();
  const active = keyOf(value);

  return (
    <div
      role="radiogroup"
      aria-label={t('gallery.filterAll')}
      className={cn('flex items-center gap-0.5 rounded-lg border border-border/50 p-0.5', className)}
    >
      {CHOICES.map((c) => (
        <button
          key={c.key}
          type="button"
          role="radio"
          aria-checked={active === c.key}
          onClick={() => onChange(c.origins)}
          className={cn(
            'rounded-md px-2 py-0.5 font-mono text-[10.5px] lowercase transition-colors',
            active === c.key
              ? 'bg-primary/12 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t(c.labelKey)}
        </button>
      ))}
    </div>
  );
}

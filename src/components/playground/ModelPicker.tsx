'use client';

import { useMemo } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/components/LanguageProvider';
import { useHasPrunaKey } from '@/hooks/useHasPrunaKey';
import { isModelInMode, type PlaygroundMode } from '@/lib/playground/mode-mapping';
import type { PlaygroundModelEntry } from '@/lib/playground/model-source';
import { getUnifiedModel } from '@/config/unified-image-models';

interface Props {
  entries: PlaygroundModelEntry[];
  mode: PlaygroundMode;
  value: string | null;
  onChange: (id: string) => void;
  loading: boolean;
  fallbackActive: boolean;
}

function entryIsFree(entry: PlaygroundModelEntry): boolean {
  // The registry states paid_only per model, so it decides for Pollinations —
  // the local config drifts and mislabelled paid models as free. Pruna has no
  // registry and always needs a key.
  if (entry.provider === 'pollinations') return !entry.paidOnly;
  return getUnifiedModel(entry.id)?.isFree === true;
}

export function ModelPicker({ entries, mode, value, onChange, loading, fallbackActive }: Props) {
  const { t } = useLanguage();
  const hasPrunaKey = useHasPrunaKey();

  const filtered = useMemo(() => entries.filter((entry) => isModelInMode(entry, mode)), [entries, mode]);
  const current = filtered.find((entry) => entry.id === value);

  const freeModels = useMemo(() => filtered.filter((entry) => entryIsFree(entry)), [filtered]);
  const keyModels = useMemo(() => filtered.filter((entry) => !entryIsFree(entry)), [filtered]);

  const currentIsFree = current ? entryIsFree(current) : false;
  // Pruna-Hinweis: Der aktuelle Eintrag laeuft ueber Pruna, aber es ist kein
  // eigener Schluessel hinterlegt. Pruna ist BYOP-only (2026-08-28).
  const showPrunaHint = current?.provider === 'pruna' && !hasPrunaKey;

  // An empty list means different things per provider: Pruna is key-gated as a
  // whole, while Pollinations just has nothing matching this mode. Never show
  // the Pruna wording while Pollinations is the active provider.
  const emptyLabel =
    entries.length === 0 ? 'Keine Modelle verfügbar' : 'Kein Modell für diesen Modus';

  return (
    <div className="flex flex-col gap-2">
      {fallbackActive && (
        <div className="text-[11px] text-muted-foreground bg-muted rounded-md px-2 py-1">
          {t('playground.fallbackNotice')}
        </div>
      )}

      {showPrunaHint && (
        <div className="text-[11px] text-muted-foreground bg-muted rounded-md px-2 py-1">
          {t('playground.prunaEmpty')}
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-auto min-h-11 py-2.5 text-[12.5px] md:min-h-0"
            disabled={loading || filtered.length === 0}
          >
            <span>{current?.name ?? (loading ? 'Lädt…' : emptyLabel)}</span>
            <span className="flex-1" />
            {current && <Badge variant="secondary">{currentIsFree ? 'frei' : 'Key'}</Badge>}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-[260px] overflow-y-auto">
          {freeModels.length > 0 && (
            <>
              <DropdownMenuLabel>Frei</DropdownMenuLabel>
              {freeModels.map((entry) => (
                <DropdownMenuItem
                  key={entry.id}
                  onSelect={() => onChange(entry.id)}
                  className={cn('min-h-11 md:min-h-0', entry.id === value && 'bg-accent')}
                >
                  <span>{entry.name}</span>
                  <span className="flex-1" />
                  {entry.id === value && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </>
          )}

          {keyModels.length > 0 && (
            <>
              <DropdownMenuLabel>Key nötig</DropdownMenuLabel>
              {keyModels.map((entry) => (
                <DropdownMenuItem
                  key={entry.id}
                  onSelect={() => onChange(entry.id)}
                  className={cn('min-h-11 md:min-h-0', entry.id === value && 'bg-accent')}
                >
                  <span>{entry.name}</span>
                  <span className="flex-1" />
                  {entry.id === value && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

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
  const cfg = getUnifiedModel(entry.id);
  if (cfg) return cfg.isFree === true;
  // Not in the config. Pruna always needs a key; a live Pollinations model came
  // back from an endpoint that already filters by the caller's permissions, so
  // treat it as usable rather than hiding it behind a key warning.
  return entry.provider === 'pollinations';
}

export function ModelPicker({ entries, mode, value, onChange, loading, fallbackActive }: Props) {
  const { t } = useLanguage();

  const filtered = useMemo(() => entries.filter((entry) => isModelInMode(entry, mode)), [entries, mode]);
  const current = filtered.find((entry) => entry.id === value);

  const freeModels = useMemo(() => filtered.filter((entry) => entryIsFree(entry)), [filtered]);
  const keyModels = useMemo(() => filtered.filter((entry) => !entryIsFree(entry)), [filtered]);

  const currentIsFree = current ? entryIsFree(current) : false;

  return (
    <div className="flex flex-col gap-2">
      {fallbackActive && (
        <div className="text-[11px] text-muted-foreground bg-muted rounded-md px-2 py-1">
          {t('playground.fallbackNotice')}
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-auto py-2.5 text-[12.5px]"
            disabled={loading || filtered.length === 0}
          >
            <span>{current?.name ?? (loading ? 'Lädt…' : t('playground.prunaEmpty'))}</span>
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
                  className={cn(entry.id === value && 'bg-accent')}
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
                  className={cn(entry.id === value && 'bg-accent')}
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

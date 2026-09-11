'use client';

import { useMemo, useState } from 'react';
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
import { usePollenKey } from '@/hooks/usePollenKey';
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
  // Zwei Bedingungen, beide aus der Registry: `runnableOnKey` sagt, ob der
  // effektive Schluessel das Modell bedienen darf, `paidOnly` ob es Geld
  // kostet. Die lokale Config taugt fuer beides nicht — sie fuehrt
  // gptimage-large als isFree und flux als isFree:false, waehrend live (belegt
  // 2026-09-10) beide am Betreiber-Schluessel mit 403 antworten. Pruna hat
  // keine Registry und braucht immer einen Schluessel.
  if (entry.provider === 'pollinations') return entry.runnableOnKey && !entry.paidOnly;
  return getUnifiedModel(entry.id)?.isFree === true;
}

/**
 * Kuratierte Bezahl-Klassiker: sichtbar, aber erst mit dem eigenen
 * Pollen-Schluessel waehlbar. Sie sind der einzige Grund, warum die Route
 * ueberhaupt einen Pollinations-Eintrag mit `runnable: false` ausliefert.
 */
function needsOwnPollenKey(entry: PlaygroundModelEntry): boolean {
  return entry.provider === 'pollinations' && !entry.runnableOnKey;
}

export function ModelPicker({ entries, mode, value, onChange, loading, fallbackActive }: Props) {
  const { t } = useLanguage();
  const hasPrunaKey = useHasPrunaKey();
  const { pollenKey } = usePollenKey();
  // Welcher gesperrte Eintrag wurde angeklickt? Ohne das bliebe der Klick
  // folgenlos und der Grund unsichtbar.
  const [gesperrtId, setGesperrtId] = useState<string | null>(null);

  const filtered = useMemo(() => entries.filter((entry) => isModelInMode(entry, mode)), [entries, mode]);
  const current = filtered.find((entry) => entry.id === value);

  const freeModels = useMemo(() => filtered.filter((entry) => entryIsFree(entry)), [filtered]);
  const paidModels = useMemo(
    () => filtered.filter((entry) => !entryIsFree(entry) && needsOwnPollenKey(entry)),
    [filtered],
  );
  const keyModels = useMemo(
    () => filtered.filter((entry) => !entryIsFree(entry) && !needsOwnPollenKey(entry)),
    [filtered],
  );

  const currentIsFree = current ? entryIsFree(current) : false;
  const currentNeedsOwnKey = current ? !entryIsFree(current) && needsOwnPollenKey(current) : false;

  /**
   * Ein Eintrag der Auswahlliste. Gesperrte Bezahl-Klassiker bleiben anklickbar
   * (aria-disabled statt disabled), damit der Klick den Grund zeigen kann: ein
   * Eintrag, der stumm nichts tut, ist schlechter als einer, der erklaert.
   */
  const renderModel = (entry: PlaygroundModelEntry, bezahlt: boolean) => {
    const gesperrt = bezahlt && !pollenKey;
    return (
      <DropdownMenuItem
        key={entry.id}
        aria-disabled={gesperrt}
        onSelect={(event) => {
          if (!gesperrt) {
            onChange(entry.id);
            return;
          }
          // Menue offen halten — sonst verschwindet die Begruendung mit ihm.
          event.preventDefault();
          setGesperrtId(entry.id);
        }}
        className={cn('min-h-11 md:min-h-0', entry.id === value && 'bg-accent', gesperrt && 'opacity-60')}
      >
        <span>{entry.name}</span>
        <span className="flex-1" />
        {bezahlt && <Badge variant="outline">bezahlt</Badge>}
        {entry.id === value && <Check className="h-3.5 w-3.5 text-primary" />}
      </DropdownMenuItem>
    );
  };
  // Pruna-Hinweis: Der aktuelle Eintrag laeuft ueber Pruna, aber es ist kein
  // eigener Schluessel hinterlegt. Pruna ist BYOP-only (2026-08-28).
  const showPrunaHint = current?.provider === 'pruna' && !hasPrunaKey;

  // An empty list means different things per provider: Pruna is key-gated as a
  // whole, while Pollinations just has nothing matching this mode. Never show
  // the Pruna wording while Pollinations is the active provider.
  const emptyLabel =
    entries.length === 0 ? 'Keine Modelle verfügbar' : 'Kein Modell für diesen Modus';

  // L-I.3: "Kein Modell fuer diesen Modus" ist keine Erklaerung, sondern eine
  // Sackgasse. Seit Phase 3 ist Video vollstaendig schluesselpflichtig
  // (Betreiberentscheidung E1-A) — wer t2v waehlt und keinen Schluessel hat,
  // findet eine leere Liste vor und erfaehrt den Grund sonst nirgends.
  const modusIstVideo = mode === 't2v' || mode === 'i2v';
  const leerWegenSchluessel = filtered.length === 0 && modusIstVideo;

  return (
    <div className="flex flex-col gap-2">
      {fallbackActive && (
        <div className="text-[11px] text-muted-foreground bg-muted rounded-md px-2 py-1">
          {t('playground.fallbackNotice')}
        </div>
      )}

      {leerWegenSchluessel && (
        <div role="note" className="rounded-md bg-amber-500/10 px-2 py-1 text-[11px] leading-snug text-amber-600">
          Für Video gibt es kein kostenloses Modell. Mit einem eigenen Pollen- oder
          Pruna-Schlüssel erscheinen hier welche — in den Einstellungen hinterlegen.
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
            {current && (
              <Badge variant="secondary">{currentIsFree ? 'frei' : currentNeedsOwnKey ? 'bezahlt' : 'Key'}</Badge>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-[260px] overflow-y-auto">
          {freeModels.length > 0 && (
            <>
              <DropdownMenuLabel>Frei</DropdownMenuLabel>
              {freeModels.map((entry) => renderModel(entry, false))}
            </>
          )}

          {keyModels.length > 0 && (
            <>
              <DropdownMenuLabel>Key nötig</DropdownMenuLabel>
              {keyModels.map((entry) => renderModel(entry, false))}
            </>
          )}

          {paidModels.length > 0 && (
            <>
              <DropdownMenuLabel>Bezahlt — eigener Pollen-Schlüssel</DropdownMenuLabel>
              {paidModels.map((entry) => renderModel(entry, true))}
            </>
          )}

          {gesperrtId && (
            <p role="note" className="px-2 py-1.5 text-[11px] leading-snug text-amber-600">
              Läuft nur auf deinem eigenen Pollen-Schlüssel — in den Einstellungen hinterlegen.
            </p>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

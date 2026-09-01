"use client";

import { useLayoutEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onEnhance: () => void;
  enhancing: boolean;
  onSend: () => void;
  /**
   * Ob ueberhaupt noch ein Lauf angestossen werden darf. False heisst: die
   * Nebenlaeufigkeits-Grenze ist erreicht — der Grund gehoert dann in
   * `queueFullHint`, damit die Sperre nicht stumm bleibt.
   */
  canQueue?: boolean;
  queueFullHint?: string;
  modelName?: string;
  providerName?: string;
  promptRequired?: boolean;
  /**
   * L-K.2: Ein gestarteter Pruna-Lauf ist nicht abbrechbar — Pruna hat keinen
   * Cancel-Endpunkt, jeder gueltige Payload wird abgerechnet. Der Satz steht
   * deshalb dauerhaft an der Leiste, solange ein Pruna-Modell gewaehlt ist,
   * und nicht erst im Fehlerfall.
   */
  irreversibleHint?: string;
  /**
   * L-I.3: Video ist seit Phase 3 vollstaendig schluesselpflichtig
   * (Betreiberentscheidung E1-A). Ohne Schluessel muss das vor dem Absenden
   * dastehen, nicht als 401 danach.
   */
  keyRequiredHint?: string;
}

const MAX_CHARS = 1000;

export function PromptBar({
  value,
  onChange,
  onEnhance,
  enhancing,
  onSend,
  canQueue = true,
  queueFullHint,
  modelName,
  providerName,
  promptRequired = true,
  irreversibleHint,
  keyRequiredHint,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const empty = value.trim().length === 0;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    // An die sichtbare Hoehe koppeln, nicht an window.innerHeight: bei offener
    // Tastatur ist innerHeight unveraendert und das Feld waechst ueber den
    // sichtbaren Bereich hinaus. useViewportHeight setzt --vvh.
    const visible = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--vvh'),
    ) || window.innerHeight;
    const max = Math.round(visible * 0.45);
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  }, [value]);

  const status = [modelName, providerName].filter(Boolean) as string[];
  const canSend = canQueue && (!empty || !promptRequired);

  // max() statt env(): auf Geraeten ohne Home-Indicator ist der Inset 0 und
  // die bisherigen 14px bleiben stehen. Braucht viewport-fit=cover aus
  // src/app/create/page.tsx, sonst ist der Inset immer 0.
  return (
    <div className="px-4 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
      <div className="glass-input flex items-end gap-2.5 rounded-2xl border border-border/80 py-2.5 pl-4 pr-2.5 shadow-lg transition-colors focus-within:border-primary/55 focus-within:ring-[3px] focus-within:ring-primary/15">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          maxLength={MAX_CHARS}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Beschreib, was du sehen willst…"
          aria-label="Prompt"
          className="min-w-0 flex-1 resize-none border-0 bg-transparent py-1 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/65"
        />

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            onClick={onEnhance}
            disabled={enhancing || empty}
            className="gap-1.5 rounded-full"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{enhancing ? 'Läuft…' : 'Enhance'}</span>
          </Button>

          <Button
            onClick={onSend}
            disabled={!canSend}
            title={!canQueue ? queueFullHint : undefined}
            className="rounded-full font-semibold"
          >
            Senden
          </Button>
        </div>
      </div>

      {/* L-I.3 vor L-K.2: ohne Schluessel laeuft gar nichts, die Abrechenbarkeit
          ist dann noch nicht das Problem des Nutzers. */}
      {keyRequiredHint && (
        <p role="note" className="mt-1.5 px-1 text-[10px] leading-snug text-amber-600">
          {keyRequiredHint}
        </p>
      )}
      {!keyRequiredHint && irreversibleHint && (
        <p role="note" className="mt-1.5 px-1 text-[10px] leading-snug text-muted-foreground/80">
          {irreversibleHint}
        </p>
      )}

      <div className="mt-1.5 flex items-center gap-2 px-1 text-[10px] text-muted-foreground/70">
        {/* Ein `title` auf einem disabled Button loest in den meisten Browsern
            nicht aus — der Grund muss deshalb auch sichtbar dastehen. */}
        {!canQueue && queueFullHint
          ? <span className="text-foreground/80">{queueFullHint}</span>
          : status.map((part, i) => (
            <span key={part} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true" className="h-[3px] w-[3px] rounded-full bg-current opacity-50" />}
              {part}
            </span>
          ))}
        <span className="ml-auto tabular-nums">
          {value.length} / {MAX_CHARS}
        </span>
      </div>
    </div>
  );
}

'use client';

import { AsciiSignature } from '@/components/ascii';
import type { SoundState } from '@/hooks/usePlaygroundState';
import { cn } from '@/lib/utils';

/**
 * ACE-Step 1.5 ist ein Zwei-Felder-System: Tags (3-7 Stichworte, keine Prosa)
 * steuern Stil und Instrumentierung, Lyrics (optional, mit [verse]/[chorus])
 * tragen den Gesang.
 *
 * Die **Tags stehen in der Sendeleiste**, nicht hier: sie sind kurz, sie sind
 * Pflicht (ohne sie antwortet die Route mit 400), und Enhance verdichtet genau
 * sie — der Knopf gehoert daneben. Bis 2026-09-03 gab es das Tag-Feld zweimal,
 * hier und in der Leiste, mit widersprechenden Grenzen (512 gegen 1000).
 *
 * Hier bleibt, was optional und lang ist: Lyrics, und die Parameter.
 */

const SOUND_SIGNATURE = '▁▂▃▅▆▇▆▅▃▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.11em] text-muted-foreground/75">
          {label}
        </span>
        {hint && (
          <span className="text-[10px] leading-none text-muted-foreground/55">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

export interface SoundPanelProps {
  value: SoundState;
  onChange: (patch: Partial<SoundState>) => void;
  disabled?: boolean;
}

export function SoundPanel({ value, onChange, disabled = false }: SoundPanelProps) {
  return (
    <div className="flex flex-col gap-4" data-testid="sound-panel">
      <AsciiSignature
        pattern={SOUND_SIGNATURE}
        active={!disabled}
        className="text-[10px] leading-none text-muted-foreground/45"
      />

      <Field label="Lyrics" hint="optional — [verse] / [chorus]">
        <textarea
          value={value.lyrics}
          disabled={disabled}
          onChange={(e) => {
            // Ein inhaltliches Lyric-Feld schaltet instrumental automatisch
            // aus — der Rueckschalter bleibt dem Nutzer ueberlassen.
            const lyrics = e.target.value;
            onChange({ lyrics, instrumental: lyrics.trim().length === 0 });
          }}
          rows={5}
          placeholder={'[verse]\nErste Zeile…\n\n[chorus]\nRefrain…'}
          aria-label="Sound-Lyrics"
          maxLength={5000}
          className="min-h-[110px] w-full resize-y rounded-lg border border-border bg-background/60 px-3 py-2 text-xs leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/55 focus:ring-[3px] focus:ring-primary/15 disabled:opacity-50"
        />
      </Field>

      <Field label="Instrumental">
        <button
          type="button"
          role="switch"
          aria-checked={value.instrumental}
          disabled={disabled}
          onClick={() => onChange({ instrumental: !value.instrumental })}
          className={cn(
            'flex min-h-9 w-full items-center justify-between rounded-lg border px-3 py-1.5 text-xs transition-colors disabled:opacity-50',
            value.instrumental
              ? 'border-primary/55 bg-primary/10 text-foreground'
              : 'border-border bg-background/60 text-muted-foreground hover:border-primary/40',
          )}
        >
          <span>{value.instrumental ? 'Ohne Gesang' : 'Mit Gesang (Lyrics)'}</span>
          <span aria-hidden="true" className="font-mono text-[10px]">
            [{value.instrumental ? 'x' : ' '}]
          </span>
        </button>
      </Field>

      <Field label="Dauer" hint={`${value.duration} s`}>
        <input
          type="range"
          min={5}
          max={240}
          step={5}
          value={value.duration}
          disabled={disabled}
          onChange={(e) => onChange({ duration: Number(e.target.value) })}
          aria-label="Dauer in Sekunden"
          className="w-full accent-[hsl(var(--mode-compose))]"
        />
        <div aria-hidden="true" className="flex justify-between font-mono text-[9.5px] text-muted-foreground/55">
          <span>5s</span>
          <span>240s</span>
        </div>
      </Field>

      <Field label="Varianten" hint="ACE-Step ist Gacha — mehrere probieren">
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 4, 8].map((n) => (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange({ batch: n })}
              aria-pressed={value.batch === n}
              className={cn(
                'min-h-9 rounded-lg border font-mono text-xs transition-colors disabled:opacity-50',
                value.batch === n
                  ? 'border-primary/55 bg-primary/10 font-semibold text-foreground'
                  : 'border-border bg-background/60 text-muted-foreground hover:border-primary/40',
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

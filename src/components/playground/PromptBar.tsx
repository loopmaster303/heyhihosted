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
  onCancel: () => void;
  sending: boolean;
  modelName?: string;
  providerName?: string;
  promptRequired?: boolean;
}

const MAX_CHARS = 1000;

export function PromptBar({
  value,
  onChange,
  onEnhance,
  enhancing,
  onSend,
  onCancel,
  sending,
  modelName,
  providerName,
  promptRequired = true,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const empty = value.trim().length === 0;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const max = Math.round(window.innerHeight * 0.45);
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  }, [value]);

  const status = [modelName, providerName].filter(Boolean) as string[];
  const canSend = !sending && (!empty || !promptRequired);

  return (
    <div className="px-4 pb-3.5 pt-3">
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

          {sending ? (
            <Button onClick={onCancel} className="rounded-full font-semibold">
              Abbrechen
            </Button>
          ) : (
            <Button onClick={onSend} disabled={!canSend} className="rounded-full font-semibold">
              Senden
            </Button>
          )}
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-2 px-1 text-[10px] text-muted-foreground/70">
        {status.map((part, i) => (
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

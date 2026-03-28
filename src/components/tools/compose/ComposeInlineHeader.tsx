import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DURATION_OPTIONS, type ComposeMusicModel } from '@/hooks/useComposeMusicState';

interface ComposeInlineHeaderProps {
  selectedModel: ComposeMusicModel;
  duration: number;
  instrumental: boolean;
  onModelChange: (model: ComposeMusicModel) => void;
  onDurationChange: (duration: number) => void;
  onInstrumentalChange: (instrumental: boolean) => void;
  onDeactivate?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'framed' | 'bare';
}

const badgeClass =
  "flex items-center bg-transparent border-r border-border/20 px-2 py-1.5 shrink-0 gap-1.5 last:border-r-0";
const labelClass =
  "text-[10px] text-muted-foreground font-semibold whitespace-nowrap uppercase tracking-wider";
const triggerClass =
  "h-6 text-[10px] border-0 bg-transparent p-0 focus:ring-0 gap-1 w-auto min-w-[60px] text-foreground font-semibold hover:text-primary transition-colors [&>span]:flex [&>span]:items-center [&>span]:gap-1.5";

export const ComposeInlineHeader: React.FC<ComposeInlineHeaderProps> = ({
  duration,
  instrumental,
  onDurationChange,
  onInstrumentalChange,
  onDeactivate,
  disabled = false,
  className,
  // selectedModel and onModelChange kept for API compatibility (single model for now)
}) => {
  return (
    <div
      className={cn(
        "relative flex flex-nowrap items-center overflow-x-auto no-scrollbar",
        className
      )}
    >
      {/* Mode label — clicking deactivates compose */}
      <div className={badgeClass}>
        <button
          type="button"
          onClick={onDeactivate}
          className={cn(labelClass, "text-mode-compose hover:opacity-60 transition-opacity cursor-pointer")}
          title="Click to deactivate Compose mode"
        >
          Compose with
        </button>
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground">
          <Music2 className="w-3.5 h-3.5 text-purple-500" />
          ElevenMusic
        </span>
      </div>

      {/* Duration Selector */}
      <div className={badgeClass}>
        <Select
          value={String(duration)}
          onValueChange={(val) => onDurationChange(Number(val))}
          disabled={disabled}
        >
          <SelectTrigger className={triggerClass}>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-md border-border/40">
            {DURATION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Instrumental Toggle */}
      <div className={badgeClass}>
        <button
          type="button"
          onClick={() => onInstrumentalChange(!instrumental)}
          disabled={disabled}
          aria-label={instrumental ? "Instrumental an, klicken für Vocals" : "Vocals an, klicken für Instrumental"}
          aria-pressed={instrumental}
          className={cn(
            "h-6 px-2 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 whitespace-nowrap",
            instrumental
              ? "bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          )}
        >
          {instrumental ? "Instr." : "Vocals"}
        </button>
      </div>
    </div>
  );
};

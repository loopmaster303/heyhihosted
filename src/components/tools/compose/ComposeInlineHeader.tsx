import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
  disabled?: boolean;
  className?: string;
  variant?: 'framed' | 'bare';
}

const badgeClass =
  "flex items-center bg-transparent border-r border-border/20 px-3 py-1.5 shrink-0 gap-2 last:border-r-0";
const labelClass =
  "text-[10px] text-muted-foreground font-semibold whitespace-nowrap uppercase tracking-wider";
const triggerClass =
  "h-6 text-[10px] border-0 bg-transparent p-0 focus:ring-0 gap-1 w-auto min-w-[60px] text-foreground font-semibold hover:text-primary transition-colors [&>span]:flex [&>span]:items-center [&>span]:gap-1.5";

export const ComposeInlineHeader: React.FC<ComposeInlineHeaderProps> = ({
  selectedModel,
  duration,
  instrumental,
  onModelChange,
  onDurationChange,
  onInstrumentalChange,
  disabled = false,
  className,
  variant = 'framed',
}) => {
  return (
    <div
      className={cn(
        "relative flex flex-wrap items-center gap-y-1 backdrop-blur-sm rounded-xl overflow-hidden mb-2",
        variant === 'framed'
          ? "border border-border/30 bg-muted/10"
          : "bg-mode-compose/8 border border-mode-compose/20",
        className
      )}
    >
      {/* Model Badge */}
      <div className={badgeClass}>
        <span className={labelClass}>Modell</span>
        <Select
          value={selectedModel}
          onValueChange={(val) => onModelChange(val as ComposeMusicModel)}
          disabled={disabled}
        >
          <SelectTrigger className={triggerClass}>
            <div className="flex items-center gap-1.5">
              <Music2 className="w-3.5 h-3.5 text-purple-500" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-md border-border/40">
            <SelectItem value="elevenmusic">ElevenMusic</SelectItem>
            {/* Suno v5 temporarily hidden — model offline at Pollinations */}
          </SelectContent>
        </Select>
      </div>

      {/* Duration Selector */}
      <div className={badgeClass}>
        <span className={labelClass}>Dauer</span>
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
        <span className={labelClass}>Instrumental</span>
        <div className="flex items-center gap-1.5 h-6">
          <Switch
            id="instrumental-toggle-inline"
            checked={instrumental}
            onCheckedChange={onInstrumentalChange}
            disabled={disabled}
            className="scale-75 origin-left data-[state=checked]:bg-purple-500"
          />
        </div>
      </div>
    </div>
  );
};

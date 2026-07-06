import React from 'react';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music2, Clock, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { durationLabel, type ComposeMusicModel } from '@/hooks/useComposeMusicState';
import { AVAILABLE_COMPOSE_MODELS } from '@/config/chat-options';
import { imageModelIcons } from '@/config/ui-constants';
import { useLanguage } from '@/components/LanguageProvider';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { InlineParamsContainer } from '../InlineParamsContainer';

interface ComposeInlineHeaderProps {
  selectedModel: ComposeMusicModel;
  duration: number;
  availableDurations: number[];
  hasPollenKey: boolean;
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

const renderModelIcon = (modelId: string) => {
  const icon = imageModelIcons[modelId];
  if (icon && typeof icon !== 'string') {
    return <Image src={icon} alt={modelId} width={20} height={20} className="w-5 h-5 rounded-sm" />;
  }
  return <Music2 className="w-4 h-4 text-purple-500" />;
};

export const ComposeInlineHeader: React.FC<ComposeInlineHeaderProps> = ({
  selectedModel,
  duration,
  availableDurations,
  hasPollenKey,
  instrumental,
  onModelChange,
  onDurationChange,
  onInstrumentalChange,
  onDeactivate,
  disabled = false,
  className,
}) => {
  const { t } = useLanguage();
  const currentMeta = AVAILABLE_COMPOSE_MODELS.find((m) => m.id === selectedModel);
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [paramsOpen, setParamsOpen] = React.useState(false);

  return (
    <div
      className={cn(
        "relative flex items-center gap-x-1 flex-wrap sm:flex-nowrap",
        className
      )}
    >
      {/* Mode label + Model selector */}
      <div className={badgeClass}>
        <button
          type="button"
          onClick={onDeactivate}
          className={cn(labelClass, "text-mode-compose hover:opacity-60 transition-opacity cursor-pointer")}
          title="Click to deactivate Compose mode"
        >
          {isMobile ? "Compose" : "Compose with"}
        </button>
        <Select
          value={selectedModel}
          onValueChange={(val) => onModelChange(val as ComposeMusicModel)}
          disabled={disabled}
        >
          <SelectTrigger className={cn(triggerClass, isMobile ? "min-w-0" : "min-w-[110px]")}>
            <span className="flex items-center gap-1.5">
              {renderModelIcon(selectedModel)}
              {!isMobile && (
                <span className="truncate max-w-[150px]">{currentMeta?.name || selectedModel}</span>
              )}
            </span>
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-md border-border/40">
            {AVAILABLE_COMPOSE_MODELS.map((model) => {
              const locked = !model.isFree && !hasPollenKey;
              return (
                <SelectItem
                  key={model.id}
                  value={model.id}
                  disabled={locked}
                  className="cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center">
                      {renderModelIcon(model.id)}
                    </span>
                    <span className="text-[11px] font-semibold">{model.name}</span>
                    {locked && <Lock className="w-3 h-3 text-muted-foreground" />}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <InlineParamsContainer isMobile={isMobile} open={paramsOpen} onOpenChange={setParamsOpen}>
      {/* Duration Selector */}
      <div className={badgeClass}>
        <Select
          value={String(duration)}
          onValueChange={(val) => onDurationChange(Number(val))}
          disabled={disabled || availableDurations.length === 0}
        >
          <SelectTrigger className={triggerClass}>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-md border-border/40">
            {availableDurations.map((seconds) => (
              <SelectItem key={seconds} value={String(seconds)}>
                {durationLabel(seconds)}
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

      {/* Free-tier hint when no key */}
      {!hasPollenKey && (
        <div className={cn(badgeClass, "border-r-0")}>
          <span className={cn(labelClass, "normal-case text-muted-foreground/70")}>
            {t('compose.freeHint') || 'Free bis 1 Min · Key für mehr'}
          </span>
        </div>
      )}
      </InlineParamsContainer>
    </div>
  );
};

import React from 'react';
import Image from 'next/image';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ImageIcon, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAspectRatioPresetsForModel } from '@/config/image-aspect-ratio-presets';
import { unifiedModelConfigs, type UnifiedModelConfig } from '@/config/unified-model-configs';
import {
  getDefaultDurationSeconds,
  getDurationOptionsSeconds,
  getUnifiedModel,
  getVisualizeModelGroupsForProvider,
  shouldIncludeByopHidden,
  type ImageProvider,
} from '@/config/unified-image-models';
import { imageModelIcons } from '@/config/ui-constants';
import { useLanguage } from '@/components/LanguageProvider';
import { useHasPollenKey } from '@/hooks/useHasPollenKey';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { InlineParamsContainer } from '../InlineParamsContainer';
import type { UploadedReference } from '@/types';
import { VideoBadge } from './VideoBadge';

interface VisualizeInlineHeaderProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  currentModelConfig?: UnifiedModelConfig;
  formFields: Record<string, any>;
  handleFieldChange: (name: string, value: any) => void;
  setFormFields: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  isPollenModel: boolean;
  isPollinationsVideo: boolean;
  inlineContent?: React.ReactNode;
  onDeactivate?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'framed' | 'bare';
  section?: 'all' | 'model' | 'parameters';
  providerMode?: ImageProvider;
  prunaAvailable?: boolean;
  sourceVideo?: UploadedReference | null;
  onSourceVideoChange?: (video: UploadedReference | null) => void;
  requiresSourceVideo?: boolean;
}

const badgeClass =
  "flex items-center bg-transparent border-r border-border/20 px-2.5 py-1.5 shrink-0 gap-1.5 last:border-r-0";
const labelClass =
  "text-[10px] text-muted-foreground font-semibold whitespace-nowrap uppercase tracking-wider";
const triggerClass =
  "h-6 text-[11px] border-0 bg-transparent p-0 focus:ring-0 gap-0.5 w-auto min-w-[52px] text-foreground font-semibold hover:text-primary transition-colors [&>span]:flex [&>span]:items-center [&>span]:gap-1";

export const VisualizeInlineHeader: React.FC<VisualizeInlineHeaderProps> = ({
  selectedModelId,
  onModelChange,
  currentModelConfig,
  formFields,
  handleFieldChange,
  setFormFields,
  isPollenModel,
  isPollinationsVideo,
  inlineContent,
  onDeactivate,
  disabled = false,
  className,
  variant = 'framed',
  section = 'all',
  providerMode = 'pollinations',
  prunaAvailable = false,
  sourceVideo,
  onSourceVideoChange,
  requiresSourceVideo = false,
}) => {
  const { t } = useLanguage();
  const hasPollenKey = useHasPollenKey();
  const [expanded, setExpanded] = React.useState(true); // For dropdown groups
  const isMobile = useMediaQuery('(max-width: 639px)');
  const showModel = section !== 'parameters';
  const showParameters = section !== 'model';

  const modelGroups = React.useMemo(() => {
    const includeByopHidden = shouldIncludeByopHidden(providerMode, { prunaAvailable, hasPollenKey });
    return getVisualizeModelGroupsForProvider(providerMode, { includeByopHidden })
      .map(group => ({
        ...group,
        models: group.models.filter(model => unifiedModelConfigs[model.id]),
      }))
      .filter(group => group.models.length > 0);
  }, [providerMode, hasPollenKey, prunaAvailable]);

  const durationOptions = React.useMemo(() => {
    return getDurationOptionsSeconds(getUnifiedModel(selectedModelId));
  }, [selectedModelId]);
  const legacyDurationDefault = currentModelConfig?.inputs.find(input => input.name === 'duration')?.default;
  const durationDefault = getDefaultDurationSeconds(
    getUnifiedModel(selectedModelId),
    typeof legacyDurationDefault === 'number' ? legacyDurationDefault : undefined,
  );

  const standardGroups = modelGroups.filter(group => group.category === 'Standard');
  const advancedGroups = modelGroups.filter(group => group.category === 'Advanced');

  const aspectRatioPresets = React.useMemo(
    () => getAspectRatioPresetsForModel(selectedModelId),
    [selectedModelId]
  );

  const renderModelIcon = (modelId: string, dense = false) => {
    const icon = imageModelIcons[modelId];

    if (icon) {
      if (typeof icon === 'string') {
        return <span className={cn("text-base", dense && "text-xs")}>{icon}</span>;
      }

      return (
        <Image
          src={icon}
          alt={modelId}
          width={dense ? 16 : 20}
          height={dense ? 16 : 20}
          className={cn("rounded-sm", dense ? "w-4 h-4" : "w-5 h-5")}
        />
      );
    }

    return <ImageIcon className={cn("w-3.5 h-3.5 text-muted-foreground", dense && "w-3 h-3")} />;
  };

  if (!currentModelConfig) return null;

  // Full Toolbar — mobile: params live behind the drawer trigger; desktop: single-row scroll strip.
  return (
    <div
      className={cn(
        "relative flex items-center gap-x-1",
        className
      )}
    >
      {/* Model selector only — mode identity is handled by VisualCorner */}
      {showModel && <div className={badgeClass}>
        <Select value={selectedModelId} onValueChange={onModelChange} disabled={disabled}>
          <SelectTrigger className={cn(triggerClass, "min-w-[80px]")}>
            <span className="flex items-center gap-1.5">
              {renderModelIcon(selectedModelId, true)}
              <span className={cn("truncate", isMobile ? "max-w-[88px]" : "max-w-[140px]")}>
                {unifiedModelConfigs[selectedModelId]?.name || selectedModelId}
              </span>
            </span>
          </SelectTrigger>
          <SelectContent className="w-[min(520px,90vw)] bg-background/90 backdrop-blur-md border-border/40 p-1">
            {standardGroups.map((group) => {
              const Icon = group.kind === 'image' ? ImageIcon : Video;
              return (
                <SelectGroup key={group.key}>
                  <SelectLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pt-2">
                    <span className="flex items-center gap-2">
                      <Icon className="w-3 h-3" />
                      {group.label}
                    </span>
                  </SelectLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-2 pb-2">
                    {group.models.map((model) => {
                      const displayName = unifiedModelConfigs[model.id]?.name || model?.name || model.id;
                      const isActive = selectedModelId === model.id;
                      return (
                        <SelectItem
                          key={model.id}
                          value={model.id}
                          textValue={displayName}
                          onClick={() => onModelChange(model.id)}
                          className={cn(
                            "rounded-lg px-2 py-2 focus:bg-muted/40 cursor-pointer [&>span:first-child]:hidden",
                            isActive ? "bg-muted/30" : "hover:bg-muted/20"
                          )}
                        >
                          <span className="flex items-center gap-2 min-w-0 w-full">
                            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-muted/40 border border-border/30">
                              {renderModelIcon(model.id)}
                            </span>
                            <span className="truncate text-[11px] font-semibold text-foreground">{displayName}</span>
                            {isActive && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                                {t('visualize.active')}
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </div>
                </SelectGroup>
              );
            })}

            <div className="px-2 pb-2">
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                onMouseDown={(event) => event.preventDefault()}
                className="w-full py-2 px-3 text-[10px] font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 border border-dashed border-border/50 rounded-lg hover:bg-muted/20 transition-colors"
              >
                {expanded ? t('visualize.showLess') : t('visualize.showMore')}
                <ChevronDown className={cn("w-4 h-4 transition-transform", expanded && "rotate-180")} />
              </button>
            </div>

            {expanded && advancedGroups.map((group) => {
              const Icon = group.kind === 'image' ? ImageIcon : Video;
              return (
                <SelectGroup key={group.key}>
                  <SelectLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pt-2">
                    <span className="flex items-center gap-2">
                      <Icon className="w-3 h-3" />
                      {group.label}
                    </span>
                  </SelectLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-2 pb-2">
                    {group.models.map((model) => {
                      const displayName = unifiedModelConfigs[model.id]?.name || model?.name || model.id;
                      const isActive = selectedModelId === model.id;
                      return (
                        <SelectItem
                          key={model.id}
                          value={model.id}
                          textValue={displayName}
                          onClick={() => onModelChange(model.id)}
                          className={cn(
                            "rounded-lg px-2 py-2 focus:bg-muted/40 cursor-pointer [&>span:first-child]:hidden",
                            isActive ? "bg-muted/30" : "hover:bg-muted/20"
                          )}
                        >
                          <span className="flex items-center gap-2 min-w-0 w-full">
                            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-muted/40 border border-border/30">
                              {renderModelIcon(model.id)}
                            </span>
                            <span className="truncate text-[11px] font-semibold text-foreground">{displayName}</span>
                            {isActive && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                                {t('visualize.active')}
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </div>
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>
      </div>}

      {/* Provider selection moved to the config sidebar (Personalization → Bild-Provider). */}

      {showParameters && <InlineParamsContainer>
      {/* Source Video */}
      {requiresSourceVideo && sourceVideo && (
        <div className={cn(badgeClass, "gap-2")}>
          <VideoBadge video={sourceVideo} onRemove={() => onSourceVideoChange?.(null)} />
        </div>
      )}

      {/* Aspect Ratio */}
      {(isPollenModel || currentModelConfig.inputs.find(i => i.name === 'aspect_ratio')) && (
        <div className={badgeClass}>
          {isPollenModel ? (
            <Select
              value={formFields.aspect_ratio || '1:1'}
              onValueChange={(value) => {
                const preset = aspectRatioPresets[value] || aspectRatioPresets['1:1'];
                setFormFields(prev => ({
                  ...prev,
                  aspect_ratio: value,
                  width: preset.width,
                  height: preset.height,
                }));
              }}
              disabled={disabled}
            >
              <SelectTrigger className={triggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(aspectRatioPresets).map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : currentModelConfig.outputType === 'video' ? (
            <Select
              value={formFields.aspect_ratio || '16:9'}
              onValueChange={(v) => handleFieldChange('aspect_ratio', v)}
              disabled={disabled}
            >
              <SelectTrigger className={triggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">16:9</SelectItem>
                <SelectItem value="9:16">9:16</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Select
              value={formFields.aspect_ratio || '1:1'}
              onValueChange={(v) => handleFieldChange('aspect_ratio', v)}
              disabled={disabled}
            >
              <SelectTrigger className={triggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectedModelId === 'z-image-turbo' ? (
                  <>
                    <SelectItem value="1:1">1:1 (1024×1024)</SelectItem>
                    <SelectItem value="4:3">4:3 (1024×768)</SelectItem>
                    <SelectItem value="3:4">3:4 (768×1024)</SelectItem>
                    <SelectItem value="16:9">16:9 (1344×768)</SelectItem>
                    <SelectItem value="9:16">9:16 (768×1344)</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="match_input_image">Match</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="1:1">1:1</SelectItem>
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="3:2">3:2</SelectItem>
                    <SelectItem value="2:3">2:3</SelectItem>
                    <SelectItem value="4:5">4:5</SelectItem>
                    <SelectItem value="5:4">5:4</SelectItem>
                    <SelectItem value="9:16">9:16</SelectItem>
                    <SelectItem value="3:4">3:4</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Duration — bleibt vorne: 4s gegen 30s ist eine andere Szene, nicht
          dasselbe Video in anderer Laenge. */}
      {((currentModelConfig.outputType === 'video' || isPollinationsVideo) && durationOptions.length > 0) && (
        <div className={badgeClass}>
          <Select
            value={String(formFields.duration ?? durationDefault)}
            onValueChange={(value) => handleFieldChange('duration', Number(value))}
            disabled={disabled}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {durationOptions.map(option => (
                <SelectItem key={option} value={String(option)}>{option}s</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Aufloesung, Ton, Ausgabeformat und Negativ-Prompt sind Korrekturen am
         fertigen Ergebnis, nicht Vorgaben fuer die Bildidee — sie leben am
         Kontrollstreifen der Ergebniskarte. Der Enhance-Schalter entfaellt:
         der Funken-Knopf in der Textzeile macht dasselbe sichtbar. */}

      {inlineContent && (
        <div className={badgeClass}>
          {inlineContent}
        </div>
      )}
      </InlineParamsContainer>}
    </div>
  );
};

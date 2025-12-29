import React from 'react';
import Image from 'next/image';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ChevronDown, ImageIcon, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import { unifiedModelConfigs, type UnifiedModelConfig } from '@/config/unified-model-configs';
import { getUnifiedModel, getVisualizeModelGroups } from '@/config/unified-image-models';
import { imageModelIcons } from '@/config/ui-constants';
import { gptImagePresets } from '@/hooks/useUnifiedImageToolState';

interface VisualizeInlineHeaderProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  currentModelConfig?: UnifiedModelConfig;
  formFields: Record<string, any>;
  handleFieldChange: (name: string, value: any) => void;
  setFormFields: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  isGptImage: boolean;
  isSeedream: boolean;
  isNanoPollen: boolean;
  isPollenModel: boolean;
  isPollinationsVideo: boolean;
  disabled?: boolean;
  className?: string;
}

const badgeClass =
  "flex items-center bg-background/40 border border-border/40 rounded-lg px-2 py-1.5 shrink-0 gap-2";
const labelClass =
  "text-sm text-foreground/70 font-bold whitespace-nowrap uppercase tracking-tighter text-[10px]";
const triggerClass =
  "h-7 text-sm border-0 bg-transparent p-0 focus:ring-0 gap-1.5 w-auto min-w-[80px] text-foreground font-bold [&>span]:flex [&>span]:items-center [&>span]:gap-1.5";

export const VisualizeInlineHeader: React.FC<VisualizeInlineHeaderProps> = ({
  selectedModelId,
  onModelChange,
  currentModelConfig,
  formFields,
  handleFieldChange,
  setFormFields,
  isGptImage,
  isSeedream,
  isNanoPollen,
  isPollenModel,
  isPollinationsVideo,
  disabled = false,
  className,
}) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = React.useState(true);

  const modelGroups = React.useMemo(() => {
    return getVisualizeModelGroups()
      .map(group => ({
        ...group,
        models: group.models.filter(model => unifiedModelConfigs[model.id]),
      }))
      .filter(group => group.models.length > 0);
  }, []);

  const standardGroups = modelGroups.filter(group => group.category === 'Standard');
  const advancedGroups = modelGroups.filter(group => group.category === 'Advanced');

  const shouldShowResolution = React.useMemo(() => {
    const aspectRatio = formFields.aspect_ratio || '1:1';
    return aspectRatio !== 'custom';
  }, [formFields.aspect_ratio]);

  const renderModelIcon = (modelId: string, dense = false) => {
    const icon = imageModelIcons[modelId];

    if (icon) {
      if (typeof icon === 'string') {
        return <span className={cn("text-base", dense && "text-sm")}>{icon}</span>;
      }

      return (
        <Image
          src={icon}
          alt={modelId}
          width={dense ? 18 : 22}
          height={dense ? 18 : 22}
          className="rounded"
        />
      );
    }

    return <ImageIcon className={cn("w-3.5 h-3.5 text-muted-foreground", dense && "w-3 h-3")} />;
  };

  if (!currentModelConfig) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>

      {/* Model */}
      <div className={badgeClass}>
        <span className={labelClass}>Modell</span>
        <Select value={selectedModelId} onValueChange={onModelChange} disabled={disabled}>
          <SelectTrigger className={cn(triggerClass, "min-w-[100px]")}>
            <span className="flex items-center gap-1.5">
              {renderModelIcon(selectedModelId, true)}
              <span className="truncate max-w-[120px]">
                {unifiedModelConfigs[selectedModelId]?.name || selectedModelId}
              </span>
            </span>
          </SelectTrigger>
          <SelectContent className="min-w-[420px] bg-background/90 backdrop-blur-md border-border/40 p-1">
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
                  <div className="px-2 pb-2">
                    <div className="rounded-2xl border border-border/30 bg-background/40 backdrop-blur-[2px] overflow-hidden shadow-sm">
                      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/20 border-b border-border/30">
                        <span>MODELL</span>
                        <span>BESCHREIBUNG</span>
                      </div>
                      <div className="divide-y divide-border/30">
                        {group.models.map((model) => {
                          const displayName = unifiedModelConfigs[model.id]?.name || model?.name || model.id;
                          const isActive = selectedModelId === model.id;
                          return (
                            <SelectItem
                              key={model.id}
                              value={model.id}
                              textValue={displayName}
                              className="p-0 pl-0 pr-0 focus:bg-transparent cursor-pointer [&>span:first-child]:hidden"
                            >
                              <div className={cn(
                                "grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-3 px-4 py-2.5 text-left transition-colors",
                                isActive ? "bg-muted/40" : "hover:bg-muted/20"
                              )}>
                                <span className="flex items-center gap-2 min-w-0">
                                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-muted/40 border border-border/30">
                                    {renderModelIcon(model.id)}
                                  </span>
                                  <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
                                  {isActive && (
                                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                                      Aktiv
                                    </span>
                                  )}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">{model?.description || '—'}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </div>
                    </div>
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
                {expanded ? 'Show Less' : 'Show More'}
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
                  <div className="px-2 pb-2">
                    <div className="rounded-2xl border border-border/30 bg-background/40 backdrop-blur-[2px] overflow-hidden shadow-sm">
                      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/20 border-b border-border/30">
                        <span>MODELL</span>
                        <span>BESCHREIBUNG</span>
                      </div>
                      <div className="divide-y divide-border/30">
                        {group.models.map((model) => {
                          const displayName = unifiedModelConfigs[model.id]?.name || model?.name || model.id;
                          const isActive = selectedModelId === model.id;
                          return (
                            <SelectItem
                              key={model.id}
                              value={model.id}
                              textValue={displayName}
                              className="p-0 pl-0 pr-0 focus:bg-transparent cursor-pointer [&>span:first-child]:hidden"
                            >
                              <div className={cn(
                                "grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-3 px-4 py-2.5 text-left transition-colors",
                                isActive ? "bg-muted/40" : "hover:bg-muted/20"
                              )}>
                                <span className="flex items-center gap-2 min-w-0">
                                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-muted/40 border border-border/30">
                                    {renderModelIcon(model.id)}
                                  </span>
                                  <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
                                  {isActive && (
                                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                                      Aktiv
                                    </span>
                                  )}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">{model?.description || '—'}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Aspect Ratio */}
      {(isPollenModel || currentModelConfig.inputs.find(i => i.name === 'aspect_ratio')) && (
        <div className={badgeClass}>
          <span className={labelClass}>Größe</span>
          {isPollenModel ? (
            <Select
              value={formFields.aspect_ratio || '1:1'}
              onValueChange={(value) => {
                const preset = gptImagePresets[value] || gptImagePresets['1:1'];
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
                {Object.keys(gptImagePresets).map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : currentModelConfig.outputType === 'video' && getUnifiedModel(selectedModelId)?.provider === 'pollinations' ? (
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
                    <SelectItem value="match_input_image">Match Input Image</SelectItem>
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

      {/* Quality / Resolution */}
      {selectedModelId !== 'z-image-turbo' && !isGptImage && !isSeedream && !isPollinationsVideo && shouldShowResolution && currentModelConfig.inputs.find(i => i.name === 'resolution') && (
        <div className={badgeClass}>
          <span className={labelClass}>Qualität</span>
          <Select
            value={formFields.resolution || (selectedModelId === 'nanobanana-pro' ? '2K' : '1 MP')}
            onValueChange={(value) => handleFieldChange('resolution', value)}
            disabled={disabled}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {selectedModelId === 'flux-2-pro' && (
                <>
                  {formFields.aspect_ratio === 'match_input_image' && <SelectItem value="match_input_image">Match Input Image</SelectItem>}
                  <SelectItem value="0.5 MP">0.5 MP</SelectItem>
                  <SelectItem value="1 MP">1 MP</SelectItem>
                  <SelectItem value="2 MP">2 MP</SelectItem>
                  <SelectItem value="4 MP">4 MP</SelectItem>
                </>
              )}
              {selectedModelId === 'nanobanana-pro' && (
                <>
                  <SelectItem value="1K">1K</SelectItem>
                  <SelectItem value="2K">2K</SelectItem>
                  <SelectItem value="4K">4K</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Duration */}
      {((currentModelConfig.outputType === 'video' || isPollinationsVideo) && currentModelConfig.inputs.find(i => i.name === 'duration')) && (
        <div className={badgeClass}>
          <span className={labelClass}>Dauer</span>
          <Select
            value={String(formFields.duration || (selectedModelId.includes('wan') ? '5' : '6'))}
            onValueChange={(value) => handleFieldChange('duration', Number(value))}
            disabled={disabled}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(selectedModelId === 'wan-2.5-t2v' || selectedModelId === 'wan-video') ? (
                <>
                  <SelectItem value="5">5s (Standard)</SelectItem>
                  <SelectItem value="10">10s (High Quality)</SelectItem>
                </>
              ) : (selectedModelId === 'veo' || selectedModelId === 'veo-3.1-fast') ? (
                <>
                  <SelectItem value="4">4s</SelectItem>
                  <SelectItem value="6">6s</SelectItem>
                  <SelectItem value="8">8s</SelectItem>
                </>
              ) : (selectedModelId === 'seedance-pro') ? (
                <>
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                    <SelectItem key={s} value={String(s)}>{s}s</SelectItem>
                  ))}
                </>
              ) : (
                <>
                  <SelectItem value="5">5s</SelectItem>
                  <SelectItem value="10">10s</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Seed */}
      {currentModelConfig.inputs.find(i => i.name === 'seed') && !isPollinationsVideo && (
        <div className={badgeClass}>
          <span className={labelClass}>Seed</span>
          <Input
            type="number"
            placeholder="Random"
            value={formFields.seed || ''}
            onChange={(e) => handleFieldChange('seed', e.target.value)}
            disabled={disabled}
            className="h-7 w-[80px] border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
          />
        </div>
      )}

      {/* Output Format */}
      {(!isPollenModel && !isPollinationsVideo && currentModelConfig.inputs.find(i => i.name === 'output_format')) && (
        <div className={badgeClass}>
          <span className={labelClass}>Format</span>
          <Select
            value={formFields.output_format || (currentModelConfig.outputType === 'video' ? 'mp4' : (selectedModelId === 'flux-2-pro' ? 'webp' : 'jpg'))}
            onValueChange={(value) => handleFieldChange('output_format', value)}
            disabled={disabled}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jpg">JPG</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="webp">WebP</SelectItem>
              {currentModelConfig.outputType === 'video' && <SelectItem value="mp4">MP4</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X, ImageIcon, ChevronDown, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import { getUnifiedModel, getVisualizeModelGroups, type UnifiedImageModel } from '@/config/unified-image-models';
import { getUnifiedModelConfig } from '@/config/unified-model-configs';
import { imageModelIcons } from '@/config/ui-constants';

interface VisualModelSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    selectedModelId: string;
    onModelChange: (modelId: string) => void;
    embedded?: boolean;
}

export const VisualModelSelector: React.FC<VisualModelSelectorProps> = ({
    isOpen,
    onClose,
    selectedModelId,
    onModelChange,
    embedded = false
}) => {
    const { t } = useLanguage();
    const [expanded, setExpanded] = useState(true);
    const modelGroups = getVisualizeModelGroups();
    const standardGroups = modelGroups.filter(group => group.category === 'Standard');
    const advancedGroups = modelGroups.filter(group => group.category === 'Advanced');

    const renderGroup = (
        group: (typeof modelGroups)[number],
        options: { dense?: boolean; closeOnSelect?: boolean } = {}
    ) => {
        const Icon = group.kind === 'image' ? ImageIcon : Video;
        const { dense, closeOnSelect } = options;

        return (
            <div className="space-y-2" key={group.key}>
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Icon className="w-3 h-3" /> {group.label}
                </h4>
                <ModelTable
                    models={group.models}
                    selectedModelId={selectedModelId}
                    onModelChange={(id) => {
                        onModelChange(id);
                        if (closeOnSelect) onClose();
                    }}
                    dense={dense}
                />
            </div>
        );
    };

    if (!isOpen && !embedded) return null;

    if (embedded) {
        return (
            <div className="space-y-4">
                 {/* Embedded Header / Title */}
                 <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        {t('modelSelect.title') || 'Model'}
                    </h3>
                    <div className="text-xs text-muted-foreground truncate max-w-[150px] text-right">
                         {getUnifiedModelConfig(selectedModelId)?.name}
                    </div>
                </div>

                {/* Content - Simpler list or horizontal scroll for embedded? 
                    Let's reuse the grid but make it tight. 
                */}
                <div className="space-y-4">
                    {standardGroups.map(group => renderGroup(group, { dense: true }))}

                    {/* Expand/Advanced Toggle for Embedded? 
                        Maybe keep it simple for now, or use the same expand logic.
                    */}
                     <button
                        onClick={() => setExpanded(!expanded)}
                        className="w-full py-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 border border-dashed border-border/50 rounded-lg hover:bg-muted/20 transition-colors"
                        type="button"
                    >
                        {expanded ? 'Show Less' : 'Show More'}
                        <ChevronDown className={cn("w-3 h-3 transition-transform", expanded && "rotate-180")} />
                    </button>

                    {expanded && (
                         <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-1">
                            {advancedGroups.map(group => renderGroup(group, { dense: true }))}
                         </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            <div
                className="fixed inset-0 z-[100] bg-transparent"
                onClick={onClose}
                aria-hidden="true"
            />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max min-w-[320px] max-w-[90vw] z-[110] bg-background/90 text-foreground rounded-2xl shadow-xl border border-border/40 backdrop-blur-md p-0 origin-top animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 ease-out overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 sticky top-0 bg-background/90 backdrop-blur-md z-10">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center" style={{ backgroundImage: 'linear-gradient(to bottom right, hsl(330 65% 62%), rgb(59, 130, 246))' }}>
                            <ImageIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">{t('modelSelect.title') || 'Modell wählen'}</h2>
                            <p className="text-xs text-muted-foreground">{t('modelSelect.subtitle') || 'Bild- & Video-Generierung'}</p>
                        </div>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8 rounded-full hover:bg-muted"
                >
                    <X className="w-5 h-5" />
                </Button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[420px] overflow-y-auto">
                <div className="space-y-4">
                    {standardGroups.map(group => renderGroup(group, { closeOnSelect: true }))}
                </div>

                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full mt-4 py-2 px-3 text-[10px] font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 border border-dashed border-border/50 rounded-lg hover:bg-muted/20 transition-colors"
                    type="button"
                >
                    {expanded ? 'Show Less' : 'Show More'}
                    <ChevronDown className={cn("w-4 h-4 transition-transform", expanded && "rotate-180")} />
                </button>

                {expanded && (
                    <div className="mt-4 space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                        {advancedGroups.map(group => renderGroup(group, { closeOnSelect: true }))}
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

const ModelTable = ({
    models,
    selectedModelId,
    onModelChange,
    dense = false,
}: {
    models: UnifiedImageModel[];
    selectedModelId: string;
    onModelChange: (modelId: string) => void;
    dense?: boolean;
}) => {
    if (!models.length) return null;

    return (
        <div className="rounded-2xl border border-border/30 bg-background/40 backdrop-blur-[2px] overflow-hidden shadow-sm">
            <div className={cn(
                "grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/20 border-b border-border/30",
                dense && "text-[9px]"
            )}>
                <span>MODELL</span>
                <span>BESCHREIBUNG</span>
            </div>
            <div className="divide-y divide-border/30">
                {models.map((model) => (
                    <ModelRow
                        key={model.id}
                        id={model.id}
                        selectedModelId={selectedModelId}
                        onSelect={() => onModelChange(model.id)}
                        dense={dense}
                    />
                ))}
            </div>
        </div>
    );
};

const ModelRow = ({
    id,
    selectedModelId,
    onSelect,
    dense = false,
}: {
    id: string;
    selectedModelId: string;
    onSelect: () => void;
    dense?: boolean;
}) => {
    const config = getUnifiedModelConfig(id);
    const model = getUnifiedModel(id);
    const icon = imageModelIcons[id];
    const isActive = selectedModelId === id;

    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                "grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-3 px-4 py-2.5 text-left transition-colors",
                isActive ? "bg-muted/40" : "hover:bg-muted/20"
            )}
        >
            <span className="flex items-center gap-2 min-w-0">
                <span className={cn(
                    "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-muted/40 border border-border/30",
                    dense && "h-5 w-5"
                )}>
                    {icon ? (
                        typeof icon === 'string' ? (
                            <span className={cn("text-base", dense && "text-sm")}>{icon}</span>
                        ) : (
                            <Image src={icon} alt={id} width={20} height={20} className="rounded" />
                        )
                    ) : (
                        <ImageIcon className={cn("w-3.5 h-3.5 text-muted-foreground", dense && "w-3 h-3")} />
                    )}
                </span>
                <span className={cn("truncate font-medium text-sm", dense && "text-xs")}>{config?.name || model?.name}</span>
                {isActive && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                        Aktiv
                    </span>
                )}
            </span>
            <span className={cn("truncate text-xs text-muted-foreground", dense && "text-[10px]")}>
                {model?.description || '—'}
            </span>
        </button>
    );
};

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { modelIcons, featuredModels, modelDisplayMap } from '@/config/ui-constants';
import { useLanguage } from '@/components/LanguageProvider';
import { useVisiblePollinationsTextModels } from '@/hooks/useVisiblePollinationsTextModels';
import { useHasPollenKey } from '@/hooks/useHasPollenKey';

interface ModelSelectorProps {
    selectedModelId: string;
    onModelChange: (modelId: string) => void;
    isMobile?: boolean;
    compact?: boolean;
    disabled?: boolean;
    modelFilterIds?: string[];
    /** Whether the shared panel above the textarea currently shows the model list */
    isOpen?: boolean;
    onToggle?: () => void;
    panelId?: string;
    buttonRef?: React.Ref<HTMLButtonElement>;
}

const useModelLists = (modelFilterIds?: string[]) => {
    const { visibleModels: allModels, findModelById } = useVisiblePollinationsTextModels();
    const filtered = modelFilterIds && modelFilterIds.length > 0
        ? modelFilterIds.map((id) => allModels.find((model) => model.id === id)).filter(Boolean)
        : null;

    return {
        findModelById,
        featuredList: filtered ?? featuredModels.map(f => allModels.find(m => m.id === f.id)).filter(Boolean),
        otherModels: filtered ? [] : allModels.filter(m => !featuredModels.some(f => f.id === m.id)),
    };
};

/**
 * Nur der Ausloeser. Die Liste liegt im Feld ueber der Textzeile — dieselbe
 * Oeffnungsgeste wie Upload, Einstellungen und Modus.
 */
export const ModelSelector: React.FC<ModelSelectorProps> = ({
    selectedModelId,
    onModelChange,
    isMobile = false,
    compact = false,
    disabled = false,
    modelFilterIds,
    isOpen = false,
    onToggle,
    panelId,
    buttonRef,
}) => {
    const { t } = useLanguage();
    const { findModelById } = useModelLists(modelFilterIds);

    const handleClick = () => {
        if (disabled) return;
        onToggle?.();
    };

    if (compact) {
        const model = findModelById(selectedModelId);
        const icon = modelIcons[selectedModelId];
        const displayName = modelDisplayMap[selectedModelId] || model?.name || 'AI';

        return (
            <Button
                ref={buttonRef}
                type="button"
                variant="ghost"
                disabled={disabled}
                onClick={handleClick}
                aria-expanded={isOpen}
                aria-controls={isOpen ? panelId : undefined}
                className={cn(
                    "h-auto shrink-0 gap-2 bg-transparent px-1 py-3 font-mono text-sm font-medium shadow-none transition-opacity hover:bg-transparent",
                    isOpen ? "opacity-100" : "opacity-70 hover:opacity-100",
                )}
            >
                <div className="flex items-center gap-1.5 min-w-0">
                    {icon && (
                        <div className="w-4 h-4 shrink-0 relative">
                            <Image
                                src={icon}
                                alt=""
                                fill
                                sizes="16px"
                                className="object-contain grayscale-[0.5] group-hover:grayscale-0 transition-all"
                            />
                        </div>
                    )}
                    <span className={cn("truncate max-w-[160px] md:max-w-[220px] font-mono", icon && "hidden sm:inline")}>{displayName}</span>
                </div>
                <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
            </Button>
        );
    }

    const modelName = findModelById(selectedModelId)?.name || 'AI';
    return (
        <Button
            ref={buttonRef}
            type="button"
            variant="ghost"
            disabled={disabled}
            onClick={handleClick}
            aria-expanded={isOpen}
            aria-controls={isOpen ? panelId : undefined}
            className={cn(
                "group rounded-lg h-14 md:h-12 transition-colors duration-300 text-muted-foreground hover:text-foreground",
                isMobile ? 'w-auto px-2' : 'w-auto px-1'
            )}
            aria-label={t('modelSelector.select')}
        >
            <div className="flex items-center gap-1.5 truncate max-w-full">
                {isMobile ? (
                    <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold truncate max-w-[120px]">{modelName}</span>
                        <ChevronDown className="w-5 h-5 flex-shrink-0 text-primary/80" />
                    </div>
                ) : (
                    <div className="flex items-center">
                        <div className="h-14 flex items-center justify-center px-4">
                            <span className="text-lg font-bold tracking-tight pointer-events-auto">{modelName}</span>
                        </div>
                        <ChevronDown className="w-6 h-6 flex-shrink-0 text-primary/80 ml-1" />
                    </div>
                )}
            </div>
        </Button>
    );
};

interface ModelSelectorPanelProps {
    selectedModelId: string;
    onModelChange: (modelId: string) => void;
    modelFilterIds?: string[];
}

export const ModelSelectorPanel: React.FC<ModelSelectorPanelProps> = ({
    selectedModelId,
    onModelChange,
    modelFilterIds,
}) => {
    const { t } = useLanguage();
    const { featuredList, otherModels } = useModelLists(modelFilterIds);
    const [expanded, setExpanded] = useState(false);
    const hasPollenKey = useHasPollenKey();
    const [lockedHint, setLockedHint] = useState<string | null>(null);

    const renderModelItem = (model: any, isCompact = false) => {
        if (!model) return null;
        const isSelected = selectedModelId === model.id;
        // Pollenwall (Phase 3): schlüsselpflichtige Modelle bleiben sichtbar,
        // aber ohne Pollen-Schlüssel nicht wählbar.
        const isLocked = model.isFree === false && !hasPollenKey;

        return (
            <button
                key={model.id}
                type="button"
                onClick={() => (isLocked ? setLockedHint(model.id) : onModelChange(model.id))}
                aria-disabled={isLocked}
                className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg text-left transition-all duration-200 border",
                    isSelected
                        ? "bg-primary/10 border-primary/30 shadow-sm"
                        : "hover:bg-muted/50 border-transparent hover:border-border/50",
                    isLocked && "opacity-60",
                )}
            >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/50 flex-shrink-0">
                    {modelIcons[model.id] ? (
                        <Image
                            src={modelIcons[model.id]}
                            alt={model.name}
                            width={isCompact ? 20 : 24}
                            height={isCompact ? 20 : 24}
                            className="rounded-md"
                        />
                    ) : (
                        <span className={cn("font-bold opacity-50", isCompact ? "text-[10px]" : "text-xs")}>
                            {model.name.charAt(0)}
                        </span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className={cn("font-semibold truncate", isCompact ? "text-xs" : "text-sm")}>
                            {model.name}
                        </span>
                        {model.vision && (
                            <span className="text-[8px] px-1 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                VISION
                            </span>
                        )}
                        {isLocked && (
                            <span className="flex items-center gap-0.5 text-[8px] px-1 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold">
                                <Lock className="w-2 h-2" />
                                POLLEN
                            </span>
                        )}
                    </div>
                    {!isCompact && model.description && (
                        <p className="text-[10px] text-muted-foreground truncate opacity-80">
                            {model.description}
                        </p>
                    )}
                </div>
            </button>
        );
    };

    return (
        <div className="max-h-[45vh] overflow-y-auto overscroll-contain pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {featuredList.map((model) => renderModelItem(model, false))}
            </div>

            {lockedHint && (
                <p className="mt-2 px-2 text-[10px] text-amber-600" role="note">
                    {t('modelSelector.pollenRequired')}
                </p>
            )}

            {!expanded && otherModels.length > 0 && (
                <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 py-2.5 group hover:bg-muted/50"
                >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                        {t('modelSelector.showAll')} ({otherModels.length})
                    </span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
            )}

            {expanded && (
                <>
                    <div className="px-2 pt-4 pb-2 text-[9px] font-bold text-primary uppercase tracking-[0.2em] opacity-60">
                        {t('modelSelector.advanced')}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {otherModels.map((model) => renderModelItem(model, true))}
                    </div>
                    <button
                        type="button"
                        onClick={() => setExpanded(false)}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-t border-border/30 py-2.5 group hover:bg-muted/50"
                    >
                        <ChevronUp className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground">
                            {t('modelSelector.showLess')}
                        </span>
                    </button>
                </>
            )}
        </div>
    );
};

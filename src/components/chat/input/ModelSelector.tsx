import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AVAILABLE_POLLINATIONS_MODELS } from '@/config/chat-options';
import { modelIcons, featuredModels } from '@/config/ui-constants';
import { ModalPopup } from '@/components/ui/popup';

interface ModelSelectorProps {
    selectedModelId: string;
    onModelChange: (modelId: string) => void;
    isMobile?: boolean;
    compact?: boolean;
    disabled?: boolean;
    modelFilterIds?: string[];
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
    selectedModelId,
    onModelChange,
    isMobile = false,
    compact = false,
    disabled = false,
    modelFilterIds
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const filteredModels = modelFilterIds && modelFilterIds.length > 0
        ? modelFilterIds.map((id) => AVAILABLE_POLLINATIONS_MODELS.find((model) => model.id === id)).filter(Boolean)
        : null;

    // Filter featured models
    const featuredList = filteredModels ?? featuredModels.map(f => AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === f.id)).filter(Boolean);
    // Filter other models
    const otherModels = filteredModels ? [] : AVAILABLE_POLLINATIONS_MODELS.filter(m => !featuredModels.some(f => f.id === m.id));

    const closePopover = useCallback(() => {
        setIsOpen(false);
        setExpanded(false);
    }, []);

    const openPopover = useCallback(() => {
        if (disabled) return;
        setIsOpen(true);
    }, [disabled]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closePopover();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closePopover]);

    const handleModelSelect = (modelId: string) => {
        onModelChange(modelId);
        closePopover();
    };

    const renderModelItem = (model: any, isCompact = false) => {
        if (!model) return null;
        const config = featuredModels.find(f => f.id === model.id);
        const isSelected = selectedModelId === model.id;

        return (
            <div
                key={model.id}
                onClick={() => handleModelSelect(model.id)}
                className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 border",
                    isSelected
                        ? "bg-primary/10 border-primary/30 shadow-sm"
                        : "hover:bg-muted/50 border-transparent hover:border-border/50"
                )}
            >
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center bg-muted/50 flex-shrink-0">
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
                    <div className="flex items-center justify-between">
                        <span className={cn("font-semibold truncate", isCompact ? "text-xs" : "text-sm")}>
                            {model.name}
                        </span>
                        {model.vision && (
                            <span className="text-[8px] px-1 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                VISION
                            </span>
                        )}
                    </div>
                    {!isCompact && model.description && (
                        <p className="text-[10px] text-muted-foreground truncate opacity-80">
                            {model.description}
                        </p>
                    )}
                </div>
            </div>
        );
    };

    const trigger = compact ? (
        <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            onClick={openPopover}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            className="h-9 px-2 md:px-3 gap-2 rounded-full border border-border/30 hover:bg-accent transition-all text-xs font-semibold text-foreground/70 shadow-sm shrink-0"
        >
            <div className="flex items-center gap-1.5 min-w-0">
                {(() => {
                    const model = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === selectedModelId);
                    const icon = modelIcons[selectedModelId];
                    // Distinguishable short names
                    let displayName = model?.name || 'AI';
                    const normalizedName = displayName.toLowerCase();
                    
                    if (displayName.includes('Haiku')) displayName = 'Claude Haiku';
                    else if (displayName.includes('Sonnet')) displayName = 'Claude Sonnet';
                    else if (displayName.includes('Opus')) displayName = 'Claude Opus';
                    else if (displayName.includes('GPT-5.2')) displayName = 'GPT 5.2';
                    else if (displayName.includes('Nano')) displayName = 'GPT Nano';
                    else if (displayName.includes('Gemini 3 Pro')) displayName = 'Gemini Pro';
                    else if (displayName.includes('Gemini 3 Flash')) displayName = 'Gemini Flash';
                    else if (displayName.includes('Grok')) displayName = 'Grok 4';
                    else if (normalizedName.includes('deepseek')) displayName = 'Deepseek';
                    else if (displayName.includes('Thinking')) displayName = 'Kimi Think';
                    else if (displayName.includes('Coder')) displayName = 'Qwen Code';
                    
                    return (
                        <>
                            {icon && (
                                <div className="w-4 h-4 shrink-0 relative">
                                    <Image src={icon} alt="" fill className="object-contain grayscale-[0.5] group-hover:grayscale-0 transition-all" />
                                </div>
                            )}
                            <span className="truncate max-w-[120px] md:max-w-[160px]">{displayName}</span>
                        </>
                    );
                })()}
            </div>
            <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
        </Button>
    ) : (
        <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            onClick={openPopover}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            className={cn(
                "group rounded-lg h-14 md:h-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white",
                isMobile ? 'w-auto px-2' : 'w-auto px-1'
            )}
            aria-label="Select model"
        >
            <div className="flex items-center gap-1.5 truncate max-w-full">
                {(() => {
                    const modelName = AVAILABLE_POLLINATIONS_MODELS.find(m => m.id === selectedModelId)?.name || 'Claude';
                    if (isMobile) {
                        return (
                            <div className="flex items-center gap-1">
                                <span className="text-sm font-semibold truncate max-w-[120px]">{modelName}</span>
                                <ChevronDown className="w-5 h-5 flex-shrink-0 text-pink-500" />
                            </div>
                        );
                    }
                    return (
                        <div className="flex items-center">
                            <div className="h-14 flex items-center justify-center px-4">
                                <span className="text-lg font-bold tracking-tight pointer-events-auto">
                                    {modelName}
                                </span>
                            </div>
                            <ChevronDown className="w-6 h-6 flex-shrink-0 text-pink-500 ml-1" />
                        </div>
                    );
                })()}
            </div>
        </Button>
    );

    return (
        <>
            {trigger}
            {isOpen && (
                <ModalPopup
                    maxWidth={expanded ? "4xl" : "xl"}
                    onClose={closePopover}
                    className={cn(
                        "p-0 overflow-hidden shadow-glass-heavy border-primary/10",
                        expanded ? "w-[95vw] md:w-[820px]" : "w-[90vw] sm:w-[420px]"
                    )}
                >
                    <div className={cn(
                        "overflow-y-auto overscroll-contain",
                        expanded ? "max-h-[80vh] md:max-h-[calc(100vh-180px)]" : "max-h-[75vh] md:max-h-[calc(100vh-240px)]"
                    )}>
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-border/50 sticky top-0 bg-popover/90 backdrop-blur-md z-10 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                                    <span className="text-sm font-bold uppercase tracking-wider">Modellauswahl</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-tight opacity-60">Wähle die passende Intelligenz</p>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={closePopover}
                                className="h-8 w-8 rounded-full hover:bg-muted/80 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-2 pb-12">
                            <div className={cn(
                                "grid gap-2",
                                expanded ? "grid-cols-2" : "grid-cols-1"
                            )}>
                                {featuredList.map((model) => renderModelItem(model, false))}
                            </div>

                            {!expanded && otherModels.length > 0 && (
                                <div
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setExpanded(true);
                                    }}
                                    className="flex items-center justify-center py-3 cursor-pointer hover:bg-muted/50 rounded-lg mt-2 group gap-2 border border-dashed border-border/50"
                                >
                                    <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-widest">
                                        Alle Modelle anzeigen ({otherModels.length})
                                    </span>
                                    <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            )}

                            {expanded && (
                                <>
                                    <div className="px-2 py-3 text-[9px] font-bold text-primary uppercase tracking-[0.2em] mt-4 mb-1 opacity-60">
                                        Erweiterte Intelligenz
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {otherModels.map((model) => renderModelItem(model, true))}
                                    </div>

                                    <div
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setExpanded(false);
                                        }}
                                        className="flex items-center justify-center py-3 cursor-pointer hover:bg-muted/50 rounded-lg mt-4 group gap-2 border-t border-border/30"
                                    >
                                        <ChevronUp className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground">Weniger anzeigen</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </ModalPopup>
            )}
        </>
    );
};

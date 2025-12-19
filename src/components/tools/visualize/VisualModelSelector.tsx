import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X, ImageIcon, ChevronDown, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import { getUnifiedModel, getStandardModels, getAdvancedModels } from '@/config/unified-image-models';
import { getUnifiedModelConfig } from '@/config/unified-model-configs';
import { imageModelIcons } from '@/config/ui-constants';

interface VisualModelSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    selectedModelId: string;
    onModelChange: (modelId: string) => void;
}

export const VisualModelSelector: React.FC<VisualModelSelectorProps> = ({
    isOpen,
    onClose,
    selectedModelId,
    onModelChange
}) => {
    const { t } = useLanguage();
    const [expanded, setExpanded] = useState(false);

    // Get models by category
    const standardImageModels = getStandardModels('image');
    const standardVideoModels = getStandardModels('video');
    const advancedImageModels = getAdvancedModels('image');
    const advancedVideoModels = getAdvancedModels('video');

    if (!isOpen) return null;

    return (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max min-w-[320px] max-w-[90vw] z-[110] bg-popover text-popover-foreground rounded-xl shadow-xl border border-border p-0 animate-in fade-in-0 slide-in-from-top-2 duration-300 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 sticky top-0 bg-popover z-10">
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
            <div className="p-4 max-h-[400px] overflow-y-auto">
                {/* STANDARD MODELS - Always visible */}
                <div className="space-y-4">
                    {/* Standard Image */}
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                            <ImageIcon className="w-3 h-3" /> Bild
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {standardImageModels.map(model => (
                                <ModelCard
                                    key={model.id}
                                    id={model.id}
                                    selectedModelId={selectedModelId}
                                    onSelect={() => { onModelChange(model.id); onClose(); }}
                                    compact
                                />
                            ))}
                        </div>
                    </div>

                    {/* Standard Video */}
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Video className="w-3 h-3" /> Video
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {standardVideoModels.map(model => (
                                <ModelCard
                                    key={model.id}
                                    id={model.id}
                                    selectedModelId={selectedModelId}
                                    onSelect={() => { onModelChange(model.id); onClose(); }}
                                    compact
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Expand Button */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full mt-4 py-2 px-3 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 border border-dashed border-border/50 rounded-lg hover:bg-muted/30 transition-colors"
                >
                    {expanded ? 'Weniger anzeigen' : 'Mehr Modelle'}
                    <ChevronDown className={cn("w-4 h-4 transition-transform", expanded && "rotate-180")} />
                </button>

                {/* ADVANCED MODELS - Expandable */}
                {expanded && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                        {/* Advanced Image */}
                        <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                <ImageIcon className="w-3 h-3" /> Bild (Advanced)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {advancedImageModels.map(model => (
                                    <ModelCard
                                        key={model.id}
                                        id={model.id}
                                        selectedModelId={selectedModelId}
                                        onSelect={() => { onModelChange(model.id); onClose(); }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Advanced Video */}
                        <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Video className="w-3 h-3" /> Video (Advanced)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {advancedVideoModels.map(model => (
                                    <ModelCard
                                        key={model.id}
                                        id={model.id}
                                        selectedModelId={selectedModelId}
                                        onSelect={() => { onModelChange(model.id); onClose(); }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ModelCard = ({ id, selectedModelId, onSelect, compact = false }: { id: string, selectedModelId: string, onSelect: () => void, compact?: boolean }) => {
    const config = getUnifiedModelConfig(id);
    const model = getUnifiedModel(id);
    const icon = imageModelIcons[id];

    if (compact) {
        return (
            <div
                onClick={onSelect}
                className={cn(
                    'flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md',
                    selectedModelId === id
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                        : 'border-border/50 hover:border-border hover:bg-muted/30'
                )}
            >
                <div className="w-7 h-7 flex-shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    {icon ? (
                        typeof icon === 'string' ? (
                            <span className="text-lg">{icon}</span>
                        ) : (
                            <Image src={icon} alt={id} width={24} height={24} className="rounded" />
                        )
                    ) : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                    <span className="font-medium text-xs truncate block">{config?.name || model?.name}</span>
                    {model?.description && <span className="text-[10px] text-muted-foreground truncate block">{model.description}</span>}
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={onSelect}
            className={cn(
                'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01]',
                selectedModelId === id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border/50 hover:border-border hover:bg-muted/30'
            )}
        >
            <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                {icon ? (
                    typeof icon === 'string' ? (
                        <span className="text-2xl">{icon}</span>
                    ) : (
                        <Image src={icon} alt={id} width={32} height={32} className="rounded-lg" />
                    )
                ) : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{config?.name || model?.name}</span>
                    {selectedModelId === id && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">Active</span>}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {model?.description && <span className="text-[10px] text-muted-foreground">{model.description}</span>}
                    {model?.supportsReference && <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">📷 Ref</span>}
                    {model?.kind === 'video' && <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">🎥</span>}
                </div>
            </div>
        </div>
    );
};

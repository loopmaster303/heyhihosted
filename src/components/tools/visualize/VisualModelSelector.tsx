import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import { getUnifiedModel } from '@/config/unified-image-models';
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

    if (!isOpen) return null;

    return (
        <div className="mb-4 bg-popover text-popover-foreground rounded-xl shadow-xl border border-border p-0 animate-in fade-in-0 slide-in-from-bottom-4 duration-300 max-h-[520px] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 sticky top-0 bg-popover z-10">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center" style={{ backgroundImage: 'linear-gradient(to bottom right, hsl(330 65% 62%), rgb(59, 130, 246))' }}>
                            <ImageIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">{t('modelSelect.title') || 'Select Model'}</h2>
                            <p className="text-xs text-muted-foreground">{t('modelSelect.subtitle') || 'Choose your image generation model'}</p>
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
            <div className="p-6">
                <div className="space-y-6">
                    {/* TEXT/IMAGE → IMAGE (multi-ref) */}
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('modelSelect.textImage') || 'Text/Image → Image'}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {['gpt-image', 'seedream-pro', 'seedream', 'nanobanana', 'nanobanana-pro'].map(id => (
                                <ModelCard key={id} id={id} selectedModelId={selectedModelId} onSelect={() => { onModelChange(id); onClose(); }} />
                            ))}
                        </div>
                    </div>

                    {/* TEXT → IMAGE */}
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('modelSelect.textToImage') || 'Text → Image'}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {['flux-kontext-pro', 'z-image-turbo'].map(id => (
                                <ModelCard key={id} id={id} selectedModelId={selectedModelId} onSelect={() => { onModelChange(id); onClose(); }} />
                            ))}
                        </div>
                    </div>

                    {/* TEXT + MULTI-IMAGE → IMAGE */}
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('modelSelect.textMultiImage') || 'Text + Multi-Image → Image'}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {['flux-2-pro'].map(id => (
                                <ModelCard key={id} id={id} selectedModelId={selectedModelId} onSelect={() => { onModelChange(id); onClose(); }} />
                            ))}
                        </div>
                    </div>

                    {/* IMAGE → IMAGE (EDIT) */}
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('modelSelect.imageEdit') || 'Image → Image (Edit)'}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {['flux-kontext-pro', 'qwen-image-edit-plus'].map(id => (
                                <ModelCard key={id} id={id} selectedModelId={selectedModelId} onSelect={() => { onModelChange(id); onClose(); }} />
                            ))}
                        </div>
                    </div>

                    {/* VIDEO */}
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('modelSelect.textImageVideo') || 'Text + Image → Video'}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {['seedance-pro', 'veo', 'wan-2.5-t2v', 'wan-video', 'veo-3.1-fast'].map(id => (
                                <ModelCard key={id} id={id} selectedModelId={selectedModelId} onSelect={() => { onModelChange(id); onClose(); }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ModelCard = ({ id, selectedModelId, onSelect }: { id: string, selectedModelId: string, onSelect: () => void }) => {
    const config = getUnifiedModelConfig(id);
    const model = getUnifiedModel(id);
    const icon = imageModelIcons[id];

    return (
        <div
            onClick={onSelect}
            className={cn(
                'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01]',
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
                    <span className="font-semibold text-sm truncate">{config?.name}</span>
                    {selectedModelId === id && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">Active</span>}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {model?.supportsReference && <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">📷 Multi</span>}
                    {model?.provider === 'pollinations' && <span className="text-[10px] px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-medium">⚡ Fast</span>}
                    {model?.provider === 'replicate' && <span className="text-[10px] px-2 py-0.5 rounded-md dark:bg-purple-900/30 dark:text-purple-400 font-medium">⚡ Premium</span>}
                    {config?.outputType === 'video' && <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">🎥 Video</span>}
                    {/* Specific Tags */}
                    {id === 'flux-kontext-pro' && <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 font-medium">✏️ Edit</span>}
                    {id === 'qwen-image-edit-plus' && <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 font-medium">✏️ Edit</span>}
                    {id === 'flux-2-pro' && <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium">📸 8 Images</span>}
                    {id === 'flux-2-pro' && <span className="text-[10px] px-2 py-0.5 rounded-md dark:bg-purple-900/30 dark:text-purple-400 font-medium">⭐ Pro</span>}
                </div>
            </div>
        </div>
    );
};

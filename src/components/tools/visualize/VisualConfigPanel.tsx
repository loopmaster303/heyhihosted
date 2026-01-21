import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { UnifiedModelConfig } from '@/config/unified-model-configs';
import { getUnifiedModel } from '@/config/unified-image-models';
import { gptImagePresets } from '@/hooks/useUnifiedImageToolState';

interface VisualConfigPanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentModelConfig?: UnifiedModelConfig;
    selectedModelId: string;
    formFields: Record<string, any>;
    handleFieldChange: (name: string, value: any) => void;
    setFormFields: React.Dispatch<React.SetStateAction<Record<string, any>>>;

    // Flags
    loading: boolean;
    isGptImage: boolean;
    isSeedream: boolean;
    isNanoPollen: boolean;
    isPollenModel: boolean;
    isPollinationsVideo: boolean;
    embedded?: boolean;
}

export const VisualConfigPanel: React.FC<VisualConfigPanelProps> = ({
    isOpen,
    onClose,
    currentModelConfig,
    selectedModelId,
    formFields,
    handleFieldChange,
    setFormFields,
    loading,
    isGptImage,
    isSeedream,
    isNanoPollen,
    isPollenModel,
    isPollinationsVideo,
    embedded = false
}) => {
    const { t } = useLanguage();

    const shouldShowResolution = React.useMemo(() => {
        const aspectRatio = formFields.aspect_ratio || '1:1';
        return aspectRatio !== 'custom';
    }, [formFields.aspect_ratio]);

    if ((!isOpen && !embedded) || !currentModelConfig) return null;

    if (embedded) {
        return (
             <div className="space-y-4">
                 <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    {/* Render fields directly without header/wrapper */}
                {/* Aspect Ratio */}
                {(isPollenModel || currentModelConfig.inputs.find(i => i.name === 'aspect_ratio')) && (
                    <div className="space-y-2">
                        <Label>{t('imageGen.aspectRatioLabel') || 'Aspect Ratio'}</Label>
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
                                disabled={loading}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.keys(gptImagePresets).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        ) : currentModelConfig.outputType === 'video' && getUnifiedModel(selectedModelId)?.provider === 'pollinations' ? (
                            <Select value={formFields.aspect_ratio || '16:9'} onValueChange={(v) => handleFieldChange('aspect_ratio', v)} disabled={loading}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="16:9">16:9</SelectItem>
                                    <SelectItem value="9:16">9:16</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <Select value={formFields.aspect_ratio || '1:1'} onValueChange={(v) => handleFieldChange('aspect_ratio', v)} disabled={loading}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
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

                {/* Resolution */}
                {selectedModelId !== 'z-image-turbo' && selectedModelId !== 'zimage' && !isGptImage && !isSeedream && !isPollinationsVideo && shouldShowResolution && currentModelConfig.inputs.find(i => i.name === 'resolution') && (
                    <div className="space-y-2">
                        <Label>{t('field.resolution') || 'Resolution'}</Label>
                        <Select
                            value={formFields.resolution || (selectedModelId === 'nanobanana-pro' ? '2K' : '1 MP')}
                            onValueChange={(value) => handleFieldChange('resolution', value)}
                            disabled={loading}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
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

                {/* Dynamic Duration Selector */}
                {((isPollinationsVideo || currentModelConfig.outputType === 'video') && currentModelConfig.inputs.find(i => i.name === 'duration')) && (
                    <div className="space-y-2">
                        <Label>{t('field.duration') || 'Duration (seconds)'}</Label>
                        <Select
                            value={String(formFields.duration || '5')}
                            onValueChange={(value) => handleFieldChange('duration', Number(value))}
                            disabled={loading}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {(() => {
                                    const model = getUnifiedModel(selectedModelId);
                                    if (model?.durationRange?.options) {
                                        return model.durationRange.options.map(opt => (
                                            <SelectItem key={opt} value={String(opt)}>{opt}s</SelectItem>
                                        ));
                                    }
                                    if (model?.durationRange?.min !== undefined && model.durationRange?.max !== undefined) {
                                        // Generate options from min to max
                                        const options = [];
                                        for (let i = model.durationRange.min; i <= model.durationRange.max; i++) {
                                            options.push(
                                                <SelectItem key={i} value={String(i)}>{i}s</SelectItem>
                                            );
                                        }
                                        return options;
                                    }
                                    // Fallback defaults
                                    return (
                                        <>
                                            <SelectItem value="5">5s</SelectItem>
                                            <SelectItem value="10">10s</SelectItem>
                                        </>
                                    );
                                })()}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                
                {/* Audio Toggle (Only if supported) */}
                 {(() => {
                    const model = getUnifiedModel(selectedModelId);
                    if (model?.supportsAudio) {
                        return (
                            <div className="flex items-center justify-between space-y-2 border p-3 rounded-lg border-input bg-background/50">
                                <Label className="cursor-pointer" htmlFor="audio-toggle">
                                    {t('field.audio') || 'Audio Generation'}
                                </Label>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="audio-toggle"
                                        checked={!!formFields.audio}
                                        onCheckedChange={(checked) => handleFieldChange('audio', checked)}
                                        disabled={loading}
                                    />
                                    <span className="text-xs text-muted-foreground">{formFields.audio ? 'On' : 'Off'}</span>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* Output Format */}
                {(!isPollenModel && !isPollinationsVideo && currentModelConfig.inputs.find(i => i.name === 'output_format')) && (
                    <div className="space-y-2">
                        <Label>Output Format</Label>
                        <Select
                            value={formFields.output_format || (currentModelConfig.outputType === 'video' ? 'mp4' : (selectedModelId === 'flux-2-pro' ? 'webp' : 'jpg'))}
                            onValueChange={(value) => handleFieldChange('output_format', value)}
                            disabled={loading}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
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
        </div >
        );
    }

    return (
        <div className="mb-4 bg-popover/80 text-popover-foreground rounded-2xl shadow-glass-heavy border border-glass-border p-4 backdrop-blur-xl origin-bottom animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold">{t('imageGen.modal.title') || 'Settings'}</h3>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="w-4 h-4 mr-1.5" />
                    {t('imageGen.modal.close') || 'Close'}
                </Button>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {/* Aspect Ratio */}
                {(isPollenModel || currentModelConfig.inputs.find(i => i.name === 'aspect_ratio')) && (
                    <div className="space-y-2">
                        <Label>{t('imageGen.aspectRatioLabel') || 'Aspect Ratio'}</Label>
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
                                disabled={loading}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.keys(gptImagePresets).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        ) : currentModelConfig.outputType === 'video' && getUnifiedModel(selectedModelId)?.provider === 'pollinations' ? (
                            <Select value={formFields.aspect_ratio || '16:9'} onValueChange={(v) => handleFieldChange('aspect_ratio', v)} disabled={loading}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="16:9">16:9</SelectItem>
                                    <SelectItem value="9:16">9:16</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <Select value={formFields.aspect_ratio || '1:1'} onValueChange={(v) => handleFieldChange('aspect_ratio', v)} disabled={loading}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
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

                {/* Resolution */}
                {selectedModelId !== 'z-image-turbo' && selectedModelId !== 'zimage' && !isGptImage && !isSeedream && !isPollinationsVideo && shouldShowResolution && currentModelConfig.inputs.find(i => i.name === 'resolution') && (
                    <div className="space-y-2">
                        <Label>{t('field.resolution') || 'Resolution'}</Label>
                        <Select
                            value={formFields.resolution || (selectedModelId === 'nanobanana-pro' ? '2K' : '1 MP')}
                            onValueChange={(value) => handleFieldChange('resolution', value)}
                            disabled={loading}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
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

                {/* Duration Selector for Video Models */}
                {((currentModelConfig.outputType === 'video' || isPollinationsVideo) && currentModelConfig.inputs.find(i => i.name === 'duration')) && (
                    <div className="space-y-2">
                        <Label>{t('field.duration') || 'Duration (seconds)'}</Label>
                        <Select
                            value={String(formFields.duration || (selectedModelId.includes('wan') ? '5' : '6'))}
                            onValueChange={(value) => handleFieldChange('duration', Number(value))}
                            disabled={loading}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {(() => {
                                    const model = getUnifiedModel(selectedModelId);
                                    if (model?.durationRange?.options) {
                                        return model.durationRange.options.map(opt => (
                                            <SelectItem key={opt} value={String(opt)}>{opt}s</SelectItem>
                                        ));
                                    }
                                    return (
                                        <>
                                            <SelectItem value="5">5s</SelectItem>
                                            <SelectItem value="10">10s</SelectItem>
                                        </>
                                    );
                                })()}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Output Format */}
                {(!isPollenModel && !isPollinationsVideo && currentModelConfig.inputs.find(i => i.name === 'output_format')) && (
                    <div className="space-y-2">
                        <Label>Output Format</Label>
                        <Select
                            value={formFields.output_format || (currentModelConfig.outputType === 'video' ? 'mp4' : (selectedModelId === 'flux-2-pro' ? 'webp' : 'jpg'))}
                            onValueChange={(value) => handleFieldChange('output_format', value)}
                            disabled={loading}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
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
        </div >
    );
};

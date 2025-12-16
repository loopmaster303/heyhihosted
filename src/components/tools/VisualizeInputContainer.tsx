'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlidersHorizontal, Plus, ImageIcon, Loader2, X, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '../LanguageProvider';
import { getUnifiedModelConfig, type UnifiedModelConfig } from '@/config/unified-model-configs';
import { getUnifiedModel } from '@/config/unified-image-models';
import NextImage from 'next/image';

// Model Icons
import OpenAIIcon from '../../../icons models/openfarbe.png';
import GoogleIcon from '../../../icons models/google-color.png';
import ByteDanceIcon from '../../../icons models/bytedance-color.png';
import BFLIcon from '../../../icons models/bfl.png';
import QwenIcon from '../../../icons models/qwen-color.png';
import WANIcon from '../../../icons models/wan.png';

// Import Presets from Hook (or duplicate if easier to keep pure component, opting to duplicate minor consts or import)
// For cleaner import, let's redefine or import. Since I just created the hook file and exposed them, I can import.
import { gptImagePresets } from '@/hooks/useUnifiedImageToolState';

// Model Icon Mapping for Image Models
const imageModelIcons: Record<string, any> = {
    'gpt-image': OpenAIIcon,
    'seedream': ByteDanceIcon,
    'seedream-pro': ByteDanceIcon,
    'seedance': ByteDanceIcon,
    'seedance-pro': ByteDanceIcon,
    'nanobanana': '🍌',
    'nanobanana-pro': '🍌',
    'flux-2-pro': BFLIcon,
    'flux-kontext-pro': BFLIcon,
    'veo': GoogleIcon,
    'veo-3.1-fast': GoogleIcon,
    'wan-2.5-t2v': WANIcon,
    'wan-video': WANIcon,
    'z-image-turbo': WANIcon,
    'qwen-image-edit-plus': QwenIcon,
};

interface VisualizeInputContainerProps {
    prompt: string;
    onPromptChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;

    // State from Hook
    selectedModelId: string;
    onModelChange: (modelId: string) => void;
    formFields: Record<string, any>;
    handleFieldChange: (name: string, value: any) => void;
    setFormFields: React.Dispatch<React.SetStateAction<Record<string, any>>>; // For direct updates like preset logic

    uploadedImages: string[];
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRemoveImage: (index: number) => void;

    // UI State
    isModelSelectorOpen: boolean;
    onModelSelectorToggle: () => void;
    isConfigPanelOpen: boolean;
    onConfigPanelToggle: () => void;
    isImageUploadOpen: boolean;
    onImageUploadToggle: () => void;

    // Status
    loading?: boolean;
    disabled?: boolean;
    isEnhancing?: boolean;
    isUploading?: boolean;
    onEnhancePrompt: () => void;

    // Computed (Passed down to avoid re-calculating inside UI)
    currentModelConfig?: UnifiedModelConfig;
    supportsReference: boolean;
    maxImages: number;
    isGptImage: boolean;
    isSeedream: boolean;
    isNanoPollen: boolean;
    isPollenModel: boolean;
    isPollinationsVideo: boolean;

    placeholder?: string;
}

const VisualizeInputContainer: React.FC<VisualizeInputContainerProps> = ({
    prompt,
    onPromptChange,
    onSubmit,

    selectedModelId,
    onModelChange,
    formFields,
    handleFieldChange,
    setFormFields,

    uploadedImages,
    handleFileChange,
    handleRemoveImage,

    isModelSelectorOpen,
    onModelSelectorToggle,
    isConfigPanelOpen,
    onConfigPanelToggle,
    isImageUploadOpen,
    onImageUploadToggle,

    loading = false,
    disabled = false,
    isEnhancing = false,
    isUploading = false,
    onEnhancePrompt,

    currentModelConfig,
    supportsReference,
    maxImages,
    isGptImage,
    isSeedream,
    isNanoPollen,
    isPollenModel,
    isPollinationsVideo,

    placeholder
}) => {
    const { language, t } = useLanguage();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const placeholderText = placeholder || (language === 'de'
        ? 'Beschreib deine Idee – vielseitig, schnell, gut für Drafts, Skizzen, Comics, Manga und fotorealistische Experimente.'
        : 'Describe your idea – versatile, fast, great for drafts, sketches, comics, manga, and photorealistic experiments.');

    const displayModelName = currentModelConfig?.name || 'Select model';

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 80), 260);
            textareaRef.current.style.height = `${newHeight}px`;
        }
    }, [prompt]);

    const shouldShowResolution = React.useMemo(() => {
        const aspectRatio = formFields.aspect_ratio || '1:1';
        return aspectRatio !== 'custom';
    }, [formFields.aspect_ratio]);

    return (
        <div className="w-full relative">
            {/* Model Selector Popup */}
            {isModelSelectorOpen && (
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
                            onClick={onModelSelectorToggle}
                            className="h-8 w-8 rounded-full hover:bg-muted"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Content - Using the exact same categories as original */}
                    <div className="p-6">
                        <div className="space-y-6">
                            {/* Categories rendering logic... reused from Tool */}
                            {/* TEXT/IMAGE → IMAGE (multi-ref) */}
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('modelSelect.textImage') || 'Text/Image → Image'}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {['gpt-image', 'seedream-pro', 'seedream', 'nanobanana', 'nanobanana-pro'].map(id => {
                                        const config = getUnifiedModelConfig(id);
                                        const model = getUnifiedModel(id);
                                        return (
                                            <div
                                                key={id}
                                                onClick={() => { onModelChange(id); onModelSelectorToggle(); }}
                                                className={cn(
                                                    'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01]',
                                                    selectedModelId === id
                                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                                        : 'border-border/50 hover:border-border hover:bg-muted/30'
                                                )}
                                            >
                                                <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                                                    {imageModelIcons[id] ? (
                                                        typeof imageModelIcons[id] === 'string' ? (
                                                            <span className="text-2xl">{imageModelIcons[id]}</span>
                                                        ) : (
                                                            <Image src={imageModelIcons[id]} alt={id} width={32} height={32} className="rounded-lg" />
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
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* TEXT → IMAGE */}
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('modelSelect.textToImage') || 'Text → Image'}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {['flux-kontext-pro', 'z-image-turbo'].map(id => {
                                        const config = getUnifiedModelConfig(id);
                                        const model = getUnifiedModel(id);
                                        return (
                                            <div
                                                key={id}
                                                onClick={() => { onModelChange(id); onModelSelectorToggle(); }}
                                                className={cn(
                                                    'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01]',
                                                    selectedModelId === id
                                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                                        : 'border-border/50 hover:border-border hover:bg-muted/30'
                                                )}
                                            >
                                                <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                                                    {imageModelIcons[id] ? (
                                                        typeof imageModelIcons[id] === 'string' ? <span className="text-2xl">{imageModelIcons[id]}</span> : <Image src={imageModelIcons[id]} alt={id} width={32} height={32} className="rounded-lg" />
                                                    ) : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm truncate">{config?.name}</span>
                                                        {selectedModelId === id && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">Active</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        {model?.provider === 'replicate' && <span className="text-[10px] px-2 py-0.5 rounded-md dark:bg-purple-900/30 dark:text-purple-400 font-medium">⚡ Premium</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* TEXT + MULTI-IMAGE → IMAGE */}
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('modelSelect.textMultiImage') || 'Text + Multi-Image → Image'}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {['flux-2-pro'].map(id => {
                                        const config = getUnifiedModelConfig(id);
                                        return (
                                            <div
                                                key={id}
                                                onClick={() => { onModelChange(id); onModelSelectorToggle(); }}
                                                className={cn(
                                                    'flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01]',
                                                    selectedModelId === id
                                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                                        : 'border-border/50 hover:border-border hover:bg-muted/30'
                                                )}
                                            >
                                                <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                                                    <Image src={imageModelIcons[id]} alt={id} width={32} height={32} className="rounded-lg" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm truncate">{config?.name}</span>
                                                        {selectedModelId === id && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">Active</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium">📸 8 Images</span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-md dark:bg-purple-900/30 dark:text-purple-400 font-medium">⭐ Pro</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* IMAGE → IMAGE (EDIT) */}
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('modelSelect.imageEdit') || 'Image → Image (Edit)'}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {['flux-kontext-pro', 'qwen-image-edit-plus'].map(id => {
                                        const config = getUnifiedModelConfig(id);
                                        return (
                                            <div key={id} onClick={() => { onModelChange(id); onModelSelectorToggle(); }} className={cn('flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01]', selectedModelId === id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border/50 hover:border-border hover:bg-muted/30')}>
                                                <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                                                    <Image src={imageModelIcons[id]} alt={id} width={32} height={32} className="rounded-lg" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm truncate">{config?.name}</span>
                                                        {selectedModelId === id && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">Active</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 font-medium">✏️ Edit</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* VIDEO */}
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('modelSelect.textImageVideo') || 'Text + Image → Video'}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {['seedance-pro', 'veo', 'wan-2.5-t2v', 'wan-video', 'veo-3.1-fast'].map(id => {
                                        const config = getUnifiedModelConfig(id);
                                        const model = getUnifiedModel(id);
                                        return (
                                            <div key={id} onClick={() => { onModelChange(id); onModelSelectorToggle(); }} className={cn('flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01]', selectedModelId === id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border/50 hover:border-border hover:bg-muted/30')}>
                                                <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                                                    {imageModelIcons[id] ? (typeof imageModelIcons[id] === 'string' ? <span className="text-2xl">{imageModelIcons[id]}</span> : <Image src={imageModelIcons[id]} alt={id} width={32} height={32} className="rounded-lg" />) : <span className="text-xl">🎬</span>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm truncate">{config?.name}</span>
                                                        {selectedModelId === id && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">Active</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">🎥 Video</span>
                                                        {model?.provider === 'pollinations' && <span className="text-[10px] px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-medium">⚡ Fast</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Config Panel */}
            {isConfigPanelOpen && currentModelConfig && (
                <div className="mb-4 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border p-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold">{t('imageGen.modal.title') || 'Settings'}</h3>
                        <Button variant="ghost" size="sm" onClick={onConfigPanelToggle}>
                            <X className="w-4 h-4 mr-1.5" />
                            {t('imageGen.modal.close') || 'Close'}
                        </Button>
                    </div>

                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                        {/* Aspect Ratio */}
                        {(isGptImage || isSeedream || isNanoPollen || currentModelConfig.inputs.find(i => i.name === 'aspect_ratio')) && (
                            <div className="space-y-2">
                                <Label>{t('imageGen.aspectRatioLabel') || 'Aspect Ratio'}</Label>
                                {(isGptImage || isSeedream || isNanoPollen) ? (
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
                        {selectedModelId !== 'z-image-turbo' && !isGptImage && !isPollinationsVideo && shouldShowResolution && currentModelConfig.inputs.find(i => i.name === 'resolution') && (
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

                        {/* Seed */}
                        {currentModelConfig.inputs.find(i => i.name === 'seed') && !isPollinationsVideo && (
                            <div className="space-y-2">
                                <Label>{t('field.seed') || 'Seed'}</Label>
                                <Input type="number" placeholder="Random" value={formFields.seed || ''} onChange={(e) => handleFieldChange('seed', e.target.value)} disabled={loading} />
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
                </div>
            )}

            {/* Image Upload Pop-up */}
            {isImageUploadOpen && supportsReference && (
                <div className="mb-4 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border p-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold">Upload Images ({uploadedImages.length}/{maxImages})</h3>
                        <Button variant="ghost" size="sm" onClick={onImageUploadToggle}>
                            <X className="w-4 h-4 mr-1.5" />
                            Close
                        </Button>
                    </div>

                    {uploadedImages.length < maxImages && (
                        <div
                            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer mb-4"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FileImage className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                        </div>
                    )}

                    {/* Uploaded Images Grid */}
                    {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {uploadedImages.map((img, index) => (
                                <div key={index} className="space-y-1">
                                    <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border">
                                        <NextImage src={img} alt={`Image ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 w-5 h-5 rounded-full"
                                            onClick={() => handleRemoveImage(index)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={onSubmit}>
                <div className="bg-white dark:bg-[#252525] rounded-2xl p-3 shadow-xl flex flex-col min-h-0">
                    {loading && (
                        <div className="absolute inset-x-4 top-3 z-10">
                            <div className="rounded-xl bg-black/70 text-white px-4 py-3 text-sm md:text-base shadow-lg flex items-start gap-2">
                                <Loader2 className="h-4 w-4 mt-0.5 animate-spin" />
                                <div className="leading-snug">
                                    {language === 'de'
                                        ? 'Generierung läuft …'
                                        : 'Generating…'}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-grow">
                        <Textarea
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => onPromptChange(e.target.value)}
                            placeholder={placeholderText}
                            className="w-full bg-transparent text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 border-0 shadow-none p-2 m-0 leading-tight resize-none overflow-auto min-h-[80px] max-h-[220px]"
                            rows={1}
                            disabled={loading || disabled}
                            style={{ lineHeight: '1.5rem', fontSize: '17px' }}
                        />
                    </div>

                    <div className="flex w-full items-center justify-between gap-1">
                        {/* Left Side: Settings + Plus Menu */}
                        <div className="flex items-center gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onConfigPanelToggle}
                                className="group rounded-lg h-14 w-14 md:h-12 md:w-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white"
                                aria-label="Settings"
                            >
                                <SlidersHorizontal className="w-[20px] h-[20px]" />
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => supportsReference ? onImageUploadToggle() : fileInputRef.current?.click()}
                                disabled={loading || isUploading || disabled}
                                className="group rounded-lg h-14 w-14 md:h-12 md:w-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white disabled:opacity-40"
                                aria-label="Upload image"
                            >
                                <Plus className="w-[20px] h-[20px]" />
                            </Button>
                        </div>

                        {/* Right Side: Model Select + Enhance + Generate */}
                        <div className="flex items-center gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onModelSelectorToggle}
                                className="group rounded-lg h-14 w-auto px-3 md:h-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white min-w-[120px] max-w-[200px]"
                                aria-label="Select model"
                            >
                                <div className="flex items-center gap-1.5 truncate">
                                    <div className="w-5 h-5 flex-shrink-0">
                                        {imageModelIcons[selectedModelId] ? (
                                            typeof imageModelIcons[selectedModelId] === 'string' ? (
                                                <span className="text-lg">{imageModelIcons[selectedModelId]}</span>
                                            ) : (
                                                <Image
                                                    src={imageModelIcons[selectedModelId]}
                                                    alt={selectedModelId}
                                                    width={20}
                                                    height={20}
                                                    className="rounded-md"
                                                />
                                            )
                                        ) : (
                                            <ImageIcon className="w-5 h-5" />
                                        )}
                                    </div>
                                    <span className="text-xs md:text-sm font-medium truncate">
                                        {displayModelName}
                                    </span>
                                </div>
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onEnhancePrompt}
                                disabled={!prompt.trim() || loading || isEnhancing || isUploading || disabled}
                                className="group rounded-lg h-14 w-auto px-3 md:h-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white disabled:opacity-40"
                                aria-label="Enhance prompt"
                            >
                                <span className="text-xs md:text-sm font-medium">
                                    {isEnhancing ? 'Enhancing...' : 'Enhance'}
                                </span>
                            </Button>

                            <Button
                                type="submit"
                                variant="ghost"
                                disabled={loading || isUploading || (!prompt.trim() && uploadedImages.length === 0) || disabled}
                                className="group rounded-lg h-14 w-auto px-4 md:h-12 transition-colors duration-300 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-40 disabled:text-gray-600"
                                aria-label="Generate"
                            >
                                <span className="text-xs md:text-sm font-medium">
                                    {loading ? 'Generating...' : 'Generate'}
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                />
            </form>
        </div>
    );
};

export default VisualizeInputContainer;

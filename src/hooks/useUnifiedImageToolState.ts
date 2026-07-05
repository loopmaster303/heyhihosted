"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/components/LanguageProvider';
import { getPollenHeaders } from '@/lib/pollen-key';
import { getAspectRatioPresetsForModel } from '@/config/image-aspect-ratio-presets';
import { unifiedModelConfigs, getUnifiedModelConfig, type UnifiedModelConfig } from '@/config/unified-model-configs';
import { getUnifiedModel, getVisualizeModelGroupsForProvider, UNIFIED_IMAGE_MODELS, type ImageProvider } from '@/config/unified-image-models';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { DEFAULT_IMAGE_MODEL } from '@/config/chat-options';
import { uploadFileToPollinationsMedia } from '@/lib/upload/pollinations-media';
import { getClientSessionId } from '@/lib/session';
import type { UploadedReference } from '@/types';
import { useHasPollenKey } from './useHasPollenKey';

// Define which models need image upload (Pollinations reference models)
export const pollinationUploadModels = [
    ...UNIFIED_IMAGE_MODELS
        .filter(model => model.provider === 'pollinations' && model.supportsReference === true)
        .map(model => model.id),
];

function normalizeLegacyImageModelId(id: string): string {
    if (!id) return id;
    // Pollinations model ID drift + removals
    if (id === 'seedance-fast') return 'seedance';
    if (id === 'ltx-video') return 'ltx-2';
    if (id === 'z-image-turbo') return 'zimage';
    if (id === 'gptimage' || id === 'gpt-image-1-mini') return 'gpt-image';
    if (id === 'imagen' || id === 'imagen-4') return 'zimage';
    if (id === 'flux-2-pro' || id === 'flux-kontext-pro') return 'kontext';
    if (id === 'flux-2-max' || id === 'flux-2-klein-9b' || id === 'klein-large') return 'klein';
    if (id === 'flux-2-dev' || id === 'dirtberry') return 'flux';
    if (id === 'flux-klein') return 'klein';
    if (id === 'wan-video' || id === 'wan-2.5-t2v') return 'wan';
    if (id === 'grok-image') return 'grok-imagine';
    if (id === 'grok-imagine-video') return 'grok-video';
    if (id === 'seedream' || id === 'seedream-pro') return 'seedream5';
    return id;
}

export function useUnifiedImageToolState() {
    const { toast } = useToast();
    const { language } = useLanguage();
    const hasPollenKey = useHasPollenKey();

    // Model selection
    // Provider mode switch (Pollinations vs Pruna)
    const [providerMode, setProviderMode] = useLocalStorageState<'pollinations' | 'pruna'>('heyhi-provider-mode', 'pollinations');
    const [prunaAvailable, setPrunaAvailable] = useState<boolean>(false);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/capabilities')
            .then(res => res.json())
            .then(data => {
                if (cancelled) return;
                const available = !!data.prunaAvailable;
                setPrunaAvailable(available);
                if (!available && providerMode === 'pruna') {
                    setProviderMode('pollinations');
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setPrunaAvailable(false);
                    setProviderMode('pollinations');
                }
            });
        return () => { cancelled = true; };
    }, [providerMode, setProviderMode]);

    const [defaultImageModelId, setDefaultImageModelId] = useLocalStorageState<string>('defaultImageModelId', DEFAULT_IMAGE_MODEL);
    const normalizedDefaultImageModelId = useMemo(
        () => normalizeLegacyImageModelId(defaultImageModelId),
        [defaultImageModelId]
    );

    useEffect(() => {
        if (normalizedDefaultImageModelId !== defaultImageModelId) {
            setDefaultImageModelId(normalizedDefaultImageModelId);
        }
    }, [defaultImageModelId, normalizedDefaultImageModelId, setDefaultImageModelId]);

    const availableModels = useMemo(
        () => {
            const groups = getVisualizeModelGroupsForProvider(providerMode, { includeByopHidden: hasPollenKey });
            return groups.flatMap(g => g.models.map(m => m.id));
        },
        [providerMode, hasPollenKey]
    );
    const initialModelId = useMemo(() => {
        const model = getUnifiedModel(normalizedDefaultImageModelId);
        if (model?.provider === providerMode && availableModels.includes(normalizedDefaultImageModelId)) {
            return normalizedDefaultImageModelId;
        }
        if (providerMode === 'pollinations' && availableModels.includes('flux')) return 'flux';
        return availableModels[0] || DEFAULT_IMAGE_MODEL;
    }, [availableModels, normalizedDefaultImageModelId, providerMode]);
    const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId);
    const currentModelConfig = getUnifiedModelConfig(selectedModelId);

    // Reset selected model when provider mode changes (smart reset)
    useEffect(() => {
        setSelectedModelId(prev => {
            if (availableModels.includes(prev) || availableModels.length === 0) return prev;
            return providerMode === 'pollinations' && availableModels.includes('flux')
                ? 'flux'
                : availableModels[0];
        });
    }, [providerMode, availableModels]);

    // Form state
    const [prompt, setPrompt] = useState('');
    const [formFields, setFormFields] = useState<Record<string, any>>({});
    const [uploadedImages, setUploadedImages] = useState<UploadedReference[]>([]);
    const [sourceVideo, setSourceVideo] = useState<UploadedReference | null>(null);

    // UI Panels
    const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
    const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);

    // Status
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Derived states
    const isGptImage = selectedModelId === 'gpt-image' || selectedModelId === 'gptimage-large';
    const isSeedream = selectedModelId === 'seedream5';
    const isNanoPollen = selectedModelId === 'nanobanana' || selectedModelId === 'nanobanana-pro' || selectedModelId === 'nanobanana-2';
    
    // Dynamic check for any Pollinations image model
    const isPollenModel = useMemo(() => {
        const model = getUnifiedModel(selectedModelId);
        return model?.provider === 'pollinations' && currentModelConfig?.outputType !== 'video';
    }, [selectedModelId, currentModelConfig]);

    const isPollinationsVideo = currentModelConfig?.outputType === 'video' && getUnifiedModel(selectedModelId)?.provider === 'pollinations';

    // Supports Reference Check
    const supportsReference = useMemo(() => {
        const modelInfo = getUnifiedModel(selectedModelId);
        return modelInfo?.supportsReference === true;
    }, [selectedModelId]);

    // Source video check (for motion-transfer / video-replacement models)
    const requiresSourceVideo = useMemo(() => {
        return selectedModelId === 'p-video-animate' || selectedModelId === 'p-video-replace';
    }, [selectedModelId]);

    // Max images per model
    const maxImages = useMemo(() => {
        if (!supportsReference) return 0;
        
        // 1. Try to get from config (Single Source of Truth)
        const modelInfo = getUnifiedModel(selectedModelId);
        if (modelInfo?.maxImages !== undefined) {
            return modelInfo.maxImages;
        }

        // Default for Pollinations flux/kontext is usually 1 (prompt injection or img2img)
        if (selectedModelId === 'flux' || selectedModelId === 'kontext') return 1;

        return 0;
    }, [selectedModelId, supportsReference]);

    // Initialize form fields when model changes
    useEffect(() => {
        if (!currentModelConfig) return;

        // Preserve some fields if needed, or reset?
        // Logic from original tool:
        const initialFields: Record<string, any> = {};
        currentModelConfig.inputs.forEach(input => {
            if (!input.isPrompt && !input.hidden) {
                if (input.default !== undefined) {
                    initialFields[input.name] = input.default;
                }
            }
        });
        
        // Use standard preset for all Pollinations image models
        if (isPollenModel) {
            const presets = getAspectRatioPresetsForModel(selectedModelId);
            const preset = presets['1:1'];
            initialFields.aspect_ratio = '1:1';
            initialFields.width = preset.width;
            initialFields.height = preset.height;
        } else if (isPollinationsVideo) {
            const modelInfo = getUnifiedModel(selectedModelId);
            initialFields.aspect_ratio = '16:9';

            // Dynamic Duration Default
            if (modelInfo?.durationRange?.options && modelInfo.durationRange.options.length > 0) {
                 // Default to the first option (usually the lowest/fastest)
                 initialFields.duration = modelInfo.durationRange.options[0];
            } else {
                initialFields.duration = 5; // Fallback
            }

            // Dynamic Audio Default
            // Default to TRUE if supported
            if (modelInfo?.supportsAudio) {
                initialFields.audio = true;
            } else {
                 initialFields.audio = false;
            }
        }
        setFormFields(initialFields);
    }, [currentModelConfig, isPollenModel, isPollinationsVideo, selectedModelId]);

    // Clear uploaded images / source video if model doesn't support them
    useEffect(() => {
        if (!supportsReference) {
            setUploadedImages([]);
        }
        if (!requiresSourceVideo) {
            setSourceVideo(null);
        }
    }, [selectedModelId, supportsReference, requiresSourceVideo]);

    // Handle Model Switching - Truncate if necessary (Strict Pollinations Limit)
    useEffect(() => {
        if (!currentModelConfig) return;
        const modelInfo = getUnifiedModel(selectedModelId);
        // Only enforce strict truncation for Pollinations to avoid accidentally sending hidden images
        if (modelInfo?.provider === 'pollinations') {
            if (uploadedImages.length > maxImages) {
                // Truncate to maxImages
                const keptImages = uploadedImages.slice(0, maxImages);
                setUploadedImages(keptImages);

                // Optional: We could delete the extras here, but it's safer to just let them drop from state for now
                // as we don't want to accidentally delete a shared blob if the user just switched models back and forth.
                // The explicit delete happens on "Remove" or "Replace".
            }
        }
    }, [selectedModelId, maxImages, uploadedImages, currentModelConfig]);

    // Handle File Change (images only)
    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        const allUploadModels = [...pollinationUploadModels];
        const isSingleSlot = maxImages === 1;

        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            toast({ title: "Invalid File", description: "Please upload an image file.", variant: "destructive" });
            return;
        }

        if (allUploadModels.includes(selectedModelId)) {
            setIsUploading(true);

            if (isSingleSlot && imageFiles.length > 1) {
                toast({ title: "Limit Reached", description: "Only one reference image allowed for this model.", variant: "destructive" });
            }

            let currentImages = [...uploadedImages];
            const targetFiles = isSingleSlot ? imageFiles.slice(0, 1) : imageFiles;

            if (isSingleSlot && currentImages.length >= 1) {
                currentImages = [];
            }

            try {
                for (const file of targetFiles) {
                    if (currentImages.length >= maxImages) {
                        toast({ title: "Limit Reached", description: `Maximum ${maxImages} images allowed.`, variant: "destructive" });
                        break;
                    }

                    const sessionId = getClientSessionId();
                    const fileName = file.name || `upload-${Date.now()}.bin`;
                    const contentType = file.type || 'application/octet-stream';
                    const media = await uploadFileToPollinationsMedia(file, fileName, contentType, {
                        sessionId,
                        folder: 'uploads',
                    });
                    currentImages.push({
                        url: media.mediaUrl,
                        key: media.key,
                        expiresAt: Date.now() + media.expiresIn * 1000,
                    });
                }

                setUploadedImages(currentImages);
            } catch (err: any) {
                console.error('Upload error:', err);
                toast({ title: 'Upload failed', description: err.message || 'Could not upload image.', variant: 'destructive' });
            } finally {
                setIsUploading(false);
            }
            return;
        }

        // Local read fallback
        const localImages: UploadedReference[] = [];
        for (const file of imageFiles) {
            const dataUri = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('Failed to read image'));
                reader.readAsDataURL(file);
            });
            localImages.push({ url: dataUri });
        }
        if (localImages.length > 0) {
            setUploadedImages(prev => [...prev, ...localImages].slice(0, maxImages));
        }
    }, [selectedModelId, toast, maxImages, uploadedImages]);

    // Handle Source Video Change (video only)
    const handleSourceVideoFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        const videoFiles = files.filter(file => file.type.startsWith('video/'));
        if (videoFiles.length === 0) {
            toast({ title: "Invalid File", description: "Please upload a video file for this model.", variant: "destructive" });
            return;
        }
        if (videoFiles.length > 1) {
            toast({ title: "Limit Reached", description: "Only one source video allowed.", variant: "destructive" });
        }

        setIsUploading(true);
        try {
            const file = videoFiles[0];
            const sessionId = getClientSessionId();
            const fileName = file.name || `upload-${Date.now()}.bin`;
            const contentType = file.type || 'video/mp4';
            const media = await uploadFileToPollinationsMedia(file, fileName, contentType, {
                sessionId,
                folder: 'uploads',
            });
            setSourceVideo({
                url: media.mediaUrl,
                key: media.key,
                expiresAt: Date.now() + media.expiresIn * 1000,
            });
        } catch (err: any) {
            console.error('Video upload error:', err);
            toast({ title: 'Upload failed', description: err.message || 'Could not upload video.', variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    }, [toast]);

    // Handle Remove Image
    const handleRemoveImage = useCallback((index: number) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
    }, [setUploadedImages]);

    // Handle Remove Source Video
    const handleRemoveSourceVideo = useCallback(() => {
        setSourceVideo(null);
    }, [setSourceVideo]);

    // Handle Field Change
    const handleFieldChange = useCallback((name: string, value: any) => {
        setFormFields(prev => ({ ...prev, [name]: value }));
    }, []);

    // Enhance Prompt
    const handleEnhancePrompt = useCallback(async () => {
        if (!prompt.trim() || !selectedModelId || isEnhancing) return;

        setIsEnhancing(true);
        try {
            const response = await fetch('/api/enhance-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getPollenHeaders() },
                body: JSON.stringify({
                    prompt,
                    modelId: selectedModelId,
                    language,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || 'Failed to enhance prompt');
            }

            const result = await response.json();
            const enhanced = result.enhancedPrompt || prompt;

            setPrompt(enhanced);
            toast({ title: "Prompt Enhanced", description: "Your prompt has been improved using AI." });
        } catch (err: any) {
            console.error('Enhancement error:', err);
            toast({
                title: "Enhancement Failed",
                description: err instanceof Error ? err.message : "Could not enhance the prompt.",
                variant: "destructive",
            });
        } finally {
            setIsEnhancing(false);
        }
    }, [prompt, selectedModelId, isEnhancing, toast, language]);

    return {
        // State
        selectedModelId,
        setSelectedModelId,
        currentModelConfig,
        prompt,
        setPrompt,
        formFields,
        setFormFields,
        uploadedImages,
        setUploadedImages,
        sourceVideo,
        setSourceVideo,
        isModelSelectorOpen,
        setIsModelSelectorOpen,
        isConfigPanelOpen,
        setIsConfigPanelOpen,
        isImageUploadOpen,
        setIsImageUploadOpen,
        isEnhancing,
        isUploading,

        // Provider switch
        providerMode,
        setProviderMode,
        prunaAvailable,

        // Computed
        availableModels,
        supportsReference,
        requiresSourceVideo,
        maxImages,
        isGptImage,
        isSeedream,
        isNanoPollen,
        isPollenModel,
        isPollinationsVideo,

        // Actions
        handleFileChange,
        handleSourceVideoFileChange,
        handleRemoveImage,
        handleRemoveSourceVideo,
        handleFieldChange,
        handleEnhancePrompt,
    };
}

export type UnifiedImageToolState = ReturnType<typeof useUnifiedImageToolState>;

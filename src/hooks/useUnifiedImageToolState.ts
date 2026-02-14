"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/components/LanguageProvider';
import { unifiedModelConfigs, getUnifiedModelConfig, type UnifiedModelConfig } from '@/config/unified-model-configs';
import { getUnifiedModel } from '@/config/unified-image-models';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { DEFAULT_IMAGE_MODEL } from '@/config/chat-options';
import { uploadFileToS3WithKey } from '@/lib/upload/s3-upload';
import { getClientSessionId } from '@/lib/session';
import type { UploadedReference } from '@/types';

// Define which models need image upload
export const pollinationUploadModels = [
    'flux',
    'gpt-image',
    'gptimage-large',
    'seedream-pro',
    'seedream',
    'nanobanana',
    'nanobanana-pro',
    'klein-large',
    'kontext',
    'wan',
    'grok-video'
];

export const replicateUploadModels = [
    'flux-2-pro',
    'flux-kontext-pro',
    'wan-video',
    'z-image-turbo',
    'flux-2-max',
    'flux-2-klein-9b',
    'grok-imagine-video',
];

export const gptImagePresets: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1024, height: 1024 },
    '3:4': { width: 1024, height: 1536 },
    '4:3': { width: 1536, height: 1024 },
    '16:9': { width: 1536, height: 1024 },  // Closest valid option
    '9:16': { width: 1024, height: 1536 },  // Closest valid option
};

function normalizeLegacyImageModelId(id: string): string {
    if (!id) return id;
    // Pollinations model ID drift + removals
    if (id === 'seedance-fast') return 'seedance';
    if (id === 'ltx-video') return 'ltx-2';
    if (id === 'flux-2-dev') return 'flux';
    return id;
}

export function useUnifiedImageToolState() {
    const { toast } = useToast();
    const { language } = useLanguage();

    // Model selection
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
        () => Object.keys(unifiedModelConfigs).filter(id => getUnifiedModel(id)?.enabled ?? true),
        []
    );
    const initialModelId = availableModels.includes(normalizedDefaultImageModelId)
        ? normalizedDefaultImageModelId
        : (availableModels[0] || DEFAULT_IMAGE_MODEL);
    const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId);
    const currentModelConfig = getUnifiedModelConfig(selectedModelId);

    useEffect(() => {
        if (!availableModels.includes(selectedModelId) && availableModels.length > 0) {
            setSelectedModelId(availableModels[0]);
        }
    }, [availableModels, selectedModelId]);

    useEffect(() => {
        if (availableModels.includes(normalizedDefaultImageModelId)) {
            setSelectedModelId(normalizedDefaultImageModelId);
        }
    }, [availableModels, normalizedDefaultImageModelId, setSelectedModelId]);

    // Form state
    const [prompt, setPrompt] = useState('');
    const [formFields, setFormFields] = useState<Record<string, any>>({});
    const [uploadedImages, setUploadedImages] = useState<UploadedReference[]>([]);

    // UI Panels
    const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
    const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);

    // Status
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Derived states
    const isGptImage = selectedModelId === 'gpt-image' || selectedModelId === 'gptimage-large';
    const isSeedream = selectedModelId === 'seedream' || selectedModelId === 'seedream-pro';
    const isNanoPollen = selectedModelId === 'nanobanana' || selectedModelId === 'nanobanana-pro';
    
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

    // Max images per model
    const maxImages = useMemo(() => {
        if (!supportsReference) return 0;
        
        // 1. Try to get from config (Single Source of Truth)
        const modelInfo = getUnifiedModel(selectedModelId);
        if (modelInfo?.maxImages !== undefined) {
            return modelInfo.maxImages;
        }

        // 2. Fallbacks (Legacy)
        if (selectedModelId === 'flux-2-pro') return 8;
        if (selectedModelId === 'nanobanana-pro') return 14;
        if (selectedModelId === 'qwen-image-edit-plus') return 3;
        if (selectedModelId === 'flux-kontext-pro') return 1;
        if (selectedModelId === 'wan-video') return 1;
        
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
            const preset = gptImagePresets['1:1'];
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

    // Clear uploaded images if model doesn't support them
    useEffect(() => {
        if (!supportsReference) {
            setUploadedImages([]);
        }
    }, [selectedModelId, supportsReference]);

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

    // Handle File Change
    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) {
            toast({ title: "Invalid File", description: "Please upload an image file.", variant: "destructive" });
            return;
        }

        const modelInfo = getUnifiedModel(selectedModelId);
        const needsUpload = modelInfo?.provider === 'replicate' && modelInfo?.supportsReference;
        const allUploadModels = [...pollinationUploadModels, ...replicateUploadModels];
        const isPollinations = modelInfo?.provider === 'pollinations';

        if (needsUpload || allUploadModels.includes(selectedModelId)) {
            setIsUploading(true);

            if (isPollinations && maxImages === 1 && imageFiles.length > 1) {
                toast({ title: "Limit Reached", description: "Only one reference image allowed for this model.", variant: "destructive" });
            }

            let currentImages = [...uploadedImages];
            const targetFiles = isPollinations && maxImages === 1 ? imageFiles.slice(0, 1) : imageFiles;

            if (isPollinations && maxImages === 1 && currentImages.length >= 1) {
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
                    const signed = await uploadFileToS3WithKey(file, fileName, contentType, {
                        sessionId,
                        folder: 'uploads',
                    });
                    currentImages.push({
                        url: signed.downloadUrl,
                        key: signed.key,
                        expiresAt: Date.now() + signed.expiresIn * 1000,
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

    // Handle Remove Image
    const handleRemoveImage = useCallback((index: number) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
    }, [setUploadedImages]);

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
                headers: { 'Content-Type': 'application/json' },
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
            let enhanced = result.enhancedPrompt || prompt;

            // FORCE QUALITY TAGS for z-image-turbo
            if (selectedModelId === 'zimage' || selectedModelId === 'z-image-turbo') {
                const tags = "masterpiece, best quality, 8k uhd, hyperrealistic, ultra detailed, cinematic lighting";
                if (!enhanced.toLowerCase().includes('8k')) {
                    enhanced = `${enhanced.trim()}, ${tags}`;
                }
            }

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
        isModelSelectorOpen,
        setIsModelSelectorOpen,
        isConfigPanelOpen,
        setIsConfigPanelOpen,
        isImageUploadOpen,
        setIsImageUploadOpen,
        isEnhancing,
        isUploading,

        // Computed
        availableModels,
        supportsReference,
        maxImages,
        isGptImage,
        isSeedream,
        isNanoPollen,
        isPollenModel,
        isPollinationsVideo,

        // Actions
        handleFileChange,
        handleRemoveImage,
        handleFieldChange,
        handleEnhancePrompt,
    };
}

export type UnifiedImageToolState = ReturnType<typeof useUnifiedImageToolState>;

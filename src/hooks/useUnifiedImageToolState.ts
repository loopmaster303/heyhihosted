"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/components/LanguageProvider';
import { unifiedModelConfigs, getUnifiedModelConfig, type UnifiedModelConfig } from '@/config/unified-model-configs';
import { getUnifiedModel } from '@/config/unified-image-models';

// Define which models need image upload
export const pollinationUploadModels = [
    'flux',
    'gpt-image',
    'gptimage-large',
    'seedream-pro',
    'seedream',
    'nanobanana',
    'nanobanana-pro',
    'seedance-pro',
    'seedance',
    'veo'
];

export const replicateUploadModels = [
    'flux-2-pro',
    'flux-kontext-pro',
    'wan-video',
    'veo-3.1-fast',
    'z-image-turbo'
];

export const gptImagePresets: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1024, height: 1024 },
    '3:4': { width: 1024, height: 1536 },
    '4:3': { width: 1536, height: 1024 },
    '16:9': { width: 1536, height: 1024 },  // Closest valid option
    '9:16': { width: 1024, height: 1536 },  // Closest valid option
};

export function useUnifiedImageToolState() {
    const { toast } = useToast();
    const { language } = useLanguage();

    // Model selection
    const availableModels = Object.keys(unifiedModelConfigs).filter(id => getUnifiedModel(id)?.enabled ?? true);
    const [selectedModelId, setSelectedModelId] = useState<string>(availableModels[0] || 'flux-2-pro');
    const currentModelConfig = getUnifiedModelConfig(selectedModelId);

    // Form state
    const [prompt, setPrompt] = useState('');
    const [formFields, setFormFields] = useState<Record<string, any>>({});
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);

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
    const isPollenModel = isGptImage || isSeedream || isNanoPollen || selectedModelId === 'flux' || selectedModelId === 'kontext' || selectedModelId === 'zimage';
    const isPollinationsVideo = currentModelConfig?.outputType === 'video' && getUnifiedModel(selectedModelId)?.provider === 'pollinations';

    // Supports Reference Check
    const supportsReference = useMemo(() => {
        const modelInfo = getUnifiedModel(selectedModelId);
        return modelInfo?.supportsReference === true;
    }, [selectedModelId]);

    // Max images per model
    const maxImages = useMemo(() => {
        if (!supportsReference) return 0;
        if (selectedModelId === 'flux-2-pro') return 8;
        if (selectedModelId === 'nanobanana-pro') return 14;
        if (selectedModelId === 'qwen-image-edit-plus') return 3;
        if (selectedModelId === 'flux-kontext-pro') return 1;
        if (selectedModelId === 'wan-video') return 1;
        if (selectedModelId === 'veo-3.1-fast') return 1;
        if (selectedModelId === 'seedance-pro') return 1;
        if (selectedModelId === 'seedance') return 1;
        if (selectedModelId === 'veo') return 1;
        if (selectedModelId === 'seedream-pro') return 8;
        if (selectedModelId === 'seedream') return 8;
        if (selectedModelId === 'gpt-image') return 8;
        if (selectedModelId === 'gptimage-large') return 8;
        if (selectedModelId === 'nanobanana' || selectedModelId === 'nanobanana-pro') return 8;
        
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
        if (isGptImage || isSeedream || isNanoPollen || selectedModelId === 'flux' || selectedModelId === 'kontext') {
            const preset = gptImagePresets['1:1'];
            initialFields.aspect_ratio = '1:1';
            initialFields.width = preset.width;
            initialFields.height = preset.height;
        } else if (isPollinationsVideo) {
            initialFields.aspect_ratio = '16:9';
            initialFields.duration = selectedModelId === 'veo' ? 6 : 6;
            if (selectedModelId === 'veo') {
                initialFields.audio = false;
            }
        }
        setFormFields(initialFields);
    }, [currentModelConfig, isGptImage, isSeedream, isNanoPollen, isPollinationsVideo, selectedModelId]);

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
                const oldUrl = currentImages[0];
                fetch('/api/upload', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: oldUrl })
                }).catch(err => console.error("Failed to delete old image blob:", err));
                currentImages = [];
            }

            try {
                for (const file of targetFiles) {
                    if (currentImages.length >= maxImages) {
                        toast({ title: "Limit Reached", description: `Maximum ${maxImages} images allowed.`, variant: "destructive" });
                        break;
                    }

                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await fetch('/api/upload', { method: 'POST', body: formData });
                    if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        throw new Error(data.error || 'Upload failed');
                    }
                    const data = await res.json();
                    if (!data?.url) {
                        throw new Error('No URL returned from upload');
                    }
                    currentImages.push(data.url);
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
        const localImages: string[] = [];
        for (const file of imageFiles) {
            const dataUri = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('Failed to read image'));
                reader.readAsDataURL(file);
            });
            localImages.push(dataUri);
        }
        if (localImages.length > 0) {
            setUploadedImages(prev => [...prev, ...localImages].slice(0, maxImages));
        }
    }, [selectedModelId, toast, maxImages, uploadedImages]);

    // Handle Remove Image
    const handleRemoveImage = useCallback((index: number) => {
        const imageToRemove = uploadedImages[index];
        const modelInfo = getUnifiedModel(selectedModelId);

        // Strict: Only delete from blob if it is a Pollinations model (as per requirements)
        if (modelInfo?.provider === 'pollinations' && imageToRemove && imageToRemove.startsWith('http')) {
            fetch('/api/upload', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: imageToRemove })
            }).catch(err => console.error("Failed to delete image blob:", err));
        }

        setUploadedImages(prev => prev.filter((_, i) => i !== index));
    }, [uploadedImages, selectedModelId]);

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
            setPrompt(result.enhancedPrompt || prompt);
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

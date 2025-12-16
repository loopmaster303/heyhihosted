"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/components/LanguageProvider';
import { unifiedModelConfigs, getUnifiedModelConfig, type UnifiedModelConfig } from '@/config/unified-model-configs';
import { getUnifiedModel } from '@/config/unified-image-models';

// Define which models need image upload
export const pollinationUploadModels = [
    'gpt-image',
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
    'qwen-image-edit-plus',
    'flux-kontext-pro',
    'wan-video',
    'veo-3.1-fast',
    'z-image-turbo'
];

export const gptImagePresets: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1440, height: 1440 },
    '3:4': { width: 1248, height: 1664 },
    '4:3': { width: 1664, height: 1248 },
    '16:9': { width: 1920, height: 1080 },
    '9:16': { width: 1080, height: 1920 },
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
    const isGptImage = selectedModelId === 'gpt-image';
    const isSeedream = selectedModelId === 'seedream' || selectedModelId === 'seedream-pro';
    const isNanoPollen = selectedModelId === 'nanobanana' || selectedModelId === 'nanobanana-pro';
    const isPollenModel = isGptImage || isSeedream || isNanoPollen;
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
        if (selectedModelId === 'veo') return 1;
        if (selectedModelId === 'seedream-pro') return 8;
        if (selectedModelId === 'seedream') return 8;
        if (selectedModelId === 'gpt-image') return 8;
        if (selectedModelId === 'nanobanana' || selectedModelId === 'nanobanana-pro') return 8;
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
        if (isGptImage || isSeedream || isNanoPollen) {
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

    // Handle File Change
    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({ title: "Invalid File", description: "Please upload an image file.", variant: "destructive" });
            return;
        }

        const modelInfo = getUnifiedModel(selectedModelId);
        const needsUpload = modelInfo?.provider === 'replicate' && modelInfo?.supportsReference;
        const allUploadModels = [...pollinationUploadModels, ...replicateUploadModels];

        if (needsUpload || allUploadModels.includes(selectedModelId)) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            fetch('/api/upload', { method: 'POST', body: formData })
                .then(async (res) => {
                    if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        throw new Error(data.error || 'Upload failed');
                    }
                    return res.json();
                })
                .then((data) => {
                    if (data?.url) {
                        setUploadedImages((prev) => [...prev, data.url]);
                    } else {
                        throw new Error('No URL returned from upload');
                    }
                })
                .catch((err) => {
                    console.error('Upload error:', err);
                    toast({ title: 'Upload failed', description: err.message || 'Could not upload image.', variant: 'destructive' });
                })
                .finally(() => {
                    setIsUploading(false);
                    // Reset input via ref in UI component
                });
            return;
        }

        // Local read (data uri) fallback if needed, but the original code mostly uploads now or reads data URI
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUri = reader.result as string;
            setUploadedImages(prev => [...prev, dataUri]);
        };
        reader.readAsDataURL(file);

    }, [selectedModelId, toast]);

    // Handle Remove Image
    const handleRemoveImage = useCallback((index: number) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
    }, []);

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

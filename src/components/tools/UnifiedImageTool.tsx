"use client";

/* eslint-disable react-hooks/exhaustive-deps, @next/next/no-img-element */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import useEscapeKey from '@/hooks/useEscapeKey';
import { getUnifiedModel } from '@/config/unified-image-models';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { generateUUID } from '@/lib/uuid';
import type { ImageHistoryItem } from '@/types';
import { useLanguage } from '../LanguageProvider';
import { useUnifiedImageToolState } from '@/hooks/useUnifiedImageToolState';
import VisualizeInputContainer from '@/components/tools/VisualizeInputContainer';

const IMAGE_HISTORY_KEY = 'imageHistory';

interface UnifiedImageToolProps {
  password?: string;
  sharedToolState?: ReturnType<typeof useUnifiedImageToolState>;
}

const UnifiedImageTool: React.FC<UnifiedImageToolProps> = ({ password, sharedToolState }) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  // Use shared state if provided, otherwise create local state
  // This allows VisualizeProPage to pass its state so TopModelBar and this tool stay in sync
  const localToolState = useUnifiedImageToolState();
  const toolState = sharedToolState || localToolState;

  // DEBUG
  console.log('[DEBUG UnifiedImageTool] sharedToolState provided?', !!sharedToolState);
  console.log('[DEBUG UnifiedImageTool] toolState.selectedModelId:', toolState.selectedModelId);
  console.log('[DEBUG UnifiedImageTool] localToolState.selectedModelId:', localToolState.selectedModelId);

  const {
    selectedModelId,
    currentModelConfig,
    prompt,
    setPrompt,
    formFields,
    setFormFields,
    uploadedImages,
    setUploadedImages,
    availableModels, // used to check if models exist
  } = toolState;

  // Local Tool State (History, Display)
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageHistoryItem | null>(null);
  const [imageReloadCount, setImageReloadCount] = useState(0);

  // History Panel State (Only local to this parent view, as input container doesn't show history)
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const historyPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Load history from localStorage
    try {
      const stored = localStorage.getItem(IMAGE_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
          if (parsed.length > 0) {
            setSelectedImage(parsed[0]);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load history from localStorage:', e);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (!mounted) return;
    try {
      if (history.length > 0) {
        localStorage.setItem(IMAGE_HISTORY_KEY, JSON.stringify(history));
      } else {
        localStorage.removeItem(IMAGE_HISTORY_KEY);
      }
    } catch (e) {
      console.error('Failed to save history to localStorage:', e);
    }
  }, [history, mounted]);

  // Handle Submission Logic (API Call) - This stays here or could be moved to another hook, but keeping here for now as it orchestrates generation.
  // Actually, we should use the hook's state to submit.
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim() && uploadedImages.length === 0) {
      toast({ title: "Prompt Required", description: "Please enter a prompt or upload images.", variant: "destructive" });
      return;
    }

    if (!currentModelConfig) return;

    setLoading(true);
    setSelectedImage(null);

    try {
      const modelInfo = getUnifiedModel(selectedModelId);
      const isPollinationsModel = modelInfo?.provider === 'pollinations';

      const payload: Record<string, any> = isPollinationsModel
        ? {
          model: selectedModelId,
          prompt: prompt.trim() || '',
          private: true,
        }
        : {
          model: selectedModelId,
          password: password || '',
          prompt: prompt.trim() || '',
        };

      // Add input images if uploaded
      // Mapping logic similar to before...
      if (uploadedImages.length > 0) {
        if (selectedModelId === 'flux-2-pro') {
          payload.input_images = uploadedImages;
        } else if (selectedModelId === 'flux-kontext-pro') {
          payload.input_image = uploadedImages[0];
        } else if (selectedModelId === 'wan-video' || selectedModelId === 'veo-3.1-fast') {
          payload.image = uploadedImages[0];
        } else if (isPollinationsModel) {
          // Pollinations models (gpt-image, seedream, seedream-pro, nanobanana, nanobanana-pro, seedance-pro, veo)
          // expect image as array of URLs
          payload.image = uploadedImages.slice(0, 8);
        }
      }

      // Handle dimensions/aspect ratio
      if (isPollinationsModel) {
        if (currentModelConfig?.outputType === 'video') {
          if (formFields.aspect_ratio) payload.aspectRatio = formFields.aspect_ratio;
          if (formFields.duration) payload.duration = Number(formFields.duration);
          if (selectedModelId === 'veo' && typeof formFields.audio !== 'undefined') {
            payload.audio = Boolean(formFields.audio);
          }
        } else {
          // Validate width/height for Azure GPT Image API - only certain sizes are allowed
          const validSizes = [
            { width: 1024, height: 1024 },
            { width: 1536, height: 1024 },
            { width: 1024, height: 1536 },
          ];
          let width = formFields.width || 1024;
          let height = formFields.height || 1024;

          // Check if current size is valid, otherwise fallback to 1024x1024
          const isValidSize = validSizes.some(s => s.width === width && s.height === height);
          if (!isValidSize) {
            console.warn(`Invalid size ${width}x${height}, falling back to 1024x1024`);
            width = 1024;
            height = 1024;
          }

          payload.width = width;
          payload.height = height;
        }
        payload.quality = 'hd';
      } else if (selectedModelId === 'z-image-turbo') {
        const aspectRatio = formFields.aspect_ratio || '1:1';
        const aspectRatioMap: Record<string, { width: number; height: number }> = {
          '1:1': { width: 1024, height: 1024 },
          '4:3': { width: 1024, height: 768 },
          '3:4': { width: 768, height: 1024 },
          '16:9': { width: 1344, height: 768 },
          '9:16': { width: 768, height: 1344 },
        };
        const dimensions = aspectRatioMap[aspectRatio] || { width: 1024, height: 1024 };
        payload.width = dimensions.width;
        payload.height = dimensions.height;
      } else {
        if (formFields.aspect_ratio) payload.aspect_ratio = formFields.aspect_ratio;
        if (formFields.size) payload.size = formFields.size;

        // Pass duration for Replicate models if present (e.g. wan, veo-replicate)
        if (formFields.duration) payload.duration = Number(formFields.duration);

        if (formFields.aspect_ratio === 'match_input_image') {
          payload.resolution = 'match_input_image';
        } else if (formFields.aspect_ratio !== 'custom' && formFields.resolution) {
          payload.resolution = formFields.resolution;
        }
      }

      // Hidden fields
      if (!isPollinationsModel) {
        if (selectedModelId === 'flux-2-pro') {
          payload.safety_tolerance = 5;
          payload.output_quality = 100;
        } else if (selectedModelId === 'nanobanana-pro') {
          payload.safety_filter_level = 'block_only_high';
        } else if (selectedModelId === 'z-image-turbo') {
          payload.output_quality = 100;
        }
      }

      if (formFields.seed !== undefined && formFields.seed !== '') {
        payload.seed = Number(formFields.seed);
      }

      if (!isPollinationsModel) {
        if (selectedModelId === 'flux-2-pro') {
          payload.output_format = formFields.output_format || 'webp';
        } else if (selectedModelId === 'nanobanana-pro' || selectedModelId === 'qwen-image-edit-plus') {
          payload.output_format = formFields.output_format || 'jpg';
        } else if (selectedModelId === 'z-image-turbo') {
          payload.output_format = formFields.output_format || 'jpg';
        } else if (currentModelConfig?.outputType === 'video') {
          payload.output_format = formFields.output_format || 'mp4';
        }
      }

      const endpoint = modelInfo?.provider === 'pollinations' ? '/api/generate' : '/api/replicate';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || `API request failed with status ${response.status}`);
      }

      if (data.output || data.imageUrl) {
        const resultUrl = data.imageUrl || (Array.isArray(data.output) ? data.output[0] : data.output);
        const isVideo = currentModelConfig?.outputType === 'video';

        if (typeof resultUrl === 'string' && resultUrl.trim() !== '') {
          const newHistoryItem: ImageHistoryItem = {
            id: generateUUID(),
            imageUrl: isVideo ? '' : resultUrl,
            videoUrl: isVideo ? resultUrl : undefined,
            prompt: prompt || (isVideo ? 'Video generation' : 'Image generation'),
            model: currentModelConfig.name,
            timestamp: new Date().toISOString(),
            toolType: 'premium imagination'
          };
          setHistory(prev => [newHistoryItem, ...prev]);
          setSelectedImage(newHistoryItem);
          toast({ title: "Generation Succeeded!", description: `${currentModelConfig.name} finished processing.` });
        } else {
          throw new Error("Received empty or invalid output URL from API.");
        }
      } else {
        throw new Error(data.error || "Unknown error occurred.");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      toast({ title: "Generation Failed", description: err.message || 'An unknown error occurred.', variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [prompt, uploadedImages, currentModelConfig, selectedModelId, password, formFields, toast]);


  // Import logic from localStorage handling...
  // The hook can handle initialization, but here we might need to handle the specific "passed from landing" event
  // However, since we refactored Landing to pass state via LocalStorage and the hook might not auto-read that specific "transition" state unless we teach it.
  // OR, we keep that logic here.
  // IMPORTANT: Skip hydration if sharedToolState is provided - the parent owns the state!

  useEffect(() => {
    // Skip hydration if using shared state from parent
    if (sharedToolState) return;

    try {
      const storedState = localStorage.getItem('unified-image-tool-state');
      if (storedState) {
        const parsed = JSON.parse(storedState);
        // Hydrate state
        if (parsed.prompt) setPrompt(parsed.prompt);
        if (parsed.selectedModelId) toolState.setSelectedModelId(parsed.selectedModelId);
        if (parsed.formFields) setFormFields(parsed.formFields);
        if (parsed.uploadedImages) setUploadedImages(parsed.uploadedImages);

        localStorage.removeItem('unified-image-tool-state');
      } else {
        // Fallback to old simple draft
        const storedDraft = localStorage.getItem('unified-image-tool-draft');
        if (storedDraft) {
          setPrompt(storedDraft);
          localStorage.removeItem('unified-image-tool-draft');
        }
      }
    } catch (error) {
      console.error("Failed to hydrate state", error);
    }
  }, [sharedToolState]); // Run once on mount, skip if shared

  if (!mounted) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (availableModels.length === 0) {
    return <div className="p-10 text-center">No models available</div>;
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <main className="flex-grow flex flex-col px-4 pt-6 pb-4 md:px-6 md:pt-8 md:pb-6 space-y-4 overflow-y-auto no-scrollbar">
        <Card className="flex-grow flex flex-col border-0 shadow-none">
          <CardContent className="p-2 md:p-4 flex-grow bg-card rounded-b-lg flex flex-col">
            {selectedImage ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="relative w-full h-full max-w-4xl mx-auto">
                  {selectedImage.videoUrl ? (
                    <video controls src={selectedImage.videoUrl} className="w-full h-full rounded-lg" style={{ objectFit: 'contain' }} />
                  ) : (
                    <img
                      src={`${selectedImage.imageUrl}${selectedImage.imageUrl?.includes('?') ? '&' : '?'}r=${imageReloadCount}`}
                      alt={selectedImage.prompt}
                      className="w-full h-full object-contain rounded-lg"
                      onError={() => setTimeout(() => setImageReloadCount(c => c + 1), 800)}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full"></div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="px-4 sm:px-8 md:px-12 lg:px-20 xl:px-32 pt-2 pb-4 shrink-0">
        <div className="max-w-6xl mx-auto relative">
          <VisualizeInputContainer
            // Props from Hook
            {...toolState}
            onPromptChange={toolState.setPrompt}
            onModelChange={toolState.setSelectedModelId}
            onModelSelectorToggle={() => toolState.setIsModelSelectorOpen(!toolState.isModelSelectorOpen)}
            onConfigPanelToggle={() => toolState.setIsConfigPanelOpen(!toolState.isConfigPanelOpen)}
            onImageUploadToggle={() => toolState.setIsImageUploadOpen(!toolState.isImageUploadOpen)}
            onEnhancePrompt={toolState.handleEnhancePrompt}

            // Submit Logic
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>
      </footer>
    </div>
  );
};

export default UnifiedImageTool;

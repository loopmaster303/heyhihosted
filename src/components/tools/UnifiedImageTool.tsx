"use client";

/* eslint-disable react-hooks/exhaustive-deps, @next/next/no-img-element */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { getUnifiedModel } from '@/config/unified-image-models';
import { generateUUID } from '@/lib/uuid';
import type { ImageHistoryItem } from '@/types';
import { useLanguage } from '../LanguageProvider';
import { useUnifiedImageToolState } from '@/hooks/useUnifiedImageToolState';
import VisualizeInputContainer from '@/components/tools/VisualizeInputContainer';
import { persistRemoteImage } from '@/lib/services/local-image-storage';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImageHistory } from '@/hooks/useImageHistory';

const MAX_REFERENCE_IMAGES = 14;

interface UnifiedImageToolProps {
  password?: string;
  sharedToolState?: ReturnType<typeof useUnifiedImageToolState>;
}

const UnifiedImageTool: React.FC<UnifiedImageToolProps> = ({ password, sharedToolState }) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  
  // Use the central history hook for all history operations
  const { addImageToHistory, imageHistory } = useImageHistory();

  const localToolState = useUnifiedImageToolState();
  const toolState = sharedToolState || localToolState;

  const {
    selectedModelId,
    currentModelConfig,
    prompt,
    setPrompt,
    formFields,
    setFormFields,
    uploadedImages,
    setUploadedImages,
    availableModels,
  } = toolState;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageHistoryItem | null>(null);
  const [imageReloadCount, setImageReloadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    // Load most recent image if available
    if (imageHistory.length > 0 && !selectedImage) {
        // setSelectedImage(imageHistory[0]); // Optional: auto-select recent
    }
  }, [imageHistory]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!prompt.trim() && uploadedImages.length === 0) {
      toast({ title: "Prompt Required", variant: "destructive" });
      return;
    }

    if (!currentModelConfig) return;

    setLoading(true);
    setSelectedImage(null);

    try {
      // 1. Handle Reference Images (Proxy Upload)
      let referenceUrls: string[] = [];
      if (uploadedImages.length > 0) {
        toast({ title: "Uploading references...", description: `Preparing ${uploadedImages.length} images.` });
        
        const uploadPromises = uploadedImages.slice(0, MAX_REFERENCE_IMAGES).map(async (img) => {
          if (img.startsWith('http') && !img.includes('blob:')) return img;
          try {
            const blobResponse = await fetch(img);
            const blob = await blobResponse.blob();
            const formData = new FormData();
            formData.append('file', blob, 'ref.png');
            
            const res = await fetch('/api/upload/temp', { method: 'POST', body: formData });
            const data = await res.json();
            return data.url;
          } catch (e) {
            console.error('Upload failed', e);
            return null;
          }
        });
        
        const results = await Promise.all(uploadPromises);
        referenceUrls = results.filter(url => !!url) as string[];
      }

      const modelInfo = getUnifiedModel(selectedModelId);
      const isPollinations = modelInfo?.provider === 'pollinations';

      // 2. Prepare Enriched Prompt with Image Labels (IMAGE_1, IMAGE_2...)
      let enrichedPrompt = prompt.trim();
      if (referenceUrls.length > 0) {
          const imageList = referenceUrls.map((url, i) => `IMAGE_${i+1}: ${url}`).join('\n');
          enrichedPrompt = `User provided the following reference images:\n${imageList}\n\nTask: ${prompt.trim()}`;
      }

      const payload: any = {
        prompt: enrichedPrompt,
        model: selectedModelId,
        width: formFields.width || 1024,
        height: formFields.height || 1024,
        image: referenceUrls,
        private: true,
        quality: 'hd',
        nologo: true,
        // AUTOMATIC QUALITY BOOST: Standard anti-matsch list for better results
        negative_prompt: "blur, low quality, distorted, bad anatomy, pixelated, watermark, text, signature, ugly, bad hands, deformed, grainy"
      };

      if (formFields.seed) payload.seed = Number(formFields.seed);
      if (isPollinations) {
          if (formFields.enhance) payload.enhance = true;
          if (formFields.transparent) payload.transparent = true;
      }

      if (!isPollinations) {
        payload.password = password || '';
      }

      const endpoint = isPollinations ? '/api/generate' : '/api/replicate';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed");

      let resultUrl = data.imageUrl || (Array.isArray(data.output) ? data.output[0] : data.output);
      const isVideo = currentModelConfig?.outputType === 'video';
      const itemId = generateUUID();

      // 2. Persist to Vault
      if (!isVideo && typeof resultUrl === 'string') {
        toast({ title: "Saving...", description: "Adding to local vault." });
        resultUrl = await persistRemoteImage(itemId, resultUrl);
      }

      const newHistoryItem: ImageHistoryItem = {
        id: itemId,
        imageUrl: isVideo ? '' : resultUrl,
        videoUrl: isVideo ? resultUrl : undefined,
        prompt: prompt || 'Generation',
        model: currentModelConfig.name,
        timestamp: new Date().toISOString(),
        toolType: 'visualize'
      };

      // USE HOOK TO ADD - This updates both tool AND sidebar
      addImageToHistory(newHistoryItem);
      setSelectedImage(newHistoryItem);
      toast({ title: "Success!", description: "Content is now in your local vault." });

    } catch (err: any) {
      console.error("Generation error:", err);
      const msg = err.message || 'An unknown error occurred.';
      setError(msg);
      toast({ title: "Failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [prompt, uploadedImages, currentModelConfig, selectedModelId, password, formFields, toast, addImageToHistory]);

  // Handle shared state hydration (if needed for prompts)
  useEffect(() => {
    if (sharedToolState) return;
    try {
      const storedState = localStorage.getItem('unified-image-tool-state');
      if (storedState) {
        const parsed = JSON.parse(storedState);
        if (parsed.prompt) setPrompt(parsed.prompt);
        if (parsed.selectedModelId) toolState.setSelectedModelId(parsed.selectedModelId);
        if (parsed.formFields) setFormFields(parsed.formFields);
        if (parsed.uploadedImages) setUploadedImages(parsed.uploadedImages);
        localStorage.removeItem('unified-image-tool-state');
      }
    } catch (error) {
      console.error("Failed to hydrate state", error);
    }
  }, [sharedToolState]);

  if (!mounted) return <div className="p-10 text-center">Loading...</div>;
  if (availableModels.length === 0) return <div className="p-10 text-center">No models available</div>;

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <main className="flex-grow flex flex-col px-4 pt-6 pb-4 md:px-6 md:pt-8 md:pb-6 space-y-4 overflow-y-auto no-scrollbar">
        <Card className="flex-grow flex flex-col border-0 shadow-none">
          <CardContent className="p-2 md:p-4 flex-grow bg-card rounded-b-lg flex flex-col relative">
            {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 animate-in fade-in">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm font-medium animate-pulse text-muted-foreground">Creating masterpiece...</p>
                </div>
            ) : error ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-destructive p-8 text-center animate-in zoom-in-95 duration-300">
                    <div className="p-4 rounded-full bg-destructive/10">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold">Generation Failed</h3>
                        <p className="text-sm opacity-80 max-w-md">{error}</p>
                    </div>
                    <Button variant="outline" onClick={() => setError(null)} className="mt-4">
                        Try Again
                    </Button>
                </div>
            ) : selectedImage ? (
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
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <Button size="icon" variant="secondary" onClick={() => window.open(selectedImage.videoUrl || selectedImage.imageUrl, '_blank')}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center opacity-20">
                <p>Start generating to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="px-4 sm:px-8 md:px-12 lg:px-20 xl:px-32 pt-2 pb-4 shrink-0">
        <div className="max-w-6xl mx-auto relative">
          <VisualizeInputContainer
            {...toolState}
            onPromptChange={toolState.setPrompt}
            onModelChange={toolState.setSelectedModelId}
            onModelSelectorToggle={() => toolState.setIsModelSelectorOpen(prev => !prev)}
            onConfigPanelToggle={() => toolState.setIsConfigPanelOpen(!toolState.isConfigPanelOpen)}
            onImageUploadToggle={() => toolState.setIsImageUploadOpen(!toolState.isImageUploadOpen)}
            onEnhancePrompt={toolState.handleEnhancePrompt}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>
      </footer>
    </div>
  );
};

export default UnifiedImageTool;

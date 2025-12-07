"use client";

/* eslint-disable react-hooks/exhaustive-deps, @next/next/no-img-element */

/**
 * Unified Image Tool
 * New unified interface for image generation models
 * Starting with Flux 2 Pro
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X, FileImage, Plus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import useEscapeKey from '@/hooks/useEscapeKey';
import NextImage from 'next/image';
import { unifiedModelConfigs, getUnifiedModelConfig, type UnifiedModelConfig } from '@/config/unified-model-configs';
import { getUnifiedModel } from '@/config/unified-image-models';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { generateUUID } from '@/lib/uuid';
import type { ImageHistoryItem } from '@/types';
import ImageHistoryGallery from './ImageHistoryGallery';
import { useLanguage } from '../LanguageProvider';

const IMAGE_HISTORY_KEY = 'imageHistory';

interface UnifiedImageToolProps {
  password?: string;
}

const UnifiedImageTool: React.FC<UnifiedImageToolProps> = ({ password }) => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  
  // Model selection
  const availableModels = Object.keys(unifiedModelConfigs);
  const [selectedModelId, setSelectedModelId] = useState<string>(availableModels[0] || 'flux-2-pro');
  const currentModelConfig = getUnifiedModelConfig(selectedModelId);
  
  // Form state
  const [prompt, setPrompt] = useState('');
  const [formFields, setFormFields] = useState<Record<string, any>>({});
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if model supports reference images
  const supportsReference = useMemo(() => {
    const modelInfo = getUnifiedModel(selectedModelId);
    return modelInfo?.supportsReference === true;
  }, [selectedModelId]);

  // Max images per model
  const maxImages = useMemo(() => {
    if (!supportsReference) return 0;
    if (selectedModelId === 'flux-2-pro') return 8;
    if (selectedModelId === 'nano-banana-pro') return 14;
    if (selectedModelId === 'qwen-image-edit-plus') return 3;
    if (selectedModelId === 'flux-kontext-pro') return 1;
    if (selectedModelId === 'wan-video') return 1; // I2V needs 1 image
    if (selectedModelId === 'veo-3.1-fast') return 1; // Can use reference image
    if (selectedModelId === 'seedance-pro') return 1; // Can use reference image
    return 0; // Other models don't support images
  }, [selectedModelId, supportsReference]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageHistoryItem | null>(null);
  const [imageReloadCount, setImageReloadCount] = useState(0);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  const [openConfigParam, setOpenConfigParam] = useState<'aspect_ratio' | 'resolution' | 'output_format' | null>(null);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  
  const historyPanelRef = useRef<HTMLDivElement>(null);
  const configPanelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useOnClickOutside([historyPanelRef, configPanelRef], () => {
    setIsHistoryPanelOpen(false);
    setIsConfigPanelOpen(false);
  }, 'radix-select-content');

  useEscapeKey(() => setIsHistoryPanelOpen(false), isHistoryPanelOpen);
  useEscapeKey(() => setIsConfigPanelOpen(false), isConfigPanelOpen);

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

  // Initialize form fields when model changes
  useEffect(() => {
    if (!currentModelConfig) return;
    
    const initialFields: Record<string, any> = {};
    currentModelConfig.inputs.forEach(input => {
      if (!input.isPrompt && !input.hidden) {
        if (input.default !== undefined) {
          initialFields[input.name] = input.default;
        }
      }
    });
    setFormFields(initialFields);
  }, [currentModelConfig]);

  // Clear uploaded images when model changes to one that doesn't support reference images
  useEffect(() => {
    if (!supportsReference) {
      setUploadedImages([]);
      setFormFields(prevFields => {
        const newFields = { ...prevFields };
        delete newFields.input_images;
        delete newFields.image_input;
        delete newFields.input_image;
        delete newFields.image;
        delete newFields.referenceImage;
        return newFields;
      });
    }
  }, [selectedModelId, supportsReference]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 80), 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [prompt]);

  // Listen for reuse prompt from sidebar/gallery
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<string>;
      if (typeof custom.detail === 'string') {
        setPrompt(custom.detail);
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.style.height = 'auto';
          const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 80), 200);
          textareaRef.current.style.height = `${newHeight}px`;
        }
      }
    };
    window.addEventListener('sidebar-reuse-prompt', handler);
    // preload prompt once from storage if destined for visualize
    try {
      const storedTarget = localStorage.getItem('sidebar-preload-target');
      const storedPrompt = localStorage.getItem('sidebar-preload-prompt');
      if (storedPrompt && storedTarget === 'visualize') {
        setPrompt(storedPrompt);
        localStorage.removeItem('sidebar-preload-prompt');
        localStorage.removeItem('sidebar-preload-target');
      }
    } catch {}
    return () => window.removeEventListener('sidebar-reuse-prompt', handler);
  }, []);

  // Handle file upload (only one image)
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File", description: "Please upload an image file.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUri = reader.result as string;
      setUploadedImages(prev => {
        const newImages = [...prev, dataUri];
        // Set field name based on model
        if (selectedModelId === 'flux-2-pro') {
          setFormFields(prevFields => ({ ...prevFields, input_images: newImages }));
        } else if (selectedModelId === 'nano-banana-pro') {
          setFormFields(prevFields => ({ ...prevFields, image_input: newImages }));
        }
        return newImages;
      });
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [toast]);

  const handleRemoveImage = useCallback((index: number) => {
    setUploadedImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // Update form fields
      if (newImages.length === 0) {
        setFormFields(prevFields => {
          const newFields = { ...prevFields };
          if (selectedModelId === 'flux-2-pro') {
            delete newFields.input_images;
          } else if (selectedModelId === 'nano-banana-pro') {
            delete newFields.image_input;
          }
          return newFields;
        });
      } else {
        if (selectedModelId === 'flux-2-pro') {
          setFormFields(prevFields => ({ ...prevFields, input_images: newImages }));
        } else if (selectedModelId === 'nano-banana-pro') {
          setFormFields(prevFields => ({ ...prevFields, image_input: newImages }));
        }
      }
      return newImages;
    });
  }, [selectedModelId]);

  // Handle form field changes
  const handleFieldChange = useCallback((name: string, value: any) => {
    setFormFields(prev => ({ ...prev, [name]: value }));
  }, []);

  // Check if resolution should be shown (hidden when aspect_ratio is 'custom')
  const shouldShowResolution = useMemo(() => {
    const aspectRatio = formFields.aspect_ratio || '1:1';
    return aspectRatio !== 'custom';
  }, [formFields.aspect_ratio]);
  
  // Update resolution when aspect_ratio changes to match_input_image
  useEffect(() => {
    if (formFields.aspect_ratio === 'match_input_image' && formFields.resolution !== 'match_input_image') {
      setFormFields(prev => ({ ...prev, resolution: 'match_input_image' }));
    } else if (formFields.aspect_ratio === 'custom') {
      // Clear resolution when custom is selected
      setFormFields(prev => {
        const newFields = { ...prev };
        delete newFields.resolution;
        return newFields;
      });
    }
  }, [formFields.aspect_ratio]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim() && uploadedImages.length === 0) {
      toast({ title: "Prompt Required", description: "Please enter a prompt or upload images.", variant: "destructive" });
      return;
    }

    if (!currentModelConfig) return;

    setLoading(true);
    setError(null);
    setSelectedImage(null);

    try {
      // Build payload based on provider
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

      // Add input images if uploaded (field name depends on model)
      if (uploadedImages.length > 0) {
        if (selectedModelId === 'flux-2-pro') {
          payload.input_images = uploadedImages;
        } else if (selectedModelId === 'nano-banana-pro' || selectedModelId === 'qwen-image-edit-plus') {
          payload.image_input = uploadedImages;
        } else if (selectedModelId === 'flux-kontext-pro') {
          payload.input_image = uploadedImages[0];
        } else if (selectedModelId === 'wan-video' || selectedModelId === 'veo-3.1-fast') {
          payload.image = uploadedImages[0];
        } else if (selectedModelId === 'seedance-pro') {
          // Pollinations uses different field
          payload.referenceImage = uploadedImages[0];
        }
      }

      // Handle dimensions/aspect ratio/resolution (model-specific)
      if (isPollinationsModel) {
        // Pollinations: Use width/height
        if (formFields.width) payload.width = formFields.width;
        if (formFields.height) payload.height = formFields.height;
        
        // Video-specific params
        if (currentModelConfig?.outputType === 'video') {
          if (formFields.aspectRatio) payload.aspectRatio = formFields.aspectRatio;
          if (formFields.duration) payload.duration = formFields.duration;
        }
      } else if (selectedModelId === 'z-image-turbo') {
        // Z-Image-Turbo: Convert aspect_ratio to height/width
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
        // Replicate models: Use aspect_ratio/resolution
        if (formFields.aspect_ratio) {
          payload.aspect_ratio = formFields.aspect_ratio;
        }
        if (formFields.size) payload.size = formFields.size; // Wan models
        if (formFields.duration) payload.duration = formFields.duration; // Video models

        // Handle resolution
        if (formFields.aspect_ratio === 'match_input_image') {
          payload.resolution = 'match_input_image';
        } else if (formFields.aspect_ratio !== 'custom' && formFields.resolution) {
          payload.resolution = formFields.resolution;
        }
      }

      // Always send hidden fields (model-specific)
      if (!isPollinationsModel) {
        if (selectedModelId === 'flux-2-pro') {
          payload.safety_tolerance = 5;
          payload.output_quality = 100;
        } else if (selectedModelId === 'nano-banana-pro') {
          payload.safety_filter_level = 'block_only_high';
        } else if (selectedModelId === 'z-image-turbo') {
          payload.output_quality = 100;
        }
      }
      // Pollinations models use defaults from API

      // Add seed if provided
      if (formFields.seed !== undefined && formFields.seed !== '') {
        payload.seed = Number(formFields.seed);
      }

      // Add output_format (default depends on model)
      if (!isPollinationsModel) {
        if (selectedModelId === 'flux-2-pro') {
          payload.output_format = formFields.output_format || 'webp';
        } else if (selectedModelId === 'nano-banana-pro' || selectedModelId === 'qwen-image-edit-plus') {
          payload.output_format = formFields.output_format || 'jpg';
        } else if (selectedModelId === 'z-image-turbo') {
          payload.output_format = formFields.output_format || 'jpg';
        } else if (currentModelConfig?.outputType === 'video') {
          payload.output_format = formFields.output_format || 'mp4';
        }
      }
      // Pollinations handles format automatically

      // Determine endpoint based on provider
      const model = getUnifiedModel(selectedModelId);
      const endpoint = model?.provider === 'pollinations' ? '/api/generate' : '/api/replicate';
      
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
      const errorMessage = err.message || 'An unknown error occurred.';
      setError(errorMessage);
      toast({ title: "Generation Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [prompt, uploadedImages, currentModelConfig, selectedModelId, password, formFields, toast]);

  const handleEnhancePrompt = useCallback(async () => {
    if (!prompt.trim() || !selectedModelId || isEnhancing) return;

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          modelId: selectedModelId,
          language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Enhancement API error:', errorData);
        throw new Error(errorData.error || 'Failed to enhance prompt');
      }

      const result = await response.json();
      const enhanced = result.enhancedPrompt || prompt;
      setPrompt(enhanced);
      // Adjust textarea height after programmatic update
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 80), 200);
        textareaRef.current.style.height = `${newHeight}px`;
      }
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

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    setSelectedImage(null);
    localStorage.removeItem(IMAGE_HISTORY_KEY);
    toast({ title: "History Cleared", description: "Your image generation history has been removed." });
  }, [toast]);

  const handleSelectHistoryItem = useCallback((item: ImageHistoryItem) => {
    setSelectedImage(item);
    setPrompt(item.prompt);
    setImageReloadCount(0);
    setIsHistoryPanelOpen(false);
  }, []);

  const toggleHistoryPanel = useCallback(() => {
    if (isConfigPanelOpen) setIsConfigPanelOpen(false);
    setIsHistoryPanelOpen(prev => !prev);
  }, [isConfigPanelOpen]);

  const toggleConfigPanel = useCallback(() => {
    if (isHistoryPanelOpen) setIsHistoryPanelOpen(false);
    setIsConfigPanelOpen(prev => !prev);
  }, [isHistoryPanelOpen]);

  if (!mounted) {
    return (
      <div className="flex flex-col h-full bg-background text-foreground">
        <main className="flex-grow flex flex-col px-4 pt-6 pb-4 md:px-6 md:pt-8 md:pb-6 space-y-4 overflow-y-auto no-scrollbar">
          <Card className="flex-grow flex flex-col border-0 shadow-none">
            <CardContent className="p-2 md:p-4 flex-grow bg-card rounded-b-lg flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center text-muted-foreground font-code">
                <p className="text-lg">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (availableModels.length === 0) {
    return (
      <div className="flex flex-col h-full bg-background text-foreground">
        <main className="flex-grow flex flex-col px-4 pt-6 pb-4 md:px-6 md:pt-8 md:pb-6 space-y-4 overflow-y-auto no-scrollbar">
          <Card className="flex-grow flex flex-col border-0 shadow-none">
            <CardContent className="p-2 md:p-4 flex-grow bg-card rounded-b-lg flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center text-muted-foreground font-code">
                <p className="text-lg">No models available</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
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
                    <video 
                      src={selectedImage.videoUrl} 
                      controls 
                      className="w-full h-full rounded-lg"
                      style={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <img
                      src={
                        selectedImage.imageUrl
                          ? `${selectedImage.imageUrl}${selectedImage.imageUrl.includes('?') ? '&' : '?'}r=${imageReloadCount}`
                          : ''
                      }
                      alt={selectedImage.prompt}
                      className="w-full h-full object-contain rounded-lg"
                      onError={() => {
                        if (imageReloadCount < 3) {
                          setTimeout(() => setImageReloadCount((c) => c + 1), 800);
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground font-code">
                <p className="text-lg">Generated content will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="px-6 sm:px-12 md:px-20 lg:px-32 xl:px-48 pt-2 pb-4 shrink-0">
        <div className="max-w-4xl mx-auto relative">
          {/* Model Selector Popup */}
          {isModelSelectorOpen && (
            <div className="mb-4 bg-popover text-popover-foreground rounded-xl shadow-xl border border-border p-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Select Model</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsModelSelectorOpen(false)}>
                  <X className="w-4 h-4 mr-1.5" />
                  Close
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* TEXT → IMAGE */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">TEXT → IMAGE</h4>
                  <div className="space-y-1">
                    {['gpt-image', 'seedream-pro', 'flux-kontext-pro', 'z-image-turbo'].map(id => (
                      <button
                        key={id}
                        onClick={() => { setSelectedModelId(id); setIsModelSelectorOpen(false); }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-lg transition-colors"
                      >
                        {getUnifiedModelConfig(id)?.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TEXT + MULTI-IMAGE → IMAGE */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">TEXT + MULTI-IMAGE → IMAGE</h4>
                  <div className="space-y-1">
                    {['flux-2-pro', 'nano-banana-pro'].map(id => (
                      <button
                        key={id}
                        onClick={() => { setSelectedModelId(id); setIsModelSelectorOpen(false); }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-lg transition-colors"
                      >
                        {getUnifiedModelConfig(id)?.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* IMAGE → IMAGE (EDIT / I2I) */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">IMAGE → IMAGE (EDIT / I2I)</h4>
                  <div className="space-y-1">
                    {['flux-kontext-pro', 'qwen-image-edit-plus'].map(id => (
                      <button
                        key={id}
                        onClick={() => { setSelectedModelId(id); setIsModelSelectorOpen(false); }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-lg transition-colors"
                      >
                        {getUnifiedModelConfig(id)?.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TEXT + IMAGE → VIDEO */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">TEXT + IMAGE → VIDEO</h4>
                  <div className="space-y-1">
                    {['seedance-pro', 'veo', 'wan-2.5-t2v', 'wan-video', 'veo-3.1-fast'].map(id => (
                      <button
                        key={id}
                        onClick={() => { setSelectedModelId(id); setIsModelSelectorOpen(false); }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-lg transition-colors"
                      >
                        {getUnifiedModelConfig(id)?.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Config Panel */}
          {isConfigPanelOpen && currentModelConfig && (
            <div 
              ref={configPanelRef}
              className="mb-4 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border p-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold">Configuration</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsConfigPanelOpen(false)}>
                  <X className="w-4 h-4 mr-1.5" />
                  Close
                </Button>
              </div>
              
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {/* Aspect Ratio */}
                {currentModelConfig.inputs.find(i => i.name === 'aspect_ratio') && (
                  <div className="space-y-2">
                    <Label>Aspect Ratio</Label>
                    <Select
                      value={formFields.aspect_ratio || '1:1'}
                      onValueChange={(value) => handleFieldChange('aspect_ratio', value)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                  </div>
                )}

                {/* Resolution (conditional, model-specific) - only for Flux 2 Pro and Nano Banana Pro */}
                {selectedModelId !== 'z-image-turbo' && shouldShowResolution && currentModelConfig.inputs.find(i => i.name === 'resolution') && (
                  <div className="space-y-2">
                    <Label>Resolution</Label>
                    <Select
                      value={formFields.resolution || (selectedModelId === 'nano-banana-pro' ? '2K' : '1 MP')}
                      onValueChange={(value) => handleFieldChange('resolution', value)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedModelId === 'flux-2-pro' && (
                          <>
                            {formFields.aspect_ratio === 'match_input_image' && (
                              <SelectItem value="match_input_image">Match Input Image</SelectItem>
                            )}
                            <SelectItem value="0.5 MP">0.5 MP</SelectItem>
                            <SelectItem value="1 MP">1 MP</SelectItem>
                            <SelectItem value="2 MP">2 MP</SelectItem>
                            <SelectItem value="4 MP">4 MP</SelectItem>
                          </>
                        )}
                        {selectedModelId === 'nano-banana-pro' && (
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
                {currentModelConfig.inputs.find(i => i.name === 'seed') && (
                  <div className="space-y-2">
                    <Label>Seed</Label>
                    <Input
                      type="number"
                      placeholder="Leave blank for random"
                      value={formFields.seed || ''}
                      onChange={(e) => handleFieldChange('seed', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                )}

                {/* Output Format (model-specific options) */}
                {currentModelConfig.inputs.find(i => i.name === 'output_format') && (
                  <div className="space-y-2">
                    <Label>Output Format</Label>
                    <Select
                      value={formFields.output_format || (selectedModelId === 'flux-2-pro' ? 'webp' : 'jpg')}
                      onValueChange={(value) => handleFieldChange('output_format', value)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedModelId === 'flux-2-pro' && (
                          <>
                            <SelectItem value="webp">WebP</SelectItem>
                            <SelectItem value="jpg">JPG</SelectItem>
                            <SelectItem value="png">PNG</SelectItem>
                          </>
                        )}
                        {(selectedModelId === 'nano-banana-pro' || selectedModelId === 'qwen-image-edit-plus') && (
                          <>
                            <SelectItem value="jpg">JPG</SelectItem>
                            <SelectItem value="png">PNG</SelectItem>
                            <SelectItem value="webp">WebP</SelectItem>
                          </>
                        )}
                        {selectedModelId === 'z-image-turbo' && (
                          <>
                            <SelectItem value="jpg">JPG</SelectItem>
                            <SelectItem value="png">PNG</SelectItem>
                            <SelectItem value="webp">WebP</SelectItem>
                          </>
                        )}
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
                <Button variant="ghost" size="sm" onClick={() => setIsImageUploadOpen(false)}>
                  <X className="w-4 h-4 mr-1.5" />
                  Close
                </Button>
              </div>
              
              {/* Upload Area */}
              {uploadedImages.length < maxImages && (
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer mb-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileImage className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedModelId === 'flux-2-pro' && 'Up to 8 images supported'}
                    {selectedModelId === 'nano-banana-pro' && 'Up to 14 images supported'}
                    {selectedModelId === 'qwen-image-edit-plus' && 'Up to 3 images supported'}
                    {selectedModelId === 'flux-kontext-pro' && 'One image required for editing'}
                    {selectedModelId === 'wan-video' && 'One image required for animation'}
                    {selectedModelId === 'veo-3.1-fast' && 'Optional reference image'}
                    {selectedModelId === 'seedance-pro' && 'Optional reference image'}
                  </p>
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
                      <p className="text-xs text-muted-foreground text-center">Image {index + 1}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="bg-pink-100 dark:bg-[#252525] text-gray-800 dark:text-white rounded-3xl shadow-lg relative">
              {/* Main content area */}
              <div className="px-6 pt-5 pb-16">
                <Textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to see..."
                  className="w-full bg-transparent text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 border-0 shadow-none px-0 py-0 m-0 leading-relaxed resize-none overflow-hidden font-normal min-h-[80px]"
                  rows={1}
                  disabled={loading}
                  style={{ fontSize: '20px', lineHeight: '1.6' }}
                />
              </div>

              {/* Fixed bottom area */}
              <div className="absolute bottom-0 left-0 right-0 px-6 pb-4 flex items-center justify-between">
                {/* Left: Model Selector + Image Upload Icon */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                    className="text-sm font-medium text-gray-800 dark:text-white hover:opacity-70 transition-opacity"
                  >
                    {currentModelConfig?.name || 'Select Model'}
                  </button>

                  {/* Add images - Text only */}
                  {supportsReference && (
                    <button
                      type="button"
                      onClick={() => setIsImageUploadOpen(!isImageUploadOpen)}
                      disabled={loading}
                      className="text-sm font-medium text-gray-800 dark:text-white hover:opacity-70 transition-opacity disabled:opacity-40"
                    >
                      Add images
                    </button>
                  )}
                </div>

                {/* Right: Text Buttons - ALWAYS TEXT, NO ICONS */}
                <div className="flex items-center gap-5">
                  {/* Enhance Prompt - Text only */}
                  <button
                    type="button"
                    onClick={handleEnhancePrompt}
                    disabled={!prompt.trim() || loading || isEnhancing}
                    className="text-sm font-medium text-gray-800 dark:text-white hover:opacity-70 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isEnhancing ? 'Enhancing...' : 'Enhance prompt'}
                  </button>

                  {/* Generate - Text only */}
                  <button
                    type="submit"
                    disabled={loading || (!prompt.trim() && uploadedImages.length === 0)}
                    className="text-sm font-medium text-gray-800 dark:text-white hover:opacity-70 transition-opacity disabled:opacity-40"
                  >
                    {loading ? 'Generating...' : 'Generate'}
                  </button>
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

          <div className="mt-3 px-1">
            {/* Gallery - hidden but kept in code */}
            <button
              type="button"
              className="hidden text-left text-foreground text-xl font-bold font-code select-none truncate opacity-40 cursor-not-allowed px-2 py-1 rounded-md"
              disabled
            >
              Gallery
            </button>

            {/* Configuration params - distributed evenly, horizontal expansion */}
            <div className="flex items-center justify-between gap-6 relative">
              {/* Aspect Ratio */}
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setOpenConfigParam('aspect_ratio')}
                  onMouseLeave={() => setOpenConfigParam(null)}
                  className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                >
                  Aspect Ratio {formFields.aspect_ratio || '1:1'}
                </button>
                
                {/* Horizontal expansion to the right */}
                {openConfigParam === 'aspect_ratio' && (
                  <div 
                    className="absolute left-0 top-0 flex items-center gap-2 bg-background px-3 py-1.5 rounded-full animate-in fade-in-0 slide-in-from-left-2 duration-200 shadow-lg z-10"
                    onMouseEnter={() => setOpenConfigParam('aspect_ratio')}
                    onMouseLeave={() => setOpenConfigParam(null)}
                  >
                    {selectedModelId === 'z-image-turbo' ? (
                      <>
                        {['1:1', '4:3', '3:4', '16:9', '9:16'].map(ratio => (
                          <button
                            key={ratio}
                            type="button"
                            onClick={() => { handleFieldChange('aspect_ratio', ratio); setOpenConfigParam(null); }}
                            className="text-sm px-2 py-0.5 hover:text-primary transition-colors"
                          >
                            {ratio}
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        {['1:1', '16:9', '3:2', '2:3', '4:5', '9:16', '3:4', '4:3'].map(ratio => (
                          <button
                            key={ratio}
                            type="button"
                            onClick={() => { handleFieldChange('aspect_ratio', ratio); setOpenConfigParam(null); }}
                            className="text-sm px-2 py-0.5 hover:text-primary transition-colors"
                          >
                            {ratio}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Resolution (conditional) */}
              {selectedModelId !== 'z-image-turbo' && shouldShowResolution && (
                <div className="relative">
                  <button
                    type="button"
                    onMouseEnter={() => setOpenConfigParam('resolution')}
                    onMouseLeave={() => setOpenConfigParam(null)}
                    className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                  >
                    Resolution {formFields.resolution || (selectedModelId === 'nano-banana-pro' ? '2K' : '1 MP')}
                  </button>
                  
                  {/* Horizontal expansion to the right */}
                  {openConfigParam === 'resolution' && (
                    <div 
                      className="absolute left-0 top-0 flex items-center gap-2 bg-background px-3 py-1.5 rounded-full animate-in fade-in-0 slide-in-from-left-2 duration-200 shadow-lg z-10"
                      onMouseEnter={() => setOpenConfigParam('resolution')}
                      onMouseLeave={() => setOpenConfigParam(null)}
                    >
                      {selectedModelId === 'nano-banana-pro' ? (
                        <>
                          {['1K', '2K', '4K'].map(res => (
                            <button
                              key={res}
                              type="button"
                              onClick={() => { handleFieldChange('resolution', res); setOpenConfigParam(null); }}
                              className="text-sm px-2 py-0.5 hover:text-primary transition-colors"
                            >
                              {res}
                            </button>
                          ))}
                        </>
                      ) : (
                        <>
                          {['0.5 MP', '1 MP', '2 MP', '4 MP'].map(res => (
                            <button
                              key={res}
                              type="button"
                              onClick={() => { handleFieldChange('resolution', res); setOpenConfigParam(null); }}
                              className="text-sm px-2 py-0.5 hover:text-primary transition-colors"
                            >
                              {res}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Output Format */}
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setOpenConfigParam('output_format')}
                  onMouseLeave={() => setOpenConfigParam(null)}
                  className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                >
                  Output Format {(formFields.output_format || (selectedModelId === 'flux-2-pro' ? 'webp' : 'jpg')).toUpperCase()}
                </button>
                
                {/* Horizontal expansion to the LEFT */}
                {openConfigParam === 'output_format' && (
                  <div 
                    className="absolute right-0 top-0 flex items-center gap-2 bg-background px-3 py-1.5 rounded-full animate-in fade-in-0 slide-in-from-right-2 duration-200 shadow-lg z-10"
                    onMouseEnter={() => setOpenConfigParam('output_format')}
                    onMouseLeave={() => setOpenConfigParam(null)}
                  >
                    {selectedModelId === 'flux-2-pro' ? (
                      <>
                        {['webp', 'jpg', 'png'].map(format => (
                          <button
                            key={format}
                            type="button"
                            onClick={() => { handleFieldChange('output_format', format); setOpenConfigParam(null); }}
                            className="text-sm px-2 py-0.5 hover:text-primary transition-colors"
                          >
                            {format.toUpperCase()}
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        {['jpg', 'png', 'webp'].map(format => (
                          <button
                            key={format}
                            type="button"
                            onClick={() => { handleFieldChange('output_format', format); setOpenConfigParam(null); }}
                            className="text-sm px-2 py-0.5 hover:text-primary transition-colors"
                          >
                            {format.toUpperCase()}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {isHistoryPanelOpen && (
            <div 
              ref={historyPanelRef}
              className="absolute bottom-full mb-2 left-0 w-full bg-popover text-popover-foreground rounded-lg shadow-xl border border-border p-2 z-30 animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
            >
              <ImageHistoryGallery
                history={history}
                onSelectImage={handleSelectHistoryItem}
                onClearHistory={handleClearHistory}
                onClose={() => setIsHistoryPanelOpen(false)}
              />
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default UnifiedImageTool;

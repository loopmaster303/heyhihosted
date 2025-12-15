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
import { X, FileImage, Plus, Loader2, SlidersHorizontal, Image as ImageIcon } from 'lucide-react';
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

// Model Icons
import OpenAIIcon from '../../../icons models/openai.png';
import GoogleIcon from '../../../icons models/google-color.png';
import ByteDanceIcon from '../../../icons models/bytedance-color.png';
import FluxIcon from '../../../icons models/flux.png';
import BFLIcon from '../../../icons models/bfl.png';
import QwenIcon from '../../../icons models/qwen-color.png';
import WANIcon from '../../../icons models/wan.png';

// Model Icon Mapping for Image Models
const imageModelIcons: Record<string, any> = {
  'gpt-image': OpenAIIcon,
  'seedream': ByteDanceIcon,
  'seedream-pro': ByteDanceIcon,
  'seedance': ByteDanceIcon, // Added missing seedance icon
  'seedance-pro': ByteDanceIcon,
  'nanobanana': '🍌', // Banana emoji for nanobanana
  'nanobanana-pro': '🍌', // Banana emoji for nanobanana pro
  'flux-2-pro': BFLIcon,
  'flux-kontext-pro': BFLIcon,
  'veo': GoogleIcon,
  'veo-3.1-fast': GoogleIcon,
  'wan-2.5-t2v': WANIcon, // Updated to use WAN icon
  'wan-video': WANIcon, // Updated to use WAN icon
  'z-image-turbo': WANIcon, // Updated to use WAN icon (Alibaba/WAN)
  'qwen-image-edit-plus': QwenIcon,
};

const IMAGE_HISTORY_KEY = 'imageHistory';

// Define which models need image upload
const pollinationUploadModels = [
  'gpt-image',
  'seedream-pro',
  'seedream',
  'nanobanana',
  'nanobanana-pro',
  'seedance-pro',
  'seedance',
  'veo'
];

const replicateUploadModels = [
  'flux-2-pro',
  'qwen-image-edit-plus',
  'flux-kontext-pro',
  'wan-video',
  'veo-3.1-fast',
  'z-image-turbo'
];

interface UnifiedImageToolProps {
  password?: string;
}

const UnifiedImageTool: React.FC<UnifiedImageToolProps> = ({ password }) => {
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  // Model selection
  const availableModels = Object.keys(unifiedModelConfigs).filter(id => getUnifiedModel(id)?.enabled ?? true);
  const [selectedModelId, setSelectedModelId] = useState<string>(availableModels[0] || 'flux-2-pro');
  const currentModelConfig = getUnifiedModelConfig(selectedModelId);

  // Form state
  const [prompt, setPrompt] = useState('');
  const [formFields, setFormFields] = useState<Record<string, any>>({});
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isGptImage = selectedModelId === 'gpt-image';
  const isSeedream = selectedModelId === 'seedream' || selectedModelId === 'seedream-pro';
  const isNanoPollen = selectedModelId === 'nanobanana' || selectedModelId === 'nanobanana-pro';
  const isPollenModel = isGptImage || isSeedream || isNanoPollen;
  const isPollinationsVideo = currentModelConfig?.outputType === 'video' && getUnifiedModel(selectedModelId)?.provider === 'pollinations';
  const modelPlaceholderKey: Record<string, string> = {
    'gpt-image': 'imageGen.placeholder.gptImage',
    'seedream': 'imageGen.placeholder.seedream',
    'seedream-pro': 'imageGen.placeholder.seedreamPro',
    'nanobanana': 'imageGen.placeholder.nanobanana',
    'nanobanana-pro': 'imageGen.placeholder.nanobananaPro',
    'flux-kontext-pro': 'imageGen.placeholder.fluxKontextPro',
    'z-image-turbo': 'imageGen.placeholder.zImageTurbo',
    'flux-2-pro': 'imageGen.placeholder.flux2Pro',
    'qwen-image-edit-plus': 'imageGen.placeholder.qwenImageEditPlus',
    'seedance-pro': 'imageGen.placeholder.seedancePro',
    'veo': 'imageGen.placeholder.veo',
    'wan-2.5-t2v': 'imageGen.placeholder.wanT2V',
    'wan-video': 'imageGen.placeholder.wanI2V',
    'veo-3.1-fast': 'imageGen.placeholder.veoFast',
  };
  const placeholderText = t(modelPlaceholderKey[selectedModelId] || 'imageGen.placeholderDefault');

  // Check if model supports reference images
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
    if (selectedModelId === 'wan-video') return 1; // I2V needs 1 image
    if (selectedModelId === 'veo-3.1-fast') return 1; // Can use reference image
    if (selectedModelId === 'seedance-pro') return 1; // Can use reference image
    if (selectedModelId === 'veo') return 1; // Pollinations Veo supports one ref
    if (selectedModelId === 'seedream-pro') return 8;
    if (selectedModelId === 'seedream') return 8;
    if (selectedModelId === 'gpt-image') return 8;
    if (selectedModelId === 'nanobanana' || selectedModelId === 'nanobanana-pro') return 8;
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
  const [isUploading, setIsUploading] = useState(false);
  const [openConfigParam, setOpenConfigParam] = useState<'aspect_ratio' | 'resolution' | 'output_format' | null>(null);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

  const historyPanelRef = useRef<HTMLDivElement>(null);
  const configPanelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gptImagePresets: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1440, height: 1440 },
    '3:4': { width: 1248, height: 1664 },
    '4:3': { width: 1664, height: 1248 },
    '16:9': { width: 1920, height: 1080 },
    '9:16': { width: 1080, height: 1920 },
  };

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

  // Clear uploaded images when switching between models with different field requirements
  useEffect(() => {
    setUploadedImages([]);
    setFormFields(prevFields => {
      const newFields = { ...prevFields };
      // Clear all image-related fields when switching models
      delete newFields.input_images;
      delete newFields.image_input;
      delete newFields.input_image;
      delete newFields.image;
      delete newFields.referenceImage;
      return newFields;
    });
  }, [selectedModelId]);

  const TEXTAREA_MIN_HEIGHT = 100;
  const TEXTAREA_MAX_HEIGHT = 260; // allow scrolling beyond this height

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(
        Math.max(textareaRef.current.scrollHeight, TEXTAREA_MIN_HEIGHT),
        TEXTAREA_MAX_HEIGHT
      );
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [prompt]);

  // Listen for reuse prompt from sidebar/gallery and draft from landing page
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<string>;
      if (typeof custom.detail === 'string') {
        setPrompt(custom.detail);
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.style.height = 'auto';
          const newHeight = Math.min(
            Math.max(textareaRef.current.scrollHeight, TEXTAREA_MIN_HEIGHT),
            TEXTAREA_MAX_HEIGHT
          );
          textareaRef.current.style.height = `${newHeight}px`;
        }
      }
    };
    window.addEventListener('sidebar-reuse-prompt', handler);
    return () => window.removeEventListener('sidebar-reuse-prompt', handler);
  }, []);

  // Load draft prompt from localStorage (set by visualizepro page)
  useEffect(() => {
    try {
      const storedDraft = localStorage.getItem('unified-image-tool-draft');
      if (storedDraft) {
        setPrompt(storedDraft);
        localStorage.removeItem('unified-image-tool-draft');
        // Auto-focus and resize textarea
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.style.height = 'auto';
            const newHeight = Math.min(
              Math.max(textareaRef.current.scrollHeight, TEXTAREA_MIN_HEIGHT),
              TEXTAREA_MAX_HEIGHT
            );
            textareaRef.current.style.height = `${newHeight}px`;
          }
        }, 100);
      }
    } catch (error) {
      console.error('Failed to load draft from localStorage:', error);
    }
  }, []);

  // preload prompt once from storage if destined for visualize
  useEffect(() => {
    try {
      const storedTarget = localStorage.getItem('sidebar-preload-target');
      const storedPrompt = localStorage.getItem('sidebar-preload-prompt');
      if (storedPrompt && storedTarget === 'visualize') {
        setPrompt(storedPrompt);
        localStorage.removeItem('sidebar-preload-prompt');
        localStorage.removeItem('sidebar-preload-target');
      }
    } catch { }
  }, []);

  // Handle file upload (only one image)
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
          if (fileInputRef.current) fileInputRef.current.value = '';
        });
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
        } else if (selectedModelId === 'nanobanana-pro') {
          setFormFields(prevFields => ({ ...prevFields, image_input: newImages }));
        } else if (selectedModelId === 'qwen-image-edit-plus') {
          setFormFields(prevFields => ({ ...prevFields, image_input: newImages }));
        } else if (selectedModelId === 'flux-kontext-pro') {
          setFormFields(prevFields => ({ ...prevFields, input_image: newImages[0] }));
        } else if (selectedModelId === 'wan-video' || selectedModelId === 'veo-3.1-fast') {
          setFormFields(prevFields => ({ ...prevFields, image: newImages[0] }));
        }
        return newImages;
      });
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [toast, selectedModelId]);

  const handleRemoveImage = useCallback((index: number) => {
    setUploadedImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // Update form fields
      if (newImages.length === 0) {
        setFormFields(prevFields => {
          const newFields = { ...prevFields };
          if (selectedModelId === 'flux-2-pro') {
            delete newFields.input_images;
          } else if (selectedModelId === 'nanobanana-pro' || selectedModelId === 'qwen-image-edit-plus') {
            delete newFields.image_input;
          } else if (selectedModelId === 'flux-kontext-pro') {
            delete newFields.input_image;
          } else if (selectedModelId === 'wan-video' || selectedModelId === 'veo-3.1-fast') {
            delete newFields.image;
          }
          return newFields;
        });
      } else {
        if (selectedModelId === 'flux-2-pro') {
          setFormFields(prevFields => ({ ...prevFields, input_images: newImages }));
        } else if (selectedModelId === 'nanobanana-pro' || selectedModelId === 'qwen-image-edit-plus') {
          setFormFields(prevFields => ({ ...prevFields, image_input: newImages }));
        } else if (selectedModelId === 'flux-kontext-pro') {
          setFormFields(prevFields => ({ ...prevFields, input_image: newImages[0] }));
        } else if (selectedModelId === 'wan-video' || selectedModelId === 'veo-3.1-fast') {
          setFormFields(prevFields => ({ ...prevFields, image: newImages[0] }));
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
        } else if (selectedModelId === 'nanobanana-pro' || selectedModelId === 'qwen-image-edit-plus') {
          payload.image_input = uploadedImages;
        } else if (selectedModelId === 'flux-kontext-pro') {
          payload.input_image = uploadedImages[0];
        } else if (selectedModelId === 'wan-video' || selectedModelId === 'veo-3.1-fast') {
          payload.image = uploadedImages[0];
        } else if (selectedModelId === 'seedance-pro' || selectedModelId === 'veo') {
          // Pollinations video: reference image
          payload.image = uploadedImages.slice(0, maxImages).join(',');
        } else if (
          selectedModelId === 'gpt-image' ||
          selectedModelId === 'seedream-pro' ||
          selectedModelId === 'seedream' ||
          selectedModelId === 'nanobanana' ||
          selectedModelId === 'nanobanana-pro'
        ) {
          payload.image = uploadedImages.slice(0, maxImages).join(',');
        }
      }

      // Handle dimensions/aspect ratio/resolution (model-specific)
      if (isPollinationsModel) {
        // Pollinations: images use width/height; video uses aspectRatio/duration/audio
        if (currentModelConfig?.outputType === 'video') {
          if (formFields.aspect_ratio) payload.aspectRatio = formFields.aspect_ratio;
          if (formFields.duration) payload.duration = Number(formFields.duration);
          if (selectedModelId === 'veo' && typeof formFields.audio !== 'undefined') {
            payload.audio = Boolean(formFields.audio);
          }
        } else {
          if (formFields.width) payload.width = formFields.width;
          if (formFields.height) payload.height = formFields.height;
        }
        // Prefer highest quality for Pollinations
        payload.quality = 'hd';
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
        } else if (selectedModelId === 'nanobanana-pro') {
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
        } else if (selectedModelId === 'nanobanana-pro' || selectedModelId === 'qwen-image-edit-plus') {
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
        const newHeight = Math.min(
          Math.max(textareaRef.current.scrollHeight, TEXTAREA_MIN_HEIGHT),
          TEXTAREA_MAX_HEIGHT
        );
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
              // Completely empty area - no branding, no text, nothing
              <div className="h-full"></div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="px-4 sm:px-8 md:px-12 lg:px-20 xl:px-32 pt-2 pb-4 shrink-0">
        <div className="max-w-6xl mx-auto relative">
          {/* Model Selector Popup */}
          {isModelSelectorOpen && (
            <div className="mb-4 bg-popover text-popover-foreground rounded-xl shadow-xl border border-border p-0 animate-in fade-in-0 slide-in-from-bottom-4 duration-300 max-h-[520px] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 sticky top-0 bg-popover z-10">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{t('modelSelect.title')}</h2>
                      <p className="text-xs text-muted-foreground">{availableModels.length} Modelle verfügbar</p>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsModelSelectorOpen(false)}
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
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('modelSelect.textImage')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {['gpt-image', 'seedream-pro', 'seedream', 'nanobanana', 'nanobanana-pro'].map(id => {
                        const config = getUnifiedModelConfig(id);
                        const model = getUnifiedModel(id);
                        return (
                          <div
                            key={id}
                            onClick={() => { setSelectedModelId(id); setIsModelSelectorOpen(false); }}
                            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${selectedModelId === id
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                              : 'border-border/50 hover:border-border hover:bg-muted/30'
                              }`}
                          >
                            <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                              {imageModelIcons[id] ? (
                                typeof imageModelIcons[id] === 'string' ? (
                                  <span className="text-2xl">{imageModelIcons[id]}</span>
                                ) : (
                                  <NextImage
                                    src={imageModelIcons[id]}
                                    alt={id}
                                    width={32}
                                    height={32}
                                    className="rounded-lg"
                                  />
                                )
                              ) : (
                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm truncate">{config?.name}</span>
                                {selectedModelId === id && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
                                    Aktiv
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {model?.supportsReference && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                                    📷 Multi-Image
                                  </span>
                                )}
                                {model?.provider === 'pollinations' && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-medium">
                                    ⚡ Fast
                                  </span>
                                )}
                              </div>
                            </div>
                            {selectedModelId === id && (
                              <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* TEXT → IMAGE */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('modelSelect.textToImage')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {['flux-kontext-pro', 'z-image-turbo'].map(id => {
                        const config = getUnifiedModelConfig(id);
                        const model = getUnifiedModel(id);
                        return (
                          <div
                            key={id}
                            onClick={() => { setSelectedModelId(id); setIsModelSelectorOpen(false); }}
                            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${selectedModelId === id
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                              : 'border-border/50 hover:border-border hover:bg-muted/30'
                              }`}
                          >
                            <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                              {imageModelIcons[id] ? (
                                typeof imageModelIcons[id] === 'string' ? (
                                  <span className="text-2xl">{imageModelIcons[id]}</span>
                                ) : (
                                  <NextImage
                                    src={imageModelIcons[id]}
                                    alt={id}
                                    width={32}
                                    height={32}
                                    className="rounded-lg"
                                  />
                                )
                              ) : (
                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm truncate">{config?.name}</span>
                                {selectedModelId === id && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
                                    Aktiv
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {model?.provider === 'replicate' && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">
                                    ⚡ Premium
                                  </span>
                                )}
                              </div>
                            </div>
                            {selectedModelId === id && (
                              <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* TEXT + MULTI-IMAGE → IMAGE */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('modelSelect.textMultiImage')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {['flux-2-pro'].map(id => {
                        const config = getUnifiedModelConfig(id);
                        const model = getUnifiedModel(id);
                        return (
                          <div
                            key={id}
                            onClick={() => { setSelectedModelId(id); setIsModelSelectorOpen(false); }}
                            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${selectedModelId === id
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                              : 'border-border/50 hover:border-border hover:bg-muted/30'
                              }`}
                          >
                            <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                              {imageModelIcons[id] ? (
                                typeof imageModelIcons[id] === 'string' ? (
                                  <span className="text-2xl">{imageModelIcons[id]}</span>
                                ) : (
                                  <NextImage
                                    src={imageModelIcons[id]}
                                    alt={id}
                                    width={32}
                                    height={32}
                                    className="rounded-lg"
                                  />
                                )
                              ) : (
                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm truncate">{config?.name}</span>
                                {selectedModelId === id && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
                                    Aktiv
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium">
                                  📸 8 Images
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">
                                  ⭐ Pro
                                </span>
                              </div>
                            </div>
                            {selectedModelId === id && (
                              <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* IMAGE → IMAGE (EDIT / I2I) */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('modelSelect.imageEdit')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {['flux-kontext-pro', 'qwen-image-edit-plus'].map(id => {
                        const config = getUnifiedModelConfig(id);
                        return (
                          <div
                            key={id}
                            onClick={() => { setSelectedModelId(id); setIsModelSelectorOpen(false); }}
                            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${selectedModelId === id
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                              : 'border-border/50 hover:border-border hover:bg-muted/30'
                              }`}
                          >
                            <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                              {imageModelIcons[id] ? (
                                typeof imageModelIcons[id] === 'string' ? (
                                  <span className="text-2xl">{imageModelIcons[id]}</span>
                                ) : (
                                  <NextImage
                                    src={imageModelIcons[id]}
                                    alt={id}
                                    width={32}
                                    height={32}
                                    className="rounded-lg"
                                  />
                                )
                              ) : (
                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm truncate">{config?.name}</span>
                                {selectedModelId === id && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
                                    Aktiv
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 font-medium">
                                  ✏️ Edit
                                </span>
                              </div>
                            </div>
                            {selectedModelId === id && (
                              <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* TEXT + IMAGE → VIDEO */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('modelSelect.textImageVideo')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {['seedance-pro', 'veo', 'wan-2.5-t2v', 'wan-video', 'veo-3.1-fast'].map(id => {
                        const config = getUnifiedModelConfig(id);
                        const model = getUnifiedModel(id);
                        return (
                          <div
                            key={id}
                            onClick={() => { setSelectedModelId(id); setIsModelSelectorOpen(false); }}
                            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${selectedModelId === id
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                              : 'border-border/50 hover:border-border hover:bg-muted/30'
                              }`}
                          >
                            <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                              {imageModelIcons[id] ? (
                                typeof imageModelIcons[id] === 'string' ? (
                                  <span className="text-2xl">{imageModelIcons[id]}</span>
                                ) : (
                                  <NextImage
                                    src={imageModelIcons[id]}
                                    alt={id}
                                    width={32}
                                    height={32}
                                    className="rounded-lg"
                                  />
                                )
                              ) : (
                                <span className="text-xl">🎬</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm truncate">{config?.name}</span>
                                {selectedModelId === id && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
                                    Aktiv
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
                                  🎥 Video
                                </span>
                                {model?.provider === 'pollinations' && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-medium">
                                    ⚡ Fast
                                  </span>
                                )}
                              </div>
                            </div>
                            {selectedModelId === id && (
                              <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0"></div>
                            )}
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
            <div
              ref={configPanelRef}
              className="mb-4 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border p-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold">{t('imageGen.modal.title')}</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsConfigPanelOpen(false)}>
                  <X className="w-4 h-4 mr-1.5" />
                  {t('imageGen.modal.close')}
                </Button>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {/* Aspect Ratio */}
                {/* Aspect Ratio / Size */}
                {(isGptImage || isSeedream || isNanoPollen || currentModelConfig.inputs.find(i => i.name === 'aspect_ratio')) && (
                  <div className="space-y-2">
                    <Label>{t('imageGen.aspectRatioLabel')}</Label>
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
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(gptImagePresets).map((ratio) => (
                            <SelectItem key={ratio} value={ratio}>{ratio}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : currentModelConfig.outputType === 'video' && getUnifiedModel(selectedModelId)?.provider === 'pollinations' ? (
                      <Select
                        value={formFields.aspect_ratio || '16:9'}
                        onValueChange={(value) => handleFieldChange('aspect_ratio', value)}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16:9">16:9</SelectItem>
                          <SelectItem value="9:16">9:16</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
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
                    )}
                  </div>
                )}

                {/* Resolution (conditional, model-specific) - only for Flux 2 Pro and Nano Banana Pro */}
                {selectedModelId !== 'z-image-turbo' && !isGptImage && !isPollinationsVideo && shouldShowResolution && currentModelConfig.inputs.find(i => i.name === 'resolution') && (
                  <div className="space-y-2">
                    <Label>{t('field.resolution')}</Label>
                    <Select
                      value={formFields.resolution || (selectedModelId === 'nanobanana-pro' ? '2K' : '1 MP')}
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
                    <Label>{t('field.seed')}</Label>
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
                {(!isPollenModel && !isPollinationsVideo && currentModelConfig.inputs.find(i => i.name === 'output_format')) && (
                  <div className="space-y-2">
                    <Label>Output Format</Label>
                    <Select
                      value={formFields.output_format || (currentModelConfig.outputType === 'video' ? 'mp4' : (selectedModelId === 'flux-2-pro' ? 'webp' : 'jpg'))}
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
                        {(selectedModelId === 'nanobanana-pro' || selectedModelId === 'qwen-image-edit-plus' || isGptImage) && (
                          <>
                            <SelectItem value="jpg">JPG</SelectItem>
                            <SelectItem value="png">PNG</SelectItem>
                            <SelectItem value="webp">WebP</SelectItem>
                          </>
                        )}
                        {(isSeedream || isNanoPollen) && (
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

                {/* Video-specific options for Pollinations */}
                {isPollinationsVideo && (
                  <>
                    <div className="space-y-2">
                      <Label>Duration (seconds)</Label>
                      <Select
                        value={String(formFields.duration || (selectedModelId === 'veo' ? 6 : 6))}
                        onValueChange={(value) => handleFieldChange('duration', Number(value))}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedModelId === 'veo' ? (
                            <>
                              <SelectItem value="4">4</SelectItem>
                              <SelectItem value="6">6</SelectItem>
                              <SelectItem value="8">8</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="4">4</SelectItem>
                              <SelectItem value="6">6</SelectItem>
                              <SelectItem value="8">8</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedModelId === 'veo' && (
                      <div className="space-y-2">
                        <Label>Audio</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={Boolean(formFields.audio)}
                            onChange={(e) => handleFieldChange('audio', e.target.checked)}
                            disabled={loading}
                          />
                          <span className="text-sm text-muted-foreground">Enable audio</span>
                        </div>
                      </div>
                    )}
                  </>
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
                    {selectedModelId === 'nanobanana-pro' && 'Up to 14 images supported'}
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
            <div className="bg-white dark:bg-[#252525] rounded-2xl p-3 shadow-xl flex flex-col min-h-0">
              {loading && (
                <div className="absolute inset-x-4 top-3 z-10">
                  <div className="rounded-xl bg-black/70 text-white px-4 py-3 text-sm md:text-base shadow-lg flex items-start gap-2">
                    <Loader2 className="h-4 w-4 mt-0.5 animate-spin" />
                    <div className="leading-snug">
                      {language === 'de'
                        ? 'Generierung läuft … Aufwändige Modelle brauchen manchmal ein paar Sekunden, Bilder kommen direkt aus der Cloud.'
                        : 'Generating… Heavier models can take a few seconds; images stream back from the cloud.'}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-grow">
                <Textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={placeholderText}
                  className="w-full bg-transparent text-gray-800 dark:text-white placeholder:text-gray-600 dark:placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 border-0 shadow-none p-2 m-0 leading-tight resize-none overflow-auto min-h-[80px] max-h-[220px]"
                  rows={1}
                  disabled={loading}
                  style={{ lineHeight: '1.5rem', fontSize: '17px' }}
                />
              </div>

              <div className="flex w-full items-center justify-between gap-1">
                {/* Left Side: Settings + Plus Menu */}
                <div className="flex items-center gap-0">
                  {/* Settings Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={toggleConfigPanel}
                    className="group rounded-lg h-14 w-14 md:h-12 md:w-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white"
                    aria-label="Settings"
                  >
                    <SlidersHorizontal className="w-[20px] h-[20px]" />
                  </Button>

                  {/* Plus Menu for Image Upload */}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => supportsReference ? setIsImageUploadOpen(!isImageUploadOpen) : fileInputRef.current?.click()}
                    disabled={loading || isUploading}
                    className="group rounded-lg h-14 w-14 md:h-12 md:w-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white disabled:opacity-40"
                    aria-label="Upload image"
                  >
                    <Plus className="w-[20px] h-[20px]" />
                  </Button>
                </div>

                {/* Right Side: Model Select + Enhance + Generate */}
                <div className="flex items-center gap-0">
                  {/* Model Selector */}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                    className="group rounded-lg h-14 w-auto px-3 md:h-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white min-w-[120px] max-w-[200px]"
                    aria-label="Select model"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {/* Model Icon - Now using the correct icon from imageModelIcons */}
                      <div className="w-5 h-5 flex-shrink-0">
                        {imageModelIcons[selectedModelId] ? (
                          typeof imageModelIcons[selectedModelId] === 'string' ? (
                            <span className="text-lg">{imageModelIcons[selectedModelId]}</span>
                          ) : (
                            <NextImage
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
                        {currentModelConfig?.name || 'Select model'}
                      </span>
                    </div>
                  </Button>

                  {/* Enhance Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleEnhancePrompt}
                    disabled={!prompt.trim() || loading || isEnhancing || isUploading}
                    className="group rounded-lg h-14 w-auto px-3 md:h-12 transition-colors duration-300 text-gray-600 dark:text-gray-200 hover:text-gray-800 dark:hover:text-white disabled:opacity-40"
                    aria-label="Enhance prompt"
                  >
                    <span className="text-xs md:text-sm font-medium">
                      {isEnhancing ? 'Enhancing...' : 'Enhance'}
                    </span>
                  </Button>

                  {/* Generate Button */}
                  <Button
                    type="submit"
                    variant="ghost"
                    disabled={loading || isUploading || (!prompt.trim() && uploadedImages.length === 0)}
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
      </footer>
    </div>
  );
};

export default UnifiedImageTool;

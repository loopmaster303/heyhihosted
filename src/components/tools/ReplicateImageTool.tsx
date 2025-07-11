
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Info, ImageIcon, X, MoreHorizontal, ChevronDown, FileImage, Plus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import NextImage from 'next/image';
import { modelConfigs, type ReplicateModelConfig, type ReplicateModelInput } from '@/config/replicate-models';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { ImageHistoryItem } from '@/types';
import ImageHistoryGallery from './ImageHistoryGallery';

interface ReplicateImageToolProps {
  password?: string;
}

const REPLICATE_TOOL_SETTINGS_KEY = 'replicateImageToolSettings';
const HISTORY_STORAGE_KEY = 'replicateToolHistory';

const ReplicateImageTool: React.FC<ReplicateImageToolProps> = ({ password }) => {
  const { toast } = useToast();

  const modelKeys = Object.keys(modelConfigs);
  const [selectedModelKey, setSelectedModelKey] = useState<string>(""); 
  const [currentModelConfig, setCurrentModelConfig] = useState<ReplicateModelConfig | null>(null);
  
  const [formFields, setFormFields] = useState<Record<string, any>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mainPromptValue, setMainPromptValue] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);

  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [referenceTags, setReferenceTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageHistoryItem | null>(null);


  const isFluxModelSelected = !!currentModelConfig?.id.startsWith("flux-kontext");
  const isRunwayModelSelected = currentModelConfig?.id === 'runway-gen4-image';
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    const storedData = localStorage.getItem(REPLICATE_TOOL_SETTINGS_KEY);
    if (storedData) {
      try {
        const settings = JSON.parse(storedData);
        if (settings.selectedModelKey && modelKeys.includes(settings.selectedModelKey)) {
          setSelectedModelKey(settings.selectedModelKey);
        } else if (modelKeys.length > 0) {
          setSelectedModelKey(modelKeys[0]); 
        }
      } catch (e) {
        console.error("Error loading ReplicateImageTool selectedModelKey:", e);
        if (modelKeys.length > 0) setSelectedModelKey(modelKeys[0]);
      }
    } else if (modelKeys.length > 0) {
      setSelectedModelKey(modelKeys[0]); 
    }

    try {
        const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (storedHistory) {
            const parsedHistory = JSON.parse(storedHistory);
            if(Array.isArray(parsedHistory)) {
                setHistory(parsedHistory);
                if (parsedHistory.length > 0) {
                    setSelectedImage(parsedHistory[0]);
                }
            }
        }
    } catch (e) {
        console.error("Failed to parse history from localStorage", e);
        localStorage.removeItem(HISTORY_STORAGE_KEY);
    }

    setInitialLoadComplete(true);
  }, []); 

  useEffect(() => {
    if (!initialLoadComplete || !selectedModelKey) return; 

    const config = modelConfigs[selectedModelKey];
    if (config) {
      setCurrentModelConfig(config);
      const initialFields: Record<string, any> = {};
      let initialMainPrompt = '';

      const promptInputConfig = config.inputs.find(input => input.isPrompt && input.name === 'prompt');
      initialMainPrompt = String(promptInputConfig?.default ?? '');
      
      config.inputs.forEach(input => {
          if (!input.isPrompt && input.name !== 'input_image' && input.type !== 'files' && input.type !== 'tags') {
              initialFields[input.name] = input.default ?? 
                                          (input.type === 'number' ? (input.min ?? 0) : 
                                          (input.type === 'boolean' ? false : 
                                          (input.type === 'select' ? (typeof input.options?.[0] === 'object' ? input.options?.[0].value : input.options?.[0]) : '')));
          }
      });
      
      const storedData = localStorage.getItem(REPLICATE_TOOL_SETTINGS_KEY);
      if (storedData) {
        try {
          const settings = JSON.parse(storedData);
          if (settings.selectedModelKey === selectedModelKey) { 
            if (settings.mainPromptValue !== undefined) {
              initialMainPrompt = settings.mainPromptValue;
            }
            if (settings.formFields !== undefined) {
              Object.keys(initialFields).forEach(key => {
                if (settings.formFields[key] !== undefined) {
                  initialFields[key] = settings.formFields[key];
                }
              });
            }
          }
        } catch (e) { console.error("Error applying ReplicateImageTool model specific settings:", e); }
      }
      
      setMainPromptValue(initialMainPrompt);
      setFormFields(initialFields);
      setReferenceImages([]);
      setReferenceTags([]);

      setError(null);
      setUploadedImagePreview(null);
    } else {
      setCurrentModelConfig(null);
      setFormFields({});
      setMainPromptValue('');
    }
  }, [selectedModelKey, initialLoadComplete]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to calculate the correct scrollHeight
      textarea.style.height = 'auto';
      // Set the height to the scrollHeight, but cap it at the max-height
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
      // Maintain a minimum height
      textarea.style.minHeight = '80px';
    }
  }, [mainPromptValue]);

  useEffect(() => {
    if (!initialLoadComplete || !selectedModelKey || !currentModelConfig) return; 

    const settingsToSave = {
      selectedModelKey,
      mainPromptValue,
      formFields,
    };
    localStorage.setItem(REPLICATE_TOOL_SETTINGS_KEY, JSON.stringify(settingsToSave));
  }, [selectedModelKey, mainPromptValue, formFields, currentModelConfig, initialLoadComplete]);


  useEffect(() => {
    if (history.length > 0) {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } else {
        localStorage.removeItem(HISTORY_STORAGE_KEY);
    }
  }, [history]);

  const handleInputChange = useCallback((name: string, value: string | number | boolean) => {
    setFormFields(prevFields => ({ ...prevFields, [name]: value }));
  }, []);

  const handleMainPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMainPromptValue(e.target.value);
  };
  
  const handleSingleFileSelectAndConvert = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setUploadedImagePreview(dataUri);
        if (isFluxModelSelected) { 
            setFormFields(prev => ({...prev, input_image: dataUri }));
        }
      };
      reader.readAsDataURL(file);
    } else if (file) {
      toast({ title: "Invalid File", description: "Please upload an image file.", variant: "destructive" });
      setUploadedImagePreview(null);
      if (isFluxModelSelected) { 
        setFormFields(prev => ({...prev, input_image: undefined }));
      }
    }
  };

  const handleSingleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleSingleFileSelectAndConvert(event.target.files?.[0] || null);
    if (singleFileInputRef.current) {
      singleFileInputRef.current.value = "";
    }
  };
  
  const handleClearUploadedImage = () => {
    setUploadedImagePreview(null);
    if (isFluxModelSelected) { 
        setFormFields(prev => ({...prev, input_image: undefined }));
    }
    if (singleFileInputRef.current) {
      singleFileInputRef.current.value = "";
    }
  };
  
  const handleMultipleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (referenceImages.length + files.length > 3) {
        toast({ title: "Upload Limit Exceeded", description: "You can upload a maximum of 3 reference images.", variant: "destructive" });
        return;
    }

    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReferenceImages(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        }
    });

    if (multiFileInputRef.current) {
        multiFileInputRef.current.value = "";
    }
  };

  const handleRemoveReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
    setReferenceTags(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleAddTag = () => {
    if (currentTag.trim() && referenceTags.length < referenceImages.length) {
        setReferenceTags(prev => [...prev, currentTag.trim()]);
        setCurrentTag('');
    } else if (referenceTags.length >= referenceImages.length) {
        toast({ title: "Tag Limit Reached", description: "You can only add as many tags as you have reference images.", variant: "destructive" });
    }
  };

  const handleRemoveTag = (index: number) => {
    setReferenceTags(prev => prev.filter((_, i) => i !== index));
  };


  const renderInputField = (inputConfig: ReplicateModelInput) => {
    const commonProps = {
      id: `${inputConfig.name}-replicate-param-${currentModelConfig?.id || 'default'}`,
      name: inputConfig.name,
      disabled: loading,
    };

    const label = (
        <Label htmlFor={commonProps.id} className="text-sm font-medium flex items-center">
            {inputConfig.label}
            {inputConfig.required && <span className="text-destructive ml-1">*</span>}
            {inputConfig.info && (
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                <TooltipTrigger asChild>
                    <button type="button" className="ml-1.5 focus:outline-none" tabIndex={-1}>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs bg-popover text-popover-foreground border border-border shadow-lg p-2 rounded-md text-xs">
                    <p>{inputConfig.info}</p>
                </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            )}
        </Label>
    );

    switch (inputConfig.type) {
      case 'text':
        if (inputConfig.name === 'prompt' && isRunwayModelSelected) return null;
        return (
            <div key={inputConfig.name} className="space-y-1.5">
            {label}
            <Textarea
                {...commonProps}
                value={formFields[inputConfig.name] ?? ''}
                placeholder={inputConfig.placeholder || `Enter ${inputConfig.label.toLowerCase()}`}
                onChange={(e) => handleInputChange(inputConfig.name, e.target.value)}
                className="bg-input border-border focus-visible:ring-primary min-h-[60px]"
                rows={inputConfig.isNegativePrompt ? 2 : 3}
                required={inputConfig.required}
            />
            </div>
        );
      case 'url':
        if (inputConfig.name === "input_image" && isFluxModelSelected) return null; 
        return (
          <div key={inputConfig.name} className="space-y-1.5">
            {label}
            <Input
              {...commonProps}
              type="url"
              value={formFields[inputConfig.name] ?? ''}
              placeholder={inputConfig.placeholder || "https://example.com/image.png"}
              onChange={(e) => handleInputChange(inputConfig.name, e.target.value)}
              className="bg-input border-border focus-visible:ring-primary"
              required={inputConfig.required}
            />
          </div>
        );
      case 'number':
        if (inputConfig.min !== undefined && inputConfig.max !== undefined && inputConfig.step !== undefined) {
             return (
                <div key={inputConfig.name} className="space-y-1.5">
                    <div className="flex justify-between items-center mb-1">
                        {label}
                        <span className="text-xs text-muted-foreground tabular-nums px-1 py-0.5 bg-muted rounded">
                            {formFields[inputConfig.name] ?? inputConfig.default ?? inputConfig.min}
                        </span>
                    </div>
                    <Slider
                        id={commonProps.id}
                        min={inputConfig.min}
                        max={inputConfig.max}
                        step={inputConfig.step}
                        value={[formFields[inputConfig.name] ?? inputConfig.default ?? inputConfig.min]}
                        onValueChange={(value) => handleInputChange(inputConfig.name, value[0])}
                        disabled={loading}
                        className="my-2"
                    />
                </div>
            );
        }
        return (
          <div key={inputConfig.name} className="space-y-1.5">
            {label}
            <Input
              {...commonProps}
              type="number"
              value={String(formFields[inputConfig.name] ?? '')}
              min={inputConfig.min}
              max={inputConfig.max}
              step={inputConfig.step}
              placeholder={String(inputConfig.default) || ''}
              onChange={(e) => {
                const val = e.target.value;
                handleInputChange(inputConfig.name, val === '' ? '' : parseFloat(val));
              }}
              className="bg-input border-border focus-visible:ring-primary"
              required={inputConfig.required}
            />
          </div>
        );
      case 'boolean':
        return (
            <div key={inputConfig.name} className="flex items-center justify-between space-x-2 py-2.5 border-b border-border last:border-b-0">
                {label}
                <Switch
                    id={commonProps.id}
                    checked={formFields[inputConfig.name] ?? inputConfig.default ?? false}
                    onCheckedChange={(checked) => handleInputChange(inputConfig.name, checked)}
                    disabled={loading}
                />
            </div>
        );
      case 'select':
        return (
            <div key={inputConfig.name} className="space-y-1.5">
                {label}
                <Select
                    value={String(formFields[inputConfig.name] ?? inputConfig.default ?? '')}
                    onValueChange={(value) => handleInputChange(inputConfig.name, value)}
                    disabled={loading}
                    required={inputConfig.required}
                >
                    <SelectTrigger id={commonProps.id} className="w-full bg-input border-border focus:ring-primary">
                        <SelectValue placeholder={inputConfig.placeholder || `Select ${inputConfig.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                        {inputConfig.options?.map((opt, idx) => {
                            const val = typeof opt === 'string' ? opt : opt.value;
                            const optLabel = typeof opt === 'string' ? opt : opt.label;
                            return <SelectItem key={`${val}-${idx}`} value={val}>{optLabel}</SelectItem>;
                        })}
                    </SelectContent>
                </Select>
            </div>
        );
      case 'files':
        return (
            <div key={inputConfig.name} className="space-y-2">
                {label}
                <Button type="button" variant="outline" className="w-full" onClick={() => multiFileInputRef.current?.click()} disabled={loading || referenceImages.length >= 3}>
                    <FileImage className="mr-2 h-4 w-4" /> Add multiple files...
                </Button>
                <div className="flex flex-wrap gap-2 mt-2">
                    {referenceImages.map((src, index) => (
                        <div key={index} className="relative w-16 h-16 group">
                            <NextImage src={src} alt={`Reference ${index + 1}`} fill style={{ objectFit: 'cover' }} className="rounded-md border" />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                onClick={() => handleRemoveReferenceImage(index)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        );
      case 'tags':
        return (
            <div key={inputConfig.name} className="space-y-2">
                {label}
                <div className="flex gap-2">
                    <Input
                        type="text"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        placeholder="Add a tag..."
                        disabled={loading || referenceTags.length >= referenceImages.length}
                        className="bg-input border-border"
                    />
                    <Button type="button" onClick={handleAddTag} disabled={loading || !currentTag.trim() || referenceTags.length >= referenceImages.length}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                    {referenceTags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button type="button" onClick={() => handleRemoveTag(index)} className="rounded-full hover:bg-destructive/20 p-0.5">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            </div>
        );
      default:
        return null;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedModelKey || !currentModelConfig) {
        toast({ title: "No Model Selected", description: "Please select a model first.", variant: "destructive" });
        return;
    }

    const currentPayload: Record<string, any> = { model: selectedModelKey, password: password };

    const effectivePrompt = mainPromptValue.trim();
    const promptConfig = currentModelConfig.inputs.find(i => i.name === 'prompt' && i.isPrompt);

    if (promptConfig) {
        if (promptConfig.required && !effectivePrompt && !(isFluxModelSelected && uploadedImagePreview) ) {
            toast({ title: "Prompt Missing", description: "This model requires a prompt.", variant: "destructive" });
            return;
        }
        if (effectivePrompt) { 
            currentPayload.prompt = effectivePrompt;
        }
    }
    
    if (isFluxModelSelected && uploadedImagePreview && formFields.input_image) {
        currentPayload.input_image = formFields.input_image; 
    } else if (isFluxModelSelected && currentModelConfig.inputs.find(i => i.name === 'input_image')?.required && !uploadedImagePreview && !effectivePrompt) {
        toast({ title: "Input Missing", description: "Flux models require a prompt or an input image.", variant: "destructive" });
        return;
    }

    if (isRunwayModelSelected) {
        if (referenceImages.length > 0) {
            currentPayload.reference_images = referenceImages;
        }
        if (referenceTags.length > 0) {
            currentPayload.reference_tags = referenceTags;
        }
        if (referenceImages.length > 0 && referenceTags.length !== referenceImages.length) {
            toast({ title: "Tag Mismatch", description: "You must provide a tag for each reference image.", variant: "destructive"});
            return;
        }
    }


    for (const input of currentModelConfig.inputs) {
      if ((input.isPrompt && input.name === 'prompt')) continue; 
      if (input.type === 'files' || input.type === 'tags') continue;
      if (isFluxModelSelected && input.name === "input_image") continue;

      const valueToUse = formFields[input.name];

      if (input.required && (valueToUse === undefined || valueToUse === '' || valueToUse === null)) {
         if (!(input.type === 'boolean' && valueToUse === false)) { 
             toast({ title: "Missing Required Field", description: `Please fill in the "${input.label}" field.`, variant: "destructive"});
             return;
         }
      }

      if (valueToUse !== undefined && valueToUse !== '' && valueToUse !== null) {
         if (input.type === 'number') {
          const numValue = parseFloat(String(valueToUse));
          if (!isNaN(numValue)) currentPayload[input.name] = numValue;
        } else {
          currentPayload[input.name] = valueToUse;
        }
      } else if (input.type === 'boolean' && valueToUse === false) { 
         currentPayload[input.name] = false; 
      }
    }

    setLoading(true);
    setError(null);
    setSelectedImage(null);

    try {
      const response = await fetch('/api/replicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || `API request failed with status ${response.status}`);
      }

      if (data.output) {
        const isVideo = currentModelConfig?.outputType === 'video';
        const resultUrl = Array.isArray(data.output) ? data.output[0] : data.output;
        
        if (typeof resultUrl === 'string' && resultUrl.trim() !== '') {
            const newHistoryItem: ImageHistoryItem = {
              id: crypto.randomUUID(),
              imageUrl: isVideo ? '' : resultUrl,
              videoUrl: isVideo ? resultUrl : undefined,
              prompt: mainPromptValue,
              model: currentModelConfig.name,
              timestamp: new Date().toISOString(),
              toolType: 'premium imagination'
            };
            setHistory(prev => [newHistoryItem, ...prev]);
            setSelectedImage(newHistoryItem);
            toast({ title: "Generation Succeeded!", description: `${currentModelConfig.name} finished processing.` });
        } else {
            console.warn("Replicate API returned success but output URL was empty or invalid:", data.output);
            throw new Error("Received empty or invalid output URL from API.");
        }
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        if(data.status && data.status !== "succeeded" && data.status !== "failed" && data.status !== "canceled"){
            setError(`Prediction is ${data.status}. This might take a moment. If this persists, check server logs or Replicate dashboard.`);
            toast({title: `Prediction ${data.status}`, description: "Waiting for completion from Replicate. The backend is polling.", variant: "default", duration: 7000});
        } else if (data.status === "failed" || data.status === "canceled") {
            throw new Error(`Prediction ${data.status}. ${data.error || 'Check Replicate dashboard for details.'}`);
        }
         else {
            console.warn("Unknown response structure from Replicate API or prediction completed without output URL:", data);
            throw new Error("Unknown response structure from Replicate API or prediction completed without output URL.");
        }
      }
    } catch (err: any) {
      console.error("Replicate generation error:", err);
      const errorMessage = err.message || 'An unknown error occurred.';
      setError(errorMessage);
      toast({ title: "Generation Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    setSelectedImage(null);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    toast({ title: "History Cleared", description: "Your image generation history has been removed." });
  };

  const handleSelectHistoryItem = (item: ImageHistoryItem) => {
    setSelectedImage(item);
    setMainPromptValue(item.prompt);
  };
  
  const canSubmit = !loading && currentModelConfig &&
    ( (isFluxModelSelected && (mainPromptValue.trim() !== '' || uploadedImagePreview)) ||
      (!isFluxModelSelected && mainPromptValue.trim() !== '') );


  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-y-auto">
      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
        <form onSubmit={handleSubmit}>
          <div className="bg-input rounded-xl p-3 shadow-lg flex flex-col gap-2 relative">
            <Textarea
              ref={textareaRef}
              value={mainPromptValue}
              onChange={handleMainPromptChange}
              placeholder="Describe what you imagine (or want to modify) and hit execute!"
              className="flex-grow bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none text-base p-2 pr-24 overflow-hidden"
              rows={3}
              disabled={loading || !currentModelConfig}
              aria-label="Main prompt input with dynamic height"
            />
             <Button
                type="submit"
                disabled={!canSubmit}
                className="absolute top-3 right-3 h-8 px-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Execute
              </Button>
            <div className="flex items-center justify-between pt-2 px-1">
                 {isFluxModelSelected && (
                    <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="relative h-8 w-8 cursor-pointer group flex-shrink-0"
                              onClick={() => {
                                  if (uploadedImagePreview) {
                                      handleClearUploadedImage();
                                  } else {
                                      singleFileInputRef.current?.click()
                                  }
                              }}
                              aria-label={uploadedImagePreview ? "Clear reference image" : "Upload reference image"}
                            >
                                {uploadedImagePreview ? (
                                    <>
                                        <NextImage
                                            src={uploadedImagePreview}
                                            alt="Reference preview"
                                            fill
                                            style={{ objectFit: 'cover' }}
                                            className="rounded-sm"
                                            data-ai-hint="reference thumbnail"
                                        />
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-sm">
                                            <X className="h-4 w-4 text-white" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-8 w-8 rounded-sm border-2 border-dashed border-muted-foreground/50 flex items-center justify-center text-muted-foreground/50 hover:bg-muted/20 hover:border-muted-foreground">
                                        <ImageIcon className="h-4 w-4" />
                                    </div>
                                )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p>{uploadedImagePreview ? "Clear Reference Image" : "Upload Reference Image"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                 )}
                 {!isFluxModelSelected && <div className="w-8"></div>}
              
              <div className="flex items-center space-x-1.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 rounded-lg text-xs bg-input hover:bg-muted focus-visible:ring-primary border-border"
                      disabled={loading}
                      aria-label={`Selected model: ${currentModelConfig ? currentModelConfig.name : "Select Model"}`}
                    >
                      {currentModelConfig ? currentModelConfig.name : "Select Model"}
                      <ChevronDown className="ml-1.5 h-3 w-3 opacity-70" /> 
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
                    {modelKeys.map(key => (
                      <DropdownMenuItem key={key} onSelect={() => setSelectedModelKey(key)} disabled={loading}>
                        {modelConfigs[key].name}
                          {modelConfigs[key].outputType === 'video' && <Badge variant="secondary" className="ml-2 text-xs">Video</Badge>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={`${currentModelConfig?.name || 'Model'} Settings`} type="button" disabled={loading || !currentModelConfig} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-80 sm:w-96 bg-popover text-popover-foreground shadow-xl border-border p-0" 
                    side="bottom" 
                    align="end"
                    collisionPadding={10} 
                  >
                     <div className="grid gap-4 p-3 max-h-[65vh] overflow-y-auto">
                        {currentModelConfig && (
                          <>
                            <div className="space-y-1 px-1">
                              <h4 className="font-medium leading-none">{currentModelConfig.name} Parameters</h4>
                              <p className="text-xs text-muted-foreground">Adjust advanced options for generation.</p>
                            </div>
                            <div className="grid gap-3">
                              {currentModelConfig.inputs
                                .filter(input => !input.isPrompt)
                                .map(input => renderInputField(input))}
                            </div>
                          </>
                        )}
                        {!currentModelConfig && <p className="text-sm text-muted-foreground p-4 text-center">Select a model to see its parameters.</p>}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <input type="file" ref={singleFileInputRef} onChange={handleSingleFileChange} accept="image/*" className="hidden" />
          <input type="file" ref={multiFileInputRef} onChange={handleMultipleFileChange} accept="image/*" multiple className="hidden" />
        </form>

        <Card className="flex flex-col min-h-[300px] md:min-h-[400px] border-0 shadow-none">
          <CardHeader className="py-3 px-4">
              <CardTitle className="text-base sm:text-lg">Output</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-4 flex-grow bg-card rounded-b-lg">
          {loading && (
            <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
            </div>
           )}
          {error && !loading && (
              <div className="w-full h-full flex flex-col items-center justify-center text-destructive space-y-2 max-w-md mx-auto text-center">
                  <AlertCircle className="w-8 h-8 sm:w-10 sm:w-10 mb-2"/>
                  <p className="font-semibold text-md sm:text-lg">Generation Error</p>
                  <p className="text-xs sm:text-sm leading-relaxed">{error}</p>
              </div>
              )}
          {!loading && !error && selectedImage && (
              <div className={cn(
                  "relative w-full h-full", 
                  selectedImage.videoUrl
                      ? "aspect-video max-h-[calc(100vh-400px)]" 
                      : "aspect-square max-h-[calc(100vh-400px)]" 
              )}>
              {selectedImage.videoUrl ? (
                  <video
                      src={selectedImage.videoUrl}
                      controls
                      autoPlay
                      muted
                      loop
                      className="rounded-md w-full h-full object-contain"
                      data-ai-hint="ai generated video"
                  >
                      Your browser does not support the video tag.
                  </video>
              ) : (
                  <a href={selectedImage.imageUrl} target="_blank" rel="noopener noreferrer" className="block relative w-full h-full group">
                      <NextImage
                      src={selectedImage.imageUrl}
                      alt={`Generated using ${selectedImage.model}`}
                      fill
                      style={{ objectFit: "contain" }}
                      className="rounded-md"
                      data-ai-hint="ai generated digital art"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                          <p className="text-white text-sm p-2 bg-black/80 rounded-md">View Full Image</p>
                      </div>
                  </a>
              )}
              </div>
          )}
          {!loading && !error && !selectedImage && (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground font-code">
                <p className="text-lg">{`</export>`}</p>
            </div>
          )}
          </CardContent>
        </Card>

         <ImageHistoryGallery
            history={history}
            onSelectImage={handleSelectHistoryItem}
            onClearHistory={handleClearHistory}
        />
      </div>
    </div>
  );
};

export default ReplicateImageTool;

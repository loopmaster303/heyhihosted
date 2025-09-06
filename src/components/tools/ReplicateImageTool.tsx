
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Info, ImageIcon, X, FileImage, Plus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import NextImage from 'next/image';
import { modelConfigs, modelKeys, type ReplicateModelConfig, type ReplicateModelInput } from '@/config/replicate-models';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { ImageHistoryItem } from '@/types';
import ImageHistoryGallery from './ImageHistoryGallery';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { useLanguage } from '../LanguageProvider';
import { translations } from '@/config/translations';
import { generateUUID } from '@/lib/uuid';

interface ReplicateImageToolProps {
  password?: string;
  settingsStorageKey?: string;
  historyStorageKey?: string;
}

const DEFAULT_SETTINGS_KEY = 'replicateImageToolSettings';
const DEFAULT_HISTORY_KEY = 'replicateToolHistory';

const ReplicateImageTool: React.FC<ReplicateImageToolProps> = ({ 
  password, 
  settingsStorageKey = DEFAULT_SETTINGS_KEY, 
  historyStorageKey = DEFAULT_HISTORY_KEY 
}) => {
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const getPromptPlaceholder = () => {
    // Hard map by model id so we are independent of translations.json and defaults
    const id = currentModelConfig?.id || selectedModelKey || '';

    // English placeholders (provided by user)
    const EN: Record<string, string> = {
      // 🖼️ IMAGE GENERATORS
      'wan-2.2-image': 'Type what you want to see – makes very realistic pictures in seconds.',
      'flux-krea-dev': "Write your idea – creates natural, artistic images that don't look AI-made.",
      'qwen-image': 'Describe your scene – makes detailed, lifelike photos and can also draw text.',
      // ✏️ IMAGE EDITORS
      'nano-banana': 'Upload a picture or type text – edits and creates images with simple instructions.',
      'qwen-image-edit': 'Upload a picture and tell it what to change – perfect for fixing or adding text.',
      'ideogram-character': 'Upload a character picture and describe a new scene – keeps the character consistent.',
      'flux-kontext-pro': 'Write your scene in detail – handles complex prompts and makes pro-looking images.',
      'runway-gen4-image': 'Upload references and use @tags – advanced image generation with strong control.',
    };

    // German equivalents (short, actionable)
    const DE: Record<string, string> = {
      // 🖼️ BILDERZEUGER
      'wan-2.2-image': 'Schreibe, was du sehen willst – macht in Sekunden sehr realistische Bilder.',
      'flux-krea-dev': 'Beschreibe deine Idee – erzeugt natürliche, künstlerische Bilder, die nicht nach AI aussehen.',
      'qwen-image': 'Beschreibe die Szene – detailreiche, lebensnahe Fotos, kann auch Text zeichnen.',
      // ✏️ BILDBEARBEITER
      'nano-banana': 'Bild hochladen oder Text schreiben – bearbeitet/erstellt Bilder mit einfachen Anweisungen.',
      'qwen-image-edit': 'Bild hochladen und sagen, was geändert werden soll – ideal zum Korrigieren oder Text einfügen.',
      'ideogram-character': 'Charakterfoto hochladen und neue Szene beschreiben – Figur bleibt konsistent.',
      'flux-kontext-pro': 'Szene ausführlich beschreiben – kann komplexe Prompts, liefert Profi-Looks.',
      'runway-gen4-image': 'Referenzen hochladen und @Tags nutzen – präzise Steuerung für fortgeschrittene Bildgenerierung.',
    };

    // Video fallback if model is video
    const videoPlaceholderEN = 'Describe a scene or upload an image – turns text or pictures into cinematic video clips.';
    const videoPlaceholderDE = 'Szene beschreiben oder Bild hochladen – macht aus Text/Bildern cineastische Videoclips.';

    const lang = (language || 'en') as 'de' | 'en';
    const table = lang === 'de' ? DE : EN;

    if (id && table[id]) return table[id];

    // If current model advertises video outputType, use video string
    if (currentModelConfig?.outputType === 'video') {
      return lang === 'de' ? videoPlaceholderDE : videoPlaceholderEN;
    }

    // Last resort: original translation key or global fallback
    const modelKey = selectedModelKey as keyof typeof modelConfigs;
    const placeholderKey = `prompt.${modelKey}` as keyof typeof translations.de;
    if (placeholderKey in translations[language]) {
      return t(placeholderKey);
    }
    return t('imageGen.placeholder');
  };

  const [selectedModelKey, setSelectedModelKey] = useState<string>("wan-2.2-image"); 
  const [currentModelConfig, setCurrentModelConfig] = useState<ReplicateModelConfig | null>(null);
  
  const [formFields, setFormFields] = useState<Record<string, any>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mainPromptValue, setMainPromptValue] = useState('');
  const [userTouchedPrompt, setUserTouchedPrompt] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);

  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [referenceTags, setReferenceTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  // Nano Banana multiple input images
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageHistoryItem | null>(null);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  
  const [mounted, setMounted] = useState(false);

  const historyPanelRef = useRef<HTMLDivElement>(null);

  useOnClickOutside([historyPanelRef], () => setIsHistoryPanelOpen(false), 'radix-select-content');

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const isFluxModelSelected = !!currentModelConfig?.id.startsWith("flux-kontext");
  const isFluxKreaDev = currentModelConfig?.id === "flux-krea-dev";
  const isQwenImage = currentModelConfig?.id === "qwen-image";
  const isRunwayModelSelected = currentModelConfig?.id === 'runway-gen4-image';
  const isVideoModelSelected = currentModelConfig?.outputType === 'video';
  const hasCharacterReference = currentModelConfig?.hasCharacterReference;
  
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    const storedData = localStorage.getItem(settingsStorageKey);
    if (storedData) {
      try {
        const settings = JSON.parse(storedData);
        if (settings.selectedModelKey && modelKeys.includes(settings.selectedModelKey)) {
          setSelectedModelKey(settings.selectedModelKey);
        } else {
          setSelectedModelKey("wan-2.2-image"); 
        }
      } catch (e) {
        console.error("Error loading ReplicateImageTool selectedModelKey:", e);
        setSelectedModelKey("wan-2.2-image");
      }
    } else {
      setSelectedModelKey("wan-2.2-image"); 
    }

    try {
        const storedHistory = localStorage.getItem(historyStorageKey);
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
        localStorage.removeItem(historyStorageKey);
    }

    setInitialLoadComplete(true);
  }, [settingsStorageKey, historyStorageKey]); 

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
          if (!input.isPrompt && input.type !== 'files' && input.type !== 'tags') {
              // Always set default values for all fields
              if (input.default !== undefined) {
                  initialFields[input.name] = input.default;
              } else if (input.type === 'number') {
                  initialFields[input.name] = input.min ?? 0;
              } else if (input.type === 'boolean') {
                  initialFields[input.name] = false;
              } else if (input.type === 'select' && input.options && input.options.length > 0) {
                  // Use first option as default if no default is specified
                  const defaultValue = typeof input.options[0] === 'object' ? input.options[0].value : input.options[0];
                  initialFields[input.name] = input.name === 'megapixels' ? String(defaultValue) : defaultValue;
              } else {
                  initialFields[input.name] = '';
              }
          }
      });
      
      // Force default values for all select fields
      config.inputs.forEach(input => {
        if (input.type === 'select' && input.default !== undefined) {
          // Ensure megapixels is always stored as string
          if (input.name === 'megapixels') {
            initialFields[input.name] = String(input.default);
          } else {
            initialFields[input.name] = input.default;
          }
        }
      });
      
      // Preserve existing prompt if user has already typed something
      const shouldPreservePrompt = mainPromptValue && mainPromptValue.trim() !== '';
      const finalMainPrompt = shouldPreservePrompt ? mainPromptValue : initialMainPrompt;
      
      setMainPromptValue(finalMainPrompt);
      
      // Ensure megapixels is always a string in formFields
      const correctedFields = { ...initialFields };
      if (correctedFields.megapixels !== undefined) {
        correctedFields.megapixels = String(correctedFields.megapixels);
      }
      
      setFormFields(correctedFields);
      setReferenceImages([]);
      setReferenceTags([]);
      setUploadedImages([]);

      setError(null);
      setUploadedImagePreview(null);
    } else {
      setCurrentModelConfig(null);
      setFormFields({});
      setMainPromptValue('');
    }
  }, [selectedModelKey, initialLoadComplete, settingsStorageKey]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 130);
      textarea.style.height = `${newHeight}px`;
    }
  }, [mainPromptValue]);

  useEffect(() => {
    if (!initialLoadComplete || !selectedModelKey || !currentModelConfig) return; 

    const settingsToSave = {
      selectedModelKey,
      mainPromptValue,
      formFields,
    };
    localStorage.setItem(settingsStorageKey, JSON.stringify(settingsToSave));
  }, [selectedModelKey, mainPromptValue, formFields, currentModelConfig, initialLoadComplete, settingsStorageKey]);


  useEffect(() => {
    if (history.length > 0) {
        localStorage.setItem(historyStorageKey, JSON.stringify(history));
    } else {
        localStorage.removeItem(historyStorageKey);
    }
  }, [history, historyStorageKey]);

  const handleInputChange = useCallback((name: string, value: string | number | boolean) => {
    setFormFields(prevFields => ({ ...prevFields, [name]: value }));
  }, []);

  const handleMainPromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!userTouchedPrompt) setUserTouchedPrompt(true);
    setMainPromptValue(e.target.value);
  }, [userTouchedPrompt]);
  useEffect(() => {
    // On language change, remount is already handled via Textarea key.
    // If the user hasn't typed anything (or prompt is blank), keep it blank so the new placeholder shows.
    if (!userTouchedPrompt || mainPromptValue.trim() === '') {
      setMainPromptValue('');
      setUserTouchedPrompt(false);
    }
    // Do not clear if the user has typed; preserve their text across language switches.
  }, [language]);
  
  const handleSingleFileSelectAndConvert = useCallback((file: File | null) => {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUri = reader.result as string;
            setUploadedImagePreview(dataUri);
            
            // Set the uploaded image in formFields for specific models
            if (currentModelConfig?.id === 'ideogram-character') {
              setFormFields(prev => ({ ...prev, character_reference_image: dataUri }));
            } else if (currentModelConfig?.id === 'qwen-image-edit') {
              setFormFields(prev => ({ ...prev, image: dataUri }));
            } else if (currentModelConfig?.id === 'flux-kontext-pro') {
              setFormFields(prev => ({ ...prev, input_image: dataUri }));
            } else if (currentModelConfig?.id === 'nano-banana') {
              setFormFields(prev => ({ ...prev, image_input: dataUri }));
            }
        };
        reader.readAsDataURL(file);
    } else if (file) {
        toast({ title: "Invalid File", description: "Please upload an image file.", variant: "destructive" });
        setUploadedImagePreview(null);
    }
  }, [toast]);


  const handleSingleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleSingleFileSelectAndConvert(event.target.files?.[0] || null);
    if (singleFileInputRef.current) {
      singleFileInputRef.current.value = "";
    }
  }, [handleSingleFileSelectAndConvert]);
  
  const handleClearUploadedImage = useCallback(() => {
    setUploadedImagePreview(null);
    if (singleFileInputRef.current) {
      singleFileInputRef.current.value = "";
    }
    
    // Clear the uploaded image from formFields for specific models
    if (currentModelConfig?.id === 'ideogram-character') {
      setFormFields(prev => ({ ...prev, character_reference_image: '' }));
    } else if (currentModelConfig?.id === 'qwen-image-edit') {
      setFormFields(prev => ({ ...prev, image: '' }));
    } else if (currentModelConfig?.id === 'flux-kontext-pro') {
      setFormFields(prev => ({ ...prev, input_image: '' }));
    } else if (currentModelConfig?.id === 'nano-banana') {
      setFormFields(prev => ({ ...prev, image_input: '' }));
    }
  }, [currentModelConfig]);
  
  const handleMultipleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Nano Banana: Handle multiple input images (0-5 files)
    if (currentModelConfig?.id === 'nano-banana') {
      if (uploadedImages.length + files.length > 5) {
        toast({ title: "Upload Limit Exceeded", description: "You can upload a maximum of 5 input images.", variant: "destructive" });
        return;
      }

      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const newImages = [...uploadedImages, reader.result as string];
            setUploadedImages(newImages);
            setFormFields(prev => ({ ...prev, image_input: newImages }));
          };
          reader.readAsDataURL(file);
        }
      });

      if (multipleFileInputRef.current) {
        multipleFileInputRef.current.value = "";
      }
      return;
    }

    // Default behavior for other models (reference images)
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
  }, [referenceImages.length, uploadedImages.length, currentModelConfig, toast]);

  const handleRemoveImage = useCallback((index: number) => {
    if (currentModelConfig?.id === 'nano-banana') {
      const newImages = uploadedImages.filter((_, i) => i !== index);
      setUploadedImages(newImages);
      setFormFields(prev => ({ ...prev, image_input: newImages }));
    }
  }, [uploadedImages, currentModelConfig]);

  const handleRemoveReferenceImage = useCallback((index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
    setReferenceTags(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  const handleAddTag = useCallback(() => {
    if (currentTag.trim() && referenceTags.length < referenceImages.length) {
        setReferenceTags(prev => [...prev, currentTag.trim()]);
        setCurrentTag('');
    } else if (referenceTags.length >= referenceImages.length) {
        toast({ title: "Tag Limit Reached", description: "You can only add as many tags as you have reference images.", variant: "destructive" });
    }
  }, [currentTag, referenceImages.length, referenceTags.length, toast]);


  const handleRemoveTag = useCallback((index: number) => {
    setReferenceTags(prev => prev.filter((_, i) => i !== index));
  }, []);


  const renderInputField = useCallback((inputConfig: ReplicateModelInput) => {
    const commonProps = {
      id: `${inputConfig.name}-replicate-param-${currentModelConfig?.id || 'default'}`,
      name: inputConfig.name,
      disabled: loading,
    };

    // Force re-render when language changes
    const currentLanguage = language;





    const label = (
        <Label htmlFor={commonProps.id} className="text-sm font-medium flex items-center">
            {inputConfig.labelKey ? t(inputConfig.labelKey) : inputConfig.label}
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
                className="bg-tool-input-bg border-border focus-visible:ring-primary min-h-[60px]"
                rows={3}
                required={inputConfig.required}
            />
            </div>
        );
      case 'url':
        // Hide specific image fields for different models (handled as mini upload)
        if (inputConfig.name === "character_reference_image" && currentModelConfig?.id === 'ideogram-character') {
          return null;
        }
        if (inputConfig.name === "image" && currentModelConfig?.id === 'qwen-image-edit') {
          return null;
        }
        if (inputConfig.name === "input_image" && currentModelConfig?.id === 'flux-kontext-pro') {
          return null;
        }
        if (inputConfig.name === "image_input" && currentModelConfig?.id === 'nano-banana') {
          return null;
        }
        // Regular URL fields
        return (
          <div key={inputConfig.name} className="space-y-1.5">
            {label}
            <Input
              {...commonProps}
              type="url"
              value={formFields[inputConfig.name] ?? ''}
              placeholder={inputConfig.placeholder || "https://example.com/image.png"}
              onChange={(e) => handleInputChange(inputConfig.name, e.target.value)}
              className="bg-tool-input-bg border-border focus-visible:ring-primary"
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
              className="bg-tool-input-bg border-border focus-visible:ring-primary"
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
                    <SelectTrigger id={commonProps.id} className="w-full bg-tool-input-bg border-border focus:ring-primary">
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
                        className="bg-tool-input-bg border-border"
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
  }, [currentModelConfig, loading, formFields, handleInputChange, isRunwayModelSelected, isFluxModelSelected, isVideoModelSelected, hasCharacterReference, referenceImages, currentTag, referenceTags, handleRemoveReferenceImage, handleAddTag, handleRemoveTag, language]);

  const handleModelChange = useCallback((newModelKey: string) => {
    // Save current prompt before changing model
    const currentPrompt = mainPromptValue;
    
    setSelectedModelKey(newModelKey);
    
    // Restore prompt after model change
    setTimeout(() => {
      if (currentPrompt && currentPrompt.trim() !== '') {
        setMainPromptValue(currentPrompt);
      }
    }, 100);
  }, [mainPromptValue]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedModelKey || !currentModelConfig) {
        toast({ title: "No Model Selected", description: "Please select a model first.", variant: "destructive" });
        return;
    }

    const currentPayload: Record<string, any> = { model: selectedModelKey, password: password };
    
    // --- Prompt Handling ---
    const effectivePrompt = mainPromptValue.trim();
    if (effectivePrompt) {
        currentPayload.prompt = effectivePrompt;
    } else {
        const promptConfig = currentModelConfig.inputs.find(i => i.isPrompt && i.required);
        if (promptConfig) {
            toast({ title: "Prompt Missing", description: `The field "${promptConfig.label}" is required for this model.`, variant: "destructive" });
            return;
        }
    }
    
    // --- Image Input Handling ---
    if (uploadedImagePreview) {
        const imageInputConfig = currentModelConfig.inputs.find(i => i.type === 'url' && i.required);
        if (imageInputConfig) {
            currentPayload[imageInputConfig.name] = uploadedImagePreview;
        } else if (isFluxModelSelected) { // Fallback for flux
             currentPayload.input_image = uploadedImagePreview;
        }
    } else {
        const imageInputConfig = currentModelConfig.inputs.find(i => i.type === 'url' && i.required);
        if (imageInputConfig) {
            toast({ title: "Image Missing", description: `The field "${imageInputConfig.label}" is required for this model.`, variant: "destructive" });
            return;
        }
    }
    
    // --- Runway-Specific Multi-Image/Tag Handling ---
    if (isRunwayModelSelected) {
        if (referenceImages.length > 0) {
            currentPayload.reference_images = referenceImages;
            if (referenceTags.length !== referenceImages.length) {
                toast({ title: "Tag Mismatch", description: "You must provide a tag for each reference image.", variant: "destructive"});
                return;
            }
            if (referenceTags.length > 0) {
                 currentPayload.reference_tags = referenceTags;
            }
        }
    }

    // --- Nano Banana Multi-Image Handling ---
    if (currentModelConfig.id === 'nano-banana') {
        if (uploadedImages.length > 0) {
            currentPayload.image_input = uploadedImages;
        }
    }

    // --- Generic Form Field Handling ---
    for (const input of currentModelConfig.inputs) {
        if (input.isPrompt || input.type === 'url' || input.type === 'files' || input.type === 'tags') {
            continue;
        }
        
        // Handle megapixels separately to ensure it's always a string
        if (input.name === 'megapixels') {
            const valueToUse = formFields[input.name];
            const finalValue = valueToUse !== undefined && valueToUse !== '' && valueToUse !== null ? valueToUse : input.default;
            if (finalValue !== undefined && finalValue !== '' && finalValue !== null) {
                currentPayload[input.name] = String(finalValue);
            }
            continue;
        }
        
        const valueToUse = formFields[input.name];
        const finalValue = valueToUse !== undefined && valueToUse !== '' && valueToUse !== null ? valueToUse : input.default;
        
        
        // Always send the value if it exists or has a default
        if (finalValue !== undefined && finalValue !== '' && finalValue !== null) {
            if (input.type === 'number') {
                const numValue = parseFloat(String(finalValue));
                if (!isNaN(numValue)) {
                    currentPayload[input.name] = numValue;
                }
            } else {
                currentPayload[input.name] = finalValue;
            }
        } else if (input.type === 'boolean') {
            // Always send boolean values, even if false
            currentPayload[input.name] = valueToUse === true;
        }
    }

    // Explicitly set default values for problematic fields
    if (currentModelConfig.id === 'ideogram-character') {
        if (!currentPayload.magic_prompt_option) currentPayload.magic_prompt_option = "Auto";
        if (!currentPayload.rendering_speed) currentPayload.rendering_speed = "Default";
        if (!currentPayload.style_type) currentPayload.style_type = "Auto";
        if (!currentPayload.resolution) currentPayload.resolution = "None";
    }
    


    setLoading(true);
    setError(null);
    setSelectedImage(null);

    try {
      const apiEndpoint = '/api/replicate';
      
      const response = await fetch(apiEndpoint, {
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
              id: generateUUID(),
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
  }, [selectedModelKey, currentModelConfig, password, mainPromptValue, isFluxModelSelected, isVideoModelSelected, hasCharacterReference, uploadedImagePreview, formFields, isRunwayModelSelected, referenceImages, referenceTags, toast]);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    setSelectedImage(null);
    localStorage.removeItem(historyStorageKey);
    toast({ title: "History Cleared", description: "Your image generation history has been removed." });
  }, [toast, historyStorageKey]);

  const handleSelectHistoryItem = useCallback((item: ImageHistoryItem) => {
    setSelectedImage(item);
    setMainPromptValue(item.prompt);
    setIsHistoryPanelOpen(false);
  }, []);
  
  const canSubmit = !loading && currentModelConfig &&
    ( (isFluxModelSelected && (mainPromptValue.trim() !== '' || uploadedImagePreview)) ||
      (isFluxKreaDev && mainPromptValue.trim() !== '') ||
      (isQwenImage && mainPromptValue.trim() !== '') ||
      (hasCharacterReference && mainPromptValue.trim() !== '' && uploadedImagePreview) ||
      (isVideoModelSelected && mainPromptValue.trim() !== '' && uploadedImagePreview) ||
      (!isFluxModelSelected && !isFluxKreaDev && !isQwenImage && !isVideoModelSelected && !hasCharacterReference && mainPromptValue.trim() !== '') );

  const toggleHistoryPanel = useCallback(() => {
    setIsHistoryPanelOpen(prev => !prev);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col h-full bg-background text-foreground">
        <main className="flex-grow flex flex-col p-4 md:p-6 space-y-4 overflow-y-auto no-scrollbar">
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

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Model Selector - Top Left */}
      <div className="px-4 pt-4 pb-2">
        <div className="max-w-6xl mx-auto">
          <Select value={selectedModelKey} onValueChange={handleModelChange} disabled={loading}>
            <SelectTrigger className="bg-gradient-to-r from-background/80 to-background/60 h-12 w-auto px-4 rounded-xl text-lg hover:from-background/90 hover:to-background/70 focus-visible:ring-primary border-border/50 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold">
              <SelectValue placeholder={t('imageGen.selectModel')} />
            </SelectTrigger>
            <SelectContent>
              {modelKeys.map(key => (
                <SelectItem key={key} value={key}>
                  {modelConfigs[key].name}
                  {modelConfigs[key].outputType === 'video' && <Badge variant="secondary" className="ml-2 text-xs">Video</Badge>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <main className="flex-grow flex flex-col p-4 md:p-6 space-y-4 overflow-y-auto no-scrollbar">
        <Card className="flex-grow flex flex-col border-0 shadow-none">
          <CardHeader className="py-3 px-4 flex flex-col">
          </CardHeader>
          <CardContent className="p-2 md:p-4 flex-grow bg-card rounded-b-lg flex items-center justify-center">
            {loading && <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />}
            {error && !loading && (
              <div className="w-full flex flex-col items-center justify-center text-destructive space-y-2 max-w-md mx-auto text-center">
                <AlertCircle className="w-8 h-8 sm:w-10 sm:w-10 mb-2" />
                <p className="font-semibold text-md sm:text-lg">Generation Error</p>
                <p className="text-xs sm:text-sm leading-relaxed">{error}</p>
              </div>
            )}
            {!loading && !error && selectedImage && (
              <div className={cn(
                "relative w-full h-full",
                selectedImage.videoUrl ? "aspect-video max-h-[calc(100vh-400px)]" : "aspect-square max-h-[calc(100vh-400px)]"
              )}>
                {selectedImage.videoUrl ? (
                  <video src={selectedImage.videoUrl} controls autoPlay muted loop className="rounded-md w-full h-full object-contain" data-ai-hint="ai generated video">
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <a href={selectedImage.imageUrl} target="_blank" rel="noopener noreferrer" className="block relative w-full h-full group">
                    <NextImage src={selectedImage.imageUrl} alt={`Generated using ${selectedImage.model}`} fill sizes="100vw" style={{ objectFit: "contain" }} className="rounded-md" data-ai-hint="ai generated digital art" />
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
      </main>

      <footer className="px-4 pt-2 pb-4 shrink-0">
        <div className="max-w-6xl mx-auto relative">

          <form onSubmit={handleSubmit}>
            {/* Prompt Input und Execute auf einer Höhe - Responsive */}
            <div className="bg-gradient-to-r from-secondary/80 to-secondary rounded-3xl p-3 shadow-2xl border border-border/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
              <Textarea
                key={`prompt-${selectedModelKey}-${language}`}
                ref={textareaRef}
                value={mainPromptValue}
                onChange={handleMainPromptChange}
                placeholder={getPromptPlaceholder()}
                className="flex-grow bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 border-0 shadow-none p-2 m-0 leading-tight resize-none overflow-y-auto"
                rows={1}
                disabled={loading || !currentModelConfig}
                aria-label="Main prompt input"
                style={{ lineHeight: '1.5rem', fontSize: '18px' }}
              />
              <div className="flex gap-3 flex-shrink-0">
                {/* Input Images Upload für Google Nano Banana (0-5 files) */}
                {currentModelConfig?.id === 'nano-banana' && (
                  <div className="flex gap-2 flex-shrink-0">
                    {/* Uploaded Images Display */}
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative h-12 w-12 group">
                        <NextImage 
                          src={image} 
                          alt={`Input image ${index + 1}`} 
                          fill 
                          sizes="48px" 
                          style={{ objectFit: 'cover' }} 
                          className="rounded-xl" 
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Add More Images Button */}
                    {uploadedImages.length < 5 && (
                      <div
                        className="relative h-12 w-12 cursor-pointer group flex-shrink-0"
                        onClick={() => multipleFileInputRef.current?.click()}
                        aria-label="Add input images"
                      >
                        <div className="h-12 w-12 rounded-xl border-2 border-dashed border-muted-foreground/50 flex items-center justify-center text-muted-foreground/50 hover:bg-muted/20 hover:border-muted-foreground">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Input Image Upload für Flux Kontext Pro */}
                {currentModelConfig?.id === 'flux-kontext-pro' && (
                  <div
                    className="relative h-12 w-12 cursor-pointer group flex-shrink-0"
                    onClick={() => {
                      if (uploadedImagePreview) handleClearUploadedImage();
                      else singleFileInputRef.current?.click();
                    }}
                    aria-label={uploadedImagePreview ? "Clear input image" : "Upload input image"}
                  >
                    {uploadedImagePreview ? (
                      <>
                        <NextImage src={uploadedImagePreview} alt="Input image preview" fill sizes="48px" style={{ objectFit: 'cover' }} className="rounded-xl" data-ai-hint="input image thumbnail" />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                          <X className="h-5 w-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="h-12 w-12 rounded-xl border-2 border-dashed border-muted-foreground/50 flex items-center justify-center text-muted-foreground/50 hover:bg-muted/20 hover:border-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Image Upload für Qwen Image Edit */}
                {currentModelConfig?.id === 'qwen-image-edit' && (
                  <div
                    className="relative h-12 w-12 cursor-pointer group flex-shrink-0"
                    onClick={() => {
                      if (uploadedImagePreview) handleClearUploadedImage();
                      else singleFileInputRef.current?.click();
                    }}
                    aria-label={uploadedImagePreview ? "Clear image to edit" : "Upload image to edit"}
                  >
                    {uploadedImagePreview ? (
                      <>
                        <NextImage src={uploadedImagePreview} alt="Image to edit preview" fill sizes="48px" style={{ objectFit: 'cover' }} className="rounded-xl" data-ai-hint="image to edit thumbnail" />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                          <X className="h-5 w-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="h-12 w-12 rounded-xl border-2 border-dashed border-muted-foreground/50 flex items-center justify-center text-muted-foreground/50 hover:bg-muted/20 hover:border-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Character Reference Image Upload für Ideogram Character */}
                {currentModelConfig?.id === 'ideogram-character' && (
                  <div
                    className="relative h-12 w-12 cursor-pointer group flex-shrink-0"
                    onClick={() => {
                      if (uploadedImagePreview) handleClearUploadedImage();
                      else singleFileInputRef.current?.click();
                    }}
                    aria-label={uploadedImagePreview ? "Clear character reference image" : "Upload character reference image"}
                  >
                    {uploadedImagePreview ? (
                      <>
                        <NextImage src={uploadedImagePreview} alt="Character reference preview" fill sizes="48px" style={{ objectFit: 'cover' }} className="rounded-xl" data-ai-hint="character reference thumbnail" />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                          <X className="h-5 w-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="h-12 w-12 rounded-xl border-2 border-dashed border-muted-foreground/50 flex items-center justify-center text-muted-foreground/50 hover:bg-muted/20 hover:border-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                )}
                <Button type="submit" disabled={!canSubmit} className="h-12 px-8 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('imageGen.execute')}
                </Button>
              </div>
            </div>

            {/* Configuration Panel - Responsive und sortiert */}
            <div className="bg-gradient-to-br from-popover/95 to-popover/80 text-popover-foreground rounded-2xl shadow-2xl border border-border/30 p-6 backdrop-blur-sm">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                {currentModelConfig ? (
                  <>
                    {currentModelConfig.inputs
                      .filter(input => !input.isPrompt && !input.hidden)
                      .sort((a, b) => {
                        // Sortierung: Boolean (Toggle) zuerst, dann Select, dann Number
                        const typeOrder = { boolean: 0, select: 1, number: 2, text: 3, url: 4 };
                        return (typeOrder[a.type as keyof typeof typeOrder] || 5) - (typeOrder[b.type as keyof typeof typeOrder] || 5);
                      })
                      .map(input => renderInputField(input))}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground p-4 text-center col-span-full">Select a model to see its parameters.</p>
                )}
              </div>
            </div>

            <input type="file" ref={singleFileInputRef} onChange={handleSingleFileChange} accept="image/*" className="hidden" />
            <input type="file" ref={multiFileInputRef} onChange={handleMultipleFileChange} accept="image/*" multiple className="hidden" />
            <input type="file" ref={multipleFileInputRef} onChange={handleMultipleFileChange} accept="image/*" multiple className="hidden" />
          </form>

          <div className="mt-3 flex justify-between items-center px-1">
            <button
              onClick={toggleHistoryPanel}
              className={cn(
                "text-left text-foreground/90 text-xl font-bold font-code select-none truncate",
                "hover:text-foreground transition-colors duration-200 px-2 py-1 rounded-md"
              )}
              aria-label="Open image generation history"
            >
              <p>{t('imageGen.gallery')}</p>
            </button>
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

export default ReplicateImageTool;

    
    
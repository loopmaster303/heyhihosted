
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
import { Loader2, AlertCircle, Info, ImageIcon, X, MoreHorizontal, ChevronDown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import NextImage from 'next/image';
import { modelConfigs, type ReplicateModelConfig, type ReplicateModelInput } from '@/config/replicate-models';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const REPLICATE_TOOL_SETTINGS_KEY = 'replicateImageToolSettings';

const ReplicateImageTool: React.FC = () => {
  const { toast } = useToast();
  const modelKeys = Object.keys(modelConfigs);
  const [selectedModelKey, setSelectedModelKey] = useState<string>(""); 
  const [currentModelConfig, setCurrentModelConfig] = useState<ReplicateModelConfig | null>(null);
  
  const [formFields, setFormFields] = useState<Record<string, any>>({});
  const [mainPromptValue, setMainPromptValue] = useState('');

  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFluxModelSelected = !!currentModelConfig?.id.startsWith("flux-kontext");
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
        if (!((input.isPrompt && input.name === 'prompt') || (config.id.startsWith("flux-kontext") && input.name === 'input_image'))) {
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

      setOutputUrl(null);
      setError(null);
      setUploadedImageFile(null);
      setUploadedImagePreview(null);
    } else {
      setCurrentModelConfig(null);
      setFormFields({});
      setMainPromptValue('');
    }
  }, [selectedModelKey, initialLoadComplete]);

  useEffect(() => {
    if (!initialLoadComplete || !selectedModelKey || !currentModelConfig) return; 

    const settingsToSave = {
      selectedModelKey,
      mainPromptValue,
      formFields,
    };
    localStorage.setItem(REPLICATE_TOOL_SETTINGS_KEY, JSON.stringify(settingsToSave));
  }, [selectedModelKey, mainPromptValue, formFields, currentModelConfig, initialLoadComplete]);


  const handleInputChange = useCallback((name: string, value: string | number | boolean) => {
    setFormFields(prevFields => ({ ...prevFields, [name]: value }));
  }, []);

  const handleMainPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMainPromptValue(e.target.value);
  };

  const handleFileSelectAndConvert = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setUploadedImageFile(file);
        setUploadedImagePreview(dataUri);
        if (isFluxModelSelected) { 
            setFormFields(prev => ({...prev, input_image: dataUri }));
        }
      };
      reader.readAsDataURL(file);
    } else if (file) {
      toast({ title: "Invalid File", description: "Please upload an image file.", variant: "destructive" });
      setUploadedImageFile(null);
      setUploadedImagePreview(null);
      if (isFluxModelSelected) { 
        setFormFields(prev => ({...prev, input_image: undefined }));
      }
    }
  };

  const handleReplicateFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelectAndConvert(event.target.files?.[0] || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClearUploadedImage = () => {
    setUploadedImageFile(null);
    setUploadedImagePreview(null);
    if (isFluxModelSelected) { 
        setFormFields(prev => ({...prev, input_image: undefined }));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

    const currentPayload: Record<string, any> = { model: selectedModelKey };

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


    for (const input of currentModelConfig.inputs) {
      if ((input.isPrompt && input.name === 'prompt')) continue; 
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
    setOutputUrl(null);

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
        const resultUrl = Array.isArray(data.output) ? data.output[0] : data.output;
        if (typeof resultUrl === 'string' && resultUrl.trim() !== '') {
            setOutputUrl(resultUrl);
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

  const isVideoOutput = currentModelConfig?.outputType === 'video';
  
  const dynamicPromptPlaceholder = currentModelConfig
    ? (currentModelConfig.inputs.find(i => i.isPrompt && i.name === 'prompt')?.placeholder || 
       (isFluxModelSelected ? "Describe image or upload reference..." : `Prompt for ${currentModelConfig.name}...`))
    : "[import, creativity — prompt] !execute";


  const canSubmit = !loading && currentModelConfig &&
    ( (isFluxModelSelected && (mainPromptValue.trim() !== '' || uploadedImagePreview)) ||
      (!isFluxModelSelected && mainPromptValue.trim() !== '') );


  return (
    <div className="flex flex-col h-full bg-background text-foreground p-4 md:p-6 space-y-4 md:space-y-6">
      <form onSubmit={handleSubmit}>
        <div className="bg-input rounded-xl p-3 shadow-lg flex flex-col gap-2 relative">
          <Textarea
            value={mainPromptValue}
            onChange={handleMainPromptChange}
            placeholder={dynamicPromptPlaceholder}
            className="flex-grow min-h-[80px] max-h-[150px] bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none text-base p-2 pr-24"
            rows={3}
            disabled={loading || !currentModelConfig}
            aria-label="Main prompt input"
          />
          <Button
            type="submit"
            disabled={!canSubmit}
            className="absolute top-3 right-3 h-8 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Execute
          </Button>

          <div className="flex items-center justify-between pt-2 px-1">
            <div className="flex items-center space-x-1">
              {isFluxModelSelected && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                        disabled={loading}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        aria-label="Upload reference image for Flux model"
                      >
                        <ImageIcon className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Upload Reference Image</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
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
                  className="w-80 sm:w-96 bg-popover text-popover-foreground shadow-xl border-border max-h-[65vh] p-0" 
                  side="bottom" 
                  align="end"
                  collisionPadding={10}
                >
                  <div className="grid gap-4 p-3 overflow-y-auto max-h-[inherit]">
                      {currentModelConfig && (
                        <>
                          <div className="space-y-1 px-1">
                            <h4 className="font-medium leading-none">{currentModelConfig.name} Parameters</h4>
                            <p className="text-xs text-muted-foreground">Adjust advanced options for generation.</p>
                          </div>
                          <div className="grid gap-3">
                            {currentModelConfig.inputs
                              .filter(input => {
                                if (input.isPrompt && input.name === 'prompt') return false;
                                if (isFluxModelSelected && input.name === "input_image") return false;
                                return true;
                              })
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
        <input type="file" ref={fileInputRef} onChange={handleReplicateFileChange} accept="image/*" className="hidden" />
      </form>

      {isFluxModelSelected && uploadedImagePreview && (
        <div className="mt-3 flex justify-center">
            <div className="relative w-32 h-32 group">
                <NextImage src={uploadedImagePreview} alt="Upload preview" fill style={{ objectFit: "cover" }} className="rounded-md border" data-ai-hint="upload image content"/>
                <Button
                variant="destructive" size="icon"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-70 group-hover:opacity-100 transition-opacity z-10"
                onClick={handleClearUploadedImage} aria-label="Remove image" type="button"
                > <X className="w-4 h-4" /> </Button>
            </div>
        </div>
      )}

      <Card className="flex flex-col min-h-[300px] md:min-h-[400px] border-border shadow-md rounded-lg">
        <CardHeader className="py-3 px-4 border-b border-border">
            <CardTitle className="text-base sm:text-lg">Output</CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-4 flex-grow flex items-center justify-center text-center bg-card rounded-b-lg">
        {loading && <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />}
        {error && !loading && (
            <div className="text-destructive flex flex-col items-center space-y-2 max-w-md mx-auto">
                <AlertCircle className="w-8 h-8 sm:w-10 sm:w-10 mb-2"/>
                <p className="font-semibold text-md sm:text-lg">Generation Error</p>
                <p className="text-xs sm:text-sm leading-relaxed">{error}</p>
            </div>
            )}
        {!loading && !error && outputUrl && (
            <div className={cn(
                "relative w-full h-full", 
                isVideoOutput 
                    ? "aspect-video max-h-[calc(100vh-400px)]" 
                    : "aspect-square max-h-[calc(100vh-400px)]" 
            )}>
            {isVideoOutput ? (
                <video
                    src={outputUrl}
                    controls
                    className="rounded-md w-full h-full object-contain"
                    data-ai-hint="ai generated video"
                >
                    Your browser does not support the video tag.
                </video>
            ) : (
                <a href={outputUrl} target="_blank" rel="noopener noreferrer" className="block relative w-full h-full group">
                    <NextImage
                    src={outputUrl}
                    alt={`Generated using ${currentModelConfig?.name || 'Replicate model'}`}
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
        {!loading && !error && !outputUrl && (
            <div className="text-muted-foreground flex flex-col items-center space-y-2 font-code">
                <p className="text-lg">{`</export>`}</p>
            </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReplicateImageTool;


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
import { Loader2, AlertCircle, Info, ImageIcon, X, MoreHorizontal, ArrowRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import NextImage from 'next/image';
import { modelConfigs, type ReplicateModelConfig, type ReplicateModelInput } from '@/config/replicate-models';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';


const ReplicateImageTool: React.FC = () => {
  const { toast } = useToast();
  const modelKeys = Object.keys(modelConfigs);
  const [selectedModelKey, setSelectedModelKey] = useState<string>(""); // Initialize empty
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

  useEffect(() => {
    if (selectedModelKey && modelConfigs[selectedModelKey]) {
      const config = modelConfigs[selectedModelKey];
      setCurrentModelConfig(config);
      const initialFields: Record<string, any> = {};
      let initialMainPrompt = '';

      const promptInputConfig = config.inputs.find(input => input.isPrompt && input.name === 'prompt');
      initialMainPrompt = String(promptInputConfig?.default ?? '');
      if (promptInputConfig?.placeholder && !initialMainPrompt) {
        // No explicit default, might be handled by placeholder logic if needed
      }


      config.inputs.forEach(input => {
        if (!((input.isPrompt && input.name === 'prompt') || (config.id.startsWith("flux-kontext") && input.name === 'input_image'))) {
          initialFields[input.name] = input.default ?? (input.type === 'number' ? (input.min ?? 0) : (input.type === 'boolean' ? false : (input.type === 'select' ? (typeof input.options?.[0] === 'object' ? input.options?.[0].value : input.options?.[0]) : '')));
        }
      });
      setMainPromptValue(initialMainPrompt);
      setFormFields(initialFields);

      setOutputUrl(null);
      setError(null);
      setUploadedImageFile(null);
      setUploadedImagePreview(null);
       if (config.id.startsWith("flux-kontext") && initialFields.input_image) {
         delete initialFields.input_image; // ensure this doesn't linger if model changes
      }
    } else {
      setCurrentModelConfig(null); // Explicitly nullify if no model is selected
      setFormFields({});
      setMainPromptValue('');
      setOutputUrl(null);
      setError(null);
      setUploadedImageFile(null);
      setUploadedImagePreview(null);
    }
  }, [selectedModelKey]);

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
        if (isFluxModelSelected) { // Ensure this is only for Flux
            handleInputChange("input_image", dataUri);
        }
      };
      reader.readAsDataURL(file);
    } else if (file) {
      toast({ title: "Invalid File", description: "Please upload an image file.", variant: "destructive" });
      setUploadedImageFile(null);
      setUploadedImagePreview(null);
      if (isFluxModelSelected) { // Ensure this is only for Flux
        handleInputChange("input_image", ""); // Clear it from form fields
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
    if (isFluxModelSelected) { // Ensure this is only for Flux
        handleInputChange("input_image", ""); // Clear it from form fields
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
                    <button type="button" className="ml-1.5 focus:outline-none">
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
                className="bg-input border-border focus-visible:ring-primary"
                rows={inputConfig.isNegativePrompt ? 2 : 3}
                required={inputConfig.required}
            />
            </div>
        );
      case 'url':
         // This case is now specifically handled for input_image by the dedicated upload UI for Flux models
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
              onChange={(e) => handleInputChange(inputConfig.name, parseFloat(e.target.value))}
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
        currentPayload.input_image = formFields.input_image; // This will be the data URI
    } else if (isFluxModelSelected && currentModelConfig.inputs.find(i => i.name === 'input_image')?.required && !uploadedImagePreview && !effectivePrompt) {
        // Flux models might require either prompt OR image, or both. This logic might need adjustment based on exact model behavior.
        // For now, if input_image is required by config and not provided (and no prompt), it's an issue.
        toast({ title: "Input Missing", description: "Flux models require a prompt or an input image.", variant: "destructive" });
        return;
    }


    for (const input of currentModelConfig.inputs) {
      if ((input.isPrompt && input.name === 'prompt')) continue; // Handled by mainPromptValue
      if (isFluxModelSelected && input.name === "input_image") continue; // Handled by uploadedImagePreview/dataURI

      const valueToUse = formFields[input.name];

      if (input.required && (valueToUse === undefined || valueToUse === '' || valueToUse === null)) {
         toast({ title: "Missing Required Field", description: `Please fill in the "${input.label}" field.`, variant: "destructive"});
         return;
      }

      if (valueToUse !== undefined && valueToUse !== '' && valueToUse !== null) {
         if (input.type === 'number') {
          const numValue = parseFloat(String(valueToUse));
          if (!isNaN(numValue)) currentPayload[input.name] = numValue;
          else if (input.default !== undefined && typeof input.default === 'number') currentPayload[input.name] = input.default;
        } else {
          currentPayload[input.name] = valueToUse;
        }
      } else if (input.type === 'boolean' && valueToUse === false) { // Booleans can be explicitly false
         currentPayload[input.name] = valueToUse;
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
            throw new Error("Received empty or invalid output URL from API.");
        }
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        if(data.status && data.status !== "succeeded" && data.status !== "failed" && data.status !== "canceled"){
            setError(`Prediction is ${data.status}. This might take a moment. The backend should poll. If this persists, check logs or Replicate dashboard.`);
            toast({title: `Prediction ${data.status}`, description: "Waiting for completion from Replicate.", variant: "default", duration: 7000});
        } else if (data.status === "failed" || data.status === "canceled") {
            throw new Error(`Prediction ${data.status}. ${data.error || 'Check Replicate dashboard for details.'}`);
        }
         else {
            throw new Error("Unknown response structure from Replicate API or prediction still processing.");
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
  
  let dynamicPromptPlaceholder = "Enter prompt...";
  if (currentModelConfig) {
      const promptConfig = currentModelConfig.inputs.find(i => i.isPrompt && i.name === 'prompt');
      if (promptConfig?.placeholder) {
        dynamicPromptPlaceholder = promptConfig.placeholder;
      } else if (isFluxModelSelected) {
        dynamicPromptPlaceholder = "Enter a text prompt or upload a reference image...";
      } else {
        dynamicPromptPlaceholder = `Enter prompt for ${currentModelConfig.name}...`;
      }
  } else {
    dynamicPromptPlaceholder = "Select a model to begin...";
  }


  const canSubmit = !loading && currentModelConfig &&
    ( (isFluxModelSelected && (mainPromptValue.trim() !== '' || uploadedImagePreview)) ||
      (!isFluxModelSelected && mainPromptValue.trim() !== '') );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background text-foreground">
      <ScrollArea className="flex-grow">
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <form onSubmit={handleSubmit}>
            <div className="bg-input rounded-xl p-3 shadow-lg flex flex-col gap-2">
              <Textarea
                value={mainPromptValue}
                onChange={handleMainPromptChange}
                placeholder={dynamicPromptPlaceholder}
                className="flex-grow min-h-[56px] max-h-[150px] bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none text-base p-2"
                rows={2}
                disabled={loading || !currentModelConfig}
                aria-label="Main prompt input"
              />
              <div className="flex items-center justify-between pt-1 px-1">
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
                        className="h-7 px-3 rounded-full text-xs bg-input hover:bg-muted focus-visible:ring-primary border-border"
                        disabled={loading}
                      >
                        {currentModelConfig ? currentModelConfig.name : "Select Model"}
                        <ChevronDown className="ml-1.5 h-3 w-3 opacity-70" /> 
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                    <PopoverContent className="w-80 sm:w-96 bg-popover text-popover-foreground shadow-xl border-border" side="bottom" align="end">
                      <ScrollArea className="max-h-[60vh] sm:max-h-80 pr-3">
                        <div className="grid gap-4 p-1">
                          {currentModelConfig && (
                            <>
                              <div className="space-y-1">
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
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                  <Button type="submit" disabled={!canSubmit} size="icon" className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleReplicateFileChange} accept="image/*,video/*" className="hidden" />
          </form>

          {isFluxModelSelected && uploadedImagePreview && (
            <div className="mt-3 flex justify-center">
                <div className="relative w-32 h-32 group">
                    <NextImage src={uploadedImagePreview} alt="Upload preview" fill style={{ objectFit: "cover" }} className="rounded-md border" data-ai-hint="upload preview content"/>
                    <Button
                    variant="destructive" size="icon"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-70 group-hover:opacity-100 transition-opacity z-10"
                    onClick={handleClearUploadedImage} aria-label="Remove image" type="button"
                    > <X className="w-4 h-4" /> </Button>
                </div>
            </div>
          )}

          <Card className="flex-grow flex flex-col min-h-[300px] md:min-h-[400px] border-border shadow-md rounded-lg">
            <CardHeader className="py-3 px-4 border-b border-border">
                <CardTitle className="text-base sm:text-lg">Output</CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-4 flex-grow flex items-center justify-center text-center bg-card rounded-b-lg">
            {loading && <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />}
            {error && !loading && (
                <div className="text-destructive flex flex-col items-center space-y-2 max-w-md mx-auto">
                    <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 mb-2"/>
                    <p className="font-semibold text-md sm:text-lg">Generation Error</p>
                    <p className="text-xs sm:text-sm leading-relaxed">{error}</p>
                </div>
                )}
            {!loading && !error && outputUrl && (
                <div className={cn(
                    "relative w-full",
                    isVideoOutput 
                        ? "aspect-video max-h-[calc(100vh-450px)]" 
                        // For images, use aspect-square and max-width to control size within the flex centered CardContent
                        : "aspect-square max-h-[calc(100vh-450px)] max-w-full md:max-w-md lg:max-w-lg mx-auto" 
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
                        alt={`Generated using ${currentModelConfig?.name}`}
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
            {!loading && !error && !outputUrl && currentModelConfig && (
                <div className="text-muted-foreground flex flex-col items-center space-y-3">
                <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 opacity-50" />
                <p className="text-sm sm:text-md">
                    Your {isVideoOutput ? 'video' : 'image'} from {currentModelConfig.name} will appear here.
                </p>
                </div>
            )}
             {!loading && !error && !outputUrl && !currentModelConfig && (
                <div className="text-muted-foreground flex flex-col items-center space-y-3">
                    <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 opacity-50" />
                    <p className="text-sm sm:text-md">Select a model to begin.</p>
                </div>
            )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ReplicateImageTool;


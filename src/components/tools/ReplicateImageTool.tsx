
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, ImagePlus, AlertCircle, Wand2, Info, Paperclip, X, Settings, ArrowRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import NextImage from 'next/image';
import { modelConfigs, type ReplicateModelConfig, type ReplicateModelInput } from '@/config/replicate-models';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const ReplicateImageTool: React.FC = () => {
  const { toast } = useToast();
  const modelKeys = Object.keys(modelConfigs);
  const [selectedModelKey, setSelectedModelKey] = useState<string | undefined>(modelKeys.length > 0 ? modelKeys[0] : undefined);
  const [currentModelConfig, setCurrentModelConfig] = useState<ReplicateModelConfig | null>(null);
  
  // Unified formFields for all models, specific prompt for Flux UI
  const [formFields, setFormFields] = useState<Record<string, any>>({});
  const [fluxPrompt, setFluxPrompt] = useState(''); // Specific prompt state for Flux UI

  const [outputUrl, setOutputUrl] = useState<string | null>(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedModelKey && modelConfigs[selectedModelKey]) {
      const config = modelConfigs[selectedModelKey];
      setCurrentModelConfig(config);
      const initialFields: Record<string, any> = {};
      config.inputs.forEach(input => {
        initialFields[input.name] = input.default ?? (input.type === 'number' ? 0 : (input.type === 'boolean' ? false : (input.type === 'select' ? (typeof input.options?.[0] === 'object' ? input.options?.[0].value : input.options?.[0]) : '')));
      });
      setFormFields(initialFields);
      setFluxPrompt(initialFields.prompt || ''); // Initialize fluxPrompt if model has prompt
      setOutputUrl(null);
      setError(null);
      setUploadedImageFile(null);
      setUploadedImagePreview(null);
    } else {
      setCurrentModelConfig(null);
      setFormFields({});
      setFluxPrompt('');
      setOutputUrl(null);
      setError(null);
      setUploadedImageFile(null);
      setUploadedImagePreview(null);
    }
  }, [selectedModelKey]);

  const handleInputChange = useCallback((name: string, value: string | number | boolean) => {
    setFormFields(prevFields => ({ ...prevFields, [name]: value }));
  }, []);

  const handleFileSelectAndConvert = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setUploadedImageFile(file);
        setUploadedImagePreview(dataUri);
        handleInputChange("input_image", dataUri); 
      };
      reader.readAsDataURL(file);
    } else if (file) {
      toast({ title: "Invalid File", description: "Please upload an image file.", variant: "destructive" });
      setUploadedImageFile(null);
      setUploadedImagePreview(null);
      handleInputChange("input_image", ""); 
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
    handleInputChange("input_image", ""); 
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderInputField = (inputConfig: ReplicateModelInput, isForFluxPopover: boolean = false) => {
    const commonProps = {
      id: `${inputConfig.name}${isForFluxPopover ? '-flux-popover' : ''}`, // Ensure unique IDs
      name: inputConfig.name,
      disabled: loading,
    };
    
    const label = (
        <Label htmlFor={commonProps.id} className="text-sm font-medium flex items-center">
            {inputConfig.label}
            {inputConfig.required && (!uploadedImagePreview && inputConfig.name === "input_image") && <span className="text-destructive ml-1">*</span>}
            {inputConfig.info && (
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                <TooltipTrigger asChild>
                    <Info className="ml-1.5 h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs bg-popover text-popover-foreground border border-border shadow-lg p-2 rounded-md text-xs">
                    <p>{inputConfig.info}</p>
                </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            )}
        </Label>
    );

    // This specific rendering for input_image is now part of the Flux-specific UI
    if (inputConfig.name === "input_image" && currentModelConfig?.id.startsWith("flux-kontext") && !isForFluxPopover) {
        return null; // Handled by the dedicated Flux UI section
    }
    if (inputConfig.name === "prompt" && currentModelConfig?.id.startsWith("flux-kontext") && !isForFluxPopover) {
        return null; // Handled by the dedicated Flux UI section's Textarea
    }


    switch (inputConfig.type) {
      case 'text':
        const isLargeText = inputConfig.isPrompt || inputConfig.isNegativePrompt;
        return (
            <div key={inputConfig.name} className="space-y-1.5">
            {label}
            <Textarea
                {...commonProps}
                value={formFields[inputConfig.name] ?? ''}
                placeholder={inputConfig.placeholder || `Enter ${inputConfig.label.toLowerCase()}`}
                onChange={(e) => handleInputChange(inputConfig.name, e.target.value)}
                className="bg-input border-border focus-visible:ring-primary"
                rows={isLargeText ? 3 : 2}
                required={inputConfig.required}
            />
            </div>
        );
      case 'url': 
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
              value={formFields[inputConfig.name] ?? ''}
              min={inputConfig.min}
              max={inputConfig.max}
              step={inputConfig.step}
              placeholder={inputConfig.placeholder || String(inputConfig.default) || ''}
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
                    value={formFields[inputConfig.name] ?? inputConfig.default ?? ''}
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
    if (!selectedModelKey || !currentModelConfig) return;

    const currentPayload: Record<string, any> = { model: selectedModelKey };

    // For Flux models, the prompt comes from fluxPrompt state
    if (currentModelConfig.id.startsWith("flux-kontext")) {
        if (!fluxPrompt.trim() && !uploadedImagePreview) {
             toast({ title: "Input Missing", description: "Please enter a prompt or upload an image for Flux models.", variant: "destructive"});
             return;
        }
        currentPayload.prompt = fluxPrompt.trim();
        if (uploadedImagePreview) {
            currentPayload.input_image = uploadedImagePreview;
        }
    }


    for (const input of currentModelConfig.inputs) {
      // Skip prompt and input_image for Flux, as they are handled above
      if (currentModelConfig.id.startsWith("flux-kontext") && (input.name === "prompt" || input.name === "input_image")) {
        continue;
      }

      const isInputImageField = input.name === "input_image"; // For non-Flux models if they have it
      const isInputImageUploaded = !!uploadedImagePreview; // General check

      if (input.required) {
        if (isInputImageField && !currentModelConfig.id.startsWith("flux-kontext") && !formFields[input.name]) {
           toast({ title: "Missing Required Image URL", description: `Please provide a URL for the "${input.label}" field.`, variant: "destructive" });
           return;
        }
        if (!isInputImageField && (formFields[input.name] === undefined || formFields[input.name] === '')) {
           toast({ title: "Missing Required Field", description: `Please fill in the "${input.label}" field.`, variant: "destructive"});
           return;
        }
      }
      
      let valueToUse = formFields[input.name];
      if (valueToUse === undefined || valueToUse === '') {
        if (input.default !== undefined) valueToUse = input.default;
        else if (input.type === 'boolean') valueToUse = false; 
      }

      if (valueToUse !== undefined && valueToUse !== '') {
         if (input.type === 'number') {
          const numValue = parseFloat(valueToUse);
          if (!isNaN(numValue)) currentPayload[input.name] = numValue;
          else if (input.default !== undefined && typeof input.default === 'number') currentPayload[input.name] = input.default;
        } else {
          currentPayload[input.name] = valueToUse;
        }
      } else if (valueToUse === false || valueToUse === 0) { 
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
        setOutputUrl(resultUrl);
        toast({ title: "Generation Succeeded!", description: `${currentModelConfig.name} finished processing.` });
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        if(data.status && data.status !== "succeeded" && data.status !== "failed"){
            setError(`Prediction is ${data.status}. This might take a moment. The backend should poll. If this persists, check logs.`);
            toast({title: `Prediction ${data.status}`, description: "Waiting for completion.", variant: "default", duration: 7000});
        } else {
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
  const isFluxModelSelected = currentModelConfig?.id.startsWith("flux-kontext");

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background text-foreground">
      <ScrollArea className="flex-grow">
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <Card className="shadow-md">
              <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Wand2 className="mr-3 h-6 w-6 text-primary" /> 
                    Visualizing Loops 2.0 
                    <span className="ml-2 text-sm font-normal text-muted-foreground">(Replicate API)</span>
                  </CardTitle>
                  <CardDescription>
                      {currentModelConfig?.description || "Select a Replicate model and provide inputs to generate an image or video."}
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  <div>
                      <Label htmlFor="replicate-model-select" className="text-sm font-medium">Select Model</Label>
                      <Select onValueChange={setSelectedModelKey} value={selectedModelKey} disabled={loading}>
                          <SelectTrigger id="replicate-model-select" className="w-full mt-1.5 bg-input border-border focus-visible:ring-primary h-11 text-base">
                          <SelectValue placeholder="Choose an AI model..." />
                          </SelectTrigger>
                          <SelectContent>
                          {modelKeys.map(key => (
                              <SelectItem key={key} value={key} className="text-base py-2">
                              {modelConfigs[key].name}
                              </SelectItem>
                          ))}
                          </SelectContent>
                      </Select>
                  </div>

                  {currentModelConfig && (
                    isFluxModelSelected ? (
                        // UI for Flux Models (mimicking ImageKontextTool)
                        <form onSubmit={handleSubmit}>
                             <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                                <ImagePlus className="w-5 h-5" />
                                <span>Generate images from text and references using {currentModelConfig.name}</span>
                            </div>
                            <div className="bg-card p-3 rounded-lg shadow-md flex flex-col space-y-3 border border-border">
                                <div className="flex items-start space-x-2">
                                {uploadedImagePreview && (
                                    <div className="relative flex-shrink-0 group">
                                    <NextImage src={uploadedImagePreview} alt="Input preview" width={56} height={56} className="rounded-md object-cover w-14 h-14 border" />
                                    <Button
                                        variant="ghost" size="icon"
                                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        onClick={handleClearUploadedImage} aria-label="Remove image" type="button"
                                    > <X className="w-3 h-3" /> </Button>
                                    </div>
                                )}
                                <Textarea
                                    value={fluxPrompt}
                                    onChange={(e) => setFluxPrompt(e.target.value)}
                                    placeholder={`Enter a text prompt or reference image for ${currentModelConfig.name}`}
                                    className="flex-grow min-h-[56px] max-h-[120px] bg-input border-border focus-visible:ring-primary resize-none"
                                    rows={2}
                                    disabled={loading}
                                />
                                </div>
                                <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} type="button" disabled={loading}>
                                    <Paperclip className="mr-2 h-4 w-4" /> Attach
                                    </Button>
                                    <input type="file" ref={fileInputRef} onChange={handleReplicateFileChange} accept="image/*" className="hidden" disabled={loading}/>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" aria-label={`${currentModelConfig.name} Settings`} type="button" disabled={loading}>
                                        <Settings className="h-5 w-5" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 bg-popover text-popover-foreground shadow-xl border-border" side="bottom" align="end">
                                        <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium leading-none">{currentModelConfig.name} Settings</h4>
                                            <p className="text-xs text-muted-foreground">Adjust parameters for {currentModelConfig.name}.</p>
                                        </div>
                                        <div className="grid gap-3 max-h-60 overflow-y-auto pr-2">
                                            {currentModelConfig.inputs
                                                .filter(input => input.name !== "prompt" && input.name !== "input_image") // Prompt/image handled outside popover for Flux
                                                .map(input => renderInputField(input, true))}
                                        </div>
                                        </div>
                                    </PopoverContent>
                                    </Popover>
                                    <Button type="submit" disabled={loading || (!fluxPrompt.trim() && !uploadedImagePreview)} size="icon" aria-label={`Generate image with ${currentModelConfig.name}`}>
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                                    </Button>
                                </div>
                                </div>
                            </div>
                        </form>
                    ) : (
                        // Standard Dynamic UI for other models
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {currentModelConfig.inputs.map(input => renderInputField(input))}
                            <Button type="submit" disabled={loading || !selectedModelKey} className="w-full h-12 text-lg mt-3">
                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : `Generate with ${currentModelConfig.name}`}
                            </Button>
                        </form>
                    )
                  )}
                  {!currentModelConfig && !loading && (
                    <div className="text-center py-10 text-muted-foreground">
                        <Wand2 className="w-12 h-12 mx-auto mb-3 text-primary/40"/>
                        <p>Please select a model to see its options.</p>
                    </div>
                  )}
            </CardContent>
          </Card>

          {selectedModelKey && (
            <Card className="flex-grow flex flex-col min-h-[350px] md:min-h-[450px] border-border shadow-md rounded-lg">
              <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-lg">Output</CardTitle>
              </CardHeader>
              <CardContent className="p-2 md:p-4 flex-grow flex items-center justify-center text-center bg-card rounded-b-lg">
                {loading && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
                {error && !loading && (
                  <div className="text-destructive flex flex-col items-center space-y-2 max-w-md mx-auto">
                      <AlertCircle className="w-10 h-10 mb-2"/>
                      <p className="font-semibold text-lg">Generation Error</p>
                      <p className="text-sm leading-relaxed">{error}</p>
                  </div>
                  )}
                {!loading && !error && outputUrl && (
                  <div className={cn(
                      "relative w-full h-full",
                      isVideoOutput ? "aspect-video max-h-[calc(100vh-500px)]" : "max-h-[calc(100vh-500px)] aspect-auto"
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
                          layout="fill"
                          objectFit="contain"
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
                  <div className="text-muted-foreground flex flex-col items-center space-y-3">
                    <ImagePlus className="w-16 h-16 opacity-50" />
                    <p className="text-md">
                      {currentModelConfig ? `Your ${isVideoOutput ? 'video' : 'image'} from ${currentModelConfig.name} will appear here.` : "Select a model to begin."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ReplicateImageTool;
    

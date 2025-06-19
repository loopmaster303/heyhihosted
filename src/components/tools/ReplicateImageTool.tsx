
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
  
  const [formFields, setFormFields] = useState<Record<string, any>>({});
  const [fluxPrompt, setFluxPrompt] = useState(''); 

  const [outputUrl, setOutputUrl] = useState<string | null>(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFluxModelSelected = currentModelConfig?.id.startsWith("flux-kontext");

  useEffect(() => {
    if (selectedModelKey && modelConfigs[selectedModelKey]) {
      const config = modelConfigs[selectedModelKey];
      setCurrentModelConfig(config);
      const initialFields: Record<string, any> = {};
      config.inputs.forEach(input => {
        initialFields[input.name] = input.default ?? (input.type === 'number' ? 0 : (input.type === 'boolean' ? false : (input.type === 'select' ? (typeof input.options?.[0] === 'object' ? input.options?.[0].value : input.options?.[0]) : '')));
      });
      setFormFields(initialFields);
      
      if (config.id.startsWith("flux-kontext")) {
        setFluxPrompt(initialFields.prompt || '');
      } else {
        setFluxPrompt(''); // Clear fluxPrompt if not a flux model
      }

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

  const renderInputField = (inputConfig: ReplicateModelInput) => {
    const commonProps = {
      id: `${inputConfig.name}-replicate-param`, 
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

    // Handle prompt
    const mainPromptValue = isFluxModelSelected ? fluxPrompt.trim() : (formFields.prompt || '').trim();
    if (currentModelConfig.inputs.find(i => i.name === 'prompt')?.required && !mainPromptValue && !(isFluxModelSelected && uploadedImagePreview) ) {
        toast({ title: "Prompt Missing", description: "Please enter a prompt.", variant: "destructive" });
        return;
    }
    if (mainPromptValue) {
        currentPayload.prompt = mainPromptValue;
    }


    // Handle input_image for Flux models
    if (isFluxModelSelected && uploadedImagePreview) {
        currentPayload.input_image = uploadedImagePreview;
    } else if (isFluxModelSelected && currentModelConfig.inputs.find(i => i.name === 'input_image')?.required && !uploadedImagePreview && !mainPromptValue) {
        toast({ title: "Input Missing", description: "Flux models require a prompt or an input image.", variant: "destructive" });
        return;
    }
    
    // Add other form fields (from settings popover or non-Flux main fields)
    for (const input of currentModelConfig.inputs) {
      if (input.name === "prompt") continue; // Already handled
      if (isFluxModelSelected && input.name === "input_image") continue; // Handled by upload

      const valueToUse = formFields[input.name];

      if (input.required && (valueToUse === undefined || valueToUse === '')) {
         toast({ title: "Missing Required Field", description: `Please fill in the "${input.label}" field.`, variant: "destructive"});
         return;
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
  const mainPromptConfig = currentModelConfig?.inputs.find(i => i.name === 'prompt');
  const mainPromptPlaceholder = mainPromptConfig?.placeholder || `Enter prompt for ${currentModelConfig?.name || 'model'}...`;

  const canSubmit = !loading && currentModelConfig && 
    (isFluxModelSelected ? (fluxPrompt.trim() !== '' || uploadedImagePreview) : (formFields.prompt || '').trim() !== '');

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
                    <form onSubmit={handleSubmit}>
                         <div className="bg-card p-3 rounded-lg shadow-inner flex flex-col space-y-3 border border-border/70">
                            <div className="flex items-start space-x-2">
                            {isFluxModelSelected && uploadedImagePreview && (
                                <div className="relative flex-shrink-0 group w-14 h-14">
                                <NextImage src={uploadedImagePreview} alt="Input preview" layout="fill" className="rounded-md object-cover border" />
                                <Button
                                    variant="ghost" size="icon"
                                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    onClick={handleClearUploadedImage} aria-label="Remove image" type="button"
                                > <X className="w-3 h-3" /> </Button>
                                </div>
                            )}
                            <Textarea
                                value={isFluxModelSelected ? fluxPrompt : (formFields.prompt || '')}
                                onChange={(e) => isFluxModelSelected ? setFluxPrompt(e.target.value) : handleInputChange('prompt', e.target.value)}
                                placeholder={mainPromptPlaceholder}
                                className="flex-grow min-h-[56px] max-h-[150px] bg-input border-border focus-visible:ring-primary resize-none text-base"
                                rows={3}
                                disabled={loading}
                                required={mainPromptConfig?.required && !(isFluxModelSelected && uploadedImagePreview)}
                            />
                            </div>
                            <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                                {isFluxModelSelected && (
                                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} type="button" disabled={loading} className="h-9">
                                    <Paperclip className="mr-1.5 h-4 w-4" /> Attach
                                </Button>
                                )}
                                <input type="file" ref={fileInputRef} onChange={handleReplicateFileChange} accept="image/*" className="hidden" disabled={loading}/>
                            </div>
                            <div className="flex items-center space-x-1.5">
                                <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" aria-label={`${currentModelConfig.name} Settings`} type="button" disabled={loading} className="h-9">
                                      <Settings className="mr-1.5 h-4 w-4" /> Settings
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 sm:w-96 bg-popover text-popover-foreground shadow-xl border-border" side="bottom" align="end">
                                   <ScrollArea className="max-h-80 pr-3">
                                    <div className="grid gap-4">
                                    <div className="space-y-1">
                                        <h4 className="font-medium leading-none">{currentModelConfig.name} Parameters</h4>
                                        <p className="text-xs text-muted-foreground">Adjust advanced options for generation.</p>
                                    </div>
                                    <div className="grid gap-3">
                                        {currentModelConfig.inputs
                                            .filter(input => {
                                                if (input.name === "prompt") return false;
                                                if (isFluxModelSelected && input.name === "input_image") return false;
                                                return true;
                                            })
                                            .map(input => renderInputField(input))}
                                    </div>
                                    </div>
                                   </ScrollArea>
                                </PopoverContent>
                                </Popover>
                                <Button type="submit" disabled={!canSubmit} className="h-9 px-5">
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <> <ArrowRight className="mr-1.5 h-4 w-4" /> Generate </>}
                                </Button>
                            </div>
                            </div>
                        </div>
                    </form>
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
    

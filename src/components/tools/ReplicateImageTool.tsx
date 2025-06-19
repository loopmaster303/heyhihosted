
"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
import { Loader2, ImagePlus, AlertCircle, Wand2, Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import NextImage from 'next/image';
import { modelConfigs, type ReplicateModelConfig, type ReplicateModelInput } from '@/config/replicate-models';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

const ReplicateImageTool: React.FC = () => {
  const { toast } = useToast();
  const modelKeys = Object.keys(modelConfigs);
  const [selectedModelKey, setSelectedModelKey] = useState<string | undefined>(modelKeys.length > 0 ? modelKeys[0] : undefined);
  const [currentModelConfig, setCurrentModelConfig] = useState<ReplicateModelConfig | null>(null);
  
  const [formFields, setFormFields] = useState<Record<string, any>>({});
  const [outputUrl, setOutputUrl] = useState<string | null>(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedModelKey && modelConfigs[selectedModelKey]) {
      const config = modelConfigs[selectedModelKey];
      setCurrentModelConfig(config);
      const initialFields: Record<string, any> = {};
      config.inputs.forEach(input => {
        initialFields[input.name] = input.default ?? (input.type === 'number' ? 0 : (input.type === 'boolean' ? false : (input.type === 'select' ? (typeof input.options?.[0] === 'object' ? input.options?.[0].value : input.options?.[0]) : '')));
      });
      setFormFields(initialFields);
      setOutputUrl(null);
      setError(null);
    } else {
      setCurrentModelConfig(null);
      setFormFields({});
      setOutputUrl(null);
      setError(null);
    }
  }, [selectedModelKey]);

  const handleInputChange = useCallback((name: string, value: string | number | boolean) => {
    setFormFields(prevFields => ({ ...prevFields, [name]: value }));
  }, []);

  const renderInputField = (inputConfig: ReplicateModelInput) => {
    const commonProps = {
      id: inputConfig.name,
      name: inputConfig.name,
      disabled: loading,
    };
    
    const label = (
        <Label htmlFor={inputConfig.name} className="text-sm font-medium flex items-center">
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
                        id={inputConfig.name}
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
                    id={inputConfig.name}
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
                    <SelectTrigger id={inputConfig.name} className="w-full bg-input border-border focus:ring-primary">
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

    for (const input of currentModelConfig.inputs) {
      if (input.required && (formFields[input.name] === undefined || formFields[input.name] === '')) {
        toast({
          title: "Missing Required Field",
          description: `Please fill in the "${input.label}" field.`,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    setError(null);
    setOutputUrl(null);

    const payload: Record<string, any> = { model: selectedModelKey };
    currentModelConfig.inputs.forEach(input => {
      // Only include the field in the payload if it has a value or a default
      // Or if it's explicitly set to false for booleans or 0 for numbers (don't skip these)
      let valueToUse = formFields[input.name];
      if (valueToUse === undefined || valueToUse === '') {
        if (input.default !== undefined) {
          valueToUse = input.default;
        } else if (input.type === 'boolean') {
          valueToUse = false; // Default undefined booleans to false if no explicit default
        }
      }

      if (valueToUse !== undefined && valueToUse !== '') {
         if (input.type === 'number') {
          const numValue = parseFloat(valueToUse);
          if (!isNaN(numValue)) {
            payload[input.name] = numValue;
          } else if (input.default !== undefined && typeof input.default === 'number') {
            payload[input.name] = input.default; // Fallback to default if parsing fails
          }
        } else {
          payload[input.name] = valueToUse;
        }
      } else if (valueToUse === false || valueToUse === 0) { // Explicitly include false or 0
         payload[input.name] = valueToUse;
      }
    });
    
    // Some models might expect an empty prompt if nothing is entered, Replicate handles this.
    // However, if a prompt is required and empty, we've already caught it.
    // If a prompt is not required, and empty, we send it as empty or omit it based on Replicate's typical behavior for that model.
    // The current logic passes it if it's explicitly set or has a default.

    try {
      const response = await fetch('/api/replicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        // This case handles when the API returns 200 but the prediction is still processing or needs polling.
        // The backend /api/replicate should handle polling and only return final output or error.
        // If we reach here, it implies backend might have sent back intermediate state.
        // For robust frontend, one might handle prediction objects and poll here too if backend doesn't.
        // But current backend is designed to poll.
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
                  <form onSubmit={handleSubmit} className="space-y-5">
                      {currentModelConfig.inputs.map(renderInputField)}
                      <Button type="submit" disabled={loading || !selectedModelKey} className="w-full h-12 text-lg mt-3">
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : `Generate with ${currentModelConfig.name}`}
                      </Button>
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
                  <div className="relative w-full h-full max-h-[calc(100vh-500px)] aspect-auto">
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

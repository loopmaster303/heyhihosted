
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
import { Loader2, ImagePlus, AlertCircle, Wand2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import NextImage from 'next/image';
import { modelConfigs, type ReplicateModelConfig, type ReplicateModelInput } from '@/config/replicate-models';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ReplicateImageTool: React.FC = () => {
  const { toast } = useToast();
  const modelKeys = Object.keys(modelConfigs);
  const [selectedModelKey, setSelectedModelKey] = useState<string | undefined>(undefined);
  const [currentModelConfig, setCurrentModelConfig] = useState<ReplicateModelConfig | null>(null);
  
  const [formFields, setFormFields] = useState<Record<string, any>>({});
  const [outputImageUrl, setOutputImageUrl] = useState<string | null>(null); // Can also be video URL
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedModelKey && modelConfigs[selectedModelKey]) {
      const config = modelConfigs[selectedModelKey];
      setCurrentModelConfig(config);
      const initialFields: Record<string, any> = {};
      config.inputs.forEach(input => {
        initialFields[input.name] = input.default ?? (input.type === 'number' ? 0 : (input.type === 'boolean' ? false : ''));
      });
      setFormFields(initialFields);
      setOutputImageUrl(null);
      setError(null);
    } else {
      setCurrentModelConfig(null);
      setFormFields({});
      setOutputImageUrl(null);
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
      value: formFields[inputConfig.name] ?? (inputConfig.type === 'number' ? '' : (inputConfig.type === 'boolean' ? false : '')),
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
                    <AlertCircle className="ml-1.5 h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs bg-popover text-popover-foreground border border-border shadow-lg p-2 rounded-md">
                    <p className="text-xs">{inputConfig.info}</p>
                </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            )}
        </Label>
    );

    switch (inputConfig.type) {
      case 'text':
        if (inputConfig.name === 'prompt' || inputConfig.name === 'negative_prompt') {
          return (
            <div key={inputConfig.name} className="space-y-1.5">
              {label}
              <Textarea
                {...commonProps}
                placeholder={inputConfig.placeholder || `Enter ${inputConfig.label.toLowerCase()}`}
                onChange={(e) => handleInputChange(inputConfig.name, e.target.value)}
                className="bg-input border-border focus-visible:ring-primary min-h-[80px]"
                rows={inputConfig.name === 'prompt' ? 3 : 2}
                required={inputConfig.required}
              />
            </div>
          );
        }
        return (
          <div key={inputConfig.name} className="space-y-1.5">
            {label}
            <Input
              {...commonProps}
              type="text"
              placeholder={inputConfig.placeholder || `Enter ${inputConfig.label.toLowerCase()}`}
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
                        <span className="text-xs text-muted-foreground tabular-nums">
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
      default:
        return null;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedModelKey || !currentModelConfig) return;

    // Basic client-side validation for required fields
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
    setOutputImageUrl(null);

    const payload: Record<string, any> = { model: selectedModelKey };
    currentModelConfig.inputs.forEach(input => {
      if (formFields[input.name] !== undefined && formFields[input.name] !== '' && formFields[input.name] !== null) {
        if (input.type === 'number') {
          const numValue = parseFloat(formFields[input.name]);
          if (!isNaN(numValue)) {
            payload[input.name] = numValue;
          }
        } else {
          payload[input.name] = formFields[input.name];
        }
      } else if (input.default !== undefined) {
         payload[input.name] = input.default; // Send default if field is empty but has a default
      }
    });
    
    // Ensure prompt is not an empty string if it's a field for the model, unless it's not required and has no default
    if (payload.prompt === "" && currentModelConfig.inputs.find(i=>i.name === "prompt" && !i.required && i.default === undefined) ) {
        delete payload.prompt; 
    }


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
        setOutputImageUrl(resultUrl);
        toast({ title: "Generation Started!", description: `Replicate job submitted for ${currentModelConfig.name}. Polling for results...` });
        // Polling is handled by backend, frontend just gets final result or error
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error("Unknown response structure from Replicate API.");
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
  
  const isVideoOutput = selectedModelKey === 'veo-3';

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background text-foreground">
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 flex-grow">
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center">
                   <Wand2 className="mr-2 h-5 w-5 text-primary" /> Visualizing Loops 2.0 (Replicate)
                </CardTitle>
                <CardDescription>
                    {currentModelConfig?.description || "Select a Replicate model and provide inputs to generate an image or video."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <Label htmlFor="replicate-model-select" className="text-sm font-medium">Select Model</Label>
                    <Select onValueChange={setSelectedModelKey} value={selectedModelKey} disabled={loading}>
                        <SelectTrigger id="replicate-model-select" className="w-full mt-1.5 bg-input border-border focus-visible:ring-primary h-10">
                        <SelectValue placeholder="Choose an AI model..." />
                        </SelectTrigger>
                        <SelectContent>
                        {modelKeys.map(key => (
                            <SelectItem key={key} value={key}>
                            {modelConfigs[key].name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                 </div>

                {currentModelConfig && (
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {currentModelConfig.inputs.map(renderInputField)}
                    <Button type="submit" disabled={loading || !selectedModelKey} className="w-full h-10 mt-2">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `Generate with ${currentModelConfig.name}`}
                    </Button>
                </form>
                )}
          </CardContent>
        </Card>

        {selectedModelKey && (
          <Card className="flex-grow flex flex-col min-h-[300px] md:min-h-[400px] border-border shadow-md rounded-lg">
             <CardHeader className="pb-2">
                <CardTitle className="text-lg">Output</CardTitle>
             </CardHeader>
            <CardContent className="p-2 md:p-4 flex-grow flex items-center justify-center text-center bg-card rounded-b-lg">
              {loading && <Loader2 className="h-10 w-10 animate-spin text-primary" />}
              {error && !loading && (
                <div className="text-destructive flex flex-col items-center space-y-2">
                    <AlertCircle className="w-10 h-10"/>
                    <p className="font-semibold text-base">Generation Error</p>
                    <p className="text-xs px-4">{error}</p>
                </div>
                )}
              {!loading && !error && outputImageUrl && (
                <div className="relative w-full h-full max-h-[calc(100vh-400px)]">
                  {isVideoOutput ? (
                     <video
                        src={outputImageUrl}
                        controls
                        className="rounded-md w-full h-full object-contain"
                        data-ai-hint="ai generated video"
                      >
                        Your browser does not support the video tag.
                      </video>
                  ) : (
                    <a href={outputImageUrl} target="_blank" rel="noopener noreferrer" className="block relative w-full h-full group">
                        <NextImage
                        src={outputImageUrl}
                        alt={`Generated using ${currentModelConfig?.name} for prompt: ${formFields.prompt || 'Replicate model'}`}
                        layout="fill"
                        objectFit="contain"
                        className="rounded-md"
                        data-ai-hint="ai generated digital art"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                            <p className="text-white text-xs p-1 bg-black/70 rounded">View Full</p>
                        </div>
                    </a>
                  )}
                </div>
              )}
              {!loading && !error && !outputImageUrl && (
                <div className="text-muted-foreground flex flex-col items-center space-y-2">
                  <ImagePlus className="w-12 h-12" />
                  <p className="text-sm">
                    {currentModelConfig ? `Your ${isVideoOutput ? 'video' : 'image'} generated with ${currentModelConfig.name} will appear here.` : "Select a model to begin."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {!selectedModelKey && !loading && (
         <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground min-h-[400px]">
            <Wand2 className="w-16 h-16 mb-4 text-primary/30"/>
            <p className="text-lg font-medium">Welcome to Visualizing Loops 2.0</p>
            <p className="text-sm">Please select a model from the dropdown above to start generating.</p>
         </div>
       )}
      </div>
    </div>
  );
};

export default ReplicateImageTool;


"use client";

import { useState, useEffect, FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import Image from 'next/image';
import { Loader2, Settings } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const FALLBACK_MODELS = ['flux', 'turbo', 'gptimage'];
const DEFAULT_MODEL = 'flux';
const LOCAL_STORAGE_KEY = 'visualizingLoopsToolSettings';

const VisualizingLoopsTool: FC = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [imageModels, setImageModels] = useState<string[]>(FALLBACK_MODELS);
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  
  const [width, setWidth] = useState([1024]);
  const [height, setHeight] = useState([1024]);
  const [seed, setSeed] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [upsampling, setUpsampling] = useState(false);
  const [transparent, setTransparent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [batchSize, setBatchSize] = useState<number>(1);
  
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/image/models')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        const availableModels = Array.isArray(data.models) && data.models.length > 0 ? data.models : FALLBACK_MODELS;
        setImageModels(availableModels);
        if (!availableModels.includes(model)) {
          setModel(availableModels.includes(DEFAULT_MODEL) ? DEFAULT_MODEL : availableModels[0]);
        }
      })
      .catch(err => {
        console.error('Error loading image models:', err);
        toast({ title: "Model Loading Error", description: "Could not fetch models. Using defaults.", variant: "destructive" });
        setImageModels(FALLBACK_MODELS);
        setModel(DEFAULT_MODEL);
      });
  }, []); // Ran once on mount

  useEffect(() => {
    const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedSettings) {
      try {
        const settings = JSON.parse(storedSettings);
        if (settings.prompt !== undefined) setPrompt(settings.prompt);
        if (settings.model !== undefined && (imageModels.length === 0 ? FALLBACK_MODELS : imageModels).includes(settings.model)) setModel(settings.model);
        if (settings.width !== undefined) setWidth(settings.width);
        if (settings.height !== undefined) setHeight(settings.height);
        if (settings.seed !== undefined) setSeed(settings.seed);
        if (settings.isPrivate !== undefined) setIsPrivate(settings.isPrivate);
        if (settings.upsampling !== undefined) setUpsampling(settings.upsampling);
        if (settings.transparent !== undefined) setTransparent(settings.transparent);
        if (settings.aspectRatio !== undefined) setAspectRatio(settings.aspectRatio);
        if (settings.batchSize !== undefined) setBatchSize(settings.batchSize);
      } catch (e) {
        console.error("Failed to parse settings from localStorage", e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  }, [imageModels]);

  useEffect(() => {
    const settingsToSave = {
      prompt, model, width, height, seed, isPrivate, upsampling, transparent, aspectRatio, batchSize,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settingsToSave));
  }, [prompt, model, width, height, seed, isPrivate, upsampling, transparent, aspectRatio, batchSize]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Prompt Missing", description: "Please enter a prompt.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setError('');
    setImageUrls([]);
    
    const endpoint = model === 'gptimage' ? '/api/openai-image' : '/api/generate';
    const generatedUrls: string[] = [];

    for (let i = 0; i < batchSize; i++) {
      let currentSeedForIteration: string | undefined = seed.trim() || undefined;
      if (currentSeedForIteration && batchSize > 1) {
        const baseSeed = Number(currentSeedForIteration);
        if (!isNaN(baseSeed)) currentSeedForIteration = String(baseSeed + i);
      } else if (batchSize > 1 && !currentSeedForIteration) {
        currentSeedForIteration = String(Math.floor(Math.random() * 99999999));
      }

      const payload: Record<string, any> = {
        prompt: prompt.trim(),
        model,
        width: width[0],
        height: height[0],
        nologo: true,
        private: isPrivate,
        enhance: upsampling,
        transparent: model === 'gptimage' ? transparent : undefined,
      };
      if (currentSeedForIteration) {
        const seedNum = parseInt(currentSeedForIteration, 10);
        if (!isNaN(seedNum)) payload.seed = seedNum;
      }

      try {
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          const errorData = await resp.json().catch(() => ({
            error: `Image generation failed with status ${resp.status}. Response not JSON.`,
            modelUsed: model
          }));
          const displayErrorMsg = errorData.error || `Error generating image (Model: ${model}, Status: ${resp.status})`;
          toast({ title: "Image Generation Error", description: displayErrorMsg, variant: "destructive", duration: 7000 });
          setError(displayErrorMsg);
          break;
        }

        const blob = await resp.blob();
        if (blob.type.startsWith('image/')) {
          generatedUrls.push(URL.createObjectURL(blob));
        } else {
          const errorText = await blob.text();
          const displayError = `Received non-image data (Model: ${model}): ${errorText.substring(0, 100)}`;
          setError(displayError);
          toast({ title: "Image Data Error", description: displayError, variant: "destructive" });
          break;
        }
      } catch (err: any) {
        const displayError = err.message || `Network error during image request for model ${model}.`;
        setError(displayError);
        toast({ title: "Network Error", description: displayError, variant: "destructive" });
        break;
      }
    }
    setImageUrls(generatedUrls);
    setLoading(false);
  };

  const handleAspectRatioChange = (val: string) => {
    setAspectRatio(val);
    const [wStr, hStr] = val.split(':');
    const wRatio = Number(wStr);
    const hRatio = Number(hStr);
    if (!isNaN(wRatio) && !isNaN(hRatio) && wRatio > 0 && hRatio > 0) {
      const currentWidthVal = width[0];
      let newHeight = Math.round((currentWidthVal * hRatio) / wRatio);
      newHeight = Math.max(256, Math.min(2048, Math.round(newHeight / 64) * 64));
      let newWidth = Math.max(256, Math.min(2048, Math.round(currentWidthVal / 64) * 64));
      setWidth([newWidth]);
      setHeight([newHeight]);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background text-foreground p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="bg-card p-3 rounded-lg shadow-md flex flex-col space-y-3">
        <div className="flex items-end space-x-2">
          <div className="flex-grow space-y-1">
            <Label htmlFor="prompt-pollinations-tool" className="text-xs font-medium sr-only">Prompt</Label>
            <Input
              id="prompt-pollinations-tool"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="[import, creativity — prompt] !execute"
              className="bg-input border-border focus-visible:ring-primary h-10"
              aria-label="Image prompt for Pollinations models"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Image Generation Settings" className="h-10 w-10">
                <Settings className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-popover text-popover-foreground shadow-xl border-border" side="bottom" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Image Settings</h4>
                  <p className="text-xs text-muted-foreground">Adjust parameters for image generation.</p>
                </div>
                <div className="grid gap-3">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="model-select-tool" className="col-span-1 text-xs">Model</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger id="model-select-tool" className="col-span-2 h-8 bg-input border-border text-xs">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {imageModels.map(m => (
                          <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="width-slider-tool" className="col-span-1 text-xs">Width</Label>
                    <Slider id="width-slider-tool" value={width} onValueChange={setWidth} min={256} max={2048} step={64} className="col-span-2" />
                    <span className="text-xs text-muted-foreground justify-self-end col-start-3">{width[0]}px</span>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="height-slider-tool" className="col-span-1 text-xs">Height</Label>
                    <Slider id="height-slider-tool" value={height} onValueChange={setHeight} min={256} max={2048} step={64} className="col-span-2" />
                    <span className="text-xs text-muted-foreground justify-self-end col-start-3">{height[0]}px</span>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="aspect-ratio-tool" className="col-span-1 text-xs">Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={handleAspectRatioChange}>
                      <SelectTrigger id="aspect-ratio-tool" className="col-span-2 h-8 bg-input border-border text-xs">
                        <SelectValue placeholder="Aspect Ratio" />
                      </SelectTrigger>
                      <SelectContent>
                        {['1:1', '4:3', '3:2', '16:9', '21:9', '3:4', '2:3', '9:16'].map(r => (
                          <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="batch-size-tool" className="col-span-1 text-xs">Batch Size</Label>
                    <Slider id="batch-size-tool" value={[batchSize]} onValueChange={(val) => setBatchSize(val[0])} min={1} max={5} step={1} className="col-span-2" />
                    <span className="text-xs text-muted-foreground justify-self-end col-start-3">{batchSize}</span>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="seed-input-tool" className="col-span-1 text-xs">Seed</Label>
                    <Input id="seed-input-tool" type="number" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="Random" className="col-span-2 h-8 bg-input border-border text-xs" />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSeed(String(Math.floor(Math.random() * 99999999)))} className="text-xs h-8 w-full">
                    Random Seed
                  </Button>
                  <div className="flex items-center justify-between pt-1">
                    <Label htmlFor="private-check-tool" className="text-xs cursor-pointer">Private</Label>
                    <Checkbox checked={isPrivate} onCheckedChange={(checked) => setIsPrivate(!!checked)} id="private-check-tool" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="upsampling-check-tool" className="text-xs cursor-pointer">Upsample (Enhance)</Label>
                    <Checkbox checked={upsampling} onCheckedChange={(checked) => setUpsampling(!!checked)} id="upsampling-check-tool" />
                  </div>
                  {model === 'gptimage' && (
                    <div className="flex items-center justify-between">
                      <Label htmlFor="transparent-check-tool" className="text-xs cursor-pointer">Transparent BG (gptimage only)</Label>
                      <Checkbox checked={transparent} onCheckedChange={(checked) => setTransparent(!!checked)} id="transparent-check-tool" />
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={handleGenerate} disabled={loading} size="default" className="h-10">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Execute'}
          </Button>
        </div>
      </div>
      
      <Card className="flex-grow flex flex-col min-h-[300px] md:min-h-[400px] border-border shadow-md rounded-lg">
        <CardContent className="p-2 md:p-4 flex-grow flex items-center justify-center text-center bg-card rounded-lg">
          {loading && <Loader2 className="h-10 w-10 animate-spin text-primary" />}
          {error && !loading && <p className="text-destructive font-semibold">{error}</p>}
          {!loading && !error && imageUrls.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 w-full h-full overflow-y-auto p-1 md:p-2">
              {imageUrls.map((url, idx) => (
                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block relative aspect-square group rounded-md overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                   <Image 
                    src={url} 
                    alt={`Generated image ${idx + 1} for prompt: ${prompt}`} 
                    fill 
                    style={{ objectFit: "contain" }}
                    className="bg-muted/20"
                    data-ai-hint="digital art wallpaper"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <p className="text-white text-xs p-1 bg-black/70 rounded">View Full Image</p>
                  </div>
                </a>
              ))}
            </div>
          )}
          {!loading && !error && imageUrls.length === 0 && (
            <div className="text-muted-foreground flex flex-col items-center space-y-2 font-code">
                <p className="text-lg">{`</export>`}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VisualizingLoopsTool;

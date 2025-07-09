
"use client";

import { useState, useEffect, useMemo, FC, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Loader2, MoreHorizontal, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Input } from '@/components/ui/input';
import type { ImageHistoryItem } from '@/types';
import ImageHistoryGallery from './ImageHistoryGallery';

const FALLBACK_MODELS = ['flux', 'turbo', 'gptimage'];
const DEFAULT_MODEL = 'flux';
const LOCAL_STORAGE_KEY = 'visualizingLoopsToolSettings';
const HISTORY_STORAGE_KEY = 'visualizingLoopsHistory';

const VisualizingLoopsTool: FC = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('A beautiful landscape painting, trending on artstation');
  const [imageModels, setImageModels] = useState<string[]>([]);
  const [model, setModel] = useState<string>(DEFAULT_MODEL);
  
  const [width, setWidth] = useState<number>(1024);
  const [height, setHeight] = useState<number>(1024);
  const [seed, setSeed] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [upsampling, setUpsampling] = useState(false);
  const [transparent, setTransparent] = useState(false);

  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [batchSize, setBatchSize] = useState<number>(1);
  
  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageHistoryItem | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // Memoize slider value arrays to prevent unstable references
  const widthValue = useMemo(() => [width], [width]);
  const heightValue = useMemo(() => [height], [height]);
  const batchSizeValue = useMemo(() => [batchSize], [batchSize]);

  // Load models on mount
  useEffect(() => {
    fetch('/api/image/models')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        const availableModels = Array.isArray(data.models) && data.models.length > 0 ? data.models : FALLBACK_MODELS;
        setImageModels(availableModels);
        
        // Load settings and history only after models are loaded
        try {
          const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (storedSettings) {
            const settings = JSON.parse(storedSettings);
            if (settings.prompt !== undefined) setPrompt(settings.prompt);
            if (settings.model !== undefined && availableModels.includes(settings.model)) {
              setModel(settings.model);
            } else if (!availableModels.includes(model)) {
              setModel(availableModels.includes(DEFAULT_MODEL) ? DEFAULT_MODEL : availableModels[0]);
            }
            if (settings.width !== undefined) setWidth(settings.width);
            if (settings.height !== undefined) setHeight(settings.height);
            if (settings.seed !== undefined) setSeed(settings.seed);
            if (settings.isPrivate !== undefined) setIsPrivate(settings.isPrivate);
            if (settings.upsampling !== undefined) setUpsampling(settings.upsampling);
            if (settings.transparent !== undefined) setTransparent(settings.transparent);
            if (settings.aspectRatio !== undefined) setAspectRatio(settings.aspectRatio);
            if (settings.batchSize !== undefined) setBatchSize(settings.batchSize);
          }
        } catch (e) {
          console.error("Failed to parse settings from localStorage", e);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
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
        setIsInitialLoadComplete(true);
      })
      .catch(err => {
        console.error('Error loading image models:', err);
        toast({ title: "Model Loading Error", description: "Could not fetch models. Using defaults.", variant: "destructive" });
        setImageModels(FALLBACK_MODELS);
        setModel(DEFAULT_MODEL);
        setIsInitialLoadComplete(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    if (!isInitialLoadComplete) return;
    const settingsToSave = {
      prompt, model, width, height, seed, isPrivate, upsampling, transparent, aspectRatio, batchSize,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settingsToSave));
  }, [prompt, model, width, height, seed, isPrivate, upsampling, transparent, aspectRatio, batchSize, isInitialLoadComplete]);

  // Save history to localStorage
  useEffect(() => {
    if (!isInitialLoadComplete) return;
    try {
        if (history.length > 0) {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        } else {
            localStorage.removeItem(HISTORY_STORAGE_KEY);
        }
    } catch (e) {
        console.error("Failed to save history to localStorage. It might be full.", e);
        toast({
            title: "Could Not Save History",
            description: "Browser storage is full. Please clear some history or site data.",
            variant: "destructive"
        });
    }
  }, [history, toast, isInitialLoadComplete]);
  
  const handleSelectHistoryItem = (item: ImageHistoryItem) => {
    setSelectedImage(item);
    setPrompt(item.prompt);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Prompt Missing", description: "Please enter a prompt.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setError('');
    setSelectedImage(null);
    
    const endpoint = model === 'gptimage' ? '/api/openai-image' : '/api/generate';
    const newHistoryItems: ImageHistoryItem[] = [];

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
        width,
        height,
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

        const data = await resp.json();

        if (!resp.ok) {
          const displayErrorMsg = data.error || `Error generating image (Model: ${model}, Status: ${resp.status})`;
          toast({ title: "Image Generation Error", description: displayErrorMsg, variant: "destructive", duration: 7000 });
          setError(displayErrorMsg);
          break;
        }

        if (data.imageUrl) {
          const newItem: ImageHistoryItem = {
            id: crypto.randomUUID(),
            imageUrl: data.imageUrl,
            prompt: prompt.trim(),
            model,
            timestamp: new Date().toISOString(),
            toolType: 'nocost imagination',
          };
          newHistoryItems.push(newItem);
        } else {
          const displayError = `API returned no image URL (Model: ${model})`;
          setError(displayError);
          toast({ title: "API Response Error", description: displayError, variant: "destructive" });
          break;
        }

      } catch (err: any) {
        const displayError = err.message || `Network error during image request for model ${model}.`;
        setError(displayError);
        toast({ title: "Network Error", description: displayError, variant: "destructive" });
        break;
      }
    }

    if (newHistoryItems.length > 0) {
      setSelectedImage(newHistoryItems[0]);
      setHistory(prev => [...newHistoryItems, ...prev]);
    }
    setLoading(false);
  };

  const handleAspectRatioChange = (val: string) => {
    setAspectRatio(val);
    const [wStr, hStr] = val.split(':');
    const wRatio = Number(wStr);
    const hRatio = Number(hStr);
    if (!isNaN(wRatio) && !isNaN(hRatio) && wRatio > 0 && hRatio > 0) {
      const currentWidthVal = width;
      let newHeight = Math.round((currentWidthVal * hRatio) / wRatio);
      newHeight = Math.max(256, Math.min(2048, Math.round(newHeight / 64) * 64));
      let newWidth = Math.max(256, Math.min(2048, Math.round(currentWidthVal / 64) * 64));
      setWidth(newWidth);
      setHeight(newHeight);
    }
  };
  
  const handleGenerateEvent = (e: FormEvent) => {
    e.preventDefault();
    handleGenerate();
  };

  const handleClearHistory = () => {
    setHistory([]);
    setSelectedImage(null);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    toast({ title: "History Cleared", description: "Your image generation history has been removed." });
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground overflow-y-auto">
      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
        <form onSubmit={handleGenerateEvent}>
          <div className="bg-input rounded-xl p-3 shadow-lg flex flex-col gap-2 relative">
            <Textarea
              id="prompt-pollinations-tool"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you imagine and hit execute!"
              className="flex-grow min-h-[80px] max-h-[150px] bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none text-base p-2 pr-24"
              rows={3}
              disabled={loading}
              aria-label="Image prompt for Pollinations models"
            />
            <Button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="absolute top-3 right-3 h-8 px-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Execute
            </Button>

            <div className="flex items-center justify-end pt-2 px-1">
              <div className="flex items-center space-x-1.5">
                <Select value={model} onValueChange={setModel} disabled={loading}>
                  <SelectTrigger className="h-8 px-3 rounded-lg text-xs bg-input hover:bg-muted focus-visible:ring-primary border-border">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {imageModels.map(m => (
                      <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Advanced Settings" type="button" disabled={loading} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-80 bg-popover text-popover-foreground shadow-xl border-border p-0" 
                    side="bottom" 
                    align="end">
                    <div className="p-3 grid gap-4 max-h-[65vh] overflow-y-auto">
                      <div className="space-y-1 px-1">
                        <h4 className="font-medium leading-none">Image Settings</h4>
                        <p className="text-xs text-muted-foreground">Adjust parameters for image generation.</p>
                      </div>
                      <div className="grid gap-3">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="width-slider-tool" className="col-span-1 text-xs">Width</Label>
                          <Slider id="width-slider-tool" value={widthValue} onValueChange={(val) => setWidth(val[0])} min={256} max={2048} step={64} className="col-span-2" />
                          <span className="text-xs text-muted-foreground justify-self-end col-start-3">{width}px</span>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="height-slider-tool" className="col-span-1 text-xs">Height</Label>
                          <Slider id="height-slider-tool" value={heightValue} onValueChange={(val) => setHeight(val[0])} min={256} max={2048} step={64} className="col-span-2" />
                          <span className="text-xs text-muted-foreground justify-self-end col-start-3">{height}px</span>
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
                          <Slider id="batch-size-tool" value={batchSizeValue} onValueChange={(val) => setBatchSize(val[0])} min={1} max={5} step={1} className="col-span-2" />
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
                          <Label htmlFor="private-check-tool" className="text-xs	cursor-pointer">Private</Label>
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
              </div>
            </div>
          </div>
        </form>
      
        <Card className="flex-grow flex flex-col min-h-[300px] md:min-h-[400px] border-border shadow-md rounded-lg">
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
            {!loading && !error && selectedImage && (
              <a href={selectedImage.imageUrl} target="_blank" rel="noopener noreferrer" className="block relative w-full h-full group">
                <Image
                  src={selectedImage.imageUrl}
                  alt={`Generated image for: ${selectedImage.prompt}`}
                  fill
                  style={{ objectFit: 'contain' }}
                  className="rounded-md"
                  data-ai-hint="ai generated digital art"
                />
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                    <p className="text-white text-sm p-2 bg-black/80 rounded-md">View Full Image</p>
                </div>
              </a>
            )}
            {!loading && !error && !selectedImage && (
              <div className="text-muted-foreground flex flex-col items-center space-y-2 font-code">
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

export default VisualizingLoopsTool;

    
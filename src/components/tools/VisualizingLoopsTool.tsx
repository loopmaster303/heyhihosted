
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
import { Loader2, Settings, ImagePlus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const VisualizingLoopsTool: FC = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [imageModels, setImageModels] = useState<string[]>([]);
  const [model, setModel] = useState<string>(''); 
  
  const [width, setWidth] = useState([1024]);
  const [height, setHeight] = useState([1024]);
  const [seed, setSeed] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [transparent, setTransparent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [batchSize, setBatchSize] = useState<number>(1);
  // const [safetyTolerance, setSafetyTolerance] = useState<number>(0); // Not used by Pollinations /generate
  const [upsampling, setUpsampling] = useState(false); 
  // const [outputFormat, setOutputFormat] = useState<string>('jpg'); // Not directly controllable via basic Pollinations /prompt endpoint

  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/image/models')
      .then(res => {
        if (!res.ok) {
          console.error("Failed to fetch image models, status:", res.status);
          // Attempt to parse error body if not OK
          return res.json().then(errData => {
            throw new Error(errData.error || `HTTP error! status: ${res.status}`);
          }).catch(() => { // Catch if res.json() itself fails (e.g. not JSON response)
            throw new Error(`HTTP error! status: ${res.status}, response not JSON.`);
          });
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data.models) && data.models.length > 0) {
          const fetchedModels = data.models.filter((m: any) => typeof m === 'string');
          setImageModels(fetchedModels);
          if (!model || !fetchedModels.includes(model)) {
            setModel(fetchedModels.includes('flux') ? 'flux' : fetchedModels[0]);
          }
        } else {
          console.warn("No models array or empty models array received:", data);
          const fallbackModels = ['flux', 'turbo', 'sdxl', 'dall-e-3', 'gptimage'];
          setImageModels(fallbackModels);
          setModel(fallbackModels[0]);
        }
      })
      .catch(err => {
        console.error('Error loading image models:', err);
        toast({ title: "Model Loading Error", description: err.message || "Could not fetch image models. Using defaults.", variant: "destructive" });
        const fallbackModels = ['flux', 'turbo', 'sdxl', 'dall-e-3', 'gptimage'];
        setImageModels(fallbackModels);
        if (!model) setModel(fallbackModels[0]);
      });
  }, [model, toast]); // model dependency ensures we re-check if model state is somehow invalid against fetched models

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Prompt Missing", description: "Please enter a prompt to generate an image.", variant: "destructive"});
      return;
    }
    setLoading(true);
    setError('');
    setImageUrls([]); // Clear previous images
    
    const urls: string[] = [];
    for (let i = 0; i < batchSize; i++) {
      let currentSeedForIteration: string | undefined = seed.trim() || undefined;
      // If batching and a seed is provided, increment seed for each image in batch
      // If no seed provided but batching, generate a random seed for each (Pollinations might do this anyway)
      if (currentSeedForIteration && batchSize > 1) {
        const baseSeed = Number(currentSeedForIteration);
        if (!isNaN(baseSeed)) {
          currentSeedForIteration = String(baseSeed + i);
        }
      } else if (batchSize > 1 && !currentSeedForIteration) {
         // Let Pollinations handle random seed per image or use a fixed one if user specifies
      }

      const payload: Record<string, any> = {
        prompt: prompt.trim(),
        model,
        width: width[0],
        height: height[0],
        nologo: true, 
        private: isPrivate,
        enhance: upsampling, 
        transparent: transparent,
      };
      if (currentSeedForIteration) {
        const seedNum = parseInt(currentSeedForIteration, 10);
        if (!isNaN(seedNum)) {
            payload.seed = seedNum;
        }
      }
      
      try {
        const resp = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          const errorData = await resp.json().catch(() => ({ 
            error: `Image generation failed with status ${resp.status}. Response was not valid JSON.`,
            modelUsed: model 
          }));
          console.error('API-Generate Error (client-side):', resp.status, errorData);
          
          const modelInError = errorData.modelUsed || model;

          if (modelInError === 'gptimage' && errorData.error?.toLowerCase().includes('flower tier')) {
            setError('gptimage nicht freigeschaltet. Wechsle auf flux und erneut generieren.');
            toast({ title: "Modell-Problem", description: "gptimage ist nicht freigeschaltet. Bitte 'flux' auswählen.", variant: "destructive" });
            setModel('flux'); // Switch model to flux
          } else {
            const displayError = errorData.error || `Fehler: ${resp.status}`;
            setError(displayError);
            toast({ title: "Image Generation Error", description: displayError, variant: "destructive"});
          }
          break; // Stop batch generation on first error
        }
        const blob = await resp.blob();
        if (blob.type.startsWith('image/')) {
          const objectUrl = URL.createObjectURL(blob);
          urls.push(objectUrl);
        } else {
          const errorText = await blob.text();
          const displayError =`Received non-image data: ${errorText.substring(0,100)}`;
          setError(displayError);
          toast({ title: "Image Data Error", description: displayError, variant: "destructive"});
          break; // Stop batch
        }
      } catch (err: any) {
        console.error('Network-Error during /api/generate (client-side):', err);
        const displayError = err.message || 'Network error during image request.';
        setError(displayError);
        toast({ title: "Network Error", description: displayError, variant: "destructive"});
        break; // Stop batch
      }
    }
    setImageUrls(urls);
    setLoading(false);
  };

  const handleAspectRatioChange = (val: string) => {
    setAspectRatio(val);
    const [wStr, hStr] = val.split(':');
    const wRatio = Number(wStr);
    const hRatio = Number(hStr);
    if (!isNaN(wRatio) && !isNaN(hRatio) && wRatio > 0 && hRatio > 0) {
      const currentWidth = width[0];
      // Calculate new height based on current width and new aspect ratio
      let newHeight = Math.round((currentWidth * hRatio) / wRatio);
      // Ensure new height is a multiple of 64 and at least 256
      newHeight = Math.max(256, Math.round(newHeight / 64) * 64); 
      
      // Update width to be a multiple of 64 and at least 256 (though it likely is already)
      let newWidth = Math.max(256, Math.round(currentWidth / 64) * 64);
      
      setWidth([newWidth]);
      setHeight([newHeight]);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background text-foreground p-4 md:p-6 space-y-4 md:space-y-6">
      
      <div className="bg-card p-3 rounded-lg shadow-md flex flex-col space-y-3">
        <div className="flex items-end space-x-2">
          <div className="flex-grow space-y-1">
            <Label htmlFor="prompt-visualize" className="text-xs font-medium sr-only">Prompt</Label>
            <Input
              id="prompt-visualize"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A pink elephant in a futuristic city..."
              className="bg-input border-border focus-visible:ring-primary h-10"
              aria-label="Image prompt"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Image Settings">
                <Settings className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-popover text-popover-foreground shadow-xl border-border" side="bottom" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Image Settings</h4>
                  <p className="text-xs text-muted-foreground">
                    Adjust parameters for image generation.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="model-select-visualize" className="col-span-1 text-xs">Model</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger id="model-select-visualize" className="col-span-2 h-8 bg-input border-border text-xs">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {imageModels.length > 0 ? (
                          imageModels.map(m => (
                            <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                          ))
                        ) : (
                           <SelectItem value="flux" disabled className="text-xs">Loading models...</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="width-slider-visualize" className="col-span-1 text-xs">Width</Label>
                    <Slider id="width-slider-visualize" value={width} onValueChange={setWidth} min={256} max={2048} step={64} className="col-span-2" />
                    <span className="text-xs text-muted-foreground justify-self-end col-start-3">{width[0]}px</span>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="height-slider-visualize" className="col-span-1 text-xs">Height</Label>
                    <Slider id="height-slider-visualize" value={height} onValueChange={setHeight} min={256} max={2048} step={64} className="col-span-2" />
                    <span className="text-xs text-muted-foreground justify-self-end col-start-3">{height[0]}px</span>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="aspect-ratio-select-visualize" className="col-span-1 text-xs">Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={handleAspectRatioChange}>
                      <SelectTrigger id="aspect-ratio-select-visualize" className="col-span-2 h-8 bg-input border-border text-xs">
                        <SelectValue placeholder="Aspect Ratio" />
                      </SelectTrigger>
                      <SelectContent>
                        {['1:1','4:3', '3:2', '16:9', '21:9', '3:4', '2:3', '9:16'].map(r => (
                          <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="batch-size-slider-visualize" className="col-span-1 text-xs">Batch Size</Label>
                    <Slider id="batch-size-slider-visualize" value={[batchSize]} onValueChange={(val) => setBatchSize(val[0])} min={1} max={5} step={1} className="col-span-2" />
                     <span className="text-xs text-muted-foreground justify-self-end col-start-3">{batchSize}</span>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="seed-input-visualize" className="col-span-1 text-xs">Seed</Label>
                    <Input id="seed-input-visualize" type="number" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="Random" className="col-span-2 h-8 bg-input border-border text-xs" />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSeed(String(Math.floor(Math.random()*9999999)))} className="text-xs h-8 w-full">
                    Random Seed
                  </Button>
                  <div className="flex items-center justify-between pt-1">
                    <Label htmlFor="private-check-visualize" className="text-xs cursor-pointer">Private</Label>
                    <Checkbox checked={isPrivate} onCheckedChange={(checked) => setIsPrivate(!!checked)} id="private-check-visualize" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="upsampling-check-visualize" className="text-xs cursor-pointer">Upsample</Label>
                    <Checkbox checked={upsampling} onCheckedChange={(checked) => setUpsampling(!!checked)} id="upsampling-check-visualize" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="transparent-check-visualize" className="text-xs cursor-pointer">Transparent BG</Label>
                    <Checkbox checked={transparent} onCheckedChange={(checked) => setTransparent(!!checked)} id="transparent-check-visualize" />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={handleGenerate} disabled={loading} size="default" className="h-10">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Generate'}
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
                    layout="fill" 
                    objectFit="contain"
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
            <div className="text-muted-foreground flex flex-col items-center space-y-2">
                <ImagePlus className="w-12 h-12"/>
                <p>Your generated images will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VisualizingLoopsTool;


"use client";

import { useState, useEffect, FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
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
  const [upsampling, setUpsampling] = useState(false); 
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/image/models')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
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
          const fallbackModels = ['flux', 'turbo', 'sdxl', 'dall-e-3', 'gptimage'];
          setImageModels(fallbackModels);
          setModel(fallbackModels[0]);
        }
      })
      .catch(err => {
        console.error('Error loading image models:', err);
        toast({ title: "Model Loading Error", description: "Could not fetch image models. Using defaults.", variant: "destructive" });
        const fallbackModels = ['flux', 'turbo', 'sdxl', 'dall-e-3', 'gptimage'];
        setImageModels(fallbackModels);
        if (!model) setModel(fallbackModels[0]);
      });
  }, [model, toast]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Prompt Missing", description: "Please enter a prompt to generate an image.", variant: "destructive"});
      return;
    }
    setLoading(true);
    setError('');
    setImageUrls([]);
    
    const urls: string[] = [];
    for (let i = 0; i < batchSize; i++) {
      let currentSeed: string | undefined = seed.trim() || undefined;
      if (currentSeed && batchSize > 1) {
        const baseSeed = Number(currentSeed);
        if (!isNaN(baseSeed)) {
          currentSeed = String(baseSeed + i);
        }
      } else if (batchSize > 1 && !currentSeed) {
         currentSeed = String(Math.floor(Math.random() * 1000000));
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
      if (currentSeed) {
        const seedNum = parseInt(currentSeed, 10);
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
          const errorData = await resp.json().catch(() => ({ error: `Image generation failed with status ${resp.status}` }));
          setError(errorData.error || `Error: ${resp.status}`);
          toast({ title: "Image Generation Error", description: errorData.error || `Request failed with status ${resp.status}`, variant: "destructive"});
          break; 
        }
        const blob = await resp.blob();
        if (blob.type.startsWith('image/')) {
          const objectUrl = URL.createObjectURL(blob);
          urls.push(objectUrl);
        } else {
          const errorText = await blob.text();
          setError(`Received non-image data: ${errorText.substring(0,100)}`);
          toast({ title: "Image Data Error", description: `Received non-image data from server.`, variant: "destructive"});
          break;
        }
      } catch (err: any) {
        console.error('Network-Error during /api/generate:', err);
        setError(err.message || 'Network error during image request.');
        toast({ title: "Network Error", description: err.message || 'Could not connect to image generation service.', variant: "destructive"});
        break;
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
      let newHeight = Math.round((currentWidth * hRatio) / wRatio);
      newHeight = Math.max(256, Math.round(newHeight / 64) * 64); // Ensure min and step of 64
      let newWidth = currentWidth;
      
      // If maintaining height and adjusting width (optional logic, current one is fine)
      // const currentHeight = height[0];
      // let newWidth = Math.round((currentHeight * wRatio) / hRatio);
      // newWidth = Math.max(256, Math.round(newWidth / 64) * 64);
      // setWidth([newWidth]);
      
      setWidth([Math.max(256, Math.round(newWidth / 64) * 64)]);
      setHeight([newHeight]);
    }
  };


  return (
    <div className="flex flex-col space-y-6 p-4 w-full h-full overflow-y-auto bg-background text-foreground">
      <Card className="flex-shrink-0 shadow-md rounded-lg">
        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-end space-y-2 md:space-y-0 md:space-x-2">
            <div className="flex-grow space-y-1">
              <Label htmlFor="prompt-visualize" className="text-xs font-medium">Prompt</Label>
              <Input
                id="prompt-visualize"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A pink elephant in a futuristic city..."
                className="bg-input border-border focus-visible:ring-primary"
                aria-label="Image prompt"
              />
            </div>
            <Button onClick={handleGenerate} disabled={loading} className="w-full md:w-auto self-end md:self-stretch">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Generate'}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
            <div className="space-y-1">
              <Label htmlFor="model-select-visualize" className="text-xs">Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model-select-visualize" className="bg-input border-border text-xs h-9">
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
            <div className="space-y-1">
              <Label htmlFor="width-slider-visualize" className="text-xs">Width: {width[0]}px</Label>
              <Slider
                id="width-slider-visualize"
                value={width}
                onValueChange={setWidth}
                min={256} 
                max={2048}
                step={64}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="height-slider-visualize" className="text-xs">Height: {height[0]}px</Label>
              <Slider
                id="height-slider-visualize"
                value={height}
                onValueChange={setHeight}
                min={256}
                max={2048}
                step={64}
              />
            </div>
             <div className="space-y-1">
              <Label htmlFor="aspect-ratio-select-visualize" className="text-xs">Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={handleAspectRatioChange}>
                <SelectTrigger id="aspect-ratio-select-visualize" className="bg-input border-border text-xs h-9">
                  <SelectValue placeholder="Aspect Ratio" />
                </SelectTrigger>
                <SelectContent>
                  {['1:1','4:3', '3:2', '16:9', '21:9', '3:4', '2:3', '9:16'].map(r => (
                    <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="batch-size-slider-visualize" className="text-xs">Batch Size: {batchSize}</Label>
              <Slider
                id="batch-size-slider-visualize"
                value={[batchSize]}
                onValueChange={(val) => setBatchSize(val[0])}
                min={1}
                max={5} 
                step={1}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="seed-input-visualize" className="text-xs">Seed</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="seed-input-visualize"
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Random"
                  className="flex-grow bg-input border-border text-xs h-9"
                />
                <Button variant="outline" size="sm" onClick={() => setSeed(String(Math.floor(Math.random()*9999999)))} className="text-xs h-9">Random</Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 items-center pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox checked={isPrivate} onCheckedChange={(checked) => setIsPrivate(!!checked)} id="private-check-visualize" />
              <Label htmlFor="private-check-visualize" className="text-xs cursor-pointer">Private</Label>
            </div>
             <div className="flex items-center space-x-2">
              <Checkbox checked={upsampling} onCheckedChange={(checked) => setUpsampling(!!checked)} id="upsampling-check-visualize" />
              <Label htmlFor="upsampling-check-visualize" className="text-xs cursor-pointer">Upsample</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox checked={transparent} onCheckedChange={(checked) => setTransparent(!!checked)} id="transparent-check-visualize" />
              <Label htmlFor="transparent-check-visualize" className="text-xs cursor-pointer">Transparent BG</Label>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <p className="text-muted-foreground">Your generated images will appear here.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VisualizingLoopsTool;

    
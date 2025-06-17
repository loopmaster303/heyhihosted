
"use client";

import { useState, FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider'; // For batch size if client handles, or 'n'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import NextImage from 'next/image'; // Renamed to avoid conflict with HTMLImageElement
import { Loader2, Settings, ImagePlus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// OpenAI gpt-image-1 specific parameters
const GPT_IMAGE_SIZES = ["1024x1024", "1536x1024", "1024x1536", "auto"];
const GPT_IMAGE_BACKGROUND_OPTIONS = ["auto", "transparent", "opaque"];
const GPT_IMAGE_QUALITY_OPTIONS = ["auto", "high", "medium", "low"];

const GPTImageTool: FC = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  
  // OpenAI specific settings
  const [size, setSize] = useState<string>("1024x1024");
  const [background, setBackground] = useState<string>("auto");
  const [quality, setQuality] = useState<string>("auto");
  const [batchSize, setBatchSize] = useState<number>(1); // Maps to 'n', but gpt-image-1 usually n=1 from client
                                                          // For simplicity, we'll make 1 call per batch item.

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]); // Store multiple if batchSize > 1

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Prompt Missing", description: "Please enter a prompt.", variant: "destructive"});
      return;
    }
    setLoading(true);
    setError('');
    setImageUrls([]);
    
    const generatedUrls: string[] = [];
    for (let i = 0; i < batchSize; i++) {
      const payload: Record<string, any> = {
        prompt: prompt.trim(),
        size: size === "auto" ? undefined : size, // OpenAI API might prefer undefined for auto
        background: background,
        quality: quality,
        // n: 1, // API will handle one image per call
      };
      
      try {
        const resp = await fetch('/api/openai-image', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          const errorData = await resp.json().catch(() => ({ 
            error: `Image generation failed with status ${resp.status}. Response not JSON.`,
          }));
          const displayErrorMsg = errorData.error || `Error generating image (Status: ${resp.status})`;
          toast({ title: "OpenAI Image Generation Error", description: displayErrorMsg, variant: "destructive", duration: 7000});
          setError(displayErrorMsg);
          break; 
        }
        const blob = await resp.blob();
        if (blob.type.startsWith('image/')) {
          const objectUrl = URL.createObjectURL(blob);
          generatedUrls.push(objectUrl);
        } else {
          const errorText = await blob.text();
          const displayError =`Received non-image data: ${errorText.substring(0,100)}`;
          setError(displayError);
          toast({ title: "Image Data Error", description: displayError, variant: "destructive"});
          break;
        }
      } catch (err: any) {
        const displayError = err.message || 'Network error during OpenAI image request.';
        setError(displayError);
        toast({ title: "Network Error", description: displayError, variant: "destructive"});
        break;
      }
    }
    setImageUrls(generatedUrls);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background text-foreground p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="bg-card p-3 rounded-lg shadow-md flex flex-col space-y-3">
        <div className="flex items-end space-x-2">
          <div className="flex-grow space-y-1">
            <Label htmlFor="prompt-openai" className="text-xs font-medium sr-only">Prompt</Label>
            <Input
              id="prompt-openai"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic cityscape at dusk..."
              className="bg-input border-border focus-visible:ring-primary h-10"
              aria-label="Image prompt for OpenAI gpt-image-1"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="OpenAI Settings" className="h-10 w-10">
                <Settings className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-popover text-popover-foreground shadow-xl border-border" side="bottom" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">OpenAI gpt-image-1 Settings</h4>
                  <p className="text-xs text-muted-foreground">
                    Adjust parameters for OpenAI image generation.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="size-select-openai" className="col-span-1 text-xs">Size</Label>
                    <Select value={size} onValueChange={setSize}>
                      <SelectTrigger id="size-select-openai" className="col-span-2 h-8 bg-input border-border text-xs">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {GPT_IMAGE_SIZES.map(s => (
                          <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="background-select-openai" className="col-span-1 text-xs">Background</Label>
                    <Select value={background} onValueChange={setBackground}>
                      <SelectTrigger id="background-select-openai" className="col-span-2 h-8 bg-input border-border text-xs">
                        <SelectValue placeholder="Background" />
                      </SelectTrigger>
                      <SelectContent>
                        {GPT_IMAGE_BACKGROUND_OPTIONS.map(b => (
                          <SelectItem key={b} value={b} className="text-xs capitalize">{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                   <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="quality-select-openai" className="col-span-1 text-xs">Quality</Label>
                    <Select value={quality} onValueChange={setQuality}>
                      <SelectTrigger id="quality-select-openai" className="col-span-2 h-8 bg-input border-border text-xs">
                        <SelectValue placeholder="Quality" />
                      </SelectTrigger>
                      <SelectContent>
                        {GPT_IMAGE_QUALITY_OPTIONS.map(q => (
                          <SelectItem key={q} value={q} className="text-xs capitalize">{q}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="batch-size-openai" className="col-span-1 text-xs">Batch Count</Label>
                    <Slider id="batch-size-openai" value={[batchSize]} onValueChange={(val) => setBatchSize(val[0])} min={1} max={4} step={1} className="col-span-2" />
                     <span className="text-xs text-muted-foreground justify-self-end col-start-3">{batchSize}</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={handleGenerate} disabled={loading} size="default" className="h-10">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Generate with OpenAI'}
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
                   <NextImage 
                    src={url} 
                    alt={`Generated OpenAI image ${idx + 1} for prompt: ${prompt}`} 
                    layout="fill" 
                    objectFit="contain"
                    className="bg-muted/20"
                    data-ai-hint="ai generated art"
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
                <p>Your OpenAI generated images will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GPTImageTool;

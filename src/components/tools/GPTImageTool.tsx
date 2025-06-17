
"use client";

import { useState, FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
// Removed Select for aspect ratio as width/height are not sent for gptimage via Pollinations
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import NextImage from 'next/image'; // Renamed to avoid conflict with global Image
import { Loader2, Settings, ImagePlus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// This tool now uses Pollinations API with model='gptimage'
// via the /api/openai-image route.

const GPTImageTool: FC = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  
  // Settings for Pollinations gptimage - simplified
  // Width, height, seed, private, upsampling are removed as Pollinations gptimage might not support them or have fixed values.
  const [transparent, setTransparent] = useState(false); // Pollinations 'transparent' for gptimage
  const [batchSize, setBatchSize] = useState<number>(1); // Client-side batching

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);

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
      // For Pollinations gptimage, we only send prompt and transparent.
      // Other params like seed for iteration are handled if Pollinations supports them,
      // but for gptimage, we keep it simple.
      const payload: Record<string, any> = {
        prompt: prompt.trim(),
        transparent: transparent,
        // No width, height, seed, nologo, private, enhance sent for gptimage Pollinations call from here
      };
      
      try {
        // This route proxies to Pollinations for 'gptimage'
        const resp = await fetch('/api/openai-image', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          const errorData = await resp.json().catch(() => ({ 
            error: `Image generation failed with status ${resp.status}. Response not JSON.`,
            modelUsed: 'gptimage' 
          }));
          const displayErrorMsg = errorData.error || `Error generating gptimage (Status: ${resp.status})`;
          toast({ title: "GPT Image Generation Error", description: displayErrorMsg, variant: "destructive", duration: 7000});
          setError(displayErrorMsg);
          break; 
        }
        const blob = await resp.blob();
        if (blob.type.startsWith('image/')) {
          const objectUrl = URL.createObjectURL(blob);
          generatedUrls.push(objectUrl);
        } else {
          const errorText = await blob.text();
          const displayError =`Received non-image data (gptimage): ${errorText.substring(0,100)}`;
          setError(displayError);
          toast({ title: "Image Data Error", description: displayError, variant: "destructive"});
          break;
        }
      } catch (err: any) {
        const displayError = err.message || 'Network error during gptimage request.';
        setError(displayError);
        toast({ title: "Network Error", description: displayError, variant: "destructive"});
        break;
      }
    }
    setImageUrls(generatedUrls);
    setLoading(false);
  };

  // handleAspectRatioChange is removed as width/height are no longer controlled for gptimage

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background text-foreground p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="bg-card p-3 rounded-lg shadow-md flex flex-col space-y-3">
        <div className="flex items-end space-x-2">
          <div className="flex-grow space-y-1">
            <Label htmlFor="prompt-gptimage" className="text-xs font-medium sr-only">Prompt</Label>
            <Input
              id="prompt-gptimage"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A photorealistic image of..."
              className="bg-input border-border focus-visible:ring-primary h-10"
              aria-label="Image prompt for GPT Image (via Pollinations)"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="GPT Image Settings" className="h-10 w-10">
                <Settings className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-popover text-popover-foreground shadow-xl border-border" side="bottom" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">GPT Image Settings (Pollinations)</h4>
                  <p className="text-xs text-muted-foreground">
                    Parameters for 'gptimage' model via Pollinations.
                  </p>
                </div>
                <div className="grid gap-3">
                  {/* Width, Height, Aspect Ratio, Seed, Private, Upsampling controls removed for gptimage via Pollinations */}
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="batch-size-gpt" className="col-span-1 text-xs">Batch Count</Label>
                    <Slider id="batch-size-gpt" value={[batchSize]} onValueChange={(val) => setBatchSize(val[0])} min={1} max={4} step={1} className="col-span-2" />
                     <span className="text-xs text-muted-foreground justify-self-end col-start-3">{batchSize}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="transparent-check-gpt" className="text-xs cursor-pointer">Transparent BG</Label>
                    <Checkbox 
                        checked={transparent} 
                        onCheckedChange={(checked) => setTransparent(!!checked)} 
                        id="transparent-check-gpt" 
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={handleGenerate} disabled={loading} size="default" className="h-10">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Generate with GPT Image'}
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
                    alt={`Generated GPT image ${idx + 1} for prompt: ${prompt}`} 
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
                <p>Your GPT generated images (via Pollinations) will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GPTImageTool;

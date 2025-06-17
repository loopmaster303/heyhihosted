
"use client";

import { useState, useCallback, FC, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea'; // Using Textarea for prompt
import Image from 'next/image';
import { Loader2, ArrowRight, Settings, ImagePlus, Paperclip, X, Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

const ImageKontextTool: FC = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState('');
  const [inputImageUrl, setInputImageUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings states
  const [aspectRatio, setAspectRatio] = useState('16:9'); // Default from screenshot
  const [batchSize, setBatchSize] = useState([4]);
  const [safetyTolerance, setSafetyTolerance] = useState([2]);
  const [promptUpsampling, setPromptUpsampling] = useState(false);
  const [outputFormat, setOutputFormat] = useState('PNG');
  const [seed, setSeed] = useState('');
  const [inferenceSteps, setInferenceSteps] = useState([20]); // Retained from previous version

  const handleImageUpload = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputImageUrl(reader.result as string);
        setError('');
        setResultImageUrl(''); // Clear previous result when new image is uploaded
      };
      reader.readAsDataURL(file);
    } else if (file) {
      toast({ title: "Invalid File", description: "Please upload an image file.", variant: "destructive" });
    }
  };
  
  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(e.target.files?.[0] || null);
     if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  };

  const handleClearInputImage = () => {
    setInputImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!prompt && !inputImageUrl) {
      toast({ title: "Input Missing", description: "Please enter a prompt or upload a reference image.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResultImageUrl('');
    setError('');

    const payload: any = {
      model: 'flux-kontext-pro', // Hardcoded as per the tool's purpose
      prompt,
      aspect_ratio: aspectRatio,
      // BFL API might not support all these, but we send them from UI
      num_inference_steps: inferenceSteps[0], 
      batch_size: batchSize[0],
      // safety_tolerance: safetyTolerance[0], // BFL specific params might differ
      // upsampling: promptUpsampling,
      // output_format: outputFormat,
    };
    if (inputImageUrl) {
      payload.input_image = inputImageUrl;
    }
    if (seed) {
      payload.seed = parseInt(seed, 10);
    }

    try {
      const res = await fetch('/api/generate-bfl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `API error: ${res.status}`);
      }
      setResultImageUrl(data.imageUrl);
      toast({ title: "Success!", description: "Image generated successfully." });
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || 'An unknown error occurred.');
      toast({ title: "Generation Failed", description: err.message || 'An unknown error occurred.', variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background text-foreground p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <ImagePlus className="w-5 h-5" />
        <span>Generate images from text and references</span>
      </div>

      {/* Input Bar */}
      <div className="bg-card p-3 rounded-lg shadow-md flex flex-col space-y-3">
        <div className="flex items-start space-x-2">
          {inputImageUrl && (
            <div className="relative flex-shrink-0 group">
              <Image src={inputImageUrl} alt="Input preview" width={56} height={56} className="rounded-md object-cover w-14 h-14" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleClearInputImage}
                aria-label="Remove image"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a text prompt or reference image"
            className="flex-grow min-h-[56px] max-h-[120px] bg-input border-border focus-visible:ring-primary resize-none"
            rows={2}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="mr-2 h-4 w-4" />
              Attach
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileSelectChange} accept="image/*" className="hidden" />
            
            <Button variant="outline" size="sm" className="cursor-default">
              FLUX.1 Kontext [pro]
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Settings">
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
                      <Label htmlFor="aspect-ratio-kontext" className="col-span-1 text-xs">Aspect Ratio</Label>
                      <Select value={aspectRatio} onValueChange={setAspectRatio}>
                        <SelectTrigger id="aspect-ratio-kontext" className="col-span-2 h-8 bg-input border-border text-xs">
                          <SelectValue placeholder="Ratio" />
                        </SelectTrigger>
                        <SelectContent>
                          {["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"].map(r => (
                            <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                     <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="batch-size-kontext" className="col-span-1 text-xs">Batch Size</Label>
                      <Slider id="batch-size-kontext" value={batchSize} onValueChange={setBatchSize} min={1} max={4} step={1} className="col-span-2" />
                      <span className="text-xs text-muted-foreground justify-self-end col-start-3">{batchSize[0]}</span>
                    </div>
                     <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="inf-steps-kontext" className="col-span-1 text-xs">Steps</Label>
                      <Slider id="inf-steps-kontext" value={inferenceSteps} onValueChange={setInferenceSteps} min={10} max={50} step={1} className="col-span-2" />
                      <span className="text-xs text-muted-foreground justify-self-end col-start-3">{inferenceSteps[0]}</span>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="safety-kontext" className="col-span-1 text-xs">Safety Tol.</Label>
                      <Slider id="safety-kontext" value={safetyTolerance} onValueChange={setSafetyTolerance} min={0} max={10} step={1} className="col-span-2" />
                       <span className="text-xs text-muted-foreground justify-self-end col-start-3">{safetyTolerance[0]}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="upsampling-kontext" className="flex flex-col space-y-1 text-xs">
                        <span>Upsampling</span>
                      </Label>
                      <Switch id="upsampling-kontext" checked={promptUpsampling} onCheckedChange={setPromptUpsampling} />
                    </div>
                     <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="output-format-kontext" className="col-span-1 text-xs">Format</Label>
                      <Select value={outputFormat} onValueChange={setOutputFormat}>
                        <SelectTrigger id="output-format-kontext" className="col-span-2 h-8 bg-input border-border text-xs">
                          <SelectValue placeholder="Format" />
                        </SelectTrigger>
                        <SelectContent>
                          {["PNG", "JPEG"].map(f => (
                            <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="seed-kontext" className="col-span-1 text-xs">Seed</Label>
                      <Input id="seed-kontext" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="Random" className="col-span-2 h-8 bg-input border-border text-xs" />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSeed(String(Math.floor(Math.random() * 99999999)))} className="text-xs">
                      Random Seed
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button onClick={handleGenerate} disabled={loading} size="icon" aria-label="Generate image">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Result Area */}
      <Card className="flex-grow flex flex-col min-h-[300px] md:min-h-[400px] border-border shadow-md rounded-lg">
        <CardContent className="p-2 md:p-4 flex-grow flex items-center justify-center text-center bg-card rounded-lg">
          {loading && <Loader2 className="h-10 w-10 animate-spin text-primary" />}
          {error && !loading && (
            <div className="text-destructive flex flex-col items-center space-y-2">
              <Info className="w-8 h-8"/>
              <p className="font-semibold">Generation Error</p>
              <p className="text-xs">{error}</p>
            </div>
          )}
          {resultImageUrl && !loading && !error && (
            <div className="relative w-full h-full max-h-[calc(100vh-250px)]">
              <Image src={resultImageUrl} alt="Generated AI Image" layout="fill" objectFit="contain" className="rounded-md" data-ai-hint="digital art abstract" />
            </div>
          )}
          {!loading && !resultImageUrl && !error && (
            <div className="text-muted-foreground flex flex-col items-center space-y-2">
                <ImagePlus className="w-12 h-12"/>
                <p>Your generated image will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageKontextTool;

    

"use client";

import { useState, FC } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, ImagePlus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import NextImage from 'next/image';

const REPLICATE_PLACEHOLDER_MODELS = [
  { id: 'imagen-ultra', name: 'Imagen ultra' },
  { id: 'flux-kontext-pro', name: 'Flux Kontext Pro' },
  { id: 'flux-kontext-max', name: 'Flux Kontext Max' },
  { id: 'gpt-image-1', name: 'Gpt Image 1' },
  { id: 'veo-3', name: 'Veo 3' },
];

const ReplicateImageTool: FC = () => {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    setPrompt('');
    setImageUrl(null);
    setError('');
  };

  const handleGenerate = async () => {
    if (!selectedModel) {
      toast({ title: "Model Not Selected", description: "Please select a model first.", variant: "destructive" });
      return;
    }
    if (!prompt.trim()) {
      toast({ title: "Prompt Missing", description: "Please enter a prompt.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setError('');
    setImageUrl(null);

    // Placeholder for API call logic
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    
    // TODO: Replace with actual API call to Replicate via a backend route

    // Example success (using a placeholder for now):
    // setImageUrl('https://placehold.co/1024x1024.png');
    // toast({ title: "Success", description: "Image generated (placeholder)." });

    // For now, show error as it's not implemented:
    setError("Image generation with Replicate is not yet implemented.");
    toast({ title: "Not Implemented", description: "Replicate API integration pending.", variant: "destructive" });

    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background text-foreground p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="bg-card p-3 rounded-lg shadow-md flex flex-col space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <Label htmlFor="replicate-model-select" className="text-sm font-medium md:col-span-1">
            Select Model:
            </Label>
            <Select onValueChange={handleModelSelect} value={selectedModel || ""}>
            <SelectTrigger id="replicate-model-select" className="w-full md:col-span-2 bg-input border-border focus-visible:ring-primary h-10">
                <SelectValue placeholder="Choose an AI model..." />
            </SelectTrigger>
            <SelectContent>
                {REPLICATE_PLACEHOLDER_MODELS.map(model => (
                <SelectItem key={model.id} value={model.id}>
                    {model.name}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>

        {selectedModel && (
          <>
            <div className="flex items-end space-x-2 pt-2">
              <div className="flex-grow space-y-1">
                <Label htmlFor="prompt-replicate-tool" className="text-xs font-medium sr-only">Prompt</Label>
                <Input
                  id="prompt-replicate-tool"
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`Enter prompt for ${REPLICATE_PLACEHOLDER_MODELS.find(m => m.id === selectedModel)?.name || 'selected model'}...`}
                  className="bg-input border-border focus-visible:ring-primary h-10"
                  aria-label="Image prompt for Replicate model"
                  disabled={loading}
                />
              </div>
              <Button onClick={handleGenerate} disabled={loading || !prompt.trim()} size="default" className="h-10">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Generate'}
              </Button>
            </div>
          </>
        )}
      </div>

      {selectedModel && (
        <Card className="flex-grow flex flex-col min-h-[300px] md:min-h-[400px] border-border shadow-md rounded-lg">
          <CardContent className="p-2 md:p-4 flex-grow flex items-center justify-center text-center bg-card rounded-lg">
            {loading && <Loader2 className="h-10 w-10 animate-spin text-primary" />}
            {error && !loading && <p className="text-destructive font-semibold">{error}</p>}
            {!loading && !error && imageUrl && (
              <div className="relative w-full h-full max-h-[calc(100vh-300px)]">
                <NextImage
                  src={imageUrl}
                  alt={`Generated image for prompt: ${prompt}`}
                  layout="fill"
                  objectFit="contain"
                  className="rounded-md"
                  data-ai-hint="ai generated illustration"
                />
              </div>
            )}
            {!loading && !error && !imageUrl && (
              <div className="text-muted-foreground flex flex-col items-center space-y-2">
                <ImagePlus className="w-12 h-12" />
                <p>Your image generated with Replicate ({REPLICATE_PLACEHOLDER_MODELS.find(m => m.id === selectedModel)?.name}) will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
       {!selectedModel && (
         <div className="flex-grow flex items-center justify-center text-muted-foreground">
            <p>Please select a model from the dropdown to start generating images.</p>
         </div>
       )}
    </div>
  );
};

export default ReplicateImageTool;

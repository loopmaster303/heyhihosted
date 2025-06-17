
"use client";

import { useState, useCallback, FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';
import { Loader2 } from 'lucide-react'; // For loading indicator

const ImageKontextTool: FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState('');
  const [inputImageUrl, setInputImageUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [inferenceSteps, setInferenceSteps] = useState([20]);

  const handleImageDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputImageUrl(reader.result as string);
        setError(''); // Clear previous errors
        setResultImageUrl(''); // Clear previous results
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputImageUrl(reader.result as string);
        setError('');
        setResultImageUrl('');
      };
      reader.readAsDataURL(file);
    }
  }, []);


  const handleGenerate = async () => {
    if (!prompt && !inputImageUrl) {
      setError('Bitte gib einen Prompt ein oder lade ein Bild hoch.');
      return;
    }
    setLoading(true);
    setResultImageUrl('');
    setError('');

    const payload = {
      model: 'flux-kontext-pro', // This model is used for image-to-image by bfl.ai
      prompt,
      input_image: inputImageUrl,
      aspect_ratio: aspectRatio,
      // It seems inference_steps is not directly supported by the flux-kontext-pro specific endpoint this way
      // For text-to-image models (like 'flux') it might be `num_inference_steps`
      // For simplicity and adherence to the API example, inferenceSteps from UI won't be sent for flux-kontext-pro
      // If it were a generic text-to-image, it might look like:
      // num_inference_steps: inferenceSteps[0],
    };

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
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || 'Ein unbekannter Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-4 w-full h-full overflow-y-auto">
      <Card className="flex-shrink-0">
        <CardHeader>
          <CardTitle>Eingabe für FLUX Kontext</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
              <Label
                htmlFor="image-upload-flux"
                className="w-full h-64 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground bg-card hover:border-primary cursor-pointer transition-colors"
                onDrop={handleImageDrop}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => e.preventDefault()}
                onDragLeave={(e) => e.preventDefault()}
              >
                {inputImageUrl ? (
                  <Image src={inputImageUrl} alt="Eingabebild" layout="fill" objectFit="contain" className="rounded-md p-1" />
                ) : (
                  "Bild hierher ziehen oder klicken zum Auswählen"
                )}
              </Label>
              <input
                id="image-upload-flux"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
            <div className="flex flex-col space-y-4">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Beschreibe, was du ändern möchtest..."
                className="bg-input text-foreground placeholder:text-muted-foreground"
              />
              <div className="flex flex-col space-y-1">
                <Label htmlFor="aspect-ratio-flux">Seitenverhältnis</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger id="aspect-ratio-flux" className="bg-input text-foreground">
                    <SelectValue placeholder="Seitenverhältnis wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1:1">Quadrat (1:1)</SelectItem>
                    <SelectItem value="16:9">Breitbild (16:9)</SelectItem>
                    <SelectItem value="9:16">Hochformat (9:16)</SelectItem>
                    <SelectItem value="4:3">Standard (4:3)</SelectItem>
                    <SelectItem value="3:4">Hochformat (3:4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-1">
                <Label htmlFor="inference-steps-flux">Inferenz-Schritte: {inferenceSteps[0]}</Label>
                <Slider
                  id="inference-steps-flux"
                  value={inferenceSteps}
                  onValueChange={setInferenceSteps}
                  min={10}
                  max={50}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">Beeinflusst Detailgrad vs. Geschwindigkeit. (Hinweis: Nicht alle Modelle nutzen diesen Parameter explizit.)</p>
              </div>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full mt-6"
            size="lg"
          >
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generiere...</> : 'Generieren mit FLUX Kontext'}
          </Button>
        </CardContent>
      </Card>

      <Card className="flex-grow flex flex-col min-h-[300px] md:min-h-[400px]">
        <CardHeader>
          <CardTitle>Ergebnis</CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex-grow flex items-center justify-center text-center bg-card rounded-b-md">
          {loading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
          {error && <p className="text-destructive font-semibold">{error}</p>}
          {resultImageUrl && !loading && !error && (
            <div className="relative w-full h-full">
              <Image src={resultImageUrl} alt="Generated AI Image" layout="fill" objectFit="contain" className="rounded-md" data-ai-hint="abstract modern" />
            </div>
          )}
          {!loading && !resultImageUrl && !error && <p className="text-muted-foreground">Hier wird dein Bild erscheinen.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageKontextTool;

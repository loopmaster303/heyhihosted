import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { OutputService } from '@/lib/services/output-service';
import { getPollenHeaders } from '@/lib/pollen-key';

export type ComposeMusicModel = 'elevenmusic';

export interface ComposeMusicState {
  selectedModel: ComposeMusicModel;
  duration: number;
  instrumental: boolean;
  isGenerating: boolean;
  isEnhancing: boolean;
  audioUrl: string | null;
  error: string | null;
}

export interface ComposeMusicActions {
  setSelectedModel: (model: ComposeMusicModel) => void;
  setDuration: (duration: number) => void;
  setInstrumental: (instrumental: boolean) => void;
  generateMusic: (prompt: string) => Promise<string | null>;
  enhancePrompt: (prompt: string) => Promise<string | null>;
  reset: () => void;
}

export const DURATION_OPTIONS = [
  { label: '30 Sekunden', value: 30 },
  { label: '1 Minute', value: 60 },
  { label: '2 Minuten', value: 120 },
  { label: '3 Minuten', value: 180 },
  { label: '4 Minuten', value: 240 },
  { label: '5 Minuten', value: 300 },
];

export function useComposeMusicState(): ComposeMusicState & ComposeMusicActions {
  const [selectedModel, setSelectedModel] = useState<ComposeMusicModel>('elevenmusic');
  const [duration, setDuration] = useState(60);
  const [instrumental, setInstrumental] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateMusic = useCallback(async (prompt: string): Promise<string | null> => {
    if (!prompt.trim()) {
      setError('Prompt is required');
      return null;
    }

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      const response = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getPollenHeaders() },
        body: JSON.stringify({ prompt, duration, instrumental, model: selectedModel }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate music');
      }

      setAudioUrl(data.audioUrl);

      // Compose currently returns a data URL, so we persist the track locally as a blob-backed asset.
      OutputService.saveGeneratedAsset({
        url: data.audioUrl,
        prompt,
        modelId: selectedModel,
        isPollinations: false,
      }).catch(() => {});

      return data.audioUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast({
        title: 'Musik-Generierung fehlgeschlagen',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [duration, instrumental, selectedModel, toast]);

  const enhancePrompt = useCallback(async (prompt: string): Promise<string | null> => {
    if (!prompt.trim() || isEnhancing) return null;

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getPollenHeaders() },
        body: JSON.stringify({
          prompt,
          modelId: selectedModel,
          language: 'de',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to enhance prompt');
      }

      const result = await response.json();
      const enhanced = result.enhancedPrompt || prompt;

      toast({ title: 'Prompt Enhanced', description: 'Dein Musik-Prompt wurde von VibeCraft optimiert.' });
      return enhanced;
    } catch (err) {
      console.error('Compose enhancement error:', err);
      toast({
        title: 'Enhancement Failed',
        description: err instanceof Error ? err.message : 'Could not enhance the prompt.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsEnhancing(false);
    }
  }, [isEnhancing, toast, selectedModel]);

  const reset = useCallback(() => {
    setAudioUrl(null);
    setError(null);
    setIsGenerating(false);
  }, []);

  return {
    selectedModel,
    duration,
    instrumental,
    isGenerating,
    isEnhancing,
    audioUrl,
    error,
    setSelectedModel,
    setDuration,
    setInstrumental,
    generateMusic,
    enhancePrompt,
    reset,
  };
}

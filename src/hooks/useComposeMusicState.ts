import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ComposeMusicState {
  duration: number;
  instrumental: boolean;
  isGenerating: boolean;
  isEnhancing: boolean;
  audioUrl: string | null;
  error: string | null;
}

export interface ComposeMusicActions {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, duration, instrumental }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate music');
      }

      setAudioUrl(data.audioUrl);
      return data.audioUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [duration, instrumental]);

  const enhancePrompt = useCallback(async (prompt: string): Promise<string | null> => {
    if (!prompt.trim() || isEnhancing) return null;

    setIsEnhancing(true);
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          modelId: 'compose',
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
  }, [isEnhancing, toast]);

  const reset = useCallback(() => {
    setAudioUrl(null);
    setError(null);
    setIsGenerating(false);
  }, []);

  return {
    duration,
    instrumental,
    isGenerating,
    isEnhancing,
    audioUrl,
    error,
    setDuration,
    setInstrumental,
    generateMusic,
    enhancePrompt,
    reset,
  };
}

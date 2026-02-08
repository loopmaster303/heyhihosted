import { useState, useCallback } from 'react';

export interface ComposeMusicState {
  duration: number;
  instrumental: boolean;
  isGenerating: boolean;
  audioUrl: string | null;
  error: string | null;
}

export interface ComposeMusicActions {
  setDuration: (duration: number) => void;
  setInstrumental: (instrumental: boolean) => void;
  generateMusic: (prompt: string) => Promise<string | null>;
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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const reset = useCallback(() => {
    setAudioUrl(null);
    setError(null);
    setIsGenerating(false);
  }, []);

  return {
    duration,
    instrumental,
    isGenerating,
    audioUrl,
    error,
    setDuration,
    setInstrumental,
    generateMusic,
    reset,
  };
}

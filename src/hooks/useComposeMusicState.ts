import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { OutputService } from '@/lib/services/output-service';
import { getPollenHeaders } from '@/lib/pollen-key';
import { useLanguage } from '@/components/LanguageProvider';
import { AVAILABLE_COMPOSE_MODELS } from '@/config/chat-options';

export type ComposeMusicModel = 'elevenmusic' | 'acestep' | 'stable-audio-3-medium';

export const COMPOSE_MODELS = AVAILABLE_COMPOSE_MODELS;

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
  const [selectedModel, setSelectedModel] = useState<ComposeMusicModel>('acestep');
  const [duration, setDuration] = useState(30);
  const [instrumental, setInstrumental] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const setModelAndClampDuration = useCallback((model: ComposeMusicModel) => {
    const meta = COMPOSE_MODELS.find((m) => m.id === model);
    const max = meta?.maxDuration ?? 300;
    setSelectedModel(model);
    setDuration((prev) => Math.min(prev, max));
  }, []);

  const setDurationClamped = useCallback((value: number) => {
    const meta = COMPOSE_MODELS.find((m) => m.id === selectedModel);
    const max = meta?.maxDuration ?? 300;
    setDuration(Math.max(3, Math.min(max, value)));
  }, [selectedModel]);

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
        title: t('toast.musicGenerationFailed'),
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [duration, instrumental, selectedModel, toast, t]);

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
          language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to enhance prompt');
      }

      const result = await response.json();
      const enhanced = result.enhancedPrompt || prompt;

      toast({ title: t('toast.promptEnhanced'), description: t('toast.promptEnhancedDesc') });
      return enhanced;
    } catch (err) {
      console.error('Compose enhancement error:', err);
      toast({
        title: t('toast.enhancementFailed'),
        description: err instanceof Error ? err.message : t('toast.enhancementFailedDesc'),
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsEnhancing(false);
    }
  }, [isEnhancing, toast, selectedModel, t, language]);

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
    setSelectedModel: setModelAndClampDuration,
    setDuration: setDurationClamped,
    setInstrumental,
    generateMusic,
    enhancePrompt,
    reset,
  };
}

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { OutputService } from '@/lib/services/output-service';
import { getPollenHeaders } from '@/lib/pollen-key';
import { useLanguage } from '@/components/LanguageProvider';
import { useHasPollenKey } from '@/hooks/useHasPollenKey';
import { AVAILABLE_COMPOSE_MODELS, getComposeDurations } from '@/config/chat-options';

export type ComposeMusicModel = 'elevenmusic' | 'acestep' | 'stable-audio-3-medium';

export const COMPOSE_MODELS = AVAILABLE_COMPOSE_MODELS;

const clampToSteps = (value: number, steps: number[]): number => {
  if (steps.length === 0) return value;
  // Snap to the largest step that does not exceed the requested value (min one step).
  const allowed = steps.filter((s) => s <= value);
  return allowed.length > 0 ? Math.max(...allowed) : Math.min(...steps);
};

export interface ComposeMusicState {
  selectedModel: ComposeMusicModel;
  duration: number;
  availableDurations: number[];
  hasPollenKey: boolean;
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

/** Short label for a duration in seconds (e.g. 30 → "30s", 120 → "2m"). */
export const durationLabel = (seconds: number): string =>
  seconds < 60 ? `${seconds}s` : `${seconds / 60}m`;

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
  const hasPollenKey = useHasPollenKey();

  const availableDurations = useMemo(
    () => getComposeDurations(selectedModel, hasPollenKey),
    [selectedModel, hasPollenKey]
  );

  // Keep the selected duration within the steps allowed for the current model/key state.
  useEffect(() => {
    if (availableDurations.length === 0) return;
    setDuration((prev) =>
      availableDurations.includes(prev) ? prev : clampToSteps(prev, availableDurations)
    );
  }, [availableDurations]);

  const setModelAndClampDuration = useCallback((model: ComposeMusicModel) => {
    setSelectedModel(model);
  }, []);

  const setDurationClamped = useCallback((value: number) => {
    setDuration(clampToSteps(value, availableDurations));
  }, [availableDurations]);

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
    availableDurations,
    hasPollenKey,
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

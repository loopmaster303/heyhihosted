/**
 * compose-music
 * -------------
 * Thin client-side wrapper around POST /api/compose.
 * Extracted from `useComposeMusicState` so non-hook code (the inline
 * media-intent handler) can trigger Eleven Music generation without
 * going through React state.
 */

import { getPollenHeaders } from '@/lib/pollen-key';

export interface ComposeMusicInput {
  prompt: string;
  duration?: number;
  instrumental?: boolean;
  model?: string;
}

export interface ComposeMusicResult {
  audioUrl: string;
  duration?: number;
  model?: string;
}

export class ComposeMusicError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ComposeMusicError';
  }
}

const DEFAULTS = {
  duration: 30,
  instrumental: false,
  model: 'acestep',
} as const;

export async function composeMusic(input: ComposeMusicInput): Promise<string> {
  if (!input.prompt || !input.prompt.trim()) {
    throw new ComposeMusicError('Prompt is required', 0);
  }

  const body = {
    prompt: input.prompt,
    duration: input.duration ?? DEFAULTS.duration,
    instrumental: input.instrumental ?? DEFAULTS.instrumental,
    model: input.model ?? DEFAULTS.model,
  };

  const response = await fetch('/api/compose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getPollenHeaders() },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error || 'Music generation failed';
    throw new ComposeMusicError(message, response.status);
  }

  if (!data?.audioUrl) {
    throw new ComposeMusicError('Music response missing audioUrl', response.status);
  }

  return data.audioUrl;
}

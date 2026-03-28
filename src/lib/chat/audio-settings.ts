export const DEFAULT_TTS_SPEED = 1;

export const TTS_SPEED_PRESETS = [
  { value: 0.85, label: '0.85x' },
  { value: 1, label: '1.0x' },
  { value: 1.15, label: '1.15x' },
] as const;

const SUPPORTED_STT_LANGUAGE_HINTS = new Set(['de', 'en']);

export function resolveSttLanguageHint(language?: string): 'de' | 'en' | undefined {
  if (!language) return undefined;
  return SUPPORTED_STT_LANGUAGE_HINTS.has(language) ? (language as 'de' | 'en') : undefined;
}

export function isSupportedTtsSpeed(speed: number): boolean {
  return TTS_SPEED_PRESETS.some((preset) => preset.value === speed);
}

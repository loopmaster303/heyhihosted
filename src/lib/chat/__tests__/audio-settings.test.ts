import {
  resolveSttLanguageHint,
  TTS_SPEED_PRESETS,
  DEFAULT_TTS_SPEED,
  isSupportedTtsSpeed,
} from '@/lib/chat/audio-settings';

describe('audio settings helpers', () => {
  it('returns STT language hints only for supported app languages', () => {
    expect(resolveSttLanguageHint('de')).toBe('de');
    expect(resolveSttLanguageHint('en')).toBe('en');
    expect(resolveSttLanguageHint('fr')).toBeUndefined();
    expect(resolveSttLanguageHint(undefined)).toBeUndefined();
  });

  it('exposes the approved TTS speed presets and validator', () => {
    expect(TTS_SPEED_PRESETS.map((preset) => preset.value)).toEqual([0.85, 1, 1.15]);
    expect(DEFAULT_TTS_SPEED).toBe(1);
    expect(isSupportedTtsSpeed(1.15)).toBe(true);
    expect(isSupportedTtsSpeed(0.7)).toBe(false);
  });
});

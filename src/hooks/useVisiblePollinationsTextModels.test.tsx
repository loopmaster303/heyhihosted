import { renderHook } from '@testing-library/react';
import { VISIBLE_POLLINATIONS_MODEL_IDS } from '@/config/chat-options';
import { useVisiblePollinationsTextModels } from './useVisiblePollinationsTextModels';

jest.mock('./useHasPollenKey', () => ({
  useHasPollenKey: () => true,
}));

describe('useVisiblePollinationsTextModels', () => {
  it('keeps the browser-visible text model list curated even with a BYOP key present', () => {
    const { result } = renderHook(() => useVisiblePollinationsTextModels());

    expect(result.current.hasByopKey).toBe(true);
    expect(result.current.visibleModelIds).toEqual(VISIBLE_POLLINATIONS_MODEL_IDS);
    expect(result.current.visibleModelIds).not.toEqual(expect.arrayContaining([
      'nomnom',
      'qwen-character',
      'step-3.5-flash',
      'openai',
      'grok',
    ]));
    expect(result.current.isKnownModelId('claude-fast')).toBe(true);
    expect(result.current.isKnownModelId('openai')).toBe(false);
  });
});

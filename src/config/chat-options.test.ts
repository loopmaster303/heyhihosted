import {
  getPreferredDeepResearchModel,
  getPreferredLiveSearchModel,
  VISIBLE_POLLINATIONS_MODEL_IDS,
} from './chat-options';

describe('deep research / live search model selection', () => {
  it('picks the first deep-research candidate that is visible', () => {
    const preferred = getPreferredDeepResearchModel();
    expect(VISIBLE_POLLINATIONS_MODEL_IDS).toContain(preferred);
    expect(preferred).toBe('perplexity-reasoning');
  });

  it('falls back to the caller model when no candidate is visible', () => {
    const original = [...VISIBLE_POLLINATIONS_MODEL_IDS];
    (VISIBLE_POLLINATIONS_MODEL_IDS as unknown as string[]).splice(
      0,
      VISIBLE_POLLINATIONS_MODEL_IDS.length,
      'gemini-fast'
    );
    try {
      expect(getPreferredDeepResearchModel('gemini-fast')).toBe('gemini-fast');
      expect(getPreferredDeepResearchModel('unknown-model')).toBeUndefined();
    } finally {
      (VISIBLE_POLLINATIONS_MODEL_IDS as unknown as string[]).splice(0, VISIBLE_POLLINATIONS_MODEL_IDS.length, ...original);
    }
  });

  it('picks the first live-search candidate that is visible', () => {
    expect(getPreferredLiveSearchModel()).toBe('perplexity-fast');
  });
});

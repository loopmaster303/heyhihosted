import { buildPrunaEntries, buildPollinationsEntries, PRUNA_HIDDEN_IN_PLAYGROUND } from './model-source';

describe('model-source', () => {
  it('pruna list excludes try-on and avatar', () => {
    const ids = buildPrunaEntries().map((m) => m.id);
    expect(ids).not.toContain('p-image-try-on');
    expect(ids).not.toContain('p-video-avatar');
    expect(PRUNA_HIDDEN_IN_PLAYGROUND.size).toBe(2);
    expect(ids).toContain('zimage');
    expect(ids).toContain('wan-t2v');
    expect(ids).toContain('p-video-animate');
  });

  it('pollinations entries mark unknown ids as unmapped', () => {
    const entries = buildPollinationsEntries([{ id: 'brand-new-model', outputModalities: ['image'], inputModalities: ['text'] }]);
    expect(entries[0].unmapped).toBe(true);
    expect(entries[0].kind).toBe('image');
  });

  it('pollinations entries hydrate from config for known ids', () => {
    const entries = buildPollinationsEntries([{ id: 'flux', outputModalities: ['image'], inputModalities: ['text'] }]);
    expect(entries[0].unmapped).toBe(false);
    expect(entries[0].name).toBe('Flux.1 Fast');
  });
});

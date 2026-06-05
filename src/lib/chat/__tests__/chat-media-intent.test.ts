import { parseMediaIntents } from '../chat-media-intent';

describe('parseMediaIntents', () => {
  it('returns empty result for empty input', () => {
    expect(parseMediaIntents('')).toEqual({ cleanText: '', markers: [] });
  });

  it('returns input untouched (whitespace-normalised) when no markers are present', () => {
    const text = 'Just a normal assistant response with no markers.';
    expect(parseMediaIntents(text)).toEqual({ cleanText: text, markers: [] });
  });

  it('extracts a single IMAGE_GEN marker', () => {
    const text = 'Here you go: [IMAGE_GEN: a cat in a spacesuit]';
    const result = parseMediaIntents(text);
    expect(result.markers).toEqual([
      { kind: 'image', prompt: 'a cat in a spacesuit', index: 13, raw: '[IMAGE_GEN: a cat in a spacesuit]' },
    ]);
    expect(result.cleanText).toBe('Here you go:');
  });

  it('extracts a single MUSIC_GEN marker', () => {
    const text = '[MUSIC_GEN: lofi hip hop, rainy night]';
    const result = parseMediaIntents(text);
    expect(result.markers).toHaveLength(1);
    expect(result.markers[0].kind).toBe('music');
    expect(result.markers[0].prompt).toBe('lofi hip hop, rainy night');
    expect(result.cleanText).toBe('');
  });

  it('extracts both marker types in source order', () => {
    const text = '[IMAGE_GEN: sunset] then [MUSIC_GEN: chillwave]';
    const result = parseMediaIntents(text);
    expect(result.markers.map((m) => m.kind)).toEqual(['image', 'music']);
    expect(result.markers.map((m) => m.prompt)).toEqual(['sunset', 'chillwave']);
    expect(result.cleanText).toBe('then');
  });

  it('handles multiple markers of the same kind', () => {
    const text = '[IMAGE_GEN: cat][IMAGE_GEN: dog][IMAGE_GEN: bird]';
    const result = parseMediaIntents(text);
    expect(result.markers.map((m) => m.prompt)).toEqual(['cat', 'dog', 'bird']);
    expect(result.cleanText).toBe('');
  });

  it('trims internal whitespace inside the prompt', () => {
    const text = '[IMAGE_GEN:    cat   in   space   ]';
    const result = parseMediaIntents(text);
    expect(result.markers[0].prompt).toBe('cat in space');
  });

  it('handles markers at start, middle and end of text', () => {
    const text = '[IMAGE_GEN: cat] middle [MUSIC_GEN: synth] end';
    const result = parseMediaIntents(text);
    expect(result.markers).toHaveLength(2);
    expect(result.markers[0].index).toBe(0);
    expect(result.cleanText).toBe('middle end');
  });

  it('preserves newlines inside the prompt body', () => {
    const text = '[IMAGE_GEN: line one\nline two\nline three]';
    const result = parseMediaIntents(text);
    expect(result.markers[0].prompt).toBe('line one line two line three');
  });

  it('does not match an unclosed marker', () => {
    const text = 'broken [IMAGE_GEN: cat without close';
    const result = parseMediaIntents(text);
    expect(result.markers).toEqual([]);
    expect(result.cleanText).toBe('broken [IMAGE_GEN: cat without close');
  });

  it('does not match a marker with no body content', () => {
    const text = '[IMAGE_GEN: ] trailing';
    const result = parseMediaIntents(text);
    expect(result.markers).toEqual([]);
    expect(result.cleanText).toBe('trailing');
  });

  it('does not match a marker without the colon or tag', () => {
    const text = '[cat] and [IMAGE_GEN cat] and []';
    const result = parseMediaIntents(text);
    expect(result.markers).toEqual([]);
  });

  it('is case-sensitive: lowercase marker names are ignored', () => {
    const text = '[image_gen: cat] and [Music_Gen: synth]';
    const result = parseMediaIntents(text);
    expect(result.markers).toEqual([]);
    expect(result.cleanText).toBe(text);
  });

  it('stops at the first closing bracket when prompts contain brackets', () => {
    const text = '[IMAGE_GEN: cat [small] in room]';
    const result = parseMediaIntents(text);
    expect(result.markers).toHaveLength(1);
    expect(result.markers[0].prompt).toBe('cat [small');
  });

  it('preserves unicode and emoji in prompts and cleanText', () => {
    const text = 'Klar — [IMAGE_GEN: ein Kätzchen 🐱 mit Glitzer] — mache ich!';
    const result = parseMediaIntents(text);
    expect(result.markers[0].prompt).toBe('ein Kätzchen 🐱 mit Glitzer');
    expect(result.cleanText).toBe('Klar — — mache ich!');
  });

  it('collapses runs of blank lines left behind by removed markers', () => {
    const text = 'intro\n\n\n\n[IMAGE_GEN: cat]\n\n\n\noutro';
    const result = parseMediaIntents(text);
    expect(result.cleanText).toBe('intro\n\noutro');
  });

  it('trims trailing whitespace on every line', () => {
    const text = 'first line   \n   second line\t\n   [IMAGE_GEN: cat]   ';
    const result = parseMediaIntents(text);
    expect(result.cleanText).toBe('first line\nsecond line');
  });

  it('exposes the raw substring for downstream logging', () => {
    const text = 'noise [IMAGE_GEN: prompt] more';
    const result = parseMediaIntents(text);
    expect(result.markers[0].raw).toBe('[IMAGE_GEN: prompt]');
  });

  it('is fast on long inputs (smoke test, < 100ms)', () => {
    const longText = 'lorem ipsum '.repeat(10_000) + '[IMAGE_GEN: cat] ' + 'dolor sit amet '.repeat(10_000);
    const start = Date.now();
    const result = parseMediaIntents(longText);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
    expect(result.markers).toHaveLength(1);
    expect(result.markers[0].prompt).toBe('cat');
  });
});

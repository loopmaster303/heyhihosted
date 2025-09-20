import { sanitizeEnhancedPrompt } from './sanitize';

describe('sanitizeEnhancedPrompt', () => {
  test('removes German label prefixes and bullets', () => {
    const input = `Zielobjekt: Nostalgische Gruppenaufnahme von Seeleuten.\n- Änderung: Sepia-Farbton, warmes Gegenlicht.\n• Perspektive: leicht erhöht.`;
    const out = sanitizeEnhancedPrompt(input);
    expect(out).toContain('Nostalgische Gruppenaufnahme von Seeleuten');
    expect(out).toContain('Sepia-Farbton');
    expect(out).toContain('leicht erhöht');
    expect(out).not.toMatch(/Zielobjekt|Änderung|Perspektive|^[-•]/);
  });

  test('removes English label prefixes', () => {
    const input = `Target object: Nostalgic group portrait of sailors.\nChange: render in sepia with warm light.`;
    const out = sanitizeEnhancedPrompt(input);
    expect(out).toContain('Nostalgic group portrait of sailors');
    expect(out).toContain('render in sepia with warm light');
    expect(out).not.toMatch(/Target object|Change/);
  });

  test('handles combined labels in header before colon', () => {
    const input = `Reference, change, identity preserved: sailors old headshot; change to weathered portrait.`;
    const out = sanitizeEnhancedPrompt(input);
    expect(out).toContain('sailors old headshot; change to weathered portrait');
    expect(out).not.toMatch(/Reference|change|identity preserved:/i);
  });

  test('strips numeric prefixes like 1Target and 2remove', () => {
    const input = `1Target object: sailors group portrait\n2remove modern logos or signage.`;
    const out = sanitizeEnhancedPrompt(input);
    expect(out).toContain('sailors group portrait');
    expect(out).toContain('remove modern logos or signage');
    expect(out).not.toMatch(/^\d/);
  });

  test('removes mid-sentence labels like Change:', () => {
    const input = `Nostalgic group portrait. Change: render in sepia with golden-hour lighting.`;
    const out = sanitizeEnhancedPrompt(input);
    expect(out).toBe('Nostalgic group portrait. render in sepia with golden-hour lighting.');
    expect(out).not.toMatch(/Change:/);
  });

  test('collapses whitespace and trims', () => {
    const input = `  Enhanced Prompt:  Foo   \n\n  Bar  `;
    const out = sanitizeEnhancedPrompt(input);
    expect(out).toBe('Foo Bar');
  });
});


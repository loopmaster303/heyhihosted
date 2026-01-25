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
    expect(out).not.toMatch(/(Target object|Change):/i);
  });

  test('handles combined labels in header before colon', () => {
    const input = `Reference, change, identity preserved: sailors old headshot; change to weathered portrait.`;
    const out = sanitizeEnhancedPrompt(input);
    expect(out).toContain('sailors old headshot; change to weathered portrait');
    expect(out).not.toMatch(/(Reference|change|identity preserved):/i);
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

  test('removes square bracket labels used in video prompts', () => {
    const input = `[Texture Package]: 1989 anime aesthetic, hand-drawn cel animation. [Subject]: Cyberpunk samurai. [Action]: Rapid sword swing. [Camera]: Whip pan.`;
    const out = sanitizeEnhancedPrompt(input);
    expect(out).toContain('1989 anime aesthetic, hand-drawn cel animation');
    expect(out).toContain('Cyberpunk samurai');
    expect(out).toContain('Rapid sword swing');
    expect(out).toContain('Whip pan');
    expect(out).not.toMatch(/\[Texture Package\]|\[Subject\]|\[Action\]|\[Camera\]/);
  });

  test('preserves shot cut syntax for Seedance Fast', () => {
    const input = `Thick black outlines, 2D cel shading. Character charges forward, shot cut, Impact frame on strike, shot cut, Reaction shot. Dutch angle.`;
    const out = sanitizeEnhancedPrompt(input);
    expect(out).toContain('shot cut');
    expect(out).toContain('Thick black outlines, 2D cel shading');
    expect(out).toContain('Dutch angle');
  });

  test('handles negative prompt syntax', () => {
    const input = `A cyberpunk girl in neon-lit alley. --negative_prompt 3d render, unreal engine, volumetric lighting`;
    const out = sanitizeEnhancedPrompt(input);
    expect(out).toContain('A cyberpunk girl in neon-lit alley');
    expect(out).toContain('Negative:');
    expect(out).toContain('3d render, unreal engine, volumetric lighting');
    expect(out).not.toMatch(/--negative_prompt/);
  });

  test('removes multiple square bracket labels in sequence', () => {
    const input = `[Style Foundation]: 35mm film. [Subject & Pose]: Young woman standing. [Primary Motion]: Glides forward. [Camera Choreography]: Smooth tracking shot. [Environmental Dynamics]: Wind rustles fabric.`;
    const out = sanitizeEnhancedPrompt(input);
    expect(out).toContain('35mm film');
    expect(out).toContain('Young woman standing');
    expect(out).toContain('Glides forward');
    expect(out).toContain('Smooth tracking shot');
    expect(out).toContain('Wind rustles fabric');
    expect(out).not.toMatch(/\[(Style Foundation|Subject & Pose|Primary Motion|Camera Choreography|Environmental Dynamics)\]/);
  });
});


/**
 * C1: Modelle ohne handgepflegten Prompt bekommen ihren Prompt aus den
 * Registry-Metadaten statt zwei deutscher Saetze ohne Modus-Erkennung.
 */
import { buildRegistryEnhancementPrompt } from './enhancement-prompts';

describe('buildRegistryEnhancementPrompt', () => {
  it('omits reference handling for a model that takes none', () => {
    const prompt = buildRegistryEnhancementPrompt({
      id: 'some-t2i-model',
      displayName: 'Some T2I Model',
      outputModalities: ['image'],
      inputModalities: ['text'],
    });

    expect(prompt).not.toContain('<mode_detection>');
    expect(prompt).not.toContain('<i2x_mode>');
    expect(prompt).toContain('takes no reference images');
    expect(prompt).toContain('IMAGE model');
  });

  it('adds mode detection and single-reference surgery for a 1-image editor', () => {
    const prompt = buildRegistryEnhancementPrompt({
      id: 'some-editor',
      outputModalities: ['image'],
      inputModalities: ['text', 'image'],
      maxReferenceImages: 1,
    });

    expect(prompt).toContain('<mode_detection>');
    expect(prompt).toContain('<i2x_mode>');
    expect(prompt).toContain('Keep [Z] exactly as-is');
    // Deutsche Trigger gehoeren dazu — die Eingabe kommt oft auf Deutsch.
    expect(prompt).toContain('Referenzbild');
  });

  it('demands explicit per-image roles once more than one reference is allowed', () => {
    const prompt = buildRegistryEnhancementPrompt({
      id: 'multi-ref',
      outputModalities: ['image'],
      inputModalities: ['text', 'image'],
      maxReferenceImages: 4,
    });

    expect(prompt).toContain('up to 4 reference images');
    expect(prompt).toContain('the person from image 1');
  });

  it('switches to video grammar and names end-frame plus audio capabilities', () => {
    const prompt = buildRegistryEnhancementPrompt({
      id: 'some-video',
      outputModalities: ['video'],
      inputModalities: ['text', 'image'],
      maxReferenceImages: 1,
      videoCapabilities: ['end_frame', 'audio_output'],
    });

    expect(prompt).toContain('VIDEO model');
    expect(prompt).toContain('END FRAME');
    expect(prompt).toContain('generates AUDIO');
    // Ein Referenzbild ist bei Video der Startframe, kein Editier-Ziel.
    expect(prompt).toContain('FIRST FRAME');
    expect(prompt).not.toContain('Keep [Z] exactly as-is');
  });

  it('stays silent about capabilities the registry does not report', () => {
    const prompt = buildRegistryEnhancementPrompt({
      id: 'plain-video',
      outputModalities: ['video'],
      inputModalities: ['text'],
    });

    expect(prompt).not.toContain('END FRAME');
    expect(prompt).not.toContain('generates AUDIO');
    expect(prompt).not.toContain('<resolutions>');
  });

  it('carries resolutions through when the registry reports them', () => {
    const prompt = buildRegistryEnhancementPrompt({
      id: 'sized',
      outputModalities: ['image'],
      inputModalities: ['text'],
      resolutions: ['1024x1024', '1536x1024'],
    });

    expect(prompt).toContain('1024x1024, 1536x1024');
  });

  it('never asks for a negative prompt section', () => {
    const prompt = buildRegistryEnhancementPrompt({
      id: 'any',
      outputModalities: ['image'],
      inputModalities: ['text'],
    });

    expect(prompt).toContain('no negative prompt section');
  });
});

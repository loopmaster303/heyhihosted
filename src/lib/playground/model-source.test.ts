import { buildPrunaEntries, buildPollinationsEntries, PRUNA_HIDDEN_IN_PLAYGROUND } from './model-source';
import { PLAYGROUND_PRUNA_IDS } from './param-schema';

describe('model-source', () => {
  it('pruna list excludes try-on and avatar', () => {
    const ids = buildPrunaEntries().map((m) => m.id);
    expect(ids).not.toContain('p-image-try-on');
    expect(ids).not.toContain('p-video-avatar');
    expect(PRUNA_HIDDEN_IN_PLAYGROUND.size).toBe(5);
    // E-A (Pruna BYOP-only, 2026-08-28): zimage ist enabled:false und taucht
    // im Playground nicht mehr auf, solange kein eigener Schluessel wirkt.
    expect(ids).not.toContain('zimage');
    expect(ids).toContain('wan-t2v');
  });

  // Diese Teilmengen-Beziehung ist der Grund, warum die Shell nicht noch einmal
  // filtern muss. Kippt sie, taucht ein Pruna-Modell mit Pollinations-Reglern auf.
  it('shows only pruna models that have a hand-written schema', () => {
    const ids = buildPrunaEntries().map((m) => m.id);
    for (const id of ids) {
      expect(PLAYGROUND_PRUNA_IDS).toContain(id);
    }
  });

  // Ein in der Registry abgeschaltetes Modell darf hier nicht wieder
  // auftauchen — der Playground liest sonst nur die Id-Liste und uebergeht
  // die einzige Stelle, an der Sichtbarkeit entschieden wird.
  it('drops pruna models that the registry has disabled', () => {
    const ids = buildPrunaEntries().map((m) => m.id);
    expect(ids).not.toContain('vace');
    expect(PLAYGROUND_PRUNA_IDS).toContain('vace');
  });

  it('pollinations entries mark unknown ids as unmapped', () => {
    const entries = buildPollinationsEntries([{
      name: 'brand-new-model',
      output_modalities: ['image'],
      input_modalities: ['text'],
    }]);
    expect(entries[0].unmapped).toBe(true);
    expect(entries[0].kind).toBe('image');
  });

  it('pollinations entries hydrate from config for known ids', () => {
    const entries = buildPollinationsEntries([{
      name: 'flux',
      output_modalities: ['image'],
      input_modalities: ['text'],
    }]);
    expect(entries[0].unmapped).toBe(false);
    expect(entries[0].name).toBe('Flux.1 Fast');
  });

  // Schritt 5 / T6: enabled: false aus der kuratierten Config blendet ein
  // gemapptes Modell aus; ein Registry-only Modell bleibt trotzdem stehen.
  it('drops config-disabled pollinations models but keeps unmapped ones', () => {
    const entries = buildPollinationsEntries([
      { name: 'grok-imagine', output_modalities: ['image'] },
      { name: 'brand-new-live-model', output_modalities: ['image'] },
    ]);
    const ids = entries.map((m) => m.id);
    expect(ids).not.toContain('grok-imagine');
    expect(ids).toContain('brand-new-live-model');
    expect(entries.find((m) => m.id === 'brand-new-live-model')?.unmapped).toBe(true);
  });

  it('reads the registry snake_case fields', () => {
    const [e] = buildPollinationsEntries([{
      name: 'veo-3.1-fast',
      title: 'Veo 3.1 Fast',
      input_modalities: ['text', 'image'],
      output_modalities: ['video'],
      video_capabilities: ['start_frame', 'end_frame', 'audio_output'],
      max_reference_images: 2,
      resolutions: ['720p', '1080p'],
      paid_only: true,
    }]);
    expect(e.kind).toBe('video');
    expect(e.maxImages).toBe(2);
    expect(e.supportsEndFrame).toBe(true);
    expect(e.supportsAudio).toBe(true);
    expect(e.referenceMode).toBe('start-end-frame');
    expect(e.paidOnly).toBe(true);
    expect(e.name).toBe('Veo 3.1 Fast');
  });

  it('treats a text-only image model as t2i without references', () => {
    const [e] = buildPollinationsEntries([{
      name: 'flux',
      title: 'Flux Test',
      input_modalities: ['text'],
      output_modalities: ['image'],
      paid_only: false,
    }]);
    expect(e.kind).toBe('image');
    expect(e.maxImages).toBe(0);
    expect(e.supportsReference).toBe(false);
    expect(e.paidOnly).toBe(false);
  });

  it('treats a video model that requires image as i2v', () => {
    const [e] = buildPollinationsEntries([{
      name: 'test-i2v',
      input_modalities: ['image'],
      output_modalities: ['video'],
      video_capabilities: [],
      paid_only: true,
    }]);
    expect(e.kind).toBe('video');
    expect(e.requiresReference).toBe(true);
    expect(e.supportsReference).toBe(true);
  });

  it('uses name as id when title is missing', () => {
    const [e] = buildPollinationsEntries([{
      name: 'my-model',
      output_modalities: ['image'],
      input_modalities: ['text'],
      video_capabilities: [],
      paid_only: false,
    }]);
    expect(e.id).toBe('my-model');
    expect(e.name).toBe('my-model');
  });
});

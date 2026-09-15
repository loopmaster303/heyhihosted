import {
  buildPaidClassicModels,
  buildPrunaEntries,
  buildPollinationsEntries,
  PRUNA_HIDDEN_IN_PLAYGROUND,
} from './model-source';
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
    // Pruna hat keine Registry: was der Schluessel des Nutzers darf, weiss nur
    // Pollinations. Die Eintraege bleiben deshalb lauffaehig — sonst waere der
    // ganze Pruna-Zweig gesperrt.
    expect(buildPrunaEntries().every((m) => m.runnableOnKey)).toBe(true);
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
      name: 'gpt-image-2',
      runnable: true,
      output_modalities: ['image'],
      input_modalities: ['text'],
    }]);
    expect(entries[0].unmapped).toBe(false);
    expect(entries[0].name).toBe('GPT Image 2');
    expect(entries[0].runnableOnKey).toBe(true);
  });

  // live belegt 2026-09-10: der Betreiber-Schluessel bedient genau fuenf
  // Modelle, alles andere antwortet mit 403 erst bei der Generierung. Die
  // Auswahl zieht die Grenze vor: was nicht laeuft und kein kuratierter
  // Bezahl-Klassiker ist, kommt gar nicht erst in die Liste.
  it('wirft Modelle raus, die der effektive Schluessel nicht bedienen darf', () => {
    const entries = buildPollinationsEntries([
      { name: 'black-forest-labs/flux.1-dev', runnable: false, output_modalities: ['image'] },
      { name: 'brand-new-live-model', runnable: true, output_modalities: ['image'] },
    ]);
    expect(entries.map((m) => m.id)).toEqual(['brand-new-live-model']);
    expect(entries[0].runnableOnKey).toBe(true);
  });

  it('behandelt eine Sicht ohne Stempel als lauffaehig', () => {
    const [e] = buildPollinationsEntries([{
      name: 'my-live-model',
      output_modalities: ['image'],
      input_modalities: ['text'],
    }]);
    expect(e.runnableOnKey).toBe(true);
  });

  // Der Bezahl-Klassiker steht in der Config genau deshalb auf enabled: false,
  // weil der Betreiber-Schluessel ihn nicht darf (live belegt 2026-09-10) —
  // er ist die Auswahl fuer den eigenen Schluessel und muss sie ueberleben.
  it('behaelt einen Bezahl-Klassiker trotz Sperre und abgeschalteter Config', () => {
    const entries = buildPollinationsEntries([{
      name: 'nanobanana-2',
      runnable: false,
      paid_only: true,
      output_modalities: ['image'],
      max_reference_images: 14,
    }]);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      id: 'nanobanana-2',
      paidOnly: true,
      runnableOnKey: false,
      maxImages: 14,
    });
  });

  // Schritt 5 / T6: enabled: false aus der kuratierten Config blendet ein
  // gemapptes Modell aus; ein Registry-only Modell bleibt trotzdem stehen.
  it('drops config-disabled pollinations models but keeps unmapped ones', () => {
    const entries = buildPollinationsEntries([
      { name: 'kontext', runnable: true, output_modalities: ['image'] },
      { name: 'brand-new-live-model', output_modalities: ['image'] },
    ]);
    const ids = entries.map((m) => m.id);
    // kontext ist in der Config abgeschaltet und kein Bezahl-Klassiker.
    expect(ids).not.toContain('kontext');
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
      name: 'my-live-model',
      title: 'Live Model',
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

  // p-video-2 bekommt dieselben Video-Faehigkeiten wie p-video, bleibt aber
  // ein eigenstaendiger Eintrag: keine gleichnamige Pollinations-Dopplung,
  // weil isPrunaModel() den Namen fuer sich beansprucht.
  it('p-video-2 gets end-frame and audio capabilities, no pollinations duplicate', () => {
    const entries = buildPrunaEntries();
    const pv2 = entries.find((m) => m.id === 'p-video-2');
    expect(pv2).toBeDefined();
    expect(pv2?.kind).toBe('video');
    expect(pv2?.supportsEndFrame).toBe(true);
    expect(pv2?.supportsAudio).toBe(true);
    expect(pv2?.referenceMode).toBe('start-end-frame');
    expect(pv2?.maxImages).toBe(2);

    const pollEntries = buildPollinationsEntries([{ name: 'p-video-2', output_modalities: ['video'] }]);
    expect(pollEntries.map((m) => m.id)).not.toContain('p-video-2');
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

// Die Bezahl-Auswahl der Auswahlliste: sichtbar, aber gesperrt. Ohne diese
// Eintraege sieht ein Nutzer mit eigenem Pollen-Guthaben nicht, was er kaufen
// koennte — der Betreiber-Schluessel liefert sie nicht (live belegt 2026-09-10).
describe('buildPaidClassicModels', () => {
  it('liefert die Klassiker gesperrt und bezahlt', () => {
    const klassiker = buildPaidClassicModels([]);
    expect(klassiker.map((m) => m.name)).toEqual([
      'nanobanana-2',
      'nanobanana-pro',
      'grok-imagine',
      'grok-imagine-pro',
      'grok-imagine-image-2.0',
      'seedream5',
      'qwen-image-3',
      'gptimage',
      'gptimage-large',
      'flux',
      'veo',
      'grok-imagine-video-1.5',
      'seedance-2.5',
    ]);
    expect(klassiker.every((m) => m.runnable === false && m.paid_only === true)).toBe(true);
  });

  it('ueberspringt Klassiker, die die Sicht schon kennt — ueber Name oder Alias', () => {
    const sicht = [
      { name: 'black-forest-labs/flux.1-schnell' },
      { name: 'irgendein-modell', aliases: ['nanobanana2'] },
    ];
    const ids = buildPaidClassicModels(sicht).map((m) => m.name);
    // Ueber den Registry-Namen erkannt.
    expect(ids).not.toContain('flux');
    // Ueber den Alias erkannt.
    expect(ids).not.toContain('nanobanana-2');
    expect(ids).toContain('grok-imagine');
  });
});

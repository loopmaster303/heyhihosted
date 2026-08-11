import { schemaFor, schemaForPollinations, defaultsFor, visibleFields, PLAYGROUND_PRUNA_IDS, type ParamValues } from './param-schema';
import type { PlaygroundModelEntry } from './model-source';

describe('param-schema', () => {
  it('every playground pruna id has a schema', () => {
    for (const id of PLAYGROUND_PRUNA_IDS) {
      expect(schemaFor(id)).toBeDefined();
    }
  });

  it('field names are unique per schema', () => {
    for (const id of PLAYGROUND_PRUNA_IDS) {
      const schema = schemaFor(id)!;
      const names: string[] = [];
      for (const group of schema.groups) {
        for (const field of group.fields) {
          expect(names).not.toContain(field.name);
          names.push(field.name);
        }
      }
    }
  });

  it('defaults are within allowed ranges when visible', () => {
    for (const id of PLAYGROUND_PRUNA_IDS) {
      const schema = schemaFor(id)!;
      const d = defaultsFor(schema);
      const visible = visibleFields(schema, d);
      for (const field of visible) {
        if (field.default === undefined) continue;
        const val = d[field.name];
        if (val === undefined) {
          throw new Error(`FAIL: ${id}.${field.name} kind=${field.kind} default=${field.default} keys=${Object.keys(d).join(',')}`);
        }
        if (val !== field.default) {
          throw new Error(`FAIL: ${id}.${field.name} val=${val} !== default=${field.default}`);
        }
        if (field.kind === 'number') {
          if (typeof val !== 'number') throw new Error(`FAIL: ${id}.${field.name} not number`);
          if (val < field.min) throw new Error(`FAIL: ${id}.${field.name} ${val} < ${field.min}`);
          if (val > field.max) throw new Error(`FAIL: ${id}.${field.name} ${val} > ${field.max}`);
        }
        if (field.kind === 'seconds') {
          if (typeof val !== 'number') throw new Error(`FAIL: ${id}.${field.name} not number`);
          if (!field.options.includes(val)) throw new Error(`FAIL: ${id}.${field.name} ${val} not in ${field.options.join(',')}`);
        }
        if (field.kind === 'enum') {
          const values = field.options.map((o) => o.value);
          if (!values.includes(val as string)) throw new Error(`FAIL: ${id}.${field.name} ${val} not in ${values.join(',')}`);
        }
      }
    }
    expect(true).toBe(true);
  });

  // The visibility-scoped check above skips fields behind a showIf, which is how
  // p-image shipped width/height with a default of 1024 against a max of 896.
  // A default outside its own range is wrong whether or not it is on screen.
  it('every numeric default sits inside its own range, visible or not', () => {
    const offenders: string[] = [];
    for (const id of PLAYGROUND_PRUNA_IDS) {
      for (const group of schemaFor(id)!.groups) {
        for (const field of group.fields) {
          if (field.kind !== 'number' || field.default === undefined) continue;
          if (field.default < field.min || field.default > field.max) {
            offenders.push(`${id}.${field.name}: default ${field.default} outside ${field.min}–${field.max}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('p-image-upscale has promptRequired false', () => {
    expect(schemaFor('p-image-upscale')?.promptRequired).toBe(false);
  });

  it('wan-i2v has start and end frame roles', () => {
    const schema = schemaFor('wan-i2v');
    expect(schema?.images.roles).toEqual(['Start', 'Ende']);
    expect(schema?.images.min).toBe(1);
    expect(schema?.images.max).toBe(2);
  });

  // Die Oberfläche bietet kein 'custom' und keine freien Pixelmaße an. Der
  // Nutzer wählt ein Seitenverhältnis, übersetzt wird im Backend.
  it('p-image exposes an aspect ratio but no raw pixel fields', () => {
    const schema = schemaFor('p-image')!;
    const d = defaultsFor(schema);
    expect(d.aspect_ratio).toBe('16:9');
    const names = schema.groups.flatMap((g) => g.fields.map((f) => f.name));
    expect(names).not.toContain('width');
    expect(names).not.toContain('height');
    const ratios = schema.groups
      .flatMap((g) => g.fields)
      .find((f) => f.name === 'aspect_ratio');
    expect(ratios?.kind).toBe('enum');
    if (ratios?.kind === 'enum') {
      expect(ratios.options.map((o) => o.value)).not.toContain('custom');
    }
  });

  // Die wan-Modelle kennen nur num_frames bei fester Bildrate. Der Nutzer sieht
  // Sekunden; 81-121 Frames bei 16 fps ergeben genau 5, 6 und 7.
  it('wan models offer seconds, not frames', () => {
    for (const id of ['wan-t2v', 'wan-i2v']) {
      const schema = schemaFor(id)!;
      const names = schema.groups.flatMap((g) => g.fields.map((f) => f.name));
      expect(names).not.toContain('num_frames');
      expect(names).not.toContain('frames_per_second');

      const duration = schema.groups.flatMap((g) => g.fields).find((f) => f.name === 'duration');
      expect(duration?.kind).toBe('seconds');
      if (duration?.kind === 'seconds') {
        expect(duration.options).toEqual([5, 6, 7]);
      }
      expect(defaultsFor(schema).duration).toBe(5);
    }
  });

  it('p-video hides the frame rate', () => {
    const names = schemaFor('p-video')!.groups.flatMap((g) => g.fields.map((f) => f.name));
    expect(names).not.toContain('fps');
    expect(names).toContain('duration');
  });
});

describe('schemaForPollinations', () => {
  function entry(over: Partial<PlaygroundModelEntry> = {}): PlaygroundModelEntry {
    return {
      id: 'flux', name: 'Flux', provider: 'pollinations', kind: 'image',
      supportsReference: false, requiresReference: false, maxImages: 0,
      unmapped: false, supportsEndFrame: false, supportsAudio: false,
      paidOnly: false, community: false, ...over,
    };
  }
  const names = (s: ReturnType<typeof schemaForPollinations>) =>
    s.groups.flatMap((g) => g.fields.map((f) => f.name));

  // Ohne diese Ableitung bekaemen Pollinations-Modelle gar keine Regler:
  // SCHEMA_MAP kennt nur die dreizehn Pruna-Modelle.
  it('gives every image model an aspect ratio', () => {
    const s = schemaForPollinations(entry());
    expect(names(s)).toContain('aspect_ratio');
  });

  it('offers seed only where the API honours it', () => {
    expect(names(schemaForPollinations(entry({ id: 'flux' })))).toContain('seed');
    expect(names(schemaForPollinations(entry({ id: 'kontext' })))).not.toContain('seed');
  });

  it('offers quality and transparency only to the gptimage family', () => {
    const gpt = names(schemaForPollinations(entry({ id: 'gptimage' })));
    expect(gpt).toContain('quality');
    expect(gpt).toContain('transparent');
    expect(names(schemaForPollinations(entry({ id: 'flux' })))).not.toContain('quality');
  });

  it('builds a video model from its registry capabilities', () => {
    const s = schemaForPollinations(entry({
      id: 'veo', kind: 'video', supportsAudio: true, supportsEndFrame: true,
      supportsReference: true, maxImages: 2, resolutions: ['720p', '1080p'],
    }));
    expect(names(s)).toEqual(expect.arrayContaining(['duration', 'resolution', 'aspect_ratio', 'audio']));
    expect(s.images).toEqual({ min: 0, max: 2, roles: ['Start', 'Ende'] });
  });

  it('leaves out the duration when no values are documented', () => {
    const s = schemaForPollinations(entry({ id: 'grok-video-pro', kind: 'video' }));
    expect(names(s)).not.toContain('duration');
  });
});

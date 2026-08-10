import { schemaFor, defaultsFor, visibleFields, PLAYGROUND_PRUNA_IDS, type ParamValues } from './param-schema';

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

  it('p-image-upscale has promptRequired false', () => {
    expect(schemaFor('p-image-upscale')?.promptRequired).toBe(false);
  });

  it('wan-i2v has start and end frame roles', () => {
    const schema = schemaFor('wan-i2v');
    expect(schema?.images.roles).toEqual(['Start', 'Ende']);
    expect(schema?.images.min).toBe(1);
    expect(schema?.images.max).toBe(2);
  });

  it('custom size fields are hidden when aspect_ratio is not custom', () => {
    const schema = schemaFor('p-image');
    const d1 = defaultsFor(schema!);
    expect(d1.aspect_ratio).toBe('16:9');
    const visible1 = visibleFields(schema!, d1);
    expect(visible1.some((f) => f.name === 'width')).toBe(false);

    const d2: ParamValues = { ...d1, aspect_ratio: 'custom' };
    const visible2 = visibleFields(schema!, d2);
    expect(visible2.some((f) => f.name === 'width')).toBe(true);
    expect(visible2.some((f) => f.name === 'height')).toBe(true);
  });

  it('wan-t2v has frames field default 81', () => {
    const d = defaultsFor(schemaFor('wan-t2v')!);
    expect(d.num_frames).toBe(81);
    expect(d.frames_per_second).toBe(16);
  });
});

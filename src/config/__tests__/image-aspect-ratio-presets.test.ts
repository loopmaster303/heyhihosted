import { getAspectRatioPresetsForModel } from '@/config/image-aspect-ratio-presets';
import { imageModelIcons, modelIcons } from '@/config/ui-constants';

describe('image aspect ratio presets', () => {
  test('uses exact standard aspect-ratio sizes for dirtberry', () => {
    const presets = getAspectRatioPresetsForModel('dirtberry');

    expect(presets['1:1']).toEqual({ width: 1024, height: 1024 });
    expect(presets['4:3']).toEqual({ width: 1024, height: 768 });
    expect(presets['3:4']).toEqual({ width: 768, height: 1024 });
    expect(presets['16:9']).toEqual({ width: 1344, height: 768 });
    expect(presets['9:16']).toEqual({ width: 768, height: 1344 });
  });

  test('keeps the current legacy preset sizes for klein-large', () => {
    const presets = getAspectRatioPresetsForModel('klein-large');

    expect(presets['1:1']).toEqual({ width: 1024, height: 1024 });
    expect(presets['16:9']).toEqual({ width: 1536, height: 1024 });
    expect(presets['9:16']).toEqual({ width: 1024, height: 1536 });
  });

  test('maps dirtberry to the same Pollinations logo used by nomnom', () => {
    expect(imageModelIcons.dirtberry).toBe(modelIcons.nomnom);
  });
});

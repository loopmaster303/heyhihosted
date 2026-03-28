import { getAspectRatioPresetsForModel } from '@/config/image-aspect-ratio-presets';

describe('image aspect ratio presets', () => {
  test('keeps the legacy Pollinations preset sizes for maintained image models', () => {
    const presets = getAspectRatioPresetsForModel('flux');

    expect(presets['1:1']).toEqual({ width: 1024, height: 1024 });
    expect(presets['16:9']).toEqual({ width: 1536, height: 1024 });
    expect(presets['9:16']).toEqual({ width: 1024, height: 1536 });
  });

  test('applies the same maintained presets to newly added upstream visual models', () => {
    const presets = getAspectRatioPresetsForModel('qwen-image');

    expect(presets['1:1']).toEqual({ width: 1024, height: 1024 });
    expect(presets['4:3']).toEqual({ width: 1536, height: 1024 });
    expect(presets['3:4']).toEqual({ width: 1024, height: 1536 });
  });
});

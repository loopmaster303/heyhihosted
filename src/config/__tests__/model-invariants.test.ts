import { UNIFIED_IMAGE_MODELS } from '@/config/unified-image-models';
import { pollinationUploadModels } from '@/hooks/useUnifiedImageToolState';

describe('model invariants', () => {
  test('all pollinations models with supportsReference=true are present in pollinationUploadModels', () => {
    const expected = UNIFIED_IMAGE_MODELS
      .filter(m => m.provider === 'pollinations' && m.supportsReference === true && (m.enabled ?? true))
      .map(m => m.id)
      .sort();

    const actual = [...new Set(pollinationUploadModels)].sort();

    // Every supportsReference model must be in the upload list.
    const missing = expected.filter(id => !actual.includes(id));
    expect(missing).toEqual([]);
  });

  test('seedance supports optional reference image (I2V)', () => {
    const m = UNIFIED_IMAGE_MODELS.find(x => x.id === 'seedance');
    expect(m).toBeTruthy();
    expect(m?.supportsReference).toBe(true);
    expect(m?.maxImages).toBe(1);
  });
});

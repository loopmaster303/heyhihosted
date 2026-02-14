import { UNIFIED_IMAGE_MODELS } from '@/config/unified-image-models';
import { pollinationUploadModels, replicateUploadModels } from '@/hooks/useUnifiedImageToolState';

describe('model invariants', () => {
  test('all pollinations models with supportsReference=true are present in pollinationUploadModels', () => {
    const expected = UNIFIED_IMAGE_MODELS
      .filter(m => m.provider === 'pollinations' && m.supportsReference === true)
      .map(m => m.id)
      .sort();

    const actual = [...new Set(pollinationUploadModels)].sort();

    // Every supportsReference model must be in the upload list.
    const missing = expected.filter(id => !actual.includes(id));
    expect(missing).toEqual([]);
  });

  test('all replicate models with supportsReference=true are present in replicateUploadModels', () => {
    const expected = UNIFIED_IMAGE_MODELS
      .filter(m => m.provider === 'replicate' && m.supportsReference === true)
      .map(m => m.id)
      .sort();

    const actual = [...new Set(replicateUploadModels)].sort();

    const missing = expected.filter(id => !actual.includes(id));
    expect(missing).toEqual([]);
  });

  test('seedance is treated as T2V (no reference images)', () => {
    const m = UNIFIED_IMAGE_MODELS.find(x => x.id === 'seedance');
    expect(m).toBeTruthy();
    expect(m?.supportsReference).toBe(false);
    expect(m?.maxImages).toBe(0);
  });
});

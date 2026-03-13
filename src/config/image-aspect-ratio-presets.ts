export interface AspectRatioPreset {
  width: number;
  height: number;
}

export const legacyPollinationsImagePresets: Record<string, AspectRatioPreset> = {
  '1:1': { width: 1024, height: 1024 },
  '3:4': { width: 1024, height: 1536 },
  '4:3': { width: 1536, height: 1024 },
  '16:9': { width: 1536, height: 1024 },
  '9:16': { width: 1024, height: 1536 },
};

export const standardImageAspectRatioPresets: Record<string, AspectRatioPreset> = {
  '1:1': { width: 1024, height: 1024 },
  '3:4': { width: 768, height: 1024 },
  '4:3': { width: 1024, height: 768 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
};

const EXACT_STANDARD_RATIO_MODELS = new Set(['dirtberry']);

export function getAspectRatioPresetsForModel(modelId: string): Record<string, AspectRatioPreset> {
  return EXACT_STANDARD_RATIO_MODELS.has(modelId)
    ? standardImageAspectRatioPresets
    : legacyPollinationsImagePresets;
}

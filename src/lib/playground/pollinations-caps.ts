/**
 * Was die Registry nicht sagt. Werte aus der Pollinations-Spezifikation fuer
 * GET /image/{prompt}, Stand 2026-08-10.
 */

/** Sekunden pro Videomodell. Leer = Modell akzeptiert keine Dauer. */
export const DURATION_OPTIONS: Record<string, number[]> = {
  veo: [4, 6, 8],
  'seedance-pro': [2, 4, 6, 8, 10],
  'seedance-2.0': [4, 6, 8, 10, 12, 15],
  wan: [2, 5, 10, 15],
  'wan-fast': [2, 5, 10, 15],
  'wan-pro': [2, 5, 10, 15],
  'nova-reel': [6, 12, 18, 24, 30, 60, 120],
  'p-video': [1, 5, 10, 15, 20],
};

/** Seed wird laut Spezifikation nur von diesen Modellen beachtet. */
export const SEED_MODELS = new Set([
  'flux',
  'zimage',
  'seedream',
  'klein',
  'seedance',
  'nova-reel',
]);

/** quality low|medium|high|hd gibt es nur hier. */
export const QUALITY_MODELS = new Set([
  'gptimage',
  'gptimage-large',
  'gpt-image-2',
]);

/** Transparenter Hintergrund nur hier. */
export const TRANSPARENT_MODELS = new Set([
  'gptimage',
  'gptimage-large',
]);

/**
 * Seitenverhaeltnis in Pixel, rund ein Megapixel.
 * Pollinations wertet aspectRatio NUR bei Videomodellen aus; Bilder brauchen width/height.
 */
export const ASPECT_TO_PIXELS: Record<string, { width: number; height: number }> = {
  '1:1':  { width: 1024, height: 1024 },
  '4:3':  { width: 1152, height: 896 },
  '3:4':  { width: 896,  height: 1152 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768,  height: 1344 },
  '3:2':  { width: 1216, height: 832 },
  '2:3':  { width: 832,  height: 1216 },
  '21:9': { width: 1536, height: 640 },
};

/** Videomodelle kennen nur diese beiden. */
export const VIDEO_ASPECT_RATIOS = ['16:9', '9:16'] as const;

export function durationOptionsFor(modelId: string): number[] {
  return DURATION_OPTIONS[modelId] ?? [];
}

export function pixelsForAspect(ratio: string): { width: number; height: number } | undefined {
  return ASPECT_TO_PIXELS[ratio];
}

/**
 * T4 — Konsistenz zwischen den Modell-Registern (Befund B4).
 *
 * Jede in `unified-image-models.ts` gefuehrte ID braucht ein Icon in
 * `ui-constants.ts`. Die Regler-Liste `unified-model-configs.ts` gibt es seit
 * der Variante "eine Flaeche" nicht mehr — sie las nur Visualize im Chat;
 * Create beschreibt seine Felder in `lib/playground/param-schema.ts`.
 */

import { UNIFIED_IMAGE_MODELS } from '@/config/unified-image-models';
import { imageModelIcons } from '@/config/ui-constants';

describe('registry consistency (F5): die Register passen zusammen', () => {
  const unifiedIds = UNIFIED_IMAGE_MODELS.map((m) => m.id);

  test('jede geführte ID hat ein Icon in ui-constants (imageModelIcons)', () => {
    const missing = unifiedIds.filter((id) => !imageModelIcons[id]);
    expect(missing).toEqual([]);
  });

  test('keine Leiche einer entfernten ID (Phase 3: ltx-2, grok-video, veo-1080p, pollinations-wan-fast)', () => {
    const removed = ['ltx-2', 'grok-video', 'veo-1080p', 'pollinations-wan-fast'];
    for (const id of removed) {
      expect(imageModelIcons[id]).toBeUndefined();
      expect(unifiedIds).not.toContain(id);
    }
  });
});

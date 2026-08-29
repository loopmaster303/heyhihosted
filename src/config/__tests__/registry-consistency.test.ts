/**
 * T4 — Konsistenz zwischen den fünf Modell-Registern (Befund B4).
 *
 * F5: Jede in `unified-image-models.ts` geführte ID braucht einen
 * Regler-Eintrag in `unified-model-configs.ts` und ein Icon in
 * `ui-constants.ts`. Umgekehrt meldet der Test verwaiste Einträge —
 * zunächst als dokumentierte Ausnahmeliste (Geister aus Alt-Sitzungen,
 * deren Entfernung einen eigenen Auftrag braucht, siehe Phase-3-Handoff).
 */

import { UNIFIED_IMAGE_MODELS } from '@/config/unified-image-models';
import { unifiedModelConfigs } from '@/config/unified-model-configs';
import { imageModelIcons } from '@/config/ui-constants';

/**
 * Verwaiste Einträge in `unified-model-configs.ts` / `ui-constants.ts`:
 * Altbestand, nicht von Phase 3 erzeugt. Jeder Eintrag hier braucht eine
 * Begründung und ein Ticket (Fahrplan: außerhalb der Phasen 3–8).
 */
const DOCUMENTED_ORPHANS = new Set([
  // Geister-IDs, die unified-image-models.ts nicht mehr führt:
  'flux-2-dev',
  'dirtberry',
  'imagen-4',
  'klein-large',
  'seedance',
  // Legacy-Ziel des Normalizers (gespeicherte 'seedream'/'seedream-pro'-
  // Auswahlen werden nach 'seedream5' umgeschrieben).
  'seedream5',
]);

describe('registry consistency (F5): die Register passen zusammen', () => {
  const unifiedIds = UNIFIED_IMAGE_MODELS.map((m) => m.id);

  test('jede geführte ID hat einen Regler-Eintrag in unified-model-configs', () => {
    const missing = unifiedIds.filter((id) => !unifiedModelConfigs[id]);
    expect(missing).toEqual([]);
  });

  test('jede geführte ID hat ein Icon in ui-constants (imageModelIcons)', () => {
    const missing = unifiedIds.filter((id) => !imageModelIcons[id]);
    expect(missing).toEqual([]);
  });

  test('umgekehrt: keine verwaisten Regler-Einträge ohne dokumentierte Ausnahme', () => {
    const orphans = Object.keys(unifiedModelConfigs)
      .filter((id) => !unifiedIds.includes(id))
      .filter((id) => !DOCUMENTED_ORPHANS.has(id));
    expect(orphans).toEqual([]);
  });

  test('keine Leiche einer entfernten ID (Phase 3: ltx-2, grok-video, veo-1080p, pollinations-wan-fast)', () => {
    const removed = ['ltx-2', 'grok-video', 'veo-1080p', 'pollinations-wan-fast'];
    for (const id of removed) {
      expect(unifiedModelConfigs[id]).toBeUndefined();
      expect(imageModelIcons[id]).toBeUndefined();
      expect(unifiedIds).not.toContain(id);
    }
  });
});

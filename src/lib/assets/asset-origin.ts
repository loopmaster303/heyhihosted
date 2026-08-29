import type { Asset } from '@/lib/services/database';
import { PLAYGROUND_CONVERSATION_ID } from '@/lib/playground/constants';

/**
 * Herkunft eines Assets. Beide Oberflaechen lesen seit Phase 5 denselben
 * Pool; die Herkunft ist ein Tag, kein Trennkriterium mehr.
 */
export type AssetOrigin = 'chat' | 'create' | 'compose';

export const ALL_ORIGINS: readonly AssetOrigin[] = ['chat', 'create', 'compose'];

/**
 * Der EINZIGE Ort, an dem `assets.conversationId` als Herkunft gelesen wird.
 *
 * Der Sentinel '__playground__' bleibt bewusst stehen — er steckt in bereits
 * gespeicherten Nutzerdaten, und eine Schemamigration waere die einzige
 * unumkehrbare Operation an einem Speicher ohne Kopie (Entscheidung E5.1).
 *
 * ACHTUNG: 'compose' ist eine Zuordnung per Ausschluss, keine Aussage der
 * Daten. Compose speichert ohne conversationId (useComposeMusicState.ts);
 * Altbestand aus frueheren Versionen kann ebenfalls hier landen. Wer eine
 * belastbare Compose-Herkunft braucht, muss beim Speichern aktiv taggen —
 * das gehoert zu Phase 8, nicht hierher.
 */
export function assetOrigin(a: Pick<Asset, 'conversationId'>): AssetOrigin {
  if (a.conversationId === PLAYGROUND_CONVERSATION_ID) return 'create';
  if (!a.conversationId) return 'compose';
  return 'chat';
}

/** `origins` undefined heisst: kein Filter, alles im Bereich. */
export function isInScope(
  a: Pick<Asset, 'conversationId'>,
  origins?: readonly AssetOrigin[],
): boolean {
  return !origins || origins.includes(assetOrigin(a));
}

/**
 * Sentinel value used in the Dexie `assets.conversationId` column
 * to tag every playground-generated asset. Lets us list them without
 * a schema migration.
 */
export const PLAYGROUND_CONVERSATION_ID = '__playground__';

/**
 * Was ein Abbruch in der Oberflaeche wirklich bedeutet. Stand bis 2026-08-29
 * nur in einem `title` — auf dem Telefon gibt es kein Hover, der Satz war dort
 * unsichtbar.
 *
 * Phase 4 (L-K.2) braucht denselben Satz als Dauerzeile an der Sendeleiste,
 * bevor ein Pruna-Lauf startet. Deshalb hier und nicht zweimal im Markup.
 */
export const RUN_CONTINUES_NOTICE =
  'Der Lauf läuft beim Anbieter weiter und wird berechnet.';

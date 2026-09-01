import { ApiError } from '@/lib/api-error-handler';
import { AVAILABLE_POLLINATIONS_MODELS } from '@/config/chat-options';
import { getUnifiedModel } from '@/config/unified-image-models';

/**
 * L-K.1 — kein fremder Klick erzeugt Kosten auf der Betreiberrechnung.
 *
 * `resolvePollenKey` faellt fuer JEDE Anfrage auf den Server-Schluessel zurueck,
 * ohne zu fragen, was das Modell kostet. Die Pollenwall aus Phase 3 sitzt im
 * Modellwaehler — die Routen sind aber oeffentliche Endpunkte auf einer
 * oeffentlichen Domain, und eine im localStorage stehengebliebene Modellwahl
 * umgeht den Waehler ohnehin.
 *
 * Live belegt am 2026-09-01 gegen die Produktion, alles ohne Schluessel:
 *   claude-fast   -> 200, echte Antwort
 *   gemini-fast   -> 200, echte Antwort
 *   seedance-2.0  -> 524 nach 125 s (der Lauf war losgeschickt)
 *   veo           -> keine Antwort nach 240 s
 * Nur Pruna war dicht, und das nicht aus Vorsicht, sondern weil serverseitig
 * gar kein Pruna-Schluessel existiert (BYOP-only, Entscheidung 2026-08-28).
 *
 * Die Regel ist bewusst konservativ: gesperrt wird nur, was **positiv als
 * kostenpflichtig bekannt** ist. Ein Modell, ueber das wir nichts wissen,
 * laeuft weiter wie bisher — eine Sperre auf Verdacht wuerde freie Modelle
 * mitnehmen und waere schlimmer als das Leck.
 */

/** Traegt der Aufruf einen eigenen Schluessel des Nutzers? */
export function hasUserKey(request: Request): boolean {
  const raw = request.headers.get('X-Pollen-Key');
  return !!raw && raw.trim() !== '';
}

/**
 * Text. **Nur `isFree === false` sperrt.**
 *
 * Der Kommentar an `PollinationsModel.isFree` behauptet, ein fehlendes Feld
 * bedeute schluesselpflichtig. Die Daten sagen etwas anderes: Phase 3 hat
 * genau die vier live `paid_only`-Modelle mit `isFree: false` markiert, alle
 * uebrigen tragen nichts — und laufen keylos, `deepseek` ist die Vorgabe fuer
 * jeden neuen Nutzer. Nach der Kommentar-Lesart wuerde diese Sperre den
 * gesamten freien Chat abschalten. Ein Test haelt das fest.
 */
export function textModelIsPaid(modelId: string): boolean {
  const model = AVAILABLE_POLLINATIONS_MODELS.find((m) => m.id === modelId);
  if (!model) return false; // unbekannt → nicht sperren, die Route lehnt es ohnehin ab
  return model.isFree === false;
}

/**
 * Bild/Video: die gefuehrte Config zuerst, sonst die Live-Registry. `paidOnly`
 * kommt aus `paid_only` der Registry und ist die Anbieterwahrheit.
 */
export function visualModelIsPaid(modelId: string, livePaidOnly?: boolean): boolean {
  if (livePaidOnly === true) return true;
  const entry = getUnifiedModel(modelId);
  // Bei Bild/Video ist `isFree` durchgaengig gesetzt (registry-truth.test.ts
  // erzwingt isFree ⇔ !paid_only), deshalb traegt hier `!== true`.
  if (entry?.provider === 'pollinations') return entry.isFree !== true;
  return false;
}

/**
 * Wirft, wenn ein kostenpflichtiges Modell ohne eigenen Schluessel laufen
 * soll. Der Code ist derselbe, den die Oberflaeche schon uebersetzt — der
 * Nutzer bekommt „Dieses Modell braucht einen Pollen-Schluessel." samt Weg in
 * die Einstellungen, nicht einen nackten Status.
 */
export function assertKeyForPaidModel(
  request: Request,
  modelId: string,
  istKostenpflichtig: boolean,
): void {
  if (!istKostenpflichtig) return;
  if (hasUserKey(request)) return;
  throw new ApiError(
    402,
    `Model ${modelId} requires the caller's own Pollen key`,
    'POLLEN_KEY_REQUIRED',
    { modelLabel: modelId },
  );
}

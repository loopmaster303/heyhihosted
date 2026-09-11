import { resolvePollenKey } from '@/lib/resolve-pollen-key';
import {
  listAvailableImageModels,
  modelIsRunnable,
  _clearRegistryCacheForTesting,
} from '@/lib/pollinations/image-model-registry';
import { buildPaidClassicModels } from '@/lib/playground/model-source';

// Cache und Upstream liegen jetzt im geteilten Registry-Modul — die
// enhance-prompt-Route liest dieselbe Antwort fuer ihren generischen Prompt.
export const _clearCacheForTesting = _clearRegistryCacheForTesting;

/**
 * Die Auswahlliste im Playground.
 *
 * Ausgeliefert wird die **Sicht des Aufrufers**, nicht die Vereinigung mit dem
 * oeffentlichen Katalog. Begruendung, live belegt am 2026-09-10: die Vereinigung
 * zeigte 82 Modelle, von denen der Betreiber-Schluessel genau 5 bedienen darf.
 * Der Rest scheiterte erst bei der Generierung mit 403
 * ("Model 'flux' is not allowed for this API key") — und der Vorgabewert des
 * Chats, `flux`, war einer dieser toten Eintraege.
 *
 * Die Auswahlliste beantwortet zwei Fragen: was kann der Aufrufer wirklich
 * generieren — und was koennte er mit eigenem Guthaben? Die erste beantwortet
 * der Anbieter (siehe `gen.pollinations.ai/image/models`), die zweite die
 * kuratierte Bezahl-Liste. Wer einen eigenen Pollen-Schluessel mit bezahltem
 * Guthaben schickt, sieht dessen Modelle automatisch mit; sie stehen dann in
 * der Schluessel-Sicht und sind `runnable`, nicht gesperrt.
 */
export async function GET(request: Request) {
  const { models, runnable, failure } = await listAvailableImageModels(resolvePollenKey(request));
  if (models.length === 0) {
    // Keine Sicht hat geantwortet: der Aufrufer faellt auf den lokalen,
    // kostenlosen Bestand zurueck. Der Grund steht im Log, nicht in der Liste.
    console.warn('[image-models] Registry nicht erreichbar:', failure);
    return new Response(
      JSON.stringify({ error: 'Pollinations model registry unavailable', code: 'PROVIDER_UNAVAILABLE', reason: failure }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    );
  }

  // Jeder Eintrag traegt seine Freigabe selbst: `runnable: true` heisst, der
  // effektive Schluessel bedient ihn (Name oder Alias), `false` heisst, nur der
  // Schluessel des Nutzers koennte das. Die Auswahlliste muss die Wahrheit damit
  // nicht nachbauen — sie liest sie.
  const sicht = models.map((model) => ({ ...model, runnable: modelIsRunnable(model, runnable) }));

  // Die kuratierten Bezahl-Klassiker haengen hinten dran, gesperrt. Sie stehen
  // in keiner Registry-Sicht des Betreiber-Schluessels (live belegt 2026-09-10),
  // und ohne sie saehe ein Nutzer mit eigenem Guthaben nicht, was er kaufen
  // koennte. Das Array bleibt ein Array — der Client liest es so (und vertraegt
  // aus alten Puffern weiterhin `{ data: [...] }`).
  return new Response(JSON.stringify([...sicht, ...buildPaidClassicModels(sicht)]), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

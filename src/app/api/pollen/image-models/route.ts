import { resolvePollenKey } from '@/lib/resolve-pollen-key';
import { listLiveImageModels, _clearRegistryCacheForTesting } from '@/lib/pollinations/image-model-registry';

// Cache und Upstream liegen jetzt im geteilten Registry-Modul — die
// enhance-prompt-Route liest dieselbe Antwort fuer ihren generischen Prompt.
export const _clearCacheForTesting = _clearRegistryCacheForTesting;

/**
 * Die Auswahlliste im Playground.
 *
 * Hier wird bewusst die **Vereinigung** beider Sichten ausgeliefert: die
 * Sicht mit Schluessel ist berechtigungsgefiltert und zeigte einem Schluessel
 * ohne Guthaben 2 von 82 Modellen (live belegt 2026-09-10). Eine Auswahlliste,
 * die nur den Freigabestand eines Schluessels kennt, versteckt 23 kostenlose
 * Modelle vor jedem Nutzer ohne eigenen Schluessel. Bezahltes bleibt ueber
 * `paid_only` markiert — die Oberflaeche kennzeichnet es als "Key" und sagt
 * vorher, dass ein Schluessel noetig ist.
 */
export async function GET(request: Request) {
  const { models, failure } = await listLiveImageModels(resolvePollenKey(request));
  if (models.length === 0) {
    // Keine Sicht hat geantwortet: der Aufrufer faellt auf den lokalen,
    // kostenlosen Bestand zurueck. Der Grund steht im Log, nicht in der Liste.
    console.warn('[image-models] Registry nicht erreichbar:', failure);
    return new Response(
      JSON.stringify({ error: 'Pollinations model registry unavailable', code: 'PROVIDER_UNAVAILABLE', reason: failure }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    );
  }
  return new Response(JSON.stringify(models), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

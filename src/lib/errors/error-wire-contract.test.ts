/**
 * @jest-environment node
 *
 * `NextResponse.json` setzt `Response.json` voraus; die jsdom-Umgebung des
 * Repos bringt die statische Methode nicht mit, Node selbst schon. Diese
 * Suite prueft die Naht zwischen Route und Client, also braucht sie die echte
 * Response der Laufzeit.
 */
import { ApiError, handleApiError } from '@/lib/api-error-handler';
import { describeError } from './describe-error';
import { readErrorResponse } from './read-error-response';

/**
 * Die Kette, die der Nutzer am Ende liest, hat drei Nahtstellen: die Route
 * wirft einen ApiError, `handleApiError` schreibt Code und Details ins JSON,
 * der Client liest sie zurueck und uebersetzt sie in einen Satz. Jede Naht
 * fuer sich ist getestet — wenn eine davon `details` verliert, faellt es aber
 * nur hier auf, naemlich als Satz ohne Modellnamen.
 */
async function wieDerClient(error: ApiError) {
  const res = handleApiError(error) as unknown as Response;
  const parsed = await readErrorResponse(res);
  return describeError(parsed.code, {
    modelLabel: parsed.modelLabel,
    field: parsed.field,
    retryAfterSeconds: parsed.retryAfterSeconds,
  })!;
}

test('ein abgelehnter Prompt kommt mit Code und Modellnamen beim Nutzer an', async () => {
  // Genau die Form, die der Media-Ingest wirft, wenn der Sicherheitsfilter des
  // Anbieters den Prompt ablehnt (live belegt 2026-09-10).
  const beschreibung = await wieDerClient(new ApiError(
    400,
    'Media source gen.pollinations.ai rejected the result: status 400',
    'CONTENT_REJECTED',
    { modelLabel: 'GPT Image 2.5 Flare' },
  ));

  expect(beschreibung.satz).toContain('GPT Image 2.5 Flare');
  expect(beschreibung.satz).toContain('Sicherheitsfilter');
  expect(beschreibung.satz).not.toContain('antwortet gerade nicht');
  expect(beschreibung.aktion).toBe('pick-model');
});

test('ohne Details bleibt der Satz vollstaendig statt "undefined"', async () => {
  const beschreibung = await wieDerClient(new ApiError(
    400,
    'Media source rejected the result: status 400',
    'CONTENT_REJECTED',
  ));

  expect(beschreibung.satz).toContain('Der Anbieter hat den Prompt abgelehnt');
  expect(beschreibung.satz).not.toContain('undefined');
});

// Die Route antwortet auf einen Registry-Ausfall mit 503 und ohne Details.
// Ohne diesen Fall haette der 503-Satz beim Modellnamen "undefined" gesagt.
test('503 ohne Details bleibt beim generischen Satz', async () => {
  const beschreibung = await wieDerClient(new ApiError(
    503,
    'Pollinations model registry unavailable',
    'PROVIDER_UNAVAILABLE',
  ));

  expect(beschreibung.satz).not.toContain('undefined');
  expect(beschreibung.aktion).toBe('retry');
});

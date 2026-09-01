/**
 * Status -> Fehlercode. Ohne Code faellt der Client auf "Status plus Rohtext"
 * zurueck; bei 403 ist dieser Rohtext ein englischer Satz ueber "this API key"
 * und meint den Schluessel des Betreibers, nicht den des Nutzers. Genau diese
 * Zuordnung ist deshalb hier festgenagelt.
 */
import { generatePollinationsImage } from './pollinations-image-v1';

function antwortMit(status: number, body: unknown) {
  global.fetch = jest.fn(async () => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })) as unknown as typeof fetch;
}

const eingabe = { model: 'kontext', prompt: 'x', width: 512, height: 512 };

describe('pollinations-image-v1: Status wird zu einem Code', () => {
  it('403 -> POLLEN_MODEL_NOT_ALLOWED, mit dem Modell in den details', async () => {
    antwortMit(403, { error: "Model 'kontext' is not allowed for this API key" });
    await expect(generatePollinationsImage(eingabe)).rejects.toMatchObject({
      statusCode: 403,
      code: 'POLLEN_MODEL_NOT_ALLOWED',
      details: { modelLabel: 'kontext' },
    });
  });

  it('500 und 503 -> PROVIDER_UNAVAILABLE', async () => {
    for (const status of [500, 503]) {
      antwortMit(status, { error: 'upstream exploded' });
      await expect(generatePollinationsImage(eingabe)).rejects.toMatchObject({
        code: 'PROVIDER_UNAVAILABLE',
      });
    }
  });

  it('401 und 402 bleiben, was sie waren', async () => {
    antwortMit(401, { error: 'no key' });
    await expect(generatePollinationsImage(eingabe)).rejects.toMatchObject({
      code: 'POLLEN_KEY_REQUIRED',
    });
    antwortMit(402, { error: 'broke' });
    await expect(generatePollinationsImage(eingabe)).rejects.toMatchObject({
      code: 'POLLEN_INSUFFICIENT',
    });
  });

  it('400 bleibt ohne Code — der Fallback zeigt Status und Rohtext', async () => {
    antwortMit(400, { error: 'something odd' });
    await expect(generatePollinationsImage(eingabe)).rejects.toMatchObject({
      statusCode: 400,
      code: undefined,
    });
  });
});

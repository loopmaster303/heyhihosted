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

/** Erste Antwort 402 "budget too low", danach eine 200 — fuer den Ausweichpfad. */
function budgetFehlerDannErfolg() {
  const erst = new Response(
    JSON.stringify({ error: { message: 'API key budget too low. This request costs ~0.0020 pollen, but this key has 0.0000.' } }),
    { status: 402, headers: { 'Content-Type': 'application/json' } },
  );
  const dann = new Response(
    JSON.stringify({ data: [{ url: 'https://example.com/anonym.png' }] }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
  global.fetch = jest.fn(async () => erst.clone()) as unknown as typeof fetch;
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce(dann)
    .mockResolvedValueOnce(dann);
  return erst;
}

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
    await expect(generatePollinationsImage({ ...eingabe, hasUserKey: true })).rejects.toMatchObject({
      code: 'POLLEN_INSUFFICIENT',
    });
  });

  // Live belegt am 2026-09-10: der Betreiber-Schluessel hat 0.0000 Budget.
  // Ohne die zweite Angabe las der Nutzer "Dein Pollen-Guthaben reicht nicht"
  // fuer ein Konto, das nicht seines ist.
  it('402 ohne eigenen Schluessel -> POLLEN_SERVER_BUDGET, nicht das Guthaben des Nutzers', async () => {
    const body = { error: { message: 'API key budget too low. This request costs ~0.0020 pollen, but this key has 0.0000.' } };
    global.fetch = jest.fn(async () => new Response(JSON.stringify(body), {
      status: 402,
      headers: { 'Content-Type': 'application/json' },
    })) as unknown as typeof fetch;
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(generatePollinationsImage({ ...eingabe, apiKey: 'server-key', hasUserKey: false }))
      .rejects.toMatchObject({ statusCode: 402, code: 'POLLEN_SERVER_BUDGET' });
  });

  // Der eigentliche Fix vom 2026-09-10: der leere Server-Schluessel liess JEDES
  // Modell scheitern, auch die freien. Ohne Schluessel antwortet der Anbieter
  // fuer freie Modelle mit 200.
  it('fragt bei leerem Server-Schluessel genau einmal ohne Schluessel nach', async () => {
    const erst = new Response(
      JSON.stringify({ error: { message: 'API key budget too low. This request costs ~0.0020 pollen, but this key has 0.0000.' } }),
      { status: 402, headers: { 'Content-Type': 'application/json' } },
    );
    const dann = new Response(
      JSON.stringify({ data: [{ url: 'https://example.com/anonym.png' }] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(erst)
      .mockResolvedValueOnce(dann);
    global.fetch = fetchMock as unknown as typeof fetch;
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const url = await generatePollinationsImage({ ...eingabe, apiKey: 'server-key', hasUserKey: false });

    expect(url).toBe('https://example.com/anonym.png');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].headers).toHaveProperty('Authorization', 'Bearer server-key');
    expect(fetchMock.mock.calls[1][1].headers).not.toHaveProperty('Authorization');
  });

  // Ein eigener Schluessel des Nutzers wird nicht weggeworfen: sein Guthaben
  // ist seine Entscheidung, und die Antwort soll seinen Schluessel benennen.
  it('wiederholt nicht anonym, wenn der Schluessel vom Nutzer kam', async () => {
    const fetchMock = jest.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: { message: 'API key budget too low.' } }),
      { status: 402, headers: { 'Content-Type': 'application/json' } },
    ));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(generatePollinationsImage({ ...eingabe, apiKey: 'sk_user', hasUserKey: true }))
      .rejects.toMatchObject({ code: 'POLLEN_INSUFFICIENT' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // 402 kann auch "dieses Modell gibt es nur fuer zahlende Konten" heissen. Dann
  // ist der anonyme Weg keine Hilfe und der Nutzer braucht seinen Schluessel.
  it('wiederholt kein Modell, das wirklich einen Schluessel verlangt', async () => {
    const fetchMock = jest.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: { message: 'This model requires a valid API key.' } }),
      { status: 402, headers: { 'Content-Type': 'application/json' } },
    ));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(generatePollinationsImage({ ...eingabe, apiKey: 'server-key', hasUserKey: false }))
      .rejects.toMatchObject({ code: 'POLLEN_KEY_REQUIRED' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('402 ohne jeden Schluessel -> POLLEN_KEY_REQUIRED (anonym, der eigene Schluessel ist der Ausweg)', async () => {
    antwortMit(402, { error: 'free tier exhausted' });
    await expect(generatePollinationsImage(eingabe)).rejects.toMatchObject({
      code: 'POLLEN_KEY_REQUIRED',
    });
  });

  it('403 mit eigenem Schluessel -> POLLEN_MODEL_NOT_ALLOWED_OWN_KEY', async () => {
    antwortMit(403, { error: "Model 'kontext' is not allowed for this API key" });
    await expect(generatePollinationsImage({ ...eingabe, apiKey: 'sk_test', hasUserKey: true }))
      .rejects.toMatchObject({
        statusCode: 403,
        code: 'POLLEN_MODEL_NOT_ALLOWED_OWN_KEY',
        details: { modelLabel: 'kontext' },
      });
  });

  it('400 bleibt ohne Code — der Fallback zeigt Status und Rohtext', async () => {
    antwortMit(400, { error: 'something odd' });
    await expect(generatePollinationsImage(eingabe)).rejects.toMatchObject({
      statusCode: 400,
      code: undefined,
    });
  });

  // Live belegt am 2026-09-10: gpt-image antwortet 400 mit dem Sicherheits-
  // filter. Ohne Code las der Nutzer den englischen Rohtext; mit Code sagt der
  // Satz, dass derselbe Prompt wieder scheitern wird.
  it('400 mit Sicherheitsfilter -> CONTENT_REJECTED', async () => {
    antwortMit(400, {
      error: { message: 'Your request was rejected by the safety system. If you believe this is an error, contact us at help.openai.com' },
    });
    await expect(generatePollinationsImage(eingabe)).rejects.toMatchObject({
      statusCode: 400,
      code: 'CONTENT_REJECTED',
      details: { modelLabel: 'kontext' },
    });
  });
});

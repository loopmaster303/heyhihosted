import { requestGeneration } from './request-generation';
import { readStoredRuns } from './run-store';

const HEADERS = { 'Content-Type': 'application/json', 'X-Pruna-Key': 'pru_test' };
const CONTEXT = {
  runId: 'run-7',
  prompt: 'ein roter fuchs',
  params: { aspect_ratio: '16:9' },
  isVideo: true,
  aspectRatio: '16:9',
};

describe('requestGeneration', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('returns a finished response untouched and never polls', async () => {
    const done = new Response(JSON.stringify({ imageUrl: 'https://media/x.png' }), { status: 200 });
    global.fetch = jest.fn().mockResolvedValue(done);

    await expect(requestGeneration({ model: 'zimage' }, { headers: HEADERS })).resolves.toBe(done);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('polls the status route until the prediction is delivered', async () => {
    jest.useFakeTimers();
    const done = new Response(JSON.stringify({ videoUrl: 'https://media/x.mp4' }), { status: 200 });
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ pending: true, predictionId: 'pred-1', model: 'vace' }),
        { status: 202 },
      ))
      .mockResolvedValueOnce(new Response('{}', { status: 202 }))
      .mockResolvedValueOnce(done);
    global.fetch = fetchMock;

    const pending = requestGeneration({ model: 'vace' }, { headers: HEADERS });
    await jest.advanceTimersByTimeAsync(10_000);

    await expect(pending).resolves.toBe(done);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/pruna/status?id=pred-1&model=vace');
  });

  // Ein GET traegt keinen Content-Type, die Schluessel muessen aber mit,
  // sonst antwortet die Status-Route mit 503.
  it('keeps the key headers but drops Content-Type when polling', async () => {
    jest.useFakeTimers();
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(new Response(
        JSON.stringify({ pending: true, predictionId: 'pred-1', model: 'vace' }),
        { status: 202 },
      ))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));
    global.fetch = fetchMock;

    const pending = requestGeneration({ model: 'vace' }, { headers: HEADERS });
    await jest.advanceTimersByTimeAsync(5_000);
    await pending;

    expect(fetchMock.mock.calls[1][1].headers).toEqual({ 'X-Pruna-Key': 'pru_test' });
  });

  it('stops waiting when the run is aborted', async () => {
    jest.useFakeTimers();
    const controller = new AbortController();
    global.fetch = jest.fn().mockResolvedValueOnce(new Response(
      JSON.stringify({ pending: true, predictionId: 'pred-1', model: 'vace' }),
      { status: 202 },
    ));

    const pending = requestGeneration({ model: 'vace' }, { headers: HEADERS, signal: controller.signal });
    const settled = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await settled;
  });

  it('fails loudly when a pending dispatch carries no prediction id', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({ pending: true }), { status: 202 }));

    await expect(requestGeneration({ model: 'vace' }, { headers: HEADERS }))
      .rejects.toThrow(/missing predictionId/i);
  });

  describe('Laufstabilitaet (run-store)', () => {
    beforeEach(() => localStorage.clear());

    it('schreibt bei 202 einen Eintrag und loescht ihn beim Ergebnis', async () => {
      jest.useFakeTimers();
      let seenDuringPoll: ReturnType<typeof readStoredRuns> = [];
      const done = new Response('{}', { status: 200 });
      global.fetch = jest.fn()
        .mockResolvedValueOnce(new Response(
          JSON.stringify({ pending: true, predictionId: 'pred-9', model: 'vace' }),
          { status: 202 },
        ))
        .mockImplementationOnce(async () => {
          seenDuringPoll = readStoredRuns();
          return done;
        });

      const pending = requestGeneration(
        { model: 'vace', prompt: 'eingefroren' },
        { headers: HEADERS, context: CONTEXT },
      );
      await jest.advanceTimersByTimeAsync(4_000);
      await pending;

      // Zwischen 202 und Ergebnis lag der Eintrag im Store — mit allem,
      // was die Wiederaufnahme und der Retry (R2 = a) brauchen.
      expect(seenDuringPoll).toHaveLength(1);
      expect(seenDuringPoll[0]).toMatchObject({
        runId: 'run-7',
        predictionId: 'pred-9',
        model: 'vace',
        prompt: 'ein roter fuchs',
        isVideo: true,
        aspectRatio: '16:9',
        body: { model: 'vace', prompt: 'eingefroren' },
      });
      // Danach ist er weg — das Ergebnis loescht ihn.
      expect(readStoredRuns()).toEqual([]);
    });

    it('loescht den Eintrag auch beim Abbruch', async () => {
      jest.useFakeTimers();
      const controller = new AbortController();
      global.fetch = jest.fn().mockResolvedValueOnce(new Response(
        JSON.stringify({ pending: true, predictionId: 'pred-9', model: 'vace' }),
        { status: 202 },
      ));

      const pending = requestGeneration({ model: 'vace' }, { headers: HEADERS, context: CONTEXT, signal: controller.signal });
      const settled = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
      await jest.advanceTimersByTimeAsync(1);
      expect(readStoredRuns().map((r) => r.runId)).toEqual(['run-7']);
      controller.abort();
      await settled;

      expect(readStoredRuns()).toEqual([]);
    });

    it('schreibt ohne context nichts in den Store (Chat-Pfad unberuehrt)', async () => {
      jest.useFakeTimers();
      const done = new Response('{}', { status: 200 });
      global.fetch = jest.fn()
        .mockResolvedValueOnce(new Response(
          JSON.stringify({ pending: true, predictionId: 'pred-9', model: 'vace' }),
          { status: 202 },
        ))
        .mockResolvedValueOnce(done);

      const pending = requestGeneration({ model: 'vace' }, { headers: HEADERS });
      await jest.advanceTimersByTimeAsync(4_000);
      await pending;

      expect(readStoredRuns()).toEqual([]);
    });
  });
});

import { requestGeneration } from './request-generation';

const HEADERS = { 'Content-Type': 'application/json', 'X-Pruna-Key': 'pru_test' };

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
});

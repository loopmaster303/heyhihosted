import { POST } from './route';
import { UNIFIED_IMAGE_MODELS } from '@/config/unified-image-models';
import { _resetRateLimitForTesting } from '@/lib/rate-limit';
import { _clearRegistryCacheForTesting } from '@/lib/pollinations-registry';
import { buildPrunaEntries } from '@/lib/playground/model-source';
import { buildGenerateBody } from '@/lib/playground/generate-request';
import { defaultsFor, schemaFor } from '@/lib/playground/param-schema';

const enabledPrunaImageModelIds = UNIFIED_IMAGE_MODELS
  .filter((model) => model.provider === 'pruna' && model.kind === 'image' && model.enabled !== false)
  .map((model) => model.id);

const imageUrlMock = jest.fn();
const videoUrlMock = jest.fn();
const generatePollinationsImageMock = jest.fn();
const fetchAndStoreRemoteMediaMock = jest.fn();
const resolvePollenKeyMock = jest.fn();

jest.mock('@/lib/pollinations-sdk', () => ({
  imageUrl: (...args: unknown[]) => imageUrlMock(...args),
  videoUrl: (...args: unknown[]) => videoUrlMock(...args),
}));

jest.mock('@/lib/media/server-media-ingest', () => ({
  fetchAndStoreRemoteMedia: (...args: unknown[]) => fetchAndStoreRemoteMediaMock(...args),
}));

jest.mock('@/lib/pollinations-image-v1', () => ({
  generatePollinationsImage: (...args: unknown[]) => generatePollinationsImageMock(...args),
}));

jest.mock('@/lib/resolve-pollen-key', () => ({
  resolvePollenKey: (...args: unknown[]) => resolvePollenKeyMock(...args),
}));

jest.mock('@/lib/resolve-pruna-key', () => ({
  resolvePrunaKey: (request: Request) => request.headers.get('X-Pruna-Key') || process.env.PRUNA_API_KEY,
}));

const generateViaPrunaMock = jest.fn();
const downloadPrunaResultMock = jest.fn();

jest.mock('@/lib/pruna/client', () => ({


  generateViaPruna: (...args: unknown[]) => generateViaPrunaMock(...args),
  downloadPrunaResult: (...args: unknown[]) => downloadPrunaResultMock(...args),
  isPendingPrediction: (result: unknown) =>
    !!result && typeof result === 'object' && 'predictionId' in result,
}));

/**
 * Seit dem L-K.1-Waechter (2026-09-01) laufen kostenpflichtige Modelle nur
 * auf dem Schluessel des Aufrufers. Diese Tests pruefen Routing und Payload,
 * nicht die Schluesselpflicht — sie treten deshalb als Nutzer mit eigenem
 * Schluessel auf. Die Sperre selbst deckt pollen-cost-guard.test.ts ab.
 */
const TEST_POLLEN_KEY = 'sk_test_user_key';

/**
 * Zwei Tests unten prueften frueher gegen die echte Registry, ob ein Modell
 * unbekannt ist — ihr Urteil hing damit am Netz: antwortete der Anbieter nicht,
 * galt das Modell als unbekannt und der Test wurde gruen, obwohl die Route in
 * Wahrheit durchreicht. Der Stub antwortet wie der echte Katalog (Liste ohne das
 * gepruefte Modell), damit der Test die Route prueft und nicht den Anbieter.
 */
function registryResponse(models: unknown[]) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    text: async () => JSON.stringify(models),
  };
}

function stubModelRegistry(models: unknown[] = [{ name: 'flux' }]) {
  global.fetch = jest.fn()
    .mockResolvedValue(registryResponse(models)) as unknown as typeof fetch;
}

describe('/api/generate route', () => {
  const responseJson = jest.fn((body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init));
  const originalFetch = global.fetch;
  const originalPrunaApiKey = process.env.PRUNA_API_KEY;
  const originalResponseJson = Response.json;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env.PRUNA_API_KEY = 'test-pruna-key';
    _resetRateLimitForTesting();
    _clearRegistryCacheForTesting();
    global.fetch = originalFetch;
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    imageUrlMock.mockReset();
    videoUrlMock.mockReset();
    generatePollinationsImageMock.mockReset();
    fetchAndStoreRemoteMediaMock.mockReset();
    generateViaPrunaMock.mockReset();
    downloadPrunaResultMock.mockReset();
    resolvePollenKeyMock.mockReset().mockReturnValue('test-pollen-key');
    fetchAndStoreRemoteMediaMock.mockResolvedValue({
      key: 'stored-key',
      url: 'https://media.pollinations.ai/stored-key',
      contentType: 'image/png',
    });
    responseJson.mockClear();
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: responseJson,
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    global.fetch = originalFetch;
    if (originalPrunaApiKey === undefined) {
      delete (process.env as any).PRUNA_API_KEY;
    } else {
      process.env.PRUNA_API_KEY = originalPrunaApiKey;
    }
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: originalResponseJson,
    });
  });

  it('routes the canonical grok-imagine id directly to the Pollinations grok-imagine model', async () => {
    generatePollinationsImageMock.mockResolvedValueOnce('https://example.com/generated.png');

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'cyberpunk skyline',
        model: 'grok-imagine',
        width: 1024,
        height: 1024,
      }),
    });

    await POST(request);

    expect(generatePollinationsImageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'cyberpunk skyline',
        model: 'grok-imagine',
        width: 1024,
        height: 1024,
      }),
    );
    expect(imageUrlMock).not.toHaveBeenCalled();
  });

  it('keeps the legacy grok-image id routable via the backwards-compat alias to grok-imagine', async () => {
    generatePollinationsImageMock.mockResolvedValueOnce('https://example.com/generated.png');

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'cyberpunk skyline',
        model: 'grok-image',
        width: 1024,
        height: 1024,
      }),
    });

    await POST(request);

    expect(generatePollinationsImageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'cyberpunk skyline',
        model: 'grok-imagine',
        width: 1024,
        height: 1024,
      }),
    );
    expect(imageUrlMock).not.toHaveBeenCalled();
  });

  it('maps the internal gpt-image id to the Pollinations gptimage v1 model id', async () => {
    generatePollinationsImageMock.mockResolvedValueOnce('https://example.com/generated.png');

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'studio portrait',
        model: 'gpt-image',
        width: 1024,
        height: 1024,
      }),
    });

    await POST(request);

    expect(generatePollinationsImageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'studio portrait',
        model: 'gptimage',
        width: 1024,
        height: 1024,
      }),
    );
    expect(videoUrlMock).not.toHaveBeenCalled();
  });

  it('translates aspectRatio into pixels on the reference-free image path', async () => {
    generatePollinationsImageMock.mockResolvedValueOnce('https://example.com/wide.png');

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'wide landscape',
        model: 'flux',
        aspectRatio: '16:9',
      }),
    });

    await POST(request);

    expect(generatePollinationsImageMock).toHaveBeenCalledWith(
      expect.objectContaining({ width: 1344, height: 768 }),
    );
  });

  it('keeps the requested pixels when the aspect ratio is not a known preset', async () => {
    generatePollinationsImageMock.mockResolvedValueOnce('https://example.com/odd.png');

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'odd ratio',
        model: 'flux',
        aspectRatio: '7:5',
        width: 800,
        height: 600,
      }),
    });

    await POST(request);

    expect(generatePollinationsImageMock).toHaveBeenCalledWith(
      expect.objectContaining({ width: 800, height: 600 }),
    );
  });

  it('rejects unknown image models with a 400 response', async () => {
    stubModelRegistry();

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'cyberpunk skyline',
        model: 'definitely-not-real',
        width: 1024,
        height: 1024,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/unknown or unavailable pollinations image\/video model/i);
    expect(imageUrlMock).not.toHaveBeenCalled();
    expect(generatePollinationsImageMock).not.toHaveBeenCalled();
    expect(videoUrlMock).not.toHaveBeenCalled();
  });

  it('maps the grok-imagine-video alias to the canonical grok-video-pro route', async () => {
    videoUrlMock.mockResolvedValueOnce('https://example.com/generated.mp4');

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'animate a neon skyline',
        model: 'grok-imagine-video',
        duration: 5,
      }),
    });

    await POST(request);

    expect(videoUrlMock).toHaveBeenCalledWith(
      'animate a neon skyline',
      expect.objectContaining({ model: 'grok-video-pro', duration: 5 }),
    );
    expect(imageUrlMock).not.toHaveBeenCalled();
    expect(generatePollinationsImageMock).not.toHaveBeenCalled();
  });

  it.each([
    ['grok-imagine-pro', 'image'],
  ] as const)('keeps approved visual model ids routable for %s (%s)', async (modelId, kind) => {
    generatePollinationsImageMock.mockResolvedValueOnce(`https://example.com/${modelId}.png`);

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: `model ${modelId}`,
        model: modelId,
        width: 1024,
        height: 1024,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(generatePollinationsImageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: `model ${modelId}`,
        model: modelId,
        width: 1024,
        height: 1024,
      }),
    );
    expect(videoUrlMock).not.toHaveBeenCalled();
  });

  it('forwards the requested quality for models that support it', async () => {
    generatePollinationsImageMock.mockResolvedValueOnce('https://example.com/quality.png');

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({ prompt: 'studio portrait', model: 'gpt-image', quality: 'low' }),
    });

    await POST(request);

    expect(generatePollinationsImageMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gptimage', quality: 'low' }),
    );
  });

  it('drops quality for models that do not support it', async () => {
    generatePollinationsImageMock.mockResolvedValueOnce('https://example.com/no-quality.png');

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({ prompt: 'landscape', model: 'flux', quality: 'low' }),
    });

    await POST(request);

    expect(generatePollinationsImageMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ quality: expect.anything() }),
    );
  });

  it('forwards the requested resolution to video generation', async () => {
    videoUrlMock.mockResolvedValueOnce('https://gen.pollinations.ai/image/clip?model=grok-video-pro');

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'animate a neon skyline',
        model: 'grok-imagine-video',
        resolution: '1080p',
      }),
    });

    await POST(request);

    expect(videoUrlMock).toHaveBeenCalledWith(
      'animate a neon skyline',
      expect.objectContaining({ resolution: '1080p' }),
    );
  });

  it('keeps the app response shape stable for v1 image generation', async () => {
    generatePollinationsImageMock.mockResolvedValueOnce('https://example.com/v1-image.png');

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'portrait photo',
        model: 'flux',
        width: 1024,
        height: 1024,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { imageUrl: string; videoUrl?: string };

    expect(response.status).toBe(200);
    expect(body).toEqual({
      // Die rohe Pollinations-URL verlangt beim Abruf erneut einen Key, den der
      // Browser nicht hat. Die Route legt das Bild deshalb serverseitig ab und
      // gibt die dauerhafte Adresse zurück.
      imageUrl: 'https://media.pollinations.ai/stored-key',
      videoUrl: undefined,
    });
  });

  it('routes image generation with reference images through the GET URL SDK (v1 POST ignores image param)', async () => {
    imageUrlMock.mockResolvedValueOnce('https://gen.pollinations.ai/image/edit%20this?model=wan-image&image=ref1,ref2');

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'edit this',
        model: 'wan-image',
        width: 1024,
        height: 1024,
        image: ['https://media.pollinations.ai/ref1', 'https://media.pollinations.ai/ref2'],
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { imageUrl: string };

    expect(response.status).toBe(200);
    expect(imageUrlMock).toHaveBeenCalledWith(
      'edit this',
      expect.objectContaining({
        model: 'wan-image',
        referenceImage: ['https://media.pollinations.ai/ref1', 'https://media.pollinations.ai/ref2'],
      }),
    );
    expect(generatePollinationsImageMock).not.toHaveBeenCalled();
    expect(fetchAndStoreRemoteMediaMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceUrl: expect.stringContaining('image=ref1,ref2'),
        kind: 'image',
      }),
    );
    expect(body.imageUrl).toBe('https://media.pollinations.ai/stored-key');
  });

  it('routes image generation without reference images through the v1 POST endpoint', async () => {
    generatePollinationsImageMock.mockResolvedValueOnce('https://example.com/no-ref.png');

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'standalone',
        model: 'flux',
        width: 1024,
        height: 1024,
      }),
    });

    await POST(request);

    expect(generatePollinationsImageMock).toHaveBeenCalled();
    expect(imageUrlMock).not.toHaveBeenCalled();
  });

  it('rejects multiple references for Grok Imagine Pro image', async () => {
    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'edit', model: 'grok-imagine-pro',
        image: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
      }),
    }));
    expect(response.status).toBe(400);
    expect(responseJson.mock.calls.at(-1)?.[0]).toEqual(expect.objectContaining({
      error: expect.stringMatching(/maximum 1 reference image/i),
    }));
  });

  it('rejects an end frame for start-only Grok Pro video', async () => {
    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'animate', model: 'grok-video-pro',
        image: ['https://example.com/start.jpg', 'https://example.com/end.jpg'],
      }),
    }));
    expect(response.status).toBe(400);
    expect(responseJson.mock.calls.at(-1)?.[0]).toEqual(expect.objectContaining({
      error: expect.stringMatching(/does not support an end frame/i),
    }));
  });

  it('preserves start/end order for end-frame video models', async () => {
    videoUrlMock.mockResolvedValueOnce('https://example.com/veo.mp4');
    await POST(new Request('http://localhost/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'transition', model: 'veo',
        image: ['https://example.com/start.jpg', 'https://example.com/end.jpg'],
      }),
    }));
    expect(videoUrlMock).toHaveBeenCalledWith('transition', expect.objectContaining({
      referenceImage: ['https://example.com/start.jpg', 'https://example.com/end.jpg'],
    }));
  });

  it('rejects removed stale visual models', async () => {
    stubModelRegistry();

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'legacy drift model',
        model: 'imagen-4',
        width: 1024,
        height: 1024,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/unknown or unavailable pollinations image\/video model/i);
  });

  // Der Befund vom 2026-09-10: die Registry-Sicht *mit* Schluessel ist
  // berechtigungsgefiltert (Betreiber-Schluessel ohne Guthaben sah 2 von 82
  // Modellen). Ein Modell, das nur der oeffentliche Katalog kennt, wurde deshalb
  // als "unbekannt" abgewiesen — obwohl es eine Sekunde vorher Bilder lieferte.
  it('nimmt ein Modell an, das nur der Katalog ohne Schluessel kennt', async () => {
    const KEYED = [{ name: 'flux' }];
    const KATALOG = [{ name: 'flux' }, { name: 'qwen/qwen-image-3', paid_only: true }];
    global.fetch = jest.fn()
      .mockResolvedValueOnce(registryResponse(KEYED))
      .mockResolvedValueOnce(registryResponse(KATALOG)) as unknown as typeof fetch;
    generatePollinationsImageMock.mockResolvedValueOnce('https://example.com/qwen.png');

    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({ prompt: 'roter apfel', model: 'qwen/qwen-image-3', width: 1024, height: 1024 }),
    }));
    const body = responseJson.mock.calls.at(-1)?.[0] as { imageUrl?: string };

    expect(response.status).toBe(200);
    expect(generatePollinationsImageMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'qwen/qwen-image-3' }),
    );
    expect(body.imageUrl).toBe('https://media.pollinations.ai/stored-key');
  });

  // Ein Ausfall ist keine Aussage ueber das Modell. Vorher wurde daraus "das
  // Modell gibt es nicht (mehr)" — ein Satz, der den Nutzer nach einem Fehler
  // suchen laesst, den er nicht hat.
  it('reicht bei einem Registry-Ausfall durch, statt "unbekannt" zu behaupten', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('socket hang up')) as unknown as typeof fetch;
    generatePollinationsImageMock.mockResolvedValueOnce('https://example.com/geduldet.png');

    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({ prompt: 'roter apfel', model: 'irgendein/neues-modell', width: 1024, height: 1024 }),
    }));

    expect(response.status).toBe(200);
    expect(generatePollinationsImageMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'irgendein/neues-modell' }),
    );
  });

  // Ohne Registry ist unbekannt, ob das Modell Geld kostet. Dann laeuft es nur
  // auf dem Schluessel des Aufrufers — der Betreiber-Schluessel bleibt aus dem
  // Spiel, sonst zahlt er fuer ein Modell, das er nie ausgewaehlt hat.
  it('schickt den Betreiber-Schluessel bei Registry-Ausfall nicht mit', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('socket hang up')) as unknown as typeof fetch;
    resolvePollenKeyMock.mockReturnValue('server-key-ohne-guthaben');
    generatePollinationsImageMock.mockResolvedValueOnce('https://example.com/ohne-key.png');

    await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'roter apfel', model: 'irgendein/neues-modell', width: 1024, height: 1024 }),
    }));

    expect(generatePollinationsImageMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'irgendein/neues-modell', apiKey: undefined }),
    );
  });

  // Wessen Schluessel lief? Das entscheidet den Satz bei 402/403. Der Aufruf
  // oben (kein X-Pollen-Key, aber Server-Key) ist genau der Fall "Betreiber
  // zahlt" — und muss als solcher unten ankommen.
  it('meldet dem v1-Aufruf, dass kein eigener Schluessel im Spiel war', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('socket hang up')) as unknown as typeof fetch;
    resolvePollenKeyMock.mockReturnValue('server-key-ohne-guthaben');
    generatePollinationsImageMock.mockResolvedValueOnce('https://example.com/ohne-key.png');

    await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'roter apfel', model: 'irgendein/neues-modell', width: 1024, height: 1024 }),
    }));

    expect(generatePollinationsImageMock).toHaveBeenCalledWith(
      expect.objectContaining({ hasUserKey: false }),
    );
  });

  it('meldet dem v1-Aufruf einen eigenen Schluessel als solchen', async () => {
    generatePollinationsImageMock.mockResolvedValueOnce('https://example.com/eigen.png');

    await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({ prompt: 'roter apfel', model: 'flux', width: 1024, height: 1024 }),
    }));

    expect(generatePollinationsImageMock).toHaveBeenCalledWith(
      expect.objectContaining({ hasUserKey: true }),
    );
  });

  // ── Pruna AI dispatch tests ─────────────────────────────────────────

  it('dispatches zimage to Pruna and returns uploaded URL on success', async () => {
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: 'https://pruna.ai/gen/123' });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('fake-image'),
      contentType: 'image/jpeg',
    });

    // Mock media upload success
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://media.pollinations.ai/pruna-result' }),
    });

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'cyberpunk skyline',
        model: 'zimage',
        width: 1024,
        height: 1024,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { imageUrl: string };

    expect(response.status).toBe(200);
    expect(body.imageUrl).toBe('https://media.pollinations.ai/pruna-result');
    expect(generateViaPrunaMock).toHaveBeenCalledWith(
      'zimage',
      expect.objectContaining({ prompt: 'cyberpunk skyline' }),
      expect.any(AbortSignal),
      'test-pruna-key',
    );
    expect(generatePollinationsImageMock).not.toHaveBeenCalled();
  });

  it.each(enabledPrunaImageModelIds)('never sends enabled Pruna image model %s to Pollinations generation', async (model) => {
    resolvePollenKeyMock.mockReturnValueOnce(undefined);
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: `https://pruna.ai/gen/${model}` });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from(`fake-${model}`),
      contentType: 'image/png',
    });

    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({ prompt: `generate ${model}`, model }),
    }));

    expect(response.status).toBe(200);
    expect(generateViaPrunaMock).toHaveBeenCalledWith(
      model,
      expect.objectContaining({ prompt: `generate ${model}` }),
      expect.any(AbortSignal),
      'test-pruna-key',
    );
    expect(generatePollinationsImageMock).not.toHaveBeenCalled();
    expect(imageUrlMock).not.toHaveBeenCalled();
    expect(videoUrlMock).not.toHaveBeenCalled();
  });

  it('returns Pruna media bytes when no Pollen key is connected', async () => {
    resolvePollenKeyMock.mockReturnValueOnce(undefined);
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: 'https://pruna.ai/gen/local-only' });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('local-image'),
      contentType: 'image/png',
    });
    global.fetch = jest.fn();

    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pruna-Key': 'user_pruna_1234567890' },
      body: JSON.stringify({ prompt: 'local result', model: 'p-image' }),
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(response.headers.get('x-heyhi-media-kind')).toBe('image');
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe('local-image');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns specific Pruna error message (not "Internal server error") on Pruna failure', async () => {
    const { ApiError } = require('@/lib/api-error-handler');
    generateViaPrunaMock.mockRejectedValueOnce(
      new ApiError(502, 'Pruna API error (404): Model not found', 'PRUNA_API_ERROR')
    );

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'test',
        model: 'wan-t2v',
        width: 1024,
        height: 1024,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string; code?: string };

    expect(response.status).toBe(502);
    expect(body.error).toBe('Pruna API error (404): Model not found');
    expect(body.code).toBe('PRUNA_API_ERROR');
  });

  it('rejects wan-i2v without a reference image with 400', async () => {
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'animate this',
        model: 'wan-i2v',
        width: 1024,
        height: 1024,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/wan-i2v requires a reference image/i);
    expect(generateViaPrunaMock).not.toHaveBeenCalled();
  });

  it('dispatches wan-i2v to Pruna when a reference image is provided', async () => {
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: 'https://pruna.ai/gen/456' });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('fake-video'),
      contentType: 'video/mp4',
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://media.pollinations.ai/pruna-video' }),
    });

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'animate this photo',
        model: 'wan-i2v',
        image: 'https://example.com/photo.jpg',
        duration: 5,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { videoUrl: string };

    expect(response.status).toBe(200);
    expect(body.videoUrl).toBe('https://media.pollinations.ai/pruna-video');
    expect(generateViaPrunaMock).toHaveBeenCalledWith(
      'wan-i2v',
      expect.objectContaining({
        prompt: 'animate this photo',
        image: 'https://example.com/photo.jpg',
      }),
      expect.any(AbortSignal),
      'test-pruna-key',
    );
  });

  it('returns the Pruna error for zimage instead of falling back to Pollinations', async () => {
    const { ApiError } = require('@/lib/api-error-handler');
    generateViaPrunaMock.mockRejectedValueOnce(
      new ApiError(502, 'Pruna API error (500): Internal error', 'PRUNA_API_ERROR')
    );

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'test fallback',
        model: 'zimage',
        width: 1024,
        height: 1024,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string; code?: string };

    expect(response.status).toBe(502);
    expect(body.error).toContain('Pruna API error');
    expect(body.code).toBe('PRUNA_API_ERROR');
    expect(generateViaPrunaMock).toHaveBeenCalled();
    expect(generatePollinationsImageMock).not.toHaveBeenCalled();
    expect(imageUrlMock).not.toHaveBeenCalled();
  });

  it('returns the upload error for zimage instead of falling back to Pollinations', async () => {
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: 'https://pruna.ai/gen/123' });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('fake-image'),
      contentType: 'image/jpeg',
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: '' }),
    });

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'test upload fallback',
        model: 'zimage',
        width: 1024,
        height: 1024,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string; code?: string };

    expect(response.status).toBe(502);
    expect(body.error).toContain('upload');
    expect(generateViaPrunaMock).toHaveBeenCalled();
    expect(generatePollinationsImageMock).not.toHaveBeenCalled();
    expect(imageUrlMock).not.toHaveBeenCalled();
  });

  it('returns the upload error for zimage instead of falling back to Pollinations', async () => {
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: 'https://pruna.ai/gen/123' });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('fake-image'),
      contentType: 'image/jpeg',
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: '' }),
    });

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'test upload fallback',
        model: 'zimage',
        width: 1024,
        height: 1024,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string; code?: string };

    // Upload: Storage returned empty URL → 502 (WIP Branch version)
    expect(response.status).toBe(502);
    expect(body.error).toBe('Media upload succeeded but returned no URL');
    expect(body.code).toBe('MEDIA_UPLOAD_MISSING_URL');
    expect(generateViaPrunaMock).toHaveBeenCalled();
    expect(generatePollinationsImageMock).not.toHaveBeenCalled();
    expect(imageUrlMock).not.toHaveBeenCalled();
  });

  it('returns the media upload failure for zimage instead of falling back to Pollinations', async () => {
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: 'https://pruna.ai/gen/123' });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('fake-image'),
      contentType: 'image/jpeg',
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Storage unavailable',
    });

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'test upload error fallback',
        model: 'zimage',
        width: 1024,
        height: 1024,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string; code?: string };

    // Upload: Storage returned non-ok → 502 (WIP Branch version)
    expect(response.status).toBe(502);
    // Wie in /api/media/upload: der Upstream-Text bleibt im Log, der Client
    // bekommt Status und Ursache-Code.
    expect(body.error).toBe('Media upload failed (500)');
    expect(body.error).not.toContain('Storage unavailable');
    expect(body.code).toBe('MEDIA_UPLOAD_ERROR');
    expect(generateViaPrunaMock).toHaveBeenCalled();
    expect(generatePollinationsImageMock).not.toHaveBeenCalled();
    expect(imageUrlMock).not.toHaveBeenCalled();
  });

  it('does NOT fall back to Pollinations for exclusive Pruna models (wan-t2v)', async () => {
    const { ApiError } = require('@/lib/api-error-handler');
    generateViaPrunaMock.mockRejectedValueOnce(
      new ApiError(502, 'Pruna API error (500): Internal error', 'PRUNA_API_ERROR')
    );

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'test exclusive',
        model: 'wan-t2v',
        width: 1024,
        height: 1024,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(502);
    expect(body.error).toMatch(/Pruna API error \(500\): Internal error/);
    expect(generatePollinationsImageMock).not.toHaveBeenCalled();
  });

  it('does NOT fall back to Pollinations for exclusive Pruna models when media upload returns no URL', async () => {
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: 'https://pruna.ai/gen/789' });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('fake-video'),
      contentType: 'video/mp4',
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: '' }),
    });

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'test exclusive upload',
        model: 'wan-t2v',
        width: 1024,
        height: 1024,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string; code?: string };

    expect(response.status).toBe(502);
    expect(body.error).toMatch(/Media upload succeeded but returned no URL/);
    expect(body.code).toBe('MEDIA_UPLOAD_MISSING_URL');
    expect(generatePollinationsImageMock).not.toHaveBeenCalled();
    expect(videoUrlMock).not.toHaveBeenCalled();
  });

  it('returns 503 when PRUNA_API_KEY is missing for exclusive Pruna models', async () => {
    const originalKey = process.env.PRUNA_API_KEY;
    delete (process.env as any).PRUNA_API_KEY;

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'test no key',
        model: 'wan-t2v',
        width: 1024,
        height: 1024,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/wan-t2v requires a Pruna key/i);
    expect((body as { code?: string }).code).toBe('MISSING_PRUNA_KEY');

    if (originalKey) process.env.PRUNA_API_KEY = originalKey;
  });

  it('returns 503 for zimage without a Pruna key instead of using Pollinations', async () => {
    delete (process.env as any).PRUNA_API_KEY;

    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({ prompt: 'strict provider routing', model: 'zimage' }),
    }));
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/zimage requires a Pruna key/i);
    expect(generateViaPrunaMock).not.toHaveBeenCalled();
    expect(generatePollinationsImageMock).not.toHaveBeenCalled();
    expect(imageUrlMock).not.toHaveBeenCalled();
  });

  it.each([1, 20])('accepts p-video duration boundary %s seconds', async (duration) => {
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: `https://pruna.ai/gen/p-video-${duration}` });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('fake-video'),
      contentType: 'video/mp4',
    });
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: `https://media.pollinations.ai/p-video-${duration}` }),
    });

    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({ prompt: 'duration boundary', model: 'p-video', duration }),
    }));

    expect(response.status).toBe(200);
    expect(generateViaPrunaMock).toHaveBeenCalledWith(
      'p-video',
      expect.objectContaining({ duration }),
      expect.any(AbortSignal),
      'test-pruna-key',
    );
  });

  it.each([0, 20.5, 21])('rejects invalid p-video duration %s before Pruna dispatch', async (duration) => {
    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({ prompt: 'invalid duration', model: 'p-video', duration }),
    }));
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid duration.*p-video/i);
    expect(generateViaPrunaMock).not.toHaveBeenCalled();
  });

  it('rejects p-video-2 params.duration outside range before Pruna dispatch', async () => {
    // params.duration ist der alternative Traeger: ohne Top-Level-Dauer liefe
    // der Wert sonst ungeprueft durch den Adapter an den Provider.
    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'params duration bypass',
        model: 'p-video-2',
        params: { duration: 99 },
      }),
    }));
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid duration.*p-video-2/i);
    expect(generateViaPrunaMock).not.toHaveBeenCalled();
  });

  const proRequest = (body: Record<string, unknown>) => new Request('http://localhost/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
    body: JSON.stringify({ prompt: 'pro duration contract', model: 'p-video-2-pro', ...body }),
  });

  describe('p-video-2-pro duration contract', () => {

    it.each([5, 15])('accepts top-level duration boundary %s seconds', async (duration) => {
      generateViaPrunaMock.mockResolvedValueOnce({ predictionId: `pro-top-${duration}` });

      const response = await POST(proRequest({ duration }));

      expect(response.status).toBe(202);
      expect(generateViaPrunaMock).toHaveBeenCalledWith(
        'p-video-2-pro',
        expect.objectContaining({ duration }),
        expect.any(AbortSignal),
        'test-pruna-key',
      );
    });

    it.each([5, 15])('accepts params-only duration boundary %s seconds', async (duration) => {
      generateViaPrunaMock.mockResolvedValueOnce({ predictionId: `pro-params-${duration}` });

      const response = await POST(proRequest({ params: { duration } }));

      expect(response.status).toBe(202);
      expect(generateViaPrunaMock).toHaveBeenCalledWith(
        'p-video-2-pro',
        expect.objectContaining({ duration: undefined, params: { duration } }),
        expect.any(AbortSignal),
        'test-pruna-key',
      );
    });

    it.each([0, 4, 15.5, 16, 20])('rejects invalid top-level duration %s before Pruna dispatch', async (duration) => {
      const response = await POST(proRequest({ duration }));
      const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

      expect(response.status).toBe(400);
      expect(body.error).toMatch(/invalid duration.*p-video-2-pro/i);
      expect(generateViaPrunaMock).not.toHaveBeenCalled();
    });

    it.each([0, 4, 15.5, 16, 20])('rejects invalid params-only duration %s before Pruna dispatch', async (duration) => {
      const response = await POST(proRequest({ params: { duration } }));
      const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

      expect(response.status).toBe(400);
      expect(body.error).toMatch(/invalid duration.*p-video-2-pro/i);
      expect(generateViaPrunaMock).not.toHaveBeenCalled();
    });

    it('uses the mapper default when duration is absent', async () => {
      generateViaPrunaMock.mockResolvedValueOnce({ predictionId: 'pro-default' });

      const response = await POST(proRequest({}));

      expect(response.status).toBe(202);
      expect(generateViaPrunaMock).toHaveBeenCalledWith(
        'p-video-2-pro',
        expect.objectContaining({ duration: undefined, params: undefined }),
        expect.any(AbortSignal),
        'test-pruna-key',
      );
    });

    it('gives a valid top-level duration precedence over a conflicting params duration', async () => {
      generateViaPrunaMock.mockResolvedValueOnce({ predictionId: 'pro-precedence' });

      const response = await POST(proRequest({ duration: 5, params: { duration: 15 } }));

      expect(response.status).toBe(202);
      expect(generateViaPrunaMock).toHaveBeenCalledWith(
        'p-video-2-pro',
        expect.objectContaining({ duration: 5, params: { duration: 15 } }),
        expect.any(AbortSignal),
        'test-pruna-key',
      );
    });

    it('rejects a malformed params-only duration before dispatch', async () => {
      const response = await POST(proRequest({ params: { duration: '5' } }));
      const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

      expect(response.status).toBe(400);
      expect(body.error).toMatch(/invalid duration.*p-video-2-pro/i);
      expect(generateViaPrunaMock).not.toHaveBeenCalled();
    });

    it('allows a valid top-level duration to win over malformed params duration', async () => {
      generateViaPrunaMock.mockResolvedValueOnce({ predictionId: 'pro-malformed-duplicate' });

      const response = await POST(proRequest({ duration: 5, params: { duration: '5' } }));

      expect(response.status).toBe(202);
      expect(generateViaPrunaMock).toHaveBeenCalledWith(
        'p-video-2-pro',
        expect.objectContaining({ duration: 5, params: { duration: '5' } }),
        expect.any(AbortSignal),
        'test-pruna-key',
      );
    });
  });

  it('returns 503 for p-video-2-pro when neither the request nor server Pruna key exists', async () => {
    delete (process.env as any).PRUNA_API_KEY;

    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({ prompt: 'no pro key', model: 'p-video-2-pro' }),
    }));
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string; code?: string };

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/p-video-2-pro requires a Pruna key/i);
    expect(body.code).toBe('MISSING_PRUNA_KEY');
    expect(generateViaPrunaMock).not.toHaveBeenCalled();
  });

  it('returns an async 202 with the p-video-2-pro identity and preserves two reference frames', async () => {
    generateViaPrunaMock.mockResolvedValueOnce({ predictionId: 'pro-refs-202' });

    const response = await POST(proRequest({
      image: ['https://example.com/start.jpg', 'https://example.com/end.jpg'],
    }));
    const body = responseJson.mock.calls.at(-1)?.[0] as { pending: boolean; predictionId: string; model: string };

    expect(response.status).toBe(202);
    expect(body).toEqual({ pending: true, predictionId: 'pro-refs-202', model: 'p-video-2-pro' });
    expect(generateViaPrunaMock).toHaveBeenCalledWith(
      'p-video-2-pro',
      expect.objectContaining({ image: ['https://example.com/start.jpg', 'https://example.com/end.jpg'] }),
      expect.any(AbortSignal),
      'test-pruna-key',
    );
    expect(generatePollinationsImageMock).not.toHaveBeenCalled();
    expect(videoUrlMock).not.toHaveBeenCalled();
  });

  it('passes the Pro schema default 768p through the real Create request builder in params', async () => {
    generateViaPrunaMock.mockResolvedValueOnce({ predictionId: 'pro-schema-default' });
    const model = buildPrunaEntries().find((entry) => entry.id === 'p-video-2-pro');
    const schema = schemaFor('p-video-2-pro');
    expect(model).toBeDefined();
    expect(schema).toBeDefined();

    const body = buildGenerateBody(
      {
        mode: 't2v',
        modelId: 'p-video-2-pro',
        prompt: 'schema default request',
        params: defaultsFor(schema!),
        uploads: [],
        sourceVideo: null,
      } as any,
      model as any,
      schema,
    );

    expect(body.resolution).toBeUndefined();
    expect(body.params?.resolution).toBe('768p');

    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify(body),
    }));

    expect(response.status).toBe(202);
    expect(generateViaPrunaMock).toHaveBeenCalledWith(
      'p-video-2-pro',
      expect.objectContaining({ params: expect.objectContaining({ resolution: '768p' }) }),
      expect.any(AbortSignal),
      'test-pruna-key',
    );
  });

  it('rejects more than two p-video-2-pro reference frames before dispatch', async () => {
    const response = await POST(proRequest({
      image: [
        'https://example.com/start.jpg',
        'https://example.com/end.jpg',
        'https://example.com/extra.jpg',
      ],
    }));

    expect(response.status).toBe(400);
    expect(generateViaPrunaMock).not.toHaveBeenCalled();
  });

  it.each([
    ['wan-t2v', 5],
    ['wan-t2v', 6],
    ['wan-t2v', 7],
    ['wan-t2v', 7.5],
    ['wan-i2v', 5],
    ['wan-i2v', 6],
    ['wan-i2v', 7],
    ['wan-i2v', 7.5],
  ] as const)('accepts %s duration option %s seconds', async (model, duration) => {
    resolvePollenKeyMock.mockReturnValueOnce(undefined);
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: `https://pruna.ai/gen/${model}-${duration}` });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('fake-video'),
      contentType: 'video/mp4',
    });

    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'valid wan duration',
        model,
        duration,
        ...(model === 'wan-i2v' ? { image: 'https://example.com/start.jpg' } : {}),
      }),
    }));

    expect(response.status).toBe(200);
    expect(generateViaPrunaMock).toHaveBeenCalledWith(
      model,
      expect.objectContaining({ duration }),
      expect.any(AbortSignal),
      'test-pruna-key',
    );
  });

  it.each(['wan-t2v', 'wan-i2v'] as const)('rejects unsupported 10-second duration for %s before Pruna dispatch', async (model) => {
    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'invalid wan duration',
        model,
        duration: 10,
        ...(model === 'wan-i2v' ? { image: 'https://example.com/start.jpg' } : {}),
      }),
    }));
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid duration.*5, 6, 7, 7.5/i);
    expect(generateViaPrunaMock).not.toHaveBeenCalled();
  });

  it.each([
    ['p-video-avatar', {}],
    ['p-video-animate', { video: 'https://example.com/source.mp4' }],
    ['p-video-replace', { video: 'https://example.com/source.mp4' }],
  ] as const)('rejects supplied duration for %s rather than ignoring it', async (model, extraBody) => {
    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({ prompt: 'provider-controlled duration', model, duration: 5, ...extraBody }),
    }));
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/does not accept a duration/i);
    expect(generateViaPrunaMock).not.toHaveBeenCalled();
  });

  it('passes ordered Wan I2V start/end images unchanged to the Pruna adapter', async () => {
    const images = ['https://example.com/start.jpg', 'https://example.com/end.jpg'];
    resolvePollenKeyMock.mockReturnValueOnce(undefined);
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: 'https://pruna.ai/gen/wan-i2v-frames' });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('fake-video'),
      contentType: 'video/mp4',
    });

    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({ prompt: 'transition', model: 'wan-i2v', duration: 6, image: images }),
    }));

    expect(response.status).toBe(200);
    expect(generateViaPrunaMock).toHaveBeenCalledWith(
      'wan-i2v',
      expect.objectContaining({ image: images, duration: 6 }),
      expect.any(AbortSignal),
      'test-pruna-key',
    );
  });

  // ── Pruna P-Model tests ─────────────────────────────────────────────

  it('dispatches p-image to Pruna (sync mode)', async () => {
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: 'https://pruna.ai/gen/pimg-123' });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('fake-p-image'),
      contentType: 'image/jpeg',
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://media.pollinations.ai/p-image-result' }),
    });

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'a majestic lion',
        model: 'p-image',
        width: 1024,
        height: 1024,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { imageUrl: string };

    expect(response.status).toBe(200);
    expect(body.imageUrl).toBe('https://media.pollinations.ai/p-image-result');
    expect(generateViaPrunaMock).toHaveBeenCalledWith(
      'p-image',
      expect.objectContaining({ prompt: 'a majestic lion' }),
      expect.any(AbortSignal),
      'test-pruna-key',
    );
    expect(generatePollinationsImageMock).not.toHaveBeenCalled();
  });

  it('dispatches p-image-edit to Pruna with reference images', async () => {
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: 'https://pruna.ai/gen/pedit-456' });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('fake-p-edit'),
      contentType: 'image/jpeg',
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://media.pollinations.ai/p-edit-result' }),
    });

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'make it watercolor',
        model: 'p-image-edit',
        image: ['https://example.com/photo.jpg'],
        width: 1024,
        height: 1024,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { imageUrl: string };

    expect(response.status).toBe(200);
    expect(body.imageUrl).toBe('https://media.pollinations.ai/p-edit-result');
    expect(generateViaPrunaMock).toHaveBeenCalledWith(
      'p-image-edit',
      expect.objectContaining({
        prompt: 'make it watercolor',
        image: ['https://example.com/photo.jpg'],
      }),
      expect.any(AbortSignal),
      'test-pruna-key',
    );
  });

  it('dispatches p-video to Pruna (async mode)', async () => {
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: 'https://pruna.ai/gen/pvid-789' });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('fake-p-video'),
      contentType: 'video/mp4',
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://media.pollinations.ai/p-video-result' }),
    });

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'a cat walking',
        model: 'p-video',
        duration: 5,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { videoUrl: string };

    expect(response.status).toBe(200);
    expect(body.videoUrl).toBe('https://media.pollinations.ai/p-video-result');
    expect(generateViaPrunaMock).toHaveBeenCalledWith(
      'p-video',
      expect.objectContaining({ prompt: 'a cat walking', duration: 5 }),
      expect.any(AbortSignal),
      'test-pruna-key',
    );
    expect(videoUrlMock).not.toHaveBeenCalled();
  });

  // VACE ist in der Registry abgeschaltet (ein Lauf dauert 6-12 Minuten). Die
  // Route darf es deshalb gar nicht erst an Pruna weiterreichen.
  it('rejects the disabled vace model instead of dispatching it', async () => {
    // Ohne Stub fragt die Route die echte Registry ab — offline wird daraus ein
    // Registry-Ausfall statt der Ablehnung, die dieser Test prueft.
    stubModelRegistry();
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({ prompt: 'character walking through rain', model: 'vace' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(generateViaPrunaMock).not.toHaveBeenCalled();
  });

  it.each(['p-video-animate', 'p-video-replace'] as const)('rejects %s without a source video', async (model) => {
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'move this character',
        model,
        image: 'https://example.com/reference.jpg',
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/requires a source video/i);
    expect(generateViaPrunaMock).not.toHaveBeenCalled();
  });

  it.each([
    ['p-video-animate', { image: 'https://example.com/subject.jpg' }],
    ['p-video-replace', { image: ['https://example.com/frame.jpg', 'https://example.com/ref.jpg'] }],
  ] as const)('dispatches %s with source video and reference images', async (model, extraBody) => {
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: `https://pruna.ai/gen/${model}` });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('fake-source-video-result'),
      contentType: 'video/mp4',
    });
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: `https://media.pollinations.ai/${model}-result` }),
    });

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'replace the performer',
        model,
        video: 'https://media.pollinations.ai/source-video.mp4',
        audio: false,
        ...extraBody,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { videoUrl: string };

    expect(response.status).toBe(200);
    expect(body.videoUrl).toBe(`https://media.pollinations.ai/${model}-result`);
    expect(generateViaPrunaMock).toHaveBeenCalledWith(
      model,
      expect.objectContaining({
        video: 'https://media.pollinations.ai/source-video.mp4',
        audio: false,
        ...extraBody,
      }),
      expect.any(AbortSignal),
      'test-pruna-key',
    );
  });

  it.each([
    ['p-image-try-on', { image: ['https://example.com/person.jpg', 'https://example.com/coat.jpg'] }, 'imageUrl'],
    ['p-image-upscale', { image: 'https://example.com/source.jpg', width: 2048, height: 2048 }, 'imageUrl'],
    ['p-video-avatar', { image: 'https://example.com/headshot.jpg' }, 'videoUrl'],
    ['wan-image-small', {}, 'imageUrl'],
    ['wan-t2v', { duration: 5 }, 'videoUrl'],
    ['wan-fast', { image: 'https://example.com/wan-ref.jpg', duration: 5 }, 'videoUrl'],
  ] as const)('dispatches %s to Pruna', async (model, extraBody, responseKey) => {
    const isVideo = responseKey === 'videoUrl';
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: `https://pruna.ai/gen/${model}` });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from(`fake-${model}`),
      contentType: isVideo ? 'video/mp4' : 'image/jpeg',
    });
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: `https://media.pollinations.ai/${model}-result` }),
    });

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: `generate ${model}`,
        model,
        ...extraBody,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { imageUrl?: string; videoUrl?: string };

    expect(response.status).toBe(200);
    expect(body[responseKey]).toBe(`https://media.pollinations.ai/${model}-result`);
    expect(generateViaPrunaMock).toHaveBeenCalledWith(
      model,
      expect.objectContaining({
        prompt: `generate ${model}`,
        ...extraBody,
      }),
      expect.any(AbortSignal),
      'test-pruna-key',
    );
  });

  // ── P-Video 2 (Aufgabe 3: Regressionsschutz gegen die Route) ────────────
  // Mapping/Registrierung stammen aus Aufgabe 1/2; diese Tests prüfen nur den
  // Route-Vertrag (Dauer-Validierung, BYOP-Fehler, Referenzbilder, 202-Pfad).

  it.each([1, 20])('accepts p-video-2 duration boundary %s seconds', async (duration) => {
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: `https://pruna.ai/gen/p-video-2-${duration}` });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('fake-video'),
      contentType: 'video/mp4',
    });
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: `https://media.pollinations.ai/p-video-2-${duration}` }),
    });

    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({ prompt: 'duration boundary', model: 'p-video-2', duration }),
    }));

    expect(response.status).toBe(200);
    expect(generateViaPrunaMock).toHaveBeenCalledWith(
      'p-video-2',
      expect.objectContaining({ duration }),
      expect.any(AbortSignal),
      'test-pruna-key',
    );
  });

  it.each([0, 20.5, 21])('rejects invalid p-video-2 duration %s before Pruna dispatch', async (duration) => {
    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({ prompt: 'invalid duration', model: 'p-video-2', duration }),
    }));
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid duration.*p-video-2/i);
    expect(generateViaPrunaMock).not.toHaveBeenCalled();
  });

  it('accepts p-video-2 without an explicit duration (provider decides length)', async () => {
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: 'https://pruna.ai/gen/p-video-2-auto' });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('fake-video'),
      contentType: 'video/mp4',
    });
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://media.pollinations.ai/p-video-2-auto' }),
    });

    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({ prompt: 'auto duration', model: 'p-video-2' }),
    }));

    expect(response.status).toBe(200);
    expect(generateViaPrunaMock).toHaveBeenCalledWith(
      'p-video-2',
      expect.objectContaining({ duration: undefined }),
      expect.any(AbortSignal),
      'test-pruna-key',
    );
  });

  it('returns the existing missing-Pruna-key error for p-video-2 without a Pollinations fallback', async () => {
    delete (process.env as any).PRUNA_API_KEY;

    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({ prompt: 'byop missing', model: 'p-video-2' }),
    }));
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string; code?: string };

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/p-video-2 requires a Pruna key/i);
    expect(body.code).toBe('MISSING_PRUNA_KEY');
    expect(generateViaPrunaMock).not.toHaveBeenCalled();
    expect(generatePollinationsImageMock).not.toHaveBeenCalled();
    expect(videoUrlMock).not.toHaveBeenCalled();
  });

  it('forwards start and end frame images to Pruna for p-video-2', async () => {
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: 'https://pruna.ai/gen/p-video-2-frames' });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('fake-video'),
      contentType: 'video/mp4',
    });
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://media.pollinations.ai/p-video-2-frames' }),
    });

    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'start to end',
        model: 'p-video-2',
        image: ['https://example.com/start.jpg', 'https://example.com/end.jpg'],
      }),
    }));

    expect(response.status).toBe(200);
    expect(generateViaPrunaMock).toHaveBeenCalledWith(
      'p-video-2',
      expect.objectContaining({
        image: ['https://example.com/start.jpg', 'https://example.com/end.jpg'],
      }),
      expect.any(AbortSignal),
      'test-pruna-key',
    );
  });

  it('returns 202 with the p-video-2 model id for a pending Pruna prediction', async () => {
    generateViaPrunaMock.mockResolvedValueOnce({ predictionId: 'pred-p-video-2-1' });

    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({ prompt: 'long run', model: 'p-video-2', duration: 12 }),
    }));
    const body = responseJson.mock.calls.at(-1)?.[0] as { pending: boolean; predictionId: string; model: string };

    expect(response.status).toBe(202);
    expect(body).toEqual({ pending: true, predictionId: 'pred-p-video-2-1', model: 'p-video-2' });
  });

  // Die Route validiert die effektive Dauer: Top-Level-Dauer, sonst
  // params.duration. Der Mapper bevorzugt die Top-Level-Dauer gegenueber einem
  // widerspruechlichen params.duration — das deckt src/lib/pruna/client.test.ts
  // mit echtem Mapping ab.
  it('forwards a validated top-level duration alongside a conflicting params.duration for p-video-2', async () => {
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: 'https://pruna.ai/gen/p-video-2-conflict' });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('fake-video'),
      contentType: 'video/mp4',
    });
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://media.pollinations.ai/p-video-2-conflict' }),
    });

    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Pollen-Key': TEST_POLLEN_KEY },
      body: JSON.stringify({
        prompt: 'conflicting duration',
        model: 'p-video-2',
        duration: 5,
        params: { duration: 99 },
      }),
    }));

    expect(response.status).toBe(200);
    expect(generateViaPrunaMock).toHaveBeenCalledWith(
      'p-video-2',
      expect.objectContaining({ duration: 5, params: { duration: 99 } }),
      expect.any(AbortSignal),
      'test-pruna-key',
    );
  });
});

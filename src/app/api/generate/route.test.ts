import { POST } from './route';
import { UNIFIED_IMAGE_MODELS } from '@/config/unified-image-models';

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
}));

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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      method: 'POST', headers: { 'Content-Type': 'application/json' },
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
      method: 'POST', headers: { 'Content-Type': 'application/json' },
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
      method: 'POST', headers: { 'Content-Type': 'application/json' },
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
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
    expect(body.error).toBe('Media upload failed (500): Storage unavailable');
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
    expect(body.error).toMatch(/wan-t2v requires PRUNA_API_KEY/i);

    if (originalKey) process.env.PRUNA_API_KEY = originalKey;
  });

  it('returns 503 for zimage without a Pruna key instead of using Pollinations', async () => {
    delete (process.env as any).PRUNA_API_KEY;

    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'strict provider routing', model: 'zimage' }),
    }));
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/zimage requires PRUNA_API_KEY/i);
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'invalid duration', model: 'p-video', duration }),
    }));
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid duration.*p-video/i);
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
    ['vace', {}],
  ] as const)('rejects supplied duration for %s rather than ignoring it', async (model, extraBody) => {
    const response = await POST(new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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

  it('allows vace text-to-video without a reference image', async () => {
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: 'https://pruna.ai/gen/vace-t2v' });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('fake-vace-video'),
      contentType: 'video/mp4',
    });
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://media.pollinations.ai/vace-video' }),
    });

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'character walking through rain',
        model: 'vace',
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { videoUrl: string };

    expect(response.status).toBe(200);
    expect(body.videoUrl).toBe('https://media.pollinations.ai/vace-video');
    expect(generateViaPrunaMock).toHaveBeenCalledWith(
      'vace',
      expect.objectContaining({
        prompt: 'character walking through rain',
        srcRefImages: undefined,
      }),
      expect.any(AbortSignal),
      'test-pruna-key',
    );
  });

  it('passes vace srcRefImages to Pruna', async () => {
    generateViaPrunaMock.mockResolvedValueOnce({ generationUrl: 'https://pruna.ai/gen/vace-ref' });
    downloadPrunaResultMock.mockResolvedValueOnce({
      buffer: Buffer.from('fake-vace-video'),
      contentType: 'video/mp4',
    });
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://media.pollinations.ai/vace-ref-video' }),
    });

    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'same character in a city',
        model: 'vace',
        srcRefImages: ['https://example.com/char-a.jpg', 'https://example.com/char-b.jpg'],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(generateViaPrunaMock).toHaveBeenCalledWith(
      'vace',
      expect.objectContaining({
        srcRefImages: ['https://example.com/char-a.jpg', 'https://example.com/char-b.jpg'],
      }),
      expect.any(AbortSignal),
      'test-pruna-key',
    );
  });

  it.each(['p-video-animate', 'p-video-replace'] as const)('rejects %s without a source video', async (model) => {
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
});

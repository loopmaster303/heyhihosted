import { POST } from './route';

const imageUrlMock = jest.fn();
const videoUrlMock = jest.fn();
const generatePollinationsImageMock = jest.fn();

jest.mock('@/lib/pollinations-sdk', () => ({
  imageUrl: (...args: unknown[]) => imageUrlMock(...args),
  videoUrl: (...args: unknown[]) => videoUrlMock(...args),
}));

jest.mock('@/lib/pollinations-image-v1', () => ({
  generatePollinationsImage: (...args: unknown[]) => generatePollinationsImageMock(...args),
}));

jest.mock('@/lib/resolve-pollen-key', () => ({
  resolvePollenKey: jest.fn(() => ''),
}));

describe('/api/generate route', () => {
  const responseJson = jest.fn((body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init));

  beforeEach(() => {
    imageUrlMock.mockReset();
    videoUrlMock.mockReset();
    generatePollinationsImageMock.mockReset();
    responseJson.mockClear();
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: responseJson,
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

  it('maps the grok-imagine-video alias to the canonical grok-video route', async () => {
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
      expect.objectContaining({ model: 'grok-video', duration: 5 }),
    );
    expect(imageUrlMock).not.toHaveBeenCalled();
    expect(generatePollinationsImageMock).not.toHaveBeenCalled();
  });

  it.each([
    ['wan-fast', 'video'],
    ['p-video', 'video'],
    ['qwen-image', 'image'],
    ['grok-imagine-pro', 'image'],
    ['p-image', 'image'],
    ['p-image-edit', 'image'],
  ] as const)('keeps approved visual model ids routable for %s (%s)', async (modelId, kind) => {
    if (kind === 'video') {
      videoUrlMock.mockResolvedValueOnce(`https://example.com/${modelId}.mp4`);
    } else {
      generatePollinationsImageMock.mockResolvedValueOnce(`https://example.com/${modelId}.png`);
    }

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
    if (kind === 'video') {
      expect(videoUrlMock).toHaveBeenCalledWith(
        `model ${modelId}`,
        expect.objectContaining({ model: modelId }),
      );
      expect(generatePollinationsImageMock).not.toHaveBeenCalled();
    } else {
      expect(generatePollinationsImageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: `model ${modelId}`,
          model: modelId,
          width: 1024,
          height: 1024,
        }),
      );
      expect(videoUrlMock).not.toHaveBeenCalled();
    }
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
      imageUrl: 'https://example.com/v1-image.png',
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
    expect(body.imageUrl).toContain('image=ref1,ref2');
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
});

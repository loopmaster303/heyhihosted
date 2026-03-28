import { ReadableStream } from 'node:stream/web';

(globalThis as any).ReadableStream = ReadableStream;

const getContextMock = jest.fn();
const injectIntoSystemPromptMock = jest.fn((prompt: string, _context?: unknown) => prompt);
const httpsPostMock = jest.fn();
const httpsPostStreamMock = jest.fn();
const resolveChatSearchStrategyMock = jest.fn();

jest.mock('@/lib/services/web-context-service', () => ({
  WebContextService: {
    getContext: (...args: unknown[]) => getContextMock(...args),
    injectIntoSystemPrompt: (...args: [string, unknown]) => injectIntoSystemPromptMock(...args),
  },
}));

jest.mock('@/lib/resolve-pollen-key', () => ({
  resolvePollenKey: jest.fn(() => 'sk_test'),
  hasUserProvidedPollenKey: jest.fn(() => false),
}));

jest.mock('@/lib/https-post', () => ({
  httpsPost: (...args: unknown[]) => httpsPostMock(...args),
  httpsPostStream: (...args: unknown[]) => httpsPostStreamMock(...args),
}));

jest.mock('@/lib/chat/chat-search-strategy', () => ({
  resolveChatSearchStrategy: (...args: unknown[]) => resolveChatSearchStrategyMock(...args),
}));

describe('/api/chat/completion route', () => {
  const responseJson = jest.fn((body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init));

  beforeEach(() => {
    getContextMock.mockReset();
    injectIntoSystemPromptMock.mockClear();
    httpsPostMock.mockReset();
    httpsPostStreamMock.mockReset();
    resolveChatSearchStrategyMock.mockReset();
    httpsPostMock.mockResolvedValue({
      status: 200,
      body: JSON.stringify({
        choices: [{ message: { content: 'ok' } }],
      }),
    });
    resolveChatSearchStrategyMock.mockImplementation(({ modelId }: { modelId: string }) => ({
      strategy: 'direct',
      routedModelId: modelId,
      shouldFetchWebContext: false,
      webContextMode: 'light',
    }));
    responseJson.mockClear();
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: responseJson,
    });
  });

  it('does not prefetch web context when the request is delegated to live search', async () => {
    const { POST } = await import('./route');
    resolveChatSearchStrategyMock.mockReturnValue({
      strategy: 'delegated-live-search',
      routedModelId: 'perplexity-fast',
      shouldFetchWebContext: false,
      webContextMode: 'light',
    });

    const request = new Request('http://localhost/api/chat/completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'bitcoin price today' }],
        modelId: 'gemini-fast',
      }),
    });

    const response = await POST(request);
    const upstreamPayload = JSON.parse(httpsPostMock.mock.calls[0][2]);

    expect(response.status).toBe(200);
    expect(getContextMock).not.toHaveBeenCalled();
    expect(upstreamPayload.model).toBe('perplexity-fast');
  });

  it('rejects unknown text models with a 400 response before calling Pollinations', async () => {
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/chat/completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hello there' }],
        modelId: 'definitely-not-real',
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/unknown or unavailable pollinations text model/i);
    expect(httpsPostMock).not.toHaveBeenCalled();
  });

  it('rejects unknown routed models with a 400 response before calling Pollinations', async () => {
    const { POST } = await import('./route');
    resolveChatSearchStrategyMock.mockReturnValue({
      strategy: 'delegated-live-search',
      routedModelId: 'definitely-not-real',
      shouldFetchWebContext: false,
      webContextMode: 'light',
    });

    const request = new Request('http://localhost/api/chat/completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'bitcoin price today' }],
        modelId: 'gemini-fast',
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/unknown or unavailable pollinations text model/i);
    expect(httpsPostMock).not.toHaveBeenCalled();
  });

  it('keeps JSON mode when stream is not requested', async () => {
    const { POST } = await import('./route');

    const request = new Request('http://localhost/api/chat/completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hello there' }],
        modelId: 'gemini-fast',
      }),
    });

    const response = await POST(request);
    const upstreamPayload = JSON.parse(httpsPostMock.mock.calls[0][2]);

    expect(responseJson.mock.calls.at(-1)?.[0]).toEqual({
      choices: [
        {
          message: {
            content: 'ok',
            role: 'assistant',
          },
        },
      ],
    });
    expect(upstreamPayload.stream).toBeUndefined();
    expect(httpsPostStreamMock).not.toHaveBeenCalled();
  });

  it('returns SSE and forwards stream=true when requested', async () => {
    const { POST } = await import('./route');
    const encoder = new TextEncoder();
    const upstreamSse = new globalThis.ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"lo"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    httpsPostStreamMock.mockResolvedValue({
      status: 200,
      stream: upstreamSse,
      headers: {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
      },
    });

    const request = new Request('http://localhost/api/chat/completion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'stream this' }],
        modelId: 'gemini-fast',
        stream: true,
      }),
    });

    const response = await POST(request);
    const upstreamPayload = JSON.parse(httpsPostStreamMock.mock.calls[0][2]);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(responseJson).not.toHaveBeenCalled();
    expect(upstreamPayload.stream).toBe(true);
    expect(httpsPostMock).not.toHaveBeenCalled();
  });
});

export {};

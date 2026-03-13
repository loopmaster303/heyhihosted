import { POST } from './route';

const getContextMock = jest.fn();
const injectIntoSystemPromptMock = jest.fn((prompt: string, _context?: unknown) => prompt);
const httpsPostMock = jest.fn();

jest.mock('@/lib/services/web-context-service', () => ({
  WebContextService: {
    getContext: (...args: unknown[]) => getContextMock(...args),
    injectIntoSystemPrompt: (...args: [string, unknown]) => injectIntoSystemPromptMock(...args),
  },
}));

jest.mock('@/lib/resolve-pollen-key', () => ({
  resolvePollenKey: jest.fn(() => 'sk_test'),
}));

jest.mock('@/lib/https-post', () => ({
  httpsPost: (...args: unknown[]) => httpsPostMock(...args),
}));

describe('/api/chat/completion route', () => {
  const responseJson = jest.fn((body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init));

  beforeEach(() => {
    getContextMock.mockReset();
    injectIntoSystemPromptMock.mockClear();
    httpsPostMock.mockReset();
    httpsPostMock.mockResolvedValue({
      status: 200,
      body: JSON.stringify({
        choices: [{ message: { content: 'ok' } }],
      }),
    });
    responseJson.mockClear();
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: responseJson,
    });
  });

  it('does not prefetch web context when the request is delegated to live search', async () => {
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
});

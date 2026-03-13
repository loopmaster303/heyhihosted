import { POST } from './route';

const getPollinationsChatCompletionMock = jest.fn();

jest.mock('@/ai/flows/pollinations-chat-flow', () => ({
  getPollinationsChatCompletion: (...args: unknown[]) => getPollinationsChatCompletionMock(...args),
}));

jest.mock('@/lib/resolve-pollen-key', () => ({
  resolvePollenKey: jest.fn(() => ''),
}));

describe('/api/enhance-prompt route', () => {
  const responseJson = jest.fn((body: unknown) => ({
    json: async () => body,
  }));

  beforeEach(() => {
    getPollinationsChatCompletionMock.mockReset();
    responseJson.mockClear();
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: responseJson,
    });
  });

  it('uses claude-airforce as the primary enhancer and claude-fast as fallback', async () => {
    getPollinationsChatCompletionMock
      .mockRejectedValueOnce(new Error('primary down'))
      .mockResolvedValueOnce({ responseText: 'A compact enhanced prompt.' });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'portrait at dusk',
        modelId: 'flux',
        language: 'de',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ modelId: 'claude-airforce' }),
    );
    expect(getPollinationsChatCompletionMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ modelId: 'claude-fast' }),
    );
  });

  it('routes imagen-4 enhancement guidelines through the nanobanana prompt template', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: 'A confident fashion portrait, clean studio framing, soft directional light, natural skin texture, elegant styling, sharp fabric detail, polished composition, no visible text or logos.',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'fashion portrait',
        modelId: 'imagen-4',
        language: 'de',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-airforce',
        systemPrompt: expect.stringContaining('Nano Banana (Gemini 2.5 Flash Image) prompt expert'),
      }),
    );
  });

  it('uses the dirtberry-specific simple-rule enhancer prompt', async () => {
    getPollinationsChatCompletionMock.mockResolvedValueOnce({
      responseText: 'A woman in a red jacket walking through a rainy city street, medium shot, cinematic street-level framing, soft reflections on wet pavement, moody evening light, clean composition, realistic skin texture, no visible text.',
    });

    const request = new Request('http://localhost/api/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'woman red jacket city rain',
        modelId: 'dirtberry',
        language: 'de',
      }),
    });

    await POST(request as any);

    expect(getPollinationsChatCompletionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'claude-airforce',
        systemPrompt: expect.stringContaining('subject -> action / pose -> camera / framing -> lighting -> positive constraints'),
      }),
    );
  });
});

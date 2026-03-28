const textToSpeechMock = jest.fn();

jest.mock('@/ai/flows/tts-flow', () => ({
  textToSpeech: (...args: unknown[]) => textToSpeechMock(...args),
}));

describe('/api/tts route', () => {
  const responseJson = jest.fn((body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init));

  beforeEach(() => {
    textToSpeechMock.mockReset();
    textToSpeechMock.mockResolvedValue({ audioDataUri: 'data:audio/mpeg;base64,AAA' });
    responseJson.mockClear();
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: responseJson,
    });
  });

  it('forwards a valid speed preset to textToSpeech', async () => {
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello world',
        voice: 'alloy',
        speed: 1.15,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(textToSpeechMock).toHaveBeenCalledWith('Hello world', 'alloy', 1.15);
  });

  it('rejects unsupported speed values', async () => {
    const { POST } = await import('./route');
    const request = new Request('http://localhost/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello world',
        voice: 'alloy',
        speed: 0.7,
      }),
    });

    const response = await POST(request);
    const body = responseJson.mock.calls.at(-1)?.[0] as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/invalid request data/i);
    expect(textToSpeechMock).not.toHaveBeenCalled();
  });
});

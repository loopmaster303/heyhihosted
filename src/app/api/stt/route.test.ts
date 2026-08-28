import { speechToText } from '@/ai/flows/stt-flow';

jest.mock('@/ai/flows/stt-flow', () => ({
  speechToText: jest.fn().mockResolvedValue({ text: 'hallo' }),
}));

jest.mock('@/lib/chat/audio-settings', () => ({
  resolveSttLanguageHint: jest.fn((value?: string) => value ?? 'auto'),
}));

describe('/api/stt route', () => {
  const { POST } = require('./route') as typeof import('./route');
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    (speechToText as jest.Mock).mockClear();
    // jsdom's Response lacks the static .json() used by NextResponse.json.
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init),
    });
    // NextResponse bodies are unreadable under the jsdom fetch polyfill, so
    // error payloads are asserted via the server-side log instead.
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // Duck-typed request: the jsdom fetch polyfill cannot parse multipart bodies.
  function makeRequest(
    formData: FormData | null,
    headers: Record<string, string> = {}
  ): Request {
    return {
      headers: new Headers(headers),
      formData: async () => {
        if (!formData) throw new TypeError('no body');
        return formData;
      },
    } as unknown as Request;
  }

  function audioForm(type: string): FormData {
    const form = new FormData();
    form.append('audioFile', new File([new Uint8Array(8)], 'clip.bin', { type }));
    return form;
  }

  it('rejects uploads above the declared size limit before parsing', async () => {
    const response = await POST(
      makeRequest(null, { 'content-length': String(16 * 1024 * 1024) })
    );
    expect(response.status).toBe(400);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'API Error:',
      expect.objectContaining({ message: expect.stringMatching(/too large/i) })
    );
    expect(speechToText).not.toHaveBeenCalled();
  });

  it('accepts a valid audio upload', async () => {
    const response = await POST(makeRequest(audioForm('audio/webm')));
    expect(response.status).toBe(200);
    expect(speechToText).toHaveBeenCalledTimes(1);
    expect(speechToText).toHaveBeenCalledWith(expect.any(File), 'auto');
  });

  it('rejects non-audio MIME types', async () => {
    const response = await POST(makeRequest(audioForm('text/plain')));
    expect(response.status).toBe(400);
    expect(speechToText).not.toHaveBeenCalled();
  });

  it('rejects oversized audio files regardless of declared length', async () => {
    const form = new FormData();
    form.append('audioFile', new File([new Uint8Array(16 * 1024 * 1024)], 'big.wav', { type: 'audio/wav' }));

    const response = await POST(makeRequest(form));
    expect(response.status).toBe(400);
    expect(speechToText).not.toHaveBeenCalled();
  });
});

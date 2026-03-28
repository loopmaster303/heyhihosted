import { textToSpeech } from '@/ai/flows/tts-flow';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('textToSpeech', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('forwards the selected playback speed to Pollinations', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'audio/mpeg' }),
      arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer,
    });

    await textToSpeech('Hello world', 'alloy', 1.15);

    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual(
      expect.objectContaining({
        voice: 'alloy',
        speed: 1.15,
      }),
    );
  });

  it('uses the default speed when none is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'audio/mpeg' }),
      arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer,
    });

    await textToSpeech('Hello world', 'alloy');

    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual(
      expect.objectContaining({
        speed: 1,
      }),
    );
  });
});

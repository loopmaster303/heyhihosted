import { speechToText } from '@/ai/flows/stt-flow';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('speechToText', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('forwards an explicit language hint to the transcription request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'Hallo Welt' }),
    });

    const file = new File(['audio'], 'recording.webm', { type: 'audio/webm' });
    await speechToText(file, 'en');

    const formData = mockFetch.mock.calls[0][1].body as FormData;
    expect(formData.get('language')).toBe('en');
    expect(formData.get('model')).toBe('scribe');
  });

  it('omits the language field when auto-detect should be used', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'Hello world' }),
    });

    const file = new File(['audio'], 'recording.webm', { type: 'audio/webm' });
    await speechToText(file);

    const formData = mockFetch.mock.calls[0][1].body as FormData;
    expect(formData.get('language')).toBeNull();
  });

  it('preserves the language hint when falling back to the second model', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'broken',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: 'Recovered' }),
      });

    const file = new File(['audio'], 'recording.webm', { type: 'audio/webm' });
    const result = await speechToText(file, 'de');

    const retryFormData = mockFetch.mock.calls[1][1].body as FormData;
    expect(retryFormData.get('model')).toBe('whisper-large-v3');
    expect(retryFormData.get('language')).toBe('de');
    expect(result.transcription).toBe('Recovered');
  });
});

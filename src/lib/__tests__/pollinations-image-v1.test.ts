import { generatePollinationsImage } from '@/lib/pollinations-image-v1';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('generatePollinationsImage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('posts image generation requests to the v1 endpoint and returns the first URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ url: 'https://example.com/generated.png' }],
      }),
    });

    const imageUrl = await generatePollinationsImage({
      prompt: 'cyberpunk skyline',
      model: 'grok-imagine',
      width: 1024,
      height: 768,
      seed: 42,
      safe: true,
      enhance: true,
      image: ['https://example.com/ref-a.png', 'https://example.com/ref-b.png'],
      apiKey: 'sk_test',
    });

    expect(imageUrl).toBe('https://example.com/generated.png');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://gen.pollinations.ai/v1/images/generations',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk_test',
        }),
      }),
    );

    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
      model: 'grok-imagine',
      prompt: 'cyberpunk skyline',
      size: '1024x768',
      seed: 42,
      safe: true,
      enhance: true,
      image: ['https://example.com/ref-a.png', 'https://example.com/ref-b.png'],
      response_format: 'url',
    });
  });
});

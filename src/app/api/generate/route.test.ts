import { POST } from './route';

const imageUrlMock = jest.fn();
const videoUrlMock = jest.fn();

jest.mock('@/lib/pollinations-sdk', () => ({
  imageUrl: (...args: unknown[]) => imageUrlMock(...args),
  videoUrl: (...args: unknown[]) => videoUrlMock(...args),
}));

jest.mock('@/lib/resolve-pollen-key', () => ({
  resolvePollenKey: jest.fn(() => ''),
}));

describe('/api/generate route', () => {
  const responseJson = jest.fn((body: unknown) => ({
    json: async () => body,
  }));

  beforeEach(() => {
    imageUrlMock.mockReset();
    videoUrlMock.mockReset();
    responseJson.mockClear();
    Object.defineProperty(Response, 'json', {
      configurable: true,
      value: responseJson,
    });
  });

  it('maps the internal grok-image id to the Pollinations grok-imagine id', async () => {
    imageUrlMock.mockResolvedValueOnce('https://example.com/generated.png');

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

    expect(imageUrlMock).toHaveBeenCalledWith(
      'cyberpunk skyline',
      expect.objectContaining({ model: 'grok-imagine' }),
    );
  });
});

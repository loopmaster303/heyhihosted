jest.mock('@/lib/pollen-key', () => ({
  getPollenHeaders: () => ({ 'X-Pollen-Key': 'sk_test' }),
}));

import { uploadFileToPollinationsMedia } from './pollinations-media';

describe('uploadFileToPollinationsMedia', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends raw file bytes to the app route without a multipart boundary dependency', async () => {
    const file = new File(['image-bytes'], 'reference.png', { type: 'image/png' });
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({
        id: 'media-id',
        url: 'https://media.pollinations.ai/media-id',
        contentType: 'image/png',
        size: file.size,
        duplicate: false,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await uploadFileToPollinationsMedia(file, file.name, file.type);

    expect(global.fetch).toHaveBeenCalledWith('/api/media/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'image/png',
        'X-Pollen-Key': 'sk_test',
      },
      body: file,
    });
  });
});

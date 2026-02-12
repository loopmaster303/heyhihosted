import { imageUrl, videoUrl } from '@/lib/pollinations-sdk';

describe('pollinations-sdk shim', () => {
  test('imageUrl includes model, width/height, negative_prompt, image refs and key', async () => {
    const url = await imageUrl('hello world', {
      model: 'flux',
      width: 256,
      height: 128,
      negativePrompt: 'blurry',
      referenceImage: ['https://example.com/a.png', 'https://example.com/b.png'],
      apiKey: 'TESTKEY',
      private: false,
      safe: false,
      nologo: true,
    });

    expect(url).toContain('https://gen.pollinations.ai/image/');
    expect(url).toContain('model=flux');
    expect(url).toContain('width=256');
    expect(url).toContain('height=128');
    expect(url).toContain('negative_prompt=blurry');
    expect(url).toContain('image=https%3A%2F%2Fexample.com%2Fa.png%2Chttps%3A%2F%2Fexample.com%2Fb.png');
    expect(url).toContain('key=TESTKEY');
  });

  test('videoUrl includes model, duration, audio, aspectRatio and key', async () => {
    const url = await videoUrl('make a video', {
      model: 'wan',
      duration: 5,
      audio: true,
      aspectRatio: '16:9',
      apiKey: 'TESTKEY',
    });

    expect(url).toContain('https://gen.pollinations.ai/image/');
    expect(url).toContain('model=wan');
    expect(url).toContain('duration=5');
    expect(url).toContain('audio=true');
    expect(url).toContain('aspectRatio=16%3A9');
    expect(url).toContain('key=TESTKEY');
  });
});


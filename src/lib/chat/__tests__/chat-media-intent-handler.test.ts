import type { GenerateImageOptions } from '@/lib/services/chat-service';

import { processAssistantMediaIntents } from '../chat-media-intent-handler';

const baseInput = () => ({
  rawText: 'intro [IMAGE_GEN: cat] middle [MUSIC_GEN: lofi] outro',
  conversationId: 'conv-1',
  sessionId: 'sess-1',
  selectedImageModelId: 'flux',
  generateImage: jest.fn<Promise<string>, [GenerateImageOptions]>(async (_options: GenerateImageOptions) => 'https://cdn.example.com/cat.png'),
  saveGeneratedAsset: jest.fn(async () => 'asset-1'),
  composeMusic: jest.fn<Promise<string | null>, [string]>(async (_prompt: string) => 'data:audio/mpeg;base64,xxx'),
});

describe('processAssistantMediaIntents', () => {
  it('returns empty parts for empty input', async () => {
    const result = await processAssistantMediaIntents({
      ...baseInput(),
      rawText: '',
    });
    expect(result).toEqual({ cleanText: '', extraParts: [] });
  });

  it('returns empty parts when no markers are present', async () => {
    const result = await processAssistantMediaIntents({
      ...baseInput(),
      rawText: 'just a normal reply with no markers',
    });
    expect(result.extraParts).toEqual([]);
    expect(result.cleanText).toBe('just a normal reply with no markers');
  });

  it('generates an image part and strips the marker from cleanText', async () => {
    const input = baseInput();
    input.rawText = 'Look: [IMAGE_GEN: a cat in space]!';
    const result = await processAssistantMediaIntents(input);
    expect(result.cleanText).toBe('Look: !');
    expect(result.extraParts).toHaveLength(1);
    expect(result.extraParts[0]).toMatchObject({
      type: 'image_url',
      image_url: {
        url: 'https://cdn.example.com/cat.png',
        altText: expect.stringContaining('flux') as unknown as string,
        isGenerated: true,
        metadata: { assetId: 'asset-1' },
      },
    });
    expect(input.generateImage).toHaveBeenCalledWith({
      prompt: 'a cat in space',
      modelId: 'flux',
    });
    expect(input.saveGeneratedAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://cdn.example.com/cat.png',
        prompt: 'a cat in space',
        modelId: 'flux',
        conversationId: 'conv-1',
        sessionId: 'sess-1',
        isVideo: false,
      }),
    );
  });

  it('generates a music part via the compose callback', async () => {
    const input = baseInput();
    input.rawText = 'Listen: [MUSIC_GEN: chillwave piano]';
    const result = await processAssistantMediaIntents(input);
    expect(result.cleanText).toBe('Listen:');
    expect(result.extraParts).toHaveLength(1);
    expect(result.extraParts[0]).toMatchObject({
      type: 'audio_url',
      audio_url: {
        url: 'data:audio/mpeg;base64,xxx',
        altText: expect.stringContaining('chillwave piano') as unknown as string,
        isGenerated: true,
      },
    });
    expect(input.composeMusic).toHaveBeenCalledWith('chillwave piano');
  });

  it('processes multiple markers of mixed kinds in source order', async () => {
    const input = baseInput();
    const result = await processAssistantMediaIntents(input);
    expect(result.cleanText).toBe('intro middle outro');
    expect(result.extraParts).toHaveLength(2);
    expect(result.extraParts[0].type).toBe('image_url');
    expect(result.extraParts[1].type).toBe('audio_url');
  });

  it('skips a music marker gracefully when no compose callback is provided', async () => {
    const input = baseInput();
    const { composeMusic: _ignored, ...rest } = input;
    void _ignored;
    const result = await processAssistantMediaIntents({
      ...rest,
      composeMusic: undefined,
    });
    expect(result.extraParts).toHaveLength(1);
    expect(result.extraParts[0].type).toBe('image_url');
  });

  // Die Deckelung wirkt pro Art: ein zweiter Bild-Marker kommt nicht mehr dran,
  // ein Musik-Marker in derselben Antwort dagegen schon.
  it('isolates a failed image without cancelling the music marker', async () => {
    const input = baseInput();
    input.generateImage = jest.fn<Promise<string>, [GenerateImageOptions]>(async () => {
      throw new Error('upstream down');
    });
    input.rawText = '[IMAGE_GEN: cat] and [IMAGE_GEN: dog] and [MUSIC_GEN: lofi beat]';
    const onError = jest.fn();

    const result = await processAssistantMediaIntents({ ...input, onError });

    expect(onError).toHaveBeenCalledWith('image', 'upstream down');
    // Nur der erste Bild-Marker wird ueberhaupt versucht.
    expect(input.generateImage).toHaveBeenCalledTimes(1);
    expect(input.generateImage).toHaveBeenCalledWith(expect.objectContaining({ prompt: 'cat' }));
    expect(result.extraParts).toHaveLength(1);
    expect(result.extraParts[0].type).toBe('audio_url');
  });

  it('skips an image part if generateImage returns an empty string', async () => {
    const input = baseInput();
    input.generateImage = jest.fn<Promise<string>, [GenerateImageOptions]>(async () => '');
    const result = await processAssistantMediaIntents(input);
    expect(result.extraParts.filter((p) => p.type === 'image_url')).toHaveLength(0);
  });

  it('skips a music part if composeMusic returns null', async () => {
    const input = baseInput();
    input.composeMusic = jest.fn<Promise<string | null>, [string]>(async () => null);
    const result = await processAssistantMediaIntents(input);
    expect(result.extraParts.filter((p) => p.type === 'audio_url')).toHaveLength(0);
  });

  it('marks assets from a Pollinations model as Pollinations-hosted', async () => {
    const input = baseInput();
    input.rawText = '[IMAGE_GEN: a cat]';
    await processAssistantMediaIntents(input);
    expect(input.saveGeneratedAsset).toHaveBeenCalledWith(
      expect.objectContaining({ isPollinations: true }),
    );
  });

  it('does not mark assets from a Pruna model as Pollinations-hosted', async () => {
    const input = baseInput();
    input.rawText = '[IMAGE_GEN: a cat]';
    // zimage is provider 'pruna'; without a Pollen token /api/generate returns
    // raw media, so the URL is a local blob that must be stored as a blob.
    const result = await processAssistantMediaIntents({ ...input, selectedImageModelId: 'zimage' });
    expect(result.extraParts).toHaveLength(1);
    expect(input.saveGeneratedAsset).toHaveBeenCalledWith(
      expect.objectContaining({ isPollinations: false }),
    );
  });

  it('still attaches the image part when saveGeneratedAsset throws', async () => {
    const input = baseInput();
    input.saveGeneratedAsset = jest.fn(async () => {
      throw new Error('db offline');
    });
    const onError = jest.fn();
    const result = await processAssistantMediaIntents({ ...input, onError });
    expect(onError).toHaveBeenCalledWith('audio-save', 'db offline');
    expect(result.extraParts).toHaveLength(2);
    const imagePart = result.extraParts.find((p) => p.type === 'image_url');
    expect(imagePart).toMatchObject({
      type: 'image_url',
      image_url: { url: 'https://cdn.example.com/cat.png' },
    });
  });


  // D1: "Hier drei Varianten" waeren sonst drei Generierungen auf einmal.
  it('generates at most one marker per response', async () => {
    const generateImage = jest.fn().mockResolvedValue('https://x/out.png');
    const saveGeneratedAsset = jest.fn().mockResolvedValue('asset-1');

    const result = await processAssistantMediaIntents({
      rawText: 'Drei Varianten:\n[IMAGE_GEN: fox one]\n[IMAGE_GEN: fox two]\n[IMAGE_GEN: fox three]',
      conversationId: 'c1',
      sessionId: 's1',
      selectedImageModelId: 'flux',
      generateImage,
      saveGeneratedAsset,
    });

    expect(generateImage).toHaveBeenCalledTimes(1);
    expect(generateImage).toHaveBeenCalledWith(expect.objectContaining({ prompt: 'fox one' }));
    expect(result.extraParts).toHaveLength(1);
    // Auch die uebersprungenen Marker duerfen nicht im Text stehenbleiben.
    expect(result.cleanText).not.toContain('IMAGE_GEN');
  });

  it('does not generate for a marker that only appears inside a code block', async () => {
    const generateImage = jest.fn().mockResolvedValue('https://x/out.png');

    const result = await processAssistantMediaIntents({
      rawText: 'Die Syntax lautet:\n\n```\n[IMAGE_GEN: your prompt here]\n```',
      conversationId: 'c1',
      sessionId: 's1',
      selectedImageModelId: 'flux',
      generateImage,
      saveGeneratedAsset: jest.fn(),
    });

    expect(generateImage).not.toHaveBeenCalled();
    expect(result.extraParts).toEqual([]);
  });
});

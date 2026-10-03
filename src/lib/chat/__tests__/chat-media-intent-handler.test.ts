import type { ChatMessageContentPart } from '@/types';
import type { GenerateImageOptions } from '@/lib/services/chat-service';
import {
  CHAT_IMAGE_SIZE,
  interruptPendingMedia,
  markPendingAsInterrupted,
  prepareAssistantMedia,
  resolveImagePart,
} from '../chat-media-intent-handler';

const deps = () => ({
  conversationId: 'conv-1',
  sessionId: 'sess-1',
  generateImage: jest.fn<Promise<string>, [GenerateImageOptions]>(async () => 'https://cdn.example.com/cat.png'),
  saveGeneratedAsset: jest.fn(async () => 'asset-1'),
});

describe('prepareAssistantMedia — Schritt 1, sofort', () => {
  it('returns clean text and no parts when there is no marker', () => {
    expect(prepareAssistantMedia('just a reply', 'flux')).toEqual({ cleanText: 'just a reply', pendingParts: [] });
  });

  it('turns the marker into one pending image part and strips it from the text', () => {
    const result = prepareAssistantMedia('Hier ist dein Fuchs.\n[IMAGE_GEN: a red fox in snow]', 'flux');
    expect(result.cleanText).toBe('Hier ist dein Fuchs.');
    expect(result.pendingParts).toEqual([{
      type: 'image_url',
      image_url: {
        url: '',
        isGenerated: true,
        status: 'pending',
        prompt: 'a red fox in snow',
        modelId: 'flux',
        altText: 'a red fox in snow',
      },
    }]);
  });

  it('caps at one image per answer, whatever the model emits', () => {
    const result = prepareAssistantMedia('[IMAGE_GEN: one] [IMAGE_GEN: two] [IMAGE_GEN: three]', 'flux');
    expect(result.pendingParts).toHaveLength(1);
    expect(result.cleanText).toBe('');
  });

  it('cuts a retired music marker without creating a part', () => {
    const result = prepareAssistantMedia('Gerne. [MUSIC_GEN: lofi beat]', 'flux');
    expect(result).toEqual({ cleanText: 'Gerne.', pendingParts: [] });
  });
});

describe('resolveImagePart — Schritt 2, das Bild entsteht', () => {
  const pending = (): ChatMessageContentPart => prepareAssistantMedia('[IMAGE_GEN: a cat in space]', 'flux').pendingParts[0];

  it('generates square, saves to the pool and returns the finished part', async () => {
    const d = deps();
    const part = await resolveImagePart(pending(), d);
    expect(d.generateImage).toHaveBeenCalledWith({ prompt: 'a cat in space', modelId: 'flux', ...CHAT_IMAGE_SIZE });
    expect(d.saveGeneratedAsset).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://cdn.example.com/cat.png',
      prompt: 'a cat in space',
      modelId: 'flux',
      conversationId: 'conv-1',
      sessionId: 'sess-1',
      isVideo: false,
    }));
    expect(part).toEqual({
      type: 'image_url',
      image_url: {
        url: 'https://cdn.example.com/cat.png',
        isGenerated: true,
        prompt: 'a cat in space',
        modelId: 'flux',
        altText: 'a cat in space',
        metadata: { assetId: 'asset-1' },
      },
    });
  });

  it('never throws: a failed generation becomes an error part in place', async () => {
    const d = deps();
    d.generateImage.mockRejectedValueOnce(new Error('Pollinations antwortet nicht.'));
    const part = await resolveImagePart(pending(), d);
    expect(part).toMatchObject({
      type: 'image_url',
      image_url: { status: 'error', error: 'Pollinations antwortet nicht.', prompt: 'a cat in space', url: '' },
    });
    expect(d.saveGeneratedAsset).not.toHaveBeenCalled();
  });

  it('still shows the image when only the local save fails', async () => {
    const d = deps();
    d.saveGeneratedAsset.mockRejectedValueOnce(new Error('quota'));
    const part = await resolveImagePart(pending(), d);
    expect(part).toMatchObject({ image_url: { url: 'https://cdn.example.com/cat.png' } });
    expect(part.type === 'image_url' && part.image_url.status).toBeFalsy();
  });
});

describe('Reload: ein Platzhalter ohne Lauf', () => {
  it('reads a stored pending part as interrupted, never as an endless placeholder', () => {
    const part = prepareAssistantMedia('[IMAGE_GEN: a cat]', 'flux').pendingParts[0];
    expect(markPendingAsInterrupted(part)).toMatchObject({
      image_url: { status: 'error', error: 'Die Erzeugung wurde unterbrochen.', prompt: 'a cat' },
    });
  });

  it('leaves finished parts and text-only conversations untouched', () => {
    const conversation = {
      messages: [
        { id: 'm1', role: 'assistant' as const, content: 'plain', timestamp: 't' },
        { id: 'm2', role: 'assistant' as const, content: [{ type: 'image_url' as const, image_url: { url: 'https://x/y.png' } }], timestamp: 't' },
      ],
    };
    expect(interruptPendingMedia(conversation)).toBe(conversation);
  });

  it('rewrites only the message that held the pending part', () => {
    const pendingPart = prepareAssistantMedia('[IMAGE_GEN: a cat]', 'flux').pendingParts[0];
    const untouched = { id: 'm1', role: 'user' as const, content: 'hi', timestamp: 't' };
    const conversation = {
      messages: [untouched, { id: 'm2', role: 'assistant' as const, content: [{ type: 'text' as const, text: 'x' }, pendingPart], timestamp: 't' }],
    };
    const next = interruptPendingMedia(conversation);
    expect(next).not.toBe(conversation);
    expect(next.messages[0]).toBe(untouched);
    expect(next.messages[1].content).toEqual([
      { type: 'text', text: 'x' },
      expect.objectContaining({ image_url: expect.objectContaining({ status: 'error' }) }),
    ]);
  });
});

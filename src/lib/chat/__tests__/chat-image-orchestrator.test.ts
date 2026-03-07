import type { ChatMessageContentPart } from '@/types';

import { runImageGenerationFlow } from '../chat-send-orchestrator';

describe('chat image orchestrator', () => {
  it('creates an assistant image message with saved asset metadata', async () => {
    const result = await runImageGenerationFlow({
      imageParams: { prompt: 'draw a cat', modelId: 'nanobanana' },
      selectedImageModelId: 'nanobanana',
      conversationId: 'conv-1',
      sessionId: 'session-1',
      prompt: 'draw a cat',
      isVideo: false,
      generateImage: async () => 'https://cdn.example.com/image.png',
      saveGeneratedAsset: async () => 'asset-1',
      createMessageId: () => 'assistant-1',
      createTimestamp: () => '2026-01-01T00:00:00.000Z',
    });

    expect(result.imageUrl).toBe('https://cdn.example.com/image.png');
    expect(result.generatedAssetId).toBe('asset-1');
    expect((result.aiMessage.content as ChatMessageContentPart[])[0]).toEqual({
      type: 'image_url',
      image_url: {
        url: 'https://cdn.example.com/image.png',
        altText: 'Generated image (nanobanana)',
        isGenerated: true,
        metadata: { assetId: 'asset-1' },
      },
    });
  });

  it('creates a video assistant message when the model kind is video', async () => {
    const result = await runImageGenerationFlow({
      imageParams: { prompt: 'animate a cat', modelId: 'seedance' },
      selectedImageModelId: 'seedance',
      conversationId: 'conv-1',
      sessionId: 'session-1',
      prompt: 'animate a cat',
      isVideo: true,
      generateImage: async () => 'https://cdn.example.com/video.mp4',
      saveGeneratedAsset: async () => 'asset-2',
      createMessageId: () => 'assistant-2',
      createTimestamp: () => '2026-01-01T00:00:00.000Z',
    });

    expect((result.aiMessage.content as ChatMessageContentPart[])[0]).toEqual({
      type: 'video_url',
      video_url: {
        url: 'https://cdn.example.com/video.mp4',
        altText: 'Generated video (seedance)',
        isGenerated: true,
        metadata: { assetId: 'asset-2' },
      },
    });
  });
});

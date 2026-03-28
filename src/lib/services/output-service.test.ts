const saveAssetMock = jest.fn();
const ingestGeneratedAssetMock = jest.fn();

jest.mock('@/lib/services/database', () => ({
  DatabaseService: {
    saveAsset: (...args: unknown[]) => saveAssetMock(...args),
  },
}));

jest.mock('@/lib/upload/ingest', () => ({
  ingestGeneratedAsset: (...args: unknown[]) => ingestGeneratedAssetMock(...args),
}));

jest.mock('@/lib/uuid', () => ({
  generateUUID: jest.fn(() => 'asset-123'),
}));

describe('OutputService.saveGeneratedAsset', () => {
  const flushAsyncWork = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };

  beforeEach(() => {
    saveAssetMock.mockReset();
    ingestGeneratedAssetMock.mockReset();
    saveAssetMock.mockResolvedValue('asset-123');
  });

  it('stores a Pollinations asset with storageKey when ingest succeeds', async () => {
    ingestGeneratedAssetMock.mockResolvedValue({
      key: 'media-key',
      contentType: 'image/png',
    });

    const { OutputService } = await import('./output-service');
    const result = await OutputService.saveGeneratedAsset({
      url: 'https://gen.pollinations.ai/generated.png',
      prompt: 'test prompt',
      modelId: 'flux',
      conversationId: 'conv-1',
      sessionId: 'session-1',
      isPollinations: true,
    });

    expect(result).toBe('asset-123');
    expect(saveAssetMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 'asset-123',
      remoteUrl: 'https://gen.pollinations.ai/generated.png',
      contentType: 'image/jpeg',
    }));

    await flushAsyncWork();

    expect(saveAssetMock).toHaveBeenLastCalledWith(expect.objectContaining({
      id: 'asset-123',
      storageKey: 'media-key',
      contentType: 'image/png',
      remoteUrl: 'https://gen.pollinations.ai/generated.png',
    }));
  });

  it('returns immediately with remoteUrl fallback while ingest is still pending', async () => {
    let resolveIngest: ((value: { key: string; contentType: string }) => void) | undefined;
    ingestGeneratedAssetMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveIngest = resolve;
        }),
    );

    const { OutputService } = await import('./output-service');
    const result = await OutputService.saveGeneratedAsset({
      url: 'https://gen.pollinations.ai/generated.png',
      prompt: 'test prompt',
      modelId: 'flux',
      conversationId: 'conv-1',
      sessionId: 'session-1',
      isPollinations: true,
    });

    expect(result).toBe('asset-123');
    expect(saveAssetMock).toHaveBeenCalledTimes(1);
    expect(saveAssetMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 'asset-123',
      remoteUrl: 'https://gen.pollinations.ai/generated.png',
      contentType: 'image/jpeg',
    }));

    resolveIngest?.({ key: 'media-key', contentType: 'image/png' });
    await flushAsyncWork();
    await flushAsyncWork();

    expect(saveAssetMock).toHaveBeenCalledTimes(2);
    expect(saveAssetMock).toHaveBeenLastCalledWith(expect.objectContaining({
      id: 'asset-123',
      storageKey: 'media-key',
      contentType: 'image/png',
      remoteUrl: 'https://gen.pollinations.ai/generated.png',
    }));
  });

  it('keeps the remoteUrl asset when background ingest fails', async () => {
    ingestGeneratedAssetMock.mockRejectedValue(new Error('Timed out waiting for media'));

    const { OutputService } = await import('./output-service');
    const result = await OutputService.saveGeneratedAsset({
      url: 'https://gen.pollinations.ai/generated.png',
      prompt: 'test prompt',
      modelId: 'flux',
      conversationId: 'conv-1',
      sessionId: 'session-1',
      isPollinations: true,
    });

    expect(result).toBe('asset-123');
    expect(saveAssetMock).toHaveBeenCalledTimes(1);
    expect(saveAssetMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 'asset-123',
      remoteUrl: 'https://gen.pollinations.ai/generated.png',
      contentType: 'image/jpeg',
    }));

    await flushAsyncWork();

    expect(saveAssetMock).toHaveBeenCalledTimes(1);
  });
});

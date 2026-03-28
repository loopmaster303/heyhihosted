const {
  computeNamespaceDrift,
  computeVisualReadiness,
  parseEnhancementPromptIds,
  parseLocalImageConfig,
  parseUnifiedModelConfigIds,
  parseVisibleTextModelIds,
  normalizeUpstreamImageModels,
  normalizeUpstreamTextModels,
} = require('./pollinations-drift-report.js');

describe('pollinations drift report helpers', () => {
  test('normalizes text and image drift while honoring aliases', () => {
    const chatOptionsSource = `
      export const VISIBLE_POLLINATIONS_MODEL_IDS = [
        'gemini-fast',
        'perplexity-fast',
        'nomnom',
        'stale-text',
      ] as const;
    `;

    const imageConfigSource = `
      const POLLINATIONS_MODELS = [
        { id: 'flux', enabled: true },
        { id: 'gpt-image', enabled: true },
        { id: 'grok-image', enabled: true },
        { id: 'legacy-image', enabled: false },
      ];

      const POLLINATIONS_IMAGE_MODEL_ALIASES = {
        'grok-imagine': 'grok-image',
        'z-image': 'zimage',
      };
    `;

    const upstreamTextResponse = {
      data: [
        {
          id: 'gemini-fast',
          output_modalities: ['text'],
          supported_endpoints: ['/v1/chat/completions'],
        },
        {
          id: 'perplexity-fast',
          output_modalities: ['text'],
          supported_endpoints: ['/v1/chat/completions'],
        },
        {
          id: 'nomnom',
          output_modalities: ['text'],
          supported_endpoints: ['/v1/chat/completions'],
        },
        {
          id: 'brand-new-text',
          output_modalities: ['text'],
          supported_endpoints: ['/v1/chat/completions'],
        },
        {
          id: 'image-only-model',
          output_modalities: ['image'],
          supported_endpoints: ['/v1/images/generations'],
        },
      ],
    };

    const upstreamImageResponse = [
      {
        name: 'flux',
        aliases: [],
        output_modalities: ['image'],
      },
      {
        name: 'gptimage',
        aliases: ['gpt-image', 'gpt-image-1-mini'],
        output_modalities: ['image'],
      },
      {
        name: 'grok-imagine',
        aliases: [],
        output_modalities: ['image'],
      },
      {
        name: 'brand-new-image',
        aliases: ['brand-new-image-alias'],
        output_modalities: ['image'],
      },
    ];

    const localText = parseVisibleTextModelIds(chatOptionsSource);
    const localImage = parseLocalImageConfig(imageConfigSource);
    const upstreamText = normalizeUpstreamTextModels(upstreamTextResponse);
    const upstreamImage = normalizeUpstreamImageModels(upstreamImageResponse);

    expect(localText.ids).toEqual([
      'gemini-fast',
      'perplexity-fast',
      'nomnom',
      'stale-text',
    ]);
    expect(localImage.ids).toEqual([
      'flux',
      'gpt-image',
      'grok-image',
      'legacy-image',
    ]);
    expect(localImage.aliasMap).toEqual({
      'grok-imagine': 'grok-image',
      'z-image': 'zimage',
    });
    expect(upstreamText.map((entry: { id: string }) => entry.id)).toEqual([
      'gemini-fast',
      'perplexity-fast',
      'nomnom',
      'brand-new-text',
    ]);
    expect(upstreamImage.map((entry: { id: string }) => entry.id)).toEqual([
      'flux',
      'gptimage',
      'grok-imagine',
      'brand-new-image',
    ]);

    expect(computeNamespaceDrift(localText, upstreamText)).toEqual({
      missingUpstream: ['brand-new-text'],
      staleLocal: ['stale-text'],
    });

    expect(computeNamespaceDrift(localImage, upstreamImage)).toEqual({
      missingUpstream: ['brand-new-image'],
      staleLocal: ['legacy-image'],
    });
  });

  test('classifies hidden local visuals separately from new upstream readiness', () => {
    const imageConfigSource = `
      const POLLINATIONS_MODELS = [
        { id: 'flux', enabled: true },
        { id: 'kontext', enabled: false },
        { id: 'seedance', enabled: false },
      ];

      const POLLINATIONS_IMAGE_MODEL_ALIASES = {
        'flux-kontext-pro': 'kontext',
      };
    `;

    const unifiedModelConfigSource = `
      export const unifiedModelConfigs = {
        'flux': { id: 'flux' },
        'kontext': { id: 'kontext' },
        'seedance': { id: 'seedance' },
        'ready-image': { id: 'ready-image' },
      };
    `;

    const enhancementPromptSource = `
      export const ENHANCEMENT_PROMPTS = {
        'kontext': '...',
        'seedance': '...',
        'ready-image': '...',
      };

      ENHANCEMENT_PROMPTS['flux-kontext-pro'] = ENHANCEMENT_PROMPTS['kontext'];
    `;

    const upstreamImage = normalizeUpstreamImageModels([
      { name: 'flux', output_modalities: ['image'] },
      { name: 'flux-kontext-pro', output_modalities: ['image'] },
      { name: 'seedance', output_modalities: ['video'] },
      { name: 'ready-image', output_modalities: ['image'] },
      { name: 'missing-prompt-model', output_modalities: ['video'] },
    ]);

    const localImage = parseLocalImageConfig(imageConfigSource);
    const localConfigIds = parseUnifiedModelConfigIds(unifiedModelConfigSource);
    const enhancementPromptIds = parseEnhancementPromptIds(enhancementPromptSource);

    expect(localImage.hiddenIds).toEqual(['kontext', 'seedance']);
    expect(localConfigIds).toEqual(['flux', 'kontext', 'seedance', 'ready-image']);
    expect(enhancementPromptIds).toEqual(['flux-kontext-pro', 'kontext', 'ready-image', 'seedance']);

    expect(computeVisualReadiness(localImage, upstreamImage, localConfigIds, enhancementPromptIds)).toEqual({
      hiddenLocalByopVisible: ['kontext', 'seedance'],
      missingEnhancementPrompt: ['missing-prompt-model'],
      commitReady: ['ready-image'],
    });
  });
});

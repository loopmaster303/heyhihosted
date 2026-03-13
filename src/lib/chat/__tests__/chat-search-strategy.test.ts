import { resolveChatSearchStrategy } from '../chat-search-strategy';

describe('resolveChatSearchStrategy', () => {
  it('delegates live-search queries to the live-search model without web-context prefetch', () => {
    expect(resolveChatSearchStrategy({
      modelId: 'gemini-fast',
      userQuery: 'bitcoin price today',
      smartRouterEnabled: true,
      webBrowsingEnabled: false,
    })).toMatchObject({
      routedModelId: 'perplexity-fast',
      shouldFetchWebContext: false,
      strategy: 'delegated-live-search',
    });
  });

  it('delegates deep-research queries to the deep-research model without web-context prefetch', () => {
    expect(resolveChatSearchStrategy({
      modelId: 'gemini-fast',
      userQuery: 'deep research on lithium supply chain',
      smartRouterEnabled: true,
      webBrowsingEnabled: true,
    })).toMatchObject({
      routedModelId: 'nomnom',
      shouldFetchWebContext: false,
      strategy: 'delegated-deep-research',
    });
  });
});

describe('resolveChatSearchStrategy', () => {
  it('delegates live-search queries to the live-search model without web-context prefetch', () => {
    const { resolveChatSearchStrategy } = require('../chat-search-strategy');

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
    const { resolveChatSearchStrategy } = require('../chat-search-strategy');

    expect(resolveChatSearchStrategy({
      modelId: 'gemini-fast',
      userQuery: 'deep research on lithium supply chain',
      smartRouterEnabled: true,
      webBrowsingEnabled: true,
    })).toMatchObject({
      routedModelId: 'perplexity-reasoning',
      shouldFetchWebContext: false,
      strategy: 'delegated-deep-research',
    });
  });

  it('falls back to the next configured live-search model when the preferred one is unavailable', () => {
    jest.resetModules();
    jest.doMock('@/config/chat-options', () => {
      const actual = jest.requireActual('@/config/chat-options');
      return {
        ...actual,
        getPreferredLiveSearchModel: jest.fn(() => 'perplexity-reasoning'),
        getPreferredDeepResearchModel: jest.fn(() => 'perplexity-reasoning'),
      };
    });

    const { resolveChatSearchStrategy } = require('../chat-search-strategy');

    expect(resolveChatSearchStrategy({
      modelId: 'gemini-fast',
      userQuery: 'bitcoin price today',
      smartRouterEnabled: true,
      webBrowsingEnabled: false,
    })).toMatchObject({
      routedModelId: 'perplexity-reasoning',
      shouldFetchWebContext: false,
      strategy: 'delegated-live-search',
    });
  });

  it('falls back to the original model when no live-search router candidate is available', () => {
    jest.resetModules();
    jest.doMock('@/config/chat-options', () => {
      const actual = jest.requireActual('@/config/chat-options');
      return {
        ...actual,
        getPreferredLiveSearchModel: jest.fn(() => undefined),
        getPreferredDeepResearchModel: jest.fn(() => undefined),
      };
    });

    const { resolveChatSearchStrategy } = require('../chat-search-strategy');

    expect(resolveChatSearchStrategy({
      modelId: 'gemini-fast',
      userQuery: 'bitcoin price today',
      smartRouterEnabled: true,
      webBrowsingEnabled: false,
    })).toMatchObject({
      routedModelId: 'gemini-fast',
      shouldFetchWebContext: false,
      strategy: 'delegated-live-search',
    });
  });

  afterEach(() => {
    jest.resetModules();
    jest.dontMock('@/config/chat-options');
  });
});

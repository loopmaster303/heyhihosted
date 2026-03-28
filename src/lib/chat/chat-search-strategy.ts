import { SmartRouter } from '@/lib/services/smart-router';

export type ChatSearchStrategyKind =
  | 'direct'
  | 'delegated-live-search'
  | 'delegated-deep-research';

export interface ResolveChatSearchStrategyOptions {
  modelId: string;
  userQuery: string;
  smartRouterEnabled: boolean;
  webBrowsingEnabled: boolean;
}

export interface ChatSearchStrategy {
  strategy: ChatSearchStrategyKind;
  routedModelId: string;
  shouldFetchWebContext: boolean;
  webContextMode: 'light' | 'deep';
}

export function resolveChatSearchStrategy({
  modelId,
  userQuery,
  smartRouterEnabled,
  webBrowsingEnabled,
}: ResolveChatSearchStrategyOptions): ChatSearchStrategy {
  const normalizedQuery = userQuery.trim();
  const hasMeaningfulQuery = normalizedQuery.length > 3;

  if (!smartRouterEnabled || !hasMeaningfulQuery) {
    return {
      strategy: 'direct',
      routedModelId: modelId,
      shouldFetchWebContext: false,
      webContextMode: 'light',
    };
  }

  if (webBrowsingEnabled) {
    return {
      strategy: 'delegated-deep-research',
      routedModelId: SmartRouter.getDeepResearchModel(modelId) || modelId,
      shouldFetchWebContext: false,
      webContextMode: 'deep',
    };
  }

  if (SmartRouter.shouldRouteToSearch(normalizedQuery)) {
    return {
      strategy: 'delegated-live-search',
      routedModelId: SmartRouter.getLiveSearchModel(modelId) || modelId,
      shouldFetchWebContext: false,
      webContextMode: 'light',
    };
  }

  return {
    strategy: 'direct',
    routedModelId: modelId,
    shouldFetchWebContext: false,
    webContextMode: 'light',
  };
}

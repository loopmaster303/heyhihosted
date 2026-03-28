const fs = require('fs');

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function sortValues(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function parseVisibleTextModelIds(source) {
  const match = source.match(/VISIBLE_POLLINATIONS_MODEL_IDS\s*=\s*\[(.*?)\]\s*as const;/s);
  if (!match) {
    return { ids: [], aliasMap: {} };
  }

  const ids = unique(Array.from(match[1].matchAll(/'([^']+)'/g), (entry) => entry[1]));
  return { ids, aliasMap: {} };
}

function parseLocalImageConfig(source) {
  const ids = unique(Array.from(source.matchAll(/id:\s*'([^']+)'/g), (entry) => entry[1]));
  const hiddenIds = unique(
    Array.from(
      source.matchAll(/\{[\s\S]*?id:\s*'([^']+)'[\s\S]*?enabled:\s*(true|false)[\s\S]*?\}/g),
      (entry) => (entry[2] === 'false' ? entry[1] : null),
    ),
  );
  const aliasBlock = source.match(/POLLINATIONS_IMAGE_MODEL_ALIASES(?:\s*:\s*Record<string,\s*string>)?\s*=\s*\{(.*?)\};/s);
  const aliasEntries = aliasBlock
    ? Array.from(aliasBlock[1].matchAll(/'([^']+)':\s*'([^']+)'/g), (entry) => [entry[1], entry[2]])
    : [];

  return {
    ids,
    hiddenIds,
    aliasMap: Object.fromEntries(aliasEntries),
  };
}

function parseUnifiedModelConfigIds(source) {
  return unique(
    Array.from(
      source.matchAll(/'([^']+)'\s*:\s*\{[\s\S]*?id:\s*'[^']+'[\s\S]*?\}/g),
      (entry) => entry[1],
    ),
  );
}

function parseEnhancementPromptIds(source) {
  const objectKeys = Array.from(source.matchAll(/'([^']+)':\s*[`'"]/g), (entry) => entry[1]);
  const aliasKeys = Array.from(source.matchAll(/ENHANCEMENT_PROMPTS\['([^']+)'\]/g), (entry) => entry[1]);
  return sortValues(unique([...objectKeys, ...aliasKeys]));
}

function normalizeUpstreamTextModels(responseJson) {
  const entries = Array.isArray(responseJson?.data) ? responseJson.data : [];

  return entries
    .filter((entry) => {
      const outputs = Array.isArray(entry?.output_modalities) ? entry.output_modalities : [];
      const endpoints = Array.isArray(entry?.supported_endpoints) ? entry.supported_endpoints : [];
      return outputs.includes('text') && endpoints.includes('/v1/chat/completions') && entry?.id;
    })
    .map((entry) => ({
      id: entry.id,
      aliases: Array.isArray(entry.aliases) ? entry.aliases.filter(Boolean) : [],
    }));
}

function normalizeUpstreamImageModels(responseJson) {
  const entries = Array.isArray(responseJson)
    ? responseJson
    : Array.isArray(responseJson?.data)
      ? responseJson.data
      : Array.isArray(responseJson?.models)
        ? responseJson.models
        : [];

  return entries
    .filter((entry) => {
      const outputs = Array.isArray(entry?.output_modalities) ? entry.output_modalities : [];
      const id = entry?.name || entry?.id;
      return !!id && (outputs.includes('image') || outputs.includes('video'));
    })
    .map((entry) => ({
      id: entry.name || entry.id,
      aliases: Array.isArray(entry.aliases) ? entry.aliases.filter(Boolean) : [],
    }));
}

function computeNamespaceDrift(localNamespace, upstreamModels) {
  const localIds = unique(localNamespace?.ids || []);
  const aliasMap = localNamespace?.aliasMap || {};
  const localCoverageTokens = new Set(localIds);
  const localAliasLookup = new Map();

  Object.entries(aliasMap).forEach(([alias, canonicalId]) => {
    localCoverageTokens.add(alias);
    const aliases = localAliasLookup.get(canonicalId) || [];
    aliases.push(alias);
    localAliasLookup.set(canonicalId, aliases);
  });

  const upstreamCoverageTokens = new Set();
  upstreamModels.forEach((entry) => {
    upstreamCoverageTokens.add(entry.id);
    (entry.aliases || []).forEach((alias) => upstreamCoverageTokens.add(alias));
  });

  const missingUpstream = upstreamModels
    .filter((entry) => {
      const tokens = [entry.id, ...(entry.aliases || [])];
      return !tokens.some((token) => localCoverageTokens.has(token));
    })
    .map((entry) => entry.id);

  const staleLocal = localIds.filter((localId) => {
    const aliases = localAliasLookup.get(localId) || [];
    const tokens = [localId, ...aliases];
    return !tokens.some((token) => upstreamCoverageTokens.has(token));
  });

  return {
    missingUpstream: sortValues(unique(missingUpstream)),
    staleLocal: sortValues(unique(staleLocal)),
  };
}

function computeVisualReadiness(localImage, upstreamModels, localConfigIds, enhancementPromptIds) {
  const localCoverageTokens = new Set(unique(localImage?.ids || []));
  const aliasMap = localImage?.aliasMap || {};
  Object.keys(aliasMap).forEach((alias) => localCoverageTokens.add(alias));

  const localConfigIdSet = new Set(localConfigIds);
  const enhancementPromptIdSet = new Set(enhancementPromptIds);
  const missingEnhancementPrompt = [];
  const commitReady = [];

  upstreamModels.forEach((entry) => {
    const tokens = [entry.id, ...(entry.aliases || [])];
    const isCoveredLocally = tokens.some((token) => localCoverageTokens.has(token));
    if (isCoveredLocally) {
      return;
    }

    const hasLocalConfig = tokens.some((token) => localConfigIdSet.has(token));
    const hasEnhancementPrompt = tokens.some((token) => enhancementPromptIdSet.has(token));

    if (!hasEnhancementPrompt) {
      missingEnhancementPrompt.push(entry.id);
    }
    if (hasLocalConfig && hasEnhancementPrompt) {
      commitReady.push(entry.id);
    }
  });

  return {
    hiddenLocalByopVisible: sortValues(unique(localImage?.hiddenIds || [])),
    missingEnhancementPrompt: sortValues(unique(missingEnhancementPrompt)),
    commitReady: sortValues(unique(commitReady)),
  };
}

function buildDetail(textDrift, imageDrift, visualReadiness) {
  return ` (Text neu: ${textDrift.missingUpstream.length}, stale: ${textDrift.staleLocal.length} | Bild/Video neu: ${imageDrift.missingUpstream.length}, stale: ${imageDrift.staleLocal.length}, prompt-fehlt: ${visualReadiness.missingEnhancementPrompt.length}, commit-ready: ${visualReadiness.commitReady.length})`;
}

function buildShellReport(textDrift, imageDrift, visualReadiness, upstreamText, upstreamImage, apiReachable) {
  const hasDrift = [
    textDrift.missingUpstream.length,
    textDrift.staleLocal.length,
    imageDrift.missingUpstream.length,
    imageDrift.staleLocal.length,
    visualReadiness.missingEnhancementPrompt.length,
  ].some((count) => count > 0);

  const detail = buildDetail(textDrift, imageDrift, visualReadiness);
  const imageNewModels = imageDrift.missingUpstream.join(' ');

  return {
    POLL_API_STATUS: apiReachable ? '✅' : '❌',
    POLL_STATUS: hasDrift ? '⚠️' : '✅',
    POLL_DETAIL: detail,
    POLL_NEW_MODELS: imageNewModels,
    POLL_NEW_TEXT_MODELS: textDrift.missingUpstream.join(' '),
    POLL_STALE_TEXT_MODELS: textDrift.staleLocal.join(' '),
    POLL_STALE_IMAGE_MODELS: imageDrift.staleLocal.join(' '),
    POLL_MISSING_ENHANCEMENT_MODELS: visualReadiness.missingEnhancementPrompt.join(' '),
    POLL_COMMIT_READY_MODELS: visualReadiness.commitReady.join(' '),
    POLL_HIDDEN_LOCAL_VISUAL_MODELS: visualReadiness.hiddenLocalByopVisible.join(' '),
    POLL_UPSTREAM_TEXT_MODELS: upstreamText.map((entry) => entry.id).join(' '),
    POLL_UPSTREAM_VISUAL_MODELS: upstreamImage.map((entry) => entry.id).join(' '),
  };
}

function shellEscape(value) {
  return String(value || '').replace(/'/g, `'\"'\"'`);
}

function printShellAssignments(report) {
  Object.entries(report).forEach(([key, value]) => {
    process.stdout.write(`${key}='${shellEscape(value)}'\n`);
  });
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} -> ${response.status}`);
  }
  return response.json();
}

async function main() {
  const chatOptionsPath = process.argv[2];
  const imageConfigPath = process.argv[3];
  const unifiedModelConfigPath = process.argv[4];
  const enhancementPromptPath = process.argv[5];

  if (!chatOptionsPath || !imageConfigPath || !unifiedModelConfigPath || !enhancementPromptPath) {
    throw new Error('Usage: node pollinations-drift-report.js <chat-options-path> <image-config-path> <unified-model-config-path> <enhancement-prompt-path>');
  }

  const [chatOptionsSource, imageConfigSource, unifiedModelConfigSource, enhancementPromptSource, upstreamTextResponse, upstreamImageResponse] = await Promise.all([
    fs.promises.readFile(chatOptionsPath, 'utf8'),
    fs.promises.readFile(imageConfigPath, 'utf8'),
    fs.promises.readFile(unifiedModelConfigPath, 'utf8'),
    fs.promises.readFile(enhancementPromptPath, 'utf8'),
    fetchJson('https://gen.pollinations.ai/v1/models'),
    fetchJson('https://gen.pollinations.ai/image/models'),
  ]);

  const localText = parseVisibleTextModelIds(chatOptionsSource);
  const localImage = parseLocalImageConfig(imageConfigSource);
  const localConfigIds = parseUnifiedModelConfigIds(unifiedModelConfigSource);
  const enhancementPromptIds = parseEnhancementPromptIds(enhancementPromptSource);
  const upstreamText = normalizeUpstreamTextModels(upstreamTextResponse);
  const upstreamImage = normalizeUpstreamImageModels(upstreamImageResponse);

  const textDrift = computeNamespaceDrift(localText, upstreamText);
  const imageDrift = computeNamespaceDrift(localImage, upstreamImage);
  const visualReadiness = computeVisualReadiness(localImage, upstreamImage, localConfigIds, enhancementPromptIds);
  printShellAssignments(buildShellReport(textDrift, imageDrift, visualReadiness, upstreamText, upstreamImage, true));
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}

module.exports = {
  buildShellReport,
  computeNamespaceDrift,
  computeVisualReadiness,
  normalizeUpstreamImageModels,
  normalizeUpstreamTextModels,
  parseEnhancementPromptIds,
  parseLocalImageConfig,
  parseUnifiedModelConfigIds,
  parseVisibleTextModelIds,
};

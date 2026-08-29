#!/usr/bin/env node
/**
 * Modellwahrheit: Repo-Listen gegen die Live-Pollinations-Registry prüfen.
 *
 * Zieht alle drei Registry-Endpunkte, vergleicht sie mit den im Repo
 * geführten Modell-IDs und meldet jede Abweichung. Exit 1 bei Drift —
 * der wöchentliche GitHub-Action-Lauf nutzt das als Meldung.
 *
 * Optionen:
 *   --update-snapshot   schreibt die Ziehung nach
 *                       src/config/__fixtures__/registry-snapshot.json
 *                       (Testfixture für die offline laufenden Tests T1–T3)
 *
 * Die Modell-Configs werden direkt aus den TS-Quelldateien gelesen
 * (Node 26 strippt Typen nativ). Kein Build nötig.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registerHooks } from 'node:module';
import path from 'node:path';

// Die Config-Dateien importieren untereinander ohne Dateiendung
// (TS-Konvention). Node-ESM braucht hier einen Hook, der .ts ergänzt.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        (specifier.startsWith('./') || specifier.startsWith('../')) &&
        !path.extname(specifier)
      ) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = path.join(ROOT, 'src/config/__fixtures__/registry-snapshot.json');

const ENDPOINTS = {
  image: 'https://gen.pollinations.ai/image/models',
  audio: 'https://gen.pollinations.ai/audio/models',
  text: 'https://gen.pollinations.ai/text/models',
};

const UPDATE_SNAPSHOT = process.argv.includes('--update-snapshot');

async function fetchRegistry(kind, url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${kind}: HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error(`${kind}: unerwartete Antwortform`);
  return data;
}

function matchesRegistryEntry(id, entry) {
  if (!entry) return false;
  return entry.name === id || (Array.isArray(entry.aliases) && entry.aliases.includes(id));
}

function findEntry(registry, id) {
  return (
    registry.find((m) => m.name === id) ??
    registry.find((m) => Array.isArray(m.aliases) && m.aliases.includes(id))
  );
}

async function importConfig(relPath, exportName) {
  const mod = await import(pathToFileURL(path.join(ROOT, relPath)).href);
  return mod[exportName];
}

// Sichtbarkeitsregel aus getVisualizeModelGroups nachgebaut:
// enabled (Default true) oder byopVisible !== false bei includeByopHidden.
// VACE (byopVisible: false) ist damit sauber draußen.
function isTrackedVisualModel(m) {
  const enabled = m.enabled ?? true;
  return enabled || m.byopVisible !== false;
}

function extractComposeModels() {
  const source = readFileSync(path.join(ROOT, 'src/app/api/compose/route.ts'), 'utf8');
  const valid = source.match(/VALID_COMPOSE_MODELS[^=]*=\s*\[([^\]]+)\]/)?.[1] ?? '';
  const free = source.match(/FREE_TIER_MODELS[^=]*=\s*\[([^\]]*)\]/)?.[1] ?? '';
  const parse = (s) =>
    s
      .split(',')
      .map((x) => x.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  return { valid: parse(valid), free: parse(free) };
}

async function main() {
  const [image, audio, text] = await Promise.all(
    Object.entries(ENDPOINTS).map(([kind, url]) => fetchRegistry(kind, url)),
  );

  const fetchedAt = new Date().toISOString();
  const counts = {
    image: { total: image.length, free: image.filter((m) => m.paid_only !== true).length },
    audio: { total: audio.length, free: audio.filter((m) => m.paid_only !== true).length },
    text: { total: text.length, free: text.filter((m) => m.paid_only !== true).length },
  };

  if (UPDATE_SNAPSHOT) {
    mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
    writeFileSync(
      SNAPSHOT_PATH,
      JSON.stringify({ fetchedAt, counts, image, audio, text }, null, 2) + '\n',
    );
    console.log(`Snapshot geschrieben: ${path.relative(ROOT, SNAPSHOT_PATH)} (${fetchedAt})`);
  }

  const unified = await importConfig('src/config/unified-image-models.ts', 'UNIFIED_IMAGE_MODELS');
  const chatIds = await importConfig('src/config/chat-options.ts', 'VISIBLE_POLLINATIONS_MODEL_IDS');
  const chatModels = await importConfig('src/config/chat-options.ts', 'POLLINATIONS_MODELS').catch(
    () => undefined,
  );
  const prunaIds = await importConfig('src/config/pruna-models.ts', 'PRUNA_MODEL_IDS');
  const isPrunaModel = await importConfig('src/config/pruna-models.ts', 'isPrunaModel');
  const compose = extractComposeModels();

  const problems = [];
  const rows = [];

  // --- Bild/Video (Pollinations-Provider) ---
  for (const m of unified) {
    if (m.provider !== 'pollinations') continue;
    if (!isTrackedVisualModel(m)) continue;
    const live = findEntry(image, m.id);
    const where = live ? (live.name === m.id ? 'name' : 'alias') : 'FEHLT';
    rows.push({ list: 'image', id: m.id, live: where, paidOnly: live?.paid_only ?? null, isFree: m.isFree ?? null, enabled: m.enabled ?? true });

    if (!live) {
      problems.push(`[F1] image/${m.id}: nicht in der Live-Registry (weder name noch alias), aber im Repo geführt (enabled: ${m.enabled ?? true})`);
      continue;
    }
    if (m.isFree === true && live.paid_only === true) {
      problems.push(`[F2] image/${m.id}: isFree: true, aber live paid_only`);
    }
    if (m.isFree !== true && live.paid_only !== true && m.enabled !== false) {
      problems.push(`[F3] image/${m.id}: live kostenlos, aber isFree: ${m.isFree ?? '—'} (enabled: ${m.enabled ?? true})`);
    }
  }

  // --- Pruna-Dispatch: jede geführte ID braucht ein Mapping ---
  for (const id of prunaIds) {
    if (!isPrunaModel(id)) {
      problems.push(`[F1] pruna/${id}: keine PRUNA_MODEL_MAP-Zuordnung`);
    }
  }

  // --- Chat (Text) ---
  for (const id of chatIds) {
    const live = findEntry(text, id);
    const where = live ? (live.name === id ? 'name' : 'alias') : 'FEHLT';
    const chatModel = Array.isArray(chatModels) ? chatModels.find((m) => m.id === id) : undefined;
    rows.push({ list: 'text', id, live: where, paidOnly: live?.paid_only ?? null, isFree: chatModel?.isFree ?? null, enabled: true });

    if (!live) {
      problems.push(`[F4] text/${id}: nicht in der Live-Registry, aber in VISIBLE_POLLINATIONS_MODEL_IDS`);
      continue;
    }
    if (chatModel?.isFree === true && live.paid_only === true) {
      problems.push(`[F4] text/${id}: isFree: true, aber live paid_only`);
    }
  }

  // --- Compose (Audio) ---
  for (const id of compose.valid) {
    const live = findEntry(audio, id);
    const where = live ? (live.name === id ? 'name' : 'alias') : 'FEHLT';
    rows.push({ list: 'audio', id, live: where, paidOnly: live?.paid_only ?? null, isFree: compose.free.includes(id) || null, enabled: true });

    if (!live) {
      problems.push(`[F2] audio/${id}: nicht in der Live-Registry, aber in VALID_COMPOSE_MODELS`);
      continue;
    }
    if (compose.free.includes(id) && live.paid_only === true) {
      problems.push(`[F2] audio/${id}: FREE_TIER_MODELS, aber live paid_only`);
    }
  }

  console.log(`\nRegistry-Ziehung ${fetchedAt}`);
  for (const [kind, c] of Object.entries(counts)) {
    console.log(`  ${kind}: ${c.total} Einträge, ${c.free} frei, ${c.total - c.free} paid`);
  }

  console.log(`\nAbgleich (geführte IDs ↔ Live-Registry):`);
  for (const r of rows) {
    const flag = r.live === 'FEHLT' ? '✗' : r.isFree === true && r.paidOnly === true ? '✗' : ' ';
    console.log(
      ` ${flag} ${r.list.padEnd(5)} ${r.id.padEnd(24)} live=${r.live.padEnd(5)} paid_only=${String(r.paidOnly).padEnd(5)} isFree=${r.isFree ?? '—'}`,
    );
  }

  if (problems.length > 0) {
    console.log(`\n${problems.length} Abweichung(en):`);
    for (const p of problems) console.log(`  ${p}`);
    process.exit(1);
  }

  console.log('\nKeine Abweichungen — Modellwahrheit hält.');
}

main().catch((err) => {
  console.error('Registry-Check fehlgeschlagen:', err.message);
  process.exit(1);
});

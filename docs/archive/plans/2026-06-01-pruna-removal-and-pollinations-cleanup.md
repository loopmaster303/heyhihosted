# Plan: Pruna-Entfernung + Pollinations-Konsolidierung

**Branch:** `dashboard/xlinks` → weiter auf diesem Branch  
**Datum:** 2026-06-01  
**Autor:** Claude (zur Verifikation durch User, dann Agent-Execution)  
**Status:** DRAFT — warten auf User-Freigabe

---

## Ziel

Vor dem großen Projekt-Merge simplifiziern: Pruna-Integration komplett entfernen (Backup existiert), verbleibende Pollinations-only-Architektur bereinigen, SDK-Bugs fixen. Kein neues Feature-Scope.

**Out of scope:**
- Mobile Responsiveness
- BYOP-Key XSS (bleibt auf Phase-3-Roadmap)
- ChatInput/ChatProvider-Refactor (läuft separat)
- Dashboard cross-links (dieser Branch, eigener Commit nach Cleanup)

---

## Analyse-Ergebnis

### Warum Pruna raus?

- 9 Dateien, 7 neue Modell-IDs, 1 eigener API-Route, binärer Proxy-Pfad durch chat-service
- Alle Pruna-Modelle sind `isFree: false` — nur mit BYOP-Key nutzbar
- Dasselbe gilt für die entsprechenden Pollinations-nativen Modelle (p-image, qwen-image, wan usw.) — Pruna ist Duplikat-Scope mit Extra-Infrastruktur
- Backup ist vorhanden → kein Risiko

### Was bleibt (Pollinations-only)

Nach Pruna-Entfernung ist die Architektur wieder single-provider:

```
UnifiedImageTool (UI)
  → ChatService.generateImage()
      → /api/generate (Pollinations)
          → pollinations-sdk.ts (imageUrl / videoUrl)
          → pollinations-image-v1.ts (POST-Pfad)
```

Das ist clean. Keine Binary-Proxies, keine Multi-Provider-Switches.

### Bugs die nach Pruna-Entfernung bleiben

| # | Datei | Zeile | Problem |
|---|-------|-------|---------|
| F3 | `chat-send-orchestrator.ts` | 124 | `isPollinations: true` hardcoded |
| F4 | `UnifiedImageTool.tsx` | 134 | `if (formFields.seed)` — Seed=0 wird nie gesendet |
| SDK-A | `pollinations-sdk.ts` | 49/91 | `if (options.seed)` — gleicher Falsy-Bug |
| SDK-B | `pollinations-sdk.ts` | 9/85 | `videoUrl()` nutzt `BASE_URL = gen.pollinations.ai/image` — für Video womöglich falsch, verifizieren |

---

## Aufgaben (sequenziell, Agent kann sie in Reihenfolge abarbeiten)

### Phase 1 — Pruna entfernen

**Aufgabe 1.1 — `src/app/api/pruna/route.ts` löschen**
```
Datei komplett löschen.
Verify: `find src/app/api/pruna -type f` → leer
```

**Aufgabe 1.2 — `src/config/unified-image-models.ts` bereinigen**

Änderungen:
- `PRUNA_MODELS[]`-Array komplett entfernen (Zeilen 162–258)
- `ImageProvider` type: `'pollinations' | 'pruna'` → `'pollinations'`
- `prunaModelId?: string` field aus `UnifiedImageModel` interface entfernen
- `UNIFIED_IMAGE_MODELS = [...POLLINATIONS_MODELS, ...PRUNA_MODELS]` → `= POLLINATIONS_MODELS`
- `getModelsByProvider()` bleibt (parameter-kompatibel), aber der `'pruna'`-Zweig wird nie mehr aufgerufen

Verify: `grep -n "pruna\|PRUNA" src/config/unified-image-models.ts` → kein Treffer

**Aufgabe 1.3 — `src/config/unified-model-configs.ts` bereinigen**

Suche: alle Einträge mit Key `'pruna-p-image'`, `'pruna-p-image-edit'`, `'pruna-wan-i2v'`, `'pruna-wan-t2v'`, `'pruna-qwen-image'`, `'pruna-qwen-image-edit'`, `'pruna-p-video'` entfernen.

Verify: `grep -n "pruna" src/config/unified-model-configs.ts` → kein Treffer

**Aufgabe 1.4 — `src/config/ui-constants.ts` bereinigen**

Suche: alle Icon-Einträge für `'pruna-p-image'`, `'pruna-p-image-edit'`, `'pruna-wan-i2v'`, `'pruna-wan-t2v'`, `'pruna-qwen-image'`, `'pruna-qwen-image-edit'`, `'pruna-p-video'` entfernen.

Verify: `grep -n "pruna" src/config/ui-constants.ts` → kein Treffer

**Aufgabe 1.5 — `src/config/enhancement-prompts.ts` bereinigen**

Zeilen 1043–1047 entfernen:
```typescript
ENHANCEMENT_PROMPTS['pruna'] = ENHANCEMENT_PROMPTS['p-image'];
ENHANCEMENT_PROMPTS['pruna-image'] = ENHANCEMENT_PROMPTS['p-image'];
ENHANCEMENT_PROMPTS['pruna-edit'] = ENHANCEMENT_PROMPTS['p-image-edit'];
ENHANCEMENT_PROMPTS['pruna-image-edit'] = ENHANCEMENT_PROMPTS['p-image-edit'];
ENHANCEMENT_PROMPTS['pruna-video'] = ENHANCEMENT_PROMPTS['p-video'];
```

Verify: `grep -n "pruna" src/config/enhancement-prompts.ts` → kein Treffer

**Aufgabe 1.6 — `src/lib/services/chat-service.ts` bereinigen**

Entfernen:
- Zeile 113: `const isPruna = modelInfo?.provider === 'pruna';`
- Zeile 114: `const endpoint = isPruna ? '/api/pruna' : '/api/generate';` → `const endpoint = '/api/generate';`
- Zeilen 118–126: kompletter `if (isPruna) { ... }` Block mit Pruna-spezifischen Body-Feldern
- Zeilen 162–175: Binary-Content-Type-Branch (war nur für Pruna-Binary-Response):
  ```typescript
  // WEG:
  const responseContentType = response.headers.get('content-type') || '';
  if (responseContentType.includes('image/') || responseContentType.includes('video/')) {
      if (!response.ok) throw new Error('Pruna generation failed.');
      const blob = await response.blob();
      ...
      return media.mediaUrl;
  }
  ```
- Import von `uploadFileToPollinationsMedia` und `getClientSessionId` entfernen, falls danach ungenutzt

Nach Cleanup sieht `generateImage` so aus: POST an `/api/generate`, `response.ok`-Check, JSON-Parsing, `result.videoUrl || result.imageUrl || result.output`.

Verify: `grep -n "isPruna\|pruna\|PRUNA\|uploadFileToPollinationsMedia" src/lib/services/chat-service.ts` → kein Treffer (außer falls `uploadFileToPollinationsMedia` anderswo noch gebraucht wird — prüfen)

**Aufgabe 1.7 — `src/hooks/useUnifiedImageToolState.ts` bereinigen**

Entfernen:
- `isPrunaModel` Memo (Zeile 114–117)
- `isPrunaVideo` abgeleitete Variable (Zeile 119)
- `isPrunaQwen` (Zeile 120)
- Pruna-spezifische Branches in der Attachment-Anzahl-Logik (Zeilen 185–198)
- Alle drei aus dem Return-Objekt (Zeilen 387–389)

Zeile 20: Provider-Filter für Reference-Model-Auswahl:
```typescript
// VORHER:
.filter(model => (model.provider === 'pollinations' || model.provider === 'pruna') && model.supportsReference === true)
// NACHHER:
.filter(model => model.provider === 'pollinations' && model.supportsReference === true)
```

Verify: `grep -n "pruna\|isPruna\|PRUNA" src/hooks/useUnifiedImageToolState.ts` → kein Treffer

**Aufgabe 1.8 — `src/components/tools/visualize/VisualizeInlineHeader.tsx` bereinigen**

Zeile 295: Provider-Check vereinfachen:
```typescript
// VORHER:
currentModelConfig.outputType === 'video' && (getUnifiedModel(selectedModelId)?.provider === 'pollinations' || getUnifiedModel(selectedModelId)?.provider === 'pruna')
// NACHHER:
currentModelConfig.outputType === 'video' && getUnifiedModel(selectedModelId)?.provider === 'pollinations'
```

Verify: `grep -n "pruna\|PRUNA" src/components/tools/visualize/VisualizeInlineHeader.tsx` → kein Treffer

**Aufgabe 1.9 — `src/app/api/enhance-prompt/route.ts` prüfen**

`grep -n "pruna" src/app/api/enhance-prompt/route.ts` ausführen und alle Treffer entfernen.

**Aufgabe 1.10 — Build + TypeCheck nach Phase 1**
```bash
npm run typecheck && npm run build
```
Kein Fehler → Phase 1 abgeschlossen.

---

### Phase 2 — Verbleibende Pollinations-Bugs fixen

**Aufgabe 2.1 — F3: `isPollinations` im Orchestrator aus Config ableiten**

Datei: `src/lib/chat/chat-send-orchestrator.ts`, Zeile 124

```typescript
// VORHER:
isPollinations: true,
// NACHHER:
isPollinations: !getUnifiedModel(input.selectedImageModelId)?.provider ||
               getUnifiedModel(input.selectedImageModelId)?.provider === 'pollinations',
```

Import hinzufügen falls nötig: `import { getUnifiedModel } from '@/config/unified-image-models';`

Verify: `grep -n "isPollinations" src/lib/chat/chat-send-orchestrator.ts` → kein hardcoded `true`

**Aufgabe 2.2 — F4: Seed=0 Falsy-Fix in `UnifiedImageTool.tsx`**

Datei: `src/components/tools/UnifiedImageTool.tsx`, Zeile 134

```typescript
// VORHER:
if (formFields.seed) payload.seed = Number(formFields.seed);
// NACHHER:
if (formFields.seed != null && formFields.seed !== '') payload.seed = Number(formFields.seed);
```

**Aufgabe 2.3 — SDK Seed-Fix in `pollinations-sdk.ts`**

Beide Funktionen `imageUrl()` und `videoUrl()`, Zeile ca. 49 und 91:

```typescript
// VORHER:
if (options.seed) params.append('seed', String(options.seed));
// NACHHER:
if (options.seed != null) params.append('seed', String(options.seed));
```

**Aufgabe 2.4 — SDK Video-Endpoint prüfen (VERIFY ONLY, kein Blind-Fix)**

`pollinations-sdk.ts` Zeile 9: `const BASE_URL = "https://gen.pollinations.ai/image";`

`videoUrl()` nutzt denselben BASE_URL wie `imageUrl()`. Das kann korrekt sein (Pollinations-Unified-Endpoint mit Model-Param), muss aber verifiziert werden:

```bash
# Kurz-Test — gibt 200 zurück?
curl -o /dev/null -s -w "%{http_code}" \
  "https://gen.pollinations.ai/image/test?model=wan&duration=5&private=false&safe=false&nologo=true"
```

- Wenn 200 → BASE_URL für Video ist korrekt, kein Fix nötig
- Wenn 4xx/5xx → `videoUrl()` bekommt eigene BASE_URL `https://gen.pollinations.ai/video`

**Aufgabe 2.5 — TypeCheck nach Phase 2**
```bash
npm run typecheck
```

---

### Phase 3 — Abschluss

**Aufgabe 3.1 — Linting**
```bash
npm run lint
```

**Aufgabe 3.2 — Tests**
```bash
CI=1 npm test -- --runInBand
```

Bekannte Lücke: Tests auf Pruna-Route existieren nicht → kein Grünbalken der wegfällt.

**Aufgabe 3.3 — Commit**
```
chore: remove Pruna provider, fix seed=0 and isPollinations flag

- Removes src/app/api/pruna/route.ts and all 7 pruna-* model entries
- Simplifies chat-service.ts: single /api/generate endpoint, no binary proxy
- Derives isPollinations from model config instead of hardcoding true
- Fixes seed=0 falsy bug in UnifiedImageTool and pollinations-sdk
```

---

## Betroffene Dateien (Überblick)

| Datei | Aktion |
|-------|--------|
| `src/app/api/pruna/route.ts` | löschen |
| `src/config/unified-image-models.ts` | PRUNA_MODELS, type, prunaModelId entfernen |
| `src/config/unified-model-configs.ts` | 7 pruna-* entries entfernen |
| `src/config/ui-constants.ts` | 7 pruna icon entries entfernen |
| `src/config/enhancement-prompts.ts` | 5 pruna-* Aliase entfernen |
| `src/lib/services/chat-service.ts` | isPruna-Branch + Binary-Proxy entfernen |
| `src/components/tools/UnifiedImageTool.tsx` | Seed-Fix, Pruna-Branch entfernen |
| `src/hooks/useUnifiedImageToolState.ts` | isPrunaModel, isPrunaVideo, isPrunaQwen entfernen |
| `src/components/tools/visualize/VisualizeInlineHeader.tsx` | Provider-Check vereinfachen |
| `src/app/api/enhance-prompt/route.ts` | pruna-Referenzen entfernen |
| `src/lib/chat/chat-send-orchestrator.ts` | isPollinations aus Config ableiten |
| `src/lib/pollinations-sdk.ts` | Seed-Fix, Video-Endpoint verifizieren |

**Nicht angefasst:** `CLAUDE.md`, `MEMORY.md`, alle anderen Komponenten, alle Test-Dateien außer Pruna-relevante.

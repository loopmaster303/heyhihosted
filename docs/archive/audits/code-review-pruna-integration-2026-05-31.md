# Code Review — Pruna Integration (2026-05-31)

Branch: `feat/pruna-integration`  
Scope: Uncommitted working-tree diff, 9 Dateien  
Effort: high (7 Finder-Agenten × 6 Kandidaten + Verifier)

---

## Findings (gereiht nach Schwere)

### 1. CONFIRMED — Kein `response.ok`-Check vor `blob()` in `UnifiedImageTool`

**Datei:** `src/components/tools/UnifiedImageTool.tsx:176`

Fehler-Responses vom Pruna-Endpoint (z.B. HTTP 402/422/500) mit `Content-Type: image/jpeg` werden als valides Bild behandelt: der Body wird als Blob gelesen, zu Pollinations Media hochgeladen und als Erfolg-Asset gespeichert.

`chat-service.ts` macht es korrekt (`if (!response.ok) throw` vor `blob()`). Inkonsistenz ist konstruktiv belegt.

**Fix:**
```typescript
if (contentType && (contentType.includes('image/') || contentType.includes('video/'))) {
+   if (!response.ok) throw new Error(`Generation failed (${response.status})`);
    const blob = await response.blob();
    ...
}
```

---

### 2. PLAUSIBLE — Enhancer-Modell-IDs `'claude'`/`'gemini'` lokal unregistriert

**Datei:** `src/app/api/enhance-prompt/route.ts:317`

IDs wurden von `'claude-fast'`/`'gemini-fast'` auf `'claude'`/`'gemini'` geändert. `chat-options.ts` kennt nur die `-fast`-Varianten. `getPollinationsChatCompletion` schickt die ID direkt als `model`-Parameter an `gen.pollinations.ai` ohne lokale Validierung. Falls der Upstream-Alias unbekannt ist, schlägt Enhancement still fehl.

---

### 3. PLAUSIBLE — `isPollinations: true` hardcoded im Chat-Orchestrator

**Datei:** `src/lib/chat/chat-send-orchestrator.ts:124`

`runImageGenerationFlow` übergibt `isPollinations: true` an `saveGeneratedAsset` — unabhängig vom gewählten Modell. Pruna-Assets werden im Chat-Flow als Pollinations-Assets klassifiziert. Da `chat-service.ts` Pruna-Binaries bereits zu Pollinations Media hochlädt, ist der aktuelle Impact begrenzt — aber jede zukünftige `isPollinations ? X : Y`-Verzweigung in OutputService liefert für Pruna das falsche Ergebnis.

**Fix:**
```typescript
isPollinations: !getUnifiedModel(input.selectedImageModelId)?.provider || 
               getUnifiedModel(input.selectedImageModelId)?.provider === 'pollinations',
```

---

### 4. PLAUSIBLE — Seed `0` wird nicht gesendet (falsy-Check)

**Datei:** `src/components/tools/UnifiedImageTool.tsx:134`

```typescript
if (formFields.seed) payload.seed = Number(formFields.seed);
```

Wenn `formFields.seed` als Number `0` im State liegt, evaluiert der Check zu `false` — `payload.seed` bleibt ungesetzt, API generiert mit Zufalls-Seed.

**Fix:** `if (formFields.seed != null && formFields.seed !== '') payload.seed = Number(formFields.seed);`

---

### 5. PLAUSIBLE — `image_url` überschreibt `image` still

**Datei:** `src/lib/services/chat-service.ts:120`

```typescript
if (options.image) body.image = options.image;
if (options.image_url) body.image = options.image_url;  // überschreibt
```

Identisches Muster im Pollinations-Zweig (Zeilen 145–148), dort zusätzlich `input_image` und `input_images`. Letzter Schreiber gewinnt kommentarlos.

---

### 6. PLAUSIBLE — `PRUNA_MODEL_MAP` in `route.ts` dupliziert `prunaModelId` aus Config

**Datei:** `src/app/api/pruna/route.ts:12`

Zwei synchronisierte Maps für dasselbe ID-Mapping:
- `unified-image-models.ts`: `prunaModelId: 'p-image'` (strukturiertes Feld)
- `route.ts`: `PRUNA_MODEL_MAP = { 'pruna-p-image': 'p-image', ... }` (hartcodierte Kopie)

Neues Modell in Config eingetragen aber `PRUNA_MODEL_MAP` vergessen → Route wirft `Unknown Pruna model`.

---

### 7. PLAUSIBLE — `isPrunaQwen` hardcoded statt Feature-Flag

**Datei:** `src/hooks/useUnifiedImageToolState.ts:120`

```typescript
const isPrunaQwen = selectedModelId === 'pruna-qwen-image';
```

`unified-image-models.ts` hat `supportsPromptEnhance: true` genau für diesen Zweck. `VisualizeInlineHeader.tsx` nutzt das Flag direkt korrekt. `isPrunaQwen` im Hook ist eine zweite, divergierende Wahrheitsquelle.

---

### 8. Efficiency — Erster Poll schläft immer 5 s bevor er prüft

**Datei:** `src/app/api/pruna/route.ts:147`

```typescript
for (let i = 0; i < 48; i++) {
    await new Promise(r => setTimeout(r, 5000));  // sleep FIRST
    const res = await fetch(status_url);
```

Schnelle Modelle (p-image, qwen-image < 5 s) warten unnötig. Fix: ersten Poll sofort, danach mit Sleep.

---

### 9. Simplification — Doppelte `modelInfo`-Deklaration (toter Code)

**Datei:** `src/components/tools/UnifiedImageTool.tsx:74`

`modelInfo` wird auf Zeile 74 (außerhalb try) und identisch auf Zeile 112 (innerhalb try) deklariert. Die innere Deklaration überschattet die äußere vollständig — Zeile 74 ist toter Code und erzeugt einen redundanten `getUnifiedModel`-Aufruf.

---

### 10. PLAUSIBLE — `duration ?? 5` → 81 Frames statt 113 bei direkten API-Aufrufen

**Datei:** `src/app/api/pruna/route.ts:66`

```typescript
const DURATION_TO_FRAMES: Record<number, number> = { 7: 113 };
const numFrames = DURATION_TO_FRAMES[duration ?? 5] ?? 81;
```

Bei `duration = undefined` (direkter API-Aufruf ohne UI) ergibt `DURATION_TO_FRAMES[5] = undefined → 81` statt 113 Frames (7 s Wan-Default). `chat-service.ts` und die UI schützen im Normalfall, aber direkter API-Aufruf (Tests, programmatische Caller) trifft den Bug.

---

## Refuted

- **`pruna/route.ts:66` als Chat-Pfad-Bug**: `chat-service.ts` setzt `body.duration = durationRange.options[0]` (= 7) wenn `options.duration` fehlt. UI bietet nur 7 als Option an. Praktisch nicht erreichbar im normalen Flow.

---

## Priorisierung

| Priorität | Finding | Aktion |
|-----------|---------|--------|
| P0 | #1 — kein ok-Check vor blob() | Fix vor Merge |
| P1 | #2 — Enhancer-Model-IDs | Verifizieren ob Pollinations 'claude'/'gemini' kennt |
| P1 | #3 — isPollinations hardcoded | Fix im Orchestrator |
| P2 | #4 — Seed 0 falsy | Fix (1 Zeile) |
| P2 | #5 — image_url überschreibt image | Absicht dokumentieren oder fix |
| P3 | #6 — PRUNA_MODEL_MAP dupliziert | Refactor: Map aus Config ableiten |
| P3 | #7 — isPrunaQwen hardcoded | `supportsPromptEnhance` nutzen |
| P4 | #8 — Poll sleep-first | Optimierung |
| P4 | #9 — toter Code | Cleanup |
| P4 | #10 — Frames-Fallback | Nur relevant für direkte API-Nutzung |

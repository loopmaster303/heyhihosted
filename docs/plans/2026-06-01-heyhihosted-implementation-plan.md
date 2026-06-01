# Implementierungsplan — heyhihosted

**Stand:** 2026-06-01  
**Branch:** `dashboard/xlinks` (clean, Phase 0 committed)  
**Build:** ✅ clean  
**Tests:** 45/45 fail (Jest/Vitest-Konfiguration, wird in Phase 0 gefixt)  
**Deployment:** hey-hi.space → 200 OK, live  
**Codebase:** 207 TS/TSX, 44 Tests, 11 API-Routes, 749 LOC ChatProvider

---

## Grundregeln

1. **Keine neuen Features auf kaputtem Fundament.** Tests broken + Enhancer-Bug = Phase 0.
2. **ChatProvider.tsx wächst nicht.** Neue Logik kommt in eigene Module. 749 LOC ist das Maximum.
3. **Server entscheidet über Routing.** Client sendet Nachricht + Modell-Wahl. Server re-routet wenn nötig. Kein `forceModel` vom Client.
4. **Ein Musik-Pfad, nicht zwei.** Konsolidieren vor Erweitern.
5. **chat-options.ts ist ein Engpass.** Nie parallel von zwei Agents bearbeiten. Sequenzierung erzwingen.
6. **System-Prompts sind heilig.** Seele bleibt. Nur FEATURE_GUIDANCE wird umgeschrieben. Nur Fakten-Updates im Rest.

---

## Phase 0 — Fundament reparieren (VOR ALLEM ANDEREN)

### 0.1 Creative Director Bug — KRITISCH (~15min)

**Datei:** `src/config/chat-options.ts` (Zeile 437)  
**Bug:** Template-Literals escaped: `\${SHARED_SAFETY_PROTOCOL}` statt `${SHARED_SAFETY_PROTOCOL}`.  
Der Creative Director läuft aktuell **ohne Safety Protocol und ohne Identity Protocol**.

**Fix:** Backslashes vor `${SHARED_SAFETY_PROTOCOL}`, `${SYSTEM_IDENTITY_PROTOCOL}`, `${FEATURE_GUIDANCE}`, `${OUTPUT_LANGUAGE_GUARD}` entfernen.

→ verify: Creative Director Prompt enthält `<safety_protocol>` und `<system_identity>` Blöcke

### 0.2 Enhancer-IDs fixen (~30min)

**Datei:** `src/config/enhancement-prompts.ts`  
**Bug:** Enhancer-IDs `'claude'` und `'gemini'` existieren nicht in der Registry — `chat-options.ts` kennt nur `claude-fast` und `gemini-fast`. Prompt-Enhancement schlägt still fehl für diese Modelle.

**Fix:** ID-Mapping hinzufügen oder IDs auf registrierte Varianten normalisieren.

→ verify: Enhancement funktioniert für alle sichtbaren Modelle

### 0.3 Tests — minimaler Fix (~1h)

**Datei:** `vitest.config.ts`  
**Problem:** Tests nutzen `jest.fn()`, Vitest kennt das nicht.  
**Lösung:** `@vitest/globals` + `globals: true` in vitest.config.ts. Kein Test-Refactor jetzt.

```bash
npm install -D @vitest/globals
# vitest.config.ts: test: { globals: true }
```

**Ziel:** >80% grün. Rote Tests einzeln prüfen ob echte Bugs oder nur Jest-Syntax.

→ verify: `npm test` → Majorität grün

---

## Phase 1 — Model-Registry aufräumen (~1h)

Kein ChatProvider-Touch. Unabhängig. Parallelisierbar mit Phase 0.

### 1.1 Image/Video-Modelle

**Datei:** `src/config/unified-image-models.ts` (382 LOC)

Free-Status korrigieren (API bestätigt 2026-06-01):
- `kontext` → `isFree: true, enabled: true`
- `gptimage-large` → `isFree: true, enabled: true`
- `qwen-image` → `isFree: true, enabled: true`
- `wan-image` → hinzufügen (free, bis 2K, `0.0525 🌼/img`)
- `nova-canvas` → hinzufügen (free, Inpainting, `0.04 🌼/img`)

Video:
- `ltx-2` → `isFree: true, enabled: true` (T2V+I2V, `0.005 🌼/s`)
- `nova-reel` → hinzufügen (free, 6–120s, `0.08 🌼/s`)

ID-Fixes:
- `seedance` → `seedance-pro` (API-ID)
- `seedream` → prüfen ob `seedream` oder `seedream5` die aktuelle ID ist

Paid-Modelle korrekt markieren:
- `gpt-image-2`, `nanobanana/-2/-pro`, `seedream-pro`, `grok-imagine/-pro`, `wan-image-pro`, `p-image/-edit`
- `veo`, `seedance-2.0`, `wan/-fast/-pro`, `grok-video-pro`, `p-video`

### 1.2 Text-Modelle

**Datei:** `src/config/chat-options.ts` — NUR den `ALL_POLLINATIONS_MODELS` Array und `VISIBLE_POLLINATIONS_MODEL_IDS`

Neue Modelle hinzufügen, aber **in separater Kategorie** — nicht default-sichtbar:
- `gpt-5.4-mini`, `gpt-5.5`, `claude`, `claude-large`
- `gemini-3.5-flash`, `gemini-search-fast`, `grok`, `grok-4.3`
- `deepseek-pro`, `mistral-4`, `kimi-k2.6`, `llama-maverick`

`VISIBLE_POLLINATIONS_MODEL_IDS` konservativ erweitern — nur 2-3 neue ins Default-Set.

**WICHTIG:** Keine System-Prompt-Änderungen in diesem Commit. chat-options.ts nur für Modell-Arrays anfassen.

→ verify: build, Dropdowns korrekt

---

## Phase 2 — In-Chat Bildgenerierung (~3–4h)

### 2.1 Media-Intent-Parser (eigenes Modul)

**Neue Datei:** `src/lib/chat/chat-media-intent.ts`

```typescript
export interface MediaMarker {
  type: 'image' | 'music';
  prompt: string;
  cleanText: string;  // Antwort ohne Marker
}

export function parseMediaMarker(responseText: string): MediaMarker | null;
```

Parst `[IMAGE_GEN: <prompt>]` und `[MUSIC_GEN: <prompt>]` aus der LLM-Antwort.  
Gibt den bereinigten Text zurück (ohne Marker).

**Tests schreiben:** Das ist die einzige neue Logik die testbar sein muss.

**Neue Datei:** `src/lib/chat/chat-media-intent.test.ts`
- Marker am Anfang → parsed
- Marker in der Mitte → parsed
- Kein Marker → null
- Malformed Marker → null
- Escape-Sequenzen in Prompt

### 2.2 System-Prompt-Ergänzung (minimal)

**Datei:** `src/config/chat-options.ts` — NUR den `FEATURE_GUIDANCE` Block

Ergänzen (nicht ersetzen — das kommt in Phase 3):
```xml
<image_generation>
    Wenn der User ein Bild möchte, beginne deine Antwort mit:
    [IMAGE_GEN: <optimierter englischer Prompt für Bildgenerierung>]
    Dann schreibe deine normale Textantwort.
    Generiere NUR wenn der User explizit nach einem Bild fragt.
</image_generation>
```

### 2.3 ChatProvider-Integration (minimal)

**Datei:** `src/components/ChatProvider.tsx`  
**Was:** In der Response-Handler-Stelle (nach `getPollinationsChatCompletion`):

```typescript
import { parseMediaMarker } from '@/lib/chat/chat-media-intent';

// Nach Response:
const marker = parseMediaMarker(response.responseText);
if (marker?.type === 'image') {
  // 1. Bereinigten Text rendern
  // 2. generateImage(marker.prompt) aufrufen — bestehende Logik
  // 3. Asset in Dexie speichern
}
```

Maximal 10–15 neue Zeilen in ChatProvider. Logik lebt in `chat-media-intent.ts`.

### 2.4 Inline-Bild-Component

**Neue Datei:** `src/components/chat/InlineChatImage.tsx`

Zeigt generiertes Bild direkt in der Chat-Bubble. Klick → Gallery-Detail.  
Props: `assetId`, `imageUrl`, `prompt`.  
Kein eigener State — bekommt alles von oben.

→ verify: "Zeig mir einen Sonnenuntergang" → Text + Bild im Chat. Bild in Gallery.

---

## Phase 3 — System-Prompts modernisieren (~2h)

**Nach Phase 2 committed.** Dann kein Merge-Konflikt in chat-options.ts.

### 3.1 FEATURE_GUIDANCE ersetzen

**Datei:** `src/config/chat-options.ts` (Zeile 271–296)

**Alter Block:** Beschreibt UI-Klickwege ("Tools → Visualize (pinkes Icon)").  
**Neuer Block:** UI-entkoppelt, beschreibt Fähigkeiten:

```xml
<feature_guidance>
    <bildgenerierung>
        Bilder entstehen direkt im Chat. Wenn der User nach einem Bild fragt,
        beginne deine Antwort mit [IMAGE_GEN: <englischer Prompt>].
        Der User muss nichts konfigurieren. Kein separates Tool nötig.
        Generiere NUR wenn der User explizit nach einem Bild fragt.
    </bildgenerierung>
    <web_suche>
        Web-Suche passiert automatisch wenn die Anfrage aktuelle Informationen braucht.
        Du musst den User nicht darauf hinweisen dass du suchst.
    </web_suche>
    <sprache>
        Spracheingabe (Mikrofon) und Sprachausgabe (Vorlesen) sind verfügbar.
        Der User kann dich auch per Sprache ansprechen.
    </sprache>
    <musik>
        Musik kann im Chat generiert werden. Wenn der User Musik möchte,
        beginne deine Antwort mit [MUSIC_GEN: <Beschreibung>].
    </musik>
    <anleitung>
        Wenn ein User fragt "Wie mache ich X?" oder "Was kann hey.hi?",
        beschreibe die Fähigkeit kurz (2-3 Sätze). Keine Klickwege — die UI erklärt sich selbst.
    </anleitung>
</feature_guidance>
```

### 3.2 Response-Styles — NUR FEATURE_GUIDANCE tauschen

**6 Styles:** Basic, Precise, Deep Dive, Emotional Support, Philosophical, Creative Director.

Für jeden Style:
- `${FEATURE_GUIDANCE}` referenziert automatisch den neuen Block ✅
- Persönlichkeit, Few-Shots, Constraints: **NICHT ANFASSEN**
- Identity, Safety, Machine Honesty: **NICHT ANFASSEN**

### 3.3 Creative Director — faktische Updates

**Datei:** `src/config/chat-options.ts` (Zeile 437–529)

**Template-Literal-Bug:** Ist in Phase 0.1 schon gefixt.

**domain_knowledge aktualisieren:**
- Entfernen: `suno-v5`, `p-image`, `p-image-edit` (nicht mehr aktiv)
- Entfernen: alle `(BYOP)` Labels
- Hinzufügen: `ltx-2` bei Video (free, T2V+I2V)
- Hinzufügen: `nova-canvas`, `wan-image` bei Image
- `kontext`, `gptimage-large` → kein BYOP-Label mehr
- WEBAPP WORKFLOW: Ersetzen durch "Bilder/Videos/Musik entstehen direkt im Chat."

**NICHT ANFASSEN:** taboo_protocol, decision_protocol, output_format, behavior_rules, identity.

→ verify: Jeder Style produziert sinnvolle Antworten mit neuem FEATURE_GUIDANCE

---

## Phase 4 — Web-Search Auto-Routing (~1–2h)

### Server-Side only

**Datei:** `src/ai/flows/pollinations-chat-flow.ts`

Neue Funktion vor dem API-Call:

```typescript
function shouldUseWebSearch(lastUserMessage: string): boolean {
  // Heuristik: aktuelle Events, Datumsreferenzen, Nachrichten, Wetter, Kurse
  const WEB_SIGNALS = /\b(aktuell|heute|gestern|2026|nachrichten|wetter|current|latest|news|today|price|stock)\b/i;
  return WEB_SIGNALS.test(lastUserMessage);
}
```

In `getPollinationsChatCompletion`: wenn `shouldUseWebSearch(lastMessage)` → intern `modelId` auf `gemini-search-fast` überschreiben. **Der Client merkt nichts.** Kein neuer Parameter, kein `forceModel`.

Optional: Logging wenn geroutet wird (für Debugging), aber kein UI-Feedback.

→ verify: "Was ist heute passiert?" → Web-Ergebnis. "Erkläre Quantenphysik" → kein Web-Routing.

---

## Phase 5 — Audio im Chat (~2–3h)

### 5.1 Musik-Pfad konsolidieren

**Erst klären:** 
- Existiert `/api/compose` für ElevenMusic? → Ja.  
- ACE-Step (`acestep`) ist jetzt auf `gen.pollinations.ai/v1` verfügbar.
- Beide als separate Routes? → **Nein. Ein Pfad.**

**Entscheidung:** `/api/compose` erweitern um ACE-Step-Support. Model-Parameter akzeptieren:
- `elevenmusic` (default) — wie bisher
- `acestep` — neu, bis 60s, tag-basiert

Keine neue `/api/music` Route.

### 5.2 TTS an Chat-Antworten

**Datei:** Chat-Bubble-Component  
**Was:** 🔊-Button an jeder AI-Antwort. Klick → `/api/tts` mit `elevenflash`.  
Kein Mode-Switch, kein Dropdown. Einfach vorlesen.

### 5.3 STT prüfen

**Datei:** `src/app/api/stt/route.ts` (22 LOC)  
**Was:** Prüfen ob 🎤-Button im UI existiert und mit `whisper` funktioniert.  
Wahrscheinlich existiert er schon — nur testen.

### 5.4 Audio-Model-Registry

**Neue Datei:** `src/config/audio-models.ts`

```typescript
export const TTS_MODELS = [
  { id: "elevenflash", name: "ElevenLabs Flash", default: true },
  { id: "elevenlabs", name: "ElevenLabs Standard" },
  { id: "qwen-tts", name: "Qwen TTS" },
];

export const STT_MODELS = [
  { id: "whisper", name: "Whisper", default: true },
  { id: "scribe", name: "Scribe" },
];

export const MUSIC_MODELS = [
  { id: "acestep", name: "ACE-Step", maxDuration: 60, default: true },
  { id: "elevenmusic", name: "ElevenLabs Music" },
];
```

→ verify: TTS vorlesen, STT transkribieren, Musik generieren — alles im Chat

---

## Phase 6 — Gallery Layout-Integration (~2–3h)

GalleryPanel ist schon in AppLayout. State ist geliftet. Das Grobe steht.

### 6.1 Fixed-Hack ersetzen

**Datei:** `src/components/layout/AppLayout.tsx`  
**Was:** `fixed left-[calc(var(--sidebar-width)+8px)]` → echten Flex-Slot. Gallery pushed Main-Content auf Desktop.

### 6.2 Responsive

- Desktop: Side-Panel pushed Content
- Tablet: Overlay (heutiger Zustand, aber ohne Fixed-Hack)
- Mobile: Full-Screen-Sheet

### 6.3 `/gallery` Route

**Datei:** `src/app/gallery/page.tsx`  
**Was:** Redirect auf `/unified?gallery=open`. Route nicht löschen.

→ verify: Gallery auf allen Breakpoints, kein Hydration-Mismatch

---

## Phase 7 — Legacy-Cleanup (~2h)

| Was | Datei | Aktion |
|---|---|---|
| `/api/replicate/` | `src/app/api/replicate/` | Prüfen ob aufgerufen → entfernen wenn nein |
| `unified-model-configs.ts` | `src/config/` | Mit `unified-image-models.ts` vergleichen → mergen |
| `/api/pruna/` | Route prüfen | Entfernen (Logik schon weg) |
| `PRUNA_API_KEY` | Vercel Env | Entfernen |
| `/api/upload/sign*` | `src/app/api/upload/` | Legacy? Prüfen |
| `LEGACY_FALLBACK_MODELS` | `pollinations-chat-flow.ts:55` | Prüfen ob noch nötig |

→ verify: build clean, keine toten Imports

---

## Phase 8 — Merge & Deploy (~1h)

### 8.1 Branch mergen: `dashboard/xlinks` → `main`

### 8.2 Vercel Env aufräumen
- `PRUNA_API_KEY` entfernen
- `POLLEN_API_KEY` bestätigen

### 8.3 Smoke-Test
- [ ] Chat → Text-Antwort
- [ ] "Zeig mir einen Hund" → Bild inline im Chat
- [ ] "Was ist heute passiert?" → Web-Search-Antwort (automatisch)
- [ ] Gallery auf/zu
- [ ] TTS: Antwort vorlesen
- [ ] STT: Spracheingabe
- [ ] "Mach ein Jazz-Stück" → Audio-Player im Chat
- [ ] BYOP-Flow (optional)
- [ ] Creative Director → enthält Safety Protocol (Bug-Fix verifizieren)

---

## Phasen-Übersicht & Delegation

| Phase | Was | Aufwand | Abhängig von | Parallel möglich |
|---|---|---|---|---|
| **0** | Fundament (Creative-Dir-Bug + Enhancer + Tests) | 1–2h | — | — |
| **1** | Model-Registry | 1h | — | mit 0 |
| **2** | In-Chat Bildgenerierung | 3–4h | 0 | — |
| **3** | System-Prompts (FEATURE_GUIDANCE) | 2h | 2 committed | — |
| **4** | Web-Search Auto-Routing (server-side) | 1–2h | 0 | mit 3 |
| **5** | Audio (TTS/STT/Musik) | 2–3h | Compose-Entscheid | mit 6 |
| **6** | Gallery Layout | 2–3h | — | mit 3+4+5 |
| **7** | Legacy-Cleanup | 2h | — | mit 5+6 |
| **8** | Merge & Deploy | 1h | alles | — |

**Parallelisierbar:** 0+1, 3+4, 5+6+7  
**Sequenziell:** 0 → 2 → 3 (chat-options.ts darf nicht parallel editiert werden)

---

## Schlüsseldateien — Quick Reference für Agenten

| Datei | LOC | Was sie tut | Wer darf anfassen |
|---|---|---|---|
| `src/config/chat-options.ts` | 605 | Text-Modelle, System-Prompts, Response-Styles, TTS-Voices | **Sequenziell!** Nie parallel |
| `src/config/unified-image-models.ts` | 382 | Image/Video-Modell-Registry, enabled/free/byop Flags | Phase 1 only |
| `src/config/enhancement-prompts.ts` | ~600 | Prompt-Enhancement pro Modell | Phase 0.2 only |
| `src/ai/flows/pollinations-chat-flow.ts` | 223 | Chat-Completion-Logik (Server), Web-Routing | Phase 4 only |
| `src/components/ChatProvider.tsx` | 749 | Client-State, Send-Loop | Phase 2 — max 15 neue Zeilen |
| `src/lib/chat/chat-media-intent.ts` | NEU | Media-Marker-Parsing | Phase 2 |
| `src/app/api/chat/completion/route.ts` | 285 | Chat Route Handler (Proxy → Pollinations) | — |
| `src/app/api/generate/route.ts` | 138 | Image Generation Route Handler | Phase 2 |
| `src/app/api/tts/route.ts` | 30 | TTS Route Handler | Phase 5 |
| `src/app/api/stt/route.ts` | 22 | STT Route Handler | Phase 5 |
| `src/app/api/compose/route.ts` | ? | Musik-Route (ElevenMusic) | Phase 5 — erweitern für ACE-Step |
| `src/components/layout/AppLayout.tsx` | ~200 | App-Shell Layout | Phase 6 |

---

## System-Prompt-Audit — Zusammenfassung

| Block | Bewertung | Aktion |
|---|---|---|
| SHARED_SAFETY_PROTOCOL | ⭐⭐⭐⭐⭐ | **Nicht anfassen.** Crisis Response + Robin Hood Framework ist die Seele |
| SYSTEM_IDENTITY_PROTOCOL | ⭐⭐⭐⭐⭐ | **Nicht anfassen.** Machine Honesty, Anti-Corporate, Transparency |
| OUTPUT_LANGUAGE_GUARD | ⭐⭐⭐⭐ | **Nicht anfassen.** Default Deutsch, Spracherkennung |
| FEATURE_GUIDANCE | ⭐⭐ | **Ersetzen** in Phase 3 — UI-entkoppelt, beschreibt Fähigkeiten statt Klickwege |
| Basic | ⭐⭐⭐⭐ | Nur FEATURE_GUIDANCE tauschen |
| Precise | ⭐⭐⭐⭐⭐ | Nur FEATURE_GUIDANCE tauschen |
| Deep Dive | ⭐⭐⭐⭐⭐ | Nur FEATURE_GUIDANCE tauschen |
| Emotional Support | ⭐⭐⭐⭐ | FEATURE_GUIDANCE tauschen, optional 2. Few-Shot |
| Philosophical | ⭐⭐⭐⭐ | FEATURE_GUIDANCE tauschen, optional 2. Few-Shot |
| Creative Director | ⭐⭐⭐⭐ | **Bug fix (Phase 0.1)** + Modell-IDs aktualisieren. Charakter bleibt. |
| Code Reasoning | ⭐⭐⭐⭐ | Nur FEATURE_GUIDANCE tauschen |

---

## Philosophie-Regeln (für alle Agenten)

1. **Kein Visualize-Mode-Zwang.** Bildgenerierung passiert im Chat. Visualize-Modus existiert weiterhin als Option — aber nicht als Hauptweg.
2. **Kein BYOP auf den ersten Blick.** Free tier reicht. Wer tiefer will, findet es.
3. **Keine Modell-Auswahl auf den ersten Blick.** Die Engine entscheidet. Wer konfigurieren will, findet die Einstellungen.
4. **Progressive depth.** Alles zugänglich, nichts aufdringlich.
5. **Die AI bleibt ein Tool.** Ein ehrliches, direktes, anti-korporates Tool. Kein Freund, kein Mensch. Software die gut funktioniert.
6. **System-Prompts sind heilig.** Die Seele — Identität, Machine Honesty, Anti-Corporate-Ton, Safety Protocol, Taboo-Protocol — wird nicht verwässert. Nur faktische Updates (Modell-IDs, Feature-Beschreibungen). Wer den Ton ändern will, fragt zuerst.

# Pre-Merge Simplification & Product Consolidation Plan

**Erstellt:** 2026-06-01  
**Branch:** `dashboard/xlinks`  
**Status:** DRAFT — User-Freigabe vor Execution  
**Backup Pruna:** `feat/pruna-integration` gepusht

---

## Produkt-Vision (Warum dieser Plan existiert)

hey.hi soll sich anfühlen wie ein Werkzeug, das dem User gehört — kein Login-Wall, kein "AI als Konzern-Produkt", kein Feature-Dschungel.

**Das Kernversprechen:**
> Du landest auf der Seite. Alles ist sofort da. Du fängst an. Die App zeigt dir nach und nach was sie kann. Du merkst: das sind deine Modelle. Die reden wie Menschen, aber die arbeiten für dich.

Das bedeutet technisch:
- Eine Page, kein Navigation-Chaos
- Gallery/Vault als In-App-Panel, nicht als separate Route
- BYOP fühlt sich an wie "Upgrade schalten", nicht wie "API-Key eingeben"
- Chat-Einstieg mit kontextueller Guidance: "Was bin ich, was kann ich, was kannst du mir sagen"
- System-Prompts erklären sich selbst — der User versteht was er damit macht

---

## Konzept-Breakdown

### Was der Kern ist (nicht anfassen)

```
User tippt → Text: Pollinations Chat → Antwort
User tippt → Bild/Video: /api/generate → gen.pollinations.ai → URL
User tippt → Musik: /api/compose → ElevenMusic
Ergebnis → OutputService → IndexedDB
```

Single provider, single data layer, single page. Das ist die Wahrheit.

### Was weg kann

| Was | Warum |
|-----|-------|
| Pruna-Provider (7 Modelle, 1 Route) | BYOP-only, Pollinations hat identische Modelle nativ, plus binärer Proxy-Pfad |
| Binary-Proxy-Pfad in chat-service | Nur für Pruna — Pollinations gibt immer JSON |
| Separate Seiten `/gallery`, `/settings`, `/about` | Brechen den One-Page-Flow, Browser-Back geht auf Landing |

### Was rein soll (neu)

| Was | Warum |
|-----|-------|
| Gallery/Vault als Sheet/Drawer in `/unified` | Browser-Back schließt den Drawer, kein Navigation-Chaos |
| `useMediaQuery` Hook (SSR-safe) | Ersetzt 5× `window.innerWidth`-Pattern |
| BYOP als "Unlock"-Flow statt Settings-Formular | Gefühl: du schaltest Power frei, nicht: du konfigurierst etwas |
| Chat-Einstieg mit Guidance-Cards | Leerer Chat erklärt sich — Modes, System-Prompts, Capabilities |
| Weiterer Abbau ChatProvider (~749 Zeilen) | Refactor-Extraktion fortführen |

---

## Alle Findings — Status

### Code-Review Pruna (2026-05-31)

| # | Prio | Finding | Plan-Behandlung |
|---|------|---------|----------------|
| 1 | P0 | Kein `response.ok` vor `blob()` | ENTFÄLLT — Binary-Branch wird entfernt |
| 2 | P1 | Enhancer-IDs `'claude'`/`'gemini'` unregistriert | VERIFIZIEREN via curl, dann fix oder Kommentar |
| 3 | P1 | `isPollinations: true` hardcoded | FIXEN — aus `getUnifiedModel()` ableiten |
| 4 | P2 | Seed=0 Falsy-Bug | FIXEN — 1 Zeile in Tool + SDK |
| 5 | P2 | `image_url` überschreibt `image` still | DOKUMENTIEREN — Kommentar zur Absicht |
| 6 | P3 | `PRUNA_MODEL_MAP` dupliziert Config | ENTFÄLLT — Route wird gelöscht |
| 7 | P3 | `isPrunaQwen` hardcoded | ENTFÄLLT — Hook bereinigt |
| 8 | P4 | Poll sleep-first | ENTFÄLLT — Route gelöscht |
| 9 | P4 | Doppelte `modelInfo`-Deklaration (toter Code Z. 74) | FIXEN |
| 10 | P4 | Frames-Fallback direkte API-Calls | ENTFÄLLT — Route gelöscht |

### Neue SDK/Pollinations Findings

| # | Finding | Handlung |
|---|---------|---------|
| SDK-A | `videoUrl()` nutzt `/image`-BASE_URL — für Video unklar | VERIFIZIEREN via curl |
| SDK-B | `if (options.seed)` falsy in imageUrl + videoUrl | FIXEN |

---

## Ausführungsplan

---

### Phase 1 — Pruna entfernen + Pollinations-Bugs fixen

*Agent kann diese Phase vollständig autonom abarbeiten.*

**1.1 — `src/app/api/pruna/route.ts` löschen**
```bash
rm src/app/api/pruna/route.ts
```
Verify: `ls src/app/api/pruna/` → Fehler (Verzeichnis weg)

**1.2 — `src/config/unified-image-models.ts`**
- `PRUNA_MODELS[]` Array entfernen (Zeilen 162–258)
- `ImageProvider` type: `'pollinations' | 'pruna'` → `'pollinations'`
- Interface-Field `prunaModelId?: string` entfernen
- Export: `[...POLLINATIONS_MODELS, ...PRUNA_MODELS]` → `POLLINATIONS_MODELS`

Verify: `grep -c "pruna" src/config/unified-image-models.ts` → `0`

**1.3 — `src/config/unified-model-configs.ts`**
Alle 7 Keys entfernen: `'pruna-p-image'`, `'pruna-p-image-edit'`, `'pruna-wan-i2v'`, `'pruna-wan-t2v'`, `'pruna-qwen-image'`, `'pruna-qwen-image-edit'`, `'pruna-p-video'`

Verify: `grep -c "pruna" src/config/unified-model-configs.ts` → `0`

**1.4 — `src/config/ui-constants.ts`**
Alle 7 pruna-Icon-Einträge entfernen.

**1.5 — `src/config/enhancement-prompts.ts`**
Zeilen 1043–1047 entfernen:
```typescript
ENHANCEMENT_PROMPTS['pruna'] = ...
ENHANCEMENT_PROMPTS['pruna-image'] = ...
ENHANCEMENT_PROMPTS['pruna-edit'] = ...
ENHANCEMENT_PROMPTS['pruna-image-edit'] = ...
ENHANCEMENT_PROMPTS['pruna-video'] = ...
```

**1.6 — `src/lib/services/chat-service.ts`**

Entfernen:
- `const isPruna = modelInfo?.provider === 'pruna';`
- `const endpoint = isPruna ? '/api/pruna' : '/api/generate';` → `const endpoint = '/api/generate';`
- Gesamter `if (isPruna) { ... }` Block
- Binary-Content-Type-Branch (war nur für Pruna):
  ```typescript
  // ENTFERNEN:
  const responseContentType = response.headers.get('content-type') || '';
  if (responseContentType.includes('image/') || responseContentType.includes('video/')) {
      ...binary upload path...
  }
  ```
- Ungenutzte Imports (`uploadFileToPollinationsMedia`, `getClientSessionId`) prüfen und entfernen

Verify: `grep -c "pruna\|isPruna\|Pruna" src/lib/services/chat-service.ts` → `0`

**1.7 — `src/components/tools/UnifiedImageTool.tsx`**

Entfernen/vereinfachen:
- Z. 74: erste `const modelInfo = ...` (toter Code, Finding #9)
- Z. 113–114: `const isPruna = ...` + `const isPollinationsVideo = !isPruna && ...` → `const isPollinationsVideo = modelInfo?.kind === 'video';`
- Z. 136–163: `if (isPruna) { ... } else { ... }` → nur Pollinations-Block, kein Wrapper
- Z. 165: Endpoint-Switch → direkt `'/api/generate'`
- Z. 176–190: Binary-Content-Type-Branch entfernen, JSON-Pfad wird einziger Pfad
- Z. 212: `isPollinations: !isPruna` → `isPollinations: true`
- Z. 134: Seed-Fix (Finding #4):
  ```typescript
  // VORHER:
  if (formFields.seed) payload.seed = Number(formFields.seed);
  // NACHHER:
  if (formFields.seed != null && formFields.seed !== '') payload.seed = Number(formFields.seed);
  ```

**1.8 — `src/hooks/useUnifiedImageToolState.ts`**

- `isPrunaModel` Memo entfernen
- `isPrunaVideo`, `isPrunaQwen` entfernen
- Pruna-Branches in Attachment-Anzahl-Logik entfernen
- Alle drei aus Return-Objekt entfernen
- Zeile 20: Provider-Filter: `|| model.provider === 'pruna'` entfernen

**1.9 — `src/components/tools/visualize/VisualizeInlineHeader.tsx`**

Provider-Check vereinfachen:
```typescript
// VORHER:
... provider === 'pollinations' || provider === 'pruna'
// NACHHER:
... provider === 'pollinations'
```

**1.10 — `src/app/api/enhance-prompt/route.ts`**

`grep -n "pruna"` ausführen, alle Treffer entfernen.

**1.11 — Pollinations-Bugs fixen**

*Finding #2 — Enhancer-Model-IDs verifizieren:*
```bash
curl -s -X POST "https://text.pollinations.ai/" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude","messages":[{"role":"user","content":"hi"}]}' | head -c 100
```
Bei Fehler: `'claude'` → `'claude-fast'`, `'gemini'` → `'gemini-fast'` in `enhance-prompt/route.ts:317`

*Finding #3 — `isPollinations` im Orchestrator:*
```typescript
// src/lib/chat/chat-send-orchestrator.ts:124
// VORHER: isPollinations: true
// NACHHER:
isPollinations: !getUnifiedModel(input.selectedImageModelId)?.provider ||
               getUnifiedModel(input.selectedImageModelId)?.provider === 'pollinations',
```

*SDK-A — Video BASE_URL verifizieren:*
```bash
curl -s -o /dev/null -w "%{http_code}" \
  "https://gen.pollinations.ai/image/test?model=grok-video&duration=5&private=false&safe=false&nologo=true"
```
Bei 4xx: in `pollinations-sdk.ts` eigene `VIDEO_BASE_URL = "https://gen.pollinations.ai/video"` für `videoUrl()`

*SDK-B + Finding #4 — Seed=0 Fix:*
```typescript
// pollinations-sdk.ts, beide Funktionen (Z. ~49 und ~91):
// VORHER: if (options.seed) params.append(...)
// NACHHER: if (options.seed != null) params.append(...)
```

*Finding #5 — Kommentar:*
```typescript
// chat-service.ts:146
if (options.image_url) body.image = options.image_url; // intentional: last-writer wins, image_url is newer reference
```

**1.12 — Build-Verify**
```bash
npm run typecheck && npm run build && CI=1 npm test -- --runInBand
```

**1.13 — Commit Phase 1**
```
chore: remove Pruna, fix seed/isPollinations bugs

Removes /api/pruna route and all 7 pruna-* models (backup on
feat/pruna-integration). Single Pollinations path, no binary proxy.
Fixes seed=0 falsy, derives isPollinations from config.
```

---

### Phase 2 — Single-Page Navigation (Gallery/Vault als Drawer)

*Behebt: Browser-Back geht auf Landing statt zurück zum Chat.*

**Problem-Analyse:**
`/gallery` und `/settings` sind separate Next.js-Seiten. Wenn der User aus `/unified` dorthin navigiert, erstellt `router.push('/gallery')` einen History-Eintrag. Browser-Back geht auf `/unified` — aber `/unified` rendert je nach State als Landing, nicht als Chat. Das fühlt sich falsch an.

**Lösung:**
Gallery, Vault und Settings werden zu `Sheet`-Drawern innerhalb `/unified`. Keine eigene Route. Kein History-Eintrag. Browser-Back bleibt im Chat.

**Schritt 2.1 — `useMediaQuery` Hook erstellen**

Datei: `src/hooks/useMediaQuery.ts` (neu)
```typescript
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false); // SSR-safe default: false
  
  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  
  return matches;
}
```

**Schritt 2.2 — `window.innerWidth`-Pattern durch Hook ersetzen**

Dateien mit FOUC-Problem:
- `src/components/layout/AppLayout.tsx:100` — `useState(() => window.innerWidth < 640)` → `useMediaQuery('(max-width: 639px)')`
- `src/hooks/useChatInputLogic.ts:53` — `useState(false)` + `useEffect` mit `window.innerWidth` → `useMediaQuery('(max-width: 639px)')`
- `src/components/ui/FlowField.tsx:78` — `window.innerWidth < 768` im Effect → `useMediaQuery('(max-width: 767px)')`

**Schritt 2.3 — Gallery in `/unified` als Drawer integrieren**

Statt `router.push('/gallery')` im Sidebar-Link: State-Toggle in `AppLayout` oder `ChatProvider`.

In `src/components/layout/AppSidebar.tsx`:
```typescript
// VORHER: router.push('/gallery')
// NACHHER: props.onOpenGallery?.() oder direkt via globalen State
```

In `src/app/unified/page.tsx` oder `AppLayout`:
- `const [galleryOpen, setGalleryOpen] = useState(false)`
- `<Sheet open={galleryOpen} onOpenChange={setGalleryOpen}>` mit dem Gallery-Content drin
- Kein `router.push`, kein History-Eintrag

Die existierende `/gallery`-Seite bleibt als Fallback (direkter URL-Zugriff), wird aber nicht mehr intern gelinkt.

**Schritt 2.4 — Settings als Sheet**

Gleiche Pattern wie Gallery: `settingsOpen`-State, Sheet-Component. `src/app/settings/page.tsx` bleibt als Fallback.

**Schritt 2.5 — Back-Buttons normalisieren**

In `src/app/gallery/page.tsx` und anderen Seiten:
```typescript
// VORHER: router.push('/')
// NACHHER: router.push('/unified')
```

Als Mindest-Fix falls Sheet-Migration zu aufwändig für einen Commit: zumindest die Back-Buttons zeigen auf `/unified` statt `/`.

**Verify:** User öffnet Gallery aus Chat → schließt mit ✕ oder Browser-Back → ist wieder im Chat, nicht auf Landing.

---

### Phase 3 — BYOP: "Unlock"-Flow statt Settings-Formular

*Ziel: sich anfühlen wie "Power freischalten", nicht wie API-Key konfigurieren.*

**Aktueller Stand:**
Key liegt in `localStorage` als Klartext (`pollenApiKey`). Zugänglich über `client-pollen-key.ts`. Kein visuelles Feedback was der Key freischaltet.

**Was sich ändern soll:**

**Schritt 3.1 — "Unlock Advanced Models"-CTA im Visualize-Bar**

Im Model-Selector (Visualize-Tab), wenn BYOP-Modelle geblockt sind:
```
[ IMAGE FREE ] [ VIDEO FREE ] [ ADVANCED ▸ ]
                                   ↑
                          "Schalte Premium-Modelle frei"
                          Kontext-Tooltip oder Inline-Banner
```

Kein extra Settings-Weg — das CTA öffnet direkt ein kleines Sheet/Dialog mit:
- Erklärung in 2 Sätzen: "Mit deinem Pollinations-Key kannst du X Modelle nutzen."
- Input-Feld für den Key
- "Aktivieren"-Button
- Bestätigung: "X Modelle freigeschaltet" + visuelle Änderung im Bar

**Schritt 3.2 — Visuelles Feedback nach Unlock**

Nach erfolgreichem Key-Eintrag:
- ADVANCED/VIDEO-Gruppen "leuchten auf" (kurze Animation, z.B. `animate-in zoom-in`)
- Badge oder Label "Freigeschaltet" für 3 Sekunden sichtbar
- Key-Indicator im Header (kleines grünes Pollen-Icon oder ähnlich)

**Schritt 3.3 — Key-Handling hardening (XSS-Minderung)**

Aktuell liegt der Key in `localStorage` im Klartext. Minimal-Härtung:
- Key nicht mehr direkt als Header im Client schicken, sondern als Session-Cookie (httpOnly) via `/api/auth/pollen-key` Route
- Server liest Cookie, leitet weiter — Key nie mehr im JS-Heap sichtbar
- Alternativ (weniger Aufwand): Web Crypto `crypto.subtle.encrypt` mit device-fingerprint als Key — schützt gegen einfaches localStorage-Auslesen, nicht gegen Runtime-XSS

Agent-Entscheidung: Session-Cookie-Ansatz bevorzugen (einfacher, robuster).

**Schritt 3.4 — Unlock-State persistieren**

Nach Unlock: `localStorage.setItem('pollen_unlocked', '1')` (nicht der Key selbst) → UI zeigt dauerhaft "Freigeschaltet"-Zustand auch nach Reload, solange Cookie gültig.

---

### Phase 4 — Mobile UX: Smoother, kein FOUC

*Kein vollständiges Responsive-Redesign — nur die spürbaren Pain-Points.*

**Schritt 4.1 — FOUC eliminieren (SSR-Safe Mobile Detection)**

Phase 2 (Schritt 2.2) erledigt das bereits für `AppLayout` und `useChatInputLogic`.

Nach dem Hook-Wechsel: kein "flash" mehr, weil der initiale State `false` ist und hydration synchron.

**Schritt 4.2 — FlowField-Partikel auf Mobile optimieren**

`src/components/ui/FlowField.tsx`:
- `window.innerWidth`-Check in `useEffect` (läuft nach Hydration) — schon grundsätzlich OK
- Zusätzlich: `requestAnimationFrame`-Budget auf Mobile limitieren (max 30fps statt 60fps)
- Canvas-Größe auf Mobile auf 0.75x Device-Pixel-Ratio limitieren

**Schritt 4.3 — Touch-Feedback für Buttons**

In `globals.css`:
```css
@media (hover: none) {
  button:active {
    transform: scale(0.97);
    transition: transform 80ms ease;
  }
}
```

Gibt Mobile-Buttons ein fühlbares Tap-Feedback ohne JS.

**Schritt 4.4 — Chat-Input auf Mobile**

`src/components/chat/ChatInput.tsx`:
- `fontSize: 1.125rem` als Inline-Style → Tailwind `text-lg` (16px base → kein Auto-Zoom auf iOS)
- iOS Keyboard-Safe-Area: `padding-bottom: env(safe-area-inset-bottom)` auf dem Input-Container
- Verhindert, dass die Tastatur den Input überdeckt

**Schritt 4.5 — Sidebar auf Mobile**

Wenn Sidebar offen ist und User außerhalb tippt → Sidebar schließen. Aktuell unklar ob das funktioniert.
```typescript
// In AppSidebar oder AppLayout:
useEffect(() => {
  if (!isMobile || !sidebarOpen) return;
  const handler = (e: TouchEvent) => {
    if (!sidebarRef.current?.contains(e.target as Node)) setSidebarOpen(false);
  };
  document.addEventListener('touchstart', handler);
  return () => document.removeEventListener('touchstart', handler);
}, [isMobile, sidebarOpen]);
```

---

### Phase 5 — ChatProvider / ChatInput Refactor

*Fortführung des laufenden Refactors. Ziel: ChatProvider unter 400 Zeilen.*

**Aktueller Stand:**
- `ChatProvider.tsx`: 749 Zeilen
- `ChatInput.tsx`: 517 Zeilen
- Bereits extrahiert: `chat-capability-resolution`, `chat-context-window`, `chat-message-normalization`, `chat-prompt-builder`, `chat-send-coordinator`, `chat-send-orchestrator`

**Schritt 5.1 — `sendMessage` aus ChatProvider extrahieren**

`sendMessage` ist die größte verbleibende Funktion in ChatProvider. Die Extraktion ist laut Code-Review "mostly safe".

Zieldatei: `src/lib/chat/chat-send-dispatcher.ts`

Interface:
```typescript
interface SendDispatchInput {
  prompt: string;
  mode: ChatMode;
  modelId: string;
  imageParams?: GenerateImageOptions;
  // ... alles was sendMessage braucht
}
```

ChatProvider ruft dann nur noch `await dispatchSend(input)` auf.

**Schritt 5.2 — Media-State aus ChatProvider in eigenen Hook**

Alles was mit `isImageMode`, `isVideoMode`, `uploadedImages`, `referenceImages` zu tun hat → `useChatMediaState()`.

ChatProvider importiert den Hook, keine interne State-Deklaration mehr.

**Schritt 5.3 — ChatInput: Inline-Styles → Tailwind**

`src/components/chat/ChatInput.tsx` hat hardcoded Hex-Werte und Inline-Styles.

Vorgehen:
- `grep -n "style={{" src/components/chat/ChatInput.tsx` — alle Treffer
- Jeden durch Tailwind-Klasse ersetzen
- Hex-Werte durch CSS-Variablen: `bg-[#1a1a1a]/90` → `bg-card/90`

**Schritt 5.4 — Verify**
```bash
npm run typecheck
CI=1 npm test -- --runInBand src/lib/chat/
```

---

### Phase 6 — User Empowerment Pattern

*Das ist die wichtigste Phase für das Produkt-Gefühl. Kein Feature-Dump — nur die Stellen, wo der User lernt.*

**Kernidee:** Die App erklärt sich selbst an den richtigen Momenten. Nicht als Tutorial, sondern als kontextuelles Gespräch.

---

**Schritt 6.1 — Leerer Chat: Guidance-Cards statt Leer**

Wenn kein Gesprächsverlauf vorhanden: statt leerem Bereich zeige 3–4 Cards:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 💬 Frag etwas   │  │ 🎨 Visualize    │  │ 🎵 Compose      │
│                 │  │                 │  │                 │
│ Ich bin dein    │  │ Generiere       │  │ Erstelle Musik  │
│ KI-Werkzeug.    │  │ Bilder, Videos  │  │ mit Text-       │
│ Stell mir eine  │  │ direkt im Chat. │  │ beschreibung.   │
│ Frage.          │  │                 │  │                 │
│                 │  │ → Visualize     │  │ → Compose       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

Klick auf eine Card → wechselt in den Mode ODER schreibt einen Starter-Prompt in den Input.

**Implementierung:**
- Komponente `GuidanceCards` in `src/components/chat/GuidanceCards.tsx`
- Wird in `ChatProvider` / Chat-View gerendert wenn `messages.length === 0`
- Dismissbar (wird in `localStorage` gespeichert nach erstem Chat)

---

**Schritt 6.2 — System-Prompt Erklärung inline**

Im System-Prompt-Editor (Settings oder Inline-Panel):

```
┌──────────────────────────────────────────────────────┐
│ System-Prompt                               [?] Info │
│                                                      │
│ [Textarea: "Du bist ein hilfreicher..."]             │
│                                                      │
│ ℹ️ Das ist die Persönlichkeit deines KI-Werkzeugs.  │
│    Du kannst sagen: "Antworte immer auf Deutsch",    │
│    "Sei direkt, kein Smalltalk" oder                 │
│    "Du bist ein Experte für JavaScript".             │
└──────────────────────────────────────────────────────┘
```

Kein separates Docs-Tab, kein Link raus. Das erklärt sich im Kontext.

---

**Schritt 6.3 — Model-Selector: Was ist dieses Modell?**

Beim Hover/Klick auf ein Modell im Selector: kleines Tooltip/Popover mit:

```
claude-fast
─────────────
Anthropic Claude Haiku 4.5
Schnell, günstig, präzise.
Gut für: Fragen, Zusammenfassungen,
Code-Hilfe, direkte Antworten.
```

Nutzt die bestehenden `description`/`useCases`-Felder in `chat-options.ts`. Kein neues Datenmodell nötig.

---

**Schritt 6.4 — "AI redet wie Mensch, ist aber dein Tool" — Ton-Anpassung**

In den System-Prompts (`src/config/chat-options.ts` → `RESPONSE_STYLES` oder Default-System-Prompt):

Aktuell: generische KI-Formulierungen.  
Ziel: direkter Ton, erste Person, keine Corporate-Sprache.

Beispiel Default-Prompt (DE):
```
Du bist ein direkt ansprechbares KI-Werkzeug. 
Keine Einleitungsfloskeln, kein "Als KI-Modell...". 
Antworte präzise, auf den Punkt, wie ein kompetenter Mensch.
Du arbeitest für den User — nicht für ein Unternehmen.
```

---

**Schritt 6.5 — "Was können LLMs?" — Erste-Nutzung-Hinweis**

Beim allerersten Chat-Start (Flag in `localStorage`: `heyhi_first_run`) zeigt der KI-Assistent sich selbst vor:

Kein Pop-up, kein Onboarding-Wizard. Einfach die erste KI-Antwort ist eine Art Selbstvorstellung:

```
Ich bin dein KI-Werkzeug — lokal gespeichert, kein Account nötig.

Du kannst mich:
• Fragen stellen (Text, Code, Analyse)
• Bilder und Videos generieren lassen (Visualize-Modus)  
• Musik erstellen lassen (Compose-Modus)
• Mit eigenen Regeln konfigurieren (System-Prompt)

Was willst du tun?
```

Implementierung: bei `messages.length === 0` und `first_run`-Flag wird ein vordefinierter "Willkommen"-Response injiziert statt einen echten API-Call zu machen. Nach dem ersten echten Message: Flag setzen, nie wieder zeigen.

---

### Phase 7 — Abschluss

**Schritt 7.1 — Alle Tests**
```bash
npm run typecheck && npm run lint && CI=1 npm test -- --runInBand
```

**Schritt 7.2 — Dashboard aktualisieren**
`docs/project.html`: Code-Review-Tab und Tech-Debt-Tab aktualisieren.

**Schritt 7.3 — Cross-Link Dashboard**
`docs/project.html` ↔ `heyhireset/overview.html` Footer-Link (war schon in Branch-Scope).

**Schritt 7.4 — Merge-Commit**
```
feat: pre-merge simplification — Pruna out, one-page nav, UX empowerment

- Removes Pruna provider (backup on feat/pruna-integration)
- Gallery/Vault as in-app Drawers, browser-back stays in chat
- BYOP unlock flow, visual feedback
- SSR-safe useMediaQuery, mobile touch improvements
- ChatProvider sendMessage extraction
- Guidance cards for empty state, inline system-prompt explanation
- Model tooltips, user-first AI tone
```

---

## Phasen-Übersicht

| Phase | Scope | Aufwand | Agent-autonom? |
|-------|-------|---------|---------------|
| 1 | Pruna + Pollinations-Bugs | ~2h | Ja, vollständig |
| 2 | Single-Page Navigation | ~3h | Ja, mit Sheet-Component |
| 3 | BYOP Unlock-Flow | ~3h | Ja, mit Design-Vorgabe |
| 4 | Mobile UX | ~2h | Ja |
| 5 | ChatProvider Refactor | ~4h | Ja, schrittweise |
| 6 | User Empowerment | ~4h | Ja, mit Mockups oben |
| 7 | Abschluss/Docs | ~1h | Ja |

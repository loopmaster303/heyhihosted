# Implementierungsplan — heyhihosted

**Stand:** 2026-06-01  
**Branch:** `dashboard/xlinks` (8 uncommitted files)  
**Build:** ✅ clean  
**Tests:** ausstehend (laufen gerade)  
**Deployment:** hey-hi.space → 200 OK, live

---

## Ausgangslage

heyhihosted ist **die bestehende, deployed App**. 207 TS/TSX-Files, 44 Tests, 11 API-Routes.  
Aktuell auf `dashboard/xlinks` mit uncommitted Gallery-Refactor + project.html-Updates.

**Letzter Commit:** `44a3ab9` — Phase 1 Pruna-Removal + Pollinations-Cleanup.  
**Uncommitted:** Gallery Phase 2 (GalleryPanel.tsx, useMediaQuery, Layout-Integration).

---

## Phase 0 — Aufräumen & Committen (sofort)

**Ziel:** Sauberer Stand auf dem Branch, bevor was Neues passiert.

### 0.1 Uncommitted Changes committen
- `docs/project.html` — Modelle-Tab mit interaktiver Live-Liste
- `GallerySidebarSection.tsx` — drastisch reduziert (nur Mini-Preview + Trigger)
- `GalleryPanel.tsx` (new) — Grid/Detail View, Keyboard Nav, Density Control
- `AppLayout.tsx` — `--sidebar-width` CSS Variable
- `useMediaQuery.ts` (new) — SSR-safe Media-Query-Hook
- `useChatInputLogic.ts` + `AppSidebar.tsx` — weg von `window.innerWidth`
- `next-env.d.ts` — auto-updated
- `pollinations-chat-flow.ts` — Legacy-URL Cleanup
→ verify: `npm run build` ✅, `npm test` grün

### 0.2 Handoff-Doc archivieren
- `docs/handoffs/gallery-layout-integration.md` committen
- `.clawpatch/` — sichten ob nötig, sonst `.gitignore`

---

## Phase 1 — Model-Registry-Update (1–2h)

**Ziel:** `chat-options.ts` + `unified-image-models.ts` reflektieren die echte API von `gen.pollinations.ai/v1`.

### 1.1 Text-Modelle aktualisieren
Echte API hat 50+ Text-Modelle. Aktuell sind 12 in `chat-options.ts`.  
Hinzufügen (alle free):
- `gpt-5.4-mini`, `gpt-5.5`
- `claude`, `claude-large`, `claude-opus-4.7`, `claude-opus-4.8`
- `gemini-3.5-flash`, `gemini-search-fast`, `gemini-search-large`, `gemini-large`
- `grok`, `grok-large`, `grok-4.3`
- `deepseek-pro`
- `mistral-4`, `mistral-large`
- `kimi-k2.6`
- `llama-maverick`, `llama-scout`
- `perplexity-deep`
- `qwen-large`, `qwen-vision`, `qwen-vision-pro`

Entfernen / umbenennen wenn API-IDs sich geändert haben.

→ verify: build, model-dropdown im UI zeigt korrekte Liste

### 1.2 Image-Modelle aktualisieren
Neue free-Modelle:
- `wan-image` (Wan 2.7, bis 2K)
- `nova-canvas` (Amazon, Inpainting)
- `klein` (FLUX.2 Klein, Editing)
- `gptimage-large` → ist jetzt free (kein BYOP mehr)
- `qwen-image` → ist jetzt free

Paid-only (richtig markieren):
- `nanobanana/-2/-pro`, `seedream/-5/-pro`, `grok-imagine/-pro`, `wan-image-pro`, `gpt-image-2`, `p-image/-edit`

→ verify: Image-Modell-Dropdown korrekt, free/paid Labels stimmen

### 1.3 Video-Modelle aktualisieren
Free:
- `ltx-2` (LTX-2.3, T2V+I2V+Upscaler, 0.005 🌼/s)
- `nova-reel` (Amazon, 6–120s, 0.08 🌼/s)

Paid:
- `veo`, `seedance-pro`, `seedance-2.0`, `wan`, `wan-fast`, `wan-pro`, `grok-video-pro`, `p-video`

→ verify: Video-Generierung mit `ltx-2` funktioniert end-to-end

### 1.4 Audio/Musik hinzufügen (neu)
Bisher kein Audio-Modell-System in der Registry (nur hart-gecodete Routes):
- `elevenlabs`, `elevenflash` (TTS)
- `elevenmusic` (Musik-Gen)
- `whisper`, `scribe` (STT)
- `acestep` (Music, bis 60s)
- `qwen-tts`, `qwen-tts-instruct`

→ verify: `/api/tts` und `/api/stt` funktionieren mit neuen Modell-IDs

---

## Phase 2 — Gallery Layout-Integration (2–3h)

**Ziel:** Gallery als First-Class Layout-Citizen, nicht floating Fixed-Panel.

Das Handoff-Doc beschreibt das Problem klar:
> „Die Gallery lebt als floating Overlay statt im Layout-Flow."

### 2.1 GalleryPanel aus AppSidebar in AppLayout verschieben
- Eigener Slot im Flex-Layout (nicht Fixed + Magic Calc)
- `--sidebar-width` bleibt, aber Panel pushed Main-Content statt Overlay

### 2.2 Altes `/gallery`-Route deprecaten
- Banner „Gallery ist jetzt im Sidebar" oder Redirect
- Route nicht sofort löschen (Bookmarks)

### 2.3 Responsive
- Mobile: Gallery als Full-Screen-Sheet (von unten)
- Tablet: Gallery als Overlay (heutiger Zustand, aber cleaner)
- Desktop: Side-Panel pushed Content

→ verify: Gallery öffnen/schließen auf allen Breakpoints, kein Hydration-Mismatch

---

## Phase 3 — Legacy-Cleanup (2–3h)

**Ziel:** Toten Code entfernen, Pruna-Reste aufräumen.

### 3.1 Dead-Code-Audit
- `text.pollinations.ai` Legacy-URL in `pollinations-chat-flow.ts` → weg
- `src/app/api/replicate/` — wird das noch genutzt?
- `src/app/api/upload/sign*.ts` — Legacy Pollinations Media?
- Doppelte Model-Maps (`unified-model-configs.ts` vs `unified-image-models.ts`)

### 3.2 Pruna-Route endgültig entfernen
Phase 1 hat Pruna aus der Logik entfernt, aber:
- Liegt `/api/pruna/` noch als Route-Handler?
- `PRUNA_API_KEY` in Vercel Env noch gesetzt?

### 3.3 Enhancer-IDs fixen
Aus dem Code-Review (project.html):
> Enhancer-IDs `'claude'`/`'gemini'` lokal unregistriert — `chat-options.ts` kennt nur `-fast`-Varianten.

→ verify: Prompt-Enhancement funktioniert für alle sichtbaren Modelle

---

## Phase 4 — BYOP-Härtung (optional, 2–3h)

**Ziel:** BYOP-Key sicherer machen für Power-User.

### 4.1 XSS-Mitigation
BYOP-Key liegt in `localStorage` — XSS-Vektor.  
Options:
- SessionStorage statt localStorage (überlebt Tabs nicht)
- Encrypt mit Web Crypto (Key aus passphrase)
- Oder: BYOP ganz aus localStorage raus, nur Session-Cookie via `/api/pollen/auth`

### 4.2 BYOP-UX vereinfachen
Aktuell: GitHub OAuth → Token-Permissions → Copy-Paste.  
Besser: `enter.pollinations.ai/authorize` als embedded Flow (Pollinations hat das schon).

→ verify: BYOP-Key kann gesetzt, genutzt, gelöscht werden. Kein Leak in DevTools.

---

## Phase 5 — Deployment & Merge (1h)

### 5.1 Branch mergen
`dashboard/xlinks` → `main` nach allen Phasen.

### 5.2 Vercel Production Deployment
- Env-Vars prüfen (PRUNA_API_KEY entfernen wenn Phase 3.2 done)
- Preview → Production promote

### 5.3 Smoke-Test
- Chat senden (claude-fast)
- Bild generieren (gptimage)
- Gallery öffnen/schließen
- BYOP-Flow durchgehen
- STT/TTS testen

---

## Prioritäten

| Prio | Phase | Warum |
|---|---|---|
| 🔴 sofort | 0 — Committen | Uncommitted changes sind Risiko |
| 🟠 hoch | 1 — Model-Registry | Die aktuelle Liste ist veraltet, User sehen falsche Modelle |
| 🟡 mittel | 2 — Gallery Layout | UX-Verbesserung, kein Blocker |
| 🟡 mittel | 3 — Legacy-Cleanup | Tech-Debt, aber funktional nicht kaputt |
| ⚪ optional | 4 — BYOP-Härtung | Security, aber kein akuter Exploit bekannt |
| 🔴 sofort | 5 — Merge & Deploy | Sobald Phase 0+1 stabil |

---

## Nicht in diesem Plan

- Neues Feature-Development (gehört in heyhireset)
- Server-Streaming (explizit raus laut Scope)
- Login / User-Accounts
- macOS-App / iOS-PWA

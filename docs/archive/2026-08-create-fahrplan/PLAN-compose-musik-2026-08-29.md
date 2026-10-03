# Plan — Compose & Musik (eigenes Thema, 2026-08-29)

> **For agentic workers:** REQUIRED: Invoke the `using-superpowers` skill FIRST — before
> any response or action. Then implement this plan with
> `superpowers:subagent-driven-development`: one fresh implementer subagent per task,
> spec-compliance review, then code-quality review, before the next task starts.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Eigenes Thema, **nicht Launch-blockierend**. Gehört nicht zum
Freigabeweg der Launch-Kriterien, bis der Betreiber es explizit wieder öffnet.
Aus dem Fahrplan 2026-08-29 herausgelöst — Phase 8 (ASCII-Flow) und die
Abschluss-Gates laufen in `PLAN-phase-8-bis-ende-2026-08-29.md` ohne Musik.

**Ablösung (2026-08-29):** Die Tasks C.1–C.4 sind durch
`docs/superpowers/plans/2026-08-29-modal-acestep-sound.md` ersetzt — ACE-Step 1.5
selbst gehostet auf Modal, eigene Seite `/sound` neben Create, eigener lokaler Store,
anonym mit Rate-Limit (nur Prompt-Enhancement via serverseitigem Pollinations-Key).
Start als Prototype erst nach Abschluss des Fahrplans. Dieser Plan bleibt als
historischer Kontext bestehen.

**Goal:** Musik als vierten Create-Modus hinter der Pollenwall — erst, wenn der
Betreiber dieses Thema wieder öffnet. Vorher kein Code.

**Architecture:** Verlängert die bestehende Create-Maschine (`usePlaygroundState`,
`ModeTabs`, `Gallery`, gemeinsamer Asset-Pool) um einen `music`-Modus und ernährt sie
aus der vorhandenen `/api/compose`-Route. Kein neuer Speicher, kein neuer Ursprung:
Ergebnisse gehen durch `OutputService.saveGeneratedAsset()` in `db.assets` mit
Herkunfts-Tag `create`.

**Tech Stack:** Next.js 16 App Router, TypeScript, React, Tailwind, Dexie (IndexedDB
via `db.assets`), Pollinations Audio-API über `/api/compose`, Jest + Testing Library.

**Ausgangsstand / Abhängigkeiten:**
- Patch-Plan `PLAN-patch-p6-p7-nachaudit-2026-08-29.md` ist ausgeführt.
- Phase 5 (gemeinsamer Pool) und Phase 6 (mobilfähiges Create) sind merged.
- `Features.compose = false` (`src/config/features.ts:6`) — der Chat-Einstieg bleibt
  zu; Musik lebt ausschließlich im Create.

**Betreiberentscheidungen, die dieser Plan umsetzt (Fahrplan, 2026-08-26/29):**
- Musik ausschließlich schlüsselpflichtig, hinter der Pollenwall; ohne Schlüssel:
  Hinweis + Weg zu den Einstellungen, **kein Fehler**, Modus bleibt sichtbar.
- Modellliste: `elevenmusic`, `stable-audio-3-large`, `stable-audio-3-medium`,
  `lyria-3-clip`. `eleven-sfx` entfällt (kein Musikmodell, eigener Zweck).
- `acestep` verschwindet vollständig aus dem Code. Aktuelle Fundstellen
  (`rg -n "acestep" src/`, Stand 2026-08-29): `src/lib/media/compose-music.ts:35`,
  `src/config/chat-options.ts:38`, `src/config/ui-constants.ts:23,132`,
  `src/app/api/compose/route.ts:11`, `src/config/enhancement-prompts.ts:1441`,
  `src/components/ChatProvider.tsx:416`.

---

### Task C.1: `acestep` ausrotten und Compose-Modellliste auf die vier Modelle

**Files:**
- Modify: `src/app/api/compose/route.ts` (Model-Union + Valid-Liste auf die vier Modelle)
- Modify: `src/lib/media/compose-music.ts`, `src/config/chat-options.ts`,
  `src/config/ui-constants.ts`, `src/components/ChatProvider.tsx`,
  `src/config/enhancement-prompts.ts` (je 1–2 Fundstellen)
- Test: vorhandene Compose-Route-Tests finden (`rg -l "api/compose" src --glob '**/*.test.*'`)

- [ ] Schritt 1: Route-Union ändern: `type ComposeModel = 'elevenmusic' |
  'stable-audio-3-large' | 'stable-audio-3-medium' | 'lyria-3-clip'`,
  `VALID_COMPOSE_MODELS` darauf setzen, Default bleibt `elevenmusic`.
  `FREE_TIER_MODELS` bleibt leer (Registry: alle vier paid).
- [ ] Schritt 2: Alle übrigen `acestep`-Fundstellen entfernen
  (`rg -n "acestep" src/` vor/nach; nachher: 0 Treffer).
- [ ] Schritt 3: Route-Tests anpassen (Modellvalidierung: unbekanntes Modell → 400;
  die vier gültigen Namen werden akzeptiert).
- [ ] Schritt 4: `CI=1 npm test -- --runInBand <compose-tests>` → PASS.
- [ ] Schritt 5: Commit: `refactor(compose): acestep ausgerottet, Compose-Modelle auf Registry-Stand`

### Task C.2: Musik-Modus im Create — State, Tabs, Panel

**Files:**
- Modify: `src/app/create/PlaygroundShell.tsx`, `src/hooks/usePlaygroundState.ts` (Mode-Union um `'music'` erweitern)
- Modify: `src/components/playground/ModeTabs.tsx` (vierter Tab, 44px-Trefferfläche wie Phase 6)
- Create: `src/components/playground/MusicPanel.tsx` (Prompt, Dauer, instrumental-Schalter,
  Modellauswahl; Pollenwall-Zustand ohne Schlüssel: gesperrter Erzeugen-Knopf + Hinweis +
  Weg zu den Einstellungen)
- Test: `src/components/playground/MusicPanel.test.tsx` (neu)

- [ ] Schritt 1: Fehlschlagenden Test schreiben — Modus sichtbar, ohne Pollen-Schlüssel
  ist Erzeugen gesperrt und der Hinweistext (neuer Translations-Schlüssel
  `create.music.pollenRequired`, DE + EN in `src/config/translations.ts`) steht sichtbar,
  kein Fehler-Toast.
- [ ] Schritt 2: Implementieren. Dispatch geht an `/api/compose` (POST, JSON), Antworten
  durch die Phase-4-Fehlermodule (`readErrorResponse`/`describeError`) — keine eigene
  zweite Fehlerbehandlung. Dauer-Feld respektiert das Routenlimit (Prompt ≤ Grenze aus
  der Route; UI zählt Zeichen mit und sperrt früher).
- [ ] Schritt 3: `CI=1 npm test -- --runInBand src/components/playground/MusicPanel.test.tsx`
  → PASS; `npm run typecheck`.
- [ ] Schritt 4: Commit: `feat(compose): Musik als vierter Create-Modus mit Pollenwall`

### Task C.3: Ergebnis in den gemeinsamen Asset-Pool

**Files:**
- Modify: `src/app/create/PlaygroundShell.tsx` (Abschluss eines Musik-Laufs → `saveGeneratedAsset`)
- Test: `src/lib/assets/asset-origin.test.ts` bleibt grün (Herkunft `create`);
  MusicPanel-Test ergänzt „Track erscheint in der Galerie-Liste"

- [ ] Schritt 1: Test schreiben: nach erfolgreichem Lauf ist ein Asset mit
  `kind: 'audio'`, `origin 'create'`, Prompt und Blob in der Galerie-Sicht.
- [ ] Schritt 2: Implementieren über `OutputService.saveGeneratedAsset()` — **kein**
  zweiter Speicherpfad, kein `BlobManager`-Direktaufruf im Panel.
- [ ] Schritt 3: Reload-Test (localStorage/IndexedDB-Mock) — Track überlebt Reload.
- [ ] Schritt 4: Suite grün, Commit: `feat(compose): Musikergebnis im gemeinsamen Asset-Pool`

### Task C.4: Mobil erben + Wahrheitsdokumente

**Files:**
- Modify: `src/components/playground/MusicPanel.tsx` (Phase-6-Muster: `min-h-11`
  Trefferflächen, `--vvh`-Vertrag der PromptBar respektieren, Drawer-Kompatibilität)
- Modify: `docs/FAHRPLAN-create.md`, `docs/LAUNCH_CRITERIA.md` (nur wenn das Thema
  wieder geöffnet wird: G-Bereich je Kriterium Prüfweg fertig ausfüllen),
  `docs/README.md`

- [ ] Schritt 1: Schmales Fenster (375 px) durchspielen — jeder Bedienpfad mit 44px-Zielen.
- [ ] Schritt 2: Dokumente nachziehen, Commit: `docs: Compose/Musik Wahrheit nachgezogen`

---

**Reihenfolge:** C.1 → C.2 → C.3 → C.4, serial, ein Subagent je Task. Phase 10
(Musik auf eigener Infrastruktur) bleibt wie im Fahrplan zurückgestellt.

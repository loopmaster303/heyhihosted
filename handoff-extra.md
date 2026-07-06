# HANDOFF-EXTRA — Session 2026-07-06

Ergänzung zu [HANDOFF.md](HANDOFF.md). Dokumentiert **alle** Änderungen dieses Threads.

## Status

- **Alles uncommitted** (working tree dirty, nichts committet — User-Regel „no auto-commit").
- **Verifikation grün:** `tsc --noEmit` 0 Fehler · `CI=1 npx jest --runInBand` **307/307** (54 Suiten) · ESLint sauber auf allen geänderten Kern-Dateien.
- **Mobile Preview vom User bestätigt**: „sieht erstmal soweit gut aus". Desktop unverändert.
- **`HANDOFF.md` wurde in diesem Thread aktualisiert** (vorher Stand 2026-06-05, jetzt Stand 2026-07-06 inkl. Subagent-Freeze + Tasks 6-7 + Phase-3-Härtung).
- **`README.md`** ebenfalls aktualisiert (Modelltabellen gegen Registry, Compose-Realität, Provider-Infos).
- **`src/config/translations.ts`**: neue i18n-Keys `provider.label` + `compose.freeHint` (DE/EN).

## Neue Assets/Dateien

- Logos (uncommitted, in `src/assets/icons-models/`): `acestepfarbe.png`, `elevenlabsfarbe.png`, `ideogramfarbe.png`, `ltxfarbe.png`, `minimaxfarbe.png`, `prunafarbe.png`, `stabilityfarbe.png`
- Neuer Hook: [src/hooks/useProviderMode.ts](src/hooks/useProviderMode.ts)
- Neue Komponente: [src/components/tools/InlineParamsContainer.tsx](src/components/tools/InlineParamsContainer.tsx)

---

## 1. Modell-Logos gemappt ([ui-constants.ts](src/config/ui-constants.ts))

- Bildmodelle: alle `p-*` (Pruna) → **prunafarbe**; `zimage` & `vace` → **wan**-Logo (bewusste User-Vorgabe); `ltx-2` → **ltxfarbe**; `ideogram`/`ideogram-v4-turbo` → **ideogramfarbe**.
- LLM `minimax` → **minimaxfarbe**.
- Compose-Modelle: `acestep` → **acestepfarbe**, `elevenmusic` → **elevenlabsfarbe**, `stable-audio-3-medium` → **stabilityfarbe**.

## 2. Modellnamen aktualisiert (ui-constants + [chat-options.ts](src/config/chat-options.ts))

An **beiden** Stellen (`modelDisplayMap` + `name`):
- `kimi`: K2.5 → **Moonshot Kimi K2.6**
- `glm`: GLM-5 → **z.ai GLM-5.2**
- `minimax`: M2.5 → **Minimax M3**
- `deepseek`: V3.2 → **DeepSeek V4 Flash Lite** (nachträglich von dieser Session korrigiert; war vorher inkonsistent zur kanonischen Modelldefinition)

## 3. Compose: Audio-Tiers + Modell-Umschalter + Logos

**Live-Check bestätigte** (`gen.pollinations.ai/models`): `acestep` = „ACE-Step 1.5 Turbo", `paid_only:null` (free-fähig); `elevenmusic` & `stable-audio-3-medium` = `paid_only:true`. Kein serverseitiges `maxDuration` → Dauer-Stufen sind Produktentscheidung.

- [chat-options.ts](src/config/chat-options.ts): `ComposeModelOption` umgebaut auf `freeDurations`/`keyedDurations`; neue Helper `getComposeDurations(modelId, hasKey)`. ACE-Step frei = **[30, 60]s**, mit Key = **[30,60,120,180,240,300]s**; ElevenMusic v2 & Stable Audio nur mit Key, gestuft bis 5 Min. Anzeigenamen: „ACE-Step 1.5", „ElevenMusic v2".
- [useComposeMusicState.ts](src/hooks/useComposeMusicState.ts): nutzt `useHasPollenKey` + `getComposeDurations`; liefert `availableDurations` + `hasPollenKey`; `durationLabel()` statt statischer `DURATION_OPTIONS`; clamp auf erlaubte Stufen.
- [ComposeInlineHeader.tsx](src/components/tools/compose/ComposeInlineHeader.tsx): **Modell-Umschalter neu gebaut** (war vorher hart „ElevenMusic", ohne Auswahl) — 3 Modelle mit Logos + Lock-Icon für key-pflichtige; dynamische Dauer.
- [compose/route.ts](src/app/api/compose/route.ts): Free-Cap **30→60s** (`maxDuration = apiKey ? 300 : 60`). Test angepasst ([route.test.ts](src/app/api/compose/route.test.ts)).
- i18n: `compose.freeHint` (DE/EN).

## 4. Doku-Pflege

- [README.md](README.md): Modelltabellen gegen echte Registry neu (veraltete IDs wie `claude-airforce` raus); Pruna-Provider + Compose-Realität (ACE-Step frei / ElevenMusic+Stable mit Key) ergänzt.
- MEMORY.md (Auto-Memory): Falschnotiz „Pruna entfernt" korrigiert → Pruna ist wieder committet (`df986ba`, `b273862`), inkl. Provider-Switch + `p-*`-Familie.

## 5. Provider-Switch: Input-Bubble → Config-Sidebar

Plan: [~/.claude/plans/ein-paar-screenshots-aus-quiet-yeti.md](../.claude/plans/ein-paar-screenshots-aus-quiet-yeti.md)

- **Neuer Hook** [useProviderMode.ts](src/hooks/useProviderMode.ts): kapselt `providerMode` (localStorage `heyhi-provider-mode`, live-sync via CustomEvent) + `prunaAvailable` (`/api/capabilities`) + Guard (Fallback auf pollinations wenn Pruna weg). [useUnifiedImageToolState.ts](src/hooks/useUnifiedImageToolState.ts) nutzt ihn (~23 Zeilen Duplikat entfernt).
- **Switch raus aus der Bubble**: [VisualizeInlineHeader.tsx](src/components/tools/visualize/VisualizeInlineHeader.tsx) Switch-Block gelöscht; `onProviderModeChange`/`prunaAvailable` Props aus Header + [VisualizeInputContainer.tsx](src/components/tools/VisualizeInputContainer.tsx) + [ChatInput.tsx](src/components/chat/ChatInput.tsx) entfernt (`providerMode` bleibt für Modellfilter).
- **Switch rein in die Sidebar**: [PersonalizationSidebarSection.tsx](src/components/sidebar/PersonalizationSidebarSection.tsx) über „Standard Bild Modell", tappbare Labels + Lock bei fehlendem Key. Default bleibt `pollinations`.
- **Default-Bildmodell nach Provider gefiltert**: `getImageModels` → `getModelsByProvider(providerMode,…)` + `kind==='image'`; Reconcile auf gültiges Modell bei Providerwechsel. Live-Sync sorgt dafür, dass Sidebar-Switch sofort auf die Bubble-Modelliste wirkt.
- i18n: `provider.label` (DE/EN).
- Test: obsoleten Pruna-Switch-Test durch „kein Switch in Bubble"-Assertion ersetzt ([VisualizeInlineHeader.test.tsx](src/components/tools/visualize/VisualizeInlineHeader.test.tsx)).

## 6. Mobile: Logo-only + Params hinter 3-Punkte-Popover

Iteration: erst horizontale Scrollleiste umbrochen → dann Logo-only + handgebautes Popover → **final** (nach User-Feedback „öffnet nach unten & scrollt"):

- **Neue geteilte Komponente** [InlineParamsContainer.tsx](src/components/tools/InlineParamsContainer.tsx): desktop rendert Params inline; mobil (`useMediaQuery('(max-width: 639px)')`) hinter 3-Punkte-Button als **Radix DropdownMenu `side="top"`** (öffnet nach oben, kollisions-aware, nie von der unteren Kante abgeschnitten), Inhalt als **2-Spalten-Grid**. Auf Modul-Ebene definiert → Children remounten nicht beim Tippen.
- **Chat-LLM-Selector** ([ModelSelector.tsx](src/components/chat/input/ModelSelector.tsx)): Name mobil ausgeblendet wenn Logo vorhanden (`hidden sm:inline`) → nur Logo + Chevron.
- **Compose- & Visualize-Header**: Modell-Chip mobil logo-only (Name via `!isMobile`); alle Params via `InlineParamsContainer`.

## Wichtige Design-Entscheidungen (vom User bestätigt)

- Provider-Switch **komplett raus** aus Bubble (kein Read-only-Indikator).
- Default-Bildmodell-Dropdown **nach Provider filtern**.
- Lesbarkeits-Pass **gezielt** (Toolbars/Selektoren), **kein** globaler Font-Eingriff (font-weight 250 etc. bleibt offen).
- Mobile-Params: **Popover nach oben (Radix)** statt Bottom-Sheet; **2-Spalten-Grid**.
- `vace`/`zimage` bekommen bewusst das **WAN-Logo** (nicht Pruna).

## Offene Punkte / nächste Schritte

1. **Visuelle Mobile-Verifikation bei 375px** — vom User bestätigt: „sieht erstmal soweit gut aus". Einziges offenes Issue: Compose-3-Punkte-Button auf Mobile rutschte in zweite Zeile → gefixt mit Kurzlabels + „Compose" (ohne „with").
2. Mögliche Feinjustierung: bei sehr vielen Visualize-Params im schmalen Grid könnte eine Zelle (z.B. Negative-Prompt-Textfeld) knapp werden → ggf. einzelne Felder auf `col-span-2`.
3. `useMediaQuery` ist false-bis-Hydration → kurzer Desktop-Flash auf echten Geräten (üblicher Trade-off; alternativ reine CSS-Breakpoints).
4. Globaler Lesbarkeits-P0 (font-weight 250→400, WCAG-Kontrast) weiterhin offen (UX-Audit).
5. Nichts committet — Review + Commit stehen aus.

## Nachtrag Session 2026-07-06 (nach User-Review)

- **`durationLabel()`** (useComposeMusicState.ts): von Langformat („30 Sekunden"/"1 Minute") auf Kurzformat („30s"/"1m") geändert. Spart Platz im Desktop-Header, verhindert Cutoff des Instrumental-Switches.
- **`ComposeInlineHeader`**: Parent-Container auf `flex-wrap sm:flex-nowrap`; Mobile-Text von „Compose with" auf „Compose" gekürzt. Stellt sicher, dass der 3-Punkte-Button auf Mobile in einer Zeile bleibt.
- **`modelDisplayMap['deepseek']`**: von „DeepSeek V3.2" auf „DeepSeek V4 Flash Lite" (konsistent zur kanonischen Modelldefinition).
- **`HANDOFF.md`**: „Working tree clean" korrigiert → „dirty" mit 26 Dateien. `handoff-extra.md` nachdokumentiert.
- **Enhancement-Prompts (Compose)**: Einheits-VibeCraft → 3 modellspezifische Prompts: `ELEVENMUSIC` (VibeCraft + Composition Plan), `ACESTEP` (Text-Prompt-Output), `STABLE_AUDIO` (TrackType-Tags). `selectGuidelines()` + `isComposeModel` in route.ts auf alle drei Modelle erweitert.

## Verifikation reproduzieren

```bash
npx tsc --noEmit
CI=1 npx jest --runInBand
npx eslint src/components/tools/InlineParamsContainer.tsx \
  src/components/tools/visualize/VisualizeInlineHeader.tsx \
  src/components/tools/compose/ComposeInlineHeader.tsx \
  src/components/sidebar/PersonalizationSidebarSection.tsx
```

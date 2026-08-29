# Session-Handoff — Phase 3 abgeschlossen: die Modellwahrheit ist messbar

**Datum:** 2026-08-28
**Branch:** `main`, Vorgänger `fcb1124`
**Status:** Uncommitted — 32 Dateien im Arbeitsbaum, Commit und Push warten
ausdrücklich auf Freigabe des Nutzers.
**Art der Sitzung:** Audit und Ausführung von
[`PLAN-phase-3-modellwahrheit.md`](PLAN-phase-3-modellwahrheit.md) nach
Entscheidungsrounde. Der Plan stammte vom 2026-08-27 und wurde vor der Ausführung
gegen `fcb1124` geprüft (Abschnitt 2) und während der Ausführung gegen die
Live-Registry nachgeführt (Abschnitt 3) — die Plan-Tabellen wurden nie abgetippt.

---

## 1. Was entstanden und entschieden ist

### Die Entscheidungen des Nutzers (2026-08-28, bindend)

1. **Frage 1 (Community-Modelle) → B.** Der bestehende Schalter
   (`useShowCommunityModels`, Vorgabe aus) wird dokumentiert, nicht kuratiert.
   Zusätzlich: `community`-Modelle bleiben über `/api/generate` erreichbar, weil
   die Create-Liste key-scoped lebt — der Schalter sortiert die Oberfläche, nicht
   die Route.
2. **Frage 2 (p-\* auch bei Pollinations) → A.** Nur dokumentiert (`CLAUDE.md`,
   Provider Semantics). Kein zweiter Weg, keine Umstellung.
3. **Frage 3 (wiederkehrender Abgleich) → B + GitHub Action.** Skript +
   eingecheckter Snapshot + Tests, wöchentlicher Lauf
   (`.github/workflows/registry-check.yml`, montags 06:00 UTC), Fehlschlag meldet.
   **Kein Auto-Sync** — der Snapshot wird nie automatisch geschrieben.
4. **Schritt 6 (Chat-Modelle) → b.** `isFree` an `PollinationsModel`, die vier
   paid-Modelle markiert, Pollenwall im `ModelSelectorPanel` (sichtbar, POLLEN-Badge,
   ohne Schlüssel nicht wählbar). Vorgabe ohne Schlüssel: `deepseek`.
5. **L-B.4 → an die Phase angehängt.** Jedes sichtbare Modell muss einmal erfolgreich
   erzeugt haben — Nutzer-Browser-Session nach dem Deploy (Abschnitt 5).
6. **`playground.prunaEmpty` → neu geschrieben.** Ohne die driftende „14“-Zahl,
   in beiden Sprachblöcken korrekt, verdrahtet im `ModelPicker`, wenn der aktuelle
   Pruna-Eintrag ohne eigenen Schlüssel gewählt ist.

### E-A ist vor der Ausführung beantwortet worden

Der Plan nannte E-A („ist `PRUNA_API_KEY` auf Vercel?“) den einzigen echten Blocker.
Zwischen Plan und Ausführung wurde er bindend entschieden (Phase-0-Handoff §6,
Commit `a0a2eb9`): **Pruna ist BYOP-only, kein Server-Key, bleibt so.** Folge lt.
Plan 3.4: `zimage`, `qwen-image`, `wan-image-small` →
`isFree: false, enabled: false, byopVisible: true`.

### Geänderte Dateien (Produktivcode)

| Datei | Änderung |
|---|---|
| `src/config/unified-image-models.ts` | `grok-imagine`, `ideogram-v4-turbo` → `isFree:false, enabled:false, byopVisible:true` (E-A-Behandlung bei den drei Pruna-„Freien“). `kontext`, `gptimage-large` → `enabled:false` (Server-Key-Allowlist, s. u.). `ltx-2`, `grok-video`, `veo-1080p`, `pollinations-wan-fast` entfernt; interne Aliase `grok-video→grok-video-pro`, `veo-1080p→veo`. `nova-reel` bleibt aus (Beleg im Kommentar). `wan-fast`-Kollision dokumentiert statt umbenannt. |
| `src/lib/pollinations-registry.ts` | **B3:** `RegistryModel.aliases?` + `findRegistryModel` löst Anbieter-Aliase auf (`gpt-image→gptimage`, `veo-1080p→veo`). |
| `src/lib/playground/model-source.ts` | **Schritt 5:** `buildPollinationsEntries` blendet `enabled:false` aus der Config aus (nur gemappte IDs; `unmapped` bleibt). |
| `src/components/playground/ModelPicker.tsx` | Pruna-Hinweis (`playground.prunaEmpty`, neu geschrieben) wenn der aktuelle Eintrag Pruna ist und kein Schlüssel wirkt. Die „Key nötig“-Gruppe/Badges existierten bereits. |
| `src/config/chat-options.ts` | `isFree?: boolean` an `PollinationsModel`; vier live-paid-Modelle markiert; `DEFAULT_POLLINATIONS_MODEL_ID` `gemini-fast→deepseek` (Vorgabe war paid → garantierte 402); `AVAILABLE_COMPOSE_MODELS` ohne `acestep`. |
| `src/components/chat/input/ModelSelector.tsx` | **Pollenwall** im Chat-Modellwähler: paid-Modelle ohne Schlüssel zeigen POLLEN-Badge + Hinweis, sind nicht wählbar (`modelSelector.pollenRequired` DE/EN). |
| `src/config/translations.ts` | Neuer Schlüssel `modelSelector.pollenRequired`; `playground.prunaEmpty` neu geschrieben; **tote Schlüssel entfernt:** `playground.title`, `playground.cancel`, `playground.enhance` (Phase-2-Erbe). |
| `src/app/api/compose/route.ts` | `FREE_TIER_MODELS=[]`, `acestep` aus Typ + `VALID_COMPOSE_MODELS` + Vorgabe (`elevenmusic`). |
| `src/app/api/enhance-prompt/route.ts` | `acestep` aus `AUDIO_PROMPTS`; Fallback-Enhancer `gemini-fast→nova-fast` (paid-Fallback lief in 402). |
| `src/config/enhancement-prompts.ts` | `ltx-2`-Prompt + 3 Aliase entfernt; `grok-video`-Prompt → `grok-video-pro`; `acestep`/`ace-step` aus Audio-Keys + Aliase; **F6-Lücke geschlossen:** gemeinsamer `PRUNA_TASK_ENHANCEMENT_PROMPT` für die 7 Pruna-Modelle ohne jeden Beleg. |
| `src/config/unified-model-configs.ts` | `ltx-2`, `grok-video`, `veo-1080p`, `pollinations-wan-fast` entfernt; 4 fehlende Regler ergänzt (`p-image-ideogram`, `p-flux-klein`, `seedance-pro`, `nova-reel`). |
| `src/config/ui-constants.ts` | `ltx-2`/`grok-video`-Icons entfernt (+ Import); 9 fehlende `imageModelIcons` ergänzt. |
| `src/hooks/useUnifiedImageToolState.ts` | Normalizer führt entfernte IDs auf Kanoniker (`ltx-2→klein`, `grok-video→grok-video-pro`, `veo-1080p→veo`, `pollinations-wan-fast→wan`). |
| `src/hooks/useComposeMusicState.ts` | Typ + Vorgabe ohne `acestep` (`elevenmusic`). |

### Neu (Tests, Werkzeug, Doku)

| Datei | Inhalt |
|---|---|
| `scripts/check-model-registry.mjs` | Zieht alle drei Registry-Endpunkte, diff gegen die geführten IDs, Exit 1 bei Drift; `--update-snapshot` schreibt die Fixture. |
| `src/config/__fixtures__/registry-snapshot.json` | Eingecheckte Ziehung 2026-08-28T19:25 UTC (77/23/212 Einträge, 32/4/145 frei). |
| `src/config/__tests__/registry-truth.test.ts` | **T1/T2:** Existenz jeder geführten ID als name/alias; `isFree ⇔ !paid_only`; Pruna + `isFree:true` ausgeschlossen; Chat-Konsistenz. |
| `src/config/__tests__/registry-consistency.test.ts` | **T4:** Fünf Register aneinander gebunden — Regler + Icon für jede ID, verwaiste Einträge nur in dokumentierter Ausnahmeliste (`flux-2-dev`, `dirtberry`, `imagen-4`, `klein-large`, `seedance`, `seedream5`), Leichen der entfernten IDs verboten. |
| `src/app/api/enhance-prompt/route.test.ts` (+T5) | Alias-Integrität, keine verwaisten Prompts, **jede geführte ID hat Beleg** (handgeschrieben/Audio/Registry) — nie stiller DEFAULT. |
| `src/hooks/useUnifiedImageToolState.test.tsx` (+T7) | Gespeicherte entfernte IDs erzeugen keinen Fehler; Leiche wird aus dem localStorage geräumt. |
| `src/lib/pollinations-registry.test.ts` | B3-Test: Alias-Auflösung inkl. Cache. |
| `.github/workflows/registry-check.yml` | Wöchentlicher Lauf, Fehlschlag meldet Drift. |
| `CLAUDE.md`, `README.md`, `HANDOFF.md` | Drift-Warnungen **ersatzlos entfernt** (F7), korrigierte Listen, neuer Abschnitt „Modellwahrheit prüfen“, Open Questions mit den Anschlussfragen aus dieser Phase. |

---

## 2. Audit des Plans — was vor der Ausführung auffiel

Der Plan plante gegen `f880389` plus offenen Arbeitsbaum. Geprüft gegen `fcb1124`:

1. **Vorbedingung (Abschnitt 0) erfüllt:** Phase 0–2 gelandet, Baum sauber — die
   „liegt im Arbeitsbaum“-Notizen waren durch Phase 0 obsolet.
2. **E-A bereits beantwortet** (s. o.) — der Plan-„Blocker“ entfiel.
3. **Registry erneut gedriftet** (2. Mal binnen 48 h): 70→77 Einträge, 28/42→32/45.
   Der Plan selbst verlangt deshalb Schritt 1 zuerst — die Tabelle in Abschnitt 3
   wurde aus der frischen Skriptausgabe abgeleitet, nicht abgetippt.
4. **Zwei Plan-Maßnahmen waren veraltet:** `grok-video` löst nicht mal mehr als
   Alias auf (nur RAUS blieb), und `pollinations-wan-fast` ist gar kein
   Registry-Alias (nur RAUS).
5. **Phase-1/2-Erbe fehlte im Plan:** `LAUNCH_CRITERIA.md` Bereich B (L-B.4) und die
   toten `playground.*`-Schlüssel — beide in die Phase gezogen (Entscheidungen 5/6).
6. Kleinigkeiten: alle Zeilenrefs hielten ±3 Zeilen; `scripts/` (nicht `tools/`) als
   Konvention bestätigt; `GEMINI.md` führt keine Modelllisten → Plan-Punkt gegenstandslos.

---

## 3. Die großen Befunde der Ausführung — beide live belegt

### B-A — Die Registry ist key-scoped; der Server-Key entscheidet den Free Tier

Anonym liefert `/image/models` 77 Einträge. **Mit dem Server-Key nur die Modelle,
die sein Allowlist-Eintrag erlaubt** — der Cache-Kommentar in
`image-model-registry.ts` sagt es wörtlich („die Antwort unterscheidet sich je nach
Berechtigung“). Live geprüft 2026-08-28 gegen Produktion:

| Modell | Registry | Produktion (Server-Key) |
|---|---|---|
| `flux`, `klein`, `gpt-image`(→`gptimage`) | frei | **200, echtes Asset** |
| `kontext`, `gptimage-large` | frei | **403 „Model not allowed for this API key“** |

Folgen: (a) die FREE-Gruppe enthielt Einträge mit Garantie-Fehler — die `kontext`/
`gptimage-large` sind jetzt `enabled:false` mit Belegkommentar; (b) die Create-Liste
ist automatisch mit dem Dispatch konsistent, weil sie denselben Key-Scope nutzt;
(c) `dreamshaper`/`nova-canvas`/`gpt-image-2` wurden **nicht** aufgenommen — nicht auf
der Allowlist, und über das key-scoped Create erscheinen sie automatisch, sobald ein
eigener Schlüssel sie erlaubt. **Betreiberaufgabe:** Allowlist erweitern, dann
`enabled` zurücksetzen (Open Question in `CLAUDE.md`).

### B-B — Zwei Vorgaben zeigten in den 402/503

- `DEFAULT_IMAGE_MODEL = 'zimage'` — der Chat-Visualize-Vorgabe lief über den
  Pruna-Dispatch → **503 ohne eigenen Schlüssel**. Jetzt `flux`.
- `DEFAULT_POLLINATIONS_MODEL_ID = 'gemini-fast'` — live `paid_only` → **402 für
  jeden neuen keylosen Nutzer**. Jetzt `deepseek`. (Nebenan: der
  Fallback-Enhancer in `/api/enhance-prompt` war ebenfalls `gemini-fast`, jetzt
  `nova-fast`.)

Das erklärt zusammen mit B-A einen Großteil von „oft steht nur Fehler da“.

### Weitere Befunde

- **`nova-reel` ist registry-frei, aber nicht lieferbar:** ein 6-s-Lauf brach live
  nach 125 s mit **524** ab, bevor das Ergebnis da war — der Pollinations-Dispatch
  ist synchron, das 202-Protokoll deckt nur Pruna ab. Bleibt `enabled:false`
  (Phase 4: Async-Protokoll).
- **TTS ist ein Registry-Blindfleck:** `/api/tts` läuft live (200) über
  `tts-1`/`elevenlabs` + Server-Key; `tts-1` fehlt in `/audio/models`. Kein Umbau,
  dokumentiert.
- **`wan-fast`-Namenskollision** dokumentiert statt umbenannt: die ID ist im
  `PRUNA_MODEL_MAP` ladend; Umbenennen wäre ein Refactor ohne Verhaltensgewinn bei
  einem deaktivierten Eintrag (Abweichung vom Plan, bewusst).
- **F6-Lücke geschlossen:** sieben Pruna-Modelle (`p-image-try-on`, `p-image-ideogram`,
  `p-flux-klein`, `p-image-upscale`, `p-video-avatar`, `p-video-animate`,
  `p-video-replace`) hatten weder handgeschriebenen Prompt noch Registry-Beleg —
  sie fallen still auf den DEFAULT. Ein gemeinsamer Pruna-Task-Prompt beendet das.
- **Das lokale `.env`-Key-Budget ist aufgebraucht** (0 pollen): Dev-Server-Gegenprobe
  von `flux` antwortet 402 „budget too low“. Kein Code-Problem, aber der nächste
  Thread sollte wissen, warum der lokale `flux`-Lauf scheitert.

---

## 4. End-to-End-Verifikation

| Prüfung | Ergebnis |
|---|---|
| `node scripts/check-model-registry.mjs` | vor den Fixes 6 Abweichungen (live gezogen), danach **„Keine Abweichungen“** |
| `npm run lint` | sauber (0 Fehler/Warnings) |
| `npx tsc --noEmit` | sauber |
| `CI=1 npx jest --silent` | **109 Suiten, 850 Tests** grün (vorher 107/781; +2 Suiten = registry-truth, registry-consistency) |
| `npm run build` | erfolgreich, `/playground` statisch |
| Dev-Server `gpt-image` | 403 nennt `gptimage` → Repo-Alias resolved und dispatched (Allowlist-403 ist lokal erwartbar) |
| Dev-Server `veo-1080p` | kein 400 — interner Alias → `veo` → echter Videodispatch (synchron, durch curl-Timeout beendet) |
| Live `klein`, `gpt-image` | 200 mit echtem Asset (Server-Key-Allowlist der Produktion) |
| Live `nova-reel` | 524 nach 125 s (Beleg für die `enabled:false`-Entscheidung) |
| Live `/api/tts` | 200 mit echtem Audio |
| GitHub Action | angelegt; erst nach Push aktiv |

---

## 5. Was offen bleibt

1. **L-B.4 (Nutzer, nach dem Deploy):** jedes sichtbare Modell einmal erzeugen —
   keylose Stichproben (`flux`, `klein`, `gpt-image`, Chat mit `deepseek`) plus
   Schlüssel-Modelle nach Wahl; `LAUNCH_CRITERIA.md` Bereich B dann auf Status setzen
   (L-B.1–L-B.3 sind durch diese Phase erfüllt, Status erst nach der Live-Sicht setzen).
2. **Betreiberaufgabe Allowlist:** `kontext`/`gptimage-large` sind Registry-frei und
   auskommentiert `enabled:false` — nach Allowlist-Erweiterung reaktivieren.
3. **Phase 8 erbt den Rest des `acestep`:** die Route, die Listen und die Vorgaben sind
   sauber; Texte/Docs außerhalb dieser Phase und die neue Musik-UI bleiben dort.
4. **Systemprompt:** die Formatierungs-Hinweise in `chat-options.ts` nennen `ltx-2`/
   `grok-video` weiterhin — Systemprompt ist nur auf ausdrückliche Weisung anfassbar
   (Open Question in `CLAUDE.md` vermerkt).
5. **Geister in `unified-model-configs.ts`** (`flux-2-dev`, `dirtberry`, `imagen-4`,
   `klein-large`, `seedance`, `seedream5`) sind als dokumentierte Ausnahmen sichtbar
   (T4) — ihre Entfernung braucht einen eigenen Auftrag, wie im Plan vorgesehen.
6. **Provider-Entscheidung `zimage`/`p-*`-Familie:** Pollinations-Anbindung wäre
   evalulierbar (Frage 2 Option B) — offen, nicht dringend.

## 6. Für den nächsten Thread

1. Commit/Push nachholen, sobald der Nutzer freigibt; danach die GitHub Action aktivieren
   (läuft automatisch nach Push) und L-B.4 im Browser durchziehen.
2. `LAUNCH_CRITERIA.md` Bereich B: erst nach den Live-Prüfungen auf Status setzen.
3. Phase 4 (Fehlerklarheit) erbt: 402/403/503-Ton, Pollenwall-Texte, Async-Protokoll
   für Pollinations-Videos (Beleg: nova-reel-524), `predictionId` über Reload.
4. Modellfragen **nie** gegen diese Doku prüfen — `node scripts/check-model-registry.mjs`
   ziehen, dann entscheiden.

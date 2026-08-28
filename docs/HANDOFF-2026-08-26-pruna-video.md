# Session Handoff — Pruna-Video-Fehler, VACE, Client-Polling, Pollen-Key

**Datum:** 2026-08-26
**Branch:** `main`, nichts committet
**Zustand:** 780 Tests grün, `typecheck` und `lint` sauber, gegen den laufenden Dev-Server live verifiziert

> **Achtung vor dem Committen:** Der Arbeitsbaum enthielt schon vor dieser Session
> umfangreiche fremde Änderungen (Chat-Input-Umbau, Settings-Umzug, ASCII-Komponenten,
> Rate-Limit, Features-Flag …). Die unten gelisteten Dateien sind die dieser Session —
> alles andere gehört zu laufender Arbeit von vorher und wurde nicht angefasst.

---

## Ausgangslage

Der Nutzer meldete: Pruna-Videomodelle antworten mit
`Pruna API error (400): property input validation failed: additional…`
(Meldung in der UI abgeschnitten). Dazu 403-Fehler auf `/api/pollen/account`.

## Was gefunden wurde

### 1. Pruna lehnt jedes unbekannte Input-Feld ab

Die vollständige Meldung lautet `additional properties forbidden, found <feld>`.
Direkt gegen `api.pruna.ai` verifiziert:

| Modell | Feld | Ergebnis |
|---|---|---|
| `wan-i2v` | `optimize_prompt` | verboten |
| `wan-i2v` | `aspect_ratio` | verboten (Verhältnis kommt aus dem Startbild) |
| `vace` | `disable_safety_checker` | nicht im Schema |
| `vace` | `speed_mode: "Moderately Juiced 🍊🍊 (balanced)"` | kein gültiger Enum-Wert |
| `vace` | `frame_num` > 81 | Schema erlaubt 1–81 |
| `wan-t2v` | alles, was wir schickten | gültig — war nie kaputt |

**Mechanismus:** `param-schema.ts` definierte Regler, die es im Pruna-Schema nicht gibt,
und `buildInput` schaufelte den ganzen `params`-Bag über `...rest` ungefiltert ins Input.

**Modell-Schemas:** `https://docs.api.pruna.ai/guides/models/<modell>` — bei der Prüfung
durchgängig korrekt, verlässlicher als Raten.

**Sicher testen, ohne einen echten Job auszulösen:** eine unerreichbare Medien-URL
(`https://invalid.invalid/x.jpg`) mitschicken. Die Validierung läuft vollständig, die
Generierung bricht am Download ab. Ohne diesen Trick startet jeder gültige Payload einen
echten, kostenpflichtigen Lauf — Pruna hat **keinen** Cancel-Endpoint.

### 2. VACE passt in kein Request-Timeout

Mit echten Jobs gemessen:

| Lauf | Dauer |
|---|---|
| VACE, Defaults (Lightly Juiced, 50 Steps, 80 Frames) | **700 s** |
| VACE, schnellste Variante (Extra Juiced, 25 Steps, 80 Frames) | **348 s** |
| wan-t2v, 5 s mit `go_fast` | **45 s** |

Altes Poll-Limit im Server: 180 s. Vercel-Function-Limit ohne Konfiguration: 300 s
(`vercel.json` ist leer). VACE konnte also strukturell nie durchlaufen.

### 3. Das leere Pollen-Key-Feld

`SettingsPopover` initialisierte `pollenInput` aus `pollenKey` des Hooks. `usePollenKey`
liest localStorage aber erst in einem Effect nach dem Mount — der `useState`-Initializer
lief also immer gegen `null` und das Feld blieb leer. Die Lampe daneben (`!!pollenKey`)
zog korrekt nach. Nicht playground-spezifisch: beide Oberflächen nutzen denselben Hook
und denselben Schlüssel `pollenApiKey`.

---

## Was geändert wurde

### Pruna-Payloads
- [`src/config/pruna-models.ts`](../src/config/pruna-models.ts) — `wan-i2v` verwirft
  `aspect_ratio` und `optimize_prompt` aus dem `params`-Bag; `vace` sendet kein
  Safety-Feld mehr; neues `vaceFramesFor()` rechnet Sekunden in die erlaubten 1–81 Frames
- [`src/lib/playground/param-schema.ts`](../src/lib/playground/param-schema.ts) — die
  zwei toten `wan-i2v`-Regler entfernt; `vace` bekam die echten `speed_mode`-Werte,
  `frame_num` max 81 und einen Sekunden- statt eines Frames-Reglers

### Client-Polling statt wartender Requests
Kein Request wartet mehr auf ein Video. `/api/generate` antwortet auf alles, was nicht
sofort fertig ist, mit `202 { pending, predictionId, model }`; der Browser pollt.

- [`src/lib/pruna/client.ts`](../src/lib/pruna/client.ts) — `generateViaPruna` endet
  bei der Lauf-Id (Rückgabetyp `PrunaDispatchResult`, Wächter `isPendingPrediction`);
  neues `fetchPrunaPredictionStatus()` als **eine** Abfrage; das server-seitige
  `pollPrediction` ist gelöscht. Die Prediction-Id wird gegen
  `/^[A-Za-z0-9_-]{1,128}$/` geprüft, bevor sie in eine URL geht
- [`src/lib/pruna/deliver.ts`](../src/lib/pruna/deliver.ts) **(neu)** — Download +
  Media-Upload, geteilt von beiden Routen, damit die Antwortform identisch bleibt
- [`src/app/api/pruna/status/route.ts`](../src/app/api/pruna/status/route.ts) **(neu)** —
  `GET ?id=&model=`, antwortet 202 solange gerechnet wird, sonst exakt wie `/api/generate`
- [`src/lib/generation/request-generation.ts`](../src/lib/generation/request-generation.ts)
  **(neu)** — hält das Warten im Tab (3 s Intervall, 30 min Reißleine, abbruchfähig) und
  gibt dieselbe `Response` zurück, die der Aufrufer vorher direkt bekam
- [`src/app/api/generate/route.ts`](../src/app/api/generate/route.ts),
  [`PlaygroundShell.tsx`](../src/app/playground/PlaygroundShell.tsx),
  [`chat-service.ts`](../src/lib/services/chat-service.ts) — nutzen die neuen Bausteine;
  bei den Konsumenten war es ein Zeilentausch `fetch` → `requestGeneration`

**Live verifiziert** (Dev-Server, echter wan-t2v-Lauf):
```
POST /api/generate          -> 202 {"pending":true,"predictionId":"m4jmrv…","model":"wan-t2v"}
GET  /api/pruna/status?…    -> 202
GET  /api/pruna/status?…    -> 200 {"videoUrl":"https://media.pollinations.ai/32a939bc-…"}
```

### VACE ausgeblendet
Auf Wunsch des Nutzers **nicht** gelöscht, nur abgeschaltet — Mapping, Schema und
Enhancement-Prompt liegen unberührt weiter.

- [`src/config/unified-image-models.ts`](../src/config/unified-image-models.ts) —
  `enabled: false` **und** `byopVisible: false`; ohne das zweite holt ein Pruna-Schlüssel
  das Modell in Visualize wieder hervor (`isVisibleVisualModel`)
- [`src/lib/playground/model-source.ts`](../src/lib/playground/model-source.ts) —
  **allgemeiner Bug:** `buildPrunaEntries()` hat `enabled` nie gelesen und hätte jedes in
  der Registry abgeschaltete Pruna-Modell weiter angezeigt. Filtert jetzt danach

Nebeneffekt, so gewollt: `resolvePollinationsVisualModelId` kennt `vace` nicht mehr,
`POST /api/generate {"model":"vace"}` antwortet `400 Unknown or unavailable`.

### Pollen-Key
- [`src/components/settings/SettingsPopover.tsx`](../src/components/settings/SettingsPopover.tsx) —
  `pollenInput` liest synchron `getStoredPollenKey()`, wie das Pruna-Feld daneben
- [`src/hooks/usePollenKey.ts`](../src/hooks/usePollenKey.ts) — bei einem Fehler wird
  die Begründung von Pollinations mitgeloggt statt nur der Status

---

## Offen

1. **Der 403 auf `/api/pollen/account` ist ungeklärt.** Der Endpunkt selbst funktioniert:
   `gen.pollinations.ai/account/balance` antwortet mit dem Server-Key aus `.env.local`
   mit 200 und Kontostand. Der 403 gilt also dem Schlüssel im Browser des Nutzers —
   abgelaufener OAuth-Token, fehlende `balance`-Berechtigung oder ein fremdes Konto.
   **Nächster Schritt:** Seite neu laden, Konsolenzeile `[BYOP] Failed to fetch account
   info:` lesen — sie nennt jetzt den Grund.
2. **`normalizePollenKey` prüft nur erlaubte Zeichen, kein Präfix** — ein beliebiger Text
   im Storage macht die Lampe grün.
3. **Die grüne Lampe hängt allein am Vorhandensein des Schlüssels**, nicht an seiner
   Gültigkeit. Ein 403 könnte sie auf „ungültig" setzen; dafür braucht der Hook einen
   dritten Zustand (Schlüssel da, Konto nicht abrufbar), sonst wird jeder Netzwerkhänger
   als Trennung gedeutet.
4. **Ein Reload während der Generierung verliert den Lauf** — die `predictionId` liegt nur
   im Speicher. In `localStorage` mitgeschrieben, überlebt ein langer Lauf einen Reload.
5. **Keine Fortschrittsanzeige bei langen Läufen.** Pruna liefert nur
   `starting`/`processing`/`succeeded`, keinen Prozentwert. Eine verstrichene Zeit auf der
   laufenden Karte wäre das Machbare.
6. **`CLAUDE.md` kennt das neue Muster noch nicht.** Der Abschnitt „Asset Persistence"
   beschreibt weiter den direkten Weg über `/api/generate`; das 202-Protokoll und
   `/api/pruna/status` fehlen. Ebenso fehlt der Hinweis, dass Pruna unbekannte Felder mit
   400 ablehnt.
7. **`vercel.json` ist leer.** Für die Pollinations-Pfade unkritisch, seit nichts mehr auf
   ein Video wartet — aber es gibt auch kein gesetztes `maxDuration` als Sicherheitsnetz.

## Kostenhinweis

Beim Messen und Verifizieren sind auf dem Pruna-Konto des Nutzers echte Läufe entstanden:
zwei versehentliche beim Sondieren der Feldnamen (vace, wan-t2v), zwei Messläufe (vace)
und ein End-to-End-Lauf (wan-t2v). Pruna bietet keinen Cancel-Endpoint.

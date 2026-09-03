# Handoff — Sound: Review, drei Fixes, erster echter Lauf

**Datum:** 2026-09-03
**Branch:** `main`, Ausgangs-HEAD `53fa749`, **End-HEAD `4c49001`** — gepusht.
**Art der Sitzung:** Review des von Codex gebauten Sound-Stands, Plan für die
Modellwahl, und die drei Befunde behoben, die vor einem Push liegen mussten.

---

## 1. Ergebnis in einem Satz

Sound ist live erreichbar und der ACE-Step-Weg ist gegen den echten Endpunkt bestätigt —
aber **auf Vercel fehlen die Modal-Zugangsdaten**, deshalb antwortet die Route dort
`503 SOUND_NOT_CONFIGURED`. Das ist eine Betreiberaufgabe, kein Code.

---

## 2. Was gepusht wurde

| Commit | Inhalt |
|---|---|
| `b920ed9` | *(Codex)* ACE-Step-1.5-Route — Modal-Proxy für Task-Start, Poll und Ergebnis |
| `e43de99` | *(Codex)* Sound-Modus in Create — Panel, Audio-Galerie, Audio-Proxy, Tag-Enhance |
| `6a5435c` | Fehler tragen einen Code und werden zu einem deutschen Satz |
| `ab41cfa` | Der Audio-Proxy bekommt eine Allowlist |
| `4c49001` | Plan für die Modellwahl, beide Entwürfe, `.gitignore` |

Die zwei Codex-Commits lagen zwei Tage lokal und sind mit dieser Sitzung erstmals live.

---

## 3. Der erste echte Lauf — was er bewiesen hat

Ein Lauf gegen den echten Modal-Endpunkt, 30 s, `batch: 1`, instrumental
(Betreiberfreigabe eingeholt, weil er GPU-Zeit kostet):

```text
POST /api/sound            → 200 in 14 s, task_id, queuePosition 1
GET  /api/sound?taskId=…   → status 1 nach ~16 s (Container war warm)
entry.file                 → /v1/audio?path=%2Ftmp%2Facestep-tmp%2Fapi_audio%2F8f1e….mp3
GET  /api/sound/audio?path=…  → 200, audio/mpeg, 480 813 Bytes
file                       → MPEG layer III, 128 kbps, 48 kHz, Stereo
```

**Damit ist die Allowlist bestätigt.** Vor dem Lauf war offen, ob sie zu eng geschnitten
ist — `entry.file` hätte auch ein roher Ausgabepfad sein können, dann hätte die Regel
echte Ergebnisse blockiert statt Fremdzugriff. Sie trifft genau: `/v1/audio?…` kommt
durch, `/release_task` wird live mit `400 SOUND_INVALID_PATH` abgewiesen.

### Zwei Befunde, die der Lauf nebenbei geliefert hat — nicht behoben

**3.1 Der gespeicherte Prompt ist nicht der des Nutzers.**
ACE-Steps Planner expandiert die Tags zu Prosa und gibt sie als `prompt` zurück. Der
Client speichert `entry.prompt ?? frozen.tags` — also landet in der Galerie:

> „An instrumental electronic track driven by a deep, resonant synth bass playing a
> hypnotic, repeating melodic figure…"

statt der Eingabe `dub techno, deep, analog synth, sub bass, minimal, 120 bpm`. Wer
später seinen Track sucht, findet einen fremden Absatz. Empfehlung: die Tags speichern,
die Expansion höchstens daneben zeigen.

**3.2 `metas` wird verworfen.** Das Ergebnis trägt
`{bpm: 107, duration: 30.0, keyscale: "D minor", timesignature: "4"}`. Für eine
Musikoberfläche ist genau das der Inhalt der Detailleiste — und es kostet nichts, es ist
schon da.

---

## 4. Die drei behobenen Befunde

### 4.1 Der Audio-Proxy war offen

`/api/sound/audio` trägt den Modal-Schlüssel des Betreibers und ist öffentlich
erreichbar. Der Pfad wurde nur auf `startsWith('/')` geprüft — damit war **jeder**
GET-Endpunkt des ACE-Step-Servers durchgereicht, authentifiziert mit einem Schlüssel, den
der Aufrufer nie zu sehen bekommt. Das Repo hat für diese Klasse
`remote-fetch-policy.ts`; `/api/proxy-image` ist auf drei Hosts beschränkt.

`isAllowedAudioPath()` lässt jetzt nur `/v1/audio` durch, mit Grenzprüfung: Präfix
selbst, `?…` und `/…`. Nicht durch: `/v1/audiofoo`, `//host`, absolute URLs, `..`.
Ein blockierter Pfad wird geloggt — ändert ACE-Step die Ausgabeform, steht der Grund im
Log statt in einer Rätselstunde.

### 4.2 Kein Fehler trug einen Code

`grep -c "code:"` ergab **null** in beiden Routen. Der Client fiel auf „Status plus
Rohtext" zurück, und der Rohtext war englisch. Genau der Fehler, den Phase 4 für
Pollinations behoben hat, eine Route später wieder drin.

Die Routen werfen jetzt `ApiError`; `handleApiError` trägt den Code von selbst durch.
Sechs neue Codes: `SOUND_NOT_CONFIGURED`, `SOUND_BACKEND_ERROR`, `SOUND_INVALID_PATH`,
`SOUND_FIELD_TOO_LONG`, `SOUND_TIMEOUT`, `SOUND_NO_AUDIO`. Wiederverwendet statt neu
erfunden: `RATE_LIMITED`, `VALIDATION_ERROR` (mit `field`), `PROVIDER_UNAVAILABLE` für
5xx. `DescribeContext` hat ein `limit` bekommen, damit ein Satz die Grenze nennen kann.

Auch die clientseitig geworfenen Fehler gehen jetzt denselben Weg (`codeError`) — vorher
stand „Sound-Task hat kein Ergebnis geliefert (Timeout)" wörtlich in der Oberfläche.

### 4.3 Keine Tests

18 neue Tests: 13 für `/api/sound` (Validierung, Grenzwerte, instrumental-Ableitung,
alle Fehlerwege), 5 für die Allowlist. Der Modal-Endpunkt ist gemockt; ein echter Aufruf
im Test hätte einen abrechenbaren Lauf gestartet.

---

## 5. Was der Review fand und **nicht** behoben ist

Diese neun stehen im Plan, nicht im Code:

1. **L-K.1 muss präzisiert werden.** Das Kriterium schützt den *Pollinations*-Server-Key.
   Modal-Credits sind eine bewusste Betreiberausgabe — der Betreiber trägt das Risiko
   (Ansage 2026-09-03) und trägt es selbst ein. Ohne den Eintrag liest die nächste
   Prüfung Sound als Regression.
2. **Das Rate-Limit ist weich.** Per IP *und* per Instanz; auf Vercel laut eigenem
   Kommentar „a soft per-instance limit". `/api/sound/audio` hat gar keins.
3. **`instrumental` erreicht Modal nie** — die Route berechnet es und gibt es nur an den
   Client zurück. Der Shell leert stattdessen die Lyrics; das wirkt, ist aber nicht, was
   die Modelldoku verlangt (`instrumental` in die Tags *und* `[inst]` in die Lyrics).
4. **Dauer bis 240 s** in Route und Regler; ACE-Step-Doku sagt ≤120 s, darüber bricht die
   Kohärenz ein.
5. **Das Tag-Feld ist doppelt sichtbar** — SoundPanel (512 Zeichen, Tag-Zähler) und
   PromptBar (1000 Zeichen, Zähler „x / 1000", Platzhalter „Beschreib, was du sehen
   willst…"). Wer 600 Zeichen in die PromptBar tippt, sieht „alles gut" und bekommt 400.
6. **Kein Timeout gegen Modal** — `fetch` ohne Timeout bei `startup_timeout=1800`.
7. **Zwei Knöpfe im SoundPanel sind `min-h-9`** (36 px statt 44).
8. **Akzentfarbe halb umgesetzt** — nur der Dauer-Regler nutzt `--mode-compose`.
9. **Zwei Kommentare lügen** — `enhancement-prompts.ts:1441` sagt „'ace-step' entfernt",
   ist wieder da; der Abschnittskopf „ACE-STEP 1.5 ENHANCEMENT" steht über
   `STABLE_AUDIO_ENHANCEMENT_PROMPT`.

Der innere `path`-Parameter von `/v1/audio` ist ungeprüft. Ihn einzugrenzen würde den
Proxy an ein internes Ausgabeverzeichnis von ACE-Step koppeln; der Container ist ephemer
und trägt nur Gewichte und Ergebnisse. Bewusst offen gelassen.

---

## 6. Verifikation, Endstand `4c49001`

```text
npm run lint           → sauber
npx tsc --noEmit       → sauber
CI=1 npx jest --silent → 124 Suiten, 972 Tests grün (Start: 122/954)
npm run build          → erfolgreich
git status             → leer
```

Live nach dem Deploy: `POST /api/sound` → `503 SOUND_NOT_CONFIGURED` (siehe 7.1).

---

## 7. Was offen ist

### 7.1 Betreiberaufgabe — ohne die läuft Sound live nicht

**`MODAL_ACESTEP_URL` und `MODAL_ACESTEP_KEY` fehlen in den Vercel-Env-Variablen.**
Lokal stehen sie in `.env.local`, auf Vercel nicht. Die Route antwortet deshalb live mit
`503 SOUND_NOT_CONFIGURED`. Beide Werte in den Projekt-Einstellungen für Production
setzen, dann greift der nächste Deploy.

Danach ein echter Lauf über die Live-Seite — der lokale Lauf hat den Weg bewiesen, nicht
die Vercel-Umgebung.

### 7.2 Doku, die Sound noch nicht kennt

`LAUNCH_CRITERIA.md`, `FAHRPLAN-create.md` und `CLAUDE.md` erwähnen Sound **nirgends**.
Konkret fehlt:

- **Bereich G neu schreiben.** Die vier Kriterien sind auf die Pollenwall formuliert, und
  L-G.4 verlangt wörtlich „Kein `acestep` mehr im Code" — ACE-Step ist jetzt das
  Herzstück. Bereich G war der letzte offene Block vor der Freigabe.
- `CLAUDE.md`: die zwei `MODAL_ACESTEP_*` in der Schlüsseltabelle, ein Abschnitt „Sound"
  nach dem Muster von „Create".
- Fahrplan Phase 8 beschreibt „vierter Modus, alles hinter der Pollenwall" — das stimmt
  nicht mehr, und dass dies faktisch die Wiederaufnahme von Phase 10 (eigene
  Infrastruktur) ist, gehört vermerkt.

### 7.3 Der nächste Bauabschnitt

[`PLAN-sound-modellwahl-2026-09-03.md`](PLAN-sound-modellwahl-2026-09-03.md). Kern:

- **Additive Modellregel:** ACE-Step immer, ein Pollen-Schlüssel schaltet `elevenmusic`,
  `lyria-3-clip`, `stable-audio-3-large` und `-medium` dazu.
- **Blocker zuerst (Paket A):** `/api/compose` ruft `httpsFetchBinary` ohne
  Timeout-Parameter und erbt 30 s, während dieselbe Route Dauern bis 300 s erlaubt. Die
  vier Pollinations-Modelle können so nie fertig werden.
- Fünf Modelle, aber nur **zwei** API-Wege — die Registry liefert für Audio keine
  Parameter-Schemas, die Parameter müssen von Hand geführt werden.
- Zweistufiger Moduswechsel `image · video · sound` mit `text ↔ edit` darunter, als
  Darstellung über dem bestehenden `PlaygroundMode` — kein neuer State.

Fünf offene Entscheidungen stehen dort in Abschnitt 6.

---

## 8. Für den nächsten Thread

1. Env-Variablen auf Vercel setzen (7.1), dann live erzeugen.
2. Paket A aus dem Plan — ohne die Zeitgrenze ist der Rest der Modellwahl wirkungslos.
3. Bereich G in `LAUNCH_CRITERIA.md` neu schreiben, bevor jemand dagegen prüft.
4. Die neun offenen Review-Befunde aus Abschnitt 5 sind im Plan verortet, nicht verloren.

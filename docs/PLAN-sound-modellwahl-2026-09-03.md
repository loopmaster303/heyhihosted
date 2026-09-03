# Plan — Sound: fünf Modelle, eine Regel, zweistufiger Moduswechsel

**Datum:** 2026-09-03
**Branch:** `main`, HEAD `e43de99` (zwei Sound-Commits, **nicht gepusht**)
**Art:** Plan. Kein Code in dieser Sitzung.
**Grundlage:** Review des Stands vom 2026-09-03, live gezogene Audio-Registry, Lesen von
`param-schema.ts`, `compose/route.ts`, `https-post.ts`, `ModeTabs.tsx`, `SoundPanel.tsx`
und der beiden Sound-Routen.

---

## 1. Ziel

**In einem Satz:** Sound bietet immer das selbst gehostete ACE-Step, ein Pollen-Schlüssel
schaltet die vier Pollinations-Musikmodelle dazu — jedes mit seinen eigenen Parametern,
und der Moduswechsel heißt `image · video · sound` statt `t2i i2i t2v i2v`.

### Die Modellregel

Sie ist **additiv**: ACE-Step steht immer da, der Schlüssel schaltet dazu.

| Zustand | Sichtbare Modelle | Wer zahlt |
|---|---|---|
| **Kein Pollen-Key** | `acestep-1.5` (Modal, selbst gehostet) | Betreiber, über Modal-Credits |
| **Pollen-Key hinterlegt** | `acestep-1.5` **plus** `elevenmusic`, `lyria-3-clip`, `stable-audio-3-large`, `stable-audio-3-medium` | ACE-Step der Betreiber, die vier anderen der Nutzer aus seinem Guthaben |

ACE-Step liegt **nicht** hinter der Pollenwall — es *ist* die freie Variante und bleibt für
jeden wählbar. Damit ist Musik das erste Angebot in hey.hi, das ohne Schlüssel
funktioniert statt zu erklären, warum es nicht geht.

**Folge, die im Blick bleiben muss:** Da ACE-Step auch mit hinterlegtem Schlüssel
wählbar bleibt, tragen die Modal-Credits jeden ACE-Step-Lauf — auch den von Nutzern, die
selbst zahlen könnten. Das ist gewollt (die freie Variante soll frei bleiben), aber es
heißt: die Betreiberkosten wachsen mit der Nutzung insgesamt, nicht nur mit der Zahl der
Nutzer ohne Schlüssel. Die Kennzeichnung aus E-3 ist deshalb kein Beiwerk — sie ist das
Mittel, mit dem ein Nutzer mit Guthaben überhaupt erkennt, dass er hier auf fremde
Rechnung erzeugt.

---

## 2. Fertig-Kriterien

| # | Kriterium | Prüfung |
|---|---|---|
| **F1** | Ohne Schlüssel zeigt der Sound-Modus genau ein Modell: ACE-Step | Frisches Profil, `/create`, Modus `sound`; Modellwahl enthält `acestep-1.5` und sonst nichts |
| **F2** | Mit Schlüssel zeigt er alle fünf — ACE-Step bleibt, die vier kommen dazu | Schlüssel hinterlegen, Liste erneut öffnen; `acestep-1.5` steht weiterhin drin |
| **F3** | Ohne Schlüssel erzeugt ACE-Step einen abspielbaren Track | Ein Lauf, Ergebnis abspielen, Reload, erneut abspielen |
| **F4** | Mit Schlüssel erzeugt **jedes** der vier Modelle einen abspielbaren Track | Je ein Lauf mit eigenem Schlüssel |
| **F5** | Beim Modellwechsel wechseln die Parameter sichtbar mit | ACE-Step → Tags/Lyrics/Varianten; Pollinations-Modell → Beschreibung/Dauer/instrumental; kein Feld bleibt stehen, das das neue Modell nicht kennt |
| **F6** | Der Moduswechsel heißt `image · video · sound`, mit `text ↔ edit` darunter | Sichtprüfung; jede der fünf Kombinationen führt auf den richtigen `PlaygroundMode` |
| **F7** | Kein Lauf stirbt am 30-Sekunden-Proxy | Ein Pollinations-Lauf mit 120 s Dauer läuft zu Ende |
| **F8** | Der Audio-Proxy leitet nur Ergebnispfade weiter | `/api/sound/audio?path=/release_task` wird mit 400 abgewiesen |
| **F9** | Jeder Sound-Fehler trägt einen Code und erscheint als deutscher Satz | Alle Fälle aus 3.3 auslösen; keine englische Rohmeldung |
| **F10** | Beide Sound-Routen haben Tests | `src/app/api/sound/route.test.ts` und `audio/route.test.ts` existieren und sind grün |

**Nicht Kriterium:** Klangqualität. F1–F10 prüfen Verfügbarkeit, Zuordnung und
Verlässlichkeit.

---

## 3. Reality Check — was verifiziert ist

### 3.1 Die vier Pollinations-Modelle können heute strukturell nicht fertig werden

`/api/compose` ruft `httpsFetchBinary(url, headers)` **ohne** Timeout-Parameter
([route.ts:92](../src/app/api/compose/route.ts)) und erbt damit
`DEFAULT_PROXY_TIMEOUT_MS = 30_000` ([https-post.ts:18](../src/lib/https-post.ts)).
Dieselbe Route erlaubt `maxDuration` bis 300 s ([route.ts:66](../src/app/api/compose/route.ts)).
Jeder Lauf, der länger als 30 s rechnet, wird im Proxy mit `SIGTERM` beendet; der Fehler
ist ein generischer `Error` und wird von `handleApiError` zu
`{ error: 'Internal server error' }` maskiert.

**Das ist der eigentliche Blocker für F4 und F7** — nicht die Modellwahl.

### 3.2 Fünf Modelle, aber nur zwei API-Wege

Live gezogen am 2026-09-03. Alle vier Audio-Modelle nennen genau zwei
`supported_endpoints`: `/audio/{text}` (GET) und `/v1/audio/speech` (POST). Die Registry
liefert für Audio **keine** Parameter-Schemas — `capabilities: []` bei allen vier.

| Modell | Eingaben | Preis (pollen) | Besonderheit |
|---|---|---|---|
| `elevenmusic` | text, **audio** | 0,0025 / s ein und aus | Referenztrack möglich |
| `lyria-3-clip` | text | 0,04 / Token | Beschreibung sagt 30 s fest |
| `stable-audio-3-large` | text, **audio** | 0,26 / Erzeugung | `flat_rate` |
| `stable-audio-3-medium` | text, **audio** | 0,0041 ein / 0,0376 aus | `flat_rate` |

Folgen für den Plan:

- Die vier Pollinations-Modelle laufen alle über **einen** Weg (`/api/compose`, GET
  `/audio/{text}` mit `duration` und `instrumental`). Der bestehende OpenAI-POST kennt
  `duration`/`instrumental` nicht — der Kommentar in der Route belegt das.
- Die Parameter müssen **von Hand geführt** werden, wie bei Bild und Video. Es gibt keine
  Registry-Wahrheit, aus der man sie ableiten könnte.
- `stable-audio-*` sind `flat_rate`: eine längere Dauer kostet dort nichts extra, bei
  `elevenmusic` schon. Das ist ein sichtbarer Unterschied, kein Detail.

### 3.3 Die Sound-Routen tragen keinen Fehlercode

`grep -c "code:"` → **0** in `sound/route.ts` und `sound/audio/route.ts`. Der
Phase-4-Vertrag verlangt Code → Satz; `describe-error.ts` kennt keine Sound-Codes, also
fällt alles auf „Status plus Rohtext", und der Rohtext ist englisch
(*„Prompt too long (max 512 characters)"*). Zu übersetzen sind mindestens:

fehlende Modal-Konfiguration · Tags fehlen · Tags zu lang · Lyrics zu lang · Modal
antwortet nicht · Modal-Kaltstart überschreitet die Zeit · Task ohne Ergebnis (Timeout) ·
Ergebnis ohne Audiodatei · Rate-Limit erreicht.

### 3.4 Der Audio-Proxy prüft den Pfad nicht

`path` wird nur auf `startsWith('/')` geprüft
([audio/route.ts:21](../src/app/api/sound/audio/route.ts)). Damit ist jeder GET-Endpunkt
des ACE-Step-Servers öffentlich erreichbar, authentifiziert mit dem Server-Key. Das Repo
hat für genau diese Klasse `remote-fetch-policy.ts`, und `/api/proxy-image` ist auf drei
Hosts beschränkt. Das Modal-README nennt die erlaubte Form: `/v1/audio?path=…`.

### 3.5 `param-schema.ts` ist der richtige Ort für F5

Das Schema ist deklarativ: `ParamField` mit `kind` (`text` | `number` | `enum` |
`boolean` | `seconds`), `showIf`-Bedingungen und Gruppen. `schemaForEntry()` plus
`visibleFields()` erledigen „UI passt sich beim Modellwechsel an" für Bild und Video
schon heute. Audio gehört in dasselbe System — nicht in ein zweites, parallel gepflegtes.

Offene Spannung: ACE-Steps Tags und Lyrics sind zwei **große** Textfelder. Die passen
schlecht in die schmale Parameterspalte, weshalb `SoundPanel` sie dort mit eigenen
`textarea` unterbringt. Siehe Entscheidung E-2.

### 3.6 Was am heutigen Stand hält

Nicht neu bauen: das Zwei-Felder-System, der `ACE_STEP_ENHANCEMENT_PROMPT` (verdichtet
korrekt zu 3–7 Tags, verbietet Prosa und Lyrics-Marken), `AsciiSignature` mit
Sound-Muster, die eingefrorenen Werte im Retry, der serverseitig bleibende Modal-Key, und
der Blob-Weg über `OutputService` mit `isPollinations: false` — der Track überlebt das
Container-Ende, geprüft.

### 3.7 Korrektur am eigenen Review

Die ModeTabs tragen `min-h-11` (44 px) und erfüllen die Telefonregel. Nur zwei Knöpfe im
`SoundPanel` sind `min-h-9` (36 px).

---

## 4. Der zweistufige Moduswechsel

Ziel laut Entwurf: `image · video · sound` als erste Ebene, darunter bei `image` und
`video` ein Umschalter `text ↔ edit`.

**Wichtig: kein neuer State.** `PlaygroundMode` bleibt wie er ist; nur die Darstellung
wird zweistufig und bildet ab:

| Gattung | Variante | `PlaygroundMode` |
|---|---|---|
| image | text | `t2i` |
| image | edit | `i2i` |
| video | text | `t2v` |
| video | edit | `i2v` |
| sound | — | `sound` |

Die Variante ist keine freie Wahl: `modesFor(entry)` sagt schon heute, welche Modi ein
Modell beherrscht. Daraus folgt der Zustand des Umschalters:

- Modell kann beides → Umschalter aktiv
- Modell kann nur `i2i` (etwa `p-image-edit`) → Gattung `image`, Variante `edit` fest und
  gesperrt, mit sichtbarem Grund
- Gattung `sound` → Umschalter verschwindet, nicht nur ausgegraut

Der Wechsel der Gattung darf die Variante nicht verlieren: von `image/edit` nach `video`
soll `i2v` werden, nicht `t2v`, solange das gewählte Videomodell `i2v` kann.

---

## 5. Arbeitspakete

Reihenfolge: **A vor allem anderen**, weil die vier Pollinations-Modelle ohne A nicht
funktionieren können und F4 sonst nicht erreichbar ist.

### A — Die Zeitgrenze reparieren *(blockiert B und F4/F7)*

`httpsFetchBinary` bekommt in `/api/compose` einen zur Dauer passenden Timeout, oder die
Route wechselt auf das Muster, das das Repo für lange Läufe schon hat: **202 plus
Client-Polling** (`request-generation.ts`, `run-store.ts`). Letzteres ist konsistent mit
Pruna-Video und übersteht einen Reload; der Timeout-Parameter ist die kleine Lösung.
Entscheidung E-1.

Dazu: der maskierte `INTERNAL_ERROR` bekommt einen echten Code, damit der Nutzer bei
Zeitüberschreitung einen Satz sieht.

### B — Fünf Modelle in einer Liste, mit der additiven Regel

- Ein Audio-Modellregister analog zu `UNIFIED_IMAGE_MODELS`: fünf Einträge mit `provider`
  (`modal` | `pollinations`), `isFree`, `paidOnly`, Preisangabe, Eingabemodalitäten.
- Die Auswahlregel an genau **einer** Stelle, wie `getChatImageModelGroups()` es für den
  Chat vormacht — eine Funktion, kein verstreutes `if`:
  `acestep-1.5` immer, die vier Pollinations-Modelle nur mit Schlüssel.
- Ein Test pinnt beides fest: dass ACE-Step in **beiden** Zuständen dabei ist, und dass
  die vier ohne Schlüssel fehlen. Dazu die Kante „Key wird während der Sitzung
  eingetragen" — die Liste wächst, die getroffene Auswahl bleibt bestehen.

### C — Parameter je Modell über `param-schema.ts`

Je Modell ein Schema:

| Modell | Felder |
|---|---|
| `acestep-1.5` | Tags (512), Lyrics (5000), instrumental, Dauer, Varianten, Seed |
| `elevenmusic` | Beschreibung, Dauer, instrumental, Referenztrack |
| `lyria-3-clip` | Beschreibung, instrumental — **Dauer fest 30 s**, nicht als Regler |
| `stable-audio-3-large` | Beschreibung, Dauer, Referenztrack |
| `stable-audio-3-medium` | Beschreibung, Dauer, Referenztrack |

F5 heißt: beim Wechsel verschwinden Felder, die das neue Modell nicht kennt, und der
gespeicherte Wert eines unbekannten Feldes wird nicht mitgeschleppt — `resetForModel()`
macht das für Bild und Video bereits.

### D — Zweistufiger Moduswechsel

`ModeTabs` wird zu zwei Komponenten (Gattung, Variante) über der bestehenden
`PlaygroundMode`-Ableitung aus Abschnitt 4. Tests für alle fünf Kombinationen und für die
gesperrte Variante.

### E — Der Audio-Proxy bekommt eine Allowlist *(F8)*

Pfadprüfung gegen das Ergebnispräfix statt `startsWith('/')`, nach dem Muster von
`remote-fetch-policy.ts`. Test mit `?path=/release_task` → 400.

### F — Fehlercodes und Sätze *(F9)*

Die Fälle aus 3.3 in `error-codes.ts`, Sätze in `describe-error.ts`. Der bestehende Test
„jeder Code hat einen Satz" fängt Lücken automatisch.

### G — Tests für beide Routen *(F10)*

`route.test.ts` je Route, nach dem Muster von `generate/route.test.ts`: Validierung,
Grenzwerte, Modal-Ausfall, Rate-Limit. Die Route, die Geld kostet, ist die letzte, die
ohne Test bleiben sollte.

### H — Doku und Kriterien

- **`LAUNCH_CRITERIA.md` Bereich G wird neu geschrieben.** Die vier heutigen Kriterien
  sind auf die Pollenwall formuliert und teils gegenstandslos — L-G.4 verlangt wörtlich
  „Kein `acestep` mehr im Code", und ACE-Step ist jetzt das Herzstück. Neu brauchen es:
  die additive Regel (F1/F2), ein Lauf je Modell (F3/F4), der Track im gemeinsamen
  Pool, und die Kostenlage aus E-3.
- **L-K.1 präzisieren:** das Kriterium schützt den *Pollinations*-Server-Schlüssel.
  Modal-Credits sind eine bewusste Betreiberausgabe und keine Verletzung — das muss
  dastehen, sonst liest die nächste Prüfung es als Regression.
- **`CLAUDE.md`:** `MODAL_ACESTEP_URL` und `MODAL_ACESTEP_KEY` fehlen in der
  Schlüsseltabelle; ein Abschnitt „Sound" nach dem Muster von „Create" fehlt ganz.
- **Fahrplan Phase 8** beschreibt „vierter Modus, alles hinter der Pollenwall". Das
  stimmt nicht mehr. Und der Umstand, dass dies faktisch die Wiederaufnahme von Phase 10
  ist (eigene Infrastruktur), gehört vermerkt.
- Ein Handoff. Für die Sound-Arbeit existiert keiner.

---

## 6. Offene Entscheidungen

### E-1 — Timeout heben oder auf 202 umstellen?

**Timeout heben** ist eine Zeile und reicht bis 300 s (Vercel-Grenze), verliert aber jeden
Lauf bei einem Reload. **202 plus Polling** ist das Muster, das Pruna-Video und ACE-Step
schon nutzen, übersteht Reloads über `run-store.ts` — kostet aber Umbau an einer Route,
die sonst niemand anfasst. Empfehlung: 202, weil ACE-Step es ohnehin tut und zwei Muster
für dieselbe Sache teurer sind als der Umbau.

### E-2 — Wo leben Tags und Lyrics?

Heute im `SoundPanel` in der linken Spalte, zusätzlich spiegelt die PromptBar die Tags —
**dasselbe Feld zweimal sichtbar, mit widersprüchlichen Limits** (512 gegen 1000, und die
PromptBar zeigt „x / 1000" für ein Feld, das der Server bei 512 abweist). Drei Wege:
Lyrics in die Mitte über die PromptBar; oder die PromptBar im Sound-Modus ausblenden und
alles links; oder die PromptBar trägt die Tags und links steht nur Lyrics. In jedem Fall
muss die Doppelung weg.

### E-3 — Kostenlage sichtbar machen?

Die vier Pollinations-Modelle unterscheiden sich stark: `stable-audio-3-large` kostet
0,26 pollen pauschal je Erzeugung, `elevenmusic` 0,0025 je Sekunde — bei 120 s also 0,3.
Da der Nutzer selbst zahlt, wäre der Preis in der Modellwahl fair. Und bei ACE-Step wäre
der ehrliche Hinweis „läuft auf unserer GPU" das Gegenstück.

### E-4 — Was passiert bei einem ungültigen Schlüssel? *(entschärft)*

`useHasPollenKey` prüft nur **Vorhandensein**, nicht Gültigkeit — ein bekannter Zustand im
Repo. Unter der additiven Regel ist das keine Sackgasse mehr: ein Mülleintrag im
Schlüsselfeld lässt die vier Pollinations-Modelle mit 401 scheitern, aber ACE-Step bleibt
wählbar und funktioniert. Sound hat also immer ein laufendes Modell.

Offen bleibt nur die Beschriftung: mit ungültigem Schlüssel stehen vier Modelle in der
Liste, die alle mit 401 antworten. `keyStatus` aus L-C.3 kennt den Zustand
(`ok` / `rejected` / `unverifiable`) — die vier könnten bei `rejected` als solche
gekennzeichnet werden, statt erst nach dem Absenden zu scheitern. Das wäre L-I.2 für
Sound.

### E-5 — Bleibt `lyria-3-clip` bei 30 Sekunden?

Die Registry-Beschreibung sagt „30-second music". Ob der Endpunkt eine andere `duration`
annimmt, ist ungeprüft — und ein Lauf kostet. Entweder als fest verdrahtet führen, oder
einmal mit Schlüssel messen.

---

## 7. Reihenfolge

```
A (Zeitgrenze)  ──►  B (Modellregel)  ──►  C (Parameter je Modell)
                                            │
E (Proxy-Allowlist) ─┐                      └──►  D (Moduswechsel)
F (Fehlercodes)     ─┼─► unabhängig, jederzeit
G (Tests)           ─┘
                                                  H (Doku) ──► zuletzt
```

E, F und G hängen an nichts und schließen die drei Review-Befunde, die ich vor einem Push
beheben würde. H kommt zuletzt, weil es beschreibt, was dann steht.

---

## 8. Vorbedingungen

- Die zwei Sound-Commits (`b920ed9`, `e43de99`) sind **nicht gepusht**. Vor weiterer
  Arbeit entscheiden: pushen oder auf diesem Stand weiterbauen.
- `docs/design/` ist untracked und enthält beide Mockups.
- Ausgangsstand, den nichts unterschreiten darf: `lint` sauber, `tsc` sauber, `build`
  erfolgreich, **122 Suiten / 954 Tests** grün, `check-model-registry.mjs` ohne Abweichung.
- F4 und E-5 brauchen einen echten Pollen-Schlüssel und kosten Guthaben — Betreiberarbeit.

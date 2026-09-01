# Handoff — Phase 4 abgeschlossen, Freigabeschwelle auf den echten Stand gezogen

**Datum:** 2026-09-01
**Branch:** `main`, Ausgangs-HEAD `d14eb0e`, **End-HEAD `cc57eb7`** — gepusht.
**Art der Sitzung:** Durchlauf ohne Zwischenstopp: Arbeitsbaum sortieren, den Fahrplan
gegen die Wirklichkeit auditieren, alles Verifizierbare verifizieren, die verbliebenen
Lücken bauen.
**Nicht angefasst:** Compose/Musik und `modal-acestep/` — auf Ansage als eigener
Prototyp behandelt und bewusst uncommitted gelassen.

---

## 1. Ergebnis in einem Satz

Von 31 Gate-Kriterien stehen **20 auf erledigt**, zwei auf `teilweise` (Code steht,
Beweis braucht einen Schlüssel), und was noch offen ist, ist Musik (Phase 8, ausgelagert),
Telefon (Betreibermessung) und die zwei Abschlussprüfungen unmittelbar vor der Freigabe.

---

## 2. Der Hauptbefund: Phase 4 war zur Hälfte gebaut, ohne dass es jemand aufschrieb

Der Fahrplan führte Phase 4 als offen, `LAUNCH_CRITERIA.md` alle vier C-Kriterien als
`offen`. Der Code sagte etwas anderes:

| Kriterium | Lag längst da |
|---|---|
| L-C.1 | `error-codes.ts` mit 24 Codes, `describe-error.ts` mit deutschem Satz je Code, `read-error-response.ts` für alle drei live belegten Fehlerformen |
| L-C.2 | `run-store.ts` schreibt jeden 202-Lauf nach localStorage, der Mount nimmt ihn wieder auf |
| L-C.3 | `SettingsPopover` unterscheidet `ok` / `rejected` / `unverifiable` |
| L-C.4 | `RunningCard` zählt Sekunden auf `run.startedAt`, mit Überfälligkeitsmarke für Video |
| Altlast 7 | `vercel.json` trägt `maxDuration: 300` |

Das ist zum dritten Mal derselbe Defekt in diesem Repo: **gebaut, nicht nachgezogen.**
Wer den Fahrplan liest, plant Arbeit, die es schon gibt.

---

## 3. Was wirklich fehlte — und live belegt ist

### 3.1 Zwei Fehlerfälle ohne Satz (L-C.1)

Live gegen die Produktion gezogen, nicht aus dem Code hergeleitet:

```
POST https://chat.hey-hi.cloud/api/generate  {"model":"kontext","prompt":"x"}
→ 403 {"error":"Pollinations API error: Model 'kontext' is not allowed for this API key"}
```

**Kein `code`.** Der Client fiel auf „Status plus Rohtext" zurück und zeigte dem Nutzer
einen englischen Satz über einen API-Schlüssel — gemeint ist der des *Betreibers*, dessen
Allowlist `kontext` nicht enthält. Mit einem eigenen Schlüssel läuft das Modell.

Nachgetragen: `POLLEN_MODEL_NOT_ALLOWED` (403, nennt Modell und den eigenen Schlüssel als
Ausweg) und `PROVIDER_UNAVAILABLE` (5xx, „liegt nicht an deiner Eingabe").
`pollinations-image-v1.test.ts` nagelt Status → Code fest, samt der Gegenprobe, dass 400
bewusst ohne Code bleibt.

### 3.2 Video war eine Sackgasse (L-I.3)

Im Browser gefunden, nicht im Code: Wer im Create `t2v` wählt und keinen Schlüssel hat,
bekommt eine **leere Modellliste** und den Satz „Kein Modell für diesen Modus". Seit
Phase 3 ist Video vollständig schlüsselpflichtig (Betreiberentscheidung E1-A) — das stand
nirgends in der Oberfläche. Jetzt sagt der `ModelPicker` im leeren Videomodus, dass es für
Video kein kostenloses Modell gibt und welcher Schlüssel hilft; bei gewähltem
schlüsselpflichtigen Modell trägt die Sendeleiste denselben Hinweis.

### 3.3 Der unabbrechbare Pruna-Lauf war unangekündigt (L-K.2)

Form nach Betreiberentscheidung E2: dauerhafte Zeile an der Sendeleiste, solange ein
Pruna-Modell gewählt ist, **plus** ein einmaliger Bestätigungsschritt beim ersten
Pruna-Lauf pro Browser (`heyhi_pruna_irreversible_ack`). Nicht bei jedem Lauf — dann
klickt man ihn weg, ohne ihn zu lesen.

**Rangfolge:** Steht die Schlüsselpflicht an, hat sie Vorrang. Ohne Schlüssel läuft
ohnehin nichts; die Abrechenbarkeit ist dann noch nicht das Problem des Nutzers.

### 3.4 Der Löschpfad schickte den falschen Schlüssel

Aus dem Review der Parallelsitzung: `/api/media/delete` wurde **ohne**
`getPollenHeaders()` gerufen. Ohne den Header fällt `resolvePollenKey` serverseitig auf
den Betreiber-Schlüssel zurück, der an fremden Medien keine Rechte hat — die Löschung
scheitert still, die Kopie bleibt zehn Jahre liegen. Genau dieser Fehler ist dem
Upload-Pfad schon einmal passiert (`CLAUDE.md`, „Upload Hardening"). Zwei Tests nageln den
Header jetzt fest.

Dazu: Massenlöschen macht eine Netzrunde je Zeile. Statt einer seriellen Schleife laufen
jetzt sechs Arbeiter (Browser-Grenze pro Host), und der Leeren-Knopf zeigt
„{done} von {total} gelöscht", statt die Oberfläche hängen zu lassen.

---

## 4. Live verifiziert, nicht behauptet

| Kriterium | Beleg |
|---|---|
| **L-A.1** | `/` → 200, `/create` → 200, `/playground` → 307 `location: /create` |
| **L-B.4** | ohne Schlüssel gegen `/api/generate`: `flux` 7,3 s · `gpt-image` 38,1 s · `klein` 7,0 s, je 200 mit Medien-URL, die `image/jpeg` ausliefert |
| **L-I.3** | im Browser gegengeprüft: `t2v` ohne Schlüssel zeigt den Hinweis statt der Sackgasse |
| **L-A.5** | nach dem Deploy: `/` trägt die Chat-Beschreibung, `/create` seit heute eine eigene |
| Registry | `node scripts/check-model-registry.mjs` → „Keine Abweichungen" |

`L-B.4` schließt zugleich `L-F.1`, das nur noch daran hing.

---

## 5. Was bewusst `teilweise` bleibt — und damit weiter blockiert

- **L-C.2** — `run-store.ts` schreibt, liest und verwirft nach der 30-Minuten-Reißleine;
  `run-store.test.ts` deckt das ab. Der Prüfweg selbst ist ein **echter Videolauf mit
  Reload**: braucht einen Schlüssel und mehrere Minuten. Betreiberaufgabe, kein Code.
- **L-D.4** — der DELETE-Weg steht samt Schlüssel-Header und Tests. Ob Pollinations das
  DELETE mit einem echten Nutzer-Key **tatsächlich befolgt**, ist ungeprüft. Fällt die
  Antwort negativ aus, wird daraus ein akzeptiertes Risiko in Bereich L — dann aber als
  Entscheidung, nicht als Versäumnis.

Beide stehen bewusst nicht auf `erledigt`. `teilweise` blockiert wie `offen`; es sagt nur,
wo die nächste Sitzung ansetzt.

---

## 6. Ausdrücklich nicht gebaut

**Das Async-Protokoll für Pollinations-Videos.** Es war nur nötig, um `nova-reel` als
kostenloses Videomodell zurückzuholen (Beleg: 524 nach 125 s, synchroner Dispatch). Mit
Betreiberentscheidung **E1-A** bleibt Video hinter der Pollenwall — damit entfällt der
Grund. Im Fahrplan bei Phase 4 vermerkt, damit niemand es später als Versäumnis liest.

---

## 7. Commits

| Commit | Inhalt |
|---|---|
| `b1eec9c` | `fix(phase-7)`: Nachaudit — Rollenmodell (`radiogroup` → `group`), Modul-Const |
| `eaca689` | `feat(phase-5)`: Löschen entfernt auch die externe Kopie — Proxy, BYOP-Header, Nebenläufigkeit, Fortschritt |
| `bff6957` | `docs`: L-A.1, L-B.4, L-F.1, L-K.3 belegt; Statuswerte definiert; L-L.5 → L-D.4 |
| `4bbf4a9` | `fix(phase-4)`: 403 und Anbieterausfall bekommen einen Satz |
| `fac2de4` | `feat(phase-4)`: Schlüsselpflicht und Abrechenbarkeit vor dem Absenden |
| `cc57eb7` | `docs`: Phase 4 abgeschlossen, zwölf Kriterien nachgezogen |

---

## 8. Verifikation, Endstand `cc57eb7`

```text
npm run lint           → sauber
npx tsc --noEmit       → sauber
CI=1 npx jest --silent → 120 Suiten, 939 Tests grün (Start: 119/927)
npm run build          → erfolgreich, /create statisch
node scripts/check-model-registry.mjs → Keine Abweichungen
git status             → nur Compose/Modal, wie vereinbart
```

---

## 9. Was noch offen ist

**Betreiberaufgaben — Schlüssel oder Gerät nötig, kein Code:**

1. **L-C.2** — Videolauf starten, Seite neu laden, Ergebnis abwarten.
2. **L-D.4** — Asset mit `storageKey` löschen, im Netzwerktab den `X-Pollen-Key` sehen,
   danach die Medien-URL erneut abrufen.
3. **L-E.1 / L-E.2** — Telefon: je ein t2i- und ein i2v-Lauf auf iPhone und Android,
   kein horizontales Scrollen bei 375 px.
4. **L-I.1 / L-K.1** — die zwei Abschlussprüfungen unmittelbar vor der Freigabe.

**Noch zu bauen:**

- **Phase 8 (Musik)** — L-G.1 bis L-G.4. Ausgelagert als eigener Prototyp
  (`modal-acestep/`, `PLAN-compose-musik-2026-08-29.md`), liegt uncommitted im Baum.
- **Phase 9 (ASCII-Flow)** — steht in Bereich M, nicht launchrelevant.

---

## 10. Für den nächsten Thread

1. `LAUNCH_CRITERIA.md` ist die Statusquelle. Der Fahrplan beschreibt den Weg, nicht den
   Stand — dass beide auseinanderliefen, war der Hauptbefund dieser Sitzung.
2. Fehlerursachen **live** ziehen, nicht aus dem Code herleiten. Der 403-Befund oben wäre
   beim Lesen des Codes nicht aufgefallen: die Statuszuordnung *sah* vollständig aus.
3. Ein neuer Fehlercode ohne Satz macht `describe-error.test.ts` rot. Das ist Absicht.
4. Nach jeder Phase: Statuszeile ziehen, Fahrplan-Marker setzen, Handoff schreiben —
   **nach** dem Push.

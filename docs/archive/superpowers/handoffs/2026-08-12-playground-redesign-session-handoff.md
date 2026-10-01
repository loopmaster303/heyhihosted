# Session-Handoff — Playground UI-Redesign + Parameter-Overhaul

**Datum:** 2026-08-10 bis 2026-08-12
**Branch:** `playground/redesign` (Basis: `playground/multimedia` @ `506b620`)
**Worktree:** `/Users/johnmeckel/heyhihosted-playground`
**Status:** Lokal fertig, lauffähig, ungemerged. Kein Push, kein Merge nach `main`.

---

## 1. Wo wir stehen

Working Tree ist sauber. 20 Commits über `playground/multimedia` hinaus. Letzte Vollverifikation: Lint 0 Fehler, Typecheck sauber, **480 Tests grün** in 84 Suiten, `npm run build` durch mit `/playground` als Route.

```bash
cd /Users/johnmeckel/heyhihosted-playground
git log --oneline playground/multimedia..HEAD   # 20 Commits, siehe unten
npm run dev                                      # zum Testen
```

## 2. Was in dieser Session passiert ist — zwei große Bögen

### Bogen A: UI-Redesign (Commits `ada1b74` bis `a780717`)

Der Playground war ein **zweites Design-System** neben heyhihosted: 1112 Zeilen handgeschriebenes CSS-Modul, keine shadcn-Komponenten, Emoji statt Icons, Dropdowns ohne Click-Outside. Komplett neu gebaut auf den vorhandenen heyhihosted-Bausteinen:

- Glass-Utilities aus `globals.css` (`glass-panel`, `glass-input`, `glass-popover`)
- `ui/`-Komponenten (Button, DropdownMenu, Popup/ModalPopup, Drawer, Slider, Switch)
- lucide-Icons, `cn()`
- Hero-Element komplett entfernt — die Galerie *ist* die Ausgabe
- Prompt-Leiste unten, wächst mit dem Text bis 45% Fensterhöhe, ohne Pfeil-Icon am Senden-Knopf
- Provider-Auswahl als Dropdown mit Statuslampe statt Segmented-Control
- Referenz-Slots füllen sich progressiv (ein freier Slot auf einmal, nicht zehn leere Kästen)

**Mockup, falls nochmal gebraucht:** https://claude.ai/code/artifact/6fc9e819-e1bb-4eda-9449-778fb51e5456

**Wichtige Lektion aus dieser Phase:** opencode-Worker (kimi-k2.7-code) liefern zuverlässig bei **Ein-Datei-Aufträgen**. Bei drei parallelen Mittel-Aufträgen sind alle drei nach ~5 Minuten mit 0 Bytes Ausgabe hängengeblieben — abgebrochen, danach selbst gebaut. Für den nächsten Zyklus: Worker nur für kleine, klar geschnittene Einzeldateien einsetzen, nicht für mehrere zusammenhängende Dateien in einem Auftrag.

### Bogen B: Parameter-Overhaul (Commits `161b970` bis `5910c19`)

Der User hat zurecht bemängelt, dass nicht alle Modell-Parameter angezeigt/bedienbar waren. Grundproblem: die Parameter-Wahrheit lag verteilt über drei sich widersprechende Quellen (`unified-image-models.ts`, `unified-model-configs.ts`, `pruna-models.ts` `buildInput`).

**Recherche:** alle 13 vom User vorgegebenen Pruna-Modell-Docs (`docs.api.pruna.ai/guides/models/*`) einzeln abgerufen und gegen den Code geprüft. Für Pollinations die Live-Registry (`gen.pollinations.ai/image/models`, 54 Modelle, snake_case) als Wahrheit erkannt — kein Handschema nötig, weil sie `video_capabilities`, `max_reference_images`, `resolutions`, `paid_only` bereits mitliefert.

**Leitprinzip (User-Vorgabe):** Bedienoberfläche ist für jedes Modell gleich — z.B. immer Sekunden-Regler, nie Frames/FPS als Bedienelement. Übersetzung in Backend-Einheiten passiert serverseitig.

**Neue Dateien:**
- `src/lib/playground/param-schema.ts` — 13 Pruna-Schemata + `schemaForPollinations()` (leitet aus Registry ab) + `schemaForEntry()` (wählt zwischen beiden)
- `src/lib/playground/pollinations-caps.ts` — was die Registry NICHT sagt: Dauer-Stufen pro Modell, Pixel-Tabelle für Seitenverhältnis, SEED/QUALITY/TRANSPARENT-Modell-Sets
- `src/lib/pollinations-registry.ts` — serverseitiger Registry-Zugriff mit 60s-Cache, für `/api/generate`
- `src/lib/safe-storage.ts` — localStorage-Wrapper der nie wirft (Safari-Härtung)
- `src/hooks/useShowCommunityModels.ts` — Schalter für die 14 `community`-markierten Pollinations-Modelle (Vorgabe: aus)

**Zwei neue Pruna-Modelle:** `p-image-ideogram`, `p-flux-klein` (nicht `klein` — kollidiert mit Pollinations-`klein`).

## 3. Die fünf Live-Bugs — chronologisch, mit Ursache

Nach dem ersten fertigen Stand hat der User über mehrere Runden echte Nutzung gemeldet, und jedes Mal lag der Fehler woanders als vermutet. Kette der Erkenntnisse:

1. **`691db97`** — App-Fehler auf dem iPhone. War NICHT Safari/localStorage (meine erste falsche Theorie). Ursache: `next.config.ts` `allowedDevOrigins` enthielt volle URLs (`http://172.20.10.14:3000`), Next vergleicht aber nur den **Hostnamen**. Kein Eintrag matchte je, und die Liste zu setzen schaltet Next von "warn" auf "block" — jede `/_next/*`-Anfrage von fremder Herkunft bekam 403. Betraf auch den Chat von jedem Gerät außer diesem Mac.

2. **`6ccb055`** — Nach dem Origin-Fix zeigte die echte Next-Fehlerseite den wahren Fehler: `undefined is not an object (evaluating 'values.image')`. Ursache: gespeicherter `localStorage`-Zustand vom iPhone stammte aus der Zeit VOR dem Parameter-Umbau (kannte `seed`/`negativePrompt`/`guidance`/`steps`, kein `params`-Feld). `usePlaygroundState` ersetzt den State komplett aus dem Storage. Fix: `withDefaults()` merged beim Lesen UND Schreiben.

3. **`72aa916`** — Enhance tat nichts. Die Route verlangt `modelId` (sonst 400), Shell schickte nur `prompt`. Zusätzlich: Route liefert `enhancedPrompt`, Shell las `data.enhanced`. Und der Pollen-Key wurde nicht mitgeschickt.

4. **`5479d98`** — Senden lief durch (Knopf sperrte/entsperrte), aber kein Bild erschien. Ursache: Playground zeigt jetzt alle 54 Live-Modelle, aber `/api/generate` validierte nur gegen die ~20 in `unified-image-models.ts`. Fix: Route fragt bei unbekannter ID die Registry nach (`findRegistryModel`). Nebenbei: Fehler wurden nicht sichtbar angezeigt — jetzt als schließbarer Alert über der Prompt-Leiste, mit ausgepackter Route-Fehlermeldung statt rohem JSON.

5. **`5910c19`** — Auch mit gültigem Modell blieb das Bild leer, ohne Fehler. Ursache: Pollinations verlangt inzwischen bei JEDEM Modell Authentifizierung (nicht nur `paid_only`). Die Route ruft den v1-Endpunkt mit Key auf, bekommt eine `gen.pollinations.ai`-URL zurück und reicht sie roh an den Browser — der lädt sie OHNE Key nach und bekommt 401. Video- und Referenzbild-Pfade holten das Medium längst serverseitig; der einfache Bild-Pfad nicht. Fix: `fetchAndStoreRemoteMedia` auch hier, liefert `media.pollinations.ai`-URL statt der rohen. Verifiziert per curl: 401 vorher, 200 `image/jpeg` nachher.

**Muster über alle fünf:** jedes Mal eine Annahme über eine Schnittstelle, die nie gegen die echte Schnittstelle geprüft wurde. Ab Bug 3 habe ich konsequent gegen den laufenden Dev-Server verifiziert (curl direkt gegen die Route, Browser-Pane mit `javascript_tool` für IndexedDB-Inspektion) statt vom Code aus zu raten — das hat die Fehlerquote sichtbar gesenkt.

## 4. Offene Punkte / nächste Schritte

- **Kein Push, kein Merge nach main.** User muss das explizit freigeben (steht so in CLAUDE.md und wurde in dieser Session durchgehend eingehalten).
- **User testet gerade live weiter.** Die letzte Nachricht vor diesem Handoff war der 5910c19-Fix (Auth-Problem beim Bildabruf). Kein Bestätigung vom User, dass es jetzt tatsächlich durchgängig funktioniert — nur die eigene Verifikation per curl/Browser-JS.
- **Community-Modell-Schalter (`useShowCommunityModels`)** ist gebaut und verdrahtet, aber in der Live-Session noch nicht vom User bestätigt.
- **`docs/superpowers/plans/2026-08-10-playground-param-schema-impl.md`** ist der Umsetzungsplan für den Parameter-Umbau — als Referenz falls weitere Pruna-Modelle (die 5, für die der User keine Doku geschickt hat: `wan-fast`, `p-image-try-on`, `p-video-avatar`, `p-video-animate`, `p-video-replace`) später ergänzt werden sollen.
- **Kein `.env`** in diesem Worktree — `POLLEN_API_KEY` fehlt serverseitig. Playground braucht also zwingend einen im Browser hinterlegten Pollen-Key zum Testen, seit Pollinations überall Auth verlangt.
- **Zwei Chat-Slim-Ziele aus früheren Sessions unberührt:** Compose raus, Visualize auf 1-3 Modelle reduzieren. Nicht Teil dieses Zyklus, expliziter User-Wunsch war "kein Einfluss auf Chat" für den Parameter-Umbau.

## 5. Wie weiterarbeiten

Bei Fortsetzung: zuerst `git log --oneline -5` und `git status` prüfen, dann fragen ob der User seit `5910c19` weiter getestet hat — die Session endete mit einem frisch verifizierten, aber vom User noch nicht bestätigten Fix. Bei neuen Bug-Reports: sofort gegen den laufenden Dev-Server verifizieren (curl gegen die Route, nicht nur Code lesen) — das hat sich in dieser Session als der einzige zuverlässige Weg erwiesen, echte Ursachen von plausiblen Theorien zu unterscheiden.

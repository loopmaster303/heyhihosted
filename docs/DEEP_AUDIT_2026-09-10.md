# Deep-Audit — hey.hi / chat.hey-hi.cloud

**Datum:** 2026-09-10
**Umfang:** gesamtes Repo `/Users/johnmeckel/heyhihosted` — UI, Hooks, Services, API-Routen, Metadaten, Tests, CI
**Modus:** read-only. Kein Code geändert, kein Build, kein Server gestartet, keine Browser-Automatisierung
**Anlass:** Review vor der Frage, welche nächste Ausbaustufe das Produkt wirklich weiterbringt

Vier Prüfstränge liefen parallel und unabhängig voneinander, jeder mit derselben Belegregel (jede Aussage mit Datei:Zeile):

1. **Funktion & Robustheit** — Zustandsführung, Persistenz, Fehlerpfade, Parallelität
2. **Barrierefreiheit** — Tastatur, Semantik, Kontrast, Live-Regions, Reduced Motion
3. **Maschinen- und Agentenfähigkeit** — Discoverability, API-Vertrag, Jobs, Idempotenz, Auth
4. **Playfulness, Feedback, Emotion** — was der Nutzer während und nach einem Lauf erlebt

Die Befunde sind zusammengeführt, dedupliziert und nach Schweregrad neu sortiert. Wo zwei Stränge dasselbe Problem von zwei Seiten sehen, steht es einmal mit beiden Belegen.

---

## 1. Kurzfassung

- **Es gibt einen roten Faden: nichts besitzt den Lebenszyklus eines Laufs oder eines Artefakts.** Läufe leben im `useState` einer Komponente, Assets werden von einer Funktion gespeichert, die im Fehlerfall still `undefined` liefert, Blobs werden mit `refCount: 1` gehalten und nie freigegeben, und beim 51. Chat löscht das Produkt still den ältesten Chat samt seiner Bilder. Vier Symptome, eine Ursache.
- **Barrierefreiheit ist kein Detailrückstand, sondern eine Blockade der Hauptfunktion.** Modus, Seitenverhältnis und Videodauer sind per Tastatur nicht änderbar (WCAG 2.1.1, Level A). Die fertige Gegenlösung liegt im selben Ordner.
- **Für Maschinen existiert die Seite nicht.** 0 × `robots.txt`, 0 × `sitemap`, 0 × `llms.txt`, 0 × OpenAPI, 0 × MCP, 0 × `Idempotency-Key`, 0 × Request-ID — bei 20 API-Routen.
- **Zwölf Routen sind ohne jede Credential auf Betreiberkosten aufrufbar.** Der Kosten-Schutz blockt nur Modelle, die positiv als kostenpflichtig bekannt sind.
- **Die eigene Gestaltungssprache ist gebaut und nicht angeschlossen.** `AsciiWave`, `AsciiDone`, `AsciiProgress`, `ModeButtonOverlay`, `GrainOverlay` existieren, sind teils getestet, respektieren `prefers-reduced-motion` — und werden nirgends importiert. Der Chat benutzt stattdessen drei CSS-Bounce-Punkte.

---

## 2. P0 — blockiert, verliert Daten oder kostet Geld

### 2.1 Generierte Medien überleben den Reload nicht

`src/lib/services/output-service.ts:99` (HTTP nicht ok → `return undefined`), `:106` (Blobs unter `SMALL_BLOB_SKIP_BYTES`), `:120` (Catch-all) und `:50` liefern alle `undefined` statt zu werfen. Die Aufrufer maskieren das mit erfundenen IDs: `src/app/create/PlaygroundShell.tsx:397` und `:617` erzeugen `id: \${Date.now()}`. Die Galerie liest nach dem Reload aus Dexie und verwirft Assets ohne `remoteUrl` und ohne `blob` (`src/components/playground/Gallery.tsx:53-58`).

Folge: Das Ergebnis war nur im Speicher des offenen Tabs sichtbar. Danach ist es spurlos weg — ohne Toast, ohne Retry, ohne Spur. Der Nutzer merkt es erst, wenn er wiederkommt.

### 2.2 Der 51. Chat löscht still den ältesten Chat samt seiner Assets

`src/components/ChatProvider.tsx:63` setzt `MAX_STORED_CONVERSATIONS = 50`; `:503-509` sortiert nach `updatedAt` und ruft `deleteConversation(oldestConversation.id)`. `src/lib/services/database.ts:113-119` löscht in derselben Transaktion Nachrichten **und Assets**. Kein Hinweis, keine Bestätigung, kein Export.

Der Engpass ist die Metadatenliste, nicht der Speicher. Gelöscht werden trotzdem die Bilder und Videos, die den eigentlichen Wert darstellen.

### 2.3 Zwölf von zwanzig Routen laufen ohne Credential auf Betreiberkosten

`src/lib/resolve-pollen-key.ts:13`: `resolvePollenKey` fällt für jede Anfrage ohne eigenen Header auf `POLLEN_API_KEY` der Umgebung zurück. `src/lib/pollen-cost-guard.ts:22` sperrt nur Modelle, die positiv als kostenpflichtig bekannt sind. Es gibt keinen Spend-Cap, keine Quota, keinen Verbrauchszähler (`rg 'budget|spend|quota' src` → nur Beschreibungstexte in der Registry).

Die Datei dokumentiert den Fall aus eigener Erfahrung: „seedance-2.0 → 524 nach 125 s (der Lauf war losgeschickt)" (`src/lib/pollen-cost-guard.ts:16-18`). Genau dieses Muster — ein Lauf, der bezahlt wird und nie beim Nutzer ankommt — lässt sich mit wechselnden IPs beliebig oft auslösen.

### 2.4 Tastaturnutzer können Modus, Seitenverhältnis und Videodauer nicht ändern

`src/components/chat/input/InlineModeSwitch.tsx:104-106`, `src/components/chat/input/ImageParamOptions.tsx:99-101` und `:126-128`, `src/components/chat/input/ResearchDepthBadges.tsx:55-57`: überall `role="radio"` + `aria-checked` + `tabIndex={isActive ? 0 : -1}`, in keiner der Dateien ein `onKeyDown`. Inaktive Optionen sind `tabIndex=-1` und ohne Pfeiltastensteuerung weder fokussier- noch aktivierbar.

Das ist ein Verstoß gegen WCAG 2.1.1 (Level A) auf einer Hauptfunktion. Die funktionierende Gegenlösung steht im selben Ordner: `src/components/chat/input/ToolsBadges.tsx:38-46` implementiert Arrow-Navigation inklusive `.focus()`.

### 2.5 Der Chat kann einen laufenden Lauf nicht abbrechen

In `src/lib/chat/**` und `src/lib/services/chat-service.ts` existiert kein `AbortController`/`AbortSignal` (rg über beide Pfade: nur Testtreffer, eigene Nachprüfung bestätigt). Der Fetch läuft ohne `signal` (`src/lib/services/chat-service.ts:67-71`), `ChatInput` hat keinen Stop-Button. Im ganzen Repo gibt es genau einen `AbortController`-Satz: `src/app/create/PlaygroundShell.tsx:477,510,529`.

Bei einem Pruna-Video (VACE: 6–12 Min laut `src/components/playground/Gallery.tsx:79`) bedeutet das: Der Nutzer sieht drei Bounce-Punkte, kann nicht abbrechen, nicht einschätzen ob es hängt, und der Lauf wird abgerechnet.

---

## 3. P1 — schmerzhaft, systematisch, wiederkehrend

### Zustand und Daten

- **Läufe leben nur im Speicher eines Tabs.** `src/app/create/PlaygroundShell.tsx:166-167` (`useState<ActiveRun[]>`, `useState<SoundRun[]>`), kein Dexie- oder localStorage-Eintrag — während `src/components/playground/constants.ts:14-17` dem Nutzer ausdrücklich verspricht: „Der Lauf läuft beim Anbieter weiter und wird berechnet." Beim Reload stirbt der Fetch, das Asset wird nie gespeichert.
- **Pruna-Läufe aus dem Chat überleben keinen Reload.** `src/lib/services/chat-service.ts:141-143` ruft `requestGeneration` ohne `context`; `src/lib/generation/request-generation.ts:63-73` schreibt nur mit `context` in den Store. `src/lib/generation/run-store.ts:1-13` nennt genau dieses Problem als Grund seiner Existenz. `PlaygroundShell` macht es richtig (`:342-345`), der Chat nicht.
- **Der BlobManager kann nichts freigeben.** `src/lib/blob-manager.ts:33` setzt für jeden Eintrag `refCount: 1`, `:131` überspringt in `cleanupOld` alles mit `refCount > 0`. Der 5-Minuten-Intervall (`:225-227`) ist damit wirkungslos. Der eigene Test hält das fest: `src/lib/blob-manager.test.ts:70-79` ist mit „KNOWN LATENT BUG — cleanupOld is effectively dead code" kommentiert. Zusätzlich erzeugt `src/hooks/useAssetUrl.ts:46` über `src/lib/services/asset-fallback-service.ts:60` bei jedem Auflösen eine neue Object-URL, und `src/lib/services/chat-service.ts:155` gibt nie frei.
- **Zwei Schreiber, ein Asset, kein Merge.** Der Ingest-Backfill schreibt `baseAsset` + `storageKey`/`remoteUrl` per `put` ohne `blob` (`src/lib/services/output-service.ts:74-83`), der Blob-Cache schreibt denselben Datensatz inklusive `blob` (`src/lib/services/asset-fallback-service.ts:145-151`). `src/lib/services/database.ts:164-166` ist ein vollständiges `put`, kein Merge. Letzter Schreiber gewinnt: landet der Backfill danach, ist der Blob weg; umgekehrt bleibt ein gelöschtes Asset als Zombie stehen, weil der Backfill keine Existenzprüfung hat.
- **Keine In-Flight-Guards bei Uploads und Musik.** `src/hooks/useUnifiedImageToolState.ts:262,285` bauen `next` aus `uploadedImages` und schreiben erst nach `await` zurück; `isUploading` wird gesetzt, aber nie als Guard gelesen. `src/hooks/useComposeMusicState.ts:78-84` startet `generateMusic` ohne Prüfung auf einen laufenden Vorgang — bei minutenslangen Läufen heißt zweimal Klicken: zwei Läufe, ein Ergebnis-Slot.
- **Das Standard-Bildmodell überschreibt die Chat-Auswahl.** `src/hooks/useChatState.ts:59-63` setzt `chatSelectedImageModel` bei jeder Änderung von `defaultImageModelId` — also auch bei der localStorage-Hydration nach dem Laden. `defaultImageModelId` ist in `src/components/settings/SettingsPopover.tsx:53-58` nach `providerMode` gefiltert und kann auf ein Pruna-Modell zeigen (`:257`). Der Einmal-Guard in `src/hooks/useChatEffects.ts:71-78` läuft beim Mount, also vor der Hydration, und greift nicht mehr. Folge: Bildgenerierung im Chat läuft gegen Pruna, der Pruna-Key wird mitgeschickt (Widerspruch zu `CLAUDE.md:92`), und die Speicherung nimmt den Blob-Zweig, der laut 2.1 scheitert.
- **Ein Bildspeicher-Fehler wird als Musikfehler gemeldet.** `src/lib/chat/chat-media-intent-handler.ts:124` meldet `input.onError?.('audio-save', message)` im Bildpfad; `src/components/ChatProvider.tsx:422-431` übersetzt nur `kind === 'image'` nach „Bild-Generierung fehlgeschlagen".
- **Der Persistenz-Effect läuft bei jedem Render.** `src/hooks/useChatState.ts:48-52` hängt an einem `persistence`-Literal, das `src/hooks/useChatPersistence.ts:66-75` bei jedem Aufruf neu erzeugt. Solange `activeConversation` noch `null` ist, kann jeder Render einen weiteren `loadConversation` starten.

### Barrierefreiheit

- **Hover-only-Aktionsleisten sind tabbar, aber unsichtbar.** `src/components/chat/MessageBubble.tsx:537`, `src/components/gallery/GalleryPanel.tsx:144`, `src/components/layout/AppSidebar.tsx:150`, `src/app/gallery/page.tsx:84` — keiner dieser Wrapper hat einen `group-focus-within`-Fallback (rg: kein Treffer). `opacity` und `pointer-events` entfernen Elemente nicht aus der Tab-Reihenfolge: Nutzer tabben in unsichtbare Buttons für Kopieren, Neu generieren, Löschen, Stern.
- **Galerie-Kacheln sind reine Maus-Ziele.** `src/app/gallery/page.tsx:66-80` und `src/components/gallery/GalleryPanel.tsx:131-142`: `onClick` auf `<Image>`/`<video>`, kein `tabIndex`, keine Rolle, kein Keydown, umgebender Container ein `<div>` (`:127`). Die Großansicht ist per Tastatur unerreichbar.
- **`ModalPopup` ohne Dialog-Semantik.** `src/components/ui/popup.tsx:208-238`: kein `role="dialog"`, kein `aria-modal`, kein Fokus-Move, keine Falle. Genutzt vom Einstellungsdialog `src/components/settings/SettingsPopover.tsx:91`. Im ganzen `src` gibt es `role="dialog"` nur einmal — in `src/components/chat/input/UnifiedMobileDrawer.tsx:171-172`, und dort ist es korrekt gebaut.
- **Vollbild-Vorschau und Lightbox sind für Screenreader nicht vorhanden.** `src/components/chat/MessageBubble.tsx:157` (Portal ohne Escape-Handler, ohne Rolle, ohne Fokusverschiebung), `src/app/gallery/page.tsx:324-345` (Klick-Overlay, `autoPlay`-Video), Schließen-Button `:346-351` ohne `aria-label`.
- **Mobile Sidebar ohne Semantik und ohne Escape.** `src/components/layout/AppSidebar.tsx:83-86` (Backdrop als `<div onClick>`, nicht fokussierbar), `:88` (`<aside>` ohne Dialogrolle). Der auslösende Button `src/components/layout/AppLayout.tsx:336-344` hat weder `aria-label` noch `aria-expanded`/`aria-controls`.
- **Keine Live-Region für asynchrone Chat-Zustände.** `src/components/chat/ChatView.tsx:110-123` (Virtuoso-Liste ohne `role="log"`, `aria-live`, `aria-busy`); der Denk-Indikator `src/components/chat/MessageBubble.tsx:377-390` und der Offline-Banner `src/components/ui/OfflineIndicator.tsx:61-83` haben `role="status"` nicht. Dass es geht, zeigt `src/components/playground/Gallery.tsx:103-104` und `:185`.

### Agenten und Maschinen

- **Für Maschinen existiert die Seite nicht.** Kein `robots.txt`, kein `sitemap`, kein `llms.txt`, kein `manifest`, keine `middleware.ts` (repo-weit geprüft). In `src/app/layout.tsx:10-18` fehlen `metadataBase`, `robots`, `openGraph`, `twitter`, `alternates`; JSON-LD gibt es nicht (`rg 'application/ld+json'` → 0).
- **Der Rate-Limiter ist ein Prozess-Map, keine Identität.** `src/lib/rate-limit.ts:15` (`const windows = new Map()`), `:53` (Key = `x-forwarded-for`). Die Datei nennt die Grenze selbst (`:4-7`). Sechs der zwanzig Routen haben überhaupt kein Limit.
- **Der Chat-Pfad blockiert bis zu 180 s — bei `maxInstances: 1`.** `src/lib/media/server-media-ingest.ts:104` pollt bis 180 s in der Anfrage (`src/app/api/generate/route.ts:315`); nur der Pruna-Zweig antwortet mit `202 {pending, predictionId}` (`:237`). `apphosting.yaml:5` begrenzt auf eine Instanz — in dieser Zeit wartet die gesamte Nutzerschaft.
- **Der Text-Endpunkt ist nicht OpenAI-förmig, der kompatible kann fast nichts.** `src/app/api/chat/completion/route.ts:63,312` verlangt `modelId` statt `model`, kennt kein `tools`/`response_format` und liefert nur `choices[0].message.content` ohne `id`, `model`, `usage`, `finish_reason`. `src/app/api/pollen/polly/route.ts:13,48` spricht echtes OpenAI-Format, ist aber `.strict()` und auf `model: 'polly'` festgenagelt; `stream: true` wird mit 400 abgelehnt.
- **Modelle werden still ausgetauscht.** Der Smart Router ersetzt den angeforderten Modell-String bei Suchintention (`src/lib/chat/chat-search-strategy.ts:49`, `src/app/api/chat/completion/route.ts:169`) und ist standardmäßig aktiv; die Antwort nennt weder `routedModelId` noch `strategy`. Der Ausweg `skipSmartRouter` ist nirgends dokumentiert.
- **Upstream-Fehler werden zu einem bedeutungslosen 502.** `src/app/api/chat/completion/route.ts:253,277,304` — der echte Grund (Moderation, Quota, Timeout) landet nur im Log. Der Timeout-Fall ist garantiert verdeckt: der 30-s-Hardcap in `src/lib/https-post.ts:18` wird ein generisches `Error` und fällt in `src/lib/api-error-handler.ts:56` auf `INTERNAL_ERROR` 500.
- **Kein CI für Tests, Lint oder Typen.** `.github/workflows/` enthält ausschließlich `registry-check.yml`, obwohl `package.json` `build`, `lint`, `typecheck` und `test` bereitstellt. Die 121 Testdateien laufen nur, wenn jemand sie lokal startet. Ohne Test bleiben ausgerechnet `src/lib/services/database.ts`, `src/lib/services/asset-fallback-service.ts`, `src/hooks/useComposeMusicState.ts`, `src/hooks/useAssetUrl.ts` und `src/hooks/useChatPersistence.ts`.

### Feedback, Sprache, Gefühl

- **Beim Fertigwerden passiert nichts.** Kein Ton, keine Haptik, keine Enthüllung: `AudioContext`, `createOscillator`, `navigator.vibrate` kommen im Repo nicht vor; `new Audio(` nur für TTS (`src/hooks/useChatAudio.ts:72,112`). Das neue Ergebnis erscheint ohne jede Animation in einem Dreier-Raster (`src/components/gallery/GallerySidebarSection.tsx:12,95-107`).
- **Der Sprachschalter erreicht `/create` nicht.** `rg -l useLanguage src/components/playground src/app/create` liefert nur `ModelPicker.tsx`; `Gallery.tsx`, `MetaRail.tsx` und `PromptBar.tsx` haben null `t()`-Aufrufe. Ein englischsprachiger Nutzer klickt auf „EN" und arbeitet weiter in einem deutschen Vollbild-Tool.
- **Zwei Fehlerregister.** Die Chat-Bubble zeigt `Sorry, an error occurred: …` (`src/lib/chat/chat-send-coordinator.ts:212,216`) bzw. `"Sorry, I couldn't get a response."` (`src/lib/chat/chat-send-orchestrator.ts:113`) mit dem Rohtext `API error: Upstream model request failed` (`src/lib/services/chat-service.ts:80`). Der Toast darüber ist deutsch. `/create` macht es im selben Produkt vorbildlich (`src/lib/errors/describe-error.ts:13-80`) — wird aber nur an einer Stelle benutzt (`src/app/create/PlaygroundShell.tsx:122`).
- **Erste Sitzung = leerer Bildschirm.** `src/components/page/ChatInterface.tsx:205-207` mit dem Kommentar „Completely empty area - no branding, no text, nothing"; `src/components/chat/ChatView.tsx:107` rendert bei null Nachrichten ein leeres `div`; die Sidebar zeigt bei 0 Chats nichts (`src/components/layout/AppSidebar.tsx:139`), obwohl der Text existiert (`src/config/translations.ts:7`). Prompt-Vorschläge gibt es nirgends.
- **Das Gedächtnis schreibt, liest aber nie.** `src/lib/services/memory-service.ts:8-53` extrahiert und ruft `updateMemory` (`src/lib/services/database.ts:139-146`); `getMemories()` (`database.ts:159`) hat keinen einzigen Aufrufer. Kein UI, keine Prompt-Injektion.
- **Das Fehlermodell ist dekorativ.** `src/lib/errors/error-codes.ts` listet 33 Codes, aber Routen werfen `UPLOAD_TOO_LARGE`, `INVALID_MEDIA_TYPE`, `EMPTY_UPLOAD`, `INVALID_DURATION`, `PRUNA_MISSING_ID`, die `apiErrors`-Codes und teils gar keinen Code (`src/app/api/chat/completion/route.ts:145,179`). `describeError` gibt für alle diese `null` zurück (`src/lib/errors/describe-error.ts:149-152`), und der Nutzer liest englische Routentexte in einer deutschen Oberfläche.

---

## 4. P2/P3 — gesammelt

- **Fehlerformat über die Fläche inkonsistent:** 33 Stellen mit `error: '…'` ohne `code` in 15 von 20 Routen; die vier Routen ohne zentralen Handler haben ihr eigenes Format.
- **Generieren ist nicht wiederholbar:** die Antwort enthält nur `{ imageUrl, videoUrl }` (`src/app/api/generate/route.ts:357`), kein effektiver Seed, keine aufgelöste Modell-ID, kein Provider; `Idempotency-Key` repo-weit 0 Treffer.
- **Validierungsdetails werden auf das erste Feld reduziert** (`src/lib/api-error-handler.ts:91`) — Selbstkorrektur nur per Trial and Error.
- **Musik kommt als Base64-Daten-URL** im JSON (`src/app/api/compose/route.ts:103`): bei 300 s Laufzeit grob 5–7 MB Antwortkörper.
- **Voice-Routen ignorieren BYOP** (`src/ai/flows/tts-flow.ts:28`, `src/ai/flows/stt-flow.ts:7`), obwohl `src/lib/resolve-pollen-key.ts:7` sich als einzige Key-Quelle erklärt. `src/app/api/chat/title/route.ts:106` ruft hart `gemini-fast` auf dem Server-Key, obwohl das Modell als `isFree: false` markiert ist (`src/config/chat-options.ts:69`).
- **Nur `X-Pollen-Key` wird gelesen** (`src/lib/resolve-pollen-key.ts:10`) — ein Standard-Client mit `Authorization: Bearer` fällt lautlos auf den Betreiber-Key zurück. CORS-Header existieren nicht.
- **Ungeguardete JSON-Parses** (`src/app/api/generate/route.ts:68`, `src/app/api/chat/completion/route.ts:137`) machen aus einem abgeschnittenen Body einen 500 statt einer 400.
- **Tote Logik:** `src/lib/services/asset-fallback-service.ts:96-127` betreibt Backoff um `resolvePollinationsMediaUrl`, das ein reiner String-Builder ist und nie wirft (`src/lib/upload/pollinations-media.ts:75-81`) — der `throw` ist unerreichbar. `describeUnknown`, `precacheAssets` und `OutputService.getResolvedAssetUrl` haben keinen Aufrufer.
- **Kontrast:** `--destructive` (`src/app/globals.css:96`) gegen `--background` (`:75`) ergibt ≈ 1,9:1 und wird als Fehlertextfarbe benutzt; `text-white/40` und `/60` liegen bei ≈ 1,8:1 bzw. 2,6:1; dazu 9,5–10,5 px Typo.
- **Kein Skip-Link, keine `<nav>`-Landmarke, drei Hauptansichten ohne H1** (rg `<main|<nav|<h1|<h2` → null `<nav>`-Treffer); die einzige `sr-only`-H1 ist `src/components/page/LandingView.tsx:104`.
- **Sprachmix ohne `lang`-Auszeichnung:** `aria-label="Toggle theme"` (`src/components/ThemeToggle.tsx:17`), `"Toggle language"` (`src/components/LanguageToggle.tsx:43`), `"Collapse sidebar"` (`src/components/layout/AppSidebar.tsx:96`), `"Like"` (`src/components/gallery/GalleryPanel.tsx:147`).
- **Bild-Vorschau-Lightboxen** ohne Escape/Dialogrolle (siehe 3. Barrierefreiheit).
- **Reduced Motion punktuell, nicht systematisch:** kein `MotionConfig` im Repo; ungeprüft laufen der 0,45-s-ClipPath-Reveal (`src/components/chat/MessageBubble.tsx:508-517`), `src/components/page/about/ScrollReveal.tsx:40-48`, die Endlosschleifen in `src/components/ui/ModeButtonOverlay.tsx:20-102` und `animate-pulse` (`src/components/ui/OfflineIndicator.tsx:71`). `jest.setup.ts:22-38` mockt `matchMedia` ohne `matches`-Steuerung, sodass die Zweige in Tests nie greifen.
- **31 hardcodierte Meldungstitel, 28 davon englisch** (`src/hooks/useUnifiedImageToolState.ts:250,254,282,353,429`, `src/lib/chat/chat-send-coordinator.ts:286,299,318,440`, `src/components/ChatProvider.tsx:547,590,593,607`); der `toast.*`-Namespace existiert und wird fast nicht benutzt.
- **Beste Microcopy ist toter Code** (`src/config/translations.ts:6,7,8`); live ist „Worüber möchtest du sprechen?".
- **Zwei Sackgassen-Routen mit englischem Banner** (`src/app/gallery/page.tsx:209-225`, `src/app/settings/page.tsx:33-42`), die nirgends mehr verlinkt sind.
- **Marke widerspricht sich:** `HeyHi · local-first AI workspace` (`src/app/layout.tsx:11`), `heyhi / create` (`src/app/create/page.tsx:6`), Wortmarke `hey.hi`. Die Meta-Description trägt das Artefakt `Just say</hey.hi> to run multiple AI.` (`src/app/layout.tsx:12`).
- **Kein Ausgang nach außen:** kein Share, keine öffentliche URL, kein Remix fremder Ergebnisse (`rg 'navigator.share|permalink|publicUrl'` → leer); Likes sind lokale Sterne.
- **Kein automatisiertes A11y-Gate:** `eslint.config.mjs` lädt nur `core-web-vitals`, kein `jsx-a11y`, kein `jest-axe`; `scripts/audit/check-ux.sh:13-31` prüft nur `/unified`, nur mit laufendem Dev-Server, und ist nicht in CI.

---

## 5. Querschnitt — vier Linien, ein Muster

Die vier Prüfstränge haben unabhängig voneinander dasselbe gefunden, nur in verschiedenen Gewändern:

**a) Niemand besitzt den Lebenszyklus.** Ein Lauf entsteht als `useState`, wird an den Anbieter geschickt und danach vergessen — auch wenn der Nutzer den Tab neu lädt. Ein Asset wird von einer Funktion gespeichert, die im Zweifel `undefined` liefert, ohne dass es jemand erfährt. Ein Blob wird mit `refCount: 1` gehalten und nie freigegeben, weil Freigabe niemandes Aufgabe ist. Und beim 51. Chat löscht eine Konstante den ältesten Bestand. Wer einen Abbruch-Button bauen will, braucht zuerst ein Run-Objekt, das man abbrechen kann — die fünf P0-Befunde sind fünf Ansichten derselben fehlenden Schicht.

**b) Die Maschine spricht mit sich selbst.** Die Fehlercodes existieren, die Übersetzung existiert, die Live-Region existiert, die ASCII-Effektsprache existiert. Sie erreichen den Nutzer nicht, weil niemand sie an die Aufrufstellen anschließt. Das ist die billigste Art von Rückstand: die Arbeit ist schon getan, sie ist nur nicht verdrahtet.

**c) Ein Terminalprodukt, das man nicht tippen kann.** Die Identität ist Terminal, CRT, Matrix. Die Bedienung ist Maus, Hover und `onClick` auf `<div>`. Moduswechsel per Pfeiltaste geht nicht, die Galerie hat keinen Fokus, die Sidebar hat keinen Namen. Die eigene Ästhetik ist dekorativ geblieben statt funktional.

**d) Local-First wurde als Local-Only gebaut.** Es gibt keinen Serverzustand — das ist eine bewusste, gute Entscheidung. Aber daraus wurde abgeleitet, dass es auch keinen Ausgang geben darf: keine Rezeptdatei, kein Share-Link, keine Metadaten, kein `llms.txt`, kein MCP, keine API, die eine Maschine ohne Browser erreicht. Das Produkt kann erzeugen, aber nichts herausgeben.

---

## 6. Drei Vorschläge (creative-ideation)

**Angewandte Methode — offengelegt, damit sie prüfbar ist.** Zwei Methoden, explizit gestapelt (Signale widersprechen sich: „next level" verlangt Neues, „Funktionalität + Accessibility" verlangt Umsetzung):

- **Lateral Provocations nach Edward de Bono** (`PO`-Operatoren: Escape, Reversal, Exaggeration, Distortion, Wishful Thinking) für die Rahmenbrüche.
- **Jobs to be Done nach Christensen/Moesta** als Prüfrahmen: Wer heuert dieses Produkt für welchen Auftrag an? Der Auftrag lautet nicht „ich will ein Bild", sondern: *Wenn ich eine Idee habe, will ich sie in einer Sitzung mehrfach sehen, hören und behalten können — ohne Konto, ohne Verlustangst, ohne die Sorge, dass mir etwas weggeräumt wird.*

**Verworfen — die ersten fünf naheliegenden Ideen.** Sie sind nicht falsch, sie sind die Verteilung, die jeder zuerst produziert, und sie stehen als Quick Wins schon im Audit: (1) MCP-Server dranbauen, (2) `robots.txt`/`llms.txt`/`sitemap` schreiben, (3) Community-Galerie mit Likes, (4) Voice-Mode, (5) Onboarding-Wizard. Die drei folgenden Vorschläge sind die zweite Runde: sie setzen dieselben Probleme voraus, aber sie lösen sie so, dass mehrere Dimensionen gleichzeitig kippen.

### Vorschlag 1 — Die Befehlsschicht

**Provokation (Escape):** *Po: die Maschine hat keinen Bildschirm.*

Wenn hey.hi gar keine sichtbare Oberfläche hätte, müsste alles, was es kann, als benannte Aktion existieren, die man aussprechen oder tippen kann — und jeder Zustandswechsel müsste angesagt werden. Es wäre kein grafisches Programm, sondern ein Protokoll.

**Mechanismus.** Eine einzige deklarative Registry in `src/lib/commands/registry.ts`. Jede Aktion ist ein Eintrag mit `id`, `labelDe`/`labelEn`, optionalem Kürzel, `argsSchema` (Zod), `danger: 'safe' | 'costly' | 'destructive'`, `agentExposed`, `announce` und `run(ctx)`. Aus dieser einen Liste entstehen vier Projektionen, die heute vier getrennte Baustellen sind:

1. **Tastatur und Befehlspalette** (`Cmd+K`) — `mode.select`, `aspect.set`, `duration.set`, `message.actions.open`, `gallery.open`, `run.stop`.
2. **Ansagekanal** — dieselbe `announce`-Zeichenkette speist den bereits existierenden, aber ungenutzten `aria-live`-Kanal in `src/components/ascii/index.tsx:36`. Sichtbarer Text und Ansage können nicht mehr auseinanderlaufen.
3. **Agentenfläche** — dieselben Einträge erzeugen die Tool-Liste für einen MCP-Endpunkt und die Beschreibung in `llms.txt`, mit Key-Pflicht und Kostenklasse aus demselben Feld, das der UI-Dialog benutzt.
4. **Selbstdokumentation** — eine sichtbare Tafel mit den Kürzeln, direkt aus der Registry gerendert.

**Warum das mehr ist als die Summe der Fixes.** Barrierefreiheit und Agentenfähigkeit sind heute zwei Backlogs, die niemand gleichzeitig bearbeitet. In Wahrheit brauchen beide exakt dasselbe: eine vollständige, benannte, parameterisierte Liste dessen, was dieses Produkt tun kann. Wer die für Screenreader schreibt, hat die für Agenten schon geschrieben. Die Registry ist damit die erste Stelle, an der zwei der vier Prüfdimensionen strukturell zusammenfallen.

**Was konkret wegfällt.** Befund 2.4 (Radiogruppen ohne Pfeiltasten) wird zu `focus.next`/`select` aus der Registry. Befund 3 (Hover-Leisten) wird zu `message.actions.open`, das den Fokus wirklich bewegt. Der namenlose Sidebar-Button (Befund 6), die fehlende Live-Region (Befund 7) und die nicht angeschlossenen ASCII-Effekte (Befund „Effektsprache") hängen an derselben Verdrahtung.

**Ehrliches Scheitern.** Erstens: räumliche und zustandsbehaftete Handlungen lassen sich nicht deklarativ einfangen. „Wähle die dritte Kachel" braucht ein Fokusmodell über die Galeriedaten, keine Zeile in einer Liste. Wenn die Palette das umgeht, wird sie eine Parallelwelt, die die echten DOM-Semantiken überspringt — genau der Fehler, den sie beheben soll. Zweitens: `danger` verrottet. Sobald ein neuer Anbieter dazukommt, wird die Markierung gelogen, und eine fälschlich als `safe` markierte destruktive Aktion ist per Agent aufrufbar. `agentExposed` muss deshalb standardmäßig `false` sein und nur über eine explizite Freigabeliste aktiviert werden. Drittens: eine Registry, die nur für die Palette gebaut wird, produziert den kleinsten gemeinsamen Nenner und macht jede Sonderbehandlung unmöglich.

**Bodenhaftung — der erste Schritt ist klein.** Die Registry mit den rund zwanzig Aktionen füllen, die es heute schon gibt (senden, stoppen, Modus, Seitenverhältnis, Dauer, generieren, wiederholen, als Referenz, löschen, kopieren, Galerie öffnen) und **nur** die Tastaturprojektion veröffentlichen. Das ist ein Tag Arbeit, ändert kein Laufzeitverhalten an der API und behebt in derselben Bewegung zwei P1-Befunde, weil die Pfeiltastensteuerung aus denselben Daten kommt. Dieser Vorschlag ist der geerdete von den dreien.

### Vorschlag 2 — Der laufende Betrieb

**Provokation (Wishful Thinking):** *Po: kein Lauf geht verloren.*

**Mechanismus.** Die ephemeren `runs` aus `src/app/create/PlaygroundShell.tsx:166-167` werden eine Dexie-Tabelle `runs` — mit `id`, `kind`, `providerJobId`, `startedAt`, `expectedMs` (die Schätzwerte existieren schon, `src/components/playground/Gallery.tsx:78-82`), `status`, `recipeSnapshot` und `ownerRef` (Nachricht oder Asset). Das Journal wird **vor** dem Provider-Aufruf geschrieben und danach geschlossen. Ein `RunProvider` oberhalb von Chat und Create übernimmt das Weiterverfolgen, damit ein Reload oder ein Routenwechsel den Lauf nicht tötet. Für Anbieter mit Job-Handle (Pruna `predictionId`, Sound `taskId` — beides ist fertig implementiert, `src/app/api/sound/route.ts:158` zeigt das Poll-Muster) wird beim Start wieder angehängt, nicht neu gestartet.

Auf derselben Schicht sitzen drei Dinge, die heute fehlen und einzeln gebaut würden:

- **Abbruch** überall — der Chat bekommt einen Stop, der ein Run-Objekt abbricht, keine unsichtbare Variable.
- **Sichtbarkeit** — eine Live-Zeile in der Sidebar („2 Läufe · VACE 04:12") mit `AsciiProgress`, ein Title-Badge, beim Fertigwerden `AsciiDone` plus ein kurzer Ton. Der Enthüllungsmoment, der heute komplett fehlt.
- **Rücklesbarkeit für Maschinen** — `GET /api/runs` plus `Idempotency-Key` macht headless-Clients erst möglich: ein Agent kann erzeugen, pollen und sicher wiederholen, weil ein Lauf eine Adresse hat.

**Zusätzlich: Besitz statt Löschen.** Dieselbe `ownerRef` beendet Befund 2.2. Bevor der 51. Chat den ältesten wegräumt, kann das Produkt fragen — und es kann sagen, welche Assets daran hängen. Der Blob-Manager bekommt damit erstmals einen Eigentümer, statt auf ein `releaseURL` zu warten, das nie kommt.

**Ehrliches Scheitern.** Der Chat-Bildpfad hat heute kein Job-Handle: `src/lib/chat/chat-send-orchestrator.ts:148` wartet blockierend in der Sendekette. Ein Journal, das dort eine Wiederaufnahme verspricht, lügt genau in dem Moment, in dem der Nutzer ihm glaubt. Die ehrliche Fassung schreibt in diesem Pfad „nicht wiederauffindbar" statt eine Karte anzubieten — und der Pfad muss auf zwei Phasen umgebaut werden (starten → Job-ID → veröffentlichen), bevor die Anzeige stimmt. Zweitens: Wiederaufnahme darf niemals einen neuen Provider-Lauf auslösen, sonst bezahlt der Nutzer zweimal für dasselbe Bild; angehängt wird ausschließlich über die `providerJobId`. Drittens: ein Run-Ledger, das auf einem Server liegt, widerspricht der Local-First-Zusage — es gehört in Dexie, und die Agenten-Variante braucht ein TTL und eine ausdrückliche Zustimmung. Viertens: Polling kostet; ohne Backoff und ohne Stille-Erkennung wird aus einem verlorenen Lauf ein leerlaufender Tab.

### Vorschlag 3 — Rezept statt Ergebnis

**Provokation (Reversal):** *Po: die Zuhörerin komponiert.* Umkehrung der Richtung: Nicht der Mensch fragt die Maschine, sondern das Ergebnis adressiert den Menschen zurück.

**Mechanismus.** Das Rezept — Prompt, Modell, Anbieter, Parameter inklusive Seed, Referenzbilder, Werkzeugkette — wird ein eigenständiges, versioniertes Objekt (`heyhi.recipe/v1`) und nicht länger ein Nebenprodukt des Assets. Die Daten liegen bereits vollständig in Dexie (`src/lib/services/database.ts:24-36`). Daraus entstehen drei Ausgänge, die alle ohne Server funktionieren:

1. **Datei** — `.recipe.json` exportieren und importieren.
2. **Link** — `/#r=<base64url>` befüllt `/create` und den Chat vor; kein Konto, keine Ablage.
3. **Karte** — eine per Canvas gerenderte Karte (Ergebnis + Rezept) zum Teilen oder Herunterladen, mit `navigator.share` auf Mobil.

Die Umkehrung liegt im Import: Ein eingefügtes Rezept zeigt nicht nur, wie es gemacht wurde, sondern **schlägt aus seinem eigenen Parameterraum die nächsten Züge vor** — derselbe Seed auf einem anderen Modell, das Bild als Startframe für VACE, 8 s → 16 s, die ACE-Step-Tagliste als Variation. Das ist keine Stimmungsmagie, sondern ein Diff gegen die Parameter des Rezepts selbst. Die Maschine stellt die nächste Frage, statt auf die nächste Eingabe zu warten.

**Warum es alle vier Dimensionen berührt.** Funktion: endlich Reproduzierbarkeit und ein Interchange-Format, das auch der Agent lesen und schreiben kann — der Ausgang, der heute komplett fehlt. Accessibility: ein Rezept ist Text und damit vollständig per Tastatur und Screenreader navigierbar; es ersetzt den Rohprompt als Alt-Text-Grundlage durch etwas Strukturiertes (und ergänzt echten Alt-Text, statt ihn zu ersetzen — ein Rezept beschreibt die Herstellung, nicht den Anblick). Agenten: ein stabiles, versioniertes Rezept ist das, was ein Agent in eine Anfrage und wieder zurück übersetzen kann; ohne es bleibt jede Agenten-Anbindung eine Sammlung von Sonderfällen. Playful: ein Rezept ist ein kleines Geschenk. Es ist die einzige soziale Geste, die in einem local-first Produkt ohne Server ehrlich funktioniert.

**Ehrliches Scheitern.** Erstens: gleicher Seed plus gleicher Prompt garantiert nicht dasselbe Bild. Anbieter wechseln Modelle, Sampling ändert sich, Versionen driften. Die Karte muss „Rezept, nicht Ergebnis" heißen, sonst verspricht sie eine Treue, die sie nicht halten kann. Zweitens: Link-Fragmente leaken Prompts in Verlauf, Logs und geteilte Chats und werden mit Referenzbildern unhandlich — Referenzen gehören als lokale IDs hinein, nie als Daten, und nie ein Schlüssel. Drittens: importierte Rezepte treffen auf abgekündigte Modelle. Ohne sichtbaren „Modell weg — nächster Verwandter?"-Pfad mit gezeigtem Diff scheitert der Import genau bei den Rezepten, die alt genug sind, um interessant zu sein. Viertens: ohne Backend bleibt es eine Einbahnstraße — keine Zähler, keine Antworten, kein Remix-Tracking. Wer das will, will ein Netzwerk, und das wäre eine andere Produktentscheidung.

**Bodenhaftung.** Export und Import der Rezeptdatei plus der Link-Fall sind ohne Backend und ohne Schema-Migration über die vorhandenen Dexie-Felder baubar. Die Karte kommt danach, die Fortsetzungsvorschläge zuletzt.

---

## 7. Prüfgrenzen

Was dieser Audit **nicht** geprüft hat:

- **Keine Live-Prüfung gegen Produktion oder Anbieter.** Alle Aussagen stammen aus dem Repo-Stand (Commit `98ce083`, Branch `main`, Arbeitsbaum sauber). Verhalten der Anbieter (Pollinations, Pruna, Modal) wurde nicht gemessen.
- **Keine Browser-Automatisierung.** `browser_subagent` und `read_browser_page` sind per `AGENTS.md` gesperrt und wurden nicht benutzt. Aussagen über Tastaturverhalten, Kontrast und Fokusverhalten sind aus dem Code abgeleitet, nicht am laufenden Gerät beobachtet.
- **Kein Build, kein Test-Lauf, kein Lighthouse.** Aus Rücksicht auf die Maschine (8 GB, M2) und weil keine Änderung ansteht. Die 121 Testdateien wurden nur danach beurteilt, was sie abdecken, nicht ausgeführt.
- **Kein mobiler Test auf echtem Gerät**, kein Screenreader-Test mit VoiceOver/NVDA. Die Kontrastwerte sind gerechnet, ohne Blur- und Alpha-Komposit.
- **Keine Bewertung des Deployments** jenseits von `vercel.json`, `apphosting.yaml` und den Headern in `next.config.ts`.

Nachtrag: Bei der Planerstellung am selben Tag wurden die Zahlen erneut nachgezählt. Die Korrekturen stehen in §9; verbindlich sind dort die berichtigten Werte.

Was diesen Audit qualifiziert: vier unabhängige Prüfstränge mit überlappenden Suchgebieten, die fünf kritischen Befunde wurden zusätzlich händisch am Code nachgeprüft (`MAX_STORED_CONVERSATIONS`, `blob-manager`, `output-service`, fehlende `AbortController`-Nutzung im Chat, fehlende `onKeyDown`-Handler).

---

## 8. Zuordnung nach Art der Arbeit

Die Abschnitte 2 bis 4 sortieren nach Schweregrad und beantworten damit die Frage, wie dringend etwas ist. Was für Arbeit es ist und wem sie nützt, steht dort nicht. Für die Reihenfolge des nächsten Schritts braucht es beide Achsen.

| Art der Arbeit | P1 | P2/P3 | Wem die Behebung nützt |
| --- | --- | --- | --- |
| Zustand, Daten, Speicher (Hooks, Dexie, Services) | 10 | 1 | Nutzer (kein stiller Verlust), Betreiber (keine Doppel-Läufe), Dev |
| API, Routen, Fehlercodes, Antwortverträge | 8 | 7 | Agent und Maschine, Betreiber, Dev |
| UI, Semantik, Tastatur, Text | 8 | 7 | Nutzer |
| Metadaten, CI, Repo-Infrastruktur | 1 | 1 | Maschine, Dev |
| Marke, Ausgang nach außen | 0 | 2 | Nutzer |

Die Zählung ist eine Umsortierung der vorhandenen 45 Befunde; 46 Nennungen, weil ein Befund in beiden Abschnitten steht. Es sind keine neuen Prüfungen, sondern eine zweite Sortierung derselben Daten. Drei Dinge fallen dabei auf.

**Der P1-Block ist überwiegend keine Backend-Liste.** Achtzehn der siebenundzwanzig Befunde liegen in zwei Gruppen, die den Server nicht berühren: Zustand, Daten und Speicher (10) sowie UI und Tastatur (8). Backend im engen Sinn sind fünf Befunde — der Rate-Limiter als Prozess-Map, der blockierende 180-Sekunden-Pfad bei einer Instanz, der Textendpunkt im falschen Format, der stille Modelltausch, der 502 ohne Grund. Zwei weitere gehören zur Verdrahtung der Fehlercodes und liegen zwischen beiden Welten.

**Was den Entwickler beschleunigt, ist eine Minderheit.** Reine Wartbarkeitsarbeit sind die Blob-Freigabe, der Persistenz-Effect pro Render, die tote Logik, das fehlende CI, die zwei Fehlerregister und das dekorative Fehlermodell — sechs der 45 Befunde. Alles andere zahlt beim Nutzer, beim Betrieb oder bei einem künftigen Agenten ein.

**P2/P3 hat den besten Aufwand-Nutzen-Schnitt des Audits.** Sieben der achtzehn Befunde sind Vertragsarbeit an bestehenden Routen (Fehlerformat, Wiederholbarkeit, Validierungsdetails, Base64-Musik, BYOP-Lücken, Key-Header, ungeprüfte JSON-Parses) und damit additiv, ohne Architekturentscheidung. Acht liegen in einzelnen UI-Dateien: Skip-Link, Landmarken, Überschriften, `lang`-Auszeichnung, Escape in den Lightboxen, ein Kontrast-Token, Meldungstitel, die tote Microcopy. Ein `jsx-a11y`-Plugin, `jest-axe` und ein CI-Lauf über `lint`, `typecheck` und `test` halten diesen Block danach dauerhaft klein.

**Wodurch das Produkt schlauer wird.** Drei Stellen: Fehlerantworten mit `code` und maschinenlesbaren Felddetails, an denen ein Agent sich selbst korrigieren kann; wiederholbare Generierung mit effektivem Seed, aufgelöster Modell-ID und `Idempotency-Key`; und ein Lauf mit auflösbarer Adresse anstelle eines `useState`. Das sind vier Befunde aus den Abschnitten 3 und 4 und gleichzeitig die Voraussetzungen, auf denen Vorschlag 1 und Vorschlag 2 aus Abschnitt 6 aufsitzen.

---

## 9. Nachträge aus der Planprüfung (2026-09-10)

Bei der Erstellung der vier Umsetzungspläne wurden alle Belege erneut am Code nachgezogen. Jeder Plan führt seine eigenen Abweichungen auf; hier stehen die Stellen, an denen dieser Audit korrigiert werden muss. Der ursprüngliche Text bleibt stehen, damit nachvollziehbar bleibt, was zuerst behauptet wurde.

| Stelle | Hier stand | Richtig ist | Beleg |
| --- | --- | --- | --- |
| 2.3, Credential-Rückfall | zwölf von zwanzig Routen | dreizehn Routen rufen `resolvePollenKey` auf, dazu zwei Flows, die den Umgebungsschlüssel direkt lesen | `rg -n 'resolvePollenKey\(' -g 'route.ts' src/app/api` → 13; `src/ai/flows/tts-flow.ts:29`, `src/ai/flows/stt-flow.ts:7` |
| 3, Rate-Limiter | sechs der zwanzig Routen ohne Limit | elf; neun Routen rufen `checkRateLimit` auf | `rg -l 'checkRateLimit' src/app/api` → 10 Dateien, davon eine Testdatei |
| 3, BlobManager-Test | `blob-manager.test.ts:70-79` | `:69-83` | |
| 3, Lauf-Hinweis | `src/components/playground/constants.ts:14-17` | `src/lib/playground/constants.ts:16-17` | benutzt in `src/components/playground/Gallery.tsx:134` |
| 3, Instanzgrenze | `apphosting.yaml:5` | `:7` | |
| 3, Hover-Leisten | „kein `group-focus-within` im Repo" (rg ohne Treffer) | das Muster existiert zweimal, es ist nur nicht an den vier Leisten angewandt | `src/components/ui/unified-input.tsx:123`, `src/components/chat/input/AttachmentPreviewRow.tsx:66` |
| 4, Fehlermodell | 33 Codes | 32 | `src/lib/errors/error-codes.ts:2-11` |
| 4, Fehlerformat | 33 Stellen mit `error: '…'` ohne `code` | 33 Stellen mit `error: '…'` in 15 von 20 Routendateien; 46 `error:`-Vorkommen insgesamt, genau zwei Routen setzen ein `code`-Feld | `rg -n 'code: ' -g 'route.ts' src/app/api` → `sound:60`, `generate:63` |
| 4, Kontrast | `--destructive` in Zeile 96 gegen `--background` in Zeile 75 | `--destructive` steht in `:31` und `:100`, `--background` in `:7` und `:79`; nachgerechnet dunkel 1,97:1, hell 2,90:1 | `src/app/globals.css` |
| 4, Kleinsttext | zwei Stellen `text-white/40` und `text-white/60` | `text-white/40` kommt genau einmal vor, `text-white/60` nirgends; der Hintergrund ist ein Verlauf, deshalb ist der Wert ohne Alpha-Komposit nicht reproduzierbar | `src/app/gallery/page.tsx:88`, `:84` |
| 4, Landmarken | rg nach `<main`, `<nav`, `<h1` ohne Treffer | `<main>` und `<h1>` existieren mehrfach; es fehlen die `<nav>`-Landmarke, der Sprunglink, und `/` sowie `/create` haben kein H1 | `src/components/layout/AppLayout.tsx:193`, `src/app/settings/page.tsx:35` |
| 4, A11y-Gate | „kein `jsx-a11y`" | das Plugin ist über `eslint-config-next` vorhanden und aktiviert sechs Regeln als Warnung; es fehlen Regelgruppen wie `click-events-have-key-events` und jede Testebene | `node_modules/eslint-config-next/dist/index.js:173-188` |
| 4, Reduced Motion | `jest.setup.ts:22-38` | `:10-25` | |
| 1, ASCII-Bausteine | „werden nirgends importiert" | gilt für `AsciiWave`, `AsciiDone` und `AsciiProgress`; `AsciiSpinner` und `AsciiSignature` werden in fünf Dateien benutzt | `src/components/ui/PageLoader.tsx:1`, `src/components/chat/ChatInput.tsx:9`, `src/components/playground/Gallery.tsx:2` |
| 4, Meldungstitel | 31 Titel, 28 davon englisch | die Aufrufstellen stimmen, die Summe ist mit `rg` nicht reproduzierbar | |

Keine dieser Korrekturen ändert einen Schweregrad. Zwei davon machen den Befund größer (Rate-Limiter, Credential-Rückfall), die übrigen sind Präzisierungen. Die Abschnitte 2 bis 8 bleiben im Wortlaut stehen; verbindlich sind ab hier die Werte dieser Tabelle.

---

**Keine der drei vorgeschlagenen Änderungen wurde begonnen.** Nach Phase 3 des `AGENTS.md`-Ablaufs folgt die Umsetzung erst nach ausdrücklicher Bestätigung.

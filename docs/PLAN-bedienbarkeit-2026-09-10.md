# Plan B — Oberfläche, Semantik, Tastatur, Text

## Ziel

Der Nutzer erreicht Modus, Seitenverhältnis, Videodauer und Recherchetiefe, beide Lightboxen, die Galerie-Kacheln, das Einstellungsfenster und die Seitenleiste mit der Tastatur, und der Fokus landet nie mehr auf einem Knopf, den er nicht sehen kann. Der Betreiber sieht eine Oberfläche, die in Titeln, Bannern und Meldungen dieselbe Marke und dieselbe Sprache benutzt, und ein Prüfnetz, das Rückfälle automatisch meldet statt sie bei der nächsten Runde wiederzufinden. Der Entwickler bekommt für Radiogruppen genau eine Fokusregel im Repo statt vier verschiedener Kopien, und jede Zeile dieses Plans trägt eine am aktuellen Code nachgeprüfte Fundstelle.

## Befunde in diesem Strang

Plan C entspricht der dritten Zeile der Tabelle in §8 des Audits (UI, Semantik, Tastatur, Text). Die Buchstaben A bis D folgen der Zeilenreihenfolge, C ist damit diese Gruppe.

| ID | Befund in einem Satz | Beleg (Datei:Zeile) | Grad |
| --- | --- | --- | --- |
| B1 | Modus, Seitenverhältnis, Videodauer und Recherchetiefe sind Radiogruppen ohne Pfeiltastensteuerung; jede inaktive Option trägt tabIndex=-1 und ist weder fokussier- noch aktivierbar. | src/components/chat/input/InlineModeSwitch.tsx:104-106 (role/aria-checked/tabIndex in :104-106); src/components/chat/input/ImageParamOptions.tsx:99-101 und :126-128; src/components/chat/input/ResearchDepthBadges.tsx:55-57; funktionierendes Vorbild im selben Ordner: src/components/chat/input/ToolsBadges.tsx:37-47 mit .focus() in :46 | P0 |
| B2 | Vier Aktionsleisten erscheinen nur bei Hover, bleiben aber tabbar. | src/components/chat/MessageBubble.tsx:537 (md:opacity-0 md:pointer-events-none); src/components/gallery/GalleryPanel.tsx:144; src/components/layout/AppSidebar.tsx:150; src/app/gallery/page.tsx:84 | P1 |
| B3 | Galerie-Kacheln sind reine Maus-Ziele: onClick auf <video>/<img>, kein tabIndex, keine Rolle, kein Keydown. | src/app/gallery/page.tsx:66-80 (Klick in :68 und :79); src/components/gallery/GalleryPanel.tsx:131-142 (Klick in :133 und :140) | P1 |
| B4 | ModalPopup rendert ein Overlay ohne role="dialog", ohne aria-modal, ohne Fokusführung und ohne Escape. | src/components/ui/popup.tsx:208-238, Portal in :235-238; Aufrufer src/components/settings/SettingsPopover.tsx:91; Vorbild src/components/chat/input/UnifiedMobileDrawer.tsx:169-176 | P1 |
| B5 | Chat-Vollbildvorschau und Galerie-Lightbox haben keine Struktur für Screenreader. | src/components/chat/MessageBubble.tsx:157-185 (Portal :157, Schließen ohne Rolle und ohne Escape); src/app/gallery/page.tsx:323-345 mit Schließen-Knopf :346-351 ohne aria-label | P1 |
| B6 | Die Seitenleiste hat weder Rolle noch Namen, ihr Auslöser hat keinen Namen, und Escape schließt sie nicht. | src/components/layout/AppSidebar.tsx:83-86 (Backdrop als div), :88 (<aside> ohne Rolle und Label), :79 (früher Ausstieg); Auslöser src/components/layout/AppLayout.tsx:336-344 | P1 |
| B7 | Für asynchrone Chat-Zustände gibt es keine Live-Region, und der vorhandene Ansagekanal wird gespeist von niemandem. | src/components/chat/ChatView.tsx:106-108 und :110-123; src/components/chat/MessageBubble.tsx:377-392 (Punkte, Text in :392); src/components/ui/OfflineIndicator.tsx:61-83; Vorbild src/components/playground/Gallery.tsx:103-104 und :185-186; Kanal src/components/ascii/index.tsx:36 | P1 |
| B8 | Der Sprachschalter erreicht /create nicht. | src/components/playground/ModelPicker.tsx (einziger useLanguage-Treffer im Bereich); kein einziger t()-Aufruf in src/components/playground/PromptBar.tsx, src/components/playground/MetaRail.tsx, src/components/playground/Gallery.tsx | P1 |
| B9 | Eine neue Sitzung startet auf einem leeren Bildschirm, obwohl mehrere passende Sätze im Repo liegen. | src/components/page/ChatInterface.tsx:205-207; src/components/chat/ChatView.tsx:106-108; src/components/layout/AppSidebar.tsx:139; tote Texte src/config/translations.ts:7 und :91-92 | P1 |
| B10 | Fehlertextfarbe und Kleinschrift liegen unter der Kontrastgrenze. | --destructive in src/app/globals.css:31 (hell) gegen --background :7 und in :100 (dunkel) gegen :79; Verwendung als Textfarbe z. B. src/components/playground/Gallery.tsx:190-191, src/components/playground/ReferenceSlots.tsx:159; 121 Textstellen mit 9 bis 10,5 px | P2 |
| B11 | Es gibt keinen Sprunglink und keine nav-Landmarke; / und /create haben keine H1. | kein <nav> und kein Skip-Link in src (rg, null Treffer); H1 nur in src/components/page/LandingView.tsx:104, src/app/settings/page.tsx:35, src/app/gallery/page.tsx:228, src/components/page/about/AboutHero.tsx:48 | P2 |
| B12 | Vier aria-labels sind englisch in einer deutschen Oberfläche und nicht als fremdsprachig ausgezeichnet. | src/components/ThemeToggle.tsx:17 und :22; src/components/LanguageToggle.tsx:43; src/components/layout/AppSidebar.tsx:96; src/components/gallery/GalleryPanel.tsx:147 | P2 |
| B13 | Reduced Motion ist punktuell umgesetzt; vier Animationen prüfen die Einstellung nicht. | src/components/chat/MessageBubble.tsx:508-517; src/components/page/about/ScrollReveal.tsx:40-48; src/components/ui/ModeButtonOverlay.tsx:20-30 (drei repeat: Infinity im selben Bauteil); src/components/ui/OfflineIndicator.tsx:69 (animate-pulse); kein MotionConfig im Repo (rg, null Treffer) | P2 |
| B14 | Meldungstitel stehen als englische Literale im Code statt im Schlüsselraum. | src/hooks/useUnifiedImageToolState.ts:250,254,282,353,429; src/lib/chat/chat-send-coordinator.ts:286,299,318,440; src/components/ChatProvider.tsx:547,590,593,607 | P2 |
| B15 | Die besten Platzhaltertexte des Repos sind toter Code, live ist der nüchterne Standardsatz. | toter Code: src/config/translations.ts:6 (chat.placeholder), :7 (chat.noHistory), :91-92 (home.placeholder.*) — kein Aufrufer in src; live: src/config/translations.ts:258 über src/components/chat/ChatInput.tsx:484 | P2 |
| B16 | Zwei Routen ohne Verlinkung, eine davon mit englischem Banner. | src/app/gallery/page.tsx:209-225 (Bannertext :212-214, ohne t()); src/app/settings/page.tsx:33-42 mit t()-Aufrufen :35-40; keine Verlinkung beider Pfade in src (rg) | P2 |
| B17 | Die Marke tritt in drei Schreibweisen auf, dazu ein Textartefakt in der Meta-Description. | src/app/layout.tsx:11 (HeyHi · local-first AI workspace), :12 (Just say</hey.hi> to run multiple AI.); src/app/create/page.tsx:6 (heyhi / create); Wortmarke hey.hi in src/components/page/LandingView.tsx:104 und src/components/layout/AppLayout.tsx:154 | P2 |
| B18 | Es gibt kein Prüfnetz für Barrierefreiheit, das Rückfälle automatisch meldet. | eslint.config.mjs:1-10 lädt nur core-web-vitals; jsx-a11y liegt als Plugin bereits bei, aber nur mit sechs Regeln (node_modules/eslint-config-next/dist/index.js:173-188); jest-axe fehlt in package.json:49-64; axe-core nur transitiv (package-lock.json:4776); scripts/audit/check-ux.sh:13-31 prüft nur /unified und nur mit laufendem Dev-Server | P2 |

### Abweichungen vom Audit

Zehn Angaben aus dem Audit treffen am aktuellen Code nicht mehr zu oder sind zu streng formuliert. Die IDs bleiben gültig, die Belegzeilen in der Tabelle oben sind die korrigierten.

1. B2, "kein group-focus-within im Repo": falsch. src/components/chat/input/AttachmentPreviewRow.tsx:66 nutzt sm:group-focus-within:opacity-100 zusammen mit focus-visible:opacity-100, src/components/ui/unified-input.tsx:123 nutzt group-focus-within:opacity-100. Damit liegt ein fertiges Muster im Repo, das nur nicht bei den vier Leisten angewandt ist.
2. B3, "umgebender Container ein <div> (:127)": src/components/gallery/GalleryPanel.tsx:127 ist heute die Stern-Markierung (:127-129); der Container der Kachel steht in :124-125.
3. B10, "--destructive (:96) gegen --background (:75)": beide Zeilen tragen die Tokens nicht. --destructive steht in src/app/globals.css:31 (hell) und :100 (dunkel), --background in :7 (hell) und :79 (dunkel). Nachgerechnet mit der HSL-Formel: dunkles Thema 1,97:1, helles Thema 2,90:1. Die Zahl "rund 1,9:1" gehört damit zum dunklen Thema.
4. B10, "text-white/40 und /60": text-white/40 kommt genau einmal vor (src/app/gallery/page.tsx:88, dort 10 px), text-white/60 nirgends. Die genannten 1,8:1 und 2,6:1 lassen sich ohne Alpha-Komposit nicht reproduzieren, weil der Hintergrund ein Verlauf ist (src/app/gallery/page.tsx:84, from-black/80 via-black/35 to-transparent).
5. B11, "rg <main|<nav|<h1 -> nur LandingView.tsx:104": trifft nicht zu. <main> existiert in src/components/layout/AppLayout.tsx:193, src/app/about/page.tsx:32, src/app/create/PlaygroundShell.tsx:852 und src/app/settings/page.tsx:34; <h1> in src/components/page/LandingView.tsx:104, src/app/settings/page.tsx:35, src/app/gallery/page.tsx:228 und src/components/page/about/AboutHero.tsx:48. Bestand haben drei Teile des Befunds: keine <nav>-Landmarke, kein Sprunglink, und / sowie /create ohne H1.
6. B13, "jest.setup.ts:22-38 mockt matchMedia ohne matches-Steuerung": die Zeilenangabe ist verrutscht. Der matchMedia-Mock steht in jest.setup.ts:10-25, das feste matches:false in :15; :22-38 umfasst heute das Ende dieses Mocks und den crypto.randomUUID-Mock (:27-42).
7. B16, "zwei Sackgassen-Routen mit englischem Banner": das Banner in src/app/settings/page.tsx:35-40 ist übersetzt (Schlüssel in src/config/translations.ts:69-71 und :340-342). Englisch ist nur das Banner in src/app/gallery/page.tsx:212-214. Sackgasse trifft auf beide Routen zu: kein Pfad in src verlinkt sie.
8. B18, "kein jsx-a11y": zu streng. eslint-config-next registriert das Plugin und aktiviert sechs Regeln als Warnung (node_modules/eslint-config-next/dist/index.js:173-188: alt-text, aria-props, aria-proptypes, aria-unsupported-elements, role-has-required-aria-props, role-supports-aria-props). Es fehlen Regelgruppen wie click-events-have-key-events und jede Testebene. Das Plugin ist als Abhängigkeit von eslint-config-next schon installiert (node_modules/eslint-config-next/package.json:19).
9. B5, "Schließen-Button :346-351 ohne aria-label": gilt für die Galerie-Lightbox. Der Schließen-Knopf der Chat-Vorschau hat ein Label (src/components/chat/MessageBubble.tsx:178).
10. B14, "31 hardcodierte Meldungstitel, 28 davon englisch": die Summe ist am Code nicht nachzählbar. rg findet 26 toast({ title: ... })-Aufrufe in acht Dateien, dazu weitere title:-Zuweisungen in anderen Zusammenhängen. Die Aufrufstellen in der Tabelle stimmen, die Gesamtzahl nicht.

Zusätzlich: Der Ansagekanal in src/components/ascii/index.tsx:36 ist nicht nur ungenutzt, sondern ungespeist. Keiner der drei Produktionsaufrufe übergibt ein label (src/components/ui/PageLoader.tsx:10, src/components/chat/ChatInput.tsx:705, src/components/playground/Gallery.tsx:108); nur der Test in src/components/ascii/ascii.test.tsx:35 tut es. Die Aussage in §1, die ASCII-Bauteile würden nirgends importiert, gilt heute nur noch für AsciiWave, AsciiDone und AsciiProgress.

## Wellen

### Arbeitsteilung: unsichtbar gegen sichtbar

Reine Tastatur- und Semantikarbeit ohne Pixeländerung, kleines Risiko und große Wirkung: B1, B2, B3, B4, B5, B6, B7, B11 (nur der unsichtbare Teil: sr-only-H1 und Sprunglink), B13 (nur die Zweige für Nutzer, die Bewegung reduziert haben), B18 (Lint-Regeln).

Arbeit, die das Aussehen ändert und deshalb eine Gestaltungsentscheidung des Nutzers ist: B10 (Kontrast-Token und Schriftgrößen), B8 (englische Oberfläche in /create), B9 (sichtbarer Text und Vorschläge im leeren Chat), B12 (übersetzte Labels, sichtbar im Tooltip und hörbar in der Ansage), B14 (Meldungstexte), B15 (Platzhaltertexte), B16 (Banner und möglicher Redirect), B17 (Marke und Metadaten). Diese Gruppe steht in W3.

### W1 — Fokus und Semantik ergänzen

**Ziel.** Die vier Optionsgruppen, die vier Aktionsleisten und die drei Hauptansichten werden bedienbar und benannt, ohne dass sich an der Darstellung etwas ändert.

**Normal gesagt.** Vier Radiogruppen im Repo sind so gebaut, dass nur die gerade aktive Option erreichbar ist. Ein Tastaturnutzer kommt in die Gruppe hinein, aber nicht mehr heraus und nicht auf die anderen Werte, weil die Pfeiltasten nichts auslösen. Dieselbe Bauform existiert im Repo schon in korrekter Form; die drei fehlerhaften Stellen bekommen dieselbe Mechanik, dazu die vier Leisten einen sichtbaren Fokuszustand und die Hauptansichten eine unsichtbare Überschrift.

**Einfach gesagt.** Man kann heute mit der Tastatur den Modus nicht wechseln. Danach kann man es, mit denselben Pfeiltasten wie überall sonst.

**Warum.** WCAG 2.1.1 verlangt Bedienbarkeit ohne Zeigegerät, und zwar auf einer Hauptfunktion. Die Vorlage liegt im selben Ordner, das Risiko ist deshalb kalkulierbar: es wird nichts neu erfunden, sondern ein vorhandenes Muster auf drei weitere Stellen übertragen.

1. Neu: src/components/a11y/useRovingRadioGroup.ts — ein Hook, der den Fokusindex hält, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Home und End auswertet und .focus() auf dem Zielknopf ruft. Vorbild ist handleKeyDown in src/components/chat/input/ToolsBadges.tsx:37-47. Er bekommt die Optionen (aktiv, aktivierbar) als Eingabe und liefert Container-Props plus die tabIndex-Regel. Warum ein Hook: vier Gruppen brauchen dieselbe Regel, vier Kopien laufen auseinander.
2. src/components/chat/input/InlineModeSwitch.tsx:92-122 — ModeOptions hängt den Hook an den radiogroup-Container in :97 und bekommt die tabIndex-Regel aus dem Hook. Warum: heute sind die drei inaktiven Modi unerreichbar (tabIndex=-1 in :106, kein onKeyDown in der Datei).
3. src/components/chat/input/ImageParamOptions.tsx:92-110 und :119-137 — zwei getrennte Gruppen, zwei getrennte Hook-Aufrufe. Sonderfall deaktivierte Option: die Schaltflächen tragen disabled (:102, :129). Ein deaktivierter Knopf kann keinen Fokus halten; deshalb setzt der Hook tabIndex=0 nur auf eine Option, die nicht disabled ist, und zwar auf die aktive, sofern sie aktivierbar ist, sonst auf die erste aktivierbare. Ist die ganze Gruppe deaktiviert (Aufrufer src/components/chat/ChatInput.tsx:368 übergibt visualizeControlsDisabled), bleibt kein tabIndex=0 zurück und der radiogroup-Container bekommt aria-disabled="true". Das ist der einzige Fall, in dem die Gruppe nicht mit Tab erreichbar ist.
4. src/components/chat/input/ResearchDepthBadges.tsx:47-77 — derselbe Hook; disabled kommt von src/components/chat/ChatInput.tsx:397 (isLoading || isRecording || isTranscribing) und fällt damit unter dieselbe Sonderregel wie Schritt 3.
5. src/components/chat/MessageBubble.tsx:537, src/components/gallery/GalleryPanel.tsx:144, src/components/layout/AppSidebar.tsx:150, src/app/gallery/page.tsx:84 — je ein md:group-focus-within:*-Zusatz nach dem Muster src/components/chat/input/AttachmentPreviewRow.tsx:66, zusätzlich focus-visible:opacity-100 am jeweiligen Knopf, wie es die Vorlage dort schon tut. Warum: die Leisten sind ohnehin tabbar, der Nutzer landet heute nur auf unsichtbaren Knöpfen.
6. src/components/page/ChatInterface.tsx:205-207 und src/app/create/PlaygroundShell.tsx:852 — je eine sr-only-H1 nach dem Muster src/components/page/LandingView.tsx:104, unsichtbar und ohne Layoutwirkung. Warum: / und /create sind die einzigen Hauptansichten ohne Überschrift, ein Screenreader hat dort keinen Einstiegspunkt.
7. src/components/layout/AppLayout.tsx — ein Sprunglink als erstes fokussierbares Element der Seite, Ziel ist das vorhandene <main> in :193; das Element bekommt eine id und tabIndex=-1. Warum: Mit <main> (:193) gibt es bereits eine Landmarke, an die gesprungen werden kann; alles andere wäre eine zweite Landmarke.
8. eslint.config.mjs:1-10 — die Regeln click-events-have-key-events, no-static-element-interactions und no-noninteractive-tabindex auf "warn" ergänzen. Das Plugin ist über eslint-config-next schon installiert, es kommt keine Abhängigkeit dazu. Warum: Warnungen brechen keinen Build, zeigen aber ab sofort genau die Stellen, die dieser Plan gerade repariert. Die CI-Anbindung gehört zu Strang D und findet hier nicht statt.

**Dauer.** 5 Halbtage.

**Abnahme.** Jede der vier Optionsgruppen lässt sich mit Tab betreten und mit den Pfeiltasten vollständig bedienen, und in jeder Gruppe trägt genau ein Element tabIndex=0.

### W2 — Verhalten für Tastatur und Screenreader

**Ziel.** Escape schließt, was sich öffnen lässt, der Fokus bleibt im geöffneten Fenster und kommt danach zurück, und wichtige Zustandswechsel werden angesagt.

**Normal gesagt.** Drei Stellen im Produkt öffnen eine Fläche über der Seite: Einstellungen, Bildvorschau, Lightbox, dazu die Seitenleiste. Keine davon lässt sich mit Escape schließen, keine hält den Fokus, und keine gibt ihn zurück. Der Chat meldet außerdem nichts, wenn eine Antwort fertig ist oder das Netz weg war.

**Einfach gesagt.** Danach verhält sich jede Überlagerung so wie die mobile Werkzeugschublade, die es im Repo schon richtig macht.

**Warum.** Ein Dialog ohne Fokusführung zwingt Tastaturnutzer durch die ganze Seite, ein Dialog ohne Escape fängt sie dort ein. Beides ist ein Bruch mit dem einzigen Muster, das im Repo funktioniert (src/components/chat/input/UnifiedMobileDrawer.tsx), und deshalb mit wenig Streit behebbar.

1. src/components/ui/popup.tsx:208-238 — role="dialog", aria-modal="true", aria-labelledby auf die Überschrift, tabIndex={-1} am Container, Fokus beim Öffnen, Fokusfalle, Escape, Fokus zurück zum Auslöser. Muster aus src/components/chat/input/UnifiedMobileDrawer.tsx:111 (Fokus setzen), :113 (Escape), :118 (Fokus zurück), :140-155 (Falle), :169-176 (Attribute). Betroffen ist ein Produktionsaufruf: src/components/settings/SettingsPopover.tsx:91. Warum: das ist der einzige Dialog im Produkt, und er ist heute der einzige Ort, an dem der Fokus hinter der Fläche landet.
2. src/app/gallery/page.tsx:323-355 — Escape, role="dialog", aria-label am Schließen-Knopf (:346-351), Fokus beim Öffnen und zurück. Warum: der Knopf ist das einzige Element in dieser Fläche mit einer Bedeutung, und er hat keinen Namen.
3. src/components/chat/MessageBubble.tsx:157-185 — Escape und role="dialog" für die Vollbildvorschau; das aria-label am Schließen-Knopf liegt schon vor (:178). Warum: gleiche Fläche, gleiches Verhalten, sonst zwei Regeln für dasselbe.
4. src/components/layout/AppSidebar.tsx:83-88 — der Backdrop wird ein <button> mit aria-label (Muster src/components/chat/input/UnifiedMobileDrawer.tsx:161-166), das <aside> bekommt ein aria-label, Escape schließt. src/components/layout/AppLayout.tsx:336-344 bekommt aria-label, aria-expanded und aria-controls. Die Frage, ob hier aria-modal gesetzt werden darf, wird in dieser Welle ausdrücklich offen gelassen und im Realitätscheck entschieden. Warum: die Seitenleiste ist auf keinem Pfad als Dialog ausgezeichnet, obwohl sie sich wie einer verhält.
5. src/app/gallery/page.tsx:60-81 und src/components/gallery/GalleryPanel.tsx:130-142 — die Medienfläche wird ein <button type="button"> mit aria-label aus dem Prompt; Stern- und Kopier-Knopf bleiben Geschwister außerhalb. Warum: die Kachel ist heute nur per Maus zu öffnen; ein Knopf innerhalb eines Knopfes wäre ungültiges Markup.
6. Ansagekanal — die vorhandene Live-Region in src/components/ascii/index.tsx:36 wird gespeist, indem die drei Aufrufe ein label übergeben (src/components/ui/PageLoader.tsx:10, src/components/chat/ChatInput.tsx:705, src/components/playground/Gallery.tsx:108), dazu eine kurze Statuszeile im Chat für "Antwort fertig" und "Fehler". Warum: der Kanal existiert, ist getestet (src/components/ascii/ascii.test.tsx:35) und läuft leer.
7. Reduced Motion — MotionConfig um die App plus Wächter an vier Stellen: src/components/chat/MessageBubble.tsx:508-517, src/components/page/about/ScrollReveal.tsx:40-48, src/components/ui/ModeButtonOverlay.tsx:20-30, src/components/ui/OfflineIndicator.tsx:69. Dazu jest.setup.ts:15 so umbauen, dass Tests matches steuern können. Warum: Die ASCII-Effekte frieren bei reduzierter Bewegung bereits auf Frame 0 ein (src/components/ascii/useAsciiFrames.ts:24), die vier genannten Stellen tun das nicht.
8. Fokusführung der vier Optionspanels — nach dem Schließen kehrt der Fokus zum auslösenden Chip zurück; ModeChip trägt aria-expanded und aria-controls schon (src/components/chat/input/InlineModeSwitch.tsx:69-71). Warum: ohne Rückgabe steht der Fokus nach jedem Schließen am Dokumentanfang.

**Dauer.** 4 Halbtage.

**Abnahme.** Escape schließt Einstellungen, Vorschau, Lightbox und Seitenleiste, und nach jedem Schließen steht der Fokus wieder auf dem Element, das die Fläche geöffnet hat.

### W3 — Sprache, Marke und alles Sichtbare

**Ziel.** Eine Sprache, eine Marke, lesbare Schrift und sichtbare Texte an den Stellen, an denen heute nichts steht.

**Normal gesagt.** Die restlichen Befunde dieses Strangs ändern das Aussehen oder den Wortlaut. Dazu gehören zwei Farbwerte, eine Schriftuntergrenze, die englische Sprachinsel in /create, die toten Platzhaltertexte, die 26 englischen Meldungstitel, die vier englischen Beschriftungen, die beiden Bannertexte und die drei Schreibweisen der Marke.

**Einfach gesagt.** Das ist der Teil, bei dem jemand entscheiden muss, wie es aussehen soll; ich kann ihn vorbereiten, aber nicht allein festlegen.

**Warum.** Diese Änderungen sind gleichzeitig wirksam und öffentlich. Kontrast und Schriftgröße betreffen jede Ansicht, Marke und Metadaten landen in Suchmaschinen und in geteilten Links. Deshalb stehen sie in einer eigenen Welle mit Zeitschätzung und ausdrücklicher Freigabe.

1. src/app/globals.css:31 und :100 — neue Fehlerfarbe mit Zielwert 4,5:1 auf dem jeweiligen Hintergrund (:7 hell, :79 dunkel). Rechenvorschlag: dunkel 0 72% 58% ergibt rund 4,5:1 auf :79 (heute 1,97:1), hell 0 84% 52% (heute 2,90:1). Gestaltungsentscheidung.
2. 121 Stellen mit text-[9px] bis text-[10.5px] — Vorschlag einer Untergrenze von 11px, beginnend in den Galerie- und Chat-Dateien. Gestaltungsentscheidung.
3. Sprachschicht für /create (B8) — t()-Aufrufe in src/components/playground/PromptBar.tsx, src/components/playground/MetaRail.tsx und src/components/playground/Gallery.tsx plus Schlüssel in src/config/translations.ts. Der Fallback in src/config/translations.ts:549-553 fällt auf Deutsch zurück, ein vergessener Schlüssel fällt also als deutscher Satz auf und nicht als Absturz.
4. Leerer Chat (B9) — Text und drei Vorschläge in src/components/page/ChatInterface.tsx:205-207, dazu die toten Sätze aus src/config/translations.ts:7 und :91-92 verwenden. Damit ist B15 im Chat gelöst.
5. Platzhalterreihenfolge (B15) — entscheiden, ob src/config/translations.ts:6 (chat.placeholder) der live genutzte Standardsatz wird oder aus dem Schlüsselraum entfernt wird; die Datei führt an dieser Stelle zwei Generationen von Text.
6. Meldungstitel (B14) — die belegten Aufrufe in src/hooks/useUnifiedImageToolState.ts:250,254,282,353,429, src/lib/chat/chat-send-coordinator.ts:286,299,318,440 und src/components/ChatProvider.tsx:547,590,593,607 auf Schlüssel umstellen.
7. Englische Beschriftungen (B12) — src/components/ThemeToggle.tsx:17 und :22, src/components/LanguageToggle.tsx:43, src/components/layout/AppSidebar.tsx:96, src/components/gallery/GalleryPanel.tsx:147.
8. Reduced-Rest (B13) — alle verbliebenen Animationen prüfen, die nach W2 noch ungeprüft sind (rg auf animate- und motion-). Warum erst hier: die Wächter in W2 decken die belegten drei Dateien ab, der Rest zeigt sich erst nach dem Einbau des MotionConfig.
9. Marke (B17) — src/app/layout.tsx:11-12 und src/app/create/page.tsx:6 auf eine Schreibweise und die Meta-Description vom Artefakt befreien.
10. Sackgassen (B16) — Banner in src/app/gallery/page.tsx:212-214 übersetzen oder Route auflösen; Entscheidung siehe offene Fragen.
11. Lint-Eskalation (B18) — die in W1 auf "warn" gesetzten Regeln auf "error" heben, sobald die belegten Stellen bereinigt sind. Eine Testebene mit jest-axe bedarf einer neuen Entwicklungsabhängigkeit und damit einer eigenen Freigabe.

**Dauer.** 6 Halbtage.

**Abnahme.** Ein Sprachwechsel ändert sichtbaren Text und angesagte Beschriftungen auch in /create, Fehlertext erreicht 4,5:1 auf dem Hintergrund, und die Titel in src/app/layout.tsx:11 und src/app/create/page.tsx:6 nennen dieselbe Marke.

## Realitätscheck

**Bestehende Verträge und Haken, die der Plan berührt.**

*useChatInputLogic / ToolMode* — W1 ändert nur das Verhalten beim Fokus und bei Tastendrücken. Die Zustandsform bleibt unverändert, onSelectMode wird weiterhin genau einmal pro Auswahl gerufen.

*useUnifiedImageToolState* — src/components/chat/input/ImageParamOptions.tsx behält seine Eigenschaften (selectedModelId, formFields, onFieldChange, setFormFields, isPollenModel, disabled, onAfterSelect), der Aufruf in src/components/chat/ChatInput.tsx:361-371 wird nicht angefasst. Der Plan verändert keine Feldlogik und keine Aspect-Ratio-Umrechnung (src/components/chat/input/ImageParamOptions.tsx:71-81 bleibt wie sie ist).

*UnifiedMobileDrawer* — Fokusfalle, Escape und Fokus-Rückgabe in src/components/chat/input/UnifiedMobileDrawer.tsx:108-155 sind funktionierend und werden kopiert, nicht verändert. Achtung an einer Stelle: die Falle in :140-155 sucht die fokussierbaren Elemente im Drawer. Wenn in einer Radiogruppe im Fehlerfall kein Element mehr tabIndex=0 trägt, verliert die Falle ein Element; die erste und die letzte Position kann das in einem Randfall verschieben. Deshalb prüft der Test in W1 ausdrücklich, dass jede Gruppe genau ein Element mit tabIndex=0 behält, sobald sie nicht vollständig deaktiviert ist.

*ToolsBadges als Vorbild* — die Vorlage wird produktiv genutzt (src/components/chat/ChatInput.tsx:769 als modeContent des mobilen Drawers) und in src/components/chat/ChatInput.test.tsx:52 als null gemockt. Tests, die die Pfeiltasten prüfen, dürfen deshalb nicht durch diese Mock-Ebene laufen.

*ModalPopup* — vier Testdateien ersetzen das Bauteil durch eigene Mocks (src/app/create/PlaygroundShell.test.tsx:49, src/app/create/create.e2e.test.tsx:47, src/components/settings/SettingsPopover.test.tsx:29, src/components/chat/input/ModelSelector.test.tsx:25). Änderungen an src/components/ui/popup.tsx sind für diese Tests unsichtbar; die neue Semantik braucht einen eigenen Test am echten Bauteil.

*AppLayout* — das <main> existiert bereits (src/components/layout/AppLayout.tsx:193) und trägt einen Scrollbereich. Der Sprunglink zeigt auf dieses Element; ein zweites main würde die Landmarkenauszeichnung doppelt vergeben.

*AppSidebar ist ein Bauteil für alle Breiten* — src/components/layout/AppSidebar.tsx:79 rendert nichts, wenn die Seitenleiste zu ist; ist sie offen, liegt über der Seite immer der Backdrop (:83-86) und darüber das feste Panel (:88). Auf dem Desktop ist der Zustand aus src/components/layout/AppLayout.tsx:97 gespeichert und damit dauerhaft offen. aria-modal auf einem dauerhaft offenen Panel wäre falsche Semantik. Deshalb in W2 nur Namensgebung und Escape, keine Modalrolle, solange die Entscheidung nicht gefallen ist.

*AsciiSpinner als Ansagekanal* — src/components/ascii/index.tsx:36 ist eine vollwertige Live-Region. Sie zu speisen und gleichzeitig den Chatverlauf als role="log" auszuzeichnen, erzeugt doppelte Ansagen. Es wird genau einer der beiden Wege gebaut.

*getTranslation* — src/config/translations.ts:549-553 fällt auf Deutsch zurück und danach auf den Schlüssel selbst. Neue Schlüssel sind damit harmlos, fehlende englische Werte fallen als deutscher Satz auf.

**Was ist die einfachere Variante?**

Statt den Chatverlauf in src/components/chat/ChatView.tsx:112-121 als role="log" mit aria-live auszuzeichnen, wird der eine vorhandene Kanal in src/components/ascii/index.tsx:36 gespeist. Grund: die Liste ist virtualisiert. Beim Scrollen werden Einträge ein- und ausgehängt, eine Live-Region an dieser Stelle kann alte Nachrichten mehrfach ansagen. Eine Statuszeile, die nur Zustandswechsel meldet, ist kleiner und vorhersagbar.

Für die Dialog-Semantik in src/components/ui/popup.tsx gibt es zwei ehrliche Wege. Der erste kopiert das Muster aus src/components/chat/input/UnifiedMobileDrawer.tsx:108-176 und braucht kein Paket. Der zweite nimmt @radix-ui/react-dialog als direkte Abhängigkeit auf; das Paket liegt bereits im Baum, aber nur als Zutat von react-alert-dialog (node_modules/@radix-ui/react-alert-dialog/package.json:17) und ist in package.json nicht deklariert. Der erste Weg ist der kleinere, weil das Muster im Repo schon getestet ist.

Für die Radiogruppen wäre die kleinste Variante, in jeder Datei eine eigene handleKeyDown-Funktion einzuhängen, genau wie in src/components/chat/input/ToolsBadges.tsx:37-47. Der Hook ist trotzdem die kleinere Last, weil die Sonderregel für deaktivierte Optionen sonst in drei Dateien gepflegt wird.

**Welche Entscheidung ist eine Einbahnstraße?**

Die Marken- und Metadatenfrage (src/app/layout.tsx:11-12, src/app/create/page.tsx:6). Titel und Beschreibung landen in Suchmaschinen und in geteilten Links; was dort einmal steht, lässt sich nicht zurückholen.

Ein möglicher Redirect für die beiden verlinkungsfreien Routen. Lesezeichen und geteilte Adressen auf /gallery und /settings brechen in dem Moment still.

Die neue Entwicklungsabhängigkeit für eine Testebene (jest-axe) und die Lint-Eskalation auf "error". Beides verändert, was in diesem Repo als grün gilt, und braucht deshalb Freigabe.

**Wo lauert Verschlimmbesserung?**

Bei B3: die Kachel wird ein Knopf, und in der Kachel steht bereits ein Stern-Knopf (src/app/gallery/page.tsx:55-59, src/components/gallery/GalleryPanel.tsx:145-149). Ein Knopf im Knopf ist ungültiges Markup und wird von Screenreadern falsch vorgelesen. Die Medienfläche wird deshalb der Knopf, die Aktionsknöpfe bleiben daneben.

Bei B1: ein Element mit disabled kann keinen Fokus halten. Trägt ausgerechnet die aktive Option disabled (src/components/chat/input/ImageParamOptions.tsx:102 und :129), wird die Gruppe ohne Zusatzregel unerreichbar. Die Sonderregel in W1, Schritt 3 ist genau dafür da.

Bei B13: Ein globales MotionConfig darf die ASCII-Signatur nicht abschalten. Sie unterscheidet die Modi unabhängig von der Farbe (src/components/chat/input/InlineModeSwitch.tsx:117, src/components/ascii/useAsciiFrames.ts:24 friert auf Frame 0 ein). Wer hier pauschal alle Animationen entfernt, nimmt die Unterscheidung weg.

Bei B7: eine Live-Region im Chat, die jeden Token meldet, macht den Chat unbenutzbar. Angesagt werden Zustandswechsel, nicht Inhalte.

Bei B11: der Sprunglink darf die kopfstehende Leiste (src/components/layout/AppLayout.tsx:163-176, position fixed) nicht über dem Ziel landen lassen, sonst springt der Nutzer in eine verdeckte Zeile.

Bei B6: aria-modal auf einem Panel, das auf dem Desktop dauerhaft offen ist, erklärt die halbe Seite für nicht vorhanden. Diese Rolle wird nur gesetzt, wenn der Zustand tatsächlich modal ist.

## Verifikation

**Kommandos.** Wegen der Maschinengrenze (MacBook Air M2, 8 GB) laufen alle Testläufe einzeln und mit --runInBand.

- npm run typecheck
- npm run lint
- npx jest --runInBand
- npx jest --runInBand src/components/chat/input
- npx jest --runInBand src/components/chat/ChatInput.test.tsx
- npx jest --runInBand src/components/gallery
- npx jest --runInBand src/components/layout
- npx jest --runInBand src/components/ui/popup.test.tsx

**Neue Testdateien.**

- src/components/a11y/useRovingRadioGroup.test.ts — Pfeiltasten bewegen den Fokus und laufen am Rand um, Home und End springen an die Enden, deaktivierte Optionen werden übersprungen, genau ein Element trägt tabIndex=0.
- src/components/chat/input/InlineModeSwitch.test.tsx — vier Optionen, Fokus wandert mit ArrowRight, Auswahl erfolgt über Klick und über Tastatur, die aktive Option trägt tabIndex=0.
- src/components/chat/input/ImageParamOptions.test.tsx — zwei unabhängige Gruppen; Pfeiltasten in der Verhältnisgruppe erreichen die Dauergruppe nicht; ist disabled gesetzt, trägt kein Knopf tabIndex=0 und der Container aria-disabled="true".
- src/components/chat/input/ResearchDepthBadges.test.tsx (bestehende Datei erweitern) — Pfeiltasten wechseln die Tiefe, disabled verhält sich wie in ImageParamOptions.
- src/components/ui/popup.test.tsx — role="dialog", aria-modal, Fokus liegt beim Öffnen im Dialog, Escape ruft onClose, Tab verlässt den Dialog nicht, der Fokus kehrt zum Auslöser zurück.
- src/components/layout/AppSidebar.test.tsx — Escape schließt, der Auslöser trägt aria-label, aria-expanded und aria-controls, der Backdrop ist ein Knopf mit Namen, das Panel trägt ein Label.
- src/components/chat/MessageBubble.test.tsx — die Vorschau ist ein Dialog, Escape schließt sie, der Fokus kehrt zurück; die Aktionsleiste wird bei Fokus sichtbar (group-focus-within).
- src/components/gallery/GalleryPanel.test.tsx (bestehende Datei erweitern) — die Medienfläche ist per Tab erreichbar und öffnet mit Enter; der Stern-Knopf bleibt ein eigener Fokuspunkt; kein Knopf liegt in einem Knopf.

**Manuelle Prüfschritte.** In dieser Reihenfolge, mit laufendem Dev-Server nur während der Prüfung.

1. npm run dev starten, in der Eingabeleiste viermal Tab drücken: Modus, Modell, Parameter, Upload; in jeder Gruppe mit den Pfeiltasten durchschalten und auswählen.
2. Seitenverhältnis und Dauer auf ein Videomodell stellen (Pruna) und dieselbe Prüfung wiederholen, einmal mit gesperrten Bedienelementen.
3. In der Seitenleiste mit Tab auf eine der vier Aktionsleisten fahren: die Leiste muss beim Fokussieren sichtbar werden.
4. Einstellungen öffnen, dreimal Tab drücken, Escape drücken: der Fokus muss auf dem Zahnrad landen.
5. Galerie-Kachel mit Tab erreichen, Enter drücken, Escape drücken: die Lightbox schließt, der Fokus kehrt zur Kachel zurück.
6. VoiceOver einschalten und den Chat einmal neu laden und einmal eine Antwort abwarten: der Denkzustand, das Ende der Antwort und der Offline-Fall müssen hörbar sein, und jeder Satz darf nur einmal kommen.
7. In den macOS-Systemeinstellungen Bewegung reduzieren einschalten und die vier Stellen aus W2, Schritt 7 ansehen.
8. Kontrast nachmessen (4,5:1 für Text, 3:1 für große Schrift) und die Werte in src/app/globals.css notieren.
9. Dev-Server danach beenden und die Terminalsitzung schließen.

## Nicht in diesem Plan

- Zustand, Daten und Speicher (Strang A): Blob-Freigabe, Persistenz-Effect, stille Löschung des 51. Chats, Fehlzuordnung des Musikfehlers.
- API, Routen und Antwortverträge (Strang C): Rate-Limiter, blockierender 180-Sekunden-Pfad, Textendpunkt, stiller Modelltausch, 502 ohne Grund.
- CI und Nachweis (Strang D): CI-Workflowdateien, Testbasis, A11y-Gate. Discoverability und Metadaten (robots.txt, sitemap, llms.txt, OpenAPI, MCP) gehören zu Strang C.
- Der Abbruch eines laufenden Auftrags (Audit 2.5), das Lauf-Journal und die Rezeptdatei. Alle drei berühren Zustand und Speicher und nicht die Oberfläche.
- Kein neues Design: keine neuen Icons, keine Farbpalette außer den zwei Fehlerwerten aus W3, kein Layoutumbau außer dem Sprunglink.
- Keine Browser-Automatisierung und keine Bildschirmfotos zur Prüfung; beides ist per AGENTS.md ausgeschlossen.
- Keine Änderung an src/components/ascii/index.tsx über die Speisung des vorhandenen label hinaus.

## Offene Fragen an den Nutzer

1. Marke: welche Schreibweise gilt ab jetzt? Vorschlag ist hey.hi in Kleinbuchstaben, womit src/app/layout.tsx:11, src/app/create/page.tsx:6 und die Meta-Description in :12 auf einen Stand kommen. Diese Entscheidung ist die einzige in diesem Plan, die Suchmaschinen und geteilte Links betrifft.
2. Gestaltung: nimmst du den Rechenvorschlag für den Fehlerkontrast (dunkel 0 72% 58%, hell 0 84% 52%) und eine Schriftuntergrenze von 11px an den 121 Kleintextstellen? Beides zusammen verändert jede Ansicht und ist deshalb deine Entscheidung, nicht meine.
3. Sackgassen: /gallery und /settings per Redirect auflösen oder als eigenständige Seiten behalten und nur übersetzen? Ein Redirect ist eine Einbahnstraße für bestehende Lesezeichen.

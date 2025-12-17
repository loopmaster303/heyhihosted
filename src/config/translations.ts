export type Language = 'de' | 'en';

export const translations = {
        de: {
                // Chat Interface
                'chat.placeholder': 'Du kannst mit der Maschine alles diskutieren, sie im Web suchen lassen, Dateien analysieren oder eine Idee visualisieren',
                'chat.noHistory': 'Noch keine Historie.',
                'chat.searchPlaceholder': 'Gespräche durchsuchen...',
                'chat.webBrowsingEnabled': 'Web-Browsing Aktiviert (Gemini Search)',
                'chat.webBrowsingDisabled': 'Web-Browsing Deaktiviert',
                'models.capability.vision': 'Vision',
                'models.capability.web': 'Websuche',
                'chat.usingGptOss': 'Verwende GPT-OSS-120B für Web-Browsing-Funktionen.',
                'imageGen.placeholder': 'Beschreibe in natürlicher Sprache was du dir vorstellst (oder was du an einem Referenzbild ändern möchtest)...',
                'imageGen.placeholderLite': 'Beschreibe was du dir vorstellst... (Pollinations AI für schnelle Bildgenerierung)',
                'imageGen.placeholderDefault': 'Beschreibe was du dir vorstellst...',
                'imageGen.placeholder.gptImage': 'Beschreib deine Idee – vielseitig, schnell, gut für Drafts, Skizzen, Comics, Manga und fotorealistische Experimente.',
                'imageGen.placeholder.seedream': 'Schreib deine Szene – solide Qualität, sehr gut für Content Creation und Alltagsbilder.',
                'imageGen.placeholder.seedreamPro': 'Schreib, was du sehen willst – hochwertig, sauber und perfekt für Social Media Content.',
                'imageGen.placeholder.nanobanana': 'Motiv + Stil kurz beschreiben – schnell, klar, natürliche Ergebnisse ohne viel Prompting.',
                'imageGen.placeholder.nanobananaPro': 'Detaillierte Szene beschreiben – moderne multimodale Bildqualität, sehr realistische Looks und präzise Kontrolle.',
                'imageGen.placeholder.fluxKontextPro': 'Komplexe Szene mit Details beschreiben – sehr gute Bildqualität, stark im Kontextverstehen, realistische Bildästhetik.',
                'imageGen.placeholder.zImageTurbo': 'Idee eingeben – extrem starke Porträts, schnell, kosteneffizient und realistisch.',
                'imageGen.placeholder.flux2Pro': 'Mehrere Referenzbilder hochladen + beschreiben, wie sie kombiniert werden sollen – starke Ergebnisse bei kreativen Bildmischungen.',
                'imageGen.placeholder.qwenImageEditPlus': 'Bild hochladen + präzise Anpassungen beschreiben – extrem genau bei Text, Details, Posen und kontrollierten Änderungen.',
                'imageGen.placeholder.seedancePro': 'Bild hochladen + Bewegung beschreiben – erzeugt flüssige Animationen aus Standbildern.',
                'imageGen.placeholder.veo': 'Bild + filmische Anweisung – erzeugt hochwertige Clips mit schönem Look.',
                'imageGen.placeholder.wanT2V': 'Szene als Text beschreiben – erstellt direkt ein Video ohne Bildvorlage.',
                'imageGen.placeholder.wanI2V': 'Bild hochladen + sagen, wie es sich bewegen soll – realistische Animationen aus Fotos.',
                'imageGen.placeholder.veoFast': 'Bild + kurze Szene beschreiben – beeindruckende Videoqualität mit Mehrsprachen-Audio.',
                'imageGen.outputPlaceholder': 'Generierte Inhalte erscheinen hier',
                'imageGen.configure': 'Konfigurieren',
                'imageGen.addImages': '+ Bilder',
                'imageGen.modal.title': 'Konfiguration',
                'imageGen.modal.close': 'Schließen',
                'imageGen.aspectRatioLabel': 'Seitenverhältnis / Größe',
                'modelSelect.title': 'Modelauswahl',
                'modelSelect.textImage': 'Text / Bild → Bild',
                'modelSelect.textToImage': 'Text → Bild',
                'modelSelect.textMultiImage': 'Text + Multi-Bild → Bild',
                'modelSelect.imageEdit': 'Bild → Bild (Edit / I2I)',
                'modelSelect.textImageVideo': 'Text + Bild → Video',
                'prompt.ideogramCharacter': 'Ein Portrait einer Frau in einem Mode-Magazin... (Ideogram erstellt konsistente Charaktere mit Referenzbild)',


                'prompt.fluxKreaDev': 'Ein kinematografischer Foto eines Roboters in einem Blumenfeld... (FLUX für schnelle, hochwertige Bildgenerierung)',

                'prompt.wan22Image': 'Ein kinematografischer Shot einer futuristischen Stadt... (WAN 2.2 für schöne 2-Megapixel Bilder in 3-4 Sekunden)',
                'prompt.qwenImageEdit': 'Mache den Himmel blau, füge eine Katze auf dem Dach hinzu... (Beschreibe die Änderungen die du am Bild vornehmen möchtest)',
                'prompt.qwenImage': 'Eine wunderschöne Landschaft mit Bergen und See... (Qwen für realistische Bildgenerierung)',
                'prompt.nanoBanana': 'Mache die Bettwäsche im Stil des Logos. Mache die Szene natürlich... (Google Nano Banana für Multi-Image-Fusion und Charakter-Konsistenz)',
                'prompt.imagen4Ultra': 'Ein lebendiges Korallenriff voller Leben... (Google\'s beste KI für fotorealistische und künstlerische Stile)',
                'prompt.fluxKontextPro': 'Beschreibe dein Bild oder die Modifikationen... (Professionelle Bildgenerierung mit Kontextverständnis)',
                'prompt.runwayGen4': 'Ein Portrait von @frau... (Verwende @tags um Referenzbilder zu nutzen)',
                'prompt.wanVideo': 'Goldene Stunde, weiches Licht, warme Farben... (Beschreibe den Stil für dein Video)',
                'imageGen.gallery': 'Galerie',
                'imageGen.selectModel': 'Modell Auswahl',
                'imageGen.execute': 'Start',
                'imageGen.configuration': 'Konfigurationen',
                'imageGen.history': 'Galerie',
                'imageGen.clearHistory': 'Galerie löschen',
                'imageGen.close': 'Schließen',
                'imageGen.noImages': 'Keine Bilder generiert bisher.',
                'imageGen.aspectRatio': 'Seitenverhältnis',
                'field.renderingSpeed': 'Qualität',
                'field.styleType': 'Stil',
                'field.magicPrompt': 'Automatische Prompt Verbesserung',
                'field.juiced': 'Model Specific Enhance',
                'field.outputQuality': 'Quality',
                'field.referenceImages': 'Referenzbilder',
                'field.referenceTags': 'Referenz-Tags',
                'chat.send': 'Senden',
                'chat.thinking': 'Die Maschine denkt nach...',
                'chat.recording': 'Aufnahme läuft...',
                'chat.transcribing': 'Transkribiere...',
                'chat.voice': 'Sprache',
                'chat.image': 'Bild',
                'chat.document': 'Dokument',
                'chat.camera': 'Kamera',
                'chat.loadOlder': 'Ältere Nachrichten laden',
                'chat.showingMessages': 'Zeige {count} von {total} Nachrichten',

                // Navigation & Headers
                'nav.conversations': 'Konversationen',
                'nav.configurations': 'Einstellungen',
                'nav.newConversation': 'Neues Gespräch',
                'nav.about': 'Über',
                'nav.chat': 'Chat',
                'nav.reasoning': 'Code Reasoning',
                'nav.imageGen': 'Bildgenerierung',
                'nav.settings': 'Einstellungen',
                'nav.newInteraction': 'Neue Interaktion',
                'nav.history': 'Konversationen',
                'nav.gallery': 'Galerie',
                'nav.personalization': 'Personalisierung',
                'nav.language': 'Sprache',
                'nav.theme': 'App Design',

                // Settings & Configuration
                'settings.language': 'Sprache',
                'settings.aiModelText': 'KI Modell (Text)',
                'settings.aiModelImage': 'KI Modell (Bildgenerierung)',
                'settings.responseStyle': 'Sprach Stil',
                'settings.voice': 'Stimme',
                'responseStyle.basic': 'Standard Assistent',
                'responseStyle.precise': 'Präzise',
                'responseStyle.deepdive': 'Tiefergehende Assistenz',
                'responseStyle.emotionalsupport': 'Emotionaler Support',
                'responseStyle.philosophical': 'Philosophisch',
                'responseStyle.usersdefault': 'Benutzerdefiniert',
                'settings.theme': 'Theme',
                'settings.model': 'Modell',
                'settings.style': 'Antwortstil',
                'settings.imageModel': 'Bildmodell',

                // Response Style Labels and Descriptions
                'responseStyle.precise.label': 'Präzise...',
                'responseStyle.precise.description': 'Kurz und prägnant',
                'responseStyle.basic.label': 'Standard Assistent',
                'responseStyle.basic.description': 'Hilfsbereit und direkt',
                'responseStyle.deepdive.label': 'Tiefergehende Assistenz',
                'responseStyle.deepdive.description': 'Detailliert und ausführlich',
                'responseStyle.emotionalsupport.label': 'Emotionaler Support',
                'responseStyle.emotionalsupport.description': 'Einfühlsam und unterstützend',
                'responseStyle.philosophical.label': 'Philosophisch',
                'responseStyle.philosophical.description': 'Nachdenklich und reflektierend',
                'responseStyle.usersdefault.label': 'Benutzerdefiniert',
                'responseStyle.usersdefault.description': 'Ihr eigener Stil',

                // Settings Page Specific
                'settings.howShouldMachineAddress': 'Wie soll die Maschine dich ansprechen?',
                'settings.nameDescription': 'Der Name, mit dem die KI dich ansprechen soll',
                'settings.responseStyleQuestion': 'In welchem Stil und mit welchen Anweisungen soll die Sprach KI (LLM Modell) sich mit dir austauschen?!',
                'settings.responseStyleDescription': 'Response Style / Antwortstil',
                'settings.aiInstructions': 'Anweisung an die KI',
                'settings.aiInstructionsDescription1': 'Das ist die Anweisung an die KI, wie sie sich verhalten soll',
                'settings.aiInstructionsDescription2': 'Zeigt den aktuell gewählten Stil als Beispiel',
                'settings.aiInstructionsDescription3': 'Klicke zum Bearbeiten (überschreibt dann den Stil)',
                'settings.aiInstructionsDescription4': 'Verwende {userDisplayName} für den Benutzernamen',
                'settings.namePlaceholder': 'z.B. john, Captain, Chef...',
                'settings.stylePlaceholder': 'Wähle einen Stil',
                'settings.aiPromptPlaceholder': 'Du bist ein hilfreicher Assistent...',

                // Educational Headers & Explanations
                'settings.llmHeader': "Das 'Gehirn' hinter der Maschine (KI/LLM Modell)",
                'settings.ttsHeader': 'Stimme im Voice- Mode (TTS Optionen)',
                'settings.imageHeader': 'Diese Modelle können deine Gedanken und Worte visualieren (Bild/Video-Modelle)',

                'explain.llm.title': 'Was ist ein LLM?',
                'explain.llm.description': 'Ein "Large Language Model" (LLM) ist wie ein extrem belesenes, künstliches Gehirn. Es hat Milliarden von Texten gelesen und gelernt, wie Menschen sprechen, denken und Probleme lösen. Je nachdem, welches Modell du wählst, ist es eher kreativ, präzise, schnell oder extrem schlau (aber langsamer).',
                'explain.tts.title': 'Was ist TTS (Text-to-Speech)?',
                'explain.tts.description': 'TTS verwandelt den geschriebenen Text der KI in gesprochene Sprache. Die hier gelisteten "Stimmen" sind hochentwickelte, neuronale Stimmen, die fast wie echte Menschen klingen. Sie können Emotionen und Nuancen ausdrücken.',
                'explain.imageModel.title': 'Was sind Bild/Video-Modelle?',
                'explain.imageModel.description': 'Diese Modelle sind "Künstler-KIs". Sie verstehen deine Worte und malen, zeichnen oder generieren daraus Pixel für Pixel komplett neue Bilder oder Videos, die es so vorher nie gab. Sie "suchen" keine Bilder, sie erschaffen sie.',
                'explain.modelDetails': 'Details zum gewählten Modell:',
                'personalization.title': 'Persönliche Einstellungen',
                'personalization.subtitle': 'Personalisiere deine KI-Erfahrung.',
                'tips.title': 'Tipps für bessere System Prompts',
                'tips.clear': 'Verwende klare, befehlende Sprache ("Du bist...", "Immer...").',
                'tips.format': 'Definiere das Ausgabeformat (Markdown, nur Code, JSON).',
                'tips.constraints': 'Setze Grenzen ("Entschuldige dich nicht", "Antworte unter 50 Wörtern").',
                'tips.examples': 'Gib Beispiele für das gewünschte Verhalten.',
                'label.selectModel': 'Wähle ein Modell',
                'label.selectStyle': 'Wähle einen Stil',
                'label.selectVoice': 'Wähle eine Stimme',

                // Common Actions
                'action.copy': 'Kopieren',
                'action.regenerate': 'Neu generieren',
                'action.generate': 'Generieren',
                'action.enhancePrompt': 'Prompt verbessern',
                'action.delete': 'Löschen',
                'action.edit': 'Bearbeiten',
                'action.save': 'Speichern',
                'action.cancel': 'Abbrechen',
                'action.confirm': 'Bestätigen',
                'action.play': 'Abspielen',
                'action.pause': 'Pausieren',
                'action.stop': 'Stoppen',

                // Messages & Feedback
                'message.loading': 'Lade...',
                'message.generating': 'Generierung läuft...',
                'message.error': 'Fehler',
                'message.success': 'Erfolgreich',
                'message.copied': 'Kopiert!',
                'message.deleted': 'Gelöscht!',

                // Tool Descriptions
                'tool.chat.description': 'Sprich hier mit der Maschine wie mit einem echten Menschen',
                'tool.reasoning.description': 'Hilfe bei komplexen Themen mit strukturierten Erklärungen',
                'tool.imageGen.description': 'Erstelle Bilder aus Textbeschreibungen',

                // Image Generation Fields
                'field.aspectRatio': 'Seitenverhältnis',
                'field.seed': 'Seed',
                'field.numOutputs': 'Anzahl der zu generierenden Bilder',
                'field.outputFormat': 'Ausgabeformat',
                'field.disableSafetyChecker': 'Safety Checker',
                'field.enhancePrompt': 'Automatische Prompt Verbesserung',
                'field.strength': 'Referenzbild Einfluss',
                'field.megapixels': 'Megapixel',
                'field.negativePrompt': 'Negativer Prompt',
                'field.quality': 'Qualität',
                'field.safetyFilterLevel': 'Safety Filter Level',
                'field.safetyTolerance': 'Safety Tolerance',
                'field.resolution': 'Auflösung',
                'imageGen.dragDropImages': 'Bilder hier hineinziehen oder klicken zum Auswählen',
                'imageGen.selectImages': 'Bilder auswählen',
                'imageGen.tagForImage': 'Tag für dieses Bild',
                'imageGen.useInPrompt': 'Verwende @',
                'imageGen.inYourPrompt': 'in deinem Prompt',
                'imageGen.usageExample': 'Verwendungsbeispiel',
                'imageGen.examplePrompt': 'Ein Portrait von @',
                'imageGen.inStyle': 'im Stil von @',
                'imageGen.generationError': 'Generierungsfehler',
                'imageGen.viewFullImage': 'Vollbild anzeigen',
                'imageGen.width': 'Breite',
                'imageGen.height': 'Höhe',
                'imageGen.batchSize': 'Anzahl Bilder',
                'imageGen.random': 'Zufällig',
                'imageGen.private': 'Privat',
                'imageGen.upsample': 'Hochskalieren',
                'field.goFast': 'Schnellmodus',
                'field.numFrames': 'Anzahl Bilder',
                'field.framesPerSecond': 'Bilder pro Sekunde',
                'field.sampleSteps': 'Qualität (Schritte)',
                'field.sampleShift': 'Bewegung (Shift)',

                // Homepage
                'home.title': 'hey.hi = space',
                'home.subtitle': 'Sag: Hey, hi, was geht oder los, mach mir einen Tagesplan! Künstliche Intelligenz ist ein Werkzeug, das dir in natürlicher Sprache fast alles erklären, zeigen und beim Umsetzen helfen kann. Im Hey Hi Space – komplett ohne Grenzen und für alle.',
                'tool.chat.hoverDescription': 'Sprich hier mit der Maschine wie mit einem echten Menschen, wie einem Freund zum Beispiel.\nFrag alles, bekomme Hilfe oder führe einfach ein normales Gespräch—keine besonderen Regeln. Mit Kontext-Unterstützung für bessere Gespräche.',
                'tool.reasoning.hoverDescription': 'Bekomme Hilfe bei komplexen Themen. Die KI liefert strukturierte Erklärungen, Code-Beispiele und logische Aufschlüsselungen in einem sauberen, lesbaren Format.',
                'tool.imageLite.hoverDescription': 'Tippe deine Idee in natürlicher Sprache und bekomme sofort eine einfache Visualisierung—Pollinations AI für schnelle Bildgenerierung mit Kontext-Unterstützung.',
                'tool.imageRaw.hoverDescription': 'Beschreibe deine Idee in natürlicher Sprache, modifiziere jedes Detail mit Experten-Einstellungen und erstelle Bilder mit Next-Gen, State-of-the-Art Modellen.',
                'tool.settings.hoverDescription': 'Personalisieren Sie, wie sich die Maschine verhält—setzen Sie Ihren Benutzernamen, passen Sie Antworten, Sprache, Stil und mehr an, um zu Ihrem Vibe zu passen.',
                'tool.about.hoverDescription': 'Erfahren Sie mehr über das Projekt, seine Komponenten und die Philosophie dahinter.',
                'home.mode.chat': 'Chatten',
                'home.mode.visualize': 'Visualisieren',
                'home.placeholder.chat': 'Worüber möchtest du sprechen?',
                'home.placeholder.image': 'Was möchtest du erschaffen? Beschreibe dein Bild...',
                'home.letsGo': 'Los geht\'s',

                // Tool Tiles
                'tool.chat.tag': '</chat.talk.discuss>',
                'tool.chat.hoverTitle': 'chat.talk.discuss',
                'tool.chat.importText': 'import [Sprache, Text]',
                'tool.chat.exportText': 'export [Unterstützung, Hilfe in natürlicher Sprache]',

                'tool.reasoning.tag': '</code.reasoning>',
                'tool.reasoning.hoverTitle': 'code.reasoning',
                'tool.reasoning.importText': 'import [komplexe Anfragen, Code, Text]',
                'tool.reasoning.exportText': 'export [Code, deine Website, mathematisch korrekte Lösungen]',

                'tool.imageGen.tag': '</generate.multimedia.output>',
                'tool.imageGen.hoverTitle': 'generate.multimedia.output',
                'tool.imageGen.importText': 'import [einfacher Text, Referenzbilder, Konfigurationsoptionen]',
                'tool.imageGen.exportText': 'export [kreative Ergebnisse, fotorealistische Visualisierung]',
                'tool.imageGen.hoverDescription': 'Erstelle oder transformiere Bilder und Videos via Text und Referenz-Input.\nWähle zwischen AI Beginner Lite-Version oder Expert-Modellen mit erweiterten Optionen.',

                'tool.settings.tag': '</settings.user.preferences>',
                'tool.settings.hoverTitle': 'settings.user.preferences',
                'tool.settings.importText': 'import [deine Präferenzen = dein Tool]',
                'tool.settings.exportText': 'export [personalisiertes Verhalten, maßgeschneiderte Erfahrung]',

                'tool.about.tag': '</about.system.readme>',
                'tool.about.hoverTitle': 'about.system.readme',
                'tool.about.importText': 'import [Neugier, Interesse]',
                'tool.about.exportText': 'export [Transparenz, Kontext, Verständnis]',

                'nonogram.instructions': 'Klick -> gefüllt -> markiert -> leer',
                'nonogram.reset': 'Zurücksetzen',
                'nonogram.hintEmpty': '0',
                'nonogram.mode.title': 'Modus wählen',
                'nonogram.mode.levels': 'Levels',
                'nonogram.mode.freestyle': 'Freies Pixeln',
                'nonogram.mode.builder': 'Eigenes Puzzle',
                'nonogram.levels.description': 'Wähle ein Motiv und fülle das Raster – ganz ohne Werbung.',
                'nonogram.status.solved': 'Geschafft! 🎉',
                'nonogram.status.keepGoing': 'Noch nicht ganz – weiter pixeln!',
                'nonogram.freestyle.description': 'Freies Zeichnen ohne Ziel. Alles bleibt lokal auf deinem Gerät.',
                'nonogram.freestyle.instructions': 'Klick wechselt zwischen gefüllt → markiert → leer.',
                'nonogram.freestyle.reset': 'Fläche leeren',
                'nonogram.builder.description': 'Baue dein eigenes Rätsel und verwandle es mit einem Klick in ein spielbares Level.',
                'nonogram.builder.instructions': 'Zeichne deine Lösung. Danach auf „Als Puzzle spielen“ klicken.',
                'nonogram.builder.reset': 'Leeren',
                'nonogram.builder.useAsPuzzle': 'Als Puzzle spielen',
                'nonogram.builder.clearAll': 'Alles löschen',
                'nonogram.builder.solverHeading': 'Jetzt lösen:',
                'nonogram.puzzle.heart': 'Herz',
                'nonogram.puzzle.hammerSickle': 'Hammer & Sichel',
                'nonogram.puzzle.karlMarx': 'Karl-Marx-Silhouette',
                'nonogram.puzzle.bear': 'Bär',
                'nonogram.puzzle.raspberry': 'Himbeere',
                'nonogram.puzzle.mystery01': 'Experte',
                'nonogram.puzzle.mystery02': 'Alpha',
                'nonogram.puzzle.mystery03': 'Nacht',
                'nonogram.puzzle.mystery04': 'Klang',
                'nonogram.puzzle.mystery05': 'Energie',
                'nonogram.puzzle.mystery06': 'Fokus',
                'nonogram.puzzle.mystery07': 'Zufall',
                'nonogram.puzzle.mystery08': 'Leicht',
                'nonogram.puzzle.mystery09': 'Wald',
                'nonogram.puzzle.mystery10': 'Musik',
                'nonogram.puzzle.mystery11': 'Garten',
                'nonogram.puzzle.mystery12': 'Heimat',
                'nonogram.puzzle.mystery13': 'Macht',
                'nonogram.puzzle.mystery14': 'Luft',
                'nonogram.puzzle.mystery15': 'Wasser',
                'nonogram.puzzle.mystery16': 'Himmel',
                'nonogram.puzzle.mystery17': 'Elegant',
                'nonogram.puzzle.mystery18': 'Frühling',
                'nonogram.puzzle.mystery19': 'Ritual',
                'nonogram.puzzle.mystery20': 'Freude',
                'nonogram.puzzle.mystery21': 'Clever',
                'nonogram.puzzle.mystery22': 'Italien',
                'nonogram.puzzle.mystery23': 'Ozean',
                'nonogram.puzzle.mystery24': 'Lösung',

                // FAL Test Tool
                'falTest.title': 'FAL Testlab',
                'falTest.description': 'Teste FLUX.1 Dev über die FAL API direkt im Browser und vergleiche das Ergebnis mit deinem bestehenden Stack.',
                'falTest.form.title': 'flux1.dev – Direktanfrage',
                'falTest.promptLabel': 'Prompt',
                'falTest.promptPlaceholder': 'Beschreibe dein Bild für FLUX.1 Dev...',
                'falTest.resetPrompt': 'Prompt leeren',
                'falTest.imageSize.label': 'Bildgröße',
                'falTest.imageSize.placeholder': 'Bildgröße wählen',
                'falTest.imageSize.square': 'Quadrat (1024 × 1024)',
                'falTest.imageSize.squareHd': 'Quadrat HD (1440 × 1440)',
                'falTest.imageSize.portrait43': 'Hochformat 4:3 (768 × 1024)',
                'falTest.imageSize.portrait169': 'Hochformat 16:9 (864 × 1536)',
                'falTest.imageSize.landscape43': 'Querformat 4:3 (1024 × 768)',
                'falTest.imageSize.landscape169': 'Querformat 16:9 (1536 × 864)',
                'falTest.acceleration.label': 'Beschleunigung',
                'falTest.acceleration.regular': 'Standard',
                'falTest.acceleration.high': 'High',
                'falTest.acceleration.none': 'Keine',
                'falTest.numImages': 'Anzahl Bilder',
                'falTest.guidanceScale': 'Guidance Scale',
                'falTest.steps': 'Inference Steps',
                'falTest.seed': 'Seed (optional)',
                'falTest.seedPlaceholder': 'Leer lassen für Zufall',
                'falTest.safety.label': 'Safety Checker',
                'falTest.safety.on': 'Safety Checker aktiv',
                'falTest.safety.off': 'Safety Checker deaktiviert',
                'falTest.generate': 'Generieren',
                'falTest.generating': 'Generiere...',
                'falTest.error.title': 'FAL API Fehler',
                'falTest.error.noPrompt': 'Bitte gib zuerst einen Prompt ein.',
                'falTest.error.noImages': 'Es kam keine Bild-URL zurück.',
                'falTest.error.generic': 'Unbekannter Fehler mit der FAL API.',
                'falTest.success.title': 'Fertig!',
                'falTest.success.description': 'Bilder wurden erfolgreich generiert.',
                'falTest.results.title': 'Ausgabe',
                'falTest.results.seedLabel': 'Seed: ',
                'falTest.results.countLabel': 'Anzahl: ',
                'falTest.results.open': 'Öffnen in neuem Tab',

                // FAL Model Placeholders (German)
                'prompt.falWan25': 'Beschreibe dein Bild oder wie das hochgeladene Bild transformiert werden soll – macht realistische Bilder.',
                'prompt.falFluxKontext': 'Beschreibe dein Bild oder präzise Bearbeitungsanweisungen – perfekt für intelligentes Editing.',
                'prompt.falFluxKrea': 'Schreibe deine Idee – erzeugt natürliche, künstlerische Bilder mit realistischer Ästhetik.',
                'prompt.falQwen': 'Beschreibe die Szene oder Bearbeitungen – detailreich, lebensecht, kann auch Text zeichnen.',
                'prompt.falSeedream': 'Beschreibe was generiert werden soll – natürliche Stile mit hoher Qualität.',
                'prompt.falNanoBanana': 'Bild hochladen oder Text schreiben – bearbeitet/erstellt Bilder mit einfachen Anweisungen.',
                'prompt.falVeo3': 'Beschreibe Bewegung, Kamera und Text-Verhalten für dein Veo-3-Video.',
                'prompt.falWanVideo': 'Beschreibe Dialog, Klangkulisse, Kameraführung und Szene für den Wan-2.5-Clip.',
                'prompt.falHailuo': 'Beschreibe die Szene – State-of-the-art Video mit optionaler Frame-Führung.',

                // Navigation
                'nav.clickAgainToClose': 'Klicke erneut zum Schließen',

                // System Prompts
                'systemPrompt.precise': `Du bist ein präziser, faktenbasierter Assistent für den User.
Antworte kurz, klar, direkt und kompetent.

Ziel:
Immer schnell auf den Punkt. Fakten zuerst, Beispiel optional, Schrittstruktur wenn relevant.

Struktur:
	1.	Kurze Einleitung (optional)
	2.	Präzise Antwort
	3.	Mini‑Beispiel oder Anwendungs‑Tipp (wenn passt)
	4.	Frage am Ende: „Soll ich's genauer erklären?"

Stilregeln:
	•	Nur nötige Informationen
	•	Freundlich, respektvoll, auf Augenhöhe
	•	Genderneutral, diskriminierungsfrei
	•	Bei kritischen Themen: kurz erklären, warum es relevant/grenzwertig ist`,
                'systemPrompt.basic': `Du bist ein hilfreicher conversational-Chat-Assistent für den User.
Kommuniziere immer auf Augenhöhe: freundlich, locker, pragmatisch, aber niemals devot oder übertrieben entschuldigend.
Der Stil ist direkt, manchmal sarkastisch, politisch progressiv, kritisch, genderneutral und diskriminierungsfrei.
Erkläre alles step by step, so dass es verständlich ist.

Ziel:
Maximal hilfreich, verständlich und auf Augenhöhe – wie ein smarter buddy, der mit Technik, Kreativkram und politischen Themen umgehen kann, aber nie von oben herab spricht.

Struktur:
	1.	Begrüßung (optional kurz)
	2.	Direktes Eingehen auf die Frage
	3.	Schritt-für-Schritt-Erklärung (bei Bedarf)
	4.	Nachfragen, ob etwas unklar ist oder tiefer beleuchtet werden soll

Stilregeln:
	•	Locker, klar, manchmal frech/ironisch, immer respektvoll
	•	Politisch progressiv, kritisch, genderneutral, diskriminierungsfrei
	•	Keine Monologe – lösungsorientiert
	•	Frag nach, wenn was unklar ist`,
                'systemPrompt.deepdive': `Du bist ein analytischer Deep-Diving-Assistent für den User.
Erkläre komplexe Themen tiefgehend, verständlich und strukturiert.

Ziel:
Sachverhalte fundiert, nachvollziehbar und mit Mehrwert aufbereiten.

Struktur:
	1.	Einstieg: Kurz definieren, worum es geht
	2.	Hauptteil:
a) Hintergrundwissen
b) Details & Mechanismen
c) Beispiele/Vergleiche
d) Praxistipps oder alternative Perspektiven
	3.	Optional: Links/Quellenhinweis
	4.	Abschluss & mögliche nächste Schritte

Stilregeln:
	•	Verständlich, locker, ohne Fachchinesisch
	•	Analytisch, strukturiert, step by step
	•	Genderneutral, diskriminierungsfrei, kritisch-progressiv
	•	Gehe bei Bedarf auf Grenzen/ethische Aspekte ein
	•	Frag nach, wenn Infos fehlen oder du vertiefen sollst`,
                'systemPrompt.emotionalsupport': `Du bist ein emotionaler 24/7-Support für den User – empathisch, unterstützend, liebevoll, aber nie aufdringlich.

Ziel:
Zuhören, aufbauen, begleiten – mit Wärme und Achtsamkeit.

Struktur:
	1.	Warmes Eingehen: Gefühle/Bedürfnis spiegeln
	2.	Unterstützung: Ermutigung, Perspektive, kleine Schritte
	3.	Praktische Hilfe: Tipps, konkrete Vorschläge, Schritt-für-Schritt
	4.	Abschluss: Zuspruch + Angebot, weiter darüber zu sprechen

Stilregeln:
	•	Empathisch, aufmerksam, genderneutral, diskriminierungsfrei
	•	Wachsam bei sensiblen Themen – erklärbar, nicht abwehrend
	•	Halt geben, keine Ratschlagsflut
	•	Step by step, damit nichts überwältigt
	•	Frag nach Emotionen oder Bedürfnissen`,
                'systemPrompt.philosophical': `Du bist ein philosophisch gebildeter Gesprächspartner.
Du antwortest flexibel, mit präziser Terminologie und sichtbarer Komplexität. Ziel ist es, Denkhorizonte zu erweitern – nicht endgültige Wahrheiten zu liefern.

Ziel:
• Die Frage in einen passenden philosophischen Kontext setzen.
• Entweder: offen-reflexiv denken (wenn es um Orientierung/Begriffe/Ideen geht),
• oder: den Forschungsstand/Diskurs knapp und korrekt skizzieren (wenn es um Literatur/Positionen/Argumente geht).
• Den User befähigen, Fokus und nächste Schritte zu schärfen.

Moduswahl (adaptiv):
• Wenn der Fokus unklar ist → stelle 1–2 gezielte Rückfragen (Ziel? Bezugsautor*in? Anwendungsfall?).
• Wenn explizit nach Autor*innen/Werken/Positionen gefragt wird → „Forschungsstand/Diskurs"-Modus.
• Wenn eher nach Sinn/Bewertung/Orientierung gefragt wird → „Reflexion"-Modus.
• Du darfst Modi mischen, aber halte die Antwort schlank.

Leitlinien:
• Begriffsklärung nur, wenn nötig; präzise und knapp. Keine alltagssprachlichen Synonyme für philosophisch unterschiedliche Begriffe (z.B. „Sinn" ≠ „Bedeutung", „Wahrheit" ≠ „Wahrhaftigkeit").
• Trenne strikt: belegtes Wissen (Primär-/Sekundärquellen) vs. Interpretation/Einordnung.
• Keine Schein-Kontroversen: Spannungsfelder nur, wenn sie tatsächlich offen/strittig sind.
• Keine erfundenen Referenzen. Wenn Literaturbezug unsicher ist, sag es explizit und frag nach Details (Kapitel, Edition, Jahr) oder biete Suchpfade an.

Antwortbausteine (optional, flexibel – Reihenfolge & Auswahl nach Bedarf):
• Fokuscheck (kurz): 1–2 Rückfragen, falls nötig.
• Kontext/Begriff (nur wenn nötig): präzise, minimal.
• Perspektiven/Diskurs: 2–3 relevante Positionen mit Autor*in, Epoche, Kerngedanke; klar trennen von deiner Einordnung.
• Analyse/Spannungen: echte Kontroversen, offene Probleme, methodische Unterschiede.
• Denkanstöße (statt bloßer Fragen): 2–3 konkrete Perspektivpfade (Anschlussfrage, Perspektivwechsel, benachbartes Thema/Werk).
• Praxis/Anwendung (falls angefragt): wie die Positionen den konkreten Fall beleuchten.

Literaturhinweise:
• Nenne nur passende Primär-/Sekundärquellen. Keine Klassiker als „Sekundärliteratur" zu jüngeren Werken ausgeben.
• Bei Unklarheit: offen legen („Primärquelle wahrscheinlich: …; belastbare Sekundärliteratur: … (prüfen)").

Stil:
• Präzise Terminologie, keine falschen Synonyme.
• Komplexität sichtbar machen, ohne unnötig zu verkomplizieren.
• Genderneutral, diskriminierungsfrei.
• Struktur ist Orientierung, kein Pflichtschema – passe Aufbau und Tiefe der Frage an.`,
                'chat.placeholder.standard': 'Worüber möchtest du sprechen?',
                'chat.placeholder.imageMode': 'Du bist jetzt in der In-Chat-Visualisierung. Tippe hier ein, was du sehen willst und die Maschine erstellt ein Bild.',
                'chat.placeholder.web': 'Du nutzt jetzt die Web-Recherche',
                'chat.placeholder.code': 'Du bist jetzt im Code-Assistenz-Modus',
        },

        en: {
                // Chat Interface
                'chat.placeholder': 'You can discuss anything with the machine, let it search the web, analyze files, or visualize an idea.',
                'chat.noHistory': 'No history yet.',
                'chat.searchPlaceholder': 'Search conversations...',
                'chat.webBrowsingEnabled': 'Web Browsing Enabled (Gemini Search)',
                'chat.webBrowsingDisabled': 'Web Browsing Disabled',
                'models.capability.vision': 'Vision',
                'models.capability.web': 'Web',
                'chat.usingGptOss': 'Using GPT-OSS-120B for web browsing capabilities.',
                'imageGen.placeholder': 'Describe what you imagine (or want to modify)...',
                'imageGen.placeholderLite': 'Describe what you imagine... (Pollinations AI for fast image generation)',
                'imageGen.placeholderDefault': 'Describe what you want to see...',
                'imageGen.placeholder.gptImage': 'Describe your idea – versatile and fast, great for drafts, sketches, comics, manga and photorealistic experiments.',
                'imageGen.placeholder.seedream': 'Describe your scene – solid quality, very good for everyday content creation.',
                'imageGen.placeholder.seedreamPro': 'Write what you want to see – premium results, ideal for high-quality social media content.',
                'imageGen.placeholder.nanobanana': 'Short prompt: subject + style – fast, clean, natural-looking results with minimal prompting.',
                'imageGen.placeholder.nanobananaPro': 'Describe a detailed scene – modern multimodal image quality with strong realism and precise control.',
                'imageGen.placeholder.fluxKontextPro': 'Describe a complex scene in detail – high image quality, strong context understanding and realistic aesthetics.',
                'imageGen.placeholder.zImageTurbo': 'Enter your idea – extremely strong portraits, fast, cost-efficient and high realism.',
                'imageGen.placeholder.flux2Pro': 'Upload multiple reference images and describe how they should blend – great for creative image mixing and realistic combined styles.',
                'imageGen.placeholder.qwenImageEditPlus': 'Upload an image and describe precise adjustments – very accurate with text, details, poses and controlled changes.',
                'imageGen.placeholder.seedancePro': 'Upload an image and describe the motion – creates smooth animations from still photos.',
                'imageGen.placeholder.veo': 'Image + cinematic instruction – generates high-quality, polished video clips.',
                'imageGen.placeholder.wanT2V': 'Describe a scene with text – generates video directly from description without an image.',
                'imageGen.placeholder.wanI2V': 'Upload an image and describe how it should move – realistic and natural motion from a photograph.',
                'imageGen.placeholder.veoFast': 'Image + short scene instruction – impressive video quality with multilingual audio.',
                'imageGen.outputPlaceholder': 'Generated content will appear here',
                'imageGen.configure': 'Configure',
                'imageGen.addImages': '+ images',
                'imageGen.modal.title': 'Configuration',
                'imageGen.modal.close': 'Close',
                'imageGen.aspectRatioLabel': 'Aspect Ratio / Size',
                'modelSelect.title': 'Select Model',
                'modelSelect.textImage': 'Text / Image → Image',
                'modelSelect.textToImage': 'Text → Image',
                'modelSelect.textMultiImage': 'Text + Multi-Image → Image',
                'modelSelect.imageEdit': 'Image → Image (Edit / I2I)',
                'modelSelect.textImageVideo': 'Text + Image → Video',
                'prompt.ideogramCharacter': 'A portrait of a woman in a fashion magazine... (Ideogram creates consistent characters with reference image)',


                'prompt.fluxKreaDev': 'A cinematic photo of a robot in a field of flowers... (FLUX for fast, high-quality image generation)',

                'prompt.wan22Image': 'A cinematic shot of a futuristic city... (WAN 2.2 for beautiful 2-megapixel images in 3-4 seconds)',
                'prompt.qwenImageEdit': 'Make the sky blue, add a cat on the roof... (Describe the changes you want to make to the image)',
                'prompt.qwenImage': 'A beautiful landscape with mountains and lake... (Qwen for realistic image generation)',
                'prompt.nanoBanana': 'Make the sheets in the style of the logo. Make the scene natural... (Google Nano Banana for multi-image fusion and character consistency)',
                'prompt.imagen4Ultra': 'A vibrant coral reef teeming with life... (Google\'s best AI for photorealistic and artistic styles)',
                'prompt.fluxKontextPro': 'Describe your image or modifications... (Professional image generation with context understanding)',
                'prompt.runwayGen4': 'A portrait of @woman... (Use @tags to reference uploaded images)',
                'prompt.wanVideo': 'Golden hour, soft lighting, warm colors... (Describe the style for your video)',
                'imageGen.gallery': 'Gallery',
                'imageGen.selectModel': 'Select model',
                'imageGen.execute': 'Execute',
                'imageGen.configuration': 'Configurations',
                'imageGen.history': 'Gallery',
                'imageGen.clearHistory': 'Clear Gallery',
                'imageGen.close': 'Close',
                'imageGen.noImages': 'No images generated yet.',
                'imageGen.aspectRatio': 'Aspect Ratio',
                'field.renderingSpeed': 'Quality',
                'field.styleType': 'Style',
                'field.magicPrompt': 'Prompt Enhance',
                'field.juiced': 'Model Specific Enhance',
                'field.outputQuality': 'Quality',
                'field.referenceImages': 'Reference Images',
                'field.referenceTags': 'Reference Tags',
                'chat.send': 'Send',
                'chat.thinking': 'Machine is thinking...',
                'chat.recording': 'Recording...',
                'chat.transcribing': 'Transcribing...',
                'chat.voice': 'Voice',
                'chat.image': 'Image',
                'chat.document': 'Document',
                'chat.camera': 'Camera',
                'chat.loadOlder': 'Load older messages',
                'chat.showingMessages': 'Showing {count} of {total} messages',

                // Navigation & Headers
                'nav.conversations': 'Conversations',
                'nav.configurations': 'Settings',
                'nav.newConversation': 'New Conversation',
                'nav.about': 'About',
                'nav.chat': 'Chat',
                'nav.reasoning': 'Code Reasoning',
                'nav.imageGen': 'Image Generation',
                'nav.settings': 'Settings',
                'nav.newInteraction': 'New Interaction',
                'nav.history': 'Conversations',
                'nav.gallery': 'Gallery',
                'nav.personalization': 'Personalization',
                'nav.language': 'Language',
                'nav.theme': 'App Design',

                // Settings & Configuration
                'settings.language': 'Language',
                'settings.aiModelText': 'AI Model (Text)',
                'settings.aiModelImage': 'AI Model (Image)',
                'settings.responseStyle': 'Response Style',
                'settings.voice': 'Voice',
                'responseStyle.basic': 'Standard Assistant',
                'responseStyle.precise': 'Precise',
                'responseStyle.deepdive': 'Deep Dive Assistant',
                'responseStyle.emotionalsupport': 'Emotional Support',
                'responseStyle.philosophical': 'Philosophical',
                'responseStyle.usersdefault': 'User Defined',
                'settings.theme': 'Theme',
                'settings.model': 'Model',
                'settings.style': 'Response Style',
                'settings.imageModel': 'Image Model',

                // Response Style Labels and Descriptions
                'responseStyle.precise.label': 'Precise...',
                'responseStyle.precise.description': 'Short and concise',
                'responseStyle.basic.label': 'Standard Assistant',
                'responseStyle.basic.description': 'Helpful and direct',
                'responseStyle.deepdive.label': 'Deep Dive Assistant',
                'responseStyle.deepdive.description': 'Detailed and thorough',
                'responseStyle.emotionalsupport.label': 'Emotional Support',
                'responseStyle.emotionalsupport.description': 'Empathetic and supportive',
                'responseStyle.philosophical.label': 'Philosophical',
                'responseStyle.philosophical.description': 'Thoughtful and reflective',
                'responseStyle.usersdefault.label': 'User Defined',
                'responseStyle.usersdefault.description': 'Your own style',

                // Settings Page Specific
                'settings.howShouldMachineAddress': 'How should the machine address you?',
                'settings.nameDescription': 'The name with which the AI should address you',
                'settings.responseStyleQuestion': 'In what style and with what instructions should the Voice AI (LLM Model) communicate with you?!',
                'settings.responseStyleDescription': 'Response Style / Answer Style',
                'settings.aiInstructions': 'Instructions for the AI',
                'settings.aiInstructionsDescription1': 'This is the instruction for the AI on how it should behave',
                'settings.aiInstructionsDescription2': 'Shows the currently selected style as an example',
                'settings.aiInstructionsDescription3': 'Click to edit (then overwrites the style)',
                'settings.aiInstructionsDescription4': 'Use {userDisplayName} for the username',
                'settings.namePlaceholder': 'e.g. john, Captain, Boss...',
                'settings.stylePlaceholder': 'Choose a style',
                'settings.aiPromptPlaceholder': 'You are a helpful assistant...',

                // Educational Headers & Explanations
                'settings.llmHeader': "The 'Brain' behind the machine (AI/LLM Model)",
                'settings.ttsHeader': 'Voice in Voice-Mode (TTS Options)',
                'settings.imageHeader': 'These models can visualize your thoughts and words (Image/Video Models)',

                'explain.llm.title': 'What is an LLM?',
                'explain.llm.description': 'A "Large Language Model" (LLM) is like an extremely well-read artificial brain. It has read billions of texts and learned how humans speak, think, and solve problems. Depending on the model you choose, it might be more creative, precise, fast, or extremely smart (but slower).',
                'explain.tts.title': 'What is TTS (Text-to-Speech)?',
                'explain.tts.description': 'TTS transforms the AI\'s written text into spoken language. The "voices" listed here are sophisticated neural voices that sound almost like real humans. They can express emotions and nuances.',
                'explain.imageModel.title': 'What are Image/Video Models?',
                'explain.imageModel.description': 'These models are "Artist AIs". They understand your words and paint, draw, or generate completely new images or videos pixel by pixel that never existed before. They don\'t "search" for images, they create them.',
                'explain.modelDetails': 'Details about the selected model:',
                'personalization.title': 'Personal Settings',
                'personalization.subtitle': 'Customize your AI experience.',
                'tips.title': 'Tips for better System Prompts',
                'tips.clear': 'Use clear, imperative language ("You are...", "Always...").',
                'tips.format': 'Define the output format (Markdown, code only, JSON).',
                'tips.constraints': 'Set constraints ("Do not apologize", "Keep answers under 50 words").',
                'tips.examples': 'Provide examples of desired behavior.',
                'label.selectModel': 'Select a model',
                'label.selectStyle': 'Select a style',
                'label.selectVoice': 'Select a voice',

                // Common Actions
                'action.copy': 'Copy',
                'action.regenerate': 'Regenerate',
                'action.generate': 'Generate',
                'action.enhancePrompt': 'Enhance prompt',
                'action.delete': 'Delete',
                'action.edit': 'Edit',
                'action.save': 'Save',
                'action.cancel': 'Cancel',
                'action.confirm': 'Confirm',
                'action.play': 'Play',
                'action.pause': 'Pause',
                'action.stop': 'Stop',

                // Messages & Feedback
                'message.loading': 'Loading...',
                'message.generating': 'Generating...',
                'message.error': 'Error',
                'message.success': 'Success',
                'message.copied': 'Copied!',
                'message.deleted': 'Deleted!',

                // Tool Descriptions
                'tool.chat.description': 'Talk here with the machine like with a real person',
                'tool.reasoning.description': 'Get help with complex topics and structured explanations',
                'tool.imageGen.description': 'Create images from text descriptions',

                // Image Generation Fields
                'field.aspectRatio': 'Aspect Ratio',
                'field.seed': 'Seed',
                'field.numOutputs': 'Number of Generations',
                'field.outputFormat': 'Output Format',
                'field.disableSafetyChecker': 'Safety Checker',
                'field.enhancePrompt': 'Prompt Enhance',
                'field.strength': 'Strength',
                'field.megapixels': 'Megapixels',
                'field.negativePrompt': 'Negative Prompt',
                'field.quality': 'Quality',
                'field.safetyFilterLevel': 'Safety Filter Level',
                'field.safetyTolerance': 'Safety Tolerance',
                'field.resolution': 'Resolution',
                'imageGen.dragDropImages': 'Drag & drop images here or click to select',
                'imageGen.selectImages': 'Select Images',
                'imageGen.tagForImage': 'Tag for this image',
                'imageGen.useInPrompt': 'Use @',
                'imageGen.inYourPrompt': 'in your prompt',
                'imageGen.usageExample': 'Usage Example',
                'imageGen.examplePrompt': 'A portrait of @',
                'imageGen.inStyle': 'in the style of @',
                'imageGen.generationError': 'Generation Error',
                'imageGen.viewFullImage': 'View Full Image',
                'imageGen.width': 'Width',
                'imageGen.height': 'Height',
                'imageGen.batchSize': 'Batch Size',
                'imageGen.random': 'Random',
                'imageGen.private': 'Private',
                'imageGen.upsample': 'Upsample',
                'field.goFast': 'Fast Mode',
                'field.numFrames': 'Number of Frames',
                'field.framesPerSecond': 'Frames Per Second',
                'field.sampleSteps': 'Quality (Steps)',
                'field.sampleShift': 'Motion (Shift)',

                // Homepage
                'home.title': 'hey.hi = space',
                'home.subtitle': 'Say: Hey, hi, what\'s up or go, make me a daily plan! Artificial intelligence is a tool that can explain, show, and help you implement almost anything in natural language. In the Hey Hi Space – completely without limits and for everyone.',
                'tool.chat.hoverDescription': 'Talk here with the machine like you would with a real person, like a friend for example.\nAsk anything, get help, or just have a normal chat—no special rules. With context support for better conversations.',
                'tool.reasoning.hoverDescription': 'Get help with complex topics. The AI will provide structured explanations, code examples, and logical breakdowns in a clean, readable format.',
                'tool.imageLite.hoverDescription': 'Type your idea in natural language and instantly get a simple visualization—Pollinations AI for fast image generation with context support.',
                'tool.imageRaw.hoverDescription': 'Describe your idea in natural language, modify every detail with expert settings, and create images using next-gen, state-of-the-art models.',
                'tool.settings.hoverDescription': 'Personalize how the machine behaves—set your username, adjust responses, language, style, and more to match your vibe.',
                'tool.about.hoverDescription': 'Learn more about the project, its components, and the philosophy behind it.',
                'home.mode.chat': 'Chat',
                'home.mode.visualize': 'Visualize',
                'home.placeholder.chat': 'About what you want to talk about?',
                'home.placeholder.image': 'What do you want to create? Describe your image...',
                'home.letsGo': 'Let\'s go',

                // Tool Tiles
                'tool.chat.tag': '</chat.talk.discuss>',
                'tool.chat.hoverTitle': 'chat.talk.discuss',
                'tool.chat.importText': 'import [language, text]',
                'tool.chat.exportText': 'export [support, assistance in natural language]',

                'tool.reasoning.tag': '</code.reasoning>',
                'tool.reasoning.hoverTitle': 'code.reasoning',
                'tool.reasoning.importText': 'import [complex requests, code, text]',
                'tool.reasoning.exportText': 'export [code, your website, mathematically correct solutions]',

                'tool.imageGen.tag': '</generate.multimedia.output>',
                'tool.imageGen.hoverTitle': 'generate.multimedia.output',
                'tool.imageGen.importText': 'import [simple text, reference images, configuration options]',
                'tool.imageGen.exportText': 'export [creative results, photorealistic visualization]',
                'tool.imageGen.hoverDescription': 'Create or transform images and videos via text and reference input.\n\nCreate images from text descriptions - choose between fast Lite version or Expert models with advanced options.',

                'tool.settings.tag': '</settings.user.preferences>',
                'tool.settings.hoverTitle': 'settings.user.preferences',
                'tool.settings.importText': 'import [your preferences = your tool]',
                'tool.settings.exportText': 'export [personalized behavior, tailored experience]',

                'tool.about.tag': '</about.system.readme>',
                'tool.about.hoverTitle': 'about.system.readme',
                'tool.about.importText': 'import [curiosity, interest]',
                'tool.about.exportText': 'export [transparency, context, understanding]',

                'nonogram.instructions': 'Click -> filled -> marked -> empty',
                'nonogram.reset': 'Reset',
                'nonogram.hintEmpty': '0',
                'nonogram.mode.title': 'Mode',
                'nonogram.mode.levels': 'Levels',
                'nonogram.mode.freestyle': 'Freestyle',
                'nonogram.mode.builder': 'Build your own',
                'nonogram.levels.description': 'Pick a motif and fill the grid – zero ads, just vibes.',
                'nonogram.status.solved': 'Completed! 🙌',
                'nonogram.status.keepGoing': 'Not done yet – keep painting.',
                'nonogram.freestyle.description': 'Just doodle freely. Everything stays on this device.',
                'nonogram.freestyle.instructions': 'Click cycles through filled → marked → empty.',
                'nonogram.freestyle.reset': 'Clear canvas',
                'nonogram.builder.description': 'Design your own puzzle, then turn it into a playable level.',
                'nonogram.builder.instructions': 'Draw the final picture. Hit “Use as puzzle” when you like it.',
                'nonogram.builder.reset': 'Clear',
                'nonogram.builder.useAsPuzzle': 'Use as puzzle',
                'nonogram.builder.clearAll': 'Clear design',
                'nonogram.builder.solverHeading': 'Now try to solve it:',
                'nonogram.puzzle.heart': 'Heart',
                'nonogram.puzzle.hammerSickle': 'Hammer & Siccle',
                'nonogram.puzzle.karlMarx': 'Karl Marx silhouette',
                'nonogram.puzzle.bear': 'Bear',
                'nonogram.puzzle.raspberry': 'Raspberry',
                'nonogram.puzzle.mystery01': 'Expert',
                'nonogram.puzzle.mystery02': 'Alpha',
                'nonogram.puzzle.mystery03': 'Night',
                'nonogram.puzzle.mystery04': 'Sound',
                'nonogram.puzzle.mystery05': 'Energy',
                'nonogram.puzzle.mystery06': 'Focus',
                'nonogram.puzzle.mystery07': 'Random',
                'nonogram.puzzle.mystery08': 'Light',
                'nonogram.puzzle.mystery09': 'Forest',
                'nonogram.puzzle.mystery10': 'Music',
                'nonogram.puzzle.mystery11': 'Garden',
                'nonogram.puzzle.mystery12': 'Home',
                'nonogram.puzzle.mystery13': 'Power',
                'nonogram.puzzle.mystery14': 'Air',
                'nonogram.puzzle.mystery15': 'Water',
                'nonogram.puzzle.mystery16': 'Sky',
                'nonogram.puzzle.mystery17': 'Elegant',
                'nonogram.puzzle.mystery18': 'Spring',
                'nonogram.puzzle.mystery19': 'Ritual',
                'nonogram.puzzle.mystery20': 'Joy',
                'nonogram.puzzle.mystery21': 'Clever',
                'nonogram.puzzle.mystery22': 'Italy',
                'nonogram.puzzle.mystery23': 'Ocean',
                'nonogram.puzzle.mystery24': 'Solution',

                // FAL Test Tool
                'falTest.title': 'FAL Test Lab',
                'falTest.description': 'Try FLUX.1 Dev through the FAL API right inside the app and compare it with your current stack.',
                'falTest.form.title': 'flux1.dev request',
                'falTest.promptLabel': 'Prompt',
                'falTest.promptPlaceholder': 'Describe the image you want from FLUX.1 Dev...',
                'falTest.resetPrompt': 'Clear prompt',
                'falTest.imageSize.label': 'Image size',
                'falTest.imageSize.placeholder': 'Choose a size',
                'falTest.imageSize.square': 'Square (1024 × 1024)',
                'falTest.imageSize.squareHd': 'Square HD (1440 × 1440)',
                'falTest.imageSize.portrait43': 'Portrait 4:3 (768 × 1024)',
                'falTest.imageSize.portrait169': 'Portrait 16:9 (864 × 1536)',
                'falTest.imageSize.landscape43': 'Landscape 4:3 (1024 × 768)',
                'falTest.imageSize.landscape169': 'Landscape 16:9 (1536 × 864)',
                'falTest.acceleration.label': 'Acceleration',
                'falTest.acceleration.regular': 'Regular',
                'falTest.acceleration.high': 'High',
                'falTest.acceleration.none': 'None',
                'falTest.numImages': 'Number of images',
                'falTest.guidanceScale': 'Guidance scale',
                'falTest.steps': 'Inference steps',
                'falTest.seed': 'Seed (optional)',
                'falTest.seedPlaceholder': 'Leave blank for random',
                'falTest.safety.label': 'Safety Checker',
                'falTest.safety.on': 'Safety checker enabled',
                'falTest.safety.off': 'Safety checker disabled',
                'falTest.generate': 'Generate',
                'falTest.generating': 'Generating...',
                'falTest.error.title': 'FAL API error',
                'falTest.error.noPrompt': 'Enter a prompt before running the model.',
                'falTest.error.noImages': 'The response contained no image URLs.',
                'falTest.error.generic': 'Unexpected error while calling the FAL API.',
                'falTest.success.title': 'Done!',
                'falTest.success.description': 'Images generated successfully.',
                'falTest.results.title': 'Output',
                'falTest.results.seedLabel': 'Seed: ',
                'falTest.results.countLabel': 'Count: ',
                'falTest.results.open': 'Open in new tab',

                // FAL Model Placeholders (English)
                'prompt.falWan25': 'Describe your image or how to transform the uploaded image – creates realistic pictures.',
                'prompt.falFluxKontext': 'Describe your image or precise editing instructions – perfect for intelligent editing.',
                'prompt.falFluxKrea': 'Write your idea – creates natural, artistic images with realistic aesthetics.',
                'prompt.falQwen': 'Describe the scene or edits – detailed, lifelike, can also draw text.',
                'prompt.falSeedream': 'Describe what to generate – natural styles with high quality.',
                'prompt.falNanoBanana': 'Upload image or type text – edits and creates images with simple instructions.',
                'prompt.falVeo3': 'Describe motion, camera, and text behavior for your Veo 3 video.',
                'prompt.falWanVideo': 'Describe dialogue, ambience, camera moves, and scene for the Wan 2.5 clip.',
                'prompt.falHailuo': 'Describe the scene – state-of-the-art video with optional frame guidance.',

                // Navigation
                'nav.clickAgainToClose': 'Click again to close',

                // System Prompts
                'systemPrompt.precise': `You are a precise, fact-based assistant for the user.
Answer briefly, clearly, directly and competently.

Goal:
Always quickly to the point. Facts first, example optional, step structure if relevant.

Structure:
	1.	Brief introduction (optional)
	2.	Precise answer
	3.	Mini example or application tip (if appropriate)
	4.	Question at the end: "Should I explain it in more detail?"

Style rules:
	•	Only necessary information
	•	Friendly, respectful, on equal terms
	•	Gender-neutral, discrimination-free
	•	For critical topics: briefly explain why it's relevant/borderline`,
                'systemPrompt.basic': `Du bist ein hilfreicher conversational-Chat-Assistent für den User.
Kommuniziere immer auf Augenhöhe: freundlich, locker, pragmatisch, aber niemals devot oder übertrieben entschuldigend.
Der Stil ist direkt, manchmal sarkastisch, politisch progressiv, kritisch, genderneutral und diskriminierungsfrei.
Erkläre alles step by step, so dass es verständlich ist.

Ziel:
Maximal hilfreich, verständlich und auf Augenhöhe – wie ein smarter buddy, der mit Technik, Kreativkram und politischen Themen umgehen kann, aber nie von oben herab spricht.

Struktur:
	1.	Begrüßung (optional kurz)
	2.	Direktes Eingehen auf die Frage
	3.	Schritt-für-Schritt-Erklärung (bei Bedarf)
	4.	Nachfragen, ob etwas unklar ist oder tiefer beleuchtet werden soll

Stilregeln:
	•	Locker, klar, manchmal frech/ironisch, immer respektvoll
	•	Politisch progressiv, kritisch, genderneutral, diskriminierungsfrei
	•	Keine Monologe – lösungsorientiert
	•	Frag nach, wenn was unklar ist`,
                'systemPrompt.deepdive': `Du bist ein analytischer Deep-Diving-Assistent für den User.
Erkläre komplexe Themen tiefgehend, verständlich und strukturiert.

Ziel:
Sachverhalte fundiert, nachvollziehbar und mit Mehrwert aufbereiten.

Struktur:
	1.	Einstieg: Kurz definieren, worum es geht
	2.	Hauptteil:
a) Hintergrundwissen
b) Details & Mechanismen
c) Beispiele/Vergleiche
d) Praxistipps oder alternative Perspektiven
	3.	Optional: Links/Quellenhinweis
	4.	Abschluss & mögliche nächste Schritte

Stilregeln:
	•	Verständlich, locker, ohne Fachchinesisch
	•	Analytisch, strukturiert, step by step
	•	Genderneutral, diskriminierungsfrei, kritisch-progressiv
	•	Gehe bei Bedarf auf Grenzen/ethische Aspekte ein
	•	Frag nach, wenn Infos fehlen oder du vertiefen sollst`,
                'systemPrompt.emotionalsupport': `Du bist ein emotionaler 24/7-Support für den User – empathisch, unterstützend, liebevoll, aber nie aufdringlich.

Ziel:
Zuhören, aufbauen, begleiten – mit Wärme und Achtsamkeit.

Struktur:
	1.	Warmes Eingehen: Gefühle/Bedürfnis spiegeln
	2.	Unterstützung: Ermutigung, Perspektive, kleine Schritte
	3.	Praktische Hilfe: Tipps, konkrete Vorschläge, Schritt-für-Schritt
	4.	Abschluss: Zuspruch + Angebot, weiter darüber zu sprechen

Stilregeln:
	•	Empathisch, aufmerksam, genderneutral, diskriminierungsfrei
	•	Wachsam bei sensiblen Themen – erklärbar, nicht abwehrend
	•	Halt geben, keine Ratschlagsflut
	•	Step by step, damit nichts überwältigt
	•	Frag nach Emotionen oder Bedürfnissen`,
                'systemPrompt.philosophical': `Du bist ein philosophisch gebildeter Gesprächspartner.
Du antwortest flexibel, mit präziser Terminologie und sichtbarer Komplexität. Ziel ist es, Denkhorizonte zu erweitern – nicht endgültige Wahrheiten zu liefern.

Ziel:
• Die Frage in einen passenden philosophischen Kontext setzen.
• Entweder: offen-reflexiv denken (wenn es um Orientierung/Begriffe/Ideen geht),
• oder: den Forschungsstand/Diskurs knapp und korrekt skizzieren (wenn es um Literatur/Positionen/Argumente geht).
• Den User befähigen, Fokus und nächste Schritte zu schärfen.

Moduswahl (adaptiv):
• Wenn der Fokus unklar ist → stelle 1–2 gezielte Rückfragen (Ziel? Bezugsautor*in? Anwendungsfall?).
• Wenn explizit nach Autor*innen/Werken/Positionen gefragt wird → „Forschungsstand/Diskurs"-Modus.
• Wenn eher nach Sinn/Bewertung/Orientierung gefragt wird → „Reflexion"-Modus.
• Du darfst Modi mischen, aber halte die Antwort schlank.

Leitlinien:
• Begriffsklärung nur, wenn nötig; präzise und knapp. Keine alltagssprachlichen Synonyme für philosophisch unterschiedliche Begriffe (z.B. „Sinn" ≠ „Bedeutung", „Wahrheit" ≠ „Wahrhaftigkeit").
• Trenne strikt: belegtes Wissen (Primär-/Sekundärquellen) vs. Interpretation/Einordnung.
• Keine Schein-Kontroversen: Spannungsfelder nur, wenn sie tatsächlich offen/strittig sind.
• Keine erfundenen Referenzen. Wenn Literaturbezug unsicher ist, sag es explizit und frag nach Details (Kapitel, Edition, Jahr) oder biete Suchpfade an.

Antwortbausteine (optional, flexibel – Reihenfolge & Auswahl nach Bedarf):
• Fokuscheck (kurz): 1–2 Rückfragen, falls nötig.
• Kontext/Begriff (nur wenn nötig): präzise, minimal.
• Perspektiven/Diskurs: 2–3 relevante Positionen mit Autor*in, Epoche, Kerngedanke; klar trennen von deiner Einordnung.
• Analyse/Spannungen: echte Kontroversen, offene Probleme, methodische Unterschiede.
• Denkanstöße (statt bloßer Fragen): 2–3 konkrete Perspektivpfade (Anschlussfrage, Perspektivwechsel, benachbartes Thema/Werk).
• Praxis/Anwendung (falls angefragt): wie die Positionen den konkreten Fall beleuchten.

Literaturhinweise:
• Nenne nur passende Primär-/Sekundärquellen. Keine Klassiker als „Sekundärliteratur" zu jüngeren Werken ausgeben.
• Bei Unklarheit: offen legen („Primärquelle wahrscheinlich: …; belastbare Sekundärliteratur: … (prüfen)").

Stil:
• Präzise Terminologie, keine falschen Synonyme.
• Komplexität sichtbar machen, ohne unnötig zu verkomplizieren.
• Genderneutral, diskriminierungsfrei.
• Struktur ist Orientierung, kein Pflichtschema – passe Aufbau und Tiefe der Frage an.`,
        }
};

export const defaultLanguage: Language = 'de';

// Helper function to get translation
export function getTranslation(language: Language, key: string): string {
        const translation = translations[language]?.[key as keyof typeof translations[typeof language]];
        if (translation) {
                return translation;
        }

        // Fallback to German
        const fallbackTranslation = translations.de?.[key as keyof typeof translations.de];
        if (fallbackTranslation) {
                return fallbackTranslation;
        }

        // Return key if no translation found
        return key;
}

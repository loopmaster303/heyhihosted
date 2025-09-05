export type Language = 'de' | 'en';

export const translations = {
  de: {
    // Chat Interface
    'chat.placeholder': 'Frag mich einfach alles...',
    'chat.noHistory': 'Noch keine Historie.',
    'chat.webBrowsingEnabled': 'Web-Browsing Aktiviert',
    'chat.webBrowsingDisabled': 'Web-Browsing Deaktiviert',
    'chat.usingGptOss': 'Verwende GPT-OSS-120B für Web-Browsing-Funktionen.',
    'imageGen.placeholder': 'Beschreibe in natürlicher Sprache was du dir vorstellst (oder was du an einem Referenzbild ändern möchtest)...',
    'imageGen.placeholderLite': 'Beschreibe was du dir vorstellst...',
    'prompt.ideogramCharacter': 'Ein Portrait einer Frau in einem Mode-Magazin... (Ideogram erstellt konsistente Charaktere mit Referenzbild)',


    'prompt.fluxKreaDev': 'Ein kinematografisches Foto eines Roboters in einem Blumenfeld... (FLUX für schnelle, hochwertige Bildgenerierung)',

    'prompt.wan22Image': 'Ein kinematografischer Shot einer futuristischen Stadt... (WAN 2.2 für schöne 2-Megapixel Bilder in 3-4 Sekunden)',
    'prompt.nanoBanana': 'Erstelle eine futuristische Stadtszene... (Google Nano Banana für Bildbearbeitung und Multi-Image-Fusion)',
    'prompt.qwenImageEdit': 'Mache den Himmel blau, füge eine Katze auf dem Dach hinzu... (Beschreibe die Änderungen die du am Bild vornehmen möchtest)',
    'prompt.qwenImage': 'Eine wunderschöne Landschaft mit Bergen und See... (Qwen für realistische Bildgenerierung)',
    'prompt.imagen4Ultra': 'Ein lebendiges Korallenriff voller Leben... (Google\'s beste KI für fotorealistische und künstlerische Stile)',
    'prompt.fluxKontextPro': 'Beschreibe dein Bild oder die Modifikationen... (Professionelle Bildgenerierung mit Kontextverständnis)',
    'prompt.runwayGen4': 'Ein Portrait von @frau... (Verwende @tags um Referenzbilder zu nutzen)',
    'prompt.wanVideo': 'Goldene Stunde, weiches Licht, warme Farben... (Beschreibe den Stil für dein Video)',
    'imageGen.gallery': 'Galerie',
    'imageGen.selectModel': 'Modell Auswahl',
    'imageGen.execute': 'Start',
    'imageGen.configuration': 'Konfigurationen',
    'imageGen.history': 'Historie',
    'imageGen.clearHistory': 'Historie löschen',
    'imageGen.close': 'Schließen',
    'imageGen.noImages': 'Keine Bilder generiert bisher.',
    'imageGen.aspectRatio': 'Seitenverhältnis',
    'field.renderingSpeed': 'Qualität',
    'field.styleType': 'Stil',
    'field.magicPrompt': 'Automatische Prompt Verbesserung',
    'chat.send': 'Senden',
    'chat.recording': 'Aufnahme läuft...',
    'chat.transcribing': 'Transkribiere...',
    'chat.voice': 'Sprache',
    'chat.image': 'Bild',
    'chat.document': 'Dokument',
    'chat.camera': 'Kamera',
    
    // Navigation & Headers
    'nav.conversations': 'Gespräche',
    'nav.configurations': 'Einstellungen',
    'nav.newConversation': 'Neues Gespräch',
    'nav.about': 'Über',
    'nav.chat': 'Chat',
    'nav.reasoning': 'Code Reasoning',
    'nav.imageGen': 'Bildgenerierung',
    'nav.settings': 'Einstellungen',
    
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
    'settings.responseStyleQuestion': 'In welchem Stil soll die Maschine antworten?',
    'settings.responseStyleDescription': 'Response Style / Antwortstil',
    'settings.aiInstructions': 'Anweisung an die KI',
    'settings.aiInstructionsDescription1': 'Das ist die Anweisung an die KI, wie sie sich verhalten soll',
    'settings.aiInstructionsDescription2': 'Zeigt den aktuell gewählten Stil als Beispiel',
    'settings.aiInstructionsDescription3': 'Klicke zum Bearbeiten (überschreibt dann den Stil)',
    'settings.aiInstructionsDescription4': 'Verwende {userDisplayName} für den Benutzernamen',
    'settings.namePlaceholder': 'z.B. john, Captain, Chef...',
    'settings.stylePlaceholder': 'Wähle einen Stil',
    'settings.aiPromptPlaceholder': 'Du bist ein hilfreicher Assistent...',
    
    // Common Actions
    'action.copy': 'Kopieren',
    'action.regenerate': 'Neu generieren',
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
    'field.referenceImages': 'Referenzbilder',
    'field.referenceTags': 'Referenz-Tags',
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
    'imageGen.transparent': 'Transparent',
    'field.goFast': 'Schnellmodus',
    'field.numFrames': 'Anzahl Bilder',
    'field.framesPerSecond': 'Bilder pro Sekunde',
    'field.sampleSteps': 'Qualität (Schritte)',
    'field.sampleShift': 'Bewegung (Shift)',
    
    // Homepage
    'home.title': 'hey.hi = space',
    'home.subtitle': 'Dein KI-Assistent für alles',
    'tool.chat.hoverDescription': 'Sprich hier mit der Maschine wie mit einem echten Menschen, wie einem Freund zum Beispiel.\nFrag alles, bekomme Hilfe oder führe einfach ein normales Gespräch—keine besonderen Regeln.',
    'tool.reasoning.hoverDescription': 'Bekomme Hilfe bei komplexen Themen. Die KI liefert strukturierte Erklärungen, Code-Beispiele und logische Aufschlüsselungen in einem sauberen, lesbaren Format.',
    'tool.imageLite.hoverDescription': 'Tippe deine Idee in natürlicher Sprache und bekomme sofort eine einfache Visualisierung—keine Einstellungen, nur Magie.',
    'tool.imageRaw.hoverDescription': 'Beschreibe deine Idee in natürlicher Sprache, modifiziere jedes Detail mit Experten-Einstellungen und erstelle Bilder mit Next-Gen, State-of-the-Art Modellen.',
    'tool.settings.hoverDescription': 'Personalisieren Sie, wie sich die Maschine verhält—setzen Sie Ihren Benutzernamen, passen Sie Antworten, Sprache, Stil und mehr an, um zu Ihrem Vibe zu passen.',
    'tool.about.hoverDescription': 'Erfahren Sie mehr über das Projekt, seine Komponenten und die Philosophie dahinter.',
    
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
  },
  
  en: {
    // Chat Interface
    'chat.placeholder': 'Just ask me anything...',
    'chat.noHistory': 'No history yet.',
    'chat.webBrowsingEnabled': 'Web Browsing Enabled',
    'chat.webBrowsingDisabled': 'Web Browsing Disabled',
    'chat.usingGptOss': 'Using GPT-OSS-120B for web browsing capabilities.',
    'imageGen.placeholder': 'Describe what you imagine (or want to modify)...',
    'imageGen.placeholderLite': 'Describe what you imagine...',
    'prompt.ideogramCharacter': 'A portrait of a woman in a fashion magazine... (Ideogram creates consistent characters with reference image)',


    'prompt.fluxKreaDev': 'A cinematic photo of a robot in a field of flowers... (FLUX for fast, high-quality image generation)',

    'prompt.wan22Image': 'A cinematic shot of a futuristic city... (WAN 2.2 for beautiful 2-megapixel images in 3-4 seconds)',
    'prompt.nanoBanana': 'Create a futuristic cityscape... (Google Nano Banana for image editing and multi-image fusion)',
    'prompt.qwenImageEdit': 'Make the sky blue, add a cat on the roof... (Describe the changes you want to make to the image)',
    'prompt.qwenImage': 'A beautiful landscape with mountains and lake... (Qwen for realistic image generation)',
    'prompt.imagen4Ultra': 'A vibrant coral reef teeming with life... (Google\'s best AI for photorealistic and artistic styles)',
    'prompt.fluxKontextPro': 'Describe your image or modifications... (Professional image generation with context understanding)',
    'prompt.runwayGen4': 'A portrait of @woman... (Use @tags to reference uploaded images)',
    'prompt.wanVideo': 'Golden hour, soft lighting, warm colors... (Describe the style for your video)',
    'imageGen.gallery': 'Gallery',
    'imageGen.selectModel': 'Select model',
    'imageGen.execute': 'Execute',
    'imageGen.configuration': 'Configurations',
    'imageGen.history': 'History',
    'imageGen.clearHistory': 'Clear History',
    'imageGen.close': 'Close',
    'imageGen.noImages': 'No images generated yet.',
    'imageGen.aspectRatio': 'Aspect Ratio',
    'field.renderingSpeed': 'Quality',
    'field.styleType': 'Style',
    'field.magicPrompt': 'Prompt Enhance',
    'chat.send': 'Send',
    'chat.recording': 'Recording...',
    'chat.transcribing': 'Transcribing...',
    'chat.voice': 'Voice',
    'chat.image': 'Image',
    'chat.document': 'Document',
    'chat.camera': 'Camera',
    
    // Navigation & Headers
    'nav.conversations': 'Conversations',
            'nav.configurations': 'Settings',
    'nav.newConversation': 'New Conversation',
    'nav.about': 'About',
    'nav.chat': 'Chat',
    'nav.reasoning': 'Code Reasoning',
    'nav.imageGen': 'Image Generation',
    'nav.settings': 'Settings',
    
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
    'settings.responseStyleQuestion': 'In what style should the machine answer?',
    'settings.responseStyleDescription': 'Response Style / Answer Style',
    'settings.aiInstructions': 'Instructions for the AI',
    'settings.aiInstructionsDescription1': 'This is the instruction for the AI on how it should behave',
    'settings.aiInstructionsDescription2': 'Shows the currently selected style as an example',
    'settings.aiInstructionsDescription3': 'Click to edit (then overwrites the style)',
    'settings.aiInstructionsDescription4': 'Use {userDisplayName} for the username',
    'settings.namePlaceholder': 'e.g. john, Captain, Boss...',
    'settings.stylePlaceholder': 'Choose a style',
    'settings.aiPromptPlaceholder': 'You are a helpful assistant...',
    
    // Common Actions
    'action.copy': 'Copy',
    'action.regenerate': 'Regenerate',
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
        'field.referenceImages': 'Reference Images',
        'field.referenceTags': 'Reference Tags',
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
        'imageGen.transparent': 'Transparent',
        'field.goFast': 'Fast Mode',
        'field.numFrames': 'Number of Frames',
        'field.framesPerSecond': 'Frames Per Second',
        'field.sampleSteps': 'Quality (Steps)',
        'field.sampleShift': 'Motion (Shift)',
    
    // Homepage
    'home.title': 'hey.hi = space',
    'home.subtitle': 'Your AI assistant for everything',
    'tool.chat.hoverDescription': 'Talk here with the machine like you would with a real person, like a friend for example.\nAsk anything, get help, or just have a normal chat—no special rules.',
    'tool.reasoning.hoverDescription': 'Get help with complex topics. The AI will provide structured explanations, code examples, and logical breakdowns in a clean, readable format.',
    'tool.imageLite.hoverDescription': 'Type your idea in natural language and instantly get a simple visualization—no settings, just magic.',
    'tool.imageRaw.hoverDescription': 'Describe your idea in natural language, modify every detail with expert settings, and create images using next-gen, state-of-the-art models.',
    'tool.settings.hoverDescription': 'Personalize how the machine behaves—set your username, adjust responses, language, style, and more to match your vibe.',
    'tool.about.hoverDescription': 'Learn more about the project, its components, and the philosophy behind it.',
    
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

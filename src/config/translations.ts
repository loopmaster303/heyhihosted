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
    'prompt.qwenImageEdit': 'Mache den Himmel blau, füge eine Katze auf dem Dach hinzu... (Beschreibe die Änderungen die du am Bild vornehmen möchtest)',
    'prompt.qwenImage': 'Eine wunderschöne Landschaft mit Bergen und See... (Qwen für realistische Bildgenerierung)',
    'prompt.imagen4Ultra': 'Ein lebendiges Korallenriff voller Leben... (Google\'s beste KI für fotorealistische und künstlerische Stile)',
    'prompt.fluxKontextPro': 'Beschreibe dein Bild oder die Modifikationen... (Professionelle Bildgenerierung mit Kontextverständnis)',
    'prompt.runwayGen4': 'Ein Portrait von @frau... (Verwende @tags um Referenzbilder zu nutzen)',
    'prompt.wanVideo': 'Goldene Stunde, weiches Licht, warme Farben... (Beschreibe den Stil für dein Video)',
    'imageGen.gallery': 'Galerie',
    'imageGen.selectModel': 'Modell Auswahl',
    'imageGen.execute': 'Start',
    'imageGen.configurations': 'Einstellungen',
    'imageGen.history': 'Historie',
    'imageGen.clearHistory': 'Historie löschen',
    'imageGen.close': 'Schließen',
    'imageGen.noImages': 'Keine Bilder generiert bisher.',
    'imageGen.configuration': 'Einstellungen',
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
    'prompt.qwenImageEdit': 'Make the sky blue, add a cat on the roof... (Describe the changes you want to make to the image)',
    'prompt.qwenImage': 'A beautiful landscape with mountains and lake... (Qwen for realistic image generation)',
    'prompt.imagen4Ultra': 'A vibrant coral reef teeming with life... (Google\'s best AI for photorealistic and artistic styles)',
    'prompt.fluxKontextPro': 'Describe your image or modifications... (Professional image generation with context understanding)',
    'prompt.runwayGen4': 'A portrait of @woman... (Use @tags to reference uploaded images)',
    'prompt.wanVideo': 'Golden hour, soft lighting, warm colors... (Describe the style for your video)',
    'imageGen.gallery': 'Gallery',
    'imageGen.selectModel': 'Select model',
    'imageGen.execute': 'Execute',
    'imageGen.configurations': 'Configurations',
    'imageGen.history': 'History',
    'imageGen.clearHistory': 'Clear History',
    'imageGen.close': 'Close',
    'imageGen.noImages': 'No images generated yet.',
            'imageGen.configuration': 'Configurations',
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

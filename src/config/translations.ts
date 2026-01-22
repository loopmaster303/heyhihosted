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

        'imageGen.placeholder': 'Beschreibe in natürlicher Sprache was du dir vorstellst...', 
        'imageGen.placeholderLite': 'Beschreibe was du dir vorstellst... (Pollinations AI)',
        'imageGen.placeholderDefault': 'Beschreibe was du dir vorstellst...', 
        'imageGen.outputPlaceholder': 'Generierte Inhalte erscheinen hier',
        'imageGen.configure': 'Konfigurieren',
        'imageGen.addImages': '+ Bilder',
        'chat.send': 'Senden',
        'chat.thinking': 'Die Maschine denkt nach...', 
        'chat.recording': 'Aufnahme läuft...', 
        'chat.transcribing': 'Transkribiere...', 
        'chat.voice': 'Sprache',
        'chat.image': 'Bild',
        'chat.document': 'Dokument',
        'chat.camera': 'Kamera',
        'chat.disclaimer': 'Sei dir bewusst, dass KI Fehler macht und kein Mensch ist, auch wenn sie so antwortet. Überprüfe die Ergebnisse, wenn du dir unsicher bist.',

        // Navigation & Headers
        'nav.conversations': 'Konversationen',
        'nav.configurations': 'Einstellungen',
        'nav.newConversation': 'Neue Konversation',
        'nav.about': 'Über',
        'nav.chat': 'Chat',
        'nav.reasoning': 'Code Reasoning',
        'nav.imageGen': 'Bildgenerierung',
        'nav.settings': 'Einstellungen',
        'nav.history': 'Verlauf',
        'nav.gallery': 'Galerie',
        'nav.personalization': 'Personalisation',
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
        
        // Homepage & Tools
        'home.title': 'hey.hi = space',
        'home.subtitle': 'Sag: Hey, hi, was geht oder los! KI ohne Grenzen für alle.',
        'tool.chat.hoverDescription': 'Sprich hier mit der Maschine wie mit einem echten Menschen. Frag alles, bekomme Hilfe oder führe ein normales Gespräch.',
        'tool.reasoning.hoverDescription': 'Hilfe bei komplexen Themen mit logischen Aufschlüsselungen.',
        'tool.imageLite.hoverDescription': 'Schnelle Visualisierung deiner Ideen via Pollinations AI.',
        'tool.imageRaw.hoverDescription': 'Bildgenerierung mit Experten-Einstellungen und High-End Modellen.',
        'tool.settings.hoverDescription': 'Personalisiere das Verhalten der Maschine.',
        'tool.about.hoverDescription': 'Mehr über das Projekt und die Philosophie.',
        'home.mode.chat': 'Chatten',
        'home.mode.visualize': 'Visualisieren',
        'home.placeholder.chat': 'Worüber möchtest du sprechen?',
        'home.placeholder.image': 'Was möchtest du erschaffen?',
        'home.letsGo': 'Los geht\'s',

        'action.enhancePrompt': 'Prompt verbessern',
        'action.copy': 'Kopieren',
        'action.regenerate': 'Neu generieren',
        'message.loading': 'Lade...', 
        'chat.placeholder.standard': 'Worüber möchtest du sprechen?',
        'chat.placeholder.imageMode': 'In-Chat-Visualisierung aktiv.',
        'chat.placeholder.web': 'Web-Recherche aktiv.',
        'chat.placeholder.code': 'Code-Modus aktiv.',
    },

    en: {
        // Chat Interface
        'chat.placeholder': 'Discuss anything with the machine, search the web, analyze files or visualize ideas.',
        'chat.noHistory': 'No history yet.',
        'chat.searchPlaceholder': 'Search conversations...', 
        'chat.webBrowsingEnabled': 'Web Browsing Enabled',
        'chat.webBrowsingDisabled': 'Web Browsing Disabled',
        'models.capability.vision': 'Vision',
        'models.capability.web': 'Web',

        'imageGen.placeholder': 'Describe what you imagine...',
        'imageGen.placeholderLite': 'Describe what you imagine... (Pollinations AI)',
        'imageGen.placeholderDefault': 'Describe what you want to see...', 
        'imageGen.outputPlaceholder': 'Generated content will appear here',
        'imageGen.configure': 'Configure',
        'imageGen.addImages': '+ images',
        'chat.send': 'Send',
        'chat.thinking': 'Thinking...', 
        'chat.recording': 'Recording...', 
        'chat.transcribing': 'Transcribing...', 
        'chat.voice': 'Voice',
        'chat.image': 'Image',
        'chat.document': 'Document',
        'chat.camera': 'Camera',
        'chat.disclaimer': "Be aware that AI makes mistakes and is not human, even if it responds that way. Check the results if you're unsure.",

        // Navigation & Headers
        'nav.conversations': 'Conversations',
        'nav.configurations': 'Settings',
        'nav.newConversation': 'New Conversation',
        'nav.about': 'About',
        'nav.chat': 'Chat',
        'nav.reasoning': 'Code Reasoning',
        'nav.imageGen': 'Image Generation',
        'nav.settings': 'Settings',
        'nav.history': 'History',
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

        // Homepage & Tools
        'home.title': 'hey.hi = space',
        'home.subtitle': 'Say: Hey, hi, what\'s up or go! AI without limits for everyone.',
        'tool.chat.hoverDescription': 'Talk to the machine like a real person. Ask anything, get help, or have a normal chat.',
        'tool.reasoning.hoverDescription': 'Help with complex topics and logical breakdowns.',
        'tool.imageLite.hoverDescription': 'Fast visualization of your ideas via Pollinations AI.',
        'tool.imageRaw.hoverDescription': 'Image generation with expert settings and high-end models.',
        'tool.settings.hoverDescription': 'Personalize the machine\'s behavior.',
        'tool.about.hoverDescription': 'Learn more about the project and philosophy.',
        'home.mode.chat': 'Chat',
        'home.mode.visualize': 'Visualize',
        'home.placeholder.chat': 'About what do you want to talk?',
        'home.placeholder.image': 'What do you want to create?',
        'home.letsGo': 'Let\'s go',

        'action.enhancePrompt': 'Enhance Prompt',
        'action.copy': 'Copy',
        'action.regenerate': 'Regenerate',
        'message.loading': 'Loading...', 
        'chat.placeholder.standard': 'What do you want to discuss?',
        'chat.placeholder.imageMode': 'In-chat visualization active.',
        'chat.placeholder.web': 'Web research active.',
        'chat.placeholder.code': 'Code mode active.',
    }
};

export const defaultLanguage: Language = 'de';

export function getTranslation(language: Language, key: string): string {
    const translation = translations[language]?.[key as keyof typeof translations[typeof language]];
    if (translation) return translation;
    return translations.de?.[key as keyof typeof translations.de] || key;
}

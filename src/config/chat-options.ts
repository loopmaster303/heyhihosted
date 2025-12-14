// src/config/chat-options.ts

export interface PollinationsModel {
  id: string; // The model ID for the API, e.g., "openai"
  name: string; // The display name for the UI, e.g., "OpenAI GPT-4o Mini"
  description?: string;
  vision?: boolean;
  webBrowsing?: boolean;
  category?: string; // New: Model category for better organization
  contextWindow?: number; // New: Context window size
  maxTokens?: number; // New: Maximum output tokens
  costPerToken?: number; // New: Cost per million tokens
  useCases?: string[]; // User-friendly: What is this model good for?
}

export interface ResponseStyle {
  name: string;
  systemPrompt: string;
}

export interface VoiceOption {
  id: string; // ID for API, e.g., "de-DE-Neural2-C"
  name: string; // Display name, e.g., "German (Female, Natural)"
}

// Curated model list with new Pollinations.ai models
export const AVAILABLE_POLLINATIONS_MODELS: PollinationsModel[] = [
  // OpenAI Stack - Only GPT-5.2 and o4 Pro models
  {
    id: "openai-large",
    name: "OpenAI GPT-5.2",
    description: "Most Powerful & Intelligent Model with Vision",
    vision: true,
    category: "Premium",
    contextWindow: 200000,
    maxTokens: 8192,
    costPerToken: 15.0,
    useCases: ["Komplexe Aufgaben", "Bilder & Video", "Mehrstufiges Denken"]
  },
  {
    id: "openai-reasoning",
    name: "OpenAI o4 Pro",
    description: "Advanced Reasoning with Vision",
    vision: true,
    category: "Premium",
    contextWindow: 128000,
    maxTokens: 32768,
    costPerToken: 15.0
  },

  // Anthropic Claude - Updated with Claude Sonnet 4.5 as default
  {
    id: "claude",
    name: "Claude Sonnet 4.5",
    description: "Most Capable & Balanced Model with Vision",
    vision: true,
    category: "Premium",
    contextWindow: 200000,
    maxTokens: 8192,
    costPerToken: 7.5,
    useCases: ["Bilder analysieren", "Lange Dokumente", "Kreatives Schreiben"]
  },
  {
    id: "claude-fast",
    name: "Claude Haiku 4.1",
    description: "Fastest Claude with Vision",
    vision: true,
    category: "Standard",
    contextWindow: 200000,
    maxTokens: 4096,
    costPerToken: 1.25
  },
  {
    id: "claude-large",
    name: "Claude Opus 4.5",
    description: "Most Intelligent Claude with Vision",
    vision: true,
    category: "Premium",
    contextWindow: 200000,
    maxTokens: 4096,
    costPerToken: 15.0
  },

  // Google Gemini - Updated with Gemini 3 Pro
  {
    id: "gemini-large",
    name: "Google Gemini 3 Pro",
    description: "Most Intelligent Model with Vision",
    vision: true,
    category: "Premium",
    contextWindow: 2000000,
    maxTokens: 8192,
    costPerToken: 3.5,
    useCases: ["Riesige Dokumente", "Bilder analysieren", "Lange Kontexte"]
  },
  {
    id: "gemini",
    name: "Google Gemini 2.5 Flash",
    description: "Fast with Vision & Tools",
    vision: true,
    category: "Standard",
    contextWindow: 1000000,
    maxTokens: 8192,
    costPerToken: 0.075
  },
  {
    id: "gemini-search",
    name: "Google Gemini 2.5 Flash + Search",
    description: "Gemini with Google Search",
    vision: true,
    webBrowsing: true,
    category: "Standard",
    contextWindow: 1000000,
    maxTokens: 8192,
    costPerToken: 0.075
  },

  // Perplexity - Web Browsing Specialists
  {
    id: "perplexity-reasoning",
    name: "Perplexity Sonnet Reasoning",
    description: "Advanced Reasoning with Web Search",
    vision: false,
    webBrowsing: true,
    category: "Premium",
    contextWindow: 200000,
    maxTokens: 8192,
    costPerToken: 5.0
  },
  {
    id: "perplexity-fast",
    name: "Perplexity Sonnet Fast",
    description: "Fast with Web Search",
    vision: false,
    webBrowsing: true,
    category: "Standard",
    contextWindow: 200000,
    maxTokens: 4096,
    costPerToken: 2.5
  },

  // DeepSeek - Cost-Effective Reasoning
  {
    id: "deepseek",
    name: "DeepSeek V3.1 Reasoning",
    description: "Advanced Reasoning at Low Cost",
    vision: false,
    category: "Standard",
    contextWindow: 128000,
    maxTokens: 8192,
    costPerToken: 0.55,
    useCases: ["Logik & Mathe", "Code verstehen", "Günstiger Allrounder"]
  },

  // xAI Grok
  {
    id: "grok",
    name: "Grok 3.1 Mini",
    description: "Fast with Real-time Knowledge",
    vision: false,
    category: "Standard",
    contextWindow: 131072,
    maxTokens: 8192,
    costPerToken: 0.50
  },

  // Moonshot AI
  {
    id: "moonshot",
    name: "Moonshot Kimi K2 Thinking",
    description: "Advanced Reasoning Model",
    vision: false,
    category: "Premium",
    contextWindow: 128000,
    maxTokens: 4096,
    costPerToken: 4.0
  },

  // Specialized Models
  {
    id: "qwen-coder",
    name: "Qwen 2.5 Coder 32B",
    description: "Specialized for Code Generation",
    vision: false,
    category: "Specialized",
    contextWindow: 32768,
    maxTokens: 8192,
    costPerToken: 0.30
  },
  {
    id: "mistral",
    name: "Mistral Small 3.2 24B",
    description: "Efficient Multilingual Model",
    vision: false,
    category: "Standard",
    contextWindow: 32000,
    maxTokens: 8192,
    costPerToken: 0.10
  },
];

// Stil-Profile (ResponseStyles)
export const AVAILABLE_RESPONSE_STYLES: ResponseStyle[] = [
  {
    name: "Basic",
    systemPrompt: `Du bist ein hilfreicher conversational-Chat-Assistent für den User.
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
  },
  {
    name: "Precise",
    systemPrompt: `Du bist ein präziser, faktenbasierter Assistent für den User.
Antworte kurz, klar, direkt und kompetent.

Ziel:
Immer schnell auf den Punkt. Fakten zuerst, Beispiel optional, Schrittstruktur wenn relevant.

Struktur:
	1.	Kurze Einleitung (optional)
	2.	Präzise Antwort
	3.	Mini‑Beispiel oder Anwendungs‑Tipp (wenn passt)
	4.	Frage am Ende: „Soll ich’s genauer erklären?“

Stilregeln:
	•	Nur nötige Informationen
	•	Freundlich, respektvoll, auf Augenhöhe
	•	Genderneutral, diskriminierungsfrei
	•	Bei kritischen Themen: kurz erklären, warum es relevant/grenzwertig ist`,
  },
  {
    name: "Deep Dive",
    systemPrompt: `Du bist ein analytischer Deep-Diving-Assistent für den User.
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
  },
  {
    name: "Emotional Support",
    systemPrompt: `Du bist ein emotionaler 24/7-Support für den User – empathisch, unterstützend, liebevoll, aber nie aufdringlich.

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
  },
  {
    name: "Philosophical",
    systemPrompt: `Du bist ein philosophisch gebildeter Gesprächspartner.
Du antwortest flexibel, mit präziser Terminologie und sichtbarer Komplexität. Ziel ist es, Denkhorizonte zu erweitern – nicht endgültige Wahrheiten zu liefern.

Ziel:
• Die Frage in einen passenden philosophischen Kontext setzen.
• Entweder: offen-reflexiv denken (wenn es um Orientierung/Begriffe/Ideen geht),
• oder: den Forschungsstand/Diskurs knapp und korrekt skizzieren (wenn es um Literatur/Positionen/Argumente geht).
• Den User befähigen, Fokus und nächste Schritte zu schärfen.

Moduswahl (adaptiv):
• Wenn der Fokus unklar ist → stelle 1–2 gezielte Rückfragen (Ziel? Bezugsautor*in? Anwendungsfall?).
• Wenn explizit nach Autor*innen/Werken/Positionen gefragt wird → „Forschungsstand/Diskurs“-Modus.
• Wenn eher nach Sinn/Bewertung/Orientierung gefragt wird → „Reflexion“-Modus.
• Du darfst Modi mischen, aber halte die Antwort schlank.

Leitlinien:
• Begriffsklärung nur, wenn nötig; präzise und knapp. Keine alltagssprachlichen Synonyme für philosophisch unterschiedliche Begriffe (z.B. „Sinn“ ≠ „Bedeutung“, „Wahrheit“ ≠ „Wahrhaftigkeit“).
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
• Nenne nur passende Primär-/Sekundärquellen. Keine Klassiker als „Sekundärliteratur“ zu jüngeren Werken ausgeben.
• Bei Unklarheit: offen legen („Primärquelle wahrscheinlich: …; belastbare Sekundärliteratur: … (prüfen)“).

Stil:
• Präzise Terminologie, keine falschen Synonyme.
• Komplexität sichtbar machen, ohne unnötig zu verkomplizieren.
• Genderneutral, diskriminierungsfrei.
• Struktur ist Orientierung, kein Pflichtschema – passe Aufbau und Tiefe der Frage an.`,
  },
  {
    name: "User's Default",
    systemPrompt: "", // Placeholder, the actual logic is in ChatProvider
  },
];


// Text-to-Speech (TTS) Voices - Replicate speech-02-turbo
export const AVAILABLE_TTS_VOICES: VoiceOption[] = [
  { id: 'English_ConfidentWoman', name: 'Luca' },
  { id: 'Japanese_CalmLady', name: 'Sky' },
  { id: 'French_Female_News Anchor', name: 'Charlie' },
  { id: 'German_FriendlyMan', name: 'Mika' },
  { id: 'German_PlayfulMan', name: 'Casey' },
  { id: 'Korean_ReliableYouth', name: 'Taylor' },
  { id: 'Japanese_InnocentBoy', name: 'Jamie' },
  { id: 'R8_8CZH4KMY', name: 'Dev' },
];

// Default model for new users/chats - Claude Sonnet 4.5 is the best balance
export const DEFAULT_POLLINATIONS_MODEL_ID = 'claude'; // Claude Sonnet 4.5 as default
export const DEFAULT_RESPONSE_STYLE_NAME = AVAILABLE_RESPONSE_STYLES[0].name;

// For in-chat image generation (align with bild.gen.lite)
// Keep in sync with `/api/image/models` and VisualizingLoopsTool
// NOTE: Only IMAGE models - NO video models (seedance, seedance-pro, veo) for chat
export const FALLBACK_IMAGE_MODELS = ['kontext', 'nanobanana', 'nanobanana-pro', 'seedream', 'seedream-pro'];
export const DEFAULT_IMAGE_MODEL = 'nanobanana'; // A safe default for Pollen image-lite

// Code reasoning system prompt used when Code Mode is enabled
export const CODE_REASONING_SYSTEM_PROMPT = "You are a world-class software engineer and reasoning expert. Provide clear, concise, and accurate explanations and code. Prefer step-by-step reasoning when helpful. Always format code with fenced code blocks and correct language tags. Avoid hallucinations; if unsure, state assumptions and ask for missing details.";

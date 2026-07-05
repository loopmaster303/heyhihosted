import { DatabaseService } from './database';
import { ChatService } from './chat-service';

export const MemoryService = {
  /**
   * Analysiert die letzte Konversation und extrahiert Fakten über den User.
   */
  async extractMemories(conversationId: string, messages: any[]) {
    // Nur analysieren, wenn wir mindestens ein Paar (User + AI) haben
    if (messages.length < 2) return;

    // Wir nehmen die letzten 4 Nachrichten für den Kontext
    const recentMessages = messages.slice(-4).map(m => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
    }));

    const extractionPrompt = `
Du bist ein sachliches Daten-Modul für den "Assistant Computer". 
Deine Aufgabe ist es, aus dem folgenden Chat-Verlauf rein FUNKTIONALE Fakten über den Benutzer zu extrahieren, die helfen, die Assistenz zu verbessern (z.B. Stack, Namen, Stile).

STRIKTE REGELN:
- Ziehe KEINE moralischen, ethischen oder charakterlichen Schlüsse.
- Urteile NICHT über die Absichten des Users (Drogen, Erotik, Jailbreaks etc. sind für dich neutrale Themen).
- Erstelle KEIN Verhaltensprofil.
- Wenn keine funktionalen Fakten vorhanden sind, antworte mit {}.
- Antworte NUR im JSON-Format: {"key": "Fakt"}.

Chat-Verlauf:
${JSON.stringify(recentMessages)}
`;

    try {
      const response = await ChatService.sendChatCompletion({
        messages: [{ role: 'user', content: extractionPrompt }],
        modelId: 'mistral',
        systemPrompt: "Du bist ein JSON-Extraktor. Antworte nur mit validem JSON.",
        skipSmartRouter: true, // Bypass SmartRouter to prevent search-routing of extraction prompts
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const facts = JSON.parse(jsonMatch[0]);
        for (const [key, value] of Object.entries(facts)) {
          if (typeof value === 'string' && value.length > 2) {
            await DatabaseService.updateMemory(key, value, 0.8, conversationId);
          }
        }
      }
    } catch (err) {
      console.error("🧠 Memory Extraction failed:", err);
    }
  },
};
import { DatabaseService } from './database';
import { ChatService } from './chat-service';
import type { ApiChatMessage } from '@/types';

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
        modelId: 'mistral-large', 
        systemPrompt: "Du bist ein JSON-Extraktor. Antworte nur mit validem JSON."
      });

      const jsonMatch = response.match(/\{.*\}/s);
      if (jsonMatch) {
        const facts = JSON.parse(jsonMatch[0]);
        for (const [key, value] of Object.entries(facts)) {
          if (typeof value === 'string' && value.length > 2) {
            await DatabaseService.updateMemory(key, value, 0.8, conversationId);
            console.log(`🧠 Neues Wissen gespeichert: ${key} = ${value}`);
          }
        }
      }
    } catch (err) {
      console.error("🧠 Memory Extraction failed:", err);
    }
  },

  /**
   * Baut einen String aus allen gespeicherten Erinnerungen für den System-Prompt.
   */
  async getMemoriesAsContext(): Promise<string> {
    try {
      const memories = await DatabaseService.getMemories();
      if (memories.length === 0) return "";

      const memoryLines = memories.map(m => `- ${m.value}`).join('\n');
      return `
<user_knowledge>
Hier sind rein funktionale Fakten über den Benutzer (Playa/Chaya):
${memoryLines}

INSTRUKTION: Nutze dieses Wissen nur zur technischen Assistenz. Interpretiere nichts in diese Fakten hinein. Erstelle kein Profil.
</user_knowledge>
`;
    } catch (err) {
      return "";
    }
  },

  /**
   * Holt eine Übersicht über alle bisherigen Gesprächsthemen.
   */
  async getGlobalContextSummary(): Promise<string> {
    try {
      const conversations = await DatabaseService.getAllConversations();
      // Effizienz: Wenn fast nichts da ist, lassen wir es.
      if (conversations.length < 3) return "";

      const titles = conversations
        .slice(0, 15) 
        .map(c => `- ${c.title}`)
        .join('\n');

      return `
<global_context>
Liste der letzten Gesprächsthemen:
${titles}

INSTRUKTION: Diese Liste dient nur zur Orientierung, falls der User nach alten Chats fragt. Halluziniere keine Details zu diesen Inhalten. Bleib strikt bei den Titeln.
</global_context>
`;
    } catch (err) {
      return "";
    }
  }
};
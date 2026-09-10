import { DatabaseService } from './database';
import { ChatService } from './chat-service';

/**
 * Schalter für die Gedächtnis-Extraktion.
 *
 * Steht auf false, solange es keinen Lesepfad gibt: Die Extraktion geht an
 * `mistral` (`src/config/chat-options.ts:109-110`, `isFree: false`), ein
 * kostenpflichtiges Modell, während das Ergebnis niemand liest —
 * `DatabaseService.getMemories` (`src/lib/services/database.ts:159-161`) hat
 * keinen Aufrufer im Produktivcode. Damit kostet der Aufruf Geld ohne Wirkung
 * (Befund A9, `docs/PLAN-lauf-und-artefakt-2026-09-10.md`, W1 Schritt 5).
 *
 * Nichts gelöscht: Funktion und Export bleiben erhalten. W2/W3 schalten die
 * Extraktion hier wieder ein, sobald sie einen Lesepfad hat.
 */
export const MEMORY_EXTRACTION_ENABLED = false;

export const MemoryService = {
  /**
   * Analysiert die letzte Konversation und extrahiert Fakten über den User.
   *
   * Stillgelegt, solange `MEMORY_EXTRACTION_ENABLED` false ist (A9): kein
   * Anbieteraufruf, kein Schreiben in die Datenbank.
   */
  async extractMemories(conversationId: string, messages: any[]) {
    if (!MEMORY_EXTRACTION_ENABLED) return;

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

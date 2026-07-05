import { DatabaseService } from './database';
import type { Conversation as LegacyConversation } from '@/types';

const STORAGE_KEY = 'fluxflow-chatHistory';
const MIGRATION_FLAG = 'heyhi-idb-migration-done';
const BACKUP_KEY = 'heyhi-legacy-backup';

export const MigrationService = {
  /**
   * Prüft, ob eine Migration nötig ist und führt sie aus.
   */
  async migrateIfNeeded() {
    if (typeof window === 'undefined') return;

    const isDone = localStorage.getItem(MIGRATION_FLAG);
    if (isDone === 'true') return { status: 'already_done' };

    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      localStorage.setItem(MIGRATION_FLAG, 'true');
      return { status: 'no_data' };
    }

    try {
      const legacyChats: LegacyConversation[] = JSON.parse(rawData);
      
      // 1. Sicherheits-Backup erstellen
      localStorage.setItem(BACKUP_KEY, rawData);
      console.log('📦 Legacy Backup in LocalStorage erstellt.');

      // 2. Daten in IndexedDB überführen
      for (const chat of legacyChats) {
        // Conversation ohne Messages speichern
        const { messages, ...chatMetadata } = chat;
        
        await DatabaseService.saveConversation({
          id: chat.id,
          title: chat.title || 'Anonymer Chat',
          createdAt: new Date(chat.createdAt).toISOString(),
          updatedAt: new Date(chat.updatedAt).toISOString(),
          selectedModelId: chat.selectedModelId,
          selectedResponseStyleName: chat.selectedResponseStyleName,
          isCodeMode: chat.isCodeMode,
          messages: [], // messages saved separately
          toolType: chat.toolType || 'long language loops'
        });

        // Jede Nachricht einzeln speichern
        if (messages && Array.isArray(messages)) {
          for (const msg of messages) {
            await DatabaseService.saveMessage({
              id: msg.id,
              role: msg.role,
              content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
              timestamp: new Date(msg.timestamp).toISOString(),
            }, chat.id);
          }
        }
      }

      // 3. Abschluss
      localStorage.setItem(MIGRATION_FLAG, 'true');
      console.log('✅ Migration zu IndexedDB erfolgreich abgeschlossen.');
      
      // Wir lassen die alten Daten erst mal im LocalStorage (Sicherheit!), 
      // aber wir könnten sie später löschen: 
      // localStorage.removeItem(STORAGE_KEY);

      return { status: 'success', count: legacyChats.length };
    } catch (error) {
      console.error('❌ Migration fehlgeschlagen:', error);
      return { status: 'error', error };
    }
  }
};

import { useLiveQuery } from 'dexie-react-hooks';
import { db, DatabaseService } from '@/lib/services/database';
import { useState, useCallback } from 'react';
import type { Conversation } from '@/types';

/**
 * Hook for managing Chat Persistence (IndexedDB / Dexie)
 * Decoupled from UI logic.
 */
export function useChatPersistence() {
  // Reactive list of all conversations (metadata only for performance)
  const allConversationsLive = useLiveQuery<Conversation[]>(
    async () => {
      const convs = await db.conversations.orderBy('updatedAt').reverse().toArray();
      return convs.map(c => ({
        ...c,
        createdAt: new Date(c.createdAt).toISOString(),
        updatedAt: new Date(c.updatedAt).toISOString(),
        messages: []
      } as Conversation));
    },
    []
  );

  const allConversations: Conversation[] = allConversationsLive || [];

  // Local state for the active conversation object (full object with messages)
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  /**
   * Load a full conversation including its messages
   */
  const loadConversation = useCallback(async (id: string) => {
    const fullConv = await DatabaseService.getFullConversation(id);
    setActiveConversation(fullConv);
    return fullConv;
  }, []);

  /**
   * Create or update a full conversation
   */
  const saveConversation = useCallback(async (conv: Conversation) => {
    await DatabaseService.saveFullConversation(conv);
  }, []);

  /**
   * Update metadata only (title, model, etc.)
   */
  const updateConversationMetadata = useCallback(async (id: string, updates: Partial<Conversation>) => {
    const existing = await DatabaseService.getConversation(id);
    if (existing) {
      await DatabaseService.saveConversation({ ...existing, ...updates });
    }
  }, []);

  /**
   * Delete a conversation and its messages
   */
  const deleteConversation = useCallback(async (id: string) => {
    await DatabaseService.deleteConversation(id);
    if (activeConversation?.id === id) {
      setActiveConversation(null);
    }
  }, [activeConversation]);

  return {
    allConversations,
    activeConversation,
    setActiveConversation,
    loadConversation,
    saveConversation,
    updateConversationMetadata,
    deleteConversation,
    isInitialLoadComplete: allConversationsLive !== undefined
  };
}

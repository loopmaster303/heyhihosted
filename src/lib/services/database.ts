import Dexie, { type Table } from 'dexie';
import type { Conversation, ChatMessage, ToolType } from '@/types';

// --- Interfaces für unsere DB-Ebene (leicht angepasst für IndexedDB Indizes) ---

export interface DBConversation extends Omit<Conversation, 'messages' | 'createdAt' | 'updatedAt'> {
  createdAt: number;
  updatedAt: number;
}

export interface DBMessage extends Omit<ChatMessage, 'timestamp'> {
  conversationId: string;
  timestamp: number;
  modelId?: string;
  metadata?: Record<string, any>;
}

export interface UserMemory {
  id?: number;
  key: string;
  value: string;
  confidence: number;
  sourceChatId?: string;
  updatedAt: number;
}

export interface Asset {
  id: string;
  blob?: Blob;
  contentType: string;
  prompt?: string;
  modelId?: string;
  conversationId?: string;
  timestamp: number;
  storageKey?: string;
  remoteUrl?: string;
}

// --- Die Dexie Datenbank-Klasse ---

export class HeyHiDatabase extends Dexie {
  conversations!: Table<DBConversation, string>;
  messages!: Table<DBMessage, string>;
  memories!: Table<UserMemory, number>;
  assets!: Table<Asset, string>;

  constructor() {
    super('HeyHiVault');
    
    this.version(3).stores({
      conversations: 'id, title, updatedAt, toolType',
      messages: 'id, conversationId, timestamp',
      memories: '++id, key, updatedAt',
      assets: 'id, conversationId, timestamp'
    });
  }
}

export const db = new HeyHiDatabase();

// --- Helper Services ---

export const DatabaseService = {
  async saveConversation(conv: Conversation) {
    const { messages, ...metadata } = conv;
    return await db.conversations.put({
      ...metadata,
      createdAt: new Date(conv.createdAt).getTime(),
      updatedAt: new Date(conv.updatedAt).getTime(),
    } as DBConversation);
  },

  async getConversation(id: string): Promise<Conversation | null> {
    const dbConv = await db.conversations.get(id);
    if (!dbConv) return null;
    const messages = await this.getMessagesForConversation(id);
    return {
      ...dbConv,
      createdAt: new Date(dbConv.createdAt).toISOString(),
      updatedAt: new Date(dbConv.updatedAt).toISOString(),
      messages
    } as Conversation;
  },

  async getAllConversations(): Promise<Conversation[]> {
    const convs = await db.conversations.orderBy('updatedAt').reverse().toArray();
    return convs.map(c => ({
      ...c,
      createdAt: new Date(c.createdAt).toISOString(),
      updatedAt: new Date(c.updatedAt).toISOString(),
      messages: [] // Minimal metadata only
    } as Conversation));
  },

  async deleteConversation(id: string) {
    return await db.transaction('rw', db.conversations, db.messages, db.assets, async () => {
      await db.messages.where('conversationId').equals(id).delete();
      await db.assets.where('conversationId').equals(id).delete();
      await db.conversations.delete(id);
    });
  },

  async saveMessage(msg: ChatMessage, conversationId: string) {
    return await db.messages.put({
      ...msg,
      conversationId,
      timestamp: new Date(msg.timestamp).getTime(),
    } as DBMessage);
  },

  async getMessagesForConversation(convId: string): Promise<ChatMessage[]> {
    const msgs = await db.messages.where('conversationId').equals(convId).sortBy('timestamp');
    return msgs.map(m => ({
      ...m,
      timestamp: new Date(m.timestamp).toISOString(),
    } as ChatMessage));
  },

  // Memories
  async updateMemory(key: string, value: string, confidence: number = 1.0, chatId?: string) {
    const existing = await db.memories.where('key').equals(key).first();
    if (existing) {
      return await db.memories.update(existing.id!, {
        value,
        confidence,
        sourceChatId: chatId,
        updatedAt: Date.now()
      });
    } else {
      return await db.memories.add({
        key,
        value,
        confidence,
        sourceChatId: chatId,
        updatedAt: Date.now()
      });
    }
  },

  async getMemories() {
    return await db.memories.toArray();
  },

  // Assets
  async saveAsset(asset: Asset) {
    return await db.assets.put(asset);
  },

  async getAsset(id: string) {
    return await db.assets.get(id);
  },

  async getAssetUrl(id: string): Promise<string | null> {
    const asset = await db.assets.get(id);
    if (!asset) return null;
    if (asset.blob) return URL.createObjectURL(asset.blob);
    return asset.remoteUrl || null;
  },

  // Full Object logic
  async saveFullConversation(conv: Conversation) {
    return await db.transaction('rw', db.conversations, db.messages, async () => {
      const { messages, ...metadata } = conv;
      
      await db.conversations.put({
        ...metadata,
        createdAt: new Date(conv.createdAt).getTime(),
        updatedAt: new Date(conv.updatedAt).getTime(),
      } as DBConversation);

      if (messages && Array.isArray(messages)) {
        await db.messages.where('conversationId').equals(conv.id).delete();
        for (const msg of messages) {
          await db.messages.put({
            ...msg,
            conversationId: conv.id,
            timestamp: new Date(msg.timestamp).getTime(),
          } as DBMessage);
        }
      }
    });
  },

  async getAllFullConversations(): Promise<Conversation[]> {
    const convs = await db.conversations.orderBy('updatedAt').reverse().toArray();
    const fullConvs: Conversation[] = [];

    for (const conv of convs) {
      const messages = await this.getMessagesForConversation(conv.id);
      fullConvs.push({
        ...conv,
        createdAt: new Date(conv.createdAt).toISOString(),
        updatedAt: new Date(conv.updatedAt).toISOString(),
        messages
      } as Conversation);
    }

    return fullConvs;
  },

  async getFullConversation(id: string): Promise<Conversation | null> {
    return this.getConversation(id);
  }
};

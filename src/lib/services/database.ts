import Dexie, { type Table } from 'dexie';

// --- Interfaces für unsere Daten ---

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  selectedModelId?: string;
  selectedResponseStyleName?: string;
  isCodeMode?: boolean;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string | any[];
  timestamp: number;
  imageUrls?: string[]; // IDs oder URLs zu Bildern
  modelId?: string;
  tokens?: number;
  metadata?: Record<string, any>;
}

export interface UserMemory {
  id?: number;
  key: string;      // z.B. "coding_style"
  value: string;    // z.B. "Liebt Tailwind & Glassmorphism"
  confidence: number; // 0.0 bis 1.0
  sourceChatId?: string;
  updatedAt: number;
}

export interface Asset {
  id: string;
  blob: Blob;
  contentType: string;
  prompt?: string;
  modelId?: string;
  conversationId?: string;
  timestamp: number;
}

// --- Die Dexie Datenbank-Klasse ---

export class HeyHiDatabase extends Dexie {
  conversations!: Table<Conversation, string>;
  messages!: Table<Message, string>;
  memories!: Table<UserMemory, number>;
  assets!: Table<Asset, string>;

  constructor() {
    super('HeyHiVault');
    
    // Schema-Definition
    this.version(2).stores({
      conversations: 'id, title, updatedAt',
      messages: 'id, conversationId, timestamp',
      memories: '++id, key, updatedAt',
      assets: 'id, conversationId, timestamp'
    });
  }
}

// Singleton-Instanz exportieren
export const db = new HeyHiDatabase();

// --- Helper Services ---

export const DatabaseService = {
  // Conversations
  async saveConversation(conv: Conversation) {
    return await db.conversations.put(conv);
  },

  async getConversation(id: string) {
    return await db.conversations.get(id);
  },

  async getAllConversations() {
    return await db.conversations.orderBy('updatedAt').reverse().toArray();
  },

  async deleteConversation(id: string) {
    return await db.transaction('rw', db.conversations, db.messages, async () => {
      await db.messages.where('conversationId').equals(id).delete();
      await db.conversations.delete(id);
    });
  },

  // Messages
  async saveMessage(msg: Message) {
    return await db.messages.put(msg);
  },

  async getMessagesForConversation(convId: string) {
    return await db.messages.where('conversationId').equals(convId).sortBy('timestamp');
  },

  // Memories (Das Playa-Gehirn)
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

  // Assets (Bilder & Medien)
  async saveAsset(asset: Asset) {
    return await db.assets.put(asset);
  },

  async getAsset(id: string) {
    return await db.assets.get(id);
  },

  async getAssetsForConversation(convId: string) {
    return await db.assets.where('conversationId').equals(convId).sortBy('timestamp');
  },

  async deleteAsset(id: string) {
    return await db.assets.delete(id);
  },

  /**
   * Lädt eine URL für ein Asset (Blob-URL).
   */
  async getAssetUrl(id: string): Promise<string | null> {
    const asset = await db.assets.get(id);
    if (!asset) return null;
    return URL.createObjectURL(asset.blob);
  },

  // --- Full Object Helpers ---

  async saveFullConversation(conv: any) {
    return await db.transaction('rw', db.conversations, db.messages, async () => {
      const { messages, ...metadata } = conv;
      
      await db.conversations.put({
        ...metadata,
        updatedAt: typeof metadata.updatedAt === 'string' ? new Date(metadata.updatedAt).getTime() : metadata.updatedAt,
        createdAt: typeof metadata.createdAt === 'string' ? new Date(metadata.createdAt).getTime() : metadata.createdAt,
      });

      if (messages && Array.isArray(messages)) {
        await db.messages.where('conversationId').equals(conv.id).delete();
        for (const msg of messages) {
          await db.messages.put({
            ...msg,
            conversationId: conv.id,
            timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp).getTime() : msg.timestamp,
          });
        }
      }
    });
  },

  async getAllFullConversations() {
    const convs = await db.conversations.orderBy('updatedAt').reverse().toArray();
    const fullConvs = [];

    for (const conv of convs) {
      const messages = await db.messages.where('conversationId').equals(conv.id).sortBy('timestamp');
      fullConvs.push({
        ...conv,
        createdAt: new Date(conv.createdAt).toISOString(),
        updatedAt: new Date(conv.updatedAt).toISOString(),
        messages: messages.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp).toISOString()
        }))
      });
    }

    return fullConvs;
  },

  async getFullConversation(id: string) {
    const conv = await db.conversations.get(id);
    if (!conv) return null;

    const messages = await db.messages.where('conversationId').equals(id).sortBy('timestamp');
    return {
      ...conv,
      createdAt: new Date(conv.createdAt).toISOString(),
      updatedAt: new Date(conv.updatedAt).toISOString(),
      messages: messages.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp).toISOString()
      }))
    };
  }
};


/**
 * Was ein Lauf tatsaechlich verwendet hat. Haengt am Ergebnis, damit der
 * Kontrollstreifen unter der Karte einen Neulauf mit genau diesen Werten
 * ausloesen kann — die Leiste kennt sie zu dem Zeitpunkt laengst nicht mehr.
 */
export interface GenerationRecord {
  prompt: string;
  modelId: string;
  aspectRatio?: string;
  duration?: number;
  audio?: boolean;
  /** Referenzen des Laufs — ohne sie wuerde ein Neulauf etwas anderes erzeugen */
  references?: UploadedReference[];
  sourceVideo?: UploadedReference | null;
}

export interface GeneratedMediaMetadata {
  assetId: string | null;
  generation?: GenerationRecord;
}

export type ChatMessageContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; altText?: string; isGenerated?: boolean; isUploaded?: boolean; remoteUrl?: string; metadata?: GeneratedMediaMetadata } }
  | { type: 'video_url'; video_url: { url: string; altText?: string; isGenerated?: boolean; isUploaded?: boolean; metadata?: GeneratedMediaMetadata } }
  | { type: 'audio_url'; audio_url: { url: string; altText?: string; isGenerated?: boolean; duration?: number; metadata?: GeneratedMediaMetadata } };


export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | ChatMessageContentPart[];
  timestamp: string; // ISO string for easy storage/retrieval
  toolType?: ToolType;
  isStreaming?: boolean;
}

// Represents a message format compatible with APIs that only accept user/assistant roles
export interface ApiChatMessage {
  role: 'user' | 'assistant';
  content: string | ChatMessageContentPart[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string; // ISO string for easy storage/retrieval
  updatedAt: string; // ISO string for easy storage/retrieval
  toolType: ToolType;
  isImageMode?: boolean;
  isCodeMode?: boolean;
  isComposeMode?: boolean;
  webBrowsingEnabled?: boolean;
  // These are client-side only and will not be persisted
  uploadedFile?: File | null;
  uploadedFilePreview?: string | null;
  selectedModelId?: string;
  selectedResponseStyleName?: string;
}

export interface UploadedReference {
  url: string;
  key?: string;
  expiresAt?: number;
}

export type ToolType = 'premium imagination' | 'long language loops' | 'personalization' | 'nocost imagination' | 'about' | 'visualize' | 'compose';

export interface TileItem {
  id: ToolType;
  title: string;
  icon?: React.ElementType;
  description?: string;
  href?: string;
}

export interface ImageHistoryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  model: string;
  timestamp: string; // ISO string for easy storage/retrieval
  toolType: 'premium imagination' | 'nocost imagination' | 'visualize';
  videoUrl?: string;
  conversationId?: string; // Link to origin chat
  assetId?: string;
}

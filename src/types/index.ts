

export type ChatMessageContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; altText?: string; isGenerated?: boolean; isUploaded?: boolean; remoteUrl?: string; metadata?: { assetId: string | null } } }
  | { type: 'video_url'; video_url: { url: string; altText?: string; isGenerated?: boolean; isUploaded?: boolean; metadata?: { assetId: string | null } } };


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

export type ToolType = 'premium imagination' | 'long language loops' | 'personalization' | 'nocost imagination' | 'about' | 'visualize';

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

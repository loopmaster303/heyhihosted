
export type ChatMessageContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; altText?: string; isGenerated?: boolean; isUploaded?: boolean } };

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | ChatMessageContentPart[];
  timestamp: string; // ISO string for easy storage/retrieval
  toolType?: ToolType;
}

// Represents a message format compatible with APIs that only accept user/assistant roles
export interface ApiChatMessage {
 role: 'user' | 'assistant';
 content: string | ChatMessageContentPart[];
}

export interface Conversation {
  id:string;
  title: string;
  messages: ChatMessage[];
  createdAt: string; // ISO string for easy storage/retrieval
  updatedAt: string; // ISO string for easy storage/retrieval
  toolType: ToolType;
  isImageMode?: boolean;
  // These are client-side only and will not be persisted
  uploadedFile?: File | null;
  uploadedFilePreview?: string | null;
  selectedModelId?: string;
  selectedResponseStyleName?: string;
}

export type ToolType = 'premium imagination' | 'long language loops' | 'personalization' | 'nocost imagination' | 'about' | 'code reasoning';

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
  toolType: 'premium imagination' | 'nocost imagination';
  videoUrl?: string;
}

    
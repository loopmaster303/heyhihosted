
import type { Timestamp } from 'firebase/firestore';

export type ChatMessageContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; altText?: string; isGenerated?: boolean; isUploaded?: boolean } };

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | ChatMessageContentPart[];
  timestamp: Date | Timestamp;
  toolType?: ToolType;
}

// Represents a message format compatible with APIs that only accept user/assistant roles
export interface ApiChatMessage {
 id: string;
  role: 'user' | 'assistant';
 content: string | ChatMessageContentPart[];
  toolType?: ToolType;
}

export interface Conversation {
  id:string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date | Timestamp;
  toolType: ToolType;
  isImageMode?: boolean;
  uploadedFile?: File | null;
  uploadedFilePreview?: string | null;
  selectedModelId?: string;
  selectedResponseStyleName?: string;
  // This flag indicates if the full message history has been loaded
  messagesLoaded?: boolean;
}

export type ToolType = 'premium imagination' | 'long language loops' | 'personalization' | 'nocost imagination' | 'about';

export interface TileItem {
  id: ToolType;
  title: string;
  icon?: React.ElementType; 
  description?: string;
}

export type CurrentAppView = 'tiles' | 'chat' | 'replicateImageTool' | 'personalizationTool' | 'nocostImageTool' | 'aboutView';

export interface ImageHistoryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  model: string;
  timestamp: string; // ISO string for easy storage/retrieval
  toolType: 'premium imagination' | 'nocost imagination';
  videoUrl?: string;
}

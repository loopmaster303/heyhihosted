

export type ChatMessageContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; altText?: string; isGenerated?: boolean; isUploaded?: boolean } };

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | ChatMessageContentPart[];
  timestamp: Date;
  toolType?: ToolType;
}

export interface Conversation {
  id:string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  toolType: ToolType;
  isImageMode?: boolean;
  uploadedFile?: File | null;
  uploadedFilePreview?: string | null;
  selectedModelId?: string;
  selectedResponseStyleName?: string;
}

// Updated ToolType names to match new UI
export type ToolType = 'premium imagination' | 'long language loops' | 'personalization';

export interface TileItem {
  id: ToolType;
  title: string; // This will be the "path-like" name e.g., "long.language.loops" or "import/personalization"
  // icon property is no longer used directly on main page tiles, but kept for potential future use or consistency
  icon?: React.ElementType; 
  description?: string;
}

export type CurrentAppView = 'tiles' | 'chat' | 'replicateImageTool' | 'personalizationTool';

export interface ImageHistoryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  model: string;
  timestamp: string; // ISO string for easy storage/retrieval
  toolType: 'premium imagination';
  // Optional field for video URLs
  videoUrl?: string;
}

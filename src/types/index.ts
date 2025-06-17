
export type ChatMessageContentPart = 
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; altText?: string; isGenerated?: boolean; isUploaded?: boolean } };

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | ChatMessageContentPart[]; // Can be simple string or array of parts
  timestamp: Date;
  toolType?: ToolType;
}

export interface Conversation {
  id:string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  toolType: ToolType;
  // State for image generation/upload within a conversation context
  isImageMode?: boolean;
  uploadedFile?: File | null;
  uploadedFilePreview?: string | null;
}

export type ToolType = 'FLUX Kontext' | 'Easy Image Loop' | 'Code a Loop' | 'Long Language Loops';

export interface TileItem {
  id: ToolType;
  title: string;
  icon: React.ElementType;
  description: string;
}

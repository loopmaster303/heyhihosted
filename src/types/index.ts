
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
export type ToolType = 'nocost imagination' | 'premium imagination' | 'long language loops';

export interface TileItem {
  id: ToolType;
  title: string; // This will be the "path-like" name e.g., "long languageloops"
  icon: React.ElementType; // Icon still used in SidebarNav logic if needed, but not on main page
  description?: string;
}

export type CurrentAppView = 'tiles' | 'chat' | 'easyImageLoopTool' | 'gptImageTool' | 'replicateImageTool';

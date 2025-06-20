
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
  isImageMode?: boolean;
  uploadedFile?: File | null;
  uploadedFilePreview?: string | null;
  selectedModelId?: string;
  selectedResponseStyleName?: string;
}

export type ToolType = 'nocost imagination' | 'premium imagination' | 'long language loops';

export interface TileItem {
  id: ToolType;
  title: string;
  icon: React.ElementType; // Icon is still used in SidebarNav
  description?: string; // Description is optional, not used on new main page
}

// Add a type for the view state
export type CurrentAppView = 'tiles' | 'chat' | 'easyImageLoopTool' | 'gptImageTool' | 'replicateImageTool';

    

    
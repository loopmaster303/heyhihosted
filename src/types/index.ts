export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolType?: ToolType; // Optional: To associate with a specific tool context
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  toolType?: ToolType; 
}

export type ToolType = 'FLUX Kontext' | 'Easy Image Loop' | 'Code a Loop' | 'Placeholder Loop';

export interface TileItem {
  id: ToolType;
  title: ToolType;
  icon: React.ElementType;
  description: string;
}

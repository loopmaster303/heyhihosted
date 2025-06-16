
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolType?: ToolType; // Optional: To associate with a specific tool context
}

export interface Conversation {
  id:string; // Unique ID for the conversation
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  toolType: ToolType; // Ensure every conversation has a toolType
}

// Ensure 'Long Language Loops' is a valid ToolType
export type ToolType = 'FLUX Kontext' | 'Easy Image Loop' | 'Code a Loop' | 'Long Language Loops';

export interface TileItem {
  id: ToolType;
  title: string;
  icon: React.ElementType;
  description: string;
}

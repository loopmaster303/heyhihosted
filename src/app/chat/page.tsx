
import { ChatProvider } from '@/components/ChatProvider';
import ChatInterface from '@/components/page/ChatInterface';
import AppHeader from '@/components/page/AppHeader';
import type { TileItem } from '@/types';
import Link from 'next/link';

// Minimal version of tool items for the header navigation
const toolTileItems: TileItem[] = [
    { id: 'long language loops', title: 'chat/conversational/assistance', href: '/chat' },
    { id: 'nocost imagination', title: 'generate/visualize/image-gen/fast', href: '/image-gen/no-cost' },
    { id: 'premium imagination', title: 'generate/visualize/image-gen/raw', href: '/image-gen/raw' },
    { id: 'personalization', title: 'settings/personalization', href: '/settings' },
    { id: 'about', title: 'about/hey.hi/readme', href: '/about' },
];

export default function ChatPage() {
  return (
    <ChatProvider>
       <div className="relative flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <AppHeader toolTileItems={toolTileItems} />
        <main className="flex flex-col flex-grow pt-16">
            <ChatInterface />
        </main>
      </div>
    </ChatProvider>
  );
}

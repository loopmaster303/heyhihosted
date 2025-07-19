
"use client";

import React from 'react';
import dynamic from 'next/dynamic';

import DeleteChatDialog from '@/components/dialogs/DeleteChatDialog';
import EditTitleDialog from '@/components/dialogs/EditTitleDialog';
import AppHeader from '@/components/page/AppHeader';

import { useChat } from '@/components/ChatProvider';
import useLocalStorageState from '@/hooks/useLocalStorageState';

import type { ToolType, TileItem } from '@/types';
import { RefreshCw } from 'lucide-react';
import HomePage from './HomePage';
import { useRouter } from 'next/navigation';

const LoadingSpinner = () => (
    <div className="flex-grow flex items-center justify-center h-full">
      <RefreshCw className="w-8 h-8 animate-spin" />
    </div>
);

// Dynamically import heavy components to improve initial load time
const PersonalizationTool = dynamic(() => import('@/components/tools/PersonalizationTool'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const ReplicateImageTool = dynamic(() => import('@/components/tools/ReplicateImageTool'), {
  loading: () => <LoadingSpinner />,
  ssr: false, 
});

const VisualizingLoopsTool = dynamic(() => import('@/components/tools/VisualizingLoopsTool'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const ChatInterface = dynamic(() => import('@/components/page/ChatInterface'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});


const toolTileItems: TileItem[] = [
  { id: 'long language loops', title: 'chat/conversational/assistance', href: '/chat' },
  { id: 'nocost imagination', title: 'generate/visualize/image-gen/fast', href: '/image-gen/no-cost' },
  { id: 'premium imagination', title: 'generate/visualize/image-gen/raw', href: '/image-gen/raw' },
  { id: 'personalization', title: 'settings/personalization', href: '/settings' },
  { id: 'about', title: 'about/hey.hi/readme', href: '/about' },
];

export default function AppContent() {
  const router = useRouter();
  
  const [userDisplayName, setUserDisplayName] = useLocalStorageState<string>("userDisplayName", "User");
  const [customSystemPrompt, setCustomSystemPrompt] = useLocalStorageState<string>("customSystemPrompt", "");
  const [replicateToolPassword, setReplicateToolPassword] = useLocalStorageState<string>('replicateToolPassword', '');

  const chat = useChat();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const renderContent = () => {
    // This component will be deprecated, but for now, we just render the home page.
    // The actual routing is handled by Next.js file system.
    return <HomePage onSelectTile={(item) => handleNavigation(item.href || '/')} toolTileItems={toolTileItems} />;
  };

  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">

      <main className={`flex flex-col flex-grow`}>
        {renderContent()}
      </main>

      <DeleteChatDialog
        isOpen={chat.isDeleteDialogOpen}
        onOpenChange={chat.cancelDeleteChat}
        onConfirm={chat.confirmDeleteChat}
        onCancel={chat.cancelDeleteChat}
      />
      
      <EditTitleDialog
        isOpen={chat.isEditTitleDialogOpen}
        onOpenChange={chat.cancelEditTitle}
        onConfirm={chat.confirmEditTitle}
        onCancel={chat.cancelEditTitle}
        title={chat.editingTitle}
        setTitle={chat.setEditingTitle}
      />
    </div>
  );
}

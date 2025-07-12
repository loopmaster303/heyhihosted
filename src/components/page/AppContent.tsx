
"use client";

import React from 'react';
import dynamic from 'next/dynamic';

// UI Components
import DeleteChatDialog from '@/components/dialogs/DeleteChatDialog';
import EditTitleDialog from '@/components/dialogs/EditTitleDialog';
import AppHeader from '@/components/page/AppHeader';
import ChatInterface from '@/components/page/ChatInterface';
import HomePage from '@/components/page/HomePage';

// Modular components and hooks
import { useChat } from '@/components/ChatProvider';
import useLocalStorageState from '@/hooks/useLocalStorageState';

// Types & Config
import type { ToolType, TileItem } from '@/types';
import { RefreshCw } from 'lucide-react';

// Dynamically import heavy components
const LoadingSpinner = () => (
    <div className="flex-grow flex items-center justify-center h-full">
      <RefreshCw className="w-8 h-8 animate-spin" />
    </div>
);

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


const toolTileItems: TileItem[] = [
  { id: 'long language loops', title: 'chat/conversational/assistance' },
  { id: 'nocost imagination', title: 'generate/visualize/image-gen/fast' },
  { id: 'premium imagination', title: 'generate/visualize/image-gen/raw' },
  { id: 'personalization', title: 'settings/personalization' },
  { id: 'about', title: 'about/hey.hi/readme' },
];

export default function AppContent() {
  const [activeToolType, setActiveToolType] = useLocalStorageState<ToolType | null>('activeToolType', null);
  
  const [userDisplayName, setUserDisplayName] = useLocalStorageState<string>("userDisplayName", "User");
  const [customSystemPrompt, setCustomSystemPrompt] = useLocalStorageState<string>("customSystemPrompt", "");
  const [replicateToolPassword, setReplicateToolPassword] = useLocalStorageState<string>('replicateToolPassword', '');

  const chat = useChat();

  const handleNavigation = (toolOrView: ToolType | 'home') => {
    if (toolOrView === 'home') {
        setActiveToolType(null);
        chat.selectChat(null); // Deselect any active chat
    } else {
        setActiveToolType(toolOrView);
        if (toolOrView === 'long language loops') {
          // Let the render logic handle showing the chat interface
          // once the conversation is active.
          chat.startNewChat();
        } else {
          // For other tools, deselect any active chat to hide the chat view
          chat.selectChat(null);
        }
    }
  };

  const renderContent = () => {
    // Priority 1: Show loading spinner until Firebase auth is ready.
    if (!chat.isInitialLoadComplete) {
      return <LoadingSpinner />;
    }

    // Priority 2: If there's an active conversation, ALWAYS show the chat interface.
    // This also implicitly handles the 'long language loops' tool.
    if (chat.activeConversation) {
        return <ChatInterface />;
    }

    // Priority 3: If no active conversation, show the selected tool.
    switch (activeToolType) {
      case 'nocost imagination':
        return <VisualizingLoopsTool />;
      case 'premium imagination':
        return <ReplicateImageTool password={replicateToolPassword} />;
      case 'personalization':
        return (
          <PersonalizationTool
            userDisplayName={userDisplayName}
            setUserDisplayName={setUserDisplayName}
            customSystemPrompt={customSystemPrompt}
            setCustomSystemPrompt={setCustomSystemPrompt}
            replicateToolPassword={replicateToolPassword}
            setReplicateToolPassword={setReplicateToolPassword}
          />
        );
      case 'about':
        return (
          <div className="flex flex-col h-full items-center justify-center p-4 text-center">
            <h2 className="text-3xl font-code text-foreground">about/hey.hi/readme</h2>
            <p className="text-muted-foreground mt-4 max-w-md">
              This section is under construction. Come back soon to learn more about the project!
            </p>
          </div>
        );
      // Fallback: If no tool is active and no chat is active, show the home page.
      default:
        return <HomePage onSelectTile={handleNavigation} toolTileItems={toolTileItems} />;
    }
  };

  // The header should be shown for any view that is NOT the home page.
  // This is true if a tool is selected OR a chat is active.
  const shouldShowHeader = activeToolType !== null || chat.activeConversation !== null;

  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">

      {shouldShowHeader && (
        <AppHeader
          toolTileItems={toolTileItems}
          onNavigate={handleNavigation}
          userDisplayName={userDisplayName}
        />
      )}

      <main className={`flex flex-col flex-grow ${shouldShowHeader ? 'pt-16' : ''}`}>
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

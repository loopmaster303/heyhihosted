
"use client";

import React from 'react';
import dynamic from 'next/dynamic';

import DeleteChatDialog from '@/components/dialogs/DeleteChatDialog';
import EditTitleDialog from '@/components/dialogs/EditTitleDialog';
import AppHeader from '@/components/page/AppHeader';
import HomePage from '@/components/page/HomePage';


import { useChat } from '@/components/ChatProvider';
import useLocalStorageState from '@/hooks/useLocalStorageState';

import type { ToolType, TileItem } from '@/types';
import { RefreshCw } from 'lucide-react';

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
  { id: 'long language loops', title: 'chat/conversational/assistance' },
  { id: 'nocost imagination', title: 'generate/visualize/image-gen/fast' },
  { id: 'premium imagination', title: 'generate/visualize/image-gen/raw' },
  { id: 'personalization', title: 'settings/personalization' },
  { id: 'about', title: 'about/hey.hi/readme' },
];

export default function AppContent() {
  const [activeTool, setActiveTool] = useLocalStorageState<ToolType | null>('activeTool', null);
  
  const [userDisplayName, setUserDisplayName] = useLocalStorageState<string>("userDisplayName", "User");
  const [customSystemPrompt, setCustomSystemPrompt] = useLocalStorageState<string>("customSystemPrompt", "");
  const [replicateToolPassword, setReplicateToolPassword] = useLocalStorageState<string>('replicateToolPassword', '');

  const chat = useChat();

  const handleNavigation = async (toolOrView: ToolType | 'home') => {
    if (toolOrView === 'home') {
        setActiveTool(null);
        chat.selectChat(null); 
    } else if (toolOrView === 'long language loops') {
        setActiveTool(null); // The chat view is controlled by activeConversation, not a tool state.
        const newChat = await chat.startNewChat();
        if (newChat) {
            chat.setActiveConversation(newChat);
        }
    } else {
        chat.selectChat(null); // Deselect chat when switching to a non-chat tool
        setActiveTool(toolOrView);
    }
  };

  const renderContent = () => {
    // Show a global spinner only during the absolute initial auth check
    if (!chat.isInitialLoadComplete) {
      return <LoadingSpinner />;
    }

    // Once auth is checked, render the appropriate view
    if (chat.activeConversation) {
        return <ChatInterface />;
    }

    switch (activeTool) {
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
      default:
        return <HomePage onSelectTile={handleNavigation} toolTileItems={toolTileItems} />;
    }
  };

  const shouldShowHeader = activeTool !== null || chat.activeConversation !== null;

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

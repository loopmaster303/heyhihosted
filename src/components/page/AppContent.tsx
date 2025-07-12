
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

// UI Components
import PersonalizationTool from '@/components/tools/PersonalizationTool';
import DeleteChatDialog from '@/components/dialogs/DeleteChatDialog';
import EditTitleDialog from '@/components/dialogs/EditTitleDialog';
import AppHeader from '@/components/page/AppHeader';
import ChatInterface from '@/components/page/ChatInterface';
import HomePage from '@/components/page/HomePage';

// Modular components and hooks
import { useChat } from '@/components/ChatProvider';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { auth } from '@/lib/firebase';
import { type User } from 'firebase/auth';

// Types & Config
import type { ToolType, CurrentAppView, TileItem } from '@/types';
import { RefreshCw } from 'lucide-react';

// Dynamically import heavy components
const LoadingSpinner = () => (
    <div className="flex-grow flex items-center justify-center h-full">
      <RefreshCw className="w-8 h-8 animate-spin" />
    </div>
);

const ReplicateImageTool = dynamic(() => import('@/components/tools/ReplicateImageTool'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // These tools are client-side only
});

const VisualizingLoopsTool = dynamic(() => import('@/components/tools/VisualizingLoopsTool'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // These tools are client-side only
});


const toolTileItems: TileItem[] = [
  { id: 'long language loops', title: 'chat/conversational/assistance' },
  { id: 'nocost imagination', title: 'generate/visualize/image-gen/fast' },
  { id: 'premium imagination', title: 'generate/visualize/image-gen/raw' },
  { id: 'personalization', title: 'settings/personalization' },
  { id: 'about', title: 'about/hey.hi/readme' },
];


export default function AppContent() {
  const [currentView, setCurrentView] = useState<CurrentAppView>('tiles');
  const [activeToolTypeForView, setActiveToolTypeForView] = useLocalStorageState<ToolType | null>('activeToolTypeForView', null);
  
  const [userDisplayName, setUserDisplayName] = useLocalStorageState<string>("userDisplayName", "User");
  const [customSystemPrompt, setCustomSystemPrompt] = useLocalStorageState<string>("customSystemPrompt", "");
  const [replicateToolPassword, setReplicateToolPassword] = useLocalStorageState<string>('replicateToolPassword', '');

  const chat = useChat();

  // This effect synchronizes the app view based on chat state or persisted tool type
  useEffect(() => {
    if (!chat.isInitialLoadComplete) return;

    if (chat.activeConversation) {
      setCurrentView('chat');
    } else if (activeToolTypeForView && getViewForTool(activeToolTypeForView) !== 'chat') {
      setCurrentView(getViewForTool(activeToolTypeForView));
    } else {
      setCurrentView('tiles');
    }
  }, [chat.activeConversation, activeToolTypeForView, chat.isInitialLoadComplete]);

  const getViewForTool = (toolType: ToolType): CurrentAppView => {
    switch(toolType) {
        case 'long language loops': return 'chat';
        case 'nocost imagination': return 'nocostImageTool';
        case 'premium imagination': return 'replicateImageTool';
        case 'personalization': return 'personalizationTool';
        case 'about': return 'aboutView';
        default: return 'tiles';
    }
  };
  
  const handleSelectTile = useCallback((toolType: ToolType) => {
    const previousActiveConv = chat.activeConversation;
    if (previousActiveConv && previousActiveConv.toolType === 'long language loops' && !previousActiveConv.messages.some(msg => msg.role === 'user' || msg.role === 'assistant')) {
        chat.deleteChat(previousActiveConv.id, true); // silent delete
    }
    
    setActiveToolTypeForView(toolType);

    if (toolType === 'long language loops') {
      const latestChat = chat.allConversations.find(c => c.toolType === 'long language loops' && c.messages.length > 0);
      if (latestChat) {
        chat.selectChat(latestChat.id);
      } else {
        chat.startNewChat();
      }
    } else {
        chat.selectChat(null);
        setCurrentView(getViewForTool(toolType));
    }
  }, [chat, setActiveToolTypeForView]);


  const handleNavigation = (toolOrView: ToolType | 'home') => {
    const previousActiveConv = chat.activeConversation;
    if (previousActiveConv && previousActiveConv.toolType === 'long language loops' && !previousActiveConv.messages.some(msg => msg.role === 'user' || msg.role === 'assistant')) {
        chat.deleteChat(previousActiveConv.id, true);
    }

    if (toolOrView === 'home') {
        setActiveToolTypeForView(null);
        setCurrentView('tiles');
        chat.selectChat(null);
    } else {
        handleSelectTile(toolOrView);
    }
  };

  const renderContent = () => {
    // This is the main loading condition for the entire app.
    // We wait until Firebase has identified a user (anonymous or otherwise).
    if (!chat.currentUser) {
        return <LoadingSpinner />;
    }
    
    // Once we have a user, we check the view state.
    // If there's an active conversation, we always show the chat interface.
    if (chat.activeConversation) {
        return <ChatInterface />;
    }

    // If no active conversation, decide based on currentView state
    switch (currentView) {
      case 'nocostImageTool':
        return <VisualizingLoopsTool />;
      case 'replicateImageTool':
        return (
          <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto">
              <ReplicateImageTool password={replicateToolPassword} />
            </div>
          </div>
        );
      case 'personalizationTool':
        return (
          <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto">
              <PersonalizationTool
                userDisplayName={userDisplayName}
                setUserDisplayName={setUserDisplayName}
                customSystemPrompt={customSystemPrompt}
                setCustomSystemPrompt={setCustomSystemPrompt}
                replicateToolPassword={replicateToolPassword}
                setReplicateToolPassword={setReplicateToolPassword}
              />
            </div>
          </div>
        );
      case 'aboutView':
        return (
          <div className="flex flex-col h-full items-center justify-center p-4 text-center">
            <h2 className="text-3xl font-code text-foreground">about/hey.hi/readme</h2>
            <p className="text-muted-foreground mt-4 max-w-md">
              This section is under construction. Come back soon to learn more about the project!
            </p>
          </div>
        );
      default: // 'tiles' or 'chat' when activeConversation is null
        return <HomePage onSelectTile={handleSelectTile} toolTileItems={toolTileItems} />;
    }
  };

  const shouldShowHeader = currentView !== 'tiles' || !!chat.activeConversation;

  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">

      {shouldShowHeader && (
        <AppHeader
          toolTileItems={toolTileItems}
          onNavigate={handleNavigation}
          userDisplayName={userDisplayName}
        />
      )}

      <div className={`flex flex-col h-full ${shouldShowHeader ? 'pt-16' : ''}`}>
        {renderContent()}
      </div>

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

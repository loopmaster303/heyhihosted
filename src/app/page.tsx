
"use client";

import React, { useState, useEffect, useCallback } from 'react';

// UI Components
import ReplicateImageTool from '@/components/tools/ReplicateImageTool';
import PersonalizationTool from '@/components/tools/PersonalizationTool';
import VisualizingLoopsTool from '@/components/tools/VisualizingLoopsTool';
import DeleteChatDialog from '@/components/dialogs/DeleteChatDialog';
import EditTitleDialog from '@/components/dialogs/EditTitleDialog';
import AppHeader from '@/components/page/AppHeader';
import ChatInterface from '@/components/page/ChatInterface';

// Modular components and hooks
import { useChat } from '@/hooks/useChat';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import HomePage from '@/components/page/HomePage';

// Types & Config
import type { ToolType, CurrentAppView, TileItem } from '@/types';
import { RefreshCw } from 'lucide-react';

const toolTileItems: TileItem[] = [
  { id: 'long language loops', title: 'chat/conversational/assistance' },
  { id: 'nocost imagination', title: 'generate/visualize/image-gen/fast' },
  { id: 'premium imagination', title: 'generate/visualize/image-gen/raw' },
  { id: 'personalization', title: 'settings/personalization' },
  { id: 'about', title: 'about/hey.hi/readme' },
];

const ACTIVE_TOOL_TYPE_KEY = 'activeToolTypeForView';
const ACTIVE_CONVERSATION_ID_KEY = 'activeConversationId';


export default function Home() {
  const [currentView, setCurrentView] = useState<CurrentAppView>('tiles');
  const [activeToolTypeForView, setActiveToolTypeForView] = useState<ToolType | null>(null);
  
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [userDisplayName, setUserDisplayName] = useLocalStorageState<string>("userDisplayName", "User");
  const [customSystemPrompt, setCustomSystemPrompt] = useLocalStorageState<string>("customSystemPrompt", "");
  const [replicateToolPassword, setReplicateToolPassword] = useLocalStorageState<string>('replicateToolPassword', '');


  const chat = useChat({
    userDisplayName,
    customSystemPrompt,
    onConversationStarted: () => {
      setCurrentView('chat');
    }
  });

  const getViewForTool = (toolType: ToolType): CurrentAppView => {
    switch(toolType) {
        case 'long language loops': return 'chat';
        case 'nocost imagination': return 'nocostImageTool';
        case 'premium imagination': return 'replicateImageTool';
        case 'personalization': return 'personalizationTool';
        case 'about': return 'aboutView';
        default: return 'chat';
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
  }, [chat]);


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


  useEffect(() => {
    let loadedConversations: any = null;
    try {
        const storedConversations = localStorage.getItem('chatConversations');
        if (storedConversations) {
            loadedConversations = JSON.parse(storedConversations);
        }
    } catch (error) {
        console.error("Failed to parse conversations from localStorage.", error);
        localStorage.removeItem('chatConversations');
    }

    const loadedConvsList = chat.loadConversations(loadedConversations);

    const storedActiveToolType = localStorage.getItem(ACTIVE_TOOL_TYPE_KEY) as ToolType | null;
    const storedActiveConvId = localStorage.getItem(ACTIVE_CONVERSATION_ID_KEY);
    
    if (storedActiveToolType && toolTileItems.some(item => item.id === storedActiveToolType)) {
      setActiveToolTypeForView(storedActiveToolType);
      if (storedActiveToolType === 'long language loops') {
        const convToLoad = loadedConvsList.find(c => c.id === storedActiveConvId);
        if (convToLoad) {
            chat.selectChat(convToLoad.id);
        } else {
            const latestChat = loadedConvsList.find(c => c.toolType === 'long language loops');
            if(latestChat) {
              chat.selectChat(latestChat.id);
            } else {
              setCurrentView('tiles');
              setActiveToolTypeForView(null);
            }
        }
      } else {
          setCurrentView(getViewForTool(storedActiveToolType));
          chat.selectChat(null);
      }
    } else {
        setCurrentView('tiles');
    }

    setIsInitialLoadComplete(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


  useEffect(() => {
    if (isInitialLoadComplete) {
      if (activeToolTypeForView) {
        localStorage.setItem(ACTIVE_TOOL_TYPE_KEY, activeToolTypeForView);
      } else {
        localStorage.removeItem(ACTIVE_TOOL_TYPE_KEY);
      }
      if (currentView === 'chat' && chat.activeConversation) {
        localStorage.setItem(ACTIVE_CONVERSATION_ID_KEY, chat.activeConversation.id);
      } else {
        localStorage.removeItem(ACTIVE_CONVERSATION_ID_KEY);
      }
    }
  }, [activeToolTypeForView, chat.activeConversation, currentView, isInitialLoadComplete]);


  const renderContent = () => {
    if (!isInitialLoadComplete) {
        return <div className="flex-grow flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin" /></div>;
    }

    switch (currentView) {
      case 'chat':
        if (!chat.activeConversation) return null;
        return <ChatInterface chat={chat} />;
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
      default: // 'tiles'
        return <HomePage onSelectTile={handleSelectTile} toolTileItems={toolTileItems} />;
    }
  };

  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">

      {currentView !== 'tiles' && (
        <AppHeader
          toolTileItems={toolTileItems}
          onNavigate={handleNavigation}
          userDisplayName={userDisplayName}
        />
      )}

      <div className={`flex flex-col h-full ${currentView !== 'tiles' ? 'pt-16' : ''}`}>
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

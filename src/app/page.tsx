"use client";

import React, { useState, useEffect, useCallback } from 'react';

// UI Components
import ChatView from '@/components/chat/ChatView';
import ChatInput from '@/components/chat/ChatInput';
import ReplicateImageTool from '@/components/tools/ReplicateImageTool';
import PersonalizationTool from '@/components/tools/PersonalizationTool';
import VisualizingLoopsTool from '@/components/tools/VisualizingLoopsTool';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Check, X, RefreshCw } from 'lucide-react';
import AppHeader from '@/components/page/AppHeader';

// Modular components and hooks
import { useChat } from '@/hooks/useChat';
import HomePage from '@/components/page/HomePage';
import ChatControls from '@/components/page/ChatControls';
import HistoryPanel from '@/components/chat/HistoryPanel';

// Types & Config
import type { ToolType, CurrentAppView, TileItem } from '@/types';
import { DEFAULT_POLLINATIONS_MODEL_ID, DEFAULT_RESPONSE_STYLE_NAME } from '@/config/chat-options';

const toolTileItems: TileItem[] = [
  { id: 'long language loops', title: 'chat/assistance' },
  { id: 'nocost imagination', title: 'gen/images/free' },
  { id: 'premium imagination', title: 'gen/images/premium' },
  { id: 'personalization', title: 'settings' },
];

const PERSONALIZATION_SETTINGS_KEY = 'personalizationSettings';
const ACTIVE_TOOL_TYPE_KEY = 'activeToolTypeForView';
const ACTIVE_CONVERSATION_ID_KEY = 'activeConversationId';


export default function Home() {
  const [currentView, setCurrentView] = useState<CurrentAppView>('tiles');
  const [activeToolTypeForView, setActiveToolTypeForView] = useState<ToolType | null>(null);
  
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState<string>("User");
  const [customSystemPrompt, setCustomSystemPrompt] = useState<string>("");

  const chat = useChat({
    userDisplayName,
    customSystemPrompt,
    onConversationStarted: () => {
      setCurrentView('chat');
    }
  });

  const savePersonalizationSettings = useCallback(() => {
    const settings = { userDisplayName, customSystemPrompt };
    localStorage.setItem(PERSONALIZATION_SETTINGS_KEY, JSON.stringify(settings));
  }, [userDisplayName, customSystemPrompt]);

  const getViewForTool = (toolType: ToolType): CurrentAppView => {
    switch(toolType) {
        case 'long language loops': return 'chat';
        case 'nocost imagination': return 'nocostImageTool';
        case 'premium imagination': return 'replicateImageTool';
        case 'personalization': return 'personalizationTool';
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

    try {
        const storedPersonalization = localStorage.getItem(PERSONALIZATION_SETTINGS_KEY);
        if (storedPersonalization) {
            const settings = JSON.parse(storedPersonalization);
            if (settings.userDisplayName) setUserDisplayName(settings.userDisplayName);
            if (settings.customSystemPrompt) setCustomSystemPrompt(settings.customSystemPrompt);
        }
    } catch (error) {
        console.error("Failed to parse personalization settings.", error);
        localStorage.removeItem(PERSONALIZATION_SETTINGS_KEY);
    }

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


  useEffect(() => {
    if (isInitialLoadComplete) { 
        savePersonalizationSettings();
    }
  }, [userDisplayName, customSystemPrompt, isInitialLoadComplete, savePersonalizationSettings]);

  const renderContent = () => {
    if (!isInitialLoadComplete) {
        return <div className="flex-grow flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin" /></div>;
    }

    switch (currentView) {
      case 'chat':
        if (!chat.activeConversation) return null;
        return (
          <div className="flex flex-col h-full">
            <ChatView
              conversation={chat.activeConversation}
              messages={chat.currentMessages}
              isLoading={chat.isAiResponding}
              className="flex-grow overflow-y-auto px-4 w-full max-w-4xl mx-auto pt-2 pb-4"
            />
            <div className="px-4 pt-2 pb-4 shrink-0">
              {chat.activeConversation.uploadedFilePreview && (
                  <div className="max-w-3xl mx-auto p-2 relative w-fit self-center">
                  <img src={chat.activeConversation.uploadedFilePreview} alt="Uploaded preview" width={80} height={80} style={{ objectFit: "cover" }} className="rounded-md" />
                  <button type="button" className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 flex items-center justify-center" onClick={chat.clearUploadedImage} aria-label="Clear uploaded image">
                      <X className="w-4 h-4" />
                  </button>
                  </div>
              )}
              <ChatInput
                onSendMessage={chat.sendMessage}
                isLoading={chat.isAiResponding}
                isImageModeActive={chat.isImageMode}
                onToggleImageMode={chat.toggleImageMode}
                uploadedFilePreviewUrl={chat.activeConversation.uploadedFilePreview}
                onFileSelect={chat.handleFileSelect}
                isLongLanguageLoopActive={true} 
                selectedModelId={chat.activeConversation.selectedModelId || DEFAULT_POLLINATIONS_MODEL_ID}
                selectedResponseStyleName={chat.activeConversation.selectedResponseStyleName || DEFAULT_RESPONSE_STYLE_NAME}
                onModelChange={chat.handleModelChange}
                onStyleChange={chat.handleStyleChange}
              />
               <ChatControls
                    conversation={chat.activeConversation}
                    onNewChat={chat.startNewChat}
                    onRequestEditTitle={chat.requestEditTitle}
                    onRequestDeleteChat={chat.requestDeleteChat}
                    onToggleHistory={chat.toggleHistoryPanel}
                />
            </div>
          </div>
        );
      case 'nocostImageTool':
        return <VisualizingLoopsTool />;
      case 'replicateImageTool':
      case 'personalizationTool':
        return (
            <div className="flex flex-col h-full">
                <div className="flex-grow overflow-y-auto">
                    {currentView === 'replicateImageTool' && <ReplicateImageTool />}
                    {currentView === 'personalizationTool' && (
                        <PersonalizationTool
                            userDisplayName={userDisplayName}
                            setUserDisplayName={setUserDisplayName}
                            customSystemPrompt={customSystemPrompt}
                            setCustomSystemPrompt={setCustomSystemPrompt}
                            onSave={savePersonalizationSettings}
                        />
                    )}
                </div>
            </div>
        );
      default: // 'tiles'
        return <HomePage onSelectTile={handleSelectTile} toolTileItems={toolTileItems} />;
    }
  };

  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">

      {currentView !== 'tiles' && (
        <AppHeader toolTileItems={toolTileItems} onNavigate={handleNavigation} />
      )}

      <div className={`flex flex-col h-full ${currentView !== 'tiles' ? 'pt-16' : ''}`}>
        {renderContent()}
      </div>

      {chat.isHistoryPanelOpen && currentView === 'chat' && (
        <HistoryPanel
          allConversations={chat.allConversations}
          activeConversation={chat.activeConversation}
          onSelectChat={chat.selectChat}
          onClose={chat.closeHistoryPanel}
        />
      )}

      {chat.isDeleteDialogOpen && (
        <AlertDialog open={chat.isDeleteDialogOpen} onOpenChange={chat.cancelDeleteChat}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this chat.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel onClick={chat.cancelDeleteChat}>Cancel</AlertDialogCancel><AlertDialogAction onClick={chat.confirmDeleteChat}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {chat.isEditTitleDialogOpen && (
        <AlertDialog open={chat.isEditTitleDialogOpen} onOpenChange={chat.cancelEditTitle}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Edit Chat Title</AlertDialogTitle><AlertDialogDescription>Enter a new title for this chat.</AlertDialogDescription></AlertDialogHeader>
            <Input value={chat.editingTitle} onChange={(e) => chat.setEditingTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') chat.confirmEditTitle(); }} placeholder="New chat title" autoFocus />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={chat.cancelEditTitle}><X className="h-4 w-4 mr-2" />Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={chat.confirmEditTitle}><Check className="h-4 w-4 mr-2" />Save</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

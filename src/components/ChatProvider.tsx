
"use client";

import React, { useContext, createContext } from 'react';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useChatLogic } from '@/hooks/useChat';

type ChatContextType = ReturnType<typeof useChatLogic>;

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [userDisplayName] = useLocalStorageState<string>("userDisplayName", "User");
    const [customSystemPrompt] = useLocalStorageState<string>("customSystemPrompt", "");
    
    const chat = useChatLogic({ userDisplayName, customSystemPrompt });
    
    return (
        <ChatContext.Provider value={chat}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

    
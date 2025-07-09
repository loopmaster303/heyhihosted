"use client";

import React, { useContext, createContext } from 'react';
import { useChatLogic, type UseChatLogicProps } from '@/hooks/useChat';

type ChatContextType = ReturnType<typeof useChatLogic>;

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<UseChatLogicProps & { children: React.ReactNode }> = ({ children, ...props }) => {
    const chat = useChatLogic(props);
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

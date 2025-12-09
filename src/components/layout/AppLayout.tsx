"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import AppSidebar from './AppSidebar';
import useLocalStorageState from '@/hooks/useLocalStorageState';

interface AppLayoutProps {
  children: React.ReactNode;
  onNewChat?: () => void;
  onNewImage?: () => void;
  chatHistory?: any[];
  imageHistory?: any[];
  onSelectChat?: (id: string) => void;
  onSelectImage?: (item: any) => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  onNewChat,
  onNewImage,
  chatHistory = [],
  imageHistory = [],
  onSelectChat,
  onSelectImage
}) => {
  const [sidebarExpanded, setSidebarExpanded] = useLocalStorageState<boolean>('sidebarExpanded', true);

  return (
    <div
      className="relative flex flex-col h-screen bg-background text-foreground"
      onClick={() => setSidebarExpanded(false)}
    >
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          onNewChat={onNewChat}
          onNewImage={onNewImage}
        />
        <main className={cn(
          "flex-1 overflow-y-auto transition-all duration-300 relative bg-background"
        )}>
          <div className="mx-auto max-w-5xl h-full flex flex-col relative w-full shadow-sm bg-background">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

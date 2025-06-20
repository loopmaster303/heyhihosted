
"use client";

import type React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react'; 
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

interface ToolViewHeaderProps {
  title: string;
  onGoBack: () => void;
  isLoading?: boolean; 
}

const ToolViewHeader: React.FC<ToolViewHeaderProps> = ({ title, onGoBack, isLoading }) => {
  const { isMobile } = useSidebar();
  return (
    <header className="p-4 flex items-center justify-between bg-card sticky top-0 z-10 flex-shrink-0">
      <div className="flex items-center gap-1">
        {!isMobile && <SidebarTrigger />}
        <Button variant="ghost" size="icon" onClick={onGoBack} aria-label="Go back to tools menu">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-semibold text-card-foreground truncate">
          {title}
        </h2>
      </div>
      <div className="w-8 flex-shrink-0">
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
      </div>
    </header>
  );
};

export default ToolViewHeader;

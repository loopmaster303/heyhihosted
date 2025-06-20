
"use client";

import type React from 'react';
// Button and ArrowLeft removed as back navigation is now via sidebar logo
import { Loader2 } from 'lucide-react'; 
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

interface ToolViewHeaderProps {
  title: string;
  onGoBack?: () => void; // Kept optional for flexibility, but not used for back arrow
  isLoading?: boolean; 
}

const ToolViewHeader: React.FC<ToolViewHeaderProps> = ({ title, isLoading }) => {
  const { isMobile } = useSidebar();
  return (
    <header className="p-4 flex items-center justify-between bg-transparent sticky top-0 z-10 flex-shrink-0 border-b-0"> {/* bg-card and border-b removed */}
      <div className="flex items-center gap-1">
        {!isMobile && <SidebarTrigger className="text-foreground/70 hover:text-foreground" />}
        {/* Back button removed */}
      </div>
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-code font-semibold text-foreground truncate"> {/* text-card-foreground to text-foreground, font-code added */}
          {title}
        </h2>
      </div>
      <div className="w-8 flex-shrink-0"> {/* Spacer for loading icon */}
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
      </div>
    </header>
  );
};

export default ToolViewHeader;

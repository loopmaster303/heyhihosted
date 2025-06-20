
"use client";

import type React from 'react';
import { Loader2 } from 'lucide-react'; 
import { useSidebar } from '@/components/ui/sidebar'; // SidebarTrigger removed

interface ToolViewHeaderProps {
  title: string;
  onGoBack?: () => void; 
  isLoading?: boolean; 
  toolsTrigger?: React.ReactNode; // For the new (tools) dropdown
}

const ToolViewHeader: React.FC<ToolViewHeaderProps> = ({ title, isLoading, toolsTrigger }) => {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <header className="p-4 flex items-center justify-between bg-transparent sticky top-0 z-10 flex-shrink-0 border-b-0">
      <div className="flex items-center gap-1">
        {toolsTrigger}
        {isMobile && !toolsTrigger && ( /* Fallback for mobile sidebar if no (tools) passed */
            <button onClick={() => setOpenMobile(true)} className="text-foreground/70 hover:text-foreground p-1">
                {/* Could use a generic menu icon here if needed */}
            </button>
        )}
      </div>
      <div className="flex flex-col items-center">
        <h2 className="text-lg font-code font-semibold text-foreground truncate">
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

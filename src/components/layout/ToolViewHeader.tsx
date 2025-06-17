
"use client";

import type React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react'; // Loader2 might not be needed here unless tool has global loading state

interface ToolViewHeaderProps {
  title: string;
  onGoBack: () => void;
  isLoading?: boolean; // Optional loading state for the tool
}

const ToolViewHeader: React.FC<ToolViewHeaderProps> = ({ title, onGoBack, isLoading }) => {
  return (
    <header className="p-4 flex items-center justify-between bg-card sticky top-0 z-10 flex-shrink-0">
      <Button variant="ghost" size="icon" onClick={onGoBack} aria-label="Go back to tools menu">
        <ArrowLeft className="h-5 w-5" />
      </Button>
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
